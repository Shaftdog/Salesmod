-- =============================================
-- Phase 3.1: Add tenant_id to Business Tables
-- Adds tenant_id column to all org_id-scoped tables for multi-tenant support
--
-- Strategy: Add columns only (nullable), backfill in next migration
-- =============================================

-- =============================================
-- KANBAN & PRODUCTION SYSTEM (11 tables)
-- =============================================

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_cards
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_tasks
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_templates
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_template_tasks
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_template_subtasks
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_time_entries
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_resources
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_alerts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.production_agent_runs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- JOBS SYSTEM (2 tables)
-- =============================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.job_tasks
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- AGENT SYSTEM (5 tables)
-- =============================================

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.agent_memories
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.agent_reflections
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.email_suppressions
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- MARKETING & CAMPAIGNS (2 tables)
-- =============================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Note: campaign_contacts table does not exist, using campaign_contact_status instead
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_contact_status') THEN
    ALTER TABLE public.campaign_contact_status ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- INVOICING & PRODUCTS (3 tables)
-- =============================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- GOALS & TRACKING (1 table)
-- =============================================

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- OAUTH & INTEGRATIONS (1 table)
-- =============================================

ALTER TABLE public.oauth_tokens
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- FIELD SERVICES (if exists - gracefully skip if not)
-- =============================================

ALTER TABLE public.field_service_requests
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.field_service_assignments
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- REPUTATION MANAGEMENT (if exists - gracefully skip if not)
-- =============================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.review_responses
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- WEBINARS (if exists - gracefully skip if not)
-- =============================================

ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- CONTACT ATTEMPTS (1 table)
-- =============================================

ALTER TABLE public.contact_attempts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN public.kanban_cards.tenant_id IS 'Multi-tenant isolation - references tenant that owns this card';
COMMENT ON COLUMN public.production_cards.tenant_id IS 'Multi-tenant isolation - references tenant that owns this card';
COMMENT ON COLUMN public.jobs.tenant_id IS 'Multi-tenant isolation - references tenant that owns this job';
COMMENT ON COLUMN public.agent_runs.tenant_id IS 'Multi-tenant isolation - references tenant that owns this agent run';
COMMENT ON COLUMN public.campaigns.tenant_id IS 'Multi-tenant isolation - references tenant that owns this campaign';
COMMENT ON COLUMN public.invoices.tenant_id IS 'Multi-tenant isolation - references tenant that owns this invoice';
COMMENT ON COLUMN public.products.tenant_id IS 'Multi-tenant isolation - references tenant that owns this product';
COMMENT ON COLUMN public.goals.tenant_id IS 'Multi-tenant isolation - references tenant that owns this goal';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_column_count INTEGER;
BEGIN
  -- Count tables with tenant_id column
  SELECT COUNT(DISTINCT table_name) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TENANT_ID COLUMN ADDITION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables with tenant_id column: %', v_column_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Run backfill migration to populate tenant_id values';
  RAISE NOTICE '2. Make tenant_id NOT NULL after backfilling';
  RAISE NOTICE '3. Update RLS policies to use tenant_id';
  RAISE NOTICE '4. Remove legacy org_id-based RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration (remove tenant_id columns):

ALTER TABLE public.kanban_cards DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_cards DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_tasks DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_templates DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_template_tasks DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_template_subtasks DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_time_entries DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_resources DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_alerts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.production_agent_runs DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.jobs DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.job_tasks DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.agent_runs DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.agent_memories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.agent_reflections DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.agent_settings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.email_suppressions DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.campaigns DROP COLUMN IF EXISTS tenant_id;
-- campaign_contacts table does not exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_contact_status') THEN
    ALTER TABLE public.campaign_contact_status DROP COLUMN IF EXISTS tenant_id;
  END IF;
END $$;

ALTER TABLE public.invoices DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.invoice_line_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.goals DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.oauth_tokens DROP COLUMN IF EXISTS tenant_id;

-- Field Services
ALTER TABLE public.field_service_requests DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.field_service_assignments DROP COLUMN IF EXISTS tenant_id;

-- Reputation
ALTER TABLE public.reviews DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.review_responses DROP COLUMN IF EXISTS tenant_id;

-- Webinars
ALTER TABLE public.webinars DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.webinar_registrations DROP COLUMN IF EXISTS tenant_id;

-- Contact Attempts
ALTER TABLE public.contact_attempts DROP COLUMN IF EXISTS tenant_id;
*/
