-- =============================================
-- Fix: Add missing RLS policies for production_template_tasks and production_template_subtasks
--
-- Problem: Tasks and subtasks are not visible in the UI because RLS policies are missing.
-- The legacy org_id based policies were dropped, but tenant_id policies weren't properly created.
--
-- Solution: Create tenant_id based policies that allow access when the user's profile
-- tenant_id matches the record's tenant_id.
-- =============================================

-- =============================================
-- 1. DROP ANY EXISTING POLICIES (clean slate)
-- =============================================

DROP POLICY IF EXISTS production_template_tasks_tenant_isolation ON public.production_template_tasks;
DROP POLICY IF EXISTS production_template_tasks_via_template ON public.production_template_tasks;

DROP POLICY IF EXISTS production_template_subtasks_tenant_isolation ON public.production_template_subtasks;
DROP POLICY IF EXISTS production_template_subtasks_via_task ON public.production_template_subtasks;

-- Also ensure templates policy exists
DROP POLICY IF EXISTS production_templates_tenant_isolation ON public.production_templates;
DROP POLICY IF EXISTS production_templates_org_isolation ON public.production_templates;

-- =============================================
-- 2. CREATE TENANT ISOLATION POLICIES
-- =============================================

-- Production Templates: tenant-scoped access
CREATE POLICY production_templates_tenant_isolation
  ON public.production_templates
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

-- Production Template Tasks: tenant-scoped access
CREATE POLICY production_template_tasks_tenant_isolation
  ON public.production_template_tasks
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

-- Production Template Subtasks: tenant-scoped access
CREATE POLICY production_template_subtasks_tenant_isolation
  ON public.production_template_subtasks
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

-- =============================================
-- 3. ENSURE RLS IS ENABLED
-- =============================================

ALTER TABLE public.production_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_template_subtasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. VERIFICATION
-- =============================================

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('production_templates', 'production_template_tasks', 'production_template_subtasks');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRODUCTION TEMPLATE RLS FIX';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies on template tables: %', v_policy_count;

  IF v_policy_count >= 3 THEN
    RAISE NOTICE '✅ RLS policies created successfully';
    RAISE NOTICE '✅ Template tasks should now be visible';
  ELSE
    RAISE WARNING '⚠️ Expected at least 3 policies, got %', v_policy_count;
  END IF;

  RAISE NOTICE '========================================';
END $$;
