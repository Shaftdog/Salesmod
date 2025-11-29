-- =============================================
-- Phase 3.7: Cleanup Legacy org_id Policies
-- Removes old org_id=auth.uid() based RLS policies
--
-- This migration ensures all tables use tenant_id-based RLS
-- and removes any remaining org_id-based policies
-- =============================================

-- =============================================
-- VERIFY ALL TABLES HAVE TENANT-BASED POLICIES
-- =============================================

DO $$
DECLARE
  v_policy_record RECORD;
  v_legacy_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LEGACY ORG_ID POLICY CLEANUP';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Scanning for org_id-based policies...';
  RAISE NOTICE '';

  -- Find any remaining policies that reference org_id
  FOR v_policy_record IN
    SELECT
      schemaname,
      tablename,
      policyname,
      CASE
        WHEN qual::text LIKE '%org_id = auth.uid()%' THEN 'USING clause'
        WHEN with_check::text LIKE '%org_id = auth.uid()%' THEN 'WITH CHECK clause'
        ELSE 'Unknown'
      END as clause_type
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual::text LIKE '%org_id = auth.uid()%'
        OR with_check::text LIKE '%org_id = auth.uid()%'
      )
    ORDER BY tablename, policyname
  LOOP
    v_legacy_count := v_legacy_count + 1;
    RAISE NOTICE 'Found legacy policy: %.% (%, %)',
      v_policy_record.tablename,
      v_policy_record.policyname,
      v_policy_record.clause_type,
      'org_id = auth.uid()';
  END LOOP;

  IF v_legacy_count > 0 THEN
    RAISE WARNING 'Found % legacy org_id-based policies', v_legacy_count;
    RAISE WARNING 'These should be replaced with tenant_id-based policies';
  ELSE
    RAISE NOTICE '✅ No legacy org_id-based policies found - all tables use tenant_id!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- DROP SPECIFIC LEGACY POLICIES (if they still exist)
-- =============================================

-- These are policies that might have been missed in previous migrations
-- or created manually and need to be removed

DO $$
DECLARE
  v_dropped_count INTEGER := 0;
BEGIN
  -- Core tables
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname LIKE '%org%'
      AND policyname NOT LIKE '%tenant%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view clients for their org" ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create clients for their org" ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update clients for their org" ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete clients for their org" ON public.clients';
    v_dropped_count := v_dropped_count + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname LIKE '%org%'
      AND policyname NOT LIKE '%tenant%'
      AND policyname NOT LIKE '%borrower%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view orders for their org" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create orders for their org" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update orders for their org" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete orders for their org" ON public.orders';
    v_dropped_count := v_dropped_count + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'properties'
      AND policyname LIKE '%org%'
      AND policyname NOT LIKE '%tenant%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view properties for their org" ON public.properties';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create properties for their org" ON public.properties';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update properties for their org" ON public.properties';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete properties for their org" ON public.properties';
    v_dropped_count := v_dropped_count + 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts'
      AND policyname LIKE '%org%'
      AND policyname NOT LIKE '%tenant%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view contacts for their org" ON public.contacts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create contacts for their org" ON public.contacts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update contacts for their org" ON public.contacts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete contacts for their org" ON public.contacts';
    v_dropped_count := v_dropped_count + 1;
  END IF;

  -- Kanban & Production
  EXECUTE 'DROP POLICY IF EXISTS "Users can manage kanban_cards for their org" ON public.kanban_cards';
  EXECUTE 'DROP POLICY IF EXISTS "Users can manage production_cards for their org" ON public.production_cards';

  -- Jobs
  EXECUTE 'DROP POLICY IF EXISTS "Users can manage jobs for their org" ON public.jobs';

  IF v_dropped_count > 0 THEN
    RAISE NOTICE 'Dropped % legacy policy groups', v_dropped_count;
  END IF;
END $$;

-- =============================================
-- FINAL VERIFICATION
-- =============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_policy_count INTEGER;
  v_tenant_policy_count INTEGER;
  v_legacy_policy_count INTEGER;
BEGIN
  -- Count tables with tenant_id
  SELECT COUNT(DISTINCT table_name) INTO v_table_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND table_name NOT IN ('tenants', 'profiles');

  -- Count all policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count tenant-based policies
  SELECT COUNT(*) INTO v_tenant_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%tenant%';

  -- Count remaining org_id-based policies
  SELECT COUNT(*) INTO v_legacy_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%org_id = auth.uid()%'
      OR with_check::text LIKE '%org_id = auth.uid()%'
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POLICY CLEANUP SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables with tenant_id: %', v_table_count;
  RAISE NOTICE 'Total RLS policies: %', v_policy_count;
  RAISE NOTICE 'Tenant-based policies: %', v_tenant_policy_count;
  RAISE NOTICE 'Legacy org_id policies: %', v_legacy_policy_count;
  RAISE NOTICE '';

  IF v_legacy_policy_count = 0 THEN
    RAISE NOTICE '✅ MIGRATION COMPLETE: All policies now use tenant_id!';
  ELSE
    RAISE WARNING '⚠️  % legacy org_id policies still exist', v_legacy_policy_count;
    RAISE WARNING 'Manual review recommended';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON DATABASE postgres IS
  'Multi-tenant appraisal workflow system with tenant-based RLS isolation. All business data tables use tenant_id for access control.';

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To restore org_id-based policies, you would need to:

1. Drop all tenant_id-based policies
2. Recreate org_id=auth.uid() policies for each table
3. This is a complex rollback - consider using backup/restore instead

Not recommended to rollback after this point - tenant-based RLS is the
stable, secure architecture going forward.
*/
