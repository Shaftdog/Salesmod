-- Migration: Update move_production_card to generate tasks for the new stage
-- Currently tasks are only generated for INTAKE when card is created
-- This fix ensures tasks are generated for each new stage when moving

CREATE OR REPLACE FUNCTION move_production_card(
  p_card_id UUID,
  p_target_stage TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS production_cards AS $$
DECLARE
  v_card production_cards;
  v_can_move BOOLEAN;
  v_order_id UUID;
  v_previous_stage TEXT;
BEGIN
  -- Get current card state
  SELECT * INTO v_card FROM production_cards WHERE id = p_card_id;

  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Production card not found';
  END IF;

  v_previous_stage := v_card.current_stage;

  -- Check if card can move (only required parent tasks must be complete)
  v_can_move := can_move_to_stage(p_card_id, p_target_stage);

  IF NOT v_can_move THEN
    RAISE EXCEPTION 'Cannot move: incomplete required tasks in current stage';
  END IF;

  -- Update card stage
  UPDATE production_cards
  SET
    current_stage = p_target_stage,
    updated_at = NOW()
  WHERE id = p_card_id
  RETURNING * INTO v_card;

  -- Get order_id for status history
  v_order_id := v_card.order_id;

  -- Log the stage transition in order_status_history
  INSERT INTO order_status_history (
    order_id,
    previous_status,
    new_status,
    change_reason,
    changed_by,
    changed_at
  ) VALUES (
    v_order_id,
    v_previous_stage,
    p_target_stage,
    'Production stage transition',
    p_user_id,
    NOW()
  );

  -- Update order status to match production stage
  UPDATE orders
  SET
    status = p_target_stage,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- Generate tasks for the new stage
  PERFORM generate_stage_tasks(p_card_id, p_target_stage);

  -- Update task counts for the new stage
  PERFORM update_card_task_counts(p_card_id);

  RETURN v_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update generate_stage_tasks to handle any stage
CREATE OR REPLACE FUNCTION generate_stage_tasks(
  p_card_id UUID,
  p_stage TEXT
)
RETURNS VOID AS $$
DECLARE
  v_card production_cards;
  v_template_task RECORD;
  v_new_task_id UUID;
  v_assigned_user UUID;
  v_role TEXT;
BEGIN
  -- Get card with role assignments
  SELECT * INTO v_card FROM production_cards WHERE id = p_card_id;

  IF v_card IS NULL OR v_card.template_id IS NULL THEN
    RETURN;
  END IF;

  -- Check if tasks already exist for this stage
  IF EXISTS (
    SELECT 1 FROM production_tasks
    WHERE production_card_id = p_card_id AND stage = p_stage
  ) THEN
    RETURN; -- Tasks already exist, don't duplicate
  END IF;

  -- Loop through template tasks for this stage
  FOR v_template_task IN
    SELECT * FROM production_template_tasks
    WHERE template_id = v_card.template_id
      AND stage = p_stage
    ORDER BY sort_order
  LOOP
    -- Determine role and assigned user
    v_role := COALESCE(v_template_task.default_role, 'appraiser');
    v_assigned_user := get_assigned_user_for_role(v_card, v_role);

    -- Create the task
    INSERT INTO production_tasks (
      production_card_id,
      template_task_id,
      title,
      description,
      stage,
      role,
      assigned_to,
      status,
      is_required,
      estimated_minutes,
      sort_order
    ) VALUES (
      p_card_id,
      v_template_task.id,
      v_template_task.title,
      v_template_task.description,
      p_stage,
      v_role,
      v_assigned_user,
      'pending',
      v_template_task.is_required,
      v_template_task.estimated_minutes,
      v_template_task.sort_order
    )
    RETURNING id INTO v_new_task_id;

    -- Create subtasks from template
    INSERT INTO production_tasks (
      production_card_id,
      parent_task_id,
      title,
      description,
      stage,
      role,
      assigned_to,
      status,
      is_required,
      estimated_minutes,
      sort_order
    )
    SELECT
      p_card_id,
      v_new_task_id,
      pts.title,
      pts.description,
      p_stage,
      COALESCE(pts.default_role, v_role),
      get_assigned_user_for_role(v_card, COALESCE(pts.default_role, v_role)),
      'pending',
      pts.is_required,
      pts.estimated_minutes,
      pts.sort_order
    FROM production_template_subtasks pts
    WHERE pts.parent_task_id = v_template_task.id
    ORDER BY pts.sort_order;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure update_card_task_counts counts parent tasks only
CREATE OR REPLACE FUNCTION update_card_task_counts(p_card_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_stage TEXT;
  v_total INT;
  v_completed INT;
BEGIN
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
    AND parent_task_id IS NULL;

  UPDATE production_cards
  SET
    total_tasks = v_total,
    completed_tasks = v_completed,
    updated_at = NOW()
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
