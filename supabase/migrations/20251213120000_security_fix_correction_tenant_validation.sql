-- Security Fix: Add tenant validation to correction request functions
-- Applied: 2025-12-13
-- This migration adds critical tenant isolation checks to prevent cross-tenant data access

-- Fix: Add tenant validation to create_correction_request
CREATE OR REPLACE FUNCTION create_correction_request(
  p_card_id UUID,
  p_source_task_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_severity TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_card_tenant_id UUID;
  v_card RECORD;
  v_correction correction_requests;
  v_task_assigned_to UUID;
  v_reviewer_id UUID;
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

  -- SECURITY: Validate card belongs to user's tenant
  SELECT pc.tenant_id, pc.id, pc.current_stage, pc.assigned_reviewer_id
  INTO v_card_tenant_id, v_card.id, v_card.current_stage, v_reviewer_id
  FROM production_cards pc WHERE pc.id = p_card_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Production card not found';
  END IF;

  IF v_card_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Card does not belong to your tenant';
  END IF;

  -- Get assigned user from source task if provided
  IF p_source_task_id IS NOT NULL THEN
    SELECT assigned_to INTO v_task_assigned_to
    FROM production_tasks WHERE id = p_source_task_id;
  END IF;

  -- Create the correction request
  INSERT INTO correction_requests (
    tenant_id,
    production_card_id,
    source_task_id,
    request_type,
    status,
    description,
    severity,
    category,
    previous_stage,
    assigned_to,
    reviewer_id,
    requested_by,
    ai_summary
  ) VALUES (
    v_tenant_id,
    p_card_id,
    p_source_task_id,
    'correction',
    'pending',
    p_description,
    p_severity,
    p_category,
    v_card.current_stage,
    v_task_assigned_to,
    v_reviewer_id,
    v_user_id,
    p_ai_summary
  )
  RETURNING * INTO v_correction;

  -- Move card to CORRECTION stage
  UPDATE production_cards
  SET current_stage = 'CORRECTION', updated_at = NOW()
  WHERE id = p_card_id;

  -- Create correction task
  INSERT INTO production_tasks (
    production_card_id,
    title,
    description,
    stage,
    role,
    assigned_to,
    status,
    is_required
  ) VALUES (
    p_card_id,
    'Correction: ' || SUBSTRING(p_description, 1, 50),
    p_description,
    'CORRECTION',
    'appraiser',
    v_task_assigned_to,
    'pending',
    true
  );

  -- Log to work history
  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary
  )
  SELECT
    v_tenant_id,
    pr.id,
    v_task_assigned_to,
    v_correction.id,
    p_card_id,
    'correction_received',
    'Received correction request: ' || SUBSTRING(p_description, 1, 100)
  FROM production_resources pr
  WHERE pr.user_id = v_task_assigned_to
  AND v_task_assigned_to IS NOT NULL;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix create_revision_from_case with tenant validation
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
  v_card_tenant_id UUID;
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

  -- Get case with order
  SELECT c.id, c.order_id, c.tenant_id INTO v_case
  FROM cases c WHERE c.id = p_case_id;

  IF v_case.id IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF v_case.order_id IS NULL THEN
    RAISE EXCEPTION 'Case has no linked order';
  END IF;

  -- SECURITY: Validate case belongs to user's tenant
  IF v_case.tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Case does not belong to your tenant';
  END IF;

  -- Get production card for order
  SELECT pc.id, pc.current_stage, pc.tenant_id, pc.assigned_researcher_level_3_id
  INTO v_card.id, v_card.current_stage, v_card_tenant_id, v_researcher_l3_id
  FROM production_cards pc WHERE pc.order_id = v_case.order_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'No production card found for this order';
  END IF;

  -- SECURITY: Double-check card tenant
  IF v_card_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Production card does not belong to your tenant';
  END IF;

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
  )
  RETURNING * INTO v_correction;

  -- Move card to REVISION stage
  UPDATE production_cards
  SET current_stage = 'REVISION', updated_at = NOW()
  WHERE id = v_card.id;

  -- Create revision task
  INSERT INTO production_tasks (
    production_card_id,
    title,
    description,
    stage,
    role,
    assigned_to,
    status,
    is_required
  ) VALUES (
    v_card.id,
    'Revision: ' || SUBSTRING(p_description, 1, 50),
    p_description,
    'REVISION',
    'researcher_level_3',
    v_researcher_l3_id,
    'pending',
    true
  );

  -- Log to work history
  INSERT INTO resource_work_history (
    tenant_id,
    resource_id,
    user_id,
    correction_request_id,
    production_card_id,
    event_type,
    summary
  )
  SELECT
    v_tenant_id,
    pr.id,
    v_researcher_l3_id,
    v_correction.id,
    v_card.id,
    'revision_received',
    'Received revision request from case: ' || SUBSTRING(p_description, 1, 100)
  FROM production_resources pr
  WHERE pr.user_id = v_researcher_l3_id
  AND v_researcher_l3_id IS NOT NULL;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add composite index for reviewer status queries
CREATE INDEX IF NOT EXISTS idx_correction_requests_reviewer_status
  ON correction_requests(reviewer_id, status);

-- Add index for profiles tenant lookup in RLS
CREATE INDEX IF NOT EXISTS idx_profiles_id_tenant
  ON profiles(id, tenant_id);
