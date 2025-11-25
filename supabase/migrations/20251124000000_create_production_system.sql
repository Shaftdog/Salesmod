-- Create Production Kanban System
-- Migration: 20251124000000_create_production_system.sql
-- Purpose: Production workflow management with 10-stage Kanban board, task templates, time tracking

-- ============================================================================
-- STAGE DEFINITIONS
-- ============================================================================
-- INTAKE → SCHEDULING → SCHEDULED → INSPECTED → FINALIZATION →
-- READY_FOR_DELIVERY → DELIVERED → CORRECTION → REVISION → WORKFILE

-- ============================================================================
-- 1. PRODUCTION_TEMPLATES: Admin-defined workflow templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  applicable_order_types TEXT[] DEFAULT '{}',
  applicable_property_types TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one default template per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_production_templates_default
  ON production_templates(org_id) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_production_templates_org ON production_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_production_templates_active ON production_templates(org_id, is_active);

-- ============================================================================
-- 2. PRODUCTION_TEMPLATE_TASKS: Tasks defined per stage in each template
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES production_templates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE'
  )),
  title TEXT NOT NULL,
  description TEXT,
  default_role TEXT NOT NULL CHECK (default_role IN ('appraiser', 'reviewer', 'admin', 'trainee')),
  estimated_minutes INTEGER DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_template_tasks_template
  ON production_template_tasks(template_id, stage, sort_order);

-- ============================================================================
-- 3. PRODUCTION_TEMPLATE_SUBTASKS: Subtasks under parent template tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_template_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL REFERENCES production_template_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  default_role TEXT NOT NULL CHECK (default_role IN ('appraiser', 'reviewer', 'admin', 'trainee')),
  estimated_minutes INTEGER DEFAULT 15,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_template_subtasks_parent
  ON production_template_subtasks(parent_task_id, sort_order);

-- ============================================================================
-- 4. PRODUCTION_CARDS: One card per order tracking production progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES production_templates(id),

  -- Stage tracking
  current_stage TEXT NOT NULL DEFAULT 'INTAKE' CHECK (current_stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE'
  )),
  processed_stages TEXT[] DEFAULT '{}',  -- Prevents duplicate task generation

  -- Progress metrics (denormalized for quick access)
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,

  -- Scheduling
  due_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Assignment
  assigned_appraiser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Lifecycle timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_order_production_card UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_production_cards_org_stage ON production_cards(org_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_production_cards_order ON production_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_production_cards_due ON production_cards(due_date) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_appraiser ON production_cards(assigned_appraiser_id) WHERE completed_at IS NULL;

-- ============================================================================
-- 5. PRODUCTION_TASKS: Actual tasks created from templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_card_id UUID NOT NULL REFERENCES production_cards(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES production_template_tasks(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES production_tasks(id) ON DELETE CASCADE,  -- For subtasks

  -- Task definition
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE'
  )),

  -- Assignment
  role TEXT NOT NULL CHECK (role IN ('appraiser', 'reviewer', 'admin', 'trainee')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started
    'in_progress',  -- Currently being worked on
    'completed',    -- Done
    'blocked'       -- Cannot proceed
  )),

  -- Deadline tracking
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_on_time BOOLEAN,  -- Set when completed

  -- Time tracking
  total_time_minutes INTEGER DEFAULT 0,  -- Accumulated from time entries
  estimated_minutes INTEGER,

  -- Flags
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_tasks_card ON production_tasks(production_card_id, stage, sort_order);
CREATE INDEX IF NOT EXISTS idx_production_tasks_card_stage ON production_tasks(production_card_id, stage);
CREATE INDEX IF NOT EXISTS idx_production_tasks_assigned ON production_tasks(assigned_to, status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_production_tasks_due ON production_tasks(due_date) WHERE status NOT IN ('completed', 'blocked');
CREATE INDEX IF NOT EXISTS idx_production_tasks_parent ON production_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- ============================================================================
-- 6. PRODUCTION_TIME_ENTRIES: Stopwatch time tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES production_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Time tracking
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,  -- Calculated on end

  -- Entry type
  entry_type TEXT DEFAULT 'stopwatch' CHECK (entry_type IN ('stopwatch', 'manual')),

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_time_entries_task ON production_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_production_time_entries_user ON production_time_entries(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_time_entries_active ON production_time_entries(task_id, user_id) WHERE ended_at IS NULL;

-- ============================================================================
-- 7. PRODUCTION_RESOURCES: User capacity for AI load management
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Roles this user can perform
  roles TEXT[] NOT NULL DEFAULT '{}',

  -- Capacity settings
  max_daily_tasks INTEGER DEFAULT 10,
  max_weekly_hours INTEGER DEFAULT 40,
  current_load INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,

  -- Scheduling
  availability_schedule JSONB DEFAULT '{}'::JSONB,
  -- Example: {"monday": {"start": "09:00", "end": "17:00"}, ...}

  -- Performance metrics
  avg_task_completion_minutes INTEGER,
  tasks_completed_count INTEGER DEFAULT 0,
  on_time_completion_rate DECIMAL(5,2) DEFAULT 100.00,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_org_user_resource UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_production_resources_org ON production_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_production_resources_available ON production_resources(org_id, is_available) WHERE is_available = true;

-- ============================================================================
-- 8. PRODUCTION_ALERTS: AI-generated alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  production_card_id UUID REFERENCES production_cards(id) ON DELETE CASCADE,
  task_id UUID REFERENCES production_tasks(id) ON DELETE CASCADE,

  -- Alert info
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'due_date_at_risk',   -- Approaching deadline with incomplete tasks
    'overdue',            -- Past due date
    'blocked',            -- Task/card is blocked
    'capacity_exceeded',  -- Resource over-allocated
    'unassigned_task',    -- Task needs assignment
    'stuck_in_stage'      -- Card hasn't moved in X days
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,

  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_alerts_org ON production_alerts(org_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_production_alerts_unresolved ON production_alerts(org_id) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_production_alerts_card ON production_alerts(production_card_id);
CREATE INDEX IF NOT EXISTS idx_production_alerts_task ON production_alerts(task_id);

-- ============================================================================
-- 9. PRODUCTION_AGENT_RUNS: Track agent execution history
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Trigger info
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'scheduled',      -- Hourly cron
    'order_created',  -- New order trigger
    'stage_change',   -- Card moved to new stage
    'task_completed', -- Task marked complete
    'manual'          -- User triggered
  )),
  trigger_details JSONB DEFAULT '{}'::JSONB,

  -- Execution tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

  -- Metrics
  tasks_assigned INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  cards_processed INTEGER DEFAULT 0,

  -- Errors
  errors JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_agent_runs_org ON production_agent_runs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_agent_runs_status ON production_agent_runs(status) WHERE status = 'running';

-- ============================================================================
-- 10. RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE production_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_template_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_agent_runs ENABLE ROW LEVEL SECURITY;

-- Templates: org-scoped access
CREATE POLICY production_templates_org_isolation ON production_templates
  FOR ALL USING (org_id = auth.uid());

-- Template Tasks: access via parent template
CREATE POLICY production_template_tasks_via_template ON production_template_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_templates
      WHERE production_templates.id = production_template_tasks.template_id
        AND production_templates.org_id = auth.uid()
    )
  );

-- Template Subtasks: access via parent task
CREATE POLICY production_template_subtasks_via_task ON production_template_subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_template_tasks tt
      JOIN production_templates t ON t.id = tt.template_id
      WHERE tt.id = production_template_subtasks.parent_task_id
        AND t.org_id = auth.uid()
    )
  );

-- Production Cards: org-scoped access
CREATE POLICY production_cards_org_isolation ON production_cards
  FOR ALL USING (org_id = auth.uid());

-- Production Tasks: access via parent card
CREATE POLICY production_tasks_via_card ON production_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_cards
      WHERE production_cards.id = production_tasks.production_card_id
        AND production_cards.org_id = auth.uid()
    )
  );

-- Time Entries: access via parent task
CREATE POLICY production_time_entries_via_task ON production_time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_tasks pt
      JOIN production_cards pc ON pc.id = pt.production_card_id
      WHERE pt.id = production_time_entries.task_id
        AND pc.org_id = auth.uid()
    )
  );

-- Resources: org-scoped access
CREATE POLICY production_resources_org_isolation ON production_resources
  FOR ALL USING (org_id = auth.uid());

-- Alerts: org-scoped access
CREATE POLICY production_alerts_org_isolation ON production_alerts
  FOR ALL USING (org_id = auth.uid());

-- Agent Runs: org-scoped access
CREATE POLICY production_agent_runs_org_isolation ON production_agent_runs
  FOR ALL USING (org_id = auth.uid());

-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_production_templates_updated_at
  BEFORE UPDATE ON production_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_production_template_tasks_updated_at
  BEFORE UPDATE ON production_template_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_production_cards_updated_at
  BEFORE UPDATE ON production_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_production_tasks_updated_at
  BEFORE UPDATE ON production_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_production_resources_updated_at
  BEFORE UPDATE ON production_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update card metrics when tasks change
CREATE OR REPLACE FUNCTION update_production_card_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE production_cards
  SET
    total_tasks = (
      SELECT COUNT(*) FROM production_tasks
      WHERE production_card_id = COALESCE(NEW.production_card_id, OLD.production_card_id)
        AND parent_task_id IS NULL  -- Only count parent tasks
    ),
    completed_tasks = (
      SELECT COUNT(*) FROM production_tasks
      WHERE production_card_id = COALESCE(NEW.production_card_id, OLD.production_card_id)
        AND parent_task_id IS NULL  -- Only count parent tasks
        AND status = 'completed'
    )
  WHERE id = COALESCE(NEW.production_card_id, OLD.production_card_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_production_card_metrics
  AFTER INSERT OR UPDATE OF status OR DELETE ON production_tasks
  FOR EACH ROW EXECUTE FUNCTION update_production_card_metrics();

-- Update task total_time_minutes when time entries change
CREATE OR REPLACE FUNCTION update_task_time_minutes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE production_tasks
  SET total_time_minutes = (
    SELECT COALESCE(SUM(duration_minutes), 0)
    FROM production_time_entries
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
      AND duration_minutes IS NOT NULL
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_time_minutes
  AFTER INSERT OR UPDATE OF duration_minutes OR DELETE ON production_time_entries
  FOR EACH ROW EXECUTE FUNCTION update_task_time_minutes();

-- Set is_on_time when task is completed
CREATE OR REPLACE FUNCTION set_task_on_time_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
    IF NEW.due_date IS NOT NULL THEN
      NEW.is_on_time = (NOW() <= NEW.due_date);
    ELSE
      NEW.is_on_time = true;  -- No due date = on time
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_task_on_time_status
  BEFORE UPDATE OF status ON production_tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_on_time_status();

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a card can move to the next stage
CREATE OR REPLACE FUNCTION can_move_to_stage(
  p_card_id UUID,
  p_target_stage TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stage TEXT;
  v_incomplete_count INTEGER;
BEGIN
  -- Get current stage
  SELECT current_stage INTO v_current_stage
  FROM production_cards
  WHERE id = p_card_id;

  IF v_current_stage IS NULL THEN
    RETURN false;
  END IF;

  -- Count incomplete required tasks in current stage
  SELECT COUNT(*) INTO v_incomplete_count
  FROM production_tasks
  WHERE production_card_id = p_card_id
    AND stage = v_current_stage
    AND is_required = true
    AND status != 'completed';

  RETURN v_incomplete_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move card to next stage
CREATE OR REPLACE FUNCTION move_production_card(
  p_card_id UUID,
  p_target_stage TEXT
)
RETURNS VOID AS $$
DECLARE
  v_card production_cards%ROWTYPE;
  v_can_move BOOLEAN;
BEGIN
  -- Get card and verify ownership
  SELECT * INTO v_card
  FROM production_cards
  WHERE id = p_card_id
    AND org_id = auth.uid();

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Card not found or unauthorized';
  END IF;

  -- Check if can move
  v_can_move := can_move_to_stage(p_card_id, p_target_stage);

  IF NOT v_can_move THEN
    RAISE EXCEPTION 'Cannot move: incomplete required tasks in current stage';
  END IF;

  -- Update card
  UPDATE production_cards
  SET
    current_stage = p_target_stage,
    processed_stages = array_append(
      CASE WHEN v_card.current_stage = ANY(processed_stages)
           THEN processed_stages
           ELSE array_append(processed_stages, v_card.current_stage)
      END,
      p_target_stage
    ),
    started_at = COALESCE(started_at, NOW()),
    completed_at = CASE WHEN p_target_stage = 'WORKFILE' THEN NOW() ELSE NULL END
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate tasks for a stage from template
CREATE OR REPLACE FUNCTION generate_stage_tasks(
  p_card_id UUID,
  p_stage TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_card production_cards%ROWTYPE;
  v_template_task RECORD;
  v_template_subtask RECORD;
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

  -- Create tasks from template
  FOR v_template_task IN
    SELECT * FROM production_template_tasks
    WHERE template_id = v_card.template_id
      AND stage = p_stage
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

    -- Create subtasks
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

  RETURN v_tasks_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. SEED DEFAULT TEMPLATE (Standard Appraisal)
-- ============================================================================

-- Note: This will be seeded per-organization on first use
-- Here's an example structure for documentation:
/*
INSERT INTO production_templates (org_id, name, description, is_default, is_active)
VALUES (
  '<org_id>',
  'Standard Appraisal',
  'Default workflow for standard residential appraisals',
  true,
  true
);

-- INTAKE stage tasks
INSERT INTO production_template_tasks (template_id, stage, title, default_role, estimated_minutes, is_required, sort_order)
VALUES
  ('<template_id>', 'INTAKE', 'Review order details', 'admin', 15, true, 1),
  ('<template_id>', 'INTAKE', 'Verify property information', 'admin', 10, true, 2),
  ('<template_id>', 'INTAKE', 'Check client requirements', 'admin', 10, true, 3);

-- SCHEDULING stage tasks
INSERT INTO production_template_tasks (template_id, stage, title, default_role, estimated_minutes, is_required, sort_order)
VALUES
  ('<template_id>', 'SCHEDULING', 'Contact homeowner', 'admin', 15, true, 1),
  ('<template_id>', 'SCHEDULING', 'Schedule inspection', 'admin', 10, true, 2);

-- etc. for other stages...
*/

-- ============================================================================
-- 14. COMMENTS
-- ============================================================================

COMMENT ON TABLE production_templates IS 'Admin-defined workflow templates for production orders';
COMMENT ON TABLE production_template_tasks IS 'Task definitions per stage in a production template';
COMMENT ON TABLE production_template_subtasks IS 'Subtask definitions under parent template tasks';
COMMENT ON TABLE production_cards IS 'Production tracking card - one per order, moves through 10 stages';
COMMENT ON TABLE production_tasks IS 'Actual tasks created from templates for a production card';
COMMENT ON TABLE production_time_entries IS 'Stopwatch time tracking entries for tasks';
COMMENT ON TABLE production_resources IS 'User capacity and availability for AI load management';
COMMENT ON TABLE production_alerts IS 'AI-generated alerts for at-risk production items';
COMMENT ON TABLE production_agent_runs IS 'History of production agent executions';

COMMENT ON COLUMN production_cards.processed_stages IS 'Stages already processed - prevents duplicate task generation';
COMMENT ON COLUMN production_cards.current_stage IS '10-stage workflow: INTAKE→SCHEDULING→SCHEDULED→INSPECTED→FINALIZATION→READY_FOR_DELIVERY→DELIVERED→CORRECTION→REVISION→WORKFILE';
COMMENT ON COLUMN production_tasks.is_on_time IS 'Set automatically when task is completed based on due_date';
COMMENT ON COLUMN production_resources.roles IS 'Array of roles this user can perform: appraiser, reviewer, admin, trainee';
