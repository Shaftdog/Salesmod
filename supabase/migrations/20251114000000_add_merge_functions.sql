-- =============================================
-- Contact and Client Merge Functions
-- Handles merging duplicate contacts and clients
-- =============================================

-- =============================================
-- 0. Audit Table for USPAP Compliance
-- =============================================

/**
 * Audit table for tracking merge operations
 * Required for USPAP compliance and data integrity tracking
 */
CREATE TABLE IF NOT EXISTS public.merge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merge_type TEXT NOT NULL CHECK (merge_type IN ('contact', 'client')),
  winner_id UUID NOT NULL,
  loser_id UUID NOT NULL,
  loser_data JSONB NOT NULL, -- Snapshot of deleted record before merge
  merged_by UUID REFERENCES auth.users(id),
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counts JSONB, -- Counts of updated records (activities, orders, etc.)
  org_id UUID NOT NULL, -- Organization for filtering and security
  CONSTRAINT unique_merge_operation UNIQUE (merge_type, winner_id, loser_id, merged_at)
);

-- Index for querying audit history
CREATE INDEX IF NOT EXISTS idx_merge_audit_winner ON public.merge_audit(merge_type, winner_id);
CREATE INDEX IF NOT EXISTS idx_merge_audit_loser ON public.merge_audit(merge_type, loser_id);
CREATE INDEX IF NOT EXISTS idx_merge_audit_org ON public.merge_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_merge_audit_date ON public.merge_audit(merged_at DESC);

-- Enable RLS on audit table
ALTER TABLE public.merge_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit records for their organization
DROP POLICY IF EXISTS select_merge_audit ON public.merge_audit;
CREATE POLICY select_merge_audit ON public.merge_audit
  FOR SELECT
  USING (org_id = auth.uid());

COMMENT ON TABLE public.merge_audit IS 'Audit trail for contact and client merge operations (USPAP compliance)';

-- =============================================
-- 1. Contact Merge Function
-- =============================================

/**
 * Merge two contacts into one canonical contact
 * Re-links all dependent records from loser to winner, then deletes loser
 *
 * TRANSACTION NOTE: This function is automatically wrapped in a transaction by PostgreSQL.
 * If any error occurs during execution, all changes will be rolled back automatically.
 *
 * SECURITY NOTE: Validates that both contacts belong to the same organization before merging.
 *
 * @param p_winner_id - Contact ID to keep
 * @param p_loser_id - Contact ID to delete
 * @returns JSONB with merge results and counts
 */
CREATE OR REPLACE FUNCTION public.merge_contacts(
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_winner RECORD;
  v_loser RECORD;
  v_activities_count INTEGER := 0;
  v_suppressions_count INTEGER := 0;
  v_notifications_count INTEGER := 0;
  v_cards_count INTEGER := 0;
  v_deals_count INTEGER := 0;
  v_tasks_count INTEGER := 0;
  v_cases_count INTEGER := 0;
  v_company_history_count INTEGER := 0;
  v_merged_tags JSONB;
  v_merged_notes TEXT;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_winner_id = p_loser_id THEN
    RAISE EXCEPTION 'Cannot merge contact with itself';
  END IF;

  -- Get both contacts with their organization IDs
  SELECT c.*, cl.org_id
  INTO v_winner
  FROM public.contacts c
  JOIN public.clients cl ON c.client_id = cl.id
  WHERE c.id = p_winner_id;

  SELECT c.*, cl.org_id
  INTO v_loser
  FROM public.contacts c
  JOIN public.clients cl ON c.client_id = cl.id
  WHERE c.id = p_loser_id;

  IF v_winner IS NULL THEN
    RAISE EXCEPTION 'Winner contact not found: %', p_winner_id;
  END IF;

  IF v_loser IS NULL THEN
    RAISE EXCEPTION 'Loser contact not found: %', p_loser_id;
  END IF;

  -- SECURITY: Verify both contacts belong to the same organization
  IF v_winner.org_id != v_loser.org_id THEN
    RAISE EXCEPTION 'Cannot merge contacts from different organizations (winner org: %, loser org: %)',
      v_winner.org_id, v_loser.org_id;
  END IF;

  -- =============================================
  -- Re-link dependent records from loser to winner
  -- =============================================

  -- 1. Activities
  UPDATE public.activities
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_activities_count = ROW_COUNT;

  -- 2. Email Suppressions (handle unique constraint)
  -- Delete loser suppressions if winner already has one for that org
  DELETE FROM public.email_suppressions es1
  WHERE es1.contact_id = p_loser_id
    AND EXISTS (
      SELECT 1 FROM public.email_suppressions es2
      WHERE es2.contact_id = p_winner_id
        AND es2.org_id = es1.org_id
    );

  -- Transfer remaining suppressions
  UPDATE public.email_suppressions
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_suppressions_count = ROW_COUNT;

  -- 3. Email Notifications
  UPDATE public.email_notifications
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_notifications_count = ROW_COUNT;

  -- 4. Kanban Cards
  UPDATE public.kanban_cards
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_cards_count = ROW_COUNT;

  -- 5. Deals
  UPDATE public.deals
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_deals_count = ROW_COUNT;

  -- 6. Tasks
  UPDATE public.tasks
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_tasks_count = ROW_COUNT;

  -- 7. Cases
  UPDATE public.cases
  SET contact_id = p_winner_id, updated_at = NOW()
  WHERE contact_id = p_loser_id;
  GET DIAGNOSTICS v_cases_count = ROW_COUNT;

  -- 8. Contact-Company History
  -- Transfer all company history from loser to winner
  -- Handle potential duplicates by updating end_date if conflict
  UPDATE public.contact_companies
  SET contact_id = p_winner_id,
      reason_for_leaving = COALESCE(reason_for_leaving, 'Merged from duplicate contact'),
      updated_at = NOW()
  WHERE contact_id = p_loser_id
    AND NOT EXISTS (
      -- Skip if winner already has same company/start_date
      SELECT 1 FROM public.contact_companies cc2
      WHERE cc2.contact_id = p_winner_id
        AND cc2.company_id = contact_companies.company_id
        AND cc2.start_date = contact_companies.start_date
    );
  GET DIAGNOSTICS v_company_history_count = ROW_COUNT;

  -- Delete any remaining duplicate history entries
  DELETE FROM public.contact_companies
  WHERE contact_id = p_loser_id;

  -- =============================================
  -- Merge metadata (tags, notes)
  -- =============================================

  -- Merge tags (combine both arrays, remove duplicates)
  SELECT jsonb_agg(DISTINCT tag)
  INTO v_merged_tags
  FROM (
    SELECT jsonb_array_elements_text(COALESCE(v_winner.tags, '[]'::jsonb)) as tag
    UNION
    SELECT jsonb_array_elements_text(COALESCE(v_loser.tags, '[]'::jsonb)) as tag
  ) all_tags;

  -- Merge notes (concatenate with separator)
  v_merged_notes := v_winner.notes;
  IF v_loser.notes IS NOT NULL AND v_loser.notes != '' THEN
    IF v_merged_notes IS NOT NULL AND v_merged_notes != '' THEN
      v_merged_notes := v_merged_notes || E'\n\n--- Merged from duplicate contact ---\n' || v_loser.notes;
    ELSE
      v_merged_notes := v_loser.notes;
    END IF;
  END IF;

  -- =============================================
  -- Update winner with merged data
  -- =============================================

  UPDATE public.contacts
  SET
    tags = v_merged_tags,
    notes = v_merged_notes,
    -- Preserve loser's email if winner doesn't have one
    email = COALESCE(v_winner.email, v_loser.email),
    phone = COALESCE(v_winner.phone, v_loser.phone),
    mobile = COALESCE(v_winner.mobile, v_loser.mobile),
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
    'contact',
    p_winner_id,
    p_loser_id,
    to_jsonb(v_loser),
    auth.uid(), -- Current user performing the merge
    NOW(),
    jsonb_build_object(
      'activities', v_activities_count,
      'email_suppressions', v_suppressions_count,
      'email_notifications', v_notifications_count,
      'kanban_cards', v_cards_count,
      'deals', v_deals_count,
      'tasks', v_tasks_count,
      'cases', v_cases_count,
      'company_history', v_company_history_count
    ),
    v_winner.org_id
  );

  -- =============================================
  -- Delete loser contact
  -- =============================================

  DELETE FROM public.contacts WHERE id = p_loser_id;

  -- =============================================
  -- Build result
  -- =============================================

  v_result := jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'merged_at', NOW(),
    'counts', jsonb_build_object(
      'activities', v_activities_count,
      'email_suppressions', v_suppressions_count,
      'email_notifications', v_notifications_count,
      'kanban_cards', v_cards_count,
      'deals', v_deals_count,
      'tasks', v_tasks_count,
      'cases', v_cases_count,
      'company_history', v_company_history_count
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. Client Merge Function
-- =============================================

/**
 * Merge two clients (companies) into one canonical client
 * Transfers all contacts, orders, and related records from loser to winner
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
      'cases', v_cases_count
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
      'cases', v_cases_count
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. Helper Functions
-- =============================================

/**
 * Find potential duplicate contacts based on email or name similarity
 * Returns contacts that might be duplicates for review
 */
CREATE OR REPLACE FUNCTION public.find_duplicate_contacts(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  contact1_id UUID,
  contact1_name TEXT,
  contact1_email TEXT,
  contact2_id UUID,
  contact2_name TEXT,
  contact2_email TEXT,
  match_type TEXT,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- Find exact email matches
  SELECT
    c1.id as contact1_id,
    c1.first_name || ' ' || c1.last_name as contact1_name,
    c1.email as contact1_email,
    c2.id as contact2_id,
    c2.first_name || ' ' || c2.last_name as contact2_name,
    c2.email as contact2_email,
    'exact_email'::TEXT as match_type,
    1.0::NUMERIC as similarity_score
  FROM public.contacts c1
  JOIN public.contacts c2 ON
    lower(c1.email) = lower(c2.email)
    AND c1.id < c2.id  -- Avoid duplicates and self-matches
  JOIN public.clients cl1 ON c1.client_id = cl1.id
  JOIN public.clients cl2 ON c2.client_id = cl2.id
  WHERE (cl1.org_id = p_org_id OR cl2.org_id = p_org_id)
    AND c1.email IS NOT NULL
    AND c1.email != ''
    -- Exclude system placeholders from client names
    AND cl1.company_name NOT LIKE '[%'
    AND cl2.company_name NOT LIKE '[%'

  UNION ALL

  -- Find similar names with same client
  SELECT
    c1.id as contact1_id,
    c1.first_name || ' ' || c1.last_name as contact1_name,
    c1.email as contact1_email,
    c2.id as contact2_id,
    c2.first_name || ' ' || c2.last_name as contact2_name,
    c2.email as contact2_email,
    'similar_name_same_client'::TEXT as match_type,
    similarity(
      lower(c1.first_name || ' ' || c1.last_name),
      lower(c2.first_name || ' ' || c2.last_name)
    )::NUMERIC as similarity_score
  FROM public.contacts c1
  JOIN public.contacts c2 ON
    c1.client_id = c2.client_id
    AND c1.id < c2.id
  JOIN public.clients cl ON c1.client_id = cl.id
  WHERE cl.org_id = p_org_id
    -- Exclude system placeholders from client names
    AND cl.company_name NOT LIKE '[%'
    AND similarity(
      lower(c1.first_name || ' ' || c1.last_name),
      lower(c2.first_name || ' ' || c2.last_name)
    ) > 0.6

  ORDER BY similarity_score DESC, match_type
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Find potential duplicate clients based on name or domain similarity
 * Returns clients that might be duplicates for review
 */
CREATE OR REPLACE FUNCTION public.find_duplicate_clients(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  client1_id UUID,
  client1_name TEXT,
  client1_domain TEXT,
  client2_id UUID,
  client2_name TEXT,
  client2_domain TEXT,
  match_type TEXT,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- Find exact domain matches
  SELECT
    cl1.id as client1_id,
    cl1.company_name as client1_name,
    cl1.domain as client1_domain,
    cl2.id as client2_id,
    cl2.company_name as client2_name,
    cl2.domain as client2_domain,
    'exact_domain'::TEXT as match_type,
    1.0::NUMERIC as similarity_score
  FROM public.clients cl1
  JOIN public.clients cl2 ON
    lower(cl1.domain) = lower(cl2.domain)
    AND cl1.id < cl2.id
  WHERE (cl1.org_id = p_org_id OR cl2.org_id = p_org_id)
    AND cl1.domain IS NOT NULL
    AND cl1.domain != ''
    -- Exclude system placeholders (names starting with '[')
    AND cl1.company_name NOT LIKE '[%'
    AND cl2.company_name NOT LIKE '[%'

  UNION ALL

  -- Find similar company names in same org
  SELECT
    cl1.id as client1_id,
    cl1.company_name as client1_name,
    cl1.domain as client1_domain,
    cl2.id as client2_id,
    cl2.company_name as client2_name,
    cl2.domain as client2_domain,
    'similar_name'::TEXT as match_type,
    similarity(
      lower(cl1.company_name),
      lower(cl2.company_name)
    )::NUMERIC as similarity_score
  FROM public.clients cl1
  JOIN public.clients cl2 ON
    cl1.org_id = cl2.org_id
    AND cl1.id < cl2.id
  WHERE cl1.org_id = p_org_id
    -- Exclude system placeholders (names starting with '[')
    AND cl1.company_name NOT LIKE '[%'
    AND cl2.company_name NOT LIKE '[%'
    AND similarity(
      lower(cl1.company_name),
      lower(cl2.company_name)
    ) > 0.7

  ORDER BY similarity_score DESC, match_type
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. Performance Indexes
-- =============================================

-- Enable trigram extension for similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for clients company name similarity search
-- Used by find_duplicate_clients for fast similarity() lookups
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm
  ON public.clients USING gin(lower(company_name) gin_trgm_ops);

-- Index for clients domain lookup
-- Used by find_duplicate_clients for exact domain matching
CREATE INDEX IF NOT EXISTS idx_clients_domain_lower
  ON public.clients(lower(domain))
  WHERE domain IS NOT NULL AND domain != '';

-- Index for contacts name similarity search
-- Used by find_duplicate_contacts for fast similarity() lookups
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON public.contacts USING gin(
    lower(first_name || ' ' || last_name) gin_trgm_ops
  );

-- Index for contacts email lookup
-- Used by find_duplicate_contacts for exact email matching
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower
  ON public.contacts(lower(email))
  WHERE email IS NOT NULL AND email != '';

-- =============================================
-- 5. Comments
-- =============================================

COMMENT ON FUNCTION public.merge_contacts IS 'Merges two contacts into one, re-linking all dependent records and preserving history';
COMMENT ON FUNCTION public.merge_clients IS 'Merges two clients into one, transferring all contacts, orders, and related records';
COMMENT ON FUNCTION public.find_duplicate_contacts IS 'Finds potential duplicate contacts based on email or name similarity';
COMMENT ON FUNCTION public.find_duplicate_clients IS 'Finds potential duplicate clients based on domain or name similarity';
