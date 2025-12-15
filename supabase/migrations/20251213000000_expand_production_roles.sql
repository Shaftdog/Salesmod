-- Migration: Expand Production Roles from 4 to 8
-- Adds: researcher_level_1, researcher_level_2, researcher_level_3, inspector
-- Adds role assignment columns to production_cards
-- Implements auto-assignment of tasks based on card role assignments
-- Implements cascade of role changes to incomplete tasks

-- ============================================================================
-- 1. UPDATE CHECK CONSTRAINTS TO ALLOW NEW ROLES
-- ============================================================================

-- Define the new roles list for reference
-- Old roles: appraiser, reviewer, admin, trainee
-- New roles: appraiser, reviewer, admin, trainee, researcher_level_1, researcher_level_2, researcher_level_3, inspector

-- Drop and recreate CHECK constraint on production_template_tasks.default_role
ALTER TABLE production_template_tasks
  DROP CONSTRAINT IF EXISTS production_template_tasks_default_role_check;

ALTER TABLE production_template_tasks
  ADD CONSTRAINT production_template_tasks_default_role_check
  CHECK (default_role IN (
    'appraiser', 'reviewer', 'admin', 'trainee',
    'researcher_level_1', 'researcher_level_2', 'researcher_level_3', 'inspector'
  ));

-- Drop and recreate CHECK constraint on production_template_subtasks.default_role
ALTER TABLE production_template_subtasks
  DROP CONSTRAINT IF EXISTS production_template_subtasks_default_role_check;

ALTER TABLE production_template_subtasks
  ADD CONSTRAINT production_template_subtasks_default_role_check
  CHECK (default_role IN (
    'appraiser', 'reviewer', 'admin', 'trainee',
    'researcher_level_1', 'researcher_level_2', 'researcher_level_3', 'inspector'
  ));

-- Drop and recreate CHECK constraint on production_tasks.role
ALTER TABLE production_tasks
  DROP CONSTRAINT IF EXISTS production_tasks_role_check;

ALTER TABLE production_tasks
  ADD CONSTRAINT production_tasks_role_check
  CHECK (role IN (
    'appraiser', 'reviewer', 'admin', 'trainee',
    'researcher_level_1', 'researcher_level_2', 'researcher_level_3', 'inspector'
  ));

-- ============================================================================
-- 2. ADD ROLE ASSIGNMENT COLUMNS TO PRODUCTION_CARDS
-- ============================================================================

-- Add columns for each role assignment (user assigned to that role for this card)
ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_trainee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_researcher_level_1_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_researcher_level_2_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_researcher_level_3_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS assigned_inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add indexes for new assignment columns
CREATE INDEX IF NOT EXISTS idx_production_cards_reviewer ON production_cards(assigned_reviewer_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_admin ON production_cards(assigned_admin_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_trainee ON production_cards(assigned_trainee_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_researcher_l1 ON production_cards(assigned_researcher_level_1_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_researcher_l2 ON production_cards(assigned_researcher_level_2_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_researcher_l3 ON production_cards(assigned_researcher_level_3_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_cards_inspector ON production_cards(assigned_inspector_id) WHERE completed_at IS NULL;

-- ============================================================================
-- 3. HELPER FUNCTION: GET ASSIGNED USER FOR ROLE
-- ============================================================================

-- This function returns the user_id assigned to a specific role for a card
-- Implements researcher hierarchy: if L1 task but L1 is NULL, try L2, then L3
CREATE OR REPLACE FUNCTION get_assigned_user_for_role(
  p_card production_cards,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Direct role match
  CASE p_role
    WHEN 'appraiser' THEN v_user_id := p_card.assigned_appraiser_id;
    WHEN 'reviewer' THEN v_user_id := p_card.assigned_reviewer_id;
    WHEN 'admin' THEN v_user_id := p_card.assigned_admin_id;
    WHEN 'trainee' THEN v_user_id := p_card.assigned_trainee_id;
    WHEN 'inspector' THEN v_user_id := p_card.assigned_inspector_id;
    WHEN 'researcher_level_1' THEN
      -- Researcher hierarchy: L1 → L2 → L3
      v_user_id := COALESCE(
        p_card.assigned_researcher_level_1_id,
        p_card.assigned_researcher_level_2_id,
        p_card.assigned_researcher_level_3_id
      );
    WHEN 'researcher_level_2' THEN
      -- Researcher hierarchy: L2 → L3
      v_user_id := COALESCE(
        p_card.assigned_researcher_level_2_id,
        p_card.assigned_researcher_level_3_id
      );
    WHEN 'researcher_level_3' THEN
      v_user_id := p_card.assigned_researcher_level_3_id;
    ELSE
      v_user_id := NULL;
  END CASE;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_assigned_user_for_role(production_cards, TEXT) IS
  'Returns the user assigned to a role for a card. Implements researcher hierarchy: L3 can do L1/L2 tasks.';

-- ============================================================================
-- 4. UPDATE GENERATE_STAGE_TASKS TO AUTO-ASSIGN TASKS
-- ============================================================================

-- Replace the existing function to include auto-assignment
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
  v_assigned_user UUID;
  v_lock_obtained BOOLEAN;
BEGIN
  -- Acquire advisory lock to prevent race conditions
  -- Use card_id hash as lock key for card-specific locking
  v_lock_obtained := pg_try_advisory_xact_lock(hashtext(p_card_id::text || p_stage));
  IF NOT v_lock_obtained THEN
    -- Another transaction is processing this card/stage, wait for it
    PERFORM pg_advisory_xact_lock(hashtext(p_card_id::text || p_stage));
  END IF;

  -- Get card with all role assignments
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
    -- Get assigned user for this task's role
    v_assigned_user := get_assigned_user_for_role(v_card, v_template_task.default_role);

    -- Create parent task with auto-assignment
    INSERT INTO production_tasks (
      production_card_id, template_task_id, title, description,
      stage, role, assigned_to, estimated_minutes, is_required, sort_order
    ) VALUES (
      p_card_id, v_template_task.id, v_template_task.title, v_template_task.description,
      p_stage, v_template_task.default_role, v_assigned_user, v_template_task.estimated_minutes,
      v_template_task.is_required, v_template_task.sort_order
    ) RETURNING id INTO v_new_task_id;

    v_tasks_created := v_tasks_created + 1;

    -- Create subtasks
    FOR v_template_subtask IN
      SELECT * FROM production_template_subtasks
      WHERE parent_task_id = v_template_task.id
      ORDER BY sort_order
    LOOP
      -- Get assigned user for subtask's role (may differ from parent)
      v_assigned_user := get_assigned_user_for_role(v_card, v_template_subtask.default_role);

      INSERT INTO production_tasks (
        production_card_id, template_task_id, parent_task_id,
        title, description, stage, role, assigned_to, estimated_minutes,
        is_required, sort_order
      ) VALUES (
        p_card_id, NULL, v_new_task_id,
        v_template_subtask.title, v_template_subtask.description,
        p_stage, v_template_subtask.default_role, v_assigned_user, v_template_subtask.estimated_minutes,
        v_template_subtask.is_required, v_template_subtask.sort_order
      );
    END LOOP;
  END LOOP;

  RETURN v_tasks_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CASCADE ROLE ASSIGNMENT CHANGES TO TASKS
-- ============================================================================

-- This trigger function updates assigned_to on incomplete tasks when role assignments change
CREATE OR REPLACE FUNCTION cascade_role_assignment_to_tasks()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_old_user UUID;
  v_new_user UUID;
BEGIN
  -- Check each role assignment column for changes
  -- Only update tasks that are pending or in_progress (not completed)

  -- Appraiser
  IF OLD.assigned_appraiser_id IS DISTINCT FROM NEW.assigned_appraiser_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'appraiser')
    WHERE production_card_id = NEW.id
      AND role = 'appraiser'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Reviewer
  IF OLD.assigned_reviewer_id IS DISTINCT FROM NEW.assigned_reviewer_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'reviewer')
    WHERE production_card_id = NEW.id
      AND role = 'reviewer'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Admin
  IF OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'admin')
    WHERE production_card_id = NEW.id
      AND role = 'admin'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Trainee
  IF OLD.assigned_trainee_id IS DISTINCT FROM NEW.assigned_trainee_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'trainee')
    WHERE production_card_id = NEW.id
      AND role = 'trainee'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Inspector
  IF OLD.assigned_inspector_id IS DISTINCT FROM NEW.assigned_inspector_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'inspector')
    WHERE production_card_id = NEW.id
      AND role = 'inspector'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Researcher Level 1 (also affects L1 tasks due to hierarchy)
  IF OLD.assigned_researcher_level_1_id IS DISTINCT FROM NEW.assigned_researcher_level_1_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, 'researcher_level_1')
    WHERE production_card_id = NEW.id
      AND role = 'researcher_level_1'
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Researcher Level 2 (also need to re-check L1 tasks due to hierarchy fallback)
  IF OLD.assigned_researcher_level_2_id IS DISTINCT FROM NEW.assigned_researcher_level_2_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, role)
    WHERE production_card_id = NEW.id
      AND role IN ('researcher_level_1', 'researcher_level_2')
      AND status IN ('pending', 'in_progress');
  END IF;

  -- Researcher Level 3 (need to re-check all researcher tasks due to hierarchy)
  IF OLD.assigned_researcher_level_3_id IS DISTINCT FROM NEW.assigned_researcher_level_3_id THEN
    UPDATE production_tasks
    SET assigned_to = get_assigned_user_for_role(NEW, role)
    WHERE production_card_id = NEW.id
      AND role IN ('researcher_level_1', 'researcher_level_2', 'researcher_level_3')
      AND status IN ('pending', 'in_progress');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cascade role assignment changes
DROP TRIGGER IF EXISTS trigger_cascade_role_assignments ON production_cards;

CREATE TRIGGER trigger_cascade_role_assignments
  AFTER UPDATE OF
    assigned_appraiser_id,
    assigned_reviewer_id,
    assigned_admin_id,
    assigned_trainee_id,
    assigned_researcher_level_1_id,
    assigned_researcher_level_2_id,
    assigned_researcher_level_3_id,
    assigned_inspector_id
  ON production_cards
  FOR EACH ROW
  EXECUTE FUNCTION cascade_role_assignment_to_tasks();

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON COLUMN production_cards.assigned_reviewer_id IS 'User assigned to reviewer role for this production card';
COMMENT ON COLUMN production_cards.assigned_admin_id IS 'User assigned to admin role for this production card';
COMMENT ON COLUMN production_cards.assigned_trainee_id IS 'User assigned to trainee role for this production card';
COMMENT ON COLUMN production_cards.assigned_researcher_level_1_id IS 'User assigned to researcher level 1 role for this production card';
COMMENT ON COLUMN production_cards.assigned_researcher_level_2_id IS 'User assigned to researcher level 2 role for this production card';
COMMENT ON COLUMN production_cards.assigned_researcher_level_3_id IS 'User assigned to researcher level 3 role for this production card';
COMMENT ON COLUMN production_cards.assigned_inspector_id IS 'User assigned to inspector role for this production card';

COMMENT ON FUNCTION cascade_role_assignment_to_tasks() IS
  'Cascades role assignment changes to incomplete (pending/in_progress) tasks. Does not modify completed tasks.';
