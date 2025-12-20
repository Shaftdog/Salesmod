-- =============================================
-- Fix: Drop ALL legacy production system RLS policies
--
-- Problem: The original production system migration created policies
-- that check org_id = auth.uid() which compares a tenant UUID with a
-- user UUID, causing all operations to fail with RLS violation errors.
--
-- Solution: Drop all legacy org_id based policies. The correct
-- tenant_id based policies were already created in migration
-- 20251129000008_update_rls_agent_tables.sql
-- =============================================

-- =============================================
-- DROP ALL LEGACY PRODUCTION POLICIES
-- =============================================

-- Production Templates
DROP POLICY IF EXISTS production_templates_org_isolation ON public.production_templates;

-- Production Template Tasks
DROP POLICY IF EXISTS production_template_tasks_via_template ON public.production_template_tasks;

-- Production Template Subtasks
DROP POLICY IF EXISTS production_template_subtasks_via_task ON public.production_template_subtasks;

-- Production Cards
DROP POLICY IF EXISTS production_cards_org_isolation ON public.production_cards;

-- Production Tasks
DROP POLICY IF EXISTS production_tasks_via_card ON public.production_tasks;

-- Production Time Entries (this was causing the Start Timer error)
DROP POLICY IF EXISTS production_time_entries_via_task ON public.production_time_entries;

-- Production Resources
DROP POLICY IF EXISTS production_resources_org_isolation ON public.production_resources;

-- Production Alerts
DROP POLICY IF EXISTS production_alerts_org_isolation ON public.production_alerts;

-- Production Agent Runs
DROP POLICY IF EXISTS production_agent_runs_org_isolation ON public.production_agent_runs;

-- =============================================
-- ENSURE TENANT ISOLATION POLICIES EXIST
-- =============================================

-- Recreate production_time_entries policy with explicit WITH CHECK
DROP POLICY IF EXISTS production_time_entries_tenant_isolation ON public.production_time_entries;

CREATE POLICY production_time_entries_tenant_isolation
  ON public.production_time_entries
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Ensure RLS is enabled on all production tables
ALTER TABLE public.production_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_template_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_agent_runs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_legacy_count INTEGER;
  v_production_tables TEXT[] := ARRAY[
    'production_templates',
    'production_template_tasks',
    'production_template_subtasks',
    'production_cards',
    'production_tasks',
    'production_time_entries',
    'production_resources',
    'production_alerts',
    'production_agent_runs'
  ];
  v_table TEXT;
  v_table_policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRODUCTION SYSTEM RLS FIX';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check each production table for policies
  FOREACH v_table IN ARRAY v_production_tables LOOP
    SELECT COUNT(*) INTO v_table_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_table;

    RAISE NOTICE 'Table %: % policies', v_table, v_table_policy_count;
  END LOOP;

  -- Check for any remaining legacy policies
  SELECT COUNT(*) INTO v_legacy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'production%'
    AND (
      policyname LIKE '%via_task%'
      OR policyname LIKE '%via_card%'
      OR policyname LIKE '%via_template%'
      OR policyname LIKE '%org_isolation%'
    );

  RAISE NOTICE '';
  RAISE NOTICE 'Legacy production policies remaining: %', v_legacy_count;

  IF v_legacy_count = 0 THEN
    RAISE NOTICE '✅ All legacy production RLS policies removed';
    RAISE NOTICE '✅ Start Timer should now work correctly';
  ELSE
    RAISE WARNING '⚠️  Some legacy policies may remain - manual review needed';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK
-- =============================================

/*
To rollback:

DROP POLICY IF EXISTS production_time_entries_tenant_isolation ON public.production_time_entries;

-- Recreate old policy (not recommended - it has bugs)
CREATE POLICY production_time_entries_via_task ON production_time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM production_tasks pt
      JOIN production_cards pc ON pc.id = pt.production_card_id
      WHERE pt.id = production_time_entries.task_id
        AND pc.org_id = auth.uid()
    )
  );
*/
