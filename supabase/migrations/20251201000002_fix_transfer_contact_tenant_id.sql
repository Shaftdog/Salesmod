-- =============================================
-- Fix: Update transfer_contact_company function for tenant_id
-- The function was updating client_id but not tenant_id
-- This causes RLS violations when contact's tenant_id doesn't match
-- Created: 2025-12-01
-- =============================================

-- Drop and recreate the function with tenant_id support
CREATE OR REPLACE FUNCTION public.transfer_contact_company(
  p_contact_id UUID,
  p_new_company_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_company_id UUID;
  v_contact_title TEXT;
  v_contact_tenant_id UUID;
  v_new_company_tenant_id UUID;
  v_result JSONB;
BEGIN
  -- Get current company, title, and tenant_id
  SELECT client_id, title, tenant_id
  INTO v_old_company_id, v_contact_title, v_contact_tenant_id
  FROM public.contacts
  WHERE id = p_contact_id;

  -- Get tenant_id of the new company
  SELECT tenant_id INTO v_new_company_tenant_id
  FROM public.clients
  WHERE id = p_new_company_id;

  -- Security check: Ensure both contact and new company belong to the same tenant
  -- OR the contact is being assigned a tenant_id for the first time
  IF v_contact_tenant_id IS NOT NULL
     AND v_new_company_tenant_id IS NOT NULL
     AND v_contact_tenant_id != v_new_company_tenant_id THEN
    RAISE EXCEPTION 'Cannot transfer contact across tenants. Contact tenant: %, Company tenant: %',
      v_contact_tenant_id, v_new_company_tenant_id;
  END IF;

  -- Close out old company relationship if exists
  IF v_old_company_id IS NOT NULL THEN
    UPDATE public.contact_companies
    SET
      end_date = CURRENT_DATE,
      is_primary = false,
      reason_for_leaving = p_reason,
      updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND company_id = v_old_company_id
      AND end_date IS NULL;
  END IF;

  -- Create new company relationship
  INSERT INTO public.contact_companies (
    contact_id,
    company_id,
    title,
    role,
    is_primary,
    start_date
  ) VALUES (
    p_contact_id,
    p_new_company_id,
    v_contact_title,
    'employee',
    true,
    CURRENT_DATE
  )
  ON CONFLICT (contact_id, company_id, start_date)
  DO UPDATE SET
    is_primary = true,
    end_date = NULL,
    updated_at = NOW();

  -- Update current company AND tenant_id on contact
  -- tenant_id is updated to match the new company's tenant_id
  UPDATE public.contacts
  SET
    client_id = p_new_company_id,
    tenant_id = COALESCE(v_new_company_tenant_id, tenant_id),
    updated_at = NOW()
  WHERE id = p_contact_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'contact_id', p_contact_id,
    'old_company_id', v_old_company_id,
    'new_company_id', p_new_company_id,
    'tenant_id', COALESCE(v_new_company_tenant_id, v_contact_tenant_id),
    'transferred_at', CURRENT_DATE
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.transfer_contact_company IS
  'Atomically transfers a contact to a new company while preserving history. Updates tenant_id to match new company. Validates both belong to same tenant.';
