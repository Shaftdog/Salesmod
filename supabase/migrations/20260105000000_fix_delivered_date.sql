-- Migration: Fix delivered_date not being set when order moves to DELIVERED
-- Issue: When production card moves to DELIVERED stage, the order's delivered_date wasn't being set

-- Update move_production_card function to also update order status and delivered_date
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

  -- When moving to DELIVERED, update order status and delivered_date
  IF p_target_stage = 'DELIVERED' THEN
    UPDATE orders
    SET
      status = 'DELIVERED',
      delivered_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = v_card.order_id;
  END IF;

  -- When moving to READY_FOR_DELIVERY, update order status
  IF p_target_stage = 'READY_FOR_DELIVERY' THEN
    UPDATE orders
    SET
      status = 'READY_FOR_DELIVERY',
      updated_at = NOW()
    WHERE id = v_card.order_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add comment for clarity
COMMENT ON FUNCTION move_production_card(UUID, TEXT) IS
  'Move production card to target stage. Updates order status and delivered_date when moving to DELIVERED.';
