-- =============================================
-- Phase 3.5: Update RLS Policies - Agent Tables
-- Updates RLS policies to use tenant_id-based isolation
--
-- Tables: kanban_cards, production_*, jobs, agent_*
-- =============================================

-- =============================================
-- KANBAN SYSTEM
-- =============================================

DROP POLICY IF EXISTS "Users can manage kanban_cards for their org" ON public.kanban_cards;
DROP POLICY IF EXISTS kanban_cards_tenant_isolation ON public.kanban_cards;

CREATE POLICY kanban_cards_tenant_isolation
  ON public.kanban_cards
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PRODUCTION SYSTEM (10 tables)
-- =============================================

-- Production Cards
DROP POLICY IF EXISTS "Users can manage production_cards for their org" ON public.production_cards;
DROP POLICY IF EXISTS production_cards_tenant_isolation ON public.production_cards;

CREATE POLICY production_cards_tenant_isolation
  ON public.production_cards
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_cards ENABLE ROW LEVEL SECURITY;

-- Production Tasks
DROP POLICY IF EXISTS production_tasks_tenant_isolation ON public.production_tasks;

CREATE POLICY production_tasks_tenant_isolation
  ON public.production_tasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

-- Production Templates
DROP POLICY IF EXISTS production_templates_tenant_isolation ON public.production_templates;

CREATE POLICY production_templates_tenant_isolation
  ON public.production_templates
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_templates ENABLE ROW LEVEL SECURITY;

-- Production Template Tasks
DROP POLICY IF EXISTS production_template_tasks_tenant_isolation ON public.production_template_tasks;

CREATE POLICY production_template_tasks_tenant_isolation
  ON public.production_template_tasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_template_tasks ENABLE ROW LEVEL SECURITY;

-- Production Template Subtasks
DROP POLICY IF EXISTS production_template_subtasks_tenant_isolation ON public.production_template_subtasks;

CREATE POLICY production_template_subtasks_tenant_isolation
  ON public.production_template_subtasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_template_subtasks ENABLE ROW LEVEL SECURITY;

-- Production Time Entries
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
  );

ALTER TABLE public.production_time_entries ENABLE ROW LEVEL SECURITY;

-- Production Resources
DROP POLICY IF EXISTS production_resources_tenant_isolation ON public.production_resources;

CREATE POLICY production_resources_tenant_isolation
  ON public.production_resources
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_resources ENABLE ROW LEVEL SECURITY;

-- Production Alerts
DROP POLICY IF EXISTS production_alerts_tenant_isolation ON public.production_alerts;

CREATE POLICY production_alerts_tenant_isolation
  ON public.production_alerts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_alerts ENABLE ROW LEVEL SECURITY;

-- Production Agent Runs
DROP POLICY IF EXISTS production_agent_runs_tenant_isolation ON public.production_agent_runs;

CREATE POLICY production_agent_runs_tenant_isolation
  ON public.production_agent_runs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.production_agent_runs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- JOBS SYSTEM
-- =============================================

DROP POLICY IF EXISTS "Users can manage jobs for their org" ON public.jobs;
DROP POLICY IF EXISTS jobs_tenant_isolation ON public.jobs;

CREATE POLICY jobs_tenant_isolation
  ON public.jobs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Job Tasks
DROP POLICY IF EXISTS job_tasks_tenant_isolation ON public.job_tasks;

CREATE POLICY job_tasks_tenant_isolation
  ON public.job_tasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AGENT SYSTEM
-- =============================================

-- Agent Runs
DROP POLICY IF EXISTS agent_runs_tenant_isolation ON public.agent_runs;

CREATE POLICY agent_runs_tenant_isolation
  ON public.agent_runs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- Agent Memories
DROP POLICY IF EXISTS agent_memories_tenant_isolation ON public.agent_memories;

CREATE POLICY agent_memories_tenant_isolation
  ON public.agent_memories
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

-- Agent Reflections
DROP POLICY IF EXISTS agent_reflections_tenant_isolation ON public.agent_reflections;

CREATE POLICY agent_reflections_tenant_isolation
  ON public.agent_reflections
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.agent_reflections ENABLE ROW LEVEL SECURITY;

-- Agent Settings
DROP POLICY IF EXISTS agent_settings_tenant_isolation ON public.agent_settings;

CREATE POLICY agent_settings_tenant_isolation
  ON public.agent_settings
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- Email Suppressions
DROP POLICY IF EXISTS email_suppressions_tenant_isolation ON public.email_suppressions;

CREATE POLICY email_suppressions_tenant_isolation
  ON public.email_suppressions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- OAUTH TOKENS
-- =============================================

DROP POLICY IF EXISTS oauth_tokens_tenant_isolation ON public.oauth_tokens;

CREATE POLICY oauth_tokens_tenant_isolation
  ON public.oauth_tokens
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'kanban_cards',
    'production_cards',
    'production_tasks',
    'production_templates',
    'production_template_tasks',
    'production_template_subtasks',
    'production_time_entries',
    'production_resources',
    'production_alerts',
    'production_agent_runs',
    'jobs',
    'job_tasks',
    'agent_runs',
    'agent_memories',
    'agent_reflections',
    'agent_settings',
    'email_suppressions',
    'oauth_tokens'
  ];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AGENT TABLES RLS UPDATE SUMMARY';
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

DROP POLICY IF EXISTS kanban_cards_tenant_isolation ON public.kanban_cards;
DROP POLICY IF EXISTS production_cards_tenant_isolation ON public.production_cards;
DROP POLICY IF EXISTS production_tasks_tenant_isolation ON public.production_tasks;
DROP POLICY IF EXISTS production_templates_tenant_isolation ON public.production_templates;
DROP POLICY IF EXISTS production_template_tasks_tenant_isolation ON public.production_template_tasks;
DROP POLICY IF EXISTS production_template_subtasks_tenant_isolation ON public.production_template_subtasks;
DROP POLICY IF EXISTS production_time_entries_tenant_isolation ON public.production_time_entries;
DROP POLICY IF EXISTS production_resources_tenant_isolation ON public.production_resources;
DROP POLICY IF EXISTS production_alerts_tenant_isolation ON public.production_alerts;
DROP POLICY IF EXISTS production_agent_runs_tenant_isolation ON public.production_agent_runs;
DROP POLICY IF EXISTS jobs_tenant_isolation ON public.jobs;
DROP POLICY IF EXISTS job_tasks_tenant_isolation ON public.job_tasks;
DROP POLICY IF EXISTS agent_runs_tenant_isolation ON public.agent_runs;
DROP POLICY IF EXISTS agent_memories_tenant_isolation ON public.agent_memories;
DROP POLICY IF EXISTS agent_reflections_tenant_isolation ON public.agent_reflections;
DROP POLICY IF EXISTS agent_settings_tenant_isolation ON public.agent_settings;
DROP POLICY IF EXISTS email_suppressions_tenant_isolation ON public.email_suppressions;
DROP POLICY IF EXISTS oauth_tokens_tenant_isolation ON public.oauth_tokens;
*/
