-- Auto-create production card if one doesn't exist when creating a revision
-- This ensures revisions can be created from cases even if the order wasn't in production

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
  v_org_id UUID;
  v_case RECORD;
  v_card RECORD;
  v_correction correction_requests;
  v_researcher_l3_id UUID;
  v_task_id UUID;
  v_default_template_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get tenant_id and org_id from user profile
  SELECT p.tenant_id, p.org_id INTO v_tenant_id, v_org_id
  FROM profiles p WHERE p.id = v_user_id;

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

  -- Try to get existing production card for order
  SELECT pc.id, pc.current_stage, pc.tenant_id, pc.assigned_researcher_level_3_id
  INTO v_card
  FROM production_cards pc WHERE pc.order_id = v_case.order_id;

  -- If no production card exists, create one
  IF v_card.id IS NULL THEN
    -- Get default template for this tenant
    SELECT pt.id INTO v_default_template_id
    FROM production_templates pt 
    WHERE pt.tenant_id = v_tenant_id 
      AND pt.is_default = true
    LIMIT 1;

    -- If no default template, get any template
    IF v_default_template_id IS NULL THEN
      SELECT pt.id INTO v_default_template_id
      FROM production_templates pt 
      WHERE pt.tenant_id = v_tenant_id
      LIMIT 1;
    END IF;

    -- If user doesn't have org_id, get it from another source
    IF v_org_id IS NULL THEN
      SELECT pc.org_id INTO v_org_id
      FROM production_cards pc
      WHERE pc.tenant_id = v_tenant_id
      LIMIT 1;
    END IF;

    -- Create the production card
    INSERT INTO production_cards (
      tenant_id,
      org_id,
      order_id,
      template_id,
      current_stage,
      priority
    ) VALUES (
      v_tenant_id,
      v_org_id,
      v_case.order_id,
      v_default_template_id,
      'DELIVERED',  -- Assume delivered since we're creating a revision
      'normal'
    ) RETURNING id, current_stage, tenant_id, assigned_researcher_level_3_id
    INTO v_card;
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

  -- Create a task for the revision (using correct column names)
  INSERT INTO production_tasks (
    tenant_id,
    production_card_id,
    title,
    description,
    stage,
    status,
    assigned_to,
    role,
    is_required,
    sort_order
  ) VALUES (
    v_tenant_id,
    v_card.id,
    'REVISION: ' || COALESCE(v_case.subject, 'Case Revision'),
    p_description,
    'REVISION',
    'pending',
    v_researcher_l3_id,
    'appraiser',
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

COMMENT ON FUNCTION create_revision_from_case IS 
'Creates a revision request from a case. Auto-creates a production card if one does not exist for the linked order.';
