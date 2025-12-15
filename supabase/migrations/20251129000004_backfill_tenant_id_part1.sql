-- =============================================
-- Phase 3.2: Backfill tenant_id (Part 1)
-- Backfills tenant_id from user profiles via org_id
--
-- Tables in this batch:
-- - Kanban & Production System (11 tables)
-- - Jobs System (2 tables)
-- =============================================

-- =============================================
-- KANBAN CARDS
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.kanban_cards k
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE k.org_id = p.id
    AND k.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % kanban_cards from org_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- PRODUCTION SYSTEM
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Production Cards
  UPDATE public.production_cards pc
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pc.org_id = p.id
    AND pc.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_cards from org_id → user tenant', v_updated_count;

  -- Production Tasks (via parent production_card)
  UPDATE public.production_tasks pt
  SET tenant_id = pc.tenant_id
  FROM public.production_cards pc
  WHERE pt.production_card_id = pc.id
    AND pt.tenant_id IS NULL
    AND pc.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_tasks from parent production_card', v_updated_count;

  -- Production Templates
  UPDATE public.production_templates pt
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pt.org_id = p.id
    AND pt.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_templates from org_id → user tenant', v_updated_count;

  -- Production Template Tasks (via parent template)
  UPDATE public.production_template_tasks ptt
  SET tenant_id = pt.tenant_id
  FROM public.production_templates pt
  WHERE ptt.template_id = pt.id
    AND ptt.tenant_id IS NULL
    AND pt.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_template_tasks from parent template', v_updated_count;

  -- Production Template Subtasks (via parent task)
  UPDATE public.production_template_subtasks pts
  SET tenant_id = ptt.tenant_id
  FROM public.production_template_tasks ptt
  WHERE pts.task_id = ptt.id
    AND pts.tenant_id IS NULL
    AND ptt.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_template_subtasks from parent task', v_updated_count;

  -- Production Time Entries (via parent task)
  UPDATE public.production_time_entries pte
  SET tenant_id = pt.tenant_id
  FROM public.production_tasks pt
  WHERE pte.task_id = pt.id
    AND pte.tenant_id IS NULL
    AND pt.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_time_entries from parent task', v_updated_count;

  -- Production Resources
  UPDATE public.production_resources pr
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pr.org_id = p.id
    AND pr.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_resources from org_id → user tenant', v_updated_count;

  -- Production Alerts
  UPDATE public.production_alerts pa
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pa.org_id = p.id
    AND pa.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_alerts from org_id → user tenant', v_updated_count;

  -- Production Agent Runs
  UPDATE public.production_agent_runs par
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE par.org_id = p.id
    AND par.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % production_agent_runs from org_id → user tenant', v_updated_count;
END $$;

-- =============================================
-- JOBS SYSTEM
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Jobs
  UPDATE public.jobs j
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE j.org_id = p.id
    AND j.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % jobs from org_id → user tenant', v_updated_count;

  -- Job Tasks (via parent job)
  UPDATE public.job_tasks jt
  SET tenant_id = j.tenant_id
  FROM public.jobs j
  WHERE jt.job_id = j.id
    AND jt.tenant_id IS NULL
    AND j.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % job_tasks from parent job', v_updated_count;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
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
    'job_tasks'
  ];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL VERIFICATION (PART 1)';
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

UPDATE public.kanban_cards SET tenant_id = NULL;
UPDATE public.production_cards SET tenant_id = NULL;
UPDATE public.production_tasks SET tenant_id = NULL;
UPDATE public.production_templates SET tenant_id = NULL;
UPDATE public.production_template_tasks SET tenant_id = NULL;
UPDATE public.production_template_subtasks SET tenant_id = NULL;
UPDATE public.production_time_entries SET tenant_id = NULL;
UPDATE public.production_resources SET tenant_id = NULL;
UPDATE public.production_alerts SET tenant_id = NULL;
UPDATE public.production_agent_runs SET tenant_id = NULL;
UPDATE public.jobs SET tenant_id = NULL;
UPDATE public.job_tasks SET tenant_id = NULL;
*/
