-- Fix create_revision_from_case to also create a task for the revision

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
  v_task_id UUID;
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
  SELECT c.id, c.order_id, c.subject INTO v_case
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

  -- Create a task for the revision
  INSERT INTO production_tasks (
    tenant_id,
    production_card_id,
    title,
    description,
    stage,
    status,
    assigned_to,
    required_role,
    is_blocking,
    sort_order
  ) VALUES (
    v_tenant_id,
    v_card.id,
    'REVISION: ' || COALESCE(v_case.subject, 'Case Revision'),
    p_description,
    'REVISION',
    'pending',
    v_researcher_l3_id,
    'researcher_level_3',
    true,
    0
  ) RETURNING id INTO v_task_id;

  -- Log to work history if researcher is assigned
  IF v_researcher_l3_id IS NOT NULL THEN
    INSERT INTO resource_work_history (
      tenant_id,
      user_id,
      correction_request_id,
      production_card_id,
      production_task_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_researcher_l3_id,
      v_correction.id,
      v_card.id,
      v_task_id,
      'revision_received',
      'Revision request received from case: ' || LEFT(p_description, 100)
    );
  END IF;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Also fix create_correction_request to create a correction task
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
  v_card RECORD;
  v_card_tenant_id UUID;
  v_correction correction_requests;
  v_source_task RECORD;
  v_assigned_to UUID;
  v_task_id UUID;
  v_task_title TEXT;
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

  -- Get production card
  SELECT pc.id, pc.current_stage, pc.tenant_id
  INTO v_card.id, v_card.current_stage, v_card_tenant_id
  FROM production_cards pc WHERE pc.id = p_card_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'Production card not found';
  END IF;

  -- SECURITY: Validate card belongs to user's tenant
  IF v_card_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Production card does not belong to your tenant';
  END IF;

  -- Get source task info if provided
  IF p_source_task_id IS NOT NULL THEN
    SELECT t.id, t.title, t.assigned_to INTO v_source_task
    FROM production_tasks t WHERE t.id = p_source_task_id;
    v_assigned_to := v_source_task.assigned_to;
    v_task_title := 'CORRECTION: ' || COALESCE(v_source_task.title, 'Task Correction');
  ELSE
    v_task_title := 'CORRECTION: ' || LEFT(p_description, 50);
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
    v_assigned_to,
    v_user_id,
    p_ai_summary
  ) RETURNING * INTO v_correction;

  -- Update production card stage to CORRECTION
  UPDATE production_cards
  SET current_stage = 'CORRECTION',
      updated_at = NOW()
  WHERE id = p_card_id;

  -- Create a task for the correction
  INSERT INTO production_tasks (
    tenant_id,
    production_card_id,
    title,
    description,
    stage,
    status,
    assigned_to,
    is_blocking,
    sort_order
  ) VALUES (
    v_tenant_id,
    p_card_id,
    v_task_title,
    p_description,
    'CORRECTION',
    'pending',
    v_assigned_to,
    true,
    0
  ) RETURNING id INTO v_task_id;

  -- Log to work history if assigned
  IF v_assigned_to IS NOT NULL THEN
    INSERT INTO resource_work_history (
      tenant_id,
      user_id,
      correction_request_id,
      production_card_id,
      production_task_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_assigned_to,
      v_correction.id,
      p_card_id,
      v_task_id,
      'correction_received',
      'Correction request: ' || LEFT(p_description, 100)
    );
  END IF;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
