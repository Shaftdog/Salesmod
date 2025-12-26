-- Fix create_revision_from_case function
-- The cases table doesn't have tenant_id column, so we validate via production card only

CREATE OR REPLACE FUNCTION create_revision_from_case(
  p_case_id UUID,
  p_description TEXT DEFAULT '',
  p_severity TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_case RECORD;
  v_card RECORD;
  v_correction correction_requests;
  v_researcher_l3_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get tenant_id from user profile
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_user_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User has no tenant';
  END IF;

  -- Get case with order (cases table doesn't have tenant_id)
  SELECT c.id, c.order_id INTO v_case
  FROM cases c WHERE c.id = p_case_id;

  IF v_case.id IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF v_case.order_id IS NULL THEN
    RAISE EXCEPTION 'Case has no linked order';
  END IF;

  -- Get production card for order - validate tenant via the card
  SELECT pc.id, pc.current_stage, pc.tenant_id, pc.assigned_researcher_level_3_id
  INTO v_card
  FROM production_cards pc WHERE pc.order_id = v_case.order_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'No production card found for this order';
  END IF;

  -- SECURITY: Validate production card belongs to user's tenant
  IF v_card.tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Production card does not belong to your tenant';
  END IF;

  v_researcher_l3_id := v_card.assigned_researcher_level_3_id;

  -- Create the revision request
  INSERT INTO correction_requests (
    tenant_id,
    production_card_id,
    case_id,
    request_type,
    status,
    description,
    severity,
    category,
    previous_stage,
    assigned_to,
    requested_by,
    ai_summary
  ) VALUES (
    v_tenant_id,
    v_card.id,
    p_case_id,
    'revision',
    'pending',
    p_description,
    p_severity,
    p_category,
    v_card.current_stage,
    v_researcher_l3_id,
    v_user_id,
    p_ai_summary
  ) RETURNING * INTO v_correction;

  -- Update production card stage to REVISION
  UPDATE production_cards
  SET current_stage = 'REVISION',
      updated_at = NOW()
  WHERE id = v_card.id;

  -- Log to work history if researcher is assigned
  IF v_researcher_l3_id IS NOT NULL THEN
    INSERT INTO resource_work_history (
      tenant_id,
      user_id,
      correction_request_id,
      production_card_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_researcher_l3_id,
      v_correction.id,
      v_card.id,
      'revision_received',
      'Revision request received from case: ' || LEFT(p_description, 100)
    );
  END IF;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
