-- Migration: Update can_move_to_stage to only check parent tasks
-- Subtasks can remain incomplete as long as the parent task is complete
-- This allows for more flexible workflow where subtasks are optional details

CREATE OR REPLACE FUNCTION can_move_to_stage(
  p_card_id UUID,
  p_target_stage TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stage TEXT;
  v_incomplete_count INT;
BEGIN
  -- Get current stage
  SELECT current_stage INTO v_current_stage
  FROM production_cards
  WHERE id = p_card_id;

  -- Count incomplete REQUIRED PARENT tasks in current stage
  -- Only check parent tasks (parent_task_id IS NULL), not subtasks
  -- Subtasks can remain incomplete - only parent task completion matters
  SELECT COUNT(*) INTO v_incomplete_count
  FROM production_tasks
  WHERE production_card_id = p_card_id
    AND stage = v_current_stage
    AND is_required = true
    AND status != 'completed'
    AND parent_task_id IS NULL;  -- Only parent tasks matter for stage movement

  RETURN v_incomplete_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the task count calculation to only count parent tasks
-- This keeps the UI consistent with what blocks movement
CREATE OR REPLACE FUNCTION update_card_task_counts(p_card_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_stage TEXT;
  v_total INT;
  v_completed INT;
BEGIN
  -- Get current stage
  SELECT current_stage INTO v_current_stage
  FROM production_cards
  WHERE id = p_card_id;

  -- Count only PARENT tasks (not subtasks) in current stage
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM production_tasks
  WHERE production_card_id = p_card_id
    AND stage = v_current_stage
    AND parent_task_id IS NULL;  -- Only parent tasks

  -- Update the card
  UPDATE production_cards
  SET
    total_tasks = v_total,
    completed_tasks = v_completed,
    updated_at = NOW()
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
