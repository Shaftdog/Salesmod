-- Fix orphaned org_ids in profiles table
-- The org_id FK references profiles(id), but some org_ids point to deleted profiles

-- Step 1: Drop the FK constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_org_id_fkey;

-- Step 2: Update orphaned org_ids to valid profile IDs within the same tenant
-- For each tenant, use the first valid profile ID as the org_id
UPDATE profiles p
SET org_id = (
  SELECT id FROM profiles p2
  WHERE p2.tenant_id = p.tenant_id
  AND p2.id IN (SELECT id FROM profiles)
  LIMIT 1
)
WHERE org_id IS NOT NULL
AND org_id NOT IN (SELECT id FROM profiles);

-- Step 3: For any remaining NULL org_ids, set to self or first profile in tenant
UPDATE profiles p
SET org_id = COALESCE(
  (SELECT id FROM profiles p2 WHERE p2.tenant_id = p.tenant_id LIMIT 1),
  p.id
)
WHERE org_id IS NULL;

-- Step 4: Re-add the FK constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_org_id_fkey
FOREIGN KEY (org_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 5: Update the create_revision_from_case function to handle invalid org_ids
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

  -- FIXED: Validate org_id exists in profiles, otherwise get a valid one
  IF v_org_id IS NOT NULL THEN
    PERFORM 1 FROM profiles WHERE id = v_org_id;
    IF NOT FOUND THEN
      v_org_id := NULL; -- Mark as invalid so we get a valid one below
    END IF;
  END IF;

  -- If org_id is NULL or invalid, get a valid one from existing production cards or profiles
  IF v_org_id IS NULL THEN
    -- Try to get from existing production card in this tenant
    SELECT pc.org_id INTO v_org_id
    FROM production_cards pc
    WHERE pc.tenant_id = v_tenant_id
    AND pc.org_id IN (SELECT id FROM profiles)
    LIMIT 1;

    -- If still NULL, use any profile in this tenant
    IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id
      FROM profiles
      WHERE tenant_id = v_tenant_id
      LIMIT 1;
    END IF;
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
'Creates a revision request from a case. Auto-creates a production card if one does not exist. Fixed to handle invalid org_ids.';
