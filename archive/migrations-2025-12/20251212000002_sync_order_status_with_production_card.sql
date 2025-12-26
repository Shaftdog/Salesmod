-- Migration: Sync Order Status with Production Card Stage
-- Purpose: Automatically update orders.status when production_cards.current_stage changes
-- This creates a bidirectional link between Production Templates → Production Cards → Orders

-- ============================================================================
-- TRIGGER FUNCTION: Sync order status when production card stage changes
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_order_status_from_production_card()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if current_stage actually changed
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Update the linked order's status to match the production card's stage
    UPDATE orders
    SET
      status = NEW.current_stage,
      updated_at = NOW()
    WHERE id = NEW.order_id;

    -- Log to order_status_history if that table exists
    BEGIN
      INSERT INTO order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        change_reason
      ) VALUES (
        NEW.order_id,
        OLD.current_stage,
        NEW.current_stage,
        auth.uid(),
        'Production card moved to ' || NEW.current_stage
      );
    EXCEPTION WHEN undefined_table THEN
      -- order_status_history table doesn't exist, skip logging
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Fire after production card stage update
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sync_order_status ON production_cards;

CREATE TRIGGER trigger_sync_order_status
  AFTER UPDATE OF current_stage ON production_cards
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_from_production_card();

-- ============================================================================
-- TRIGGER FUNCTION: Sync initial order status when production card is created
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_order_status_on_card_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the order's initial status to match the production card's starting stage
  UPDATE orders
  SET
    status = NEW.current_stage,
    updated_at = NOW()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Fire after production card is created
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sync_order_status_on_create ON production_cards;

CREATE TRIGGER trigger_sync_order_status_on_create
  AFTER INSERT ON production_cards
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_on_card_create();

-- ============================================================================
-- REVERSE SYNC: Update production card when order status changes directly
-- This handles cases where order status is updated outside of the Kanban board
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_production_card_from_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_valid_stage BOOLEAN;
BEGIN
  -- Only sync if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if the new status is a valid production stage
    -- (excludes 'cancelled' and 'on_hold' which are order-only statuses)
    v_valid_stage := NEW.status IN (
      'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
      'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
      'CORRECTION', 'REVISION', 'WORKFILE'
    );

    IF v_valid_stage THEN
      -- Update the production card's stage to match
      -- Use a flag to prevent infinite trigger loops
      UPDATE production_cards
      SET
        current_stage = NEW.status,
        -- Add to processed_stages if not already there
        processed_stages = CASE
          WHEN NEW.status = ANY(processed_stages) THEN processed_stages
          ELSE array_append(processed_stages, NEW.status)
        END,
        updated_at = NOW()
      WHERE order_id = NEW.id
        -- Only update if the stage is different (prevents trigger loops)
        AND current_stage IS DISTINCT FROM NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Fire after order status update (reverse sync)
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sync_production_card_from_order ON orders;

CREATE TRIGGER trigger_sync_production_card_from_order
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_card_from_order_status();

-- ============================================================================
-- BACKFILL: Sync existing production cards with their orders
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all orders that have production cards to match the card's stage
  UPDATE orders o
  SET
    status = pc.current_stage,
    updated_at = NOW()
  FROM production_cards pc
  WHERE o.id = pc.order_id
    AND o.status IS DISTINCT FROM pc.current_stage
    -- Only sync valid production stages
    AND pc.current_stage IN (
      'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
      'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
      'CORRECTION', 'REVISION', 'WORKFILE'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % orders with production card status', v_count;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION sync_order_status_from_production_card() IS
  'Syncs orders.status when production_cards.current_stage changes via Kanban board';

COMMENT ON FUNCTION sync_order_status_on_card_create() IS
  'Sets initial orders.status when a production card is created for an order';

COMMENT ON FUNCTION sync_production_card_from_order_status() IS
  'Reverse sync: updates production_cards.current_stage when orders.status is changed directly';

COMMENT ON TRIGGER trigger_sync_order_status ON production_cards IS
  'Fires after production card stage update to sync order status';

COMMENT ON TRIGGER trigger_sync_order_status_on_create ON production_cards IS
  'Fires after production card creation to set initial order status';

COMMENT ON TRIGGER trigger_sync_production_card_from_order ON orders IS
  'Fires after order status update to sync production card stage (reverse sync)';
