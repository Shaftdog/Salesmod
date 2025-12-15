-- =============================================
-- Phase 3.2: Backfill tenant_id (Part 2)
-- Backfills tenant_id from user profiles via org_id
--
-- Tables in this batch:
-- - Agent System (5 tables)
-- - Marketing & Campaigns (2 tables)
-- - Invoicing & Products (3 tables)
-- - Goals, OAuth, Field Services, Reputation, Webinars, Contact Attempts
-- =============================================

-- =============================================
-- AGENT SYSTEM
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Agent Runs
  UPDATE public.agent_runs ar
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE ar.org_id = p.id
    AND ar.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % agent_runs from org_id → user tenant', v_updated_count;

  -- Agent Memories
  UPDATE public.agent_memories am
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE am.org_id = p.id
    AND am.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % agent_memories from org_id → user tenant', v_updated_count;

  -- Agent Reflections (via parent agent_run)
  UPDATE public.agent_reflections ar
  SET tenant_id = agr.tenant_id
  FROM public.agent_runs agr
  WHERE ar.run_id = agr.id
    AND ar.tenant_id IS NULL
    AND agr.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % agent_reflections from parent agent_run', v_updated_count;

  -- Agent Settings
  UPDATE public.agent_settings ags
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE ags.org_id = p.id
    AND ags.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % agent_settings from org_id → user tenant', v_updated_count;

  -- Email Suppressions
  UPDATE public.email_suppressions es
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE es.org_id = p.id
    AND es.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % email_suppressions from org_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- MARKETING & CAMPAIGNS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Campaigns
  UPDATE public.campaigns c
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE c.org_id = p.id
    AND c.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % campaigns from org_id → user tenant', v_updated_count;

  -- Campaign Contacts (via parent campaign)
  UPDATE public.campaign_contacts cc
  SET tenant_id = c.tenant_id
  FROM public.campaigns c
  WHERE cc.campaign_id = c.id
    AND cc.tenant_id IS NULL
    AND c.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % campaign_contacts from parent campaign', v_updated_count;
END $$;

-- =============================================
-- INVOICING & PRODUCTS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Invoices
  UPDATE public.invoices i
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE i.org_id = p.id
    AND i.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % invoices from org_id → user tenant', v_updated_count;

  -- Invoice Line Items (via parent invoice)
  UPDATE public.invoice_line_items ili
  SET tenant_id = i.tenant_id
  FROM public.invoices i
  WHERE ili.invoice_id = i.id
    AND ili.tenant_id IS NULL
    AND i.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % invoice_line_items from parent invoice', v_updated_count;

  -- Products
  UPDATE public.products pr
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pr.org_id = p.id
    AND pr.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % products from org_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- GOALS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.goals g
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE g.user_id = p.id
    AND g.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % goals from user_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- OAUTH TOKENS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.oauth_tokens ot
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE ot.org_id = p.id
    AND ot.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % oauth_tokens from org_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- FIELD SERVICES (if exists)
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if field_service_requests table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_requests'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.field_service_requests fsr
    SET tenant_id = p.tenant_id
    FROM public.profiles p
    WHERE fsr.org_id = p.id
      AND fsr.tenant_id IS NULL
      AND p.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % field_service_requests from org_id → user tenant', v_updated_count;
  END IF;

  -- Check if field_service_assignments table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_assignments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.field_service_assignments fsa
    SET tenant_id = fsr.tenant_id
    FROM public.field_service_requests fsr
    WHERE fsa.request_id = fsr.id
      AND fsa.tenant_id IS NULL
      AND fsr.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % field_service_assignments from parent request', v_updated_count;
  END IF;
END $$;

-- =============================================
-- REPUTATION MANAGEMENT (if exists)
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if reviews table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.reviews r
    SET tenant_id = p.tenant_id
    FROM public.profiles p
    WHERE r.org_id = p.id
      AND r.tenant_id IS NULL
      AND p.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % reviews from org_id → user tenant', v_updated_count;
  END IF;

  -- Check if review_responses table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_responses'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.review_responses rr
    SET tenant_id = r.tenant_id
    FROM public.reviews r
    WHERE rr.review_id = r.id
      AND rr.tenant_id IS NULL
      AND r.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % review_responses from parent review', v_updated_count;
  END IF;
END $$;

-- =============================================
-- WEBINARS (if exists)
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if webinars table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinars'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.webinars w
    SET tenant_id = p.tenant_id
    FROM public.profiles p
    WHERE w.org_id = p.id
      AND w.tenant_id IS NULL
      AND p.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % webinars from org_id → user tenant', v_updated_count;
  END IF;

  -- Check if webinar_registrations table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinar_registrations'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.webinar_registrations wr
    SET tenant_id = w.tenant_id
    FROM public.webinars w
    WHERE wr.webinar_id = w.id
      AND wr.tenant_id IS NULL
      AND w.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % webinar_registrations from parent webinar', v_updated_count;
  END IF;
END $$;

-- =============================================
-- CONTACT ATTEMPTS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_attempts'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    -- Backfill from contact's tenant
    UPDATE public.contact_attempts ca
    SET tenant_id = c.tenant_id
    FROM public.contacts c
    WHERE ca.contact_id = c.id
      AND ca.tenant_id IS NULL
      AND c.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % contact_attempts from parent contact', v_updated_count;
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'agent_runs',
    'agent_memories',
    'agent_reflections',
    'agent_settings',
    'email_suppressions',
    'campaigns',
    'campaign_contacts',
    'invoices',
    'invoice_line_items',
    'products',
    'goals',
    'oauth_tokens'
  ];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL VERIFICATION (PART 2)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_table_name IN ARRAY v_tables LOOP
    EXECUTE format(
      'SELECT COUNT(*) FROM public.%I WHERE tenant_id IS NULL',
      v_table_name
    ) INTO v_null_count;

    IF v_null_count > 0 THEN
      RAISE WARNING 'Table % has % records with NULL tenant_id', v_table_name, v_null_count;
    ELSE
      RAISE NOTICE 'Table %: All records have tenant_id ✓', v_table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration (clear tenant_id values):

UPDATE public.agent_runs SET tenant_id = NULL;
UPDATE public.agent_memories SET tenant_id = NULL;
UPDATE public.agent_reflections SET tenant_id = NULL;
UPDATE public.agent_settings SET tenant_id = NULL;
UPDATE public.email_suppressions SET tenant_id = NULL;
UPDATE public.campaigns SET tenant_id = NULL;
UPDATE public.campaign_contacts SET tenant_id = NULL;
UPDATE public.invoices SET tenant_id = NULL;
UPDATE public.invoice_line_items SET tenant_id = NULL;
UPDATE public.products SET tenant_id = NULL;
UPDATE public.goals SET tenant_id = NULL;
UPDATE public.oauth_tokens SET tenant_id = NULL;

-- Optional tables (if exist)
UPDATE public.field_service_requests SET tenant_id = NULL;
UPDATE public.field_service_assignments SET tenant_id = NULL;
UPDATE public.reviews SET tenant_id = NULL;
UPDATE public.review_responses SET tenant_id = NULL;
UPDATE public.webinars SET tenant_id = NULL;
UPDATE public.webinar_registrations SET tenant_id = NULL;
UPDATE public.contact_attempts SET tenant_id = NULL;
*/
