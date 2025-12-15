-- =============================================
-- Fix merge_clients to handle invoices
-- =============================================
-- Bug: Merging clients fails with "invoices_client_id_fkey" foreign key violation
-- because invoices are not transferred before deleting the loser client.
--
-- The invoices table uses ON DELETE RESTRICT, so we must transfer all invoices
-- to the winner client before attempting to delete the loser.

/**
 * Merge two clients (companies) into one canonical client
 * Transfers all contacts, orders, invoices, and related records from loser to winner
 *
 * TRANSACTION NOTE: This function is automatically wrapped in a transaction by PostgreSQL.
 * If any error occurs during execution, all changes will be rolled back automatically.
 *
 * SECURITY NOTE: Validates that both clients belong to the same organization before merging.
 *
 * @param p_winner_id - Client ID to keep
 * @param p_loser_id - Client ID to delete
 * @returns JSONB with merge results and counts
 */
CREATE OR REPLACE FUNCTION public.merge_clients(
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_winner RECORD;
  v_loser RECORD;
  v_contacts_count INTEGER := 0;
  v_orders_count INTEGER := 0;
  v_properties_count INTEGER := 0;
  v_activities_count INTEGER := 0;
  v_deals_count INTEGER := 0;
  v_tasks_count INTEGER := 0;
  v_cases_count INTEGER := 0;
  v_company_history_count INTEGER := 0;
  v_invoices_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_winner_id = p_loser_id THEN
    RAISE EXCEPTION 'Cannot merge client with itself';
  END IF;

  -- Get both clients
  SELECT * INTO v_winner FROM public.clients WHERE id = p_winner_id;
  SELECT * INTO v_loser FROM public.clients WHERE id = p_loser_id;

  IF v_winner IS NULL THEN
    RAISE EXCEPTION 'Winner client not found: %', p_winner_id;
  END IF;

  IF v_loser IS NULL THEN
    RAISE EXCEPTION 'Loser client not found: %', p_loser_id;
  END IF;

  -- SECURITY: Verify both clients belong to the same organization
  IF v_winner.org_id != v_loser.org_id THEN
    RAISE EXCEPTION 'Cannot merge clients from different organizations (winner org: %, loser org: %)',
      v_winner.org_id, v_loser.org_id;
  END IF;

  -- =============================================
  -- Re-link dependent records from loser to winner
  -- =============================================

  -- 1. Contacts (primary records to transfer)
  UPDATE public.contacts
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_contacts_count = ROW_COUNT;

  -- 2. Contact-Company History
  -- Update all company history entries to point to winner
  UPDATE public.contact_companies
  SET company_id = p_winner_id, updated_at = NOW()
  WHERE company_id = p_loser_id;
  GET DIAGNOSTICS v_company_history_count = ROW_COUNT;

  -- 3. Orders
  UPDATE public.orders
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_orders_count = ROW_COUNT;

  -- 4. Properties
  UPDATE public.properties
  SET org_id = p_winner_id, updated_at = NOW()
  WHERE org_id = p_loser_id;
  GET DIAGNOSTICS v_properties_count = ROW_COUNT;

  -- 5. Activities (client-level activities)
  UPDATE public.activities
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_activities_count = ROW_COUNT;

  -- 6. Deals
  UPDATE public.deals
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_deals_count = ROW_COUNT;

  -- 7. Tasks
  UPDATE public.tasks
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_tasks_count = ROW_COUNT;

  -- 8. Cases
  UPDATE public.cases
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_cases_count = ROW_COUNT;

  -- 9. Invoices (CRITICAL: must be transferred before delete due to ON DELETE RESTRICT)
  UPDATE public.invoices
  SET client_id = p_winner_id, updated_at = NOW()
  WHERE client_id = p_loser_id;
  GET DIAGNOSTICS v_invoices_count = ROW_COUNT;

  -- =============================================
  -- Update winner with merged data
  -- =============================================

  UPDATE public.clients
  SET
    -- Preserve loser's data if winner doesn't have it
    domain = COALESCE(v_winner.domain, v_loser.domain),
    phone = COALESCE(v_winner.phone, v_loser.phone),
    address = COALESCE(v_winner.address, v_loser.address),
    billing_address = COALESCE(v_winner.billing_address, v_loser.billing_address),
    email = COALESCE(v_winner.email, v_loser.email),
    updated_at = NOW()
  WHERE id = p_winner_id;

  -- =============================================
  -- Log audit record before deletion (USPAP compliance)
  -- =============================================

  INSERT INTO public.merge_audit (
    merge_type,
    winner_id,
    loser_id,
    loser_data,
    merged_by,
    merged_at,
    counts,
    org_id
  ) VALUES (
    'client',
    p_winner_id,
    p_loser_id,
    to_jsonb(v_loser),
    auth.uid(), -- Current user performing the merge
    NOW(),
    jsonb_build_object(
      'contacts', v_contacts_count,
      'company_history', v_company_history_count,
      'orders', v_orders_count,
      'properties', v_properties_count,
      'activities', v_activities_count,
      'deals', v_deals_count,
      'tasks', v_tasks_count,
      'cases', v_cases_count,
      'invoices', v_invoices_count
    ),
    v_winner.org_id
  );

  -- =============================================
  -- Delete loser client
  -- =============================================

  DELETE FROM public.clients WHERE id = p_loser_id;

  -- =============================================
  -- Build result
  -- =============================================

  v_result := jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'merged_at', NOW(),
    'counts', jsonb_build_object(
      'contacts', v_contacts_count,
      'company_history', v_company_history_count,
      'orders', v_orders_count,
      'properties', v_properties_count,
      'activities', v_activities_count,
      'deals', v_deals_count,
      'tasks', v_tasks_count,
      'cases', v_cases_count,
      'invoices', v_invoices_count
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.merge_clients IS 'Merges two clients into one, transferring all contacts, orders, invoices, and related records';
