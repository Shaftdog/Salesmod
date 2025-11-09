-- Job Metrics Materialized View
-- Migration: 20251103000002_create_job_metrics_view.sql
-- Purpose: Create fast-access view for job metrics and analytics

-- ============================================================================
-- 1. JOB METRICS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS job_metrics AS
SELECT
  j.id AS job_id,
  j.org_id,
  j.name,
  j.status,
  j.created_at,
  j.started_at,
  j.finished_at,
  j.last_run_at,

  -- Task metrics
  j.total_tasks,
  j.completed_tasks,
  j.failed_tasks,
  CASE
    WHEN j.total_tasks > 0
    THEN ROUND((j.completed_tasks::NUMERIC / j.total_tasks::NUMERIC) * 100, 2)
    ELSE 0
  END AS task_completion_rate,

  -- Card metrics
  j.cards_created,
  j.cards_approved,
  j.cards_executed,
  CASE
    WHEN j.cards_created > 0
    THEN ROUND((j.cards_approved::NUMERIC / j.cards_created::NUMERIC) * 100, 2)
    ELSE 0
  END AS approval_rate,

  -- Email metrics
  j.emails_sent,
  j.errors_count,

  -- Card state breakdown (OPTIMIZED: Single LEFT JOIN with FILTER instead of multiple subqueries)
  COUNT(kc.id) FILTER (WHERE kc.state = 'suggested') AS cards_suggested,
  COUNT(kc.id) FILTER (WHERE kc.state = 'in_review') AS cards_in_review,
  COUNT(kc.id) FILTER (WHERE kc.state = 'approved') AS cards_approved_pending,
  COUNT(kc.id) FILTER (WHERE kc.state = 'executing') AS cards_executing,
  COUNT(kc.id) FILTER (WHERE kc.state = 'done') AS cards_done,
  COUNT(kc.id) FILTER (WHERE kc.state = 'blocked') AS cards_blocked,
  COUNT(kc.id) FILTER (WHERE kc.state = 'rejected') AS cards_rejected,

  -- Task type breakdown (OPTIMIZED: Using FILTER)
  COUNT(kc.id) FILTER (WHERE kc.type = 'send_email') AS email_cards,
  COUNT(kc.id) FILTER (WHERE kc.type = 'create_task') AS task_cards,
  COUNT(kc.id) FILTER (WHERE kc.type = 'schedule_call') AS call_cards,
  COUNT(kc.id) FILTER (WHERE kc.type = 'research') AS research_cards,
  COUNT(kc.id) FILTER (WHERE kc.type = 'follow_up') AS followup_cards,
  COUNT(kc.id) FILTER (WHERE kc.type = 'create_deal') AS deal_cards,

  -- Execution timing
  CASE
    WHEN j.started_at IS NOT NULL AND j.finished_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (j.finished_at - j.started_at))
    WHEN j.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (NOW() - j.started_at))
    ELSE NULL
  END AS duration_seconds,

  -- Associated runs (kept as subquery since it's a different table)
  (SELECT COUNT(*) FROM agent_runs WHERE job_id = j.id) AS total_runs,
  (SELECT MAX(ended_at) FROM agent_runs WHERE job_id = j.id) AS last_run_ended_at

FROM jobs j
LEFT JOIN kanban_cards kc ON kc.job_id = j.id
GROUP BY j.id, j.org_id, j.name, j.status, j.created_at, j.started_at, j.finished_at, j.last_run_at,
         j.total_tasks, j.completed_tasks, j.failed_tasks, j.cards_created, j.cards_approved,
         j.cards_executed, j.emails_sent, j.errors_count;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_metrics_job_id ON job_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_job_metrics_org ON job_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_job_metrics_status ON job_metrics(status);
CREATE INDEX IF NOT EXISTS idx_job_metrics_created_at ON job_metrics(created_at DESC);

-- ============================================================================
-- 2. REFRESH FUNCTION
-- ============================================================================

-- Function to refresh job metrics view
CREATE OR REPLACE FUNCTION refresh_job_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY job_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. AUTO-REFRESH TRIGGERS
-- ============================================================================

-- Function to schedule a refresh (debounced)
CREATE OR REPLACE FUNCTION schedule_job_metrics_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- In production, you might use pg_cron or similar
  -- For now, we'll refresh immediately but could add debouncing
  PERFORM refresh_job_metrics();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: These triggers can be heavy. Consider using a cron job instead
-- CREATE TRIGGER trigger_refresh_on_job_change
--   AFTER INSERT OR UPDATE OR DELETE ON jobs
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION schedule_job_metrics_refresh();

-- CREATE TRIGGER trigger_refresh_on_card_change
--   AFTER INSERT OR UPDATE OR DELETE ON kanban_cards
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION schedule_job_metrics_refresh();

-- ============================================================================
-- 4. ANALYTICS VIEWS
-- ============================================================================

-- View: Job performance summary
CREATE OR REPLACE VIEW job_performance_summary AS
SELECT
  org_id,
  COUNT(*) AS total_jobs,
  COUNT(*) FILTER (WHERE status = 'running') AS running_jobs,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded_jobs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_jobs,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_jobs,
  SUM(cards_created) AS total_cards_created,
  SUM(cards_executed) AS total_cards_executed,
  SUM(emails_sent) AS total_emails_sent,
  AVG(approval_rate) FILTER (WHERE approval_rate > 0) AS avg_approval_rate,
  AVG(task_completion_rate) FILTER (WHERE task_completion_rate > 0) AS avg_completion_rate
FROM job_metrics
GROUP BY org_id;

-- View: Recent job activity
CREATE OR REPLACE VIEW recent_job_activity AS
SELECT
  jm.job_id,
  jm.org_id,
  jm.name,
  jm.status,
  jm.cards_created,
  jm.cards_executed,
  jm.emails_sent,
  jm.approval_rate,
  jm.last_run_at,
  jm.last_run_ended_at,
  jm.created_at
FROM job_metrics jm
WHERE jm.created_at > NOW() - INTERVAL '30 days'
ORDER BY jm.last_run_at DESC NULLS LAST, jm.created_at DESC;

-- ============================================================================
-- 5. RLS POLICIES FOR VIEWS
-- ============================================================================

-- Note: Materialized views don't support RLS directly
-- Instead, create a security-definer function to query them

CREATE OR REPLACE FUNCTION get_job_metrics_for_org(p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  job_id UUID,
  name TEXT,
  status TEXT,
  total_tasks INTEGER,
  completed_tasks INTEGER,
  cards_created INTEGER,
  cards_executed INTEGER,
  emails_sent INTEGER,
  approval_rate NUMERIC,
  task_completion_rate NUMERIC,
  last_run_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jm.job_id,
    jm.name,
    jm.status,
    jm.total_tasks,
    jm.completed_tasks,
    jm.cards_created,
    jm.cards_executed,
    jm.emails_sent,
    jm.approval_rate,
    jm.task_completion_rate,
    jm.last_run_at
  FROM job_metrics jm
  WHERE jm.org_id = COALESCE(p_org_id, auth.uid())
  ORDER BY jm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. INITIAL REFRESH
-- ============================================================================

-- Populate the materialized view
REFRESH MATERIALIZED VIEW job_metrics;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON MATERIALIZED VIEW job_metrics IS 'Fast-access aggregated metrics for all jobs';
COMMENT ON FUNCTION refresh_job_metrics() IS 'Manually refresh job metrics materialized view';
COMMENT ON VIEW job_performance_summary IS 'Organization-level job performance rollup';
COMMENT ON VIEW recent_job_activity IS 'Last 30 days of job activity for quick dashboard display';
