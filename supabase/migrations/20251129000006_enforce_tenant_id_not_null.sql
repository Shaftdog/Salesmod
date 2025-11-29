-- =============================================
-- Phase 3.3: Enforce tenant_id NOT NULL
-- Makes tenant_id required on all business tables
--
-- Prerequisites:
-- - 20251129000003_add_tenant_id_to_business_tables.sql
-- - 20251129000004_backfill_tenant_id_part1.sql
-- - 20251129000005_backfill_tenant_id_part2.sql
-- =============================================

-- =============================================
-- KANBAN & PRODUCTION SYSTEM
-- =============================================

ALTER TABLE public.kanban_cards
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_cards
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_tasks
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_templates
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_template_tasks
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_template_subtasks
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_time_entries
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_resources
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_alerts
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_agent_runs
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- JOBS SYSTEM
-- =============================================

ALTER TABLE public.jobs
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.job_tasks
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- AGENT SYSTEM
-- =============================================

ALTER TABLE public.agent_runs
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.agent_memories
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.agent_reflections
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.agent_settings
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.email_suppressions
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- MARKETING & CAMPAIGNS
-- =============================================

ALTER TABLE public.campaigns
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.campaign_contacts
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- INVOICING & PRODUCTS
-- =============================================

ALTER TABLE public.invoices
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.invoice_line_items
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.products
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- GOALS & OAUTH
-- =============================================

ALTER TABLE public.goals
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.oauth_tokens
  ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- FIELD SERVICES (if exists - gracefully handle missing tables)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_requests'
  ) THEN
    ALTER TABLE public.field_service_requests
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'field_service_assignments'
  ) THEN
    ALTER TABLE public.field_service_assignments
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =============================================
-- REPUTATION MANAGEMENT (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    ALTER TABLE public.reviews
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_responses'
  ) THEN
    ALTER TABLE public.review_responses
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =============================================
-- WEBINARS (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinars'
  ) THEN
    ALTER TABLE public.webinars
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webinar_registrations'
  ) THEN
    ALTER TABLE public.webinar_registrations
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =============================================
-- CONTACT ATTEMPTS (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_attempts'
  ) THEN
    ALTER TABLE public.contact_attempts
      ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_kanban_cards_tenant_id
  ON public.kanban_cards(tenant_id);

CREATE INDEX IF NOT EXISTS idx_production_cards_tenant_id
  ON public.production_cards(tenant_id);

CREATE INDEX IF NOT EXISTS idx_production_tasks_tenant_id
  ON public.production_tasks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_production_templates_tenant_id
  ON public.production_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id
  ON public.jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_id
  ON public.agent_runs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_agent_memories_tenant_id
  ON public.agent_memories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id
  ON public.campaigns(tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id
  ON public.invoices(tenant_id);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id
  ON public.products(tenant_id);

CREATE INDEX IF NOT EXISTS idx_goals_tenant_id
  ON public.goals(tenant_id);

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_table_record RECORD;
  v_total_tables INTEGER := 0;
  v_enforced_tables INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TENANT_ID NOT NULL ENFORCEMENT SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check all tables with tenant_id column
  FOR v_table_record IN
    SELECT
      c.table_name,
      c.is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name NOT IN ('tenants', 'profiles') -- Exclude meta tables
    ORDER BY c.table_name
  LOOP
    v_total_tables := v_total_tables + 1;

    IF v_table_record.is_nullable = 'NO' THEN
      v_enforced_tables := v_enforced_tables + 1;
      RAISE NOTICE 'Table %: tenant_id NOT NULL ✓', v_table_record.table_name;
    ELSE
      RAISE WARNING 'Table %: tenant_id is still NULLABLE ⚠️', v_table_record.table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Total business tables with tenant_id: %', v_total_tables;
  RAISE NOTICE '  Tables with NOT NULL enforced: %', v_enforced_tables;
  RAISE NOTICE '';

  IF v_enforced_tables = v_total_tables THEN
    RAISE NOTICE '✅ All business tables have tenant_id NOT NULL constraint';
  ELSE
    RAISE WARNING '⚠️  % tables still allow NULL tenant_id', v_total_tables - v_enforced_tables;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration (make tenant_id nullable again):

ALTER TABLE public.kanban_cards ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_cards ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_tasks ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_templates ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_template_tasks ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_template_subtasks ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_time_entries ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_resources ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_alerts ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.production_agent_runs ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.jobs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.job_tasks ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.agent_runs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.agent_memories ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.agent_reflections ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.agent_settings ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.email_suppressions ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.campaigns ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.campaign_contacts ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.invoices ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.invoice_line_items ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.goals ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.oauth_tokens ALTER COLUMN tenant_id DROP NOT NULL;

-- Optional tables (if exist)
ALTER TABLE public.field_service_requests ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.field_service_assignments ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.review_responses ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.webinars ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.webinar_registrations ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.contact_attempts ALTER COLUMN tenant_id DROP NOT NULL;

-- Drop indexes
DROP INDEX IF EXISTS idx_kanban_cards_tenant_id;
DROP INDEX IF EXISTS idx_production_cards_tenant_id;
DROP INDEX IF EXISTS idx_production_tasks_tenant_id;
DROP INDEX IF EXISTS idx_production_templates_tenant_id;
DROP INDEX IF EXISTS idx_jobs_tenant_id;
DROP INDEX IF EXISTS idx_agent_runs_tenant_id;
DROP INDEX IF EXISTS idx_agent_memories_tenant_id;
DROP INDEX IF EXISTS idx_campaigns_tenant_id;
DROP INDEX IF EXISTS idx_invoices_tenant_id;
DROP INDEX IF EXISTS idx_products_tenant_id;
DROP INDEX IF EXISTS idx_goals_tenant_id;
*/
