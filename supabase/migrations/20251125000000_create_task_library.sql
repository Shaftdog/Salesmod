-- Create Task Library System
-- Migration: 20251125000000_create_task_library.sql
-- Purpose: Central repository of reusable task definitions with live linking to templates

-- ============================================================================
-- 1. TASK_LIBRARY: Central repository of reusable task definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE'
  )),
  title TEXT NOT NULL,
  description TEXT,
  default_role TEXT NOT NULL DEFAULT 'appraiser' CHECK (default_role IN ('appraiser', 'reviewer', 'admin', 'trainee')),
  estimated_minutes INTEGER DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_library_org ON task_library(org_id);
CREATE INDEX IF NOT EXISTS idx_task_library_org_stage ON task_library(org_id, stage, sort_order);
CREATE INDEX IF NOT EXISTS idx_task_library_active ON task_library(org_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 2. TASK_LIBRARY_SUBTASKS: Subtasks belonging to library tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_library_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_task_id UUID NOT NULL REFERENCES task_library(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  default_role TEXT NOT NULL DEFAULT 'appraiser' CHECK (default_role IN ('appraiser', 'reviewer', 'admin', 'trainee')),
  estimated_minutes INTEGER DEFAULT 15,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_library_subtasks_parent ON task_library_subtasks(library_task_id, sort_order);

-- ============================================================================
-- 3. TEMPLATE_LIBRARY_TASKS: Junction table linking templates to library tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS template_library_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES production_templates(id) ON DELETE CASCADE,
  library_task_id UUID NOT NULL REFERENCES task_library(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  override_estimated_minutes INTEGER,  -- Optional per-template override
  override_is_required BOOLEAN,        -- Optional per-template override
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_template_library_task UNIQUE(template_id, library_task_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_library_tasks_template ON template_library_tasks(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_template_library_tasks_library ON template_library_tasks(library_task_id);

-- ============================================================================
-- 4. ADD LIBRARY_TASK_ID TO PRODUCTION_TEMPLATE_TASKS (for existing task linking)
-- ============================================================================
ALTER TABLE production_template_tasks
ADD COLUMN IF NOT EXISTS library_task_id UUID REFERENCES task_library(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_production_template_tasks_library ON production_template_tasks(library_task_id) WHERE library_task_id IS NOT NULL;

-- ============================================================================
-- 5. VIEW: template_tasks_resolved - Resolves library task values with overrides
-- ============================================================================
CREATE OR REPLACE VIEW template_tasks_resolved AS
SELECT
  tlt.id,
  tlt.template_id,
  tlt.library_task_id,
  tl.stage,
  tl.title,
  tl.description,
  tl.default_role,
  COALESCE(tlt.override_estimated_minutes, tl.estimated_minutes) as estimated_minutes,
  COALESCE(tlt.override_is_required, tl.is_required) as is_required,
  tlt.sort_order,
  tl.is_active,
  tl.created_at as library_task_created_at,
  tl.updated_at as library_task_updated_at
FROM template_library_tasks tlt
JOIN task_library tl ON tl.id = tlt.library_task_id
WHERE tl.is_active = true;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE task_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_library_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_library_tasks ENABLE ROW LEVEL SECURITY;

-- Task Library: org-scoped access
CREATE POLICY task_library_org_isolation ON task_library
  FOR ALL USING (org_id = auth.uid());

-- Task Library Subtasks: access via parent library task
CREATE POLICY task_library_subtasks_via_task ON task_library_subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM task_library
      WHERE task_library.id = task_library_subtasks.library_task_id
        AND task_library.org_id = auth.uid()
    )
  );

-- Template Library Tasks: access via parent template or library task
CREATE POLICY template_library_tasks_via_template ON template_library_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_templates
      WHERE production_templates.id = template_library_tasks.template_id
        AND production_templates.org_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Updated_at trigger for task_library
CREATE TRIGGER trigger_task_library_updated_at
  BEFORE UPDATE ON task_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for task_library_subtasks
CREATE TRIGGER trigger_task_library_subtasks_updated_at
  BEFORE UPDATE ON task_library_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. FUNCTION: Generate stage tasks from library
-- ============================================================================

-- Update the generate_stage_tasks function to support library tasks
CREATE OR REPLACE FUNCTION generate_stage_tasks(
  p_card_id UUID,
  p_stage TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_card production_cards%ROWTYPE;
  v_template_task RECORD;
  v_template_subtask RECORD;
  v_library_task RECORD;
  v_library_subtask RECORD;
  v_new_task_id UUID;
  v_tasks_created INTEGER := 0;
BEGIN
  -- Get card
  SELECT * INTO v_card
  FROM production_cards
  WHERE id = p_card_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Check if stage already processed (prevent duplicates)
  IF p_stage = ANY(v_card.processed_stages) THEN
    RETURN 0;  -- Already processed, don't create duplicates
  END IF;

  -- FIRST: Create tasks from direct template tasks (non-library linked)
  FOR v_template_task IN
    SELECT * FROM production_template_tasks
    WHERE template_id = v_card.template_id
      AND stage = p_stage
      AND library_task_id IS NULL  -- Only non-library tasks
    ORDER BY sort_order
  LOOP
    -- Create parent task
    INSERT INTO production_tasks (
      production_card_id, template_task_id, title, description,
      stage, role, estimated_minutes, is_required, sort_order
    ) VALUES (
      p_card_id, v_template_task.id, v_template_task.title, v_template_task.description,
      p_stage, v_template_task.default_role, v_template_task.estimated_minutes,
      v_template_task.is_required, v_template_task.sort_order
    ) RETURNING id INTO v_new_task_id;

    v_tasks_created := v_tasks_created + 1;

    -- Create subtasks from template
    FOR v_template_subtask IN
      SELECT * FROM production_template_subtasks
      WHERE parent_task_id = v_template_task.id
      ORDER BY sort_order
    LOOP
      INSERT INTO production_tasks (
        production_card_id, template_task_id, parent_task_id,
        title, description, stage, role, estimated_minutes,
        is_required, sort_order
      ) VALUES (
        p_card_id, NULL, v_new_task_id,
        v_template_subtask.title, v_template_subtask.description,
        p_stage, v_template_subtask.default_role, v_template_subtask.estimated_minutes,
        v_template_subtask.is_required, v_template_subtask.sort_order
      );
    END LOOP;
  END LOOP;

  -- SECOND: Create tasks from library-linked template tasks
  FOR v_template_task IN
    SELECT ptt.*, tl.title as lib_title, tl.description as lib_description,
           tl.default_role as lib_role, tl.estimated_minutes as lib_minutes,
           tl.is_required as lib_required
    FROM production_template_tasks ptt
    JOIN task_library tl ON tl.id = ptt.library_task_id
    WHERE ptt.template_id = v_card.template_id
      AND ptt.stage = p_stage
      AND ptt.library_task_id IS NOT NULL
      AND tl.is_active = true
    ORDER BY ptt.sort_order
  LOOP
    -- Create parent task using library values
    INSERT INTO production_tasks (
      production_card_id, template_task_id, title, description,
      stage, role, estimated_minutes, is_required, sort_order
    ) VALUES (
      p_card_id, v_template_task.id, v_template_task.lib_title, v_template_task.lib_description,
      p_stage, v_template_task.lib_role, v_template_task.lib_minutes,
      v_template_task.lib_required, v_template_task.sort_order
    ) RETURNING id INTO v_new_task_id;

    v_tasks_created := v_tasks_created + 1;

    -- Create subtasks from library
    FOR v_library_subtask IN
      SELECT * FROM task_library_subtasks
      WHERE library_task_id = v_template_task.library_task_id
      ORDER BY sort_order
    LOOP
      INSERT INTO production_tasks (
        production_card_id, template_task_id, parent_task_id,
        title, description, stage, role, estimated_minutes,
        is_required, sort_order
      ) VALUES (
        p_card_id, NULL, v_new_task_id,
        v_library_subtask.title, v_library_subtask.description,
        p_stage, v_library_subtask.default_role, v_library_subtask.estimated_minutes,
        v_library_subtask.is_required, v_library_subtask.sort_order
      );
    END LOOP;
  END LOOP;

  -- THIRD: Create tasks from template_library_tasks junction table
  FOR v_library_task IN
    SELECT tlt.*, tl.stage as lib_stage, tl.title, tl.description,
           tl.default_role, tl.is_required,
           COALESCE(tlt.override_estimated_minutes, tl.estimated_minutes) as estimated_minutes,
           COALESCE(tlt.override_is_required, tl.is_required) as final_is_required
    FROM template_library_tasks tlt
    JOIN task_library tl ON tl.id = tlt.library_task_id
    WHERE tlt.template_id = v_card.template_id
      AND tl.stage = p_stage
      AND tl.is_active = true
    ORDER BY tlt.sort_order
  LOOP
    -- Create parent task from library
    INSERT INTO production_tasks (
      production_card_id, template_task_id, title, description,
      stage, role, estimated_minutes, is_required, sort_order
    ) VALUES (
      p_card_id, NULL, v_library_task.title, v_library_task.description,
      p_stage, v_library_task.default_role, v_library_task.estimated_minutes,
      v_library_task.final_is_required, v_library_task.sort_order
    ) RETURNING id INTO v_new_task_id;

    v_tasks_created := v_tasks_created + 1;

    -- Create subtasks from library
    FOR v_library_subtask IN
      SELECT * FROM task_library_subtasks
      WHERE library_task_id = v_library_task.library_task_id
      ORDER BY sort_order
    LOOP
      INSERT INTO production_tasks (
        production_card_id, template_task_id, parent_task_id,
        title, description, stage, role, estimated_minutes,
        is_required, sort_order
      ) VALUES (
        p_card_id, NULL, v_new_task_id,
        v_library_subtask.title, v_library_subtask.description,
        p_stage, v_library_subtask.default_role, v_library_subtask.estimated_minutes,
        v_library_subtask.is_required, v_library_subtask.sort_order
      );
    END LOOP;
  END LOOP;

  RETURN v_tasks_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE task_library IS 'Central repository of reusable task definitions';
COMMENT ON TABLE task_library_subtasks IS 'Subtasks belonging to library tasks';
COMMENT ON TABLE template_library_tasks IS 'Junction table linking templates to library tasks (many-to-many)';
COMMENT ON VIEW template_tasks_resolved IS 'Resolves library task values with any template-level overrides';
COMMENT ON COLUMN production_template_tasks.library_task_id IS 'Reference to library task for live linking - when set, inherits values from library';
COMMENT ON COLUMN template_library_tasks.override_estimated_minutes IS 'Optional per-template override for estimated minutes';
COMMENT ON COLUMN template_library_tasks.override_is_required IS 'Optional per-template override for is_required flag';
