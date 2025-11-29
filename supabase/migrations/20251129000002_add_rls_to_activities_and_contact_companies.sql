-- =============================================
-- Add Tenant-based RLS to Activities and Contact Companies
-- Closes security gap for tables with missing RLS policies
--
-- Tables affected:
-- - public.activities
-- - public.contact_companies
-- =============================================

-- =============================================
-- 1. Add tenant_id Columns
-- =============================================

-- Add tenant_id to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to contact_companies
ALTER TABLE public.contact_companies
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.activities.tenant_id IS 'Multi-tenant isolation - references tenant that owns this activity';
COMMENT ON COLUMN public.contact_companies.tenant_id IS 'Multi-tenant isolation - references tenant that owns this relationship';

-- =============================================
-- 2. Backfill tenant_id for Activities
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Backfill from client_id (highest priority - most common case)
  UPDATE public.activities a
  SET tenant_id = c.tenant_id
  FROM public.clients c
  WHERE a.client_id = c.id
    AND a.tenant_id IS NULL
    AND c.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % activities from client_id', v_updated_count;

  -- Backfill from contact_id (fallback)
  UPDATE public.activities a
  SET tenant_id = ct.tenant_id
  FROM public.contacts ct
  WHERE a.contact_id = ct.id
    AND a.tenant_id IS NULL
    AND ct.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % activities from contact_id', v_updated_count;

  -- Backfill from order_id (second fallback)
  UPDATE public.activities a
  SET tenant_id = o.tenant_id
  FROM public.orders o
  WHERE a.order_id = o.id
    AND a.tenant_id IS NULL
    AND o.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % activities from order_id', v_updated_count;

  -- Backfill from created_by user's tenant (last resort)
  UPDATE public.activities a
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE a.created_by = p.id
    AND a.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % activities from created_by user tenant', v_updated_count;

  -- Report any orphaned activities
  SELECT COUNT(*) INTO v_updated_count
  FROM public.activities
  WHERE tenant_id IS NULL;

  IF v_updated_count > 0 THEN
    RAISE WARNING '% activities could not be assigned a tenant_id', v_updated_count;
  ELSE
    RAISE NOTICE 'All activities successfully assigned tenant_id';
  END IF;
END $$;

-- =============================================
-- 3. Backfill tenant_id for Contact Companies
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Backfill from contact_id
  UPDATE public.contact_companies cc
  SET tenant_id = ct.tenant_id
  FROM public.contacts ct
  WHERE cc.contact_id = ct.id
    AND cc.tenant_id IS NULL
    AND ct.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % contact_companies from contact_id', v_updated_count;

  -- Backfill from company_id (clients table)
  UPDATE public.contact_companies cc
  SET tenant_id = c.tenant_id
  FROM public.clients c
  WHERE cc.company_id = c.id
    AND cc.tenant_id IS NULL
    AND c.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % contact_companies from company_id', v_updated_count;

  -- Report any orphaned contact_companies
  SELECT COUNT(*) INTO v_updated_count
  FROM public.contact_companies
  WHERE tenant_id IS NULL;

  IF v_updated_count > 0 THEN
    RAISE WARNING '% contact_companies could not be assigned a tenant_id', v_updated_count;
  ELSE
    RAISE NOTICE 'All contact_companies successfully assigned tenant_id';
  END IF;
END $$;

-- =============================================
-- 4. Enforce NOT NULL on tenant_id
-- =============================================

-- Make tenant_id NOT NULL for activities
ALTER TABLE public.activities
  ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id NOT NULL for contact_companies
ALTER TABLE public.contact_companies
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- 5. Create Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_activities_tenant_id
  ON public.activities(tenant_id);

CREATE INDEX IF NOT EXISTS idx_contact_companies_tenant_id
  ON public.contact_companies(tenant_id);

-- =============================================
-- 6. Add Tenant-based RLS Policies
-- =============================================

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS activities_tenant_isolation ON public.activities;
DROP POLICY IF EXISTS contact_companies_tenant_isolation ON public.contact_companies;

-- ACTIVITIES: Users can only access activities within their tenant
CREATE POLICY activities_tenant_isolation
  ON public.activities
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- CONTACT_COMPANIES: Users can only access relationships within their tenant
CREATE POLICY contact_companies_tenant_isolation
  ON public.contact_companies
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- =============================================
-- 7. Ensure RLS is Enabled (idempotent)
-- =============================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. Verification Summary
-- =============================================

DO $$
DECLARE
  v_activities_count INTEGER;
  v_contact_companies_count INTEGER;
  v_activities_policy_count INTEGER;
  v_contact_companies_policy_count INTEGER;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO v_activities_count FROM public.activities;
  SELECT COUNT(*) INTO v_contact_companies_count FROM public.contact_companies;

  -- Count policies
  SELECT COUNT(*) INTO v_activities_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'activities';

  SELECT COUNT(*) INTO v_contact_companies_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'contact_companies';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Activities:';
  RAISE NOTICE '  - Total records: %', v_activities_count;
  RAISE NOTICE '  - RLS policies: %', v_activities_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Contact Companies:';
  RAISE NOTICE '  - Total records: %', v_contact_companies_count;
  RAISE NOTICE '  - RLS policies: %', v_contact_companies_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration:

-- 1. Remove RLS policies
DROP POLICY IF EXISTS activities_tenant_isolation ON public.activities;
DROP POLICY IF EXISTS contact_companies_tenant_isolation ON public.contact_companies;

-- 2. Remove indexes
DROP INDEX IF EXISTS idx_activities_tenant_id;
DROP INDEX IF EXISTS idx_contact_companies_tenant_id;

-- 3. Remove tenant_id columns
ALTER TABLE public.activities DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.contact_companies DROP COLUMN IF EXISTS tenant_id;
*/
