-- =============================================
-- Phase 3.6: Update RLS Policies - Marketing & Finance
-- Updates RLS policies to use tenant_id-based isolation
--
-- Tables: campaigns, invoices, products, goals
-- =============================================

-- =============================================
-- MARKETING & CAMPAIGNS
-- =============================================

-- Campaigns
DROP POLICY IF EXISTS campaigns_tenant_isolation ON public.campaigns;

CREATE POLICY campaigns_tenant_isolation
  ON public.campaigns
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY campaigns_tenant_isolation ON public.campaigns IS
  'Allow all operations on campaigns within user''s tenant';

-- Campaign Contacts
DROP POLICY IF EXISTS campaign_contacts_tenant_isolation ON public.campaign_contacts;

CREATE POLICY campaign_contacts_tenant_isolation
  ON public.campaign_contacts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY campaign_contacts_tenant_isolation ON public.campaign_contacts IS
  'Allow all operations on campaign contacts within user''s tenant';

-- =============================================
-- INVOICING SYSTEM
-- =============================================

-- Invoices
DROP POLICY IF EXISTS invoices_tenant_isolation ON public.invoices;

CREATE POLICY invoices_tenant_isolation
  ON public.invoices
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY invoices_tenant_isolation ON public.invoices IS
  'Allow all operations on invoices within user''s tenant';

-- Invoice Line Items
DROP POLICY IF EXISTS invoice_line_items_tenant_isolation ON public.invoice_line_items;

CREATE POLICY invoice_line_items_tenant_isolation
  ON public.invoice_line_items
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY invoice_line_items_tenant_isolation ON public.invoice_line_items IS
  'Allow all operations on invoice line items within user''s tenant';

-- =============================================
-- PRODUCTS
-- =============================================

DROP POLICY IF EXISTS products_tenant_isolation ON public.products;

CREATE POLICY products_tenant_isolation
  ON public.products
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY products_tenant_isolation ON public.products IS
  'Allow all operations on products within user''s tenant';

-- =============================================
-- GOALS
-- =============================================

DROP POLICY IF EXISTS goals_tenant_isolation ON public.goals;

CREATE POLICY goals_tenant_isolation
  ON public.goals
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY goals_tenant_isolation ON public.goals IS
  'Allow all operations on goals within user''s tenant';

-- =============================================
-- OPTIONAL TABLES (Field Services, Reputation, Webinars, Contact Attempts)
-- =============================================

-- Field Service Requests (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_requests'
  ) THEN
    DROP POLICY IF EXISTS field_service_requests_tenant_isolation ON public.field_service_requests;

    CREATE POLICY field_service_requests_tenant_isolation
      ON public.field_service_requests
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.field_service_requests ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for field_service_requests';
  END IF;
END $$;

-- Field Service Assignments (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_assignments'
  ) THEN
    DROP POLICY IF EXISTS field_service_assignments_tenant_isolation ON public.field_service_assignments;

    CREATE POLICY field_service_assignments_tenant_isolation
      ON public.field_service_assignments
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.field_service_assignments ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for field_service_assignments';
  END IF;
END $$;

-- Reviews (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    DROP POLICY IF EXISTS reviews_tenant_isolation ON public.reviews;

    CREATE POLICY reviews_tenant_isolation
      ON public.reviews
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for reviews';
  END IF;
END $$;

-- Review Responses (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_responses'
  ) THEN
    DROP POLICY IF EXISTS review_responses_tenant_isolation ON public.review_responses;

    CREATE POLICY review_responses_tenant_isolation
      ON public.review_responses
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for review_responses';
  END IF;
END $$;

-- Webinars (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinars'
  ) THEN
    DROP POLICY IF EXISTS webinars_tenant_isolation ON public.webinars;

    CREATE POLICY webinars_tenant_isolation
      ON public.webinars
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for webinars';
  END IF;
END $$;

-- Webinar Registrations (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinar_registrations'
  ) THEN
    DROP POLICY IF EXISTS webinar_registrations_tenant_isolation ON public.webinar_registrations;

    CREATE POLICY webinar_registrations_tenant_isolation
      ON public.webinar_registrations
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for webinar_registrations';
  END IF;
END $$;

-- Contact Attempts (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_attempts'
  ) THEN
    DROP POLICY IF EXISTS contact_attempts_tenant_isolation ON public.contact_attempts;

    CREATE POLICY contact_attempts_tenant_isolation
      ON public.contact_attempts
      FOR ALL
      USING (
        tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
        )
      );

    ALTER TABLE public.contact_attempts ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created RLS policy for contact_attempts';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'campaigns',
    'campaign_contacts',
    'invoices',
    'invoice_line_items',
    'products',
    'goals'
  ];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MARKETING/FINANCE RLS UPDATE SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_table_name IN ARRAY v_tables LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = v_table_name;

    IF v_policy_count > 0 THEN
      RAISE NOTICE 'Table %: % RLS policies ✓', v_table_name, v_policy_count;
    ELSE
      RAISE WARNING 'Table %: NO RLS policies found!', v_table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration (remove tenant-based policies):

DROP POLICY IF EXISTS campaigns_tenant_isolation ON public.campaigns;
DROP POLICY IF EXISTS campaign_contacts_tenant_isolation ON public.campaign_contacts;
DROP POLICY IF EXISTS invoices_tenant_isolation ON public.invoices;
DROP POLICY IF EXISTS invoice_line_items_tenant_isolation ON public.invoice_line_items;
DROP POLICY IF EXISTS products_tenant_isolation ON public.products;
DROP POLICY IF EXISTS goals_tenant_isolation ON public.goals;

-- Optional tables
DROP POLICY IF EXISTS field_service_requests_tenant_isolation ON public.field_service_requests;
DROP POLICY IF EXISTS field_service_assignments_tenant_isolation ON public.field_service_assignments;
DROP POLICY IF EXISTS reviews_tenant_isolation ON public.reviews;
DROP POLICY IF EXISTS review_responses_tenant_isolation ON public.review_responses;
DROP POLICY IF EXISTS webinars_tenant_isolation ON public.webinars;
DROP POLICY IF EXISTS webinar_registrations_tenant_isolation ON public.webinar_registrations;
DROP POLICY IF EXISTS contact_attempts_tenant_isolation ON public.contact_attempts;
*/
