-- Migration: Auto-complete subtasks when parent task is completed
-- When a parent task is marked as 'completed', all its subtasks should also be completed

-- Create function to cascade completion to subtasks
CREATE OR REPLACE FUNCTION cascade_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a parent task is marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Complete all subtasks
    UPDATE production_tasks
    SET
      status = 'completed',
      completed_at = COALESCE(completed_at, NOW()),
      updated_at = NOW()
    WHERE parent_task_id = NEW.id
      AND status != 'completed';

    -- Update the card's completed_tasks count to include subtasks
    -- This is handled by existing triggers, but let's make sure
    PERFORM update_card_task_counts(NEW.production_card_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS cascade_task_completion_trigger ON production_tasks;

CREATE TRIGGER cascade_task_completion_trigger
  AFTER UPDATE OF status ON production_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.parent_task_id IS NULL)
  EXECUTE FUNCTION cascade_task_completion();

-- Also create a function to update card task counts properly
-- This should count ALL tasks (parents + subtasks) in the current stage
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

  -- Count ALL tasks (including subtasks) in current stage
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM production_tasks
  WHERE production_card_id = p_card_id
    AND stage = v_current_stage;

  -- Update the card
  UPDATE production_cards
  SET
    total_tasks = v_total,
    completed_tasks = v_completed,
    updated_at = NOW()
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix existing completed parent tasks - complete their subtasks
UPDATE production_tasks pt_sub
SET
  status = 'completed',
  completed_at = COALESCE(pt_sub.completed_at, NOW()),
  updated_at = NOW()
FROM production_tasks pt_parent
WHERE pt_sub.parent_task_id = pt_parent.id
  AND pt_parent.status = 'completed'
  AND pt_sub.status != 'completed';

-- Now recalculate task counts for all cards
DO $$
DECLARE
  card_record RECORD;
BEGIN
  FOR card_record IN SELECT id FROM production_cards
  LOOP
    PERFORM update_card_task_counts(card_record.id);
  END LOOP;
END $$;
