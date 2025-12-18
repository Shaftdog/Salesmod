-- Add ON_HOLD and CANCELLED stages to production cards
-- Migration: 20251217000000_add_hold_cancel_stages.sql
-- Purpose: Enable Hold and Cancel workflows for production cards

-- ============================================================================
-- 1. Add new columns for tracking hold/cancel status
-- ============================================================================

-- Add hold/cancel tracking columns to production_cards
ALTER TABLE production_cards
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS previous_stage TEXT,
  ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for filtering held/cancelled cards (using tenant_id for multi-tenant isolation)
CREATE INDEX IF NOT EXISTS idx_production_cards_held
  ON production_cards(tenant_id, held_at)
  WHERE held_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_cards_cancelled
  ON production_cards(tenant_id, cancelled_at)
  WHERE cancelled_at IS NOT NULL;

-- ============================================================================
-- 2. Drop existing stage constraint and add new one with ON_HOLD and CANCELLED
-- ============================================================================

-- Drop existing constraint on production_cards.current_stage
ALTER TABLE production_cards
  DROP CONSTRAINT IF EXISTS production_cards_current_stage_check;

-- Add new constraint including ON_HOLD and CANCELLED
ALTER TABLE production_cards
  ADD CONSTRAINT production_cards_current_stage_check
  CHECK (current_stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE',
    'ON_HOLD', 'CANCELLED'
  ));

-- ============================================================================
-- 3. Update production_tasks stage constraint (for tasks in ON_HOLD/CANCELLED cards)
-- ============================================================================

-- Drop existing constraint on production_tasks.stage
ALTER TABLE production_tasks
  DROP CONSTRAINT IF EXISTS production_tasks_stage_check;

-- Add new constraint including ON_HOLD and CANCELLED
ALTER TABLE production_tasks
  ADD CONSTRAINT production_tasks_stage_check
  CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE',
    'ON_HOLD', 'CANCELLED'
  ));

-- ============================================================================
-- 4. Update production_template_tasks stage constraint
-- ============================================================================

-- Drop existing constraint
ALTER TABLE production_template_tasks
  DROP CONSTRAINT IF EXISTS production_template_tasks_stage_check;

-- Add new constraint (templates can have tasks for ON_HOLD/CANCELLED stages)
ALTER TABLE production_template_tasks
  ADD CONSTRAINT production_template_tasks_stage_check
  CHECK (stage IN (
    'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
    'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
    'CORRECTION', 'REVISION', 'WORKFILE',
    'ON_HOLD', 'CANCELLED'
  ));

-- ============================================================================
-- 5. Create function to put card on hold
-- ============================================================================

CREATE OR REPLACE FUNCTION hold_production_card(
  p_card_id UUID,
  p_hold_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stage TEXT;
  v_tenant_id UUID;
  v_user_tenant_id UUID;
BEGIN
  -- Verify caller has access to this card's tenant (SECURITY: prevent cross-tenant access)
  SELECT tenant_id FROM profiles WHERE id = auth.uid() INTO v_user_tenant_id;

  -- Get current stage and tenant_id
  SELECT current_stage, tenant_id INTO v_current_stage, v_tenant_id
  FROM production_cards
  WHERE id = p_card_id;

  IF v_current_stage IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Verify tenant authorization
  IF v_tenant_id != v_user_tenant_id THEN
    RAISE EXCEPTION 'Unauthorized: Card not found or access denied';
  END IF;

  -- Don't allow holding an already held or cancelled card
  IF v_current_stage IN ('ON_HOLD', 'CANCELLED') THEN
    RAISE EXCEPTION 'Card is already on hold or cancelled';
  END IF;

  -- Update card to ON_HOLD status
  UPDATE production_cards
  SET
    previous_stage = current_stage,
    current_stage = 'ON_HOLD',
    held_at = NOW(),
    hold_reason = p_hold_reason,
    updated_at = NOW()
  WHERE id = p_card_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 6. Create function to resume card from hold
-- ============================================================================

CREATE OR REPLACE FUNCTION resume_production_card(
  p_card_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stage TEXT;
  v_previous_stage TEXT;
  v_tenant_id UUID;
  v_user_tenant_id UUID;
BEGIN
  -- Verify caller has access to this card's tenant (SECURITY: prevent cross-tenant access)
  SELECT tenant_id FROM profiles WHERE id = auth.uid() INTO v_user_tenant_id;

  -- Get current, previous stage and tenant_id
  SELECT current_stage, previous_stage, tenant_id INTO v_current_stage, v_previous_stage, v_tenant_id
  FROM production_cards
  WHERE id = p_card_id;

  IF v_current_stage IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Verify tenant authorization
  IF v_tenant_id != v_user_tenant_id THEN
    RAISE EXCEPTION 'Unauthorized: Card not found or access denied';
  END IF;

  -- Only allow resuming from ON_HOLD
  IF v_current_stage != 'ON_HOLD' THEN
    RAISE EXCEPTION 'Card is not on hold';
  END IF;

  -- If no previous stage recorded, default to INTAKE
  IF v_previous_stage IS NULL THEN
    v_previous_stage := 'INTAKE';
  END IF;

  -- Update card to resume to previous stage
  UPDATE production_cards
  SET
    current_stage = v_previous_stage,
    previous_stage = NULL,
    held_at = NULL,
    hold_reason = NULL,
    updated_at = NOW()
  WHERE id = p_card_id;

  RETURN v_previous_stage;
END;
$$;

-- ============================================================================
-- 7. Create function to cancel production card
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_production_card(
  p_card_id UUID,
  p_cancel_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stage TEXT;
  v_tenant_id UUID;
  v_user_tenant_id UUID;
BEGIN
  -- Verify caller has access to this card's tenant (SECURITY: prevent cross-tenant access)
  SELECT tenant_id FROM profiles WHERE id = auth.uid() INTO v_user_tenant_id;

  -- Get current stage and tenant_id
  SELECT current_stage, tenant_id INTO v_current_stage, v_tenant_id
  FROM production_cards
  WHERE id = p_card_id;

  IF v_current_stage IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Verify tenant authorization
  IF v_tenant_id != v_user_tenant_id THEN
    RAISE EXCEPTION 'Unauthorized: Card not found or access denied';
  END IF;

  -- Don't allow cancelling an already cancelled card
  IF v_current_stage = 'CANCELLED' THEN
    RAISE EXCEPTION 'Card is already cancelled';
  END IF;

  -- Update card to CANCELLED status
  UPDATE production_cards
  SET
    previous_stage = current_stage,
    current_stage = 'CANCELLED',
    cancelled_at = NOW(),
    cancelled_reason = p_cancel_reason,
    -- Also clear any hold status
    held_at = NULL,
    hold_reason = NULL,
    updated_at = NOW()
  WHERE id = p_card_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 8. Grant execute permissions on new functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION hold_production_card(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_production_card(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_production_card(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 9. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN production_cards.hold_reason IS 'Reason for putting the card on hold';
COMMENT ON COLUMN production_cards.cancelled_reason IS 'Reason for cancelling the card';
COMMENT ON COLUMN production_cards.previous_stage IS 'Stage before ON_HOLD or CANCELLED, used for resuming';
COMMENT ON COLUMN production_cards.held_at IS 'Timestamp when card was put on hold';
COMMENT ON COLUMN production_cards.cancelled_at IS 'Timestamp when card was cancelled';

COMMENT ON FUNCTION hold_production_card IS 'Put a production card on hold, preserving the previous stage for later resume';
COMMENT ON FUNCTION resume_production_card IS 'Resume a held production card, returning it to its previous stage';
COMMENT ON FUNCTION cancel_production_card IS 'Cancel a production card, moving it to the CANCELLED stage';
