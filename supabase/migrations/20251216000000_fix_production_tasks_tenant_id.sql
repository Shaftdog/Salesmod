-- =============================================
-- Fix production_tasks tenant_id Issue
-- Migration: 20251216000000_fix_production_tasks_tenant_id.sql
-- Purpose: Set tenant_id on production_tasks to match their production_card
-- =============================================

-- Step 1: Backfill existing tasks with tenant_id from their card
UPDATE production_tasks pt
SET tenant_id = pc.tenant_id
FROM production_cards pc
WHERE pt.production_card_id = pc.id
  AND pt.tenant_id IS NULL;

-- Log how many were updated
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM production_tasks
  WHERE tenant_id IS NOT NULL;
  RAISE NOTICE 'Updated % production_tasks with tenant_id', v_count;
END $$;

-- Step 2: Update generate_stage_tasks function to include tenant_id
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

    -- Create parent task with auto-assignment AND tenant_id
    INSERT INTO production_tasks (
      production_card_id, template_task_id, title, description,
      stage, role, assigned_to, estimated_minutes, is_required, sort_order,
      tenant_id
    ) VALUES (
      p_card_id, v_template_task.id, v_template_task.title, v_template_task.description,
      p_stage, v_template_task.default_role, v_assigned_user, v_template_task.estimated_minutes,
      v_template_task.is_required, v_template_task.sort_order,
      v_card.tenant_id
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
        is_required, sort_order, tenant_id
      ) VALUES (
        p_card_id, NULL, v_new_task_id,
        v_template_subtask.title, v_template_subtask.description,
        p_stage, v_template_subtask.default_role, v_assigned_user, v_template_subtask.estimated_minutes,
        v_template_subtask.is_required, v_template_subtask.sort_order,
        v_card.tenant_id
      );
    END LOOP;
  END LOOP;

  RETURN v_tasks_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add trigger to auto-populate tenant_id on insert (fallback)
CREATE OR REPLACE FUNCTION auto_set_production_task_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If tenant_id not provided, get it from the production_card
  IF NEW.tenant_id IS NULL AND NEW.production_card_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM production_cards
    WHERE id = NEW.production_card_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_set_production_task_tenant_id ON production_tasks;

CREATE TRIGGER trg_auto_set_production_task_tenant_id
  BEFORE INSERT ON production_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_production_task_tenant_id();

-- =============================================
-- Migration Complete
-- =============================================
