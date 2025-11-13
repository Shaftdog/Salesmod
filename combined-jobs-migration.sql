-- Create Jobs System: Campaign Runner for AI Agent
-- Migration: 20251103000000_create_jobs_system.sql
-- Purpose: Add jobs and job_tasks tables for managing multi-step campaigns

-- ============================================================================
-- 1. JOBS TABLE: Container for campaigns/projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Created but not started
    'running',    -- Currently executing
    'paused',     -- User paused execution
    'succeeded',  -- All tasks completed successfully
    'failed',     -- Execution failed with errors
    'cancelled'   -- User cancelled the job
  )),

  -- Job configuration
  params JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example params structure:
  -- {
  --   "target_group": "AMC",
  --   "target_filter": {"state": "FL", "active": true},
  --   "cadence": {"day0": true, "day4": true, "day10": true},
  --   "templates": {
  --     "intro": "Subject: ...\nBody: ...",
  --     "followup1": "...",
  --     "followup2": "..."
  --   },
  --   "review_mode": true,
  --   "batch_size": 10
  -- }

  -- Ownership & timestamps
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Denormalized metrics for quick access
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  cards_created INTEGER NOT NULL DEFAULT 0,
  cards_approved INTEGER NOT NULL DEFAULT 0,
  cards_executed INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_owner ON jobs(owner_id);

-- ============================================================================
-- 2. JOB_TASKS TABLE: Granular execution steps
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_tasks (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Sequencing
  step INTEGER NOT NULL,
  batch INTEGER NOT NULL DEFAULT 0, -- For incremental planning

  -- Task definition
  kind TEXT NOT NULL CHECK (kind IN (
    'draft_email',      -- Create email content for a target
    'send_email',       -- Send drafted email
    'create_task',      -- Create follow-up task
    'schedule_call',    -- Schedule a call
    'check_portal',     -- Verify portal access
    'update_profile',   -- Update contact/client profile
    'research',         -- Research client/property
    'follow_up',        -- Log follow-up activity
    'create_deal'       -- Create deal record
  )),

  -- Task data
  input JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example input for 'draft_email' targeting multiple contacts:
  -- {
  --   "target_type": "contact_group",
  --   "contact_ids": ["uuid1", "uuid2", ...],
  --   "template": "intro",
  --   "variables": {"company_name": "..."}
  -- }

  output JSONB,
  -- Example output after execution:
  -- {
  --   "cards_created": 5,
  --   "card_ids": ["uuid1", "uuid2", ...],
  --   "errors": [],
  --   "completed_at": "2025-11-03T..."
  -- }

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- Not started
    'running',   -- Currently executing
    'done',      -- Completed successfully
    'error',     -- Failed with error
    'skipped'    -- Cancelled or no longer needed
  )),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,

  -- Metadata
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT job_tasks_step_batch_unique UNIQUE (job_id, batch, step)
);

-- Indexes for job_tasks
CREATE INDEX IF NOT EXISTS idx_job_tasks_job_status ON job_tasks(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_tasks_job_batch ON job_tasks(job_id, batch, step);
CREATE INDEX IF NOT EXISTS idx_job_tasks_pending ON job_tasks(job_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_tasks_created_at ON job_tasks(created_at);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tasks ENABLE ROW LEVEL SECURITY;

-- Jobs: Users can only see/manage jobs in their organization
CREATE POLICY jobs_org_isolation ON jobs
  FOR ALL
  USING (org_id = auth.uid());

-- Job Tasks: Access controlled via parent job
CREATE POLICY job_tasks_via_job ON job_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_tasks.job_id
        AND jobs.org_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Update jobs.updated_at on any change
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll add updated_at column in next migration if needed
-- For now, we track via last_run_at

-- Update job metrics when tasks change
CREATE OR REPLACE FUNCTION update_job_metrics_on_task_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate task counts
  UPDATE jobs
  SET
    total_tasks = (
      SELECT COUNT(*) FROM job_tasks WHERE job_id = NEW.job_id
    ),
    completed_tasks = (
      SELECT COUNT(*) FROM job_tasks WHERE job_id = NEW.job_id AND status = 'done'
    ),
    failed_tasks = (
      SELECT COUNT(*) FROM job_tasks WHERE job_id = NEW.job_id AND status = 'error'
    )
  WHERE id = NEW.job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_metrics
  AFTER INSERT OR UPDATE OF status ON job_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_job_metrics_on_task_change();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to transition job status
CREATE OR REPLACE FUNCTION transition_job_status(
  p_job_id UUID,
  p_new_status TEXT
)
RETURNS VOID AS $$
DECLARE
  v_current_status TEXT;
  v_org_id UUID;
BEGIN
  -- Get current status and verify ownership
  SELECT status, org_id INTO v_current_status, v_org_id
  FROM jobs
  WHERE id = p_job_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;

  -- SECURITY: Verify the caller owns this job
  IF v_org_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: job belongs to different organization';
  END IF;

  -- Validate status transitions
  IF p_new_status = 'running' AND v_current_status NOT IN ('pending', 'paused') THEN
    RAISE EXCEPTION 'Cannot start job from % status', v_current_status;
  END IF;

  -- Update status and timestamps
  UPDATE jobs
  SET
    status = p_new_status,
    started_at = CASE WHEN p_new_status = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
    finished_at = CASE WHEN p_new_status IN ('succeeded', 'failed', 'cancelled') THEN NOW() ELSE NULL END
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a job and skip all pending tasks
CREATE OR REPLACE FUNCTION cancel_job(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- SECURITY: Verify the caller owns this job
  SELECT org_id INTO v_org_id
  FROM jobs
  WHERE id = p_job_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;

  IF v_org_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: job belongs to different organization';
  END IF;

  -- Mark all pending/running tasks as skipped
  UPDATE job_tasks
  SET
    status = 'skipped',
    finished_at = NOW()
  WHERE job_id = p_job_id
    AND status IN ('pending', 'running');

  -- Transition job to cancelled (this will also check authorization again)
  PERFORM transition_job_status(p_job_id, 'cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE jobs IS 'Campaign/project containers for multi-step AI agent workflows';
COMMENT ON TABLE job_tasks IS 'Granular execution steps within a job; one task can spawn multiple kanban cards';

COMMENT ON COLUMN jobs.params IS 'Job configuration: targets, templates, cadence, review_mode, etc.';
COMMENT ON COLUMN jobs.status IS 'Job lifecycle: pending → running → succeeded/failed/cancelled';
COMMENT ON COLUMN job_tasks.kind IS 'Type of task to execute (draft_email, send_email, etc.)';
COMMENT ON COLUMN job_tasks.input IS 'Task-specific parameters (contact_ids, template, variables)';
COMMENT ON COLUMN job_tasks.output IS 'Execution results (cards_created, errors, timestamps)';
COMMENT ON COLUMN job_tasks.batch IS 'Batch number for incremental planning (0=initial, 1+=generated by runner)';


-- ============================================================================
-- MIGRATION 2: Add Job Links
-- ============================================================================

-- Link Jobs to Existing Tables
-- Migration: 20251103000001_add_job_links.sql
-- Purpose: Add job_id foreign keys to kanban_cards and agent_runs for job tracking

-- ============================================================================
-- 1. ADD JOB_ID TO KANBAN_CARDS
-- ============================================================================

-- Add job_id column to kanban_cards
ALTER TABLE kanban_cards
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Add task_id column to link to specific job_task (optional, for 1:many relationship)
ALTER TABLE kanban_cards
ADD COLUMN IF NOT EXISTS task_id BIGINT REFERENCES job_tasks(id) ON DELETE SET NULL;

-- Create indexes for efficient job-based queries
CREATE INDEX IF NOT EXISTS idx_kanban_cards_job ON kanban_cards(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_task ON kanban_cards(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_job_state ON kanban_cards(job_id, state) WHERE job_id IS NOT NULL;

-- ============================================================================
-- 2. ADD JOB_ID TO AGENT_RUNS
-- ============================================================================

-- Add job_id column to agent_runs to track which runs processed which jobs
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Create index for job-run associations
CREATE INDEX IF NOT EXISTS idx_agent_runs_job ON agent_runs(job_id) WHERE job_id IS NOT NULL;

-- ============================================================================
-- 3. UPDATE JOB METRICS ON CARD CHANGES
-- ============================================================================

-- Function to update job metrics when cards change state
CREATE OR REPLACE FUNCTION update_job_metrics_on_card_change()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Get job_id from NEW or OLD record
  v_job_id := COALESCE(NEW.job_id, OLD.job_id);

  -- Only update if card is linked to a job
  IF v_job_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update job metrics based on card states
  UPDATE jobs
  SET
    cards_created = (
      SELECT COUNT(*) FROM kanban_cards WHERE job_id = v_job_id
    ),
    cards_approved = (
      SELECT COUNT(*) FROM kanban_cards WHERE job_id = v_job_id AND state = 'approved'
    ),
    cards_executed = (
      SELECT COUNT(*) FROM kanban_cards WHERE job_id = v_job_id AND state IN ('done', 'executing')
    ),
    emails_sent = (
      SELECT COUNT(*) FROM kanban_cards
      WHERE job_id = v_job_id AND type = 'send_email' AND state = 'done'
    ),
    errors_count = (
      SELECT COUNT(*) FROM kanban_cards WHERE job_id = v_job_id AND state = 'blocked'
    ),
    last_run_at = NOW()
  WHERE id = v_job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job metrics when cards change
CREATE TRIGGER trigger_update_job_metrics_on_card
  AFTER INSERT OR UPDATE OF state OR DELETE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_job_metrics_on_card_change();

-- ============================================================================
-- 4. HELPER FUNCTIONS FOR JOB-CARD RELATIONSHIP
-- ============================================================================

-- Function to get all cards for a job
CREATE OR REPLACE FUNCTION get_job_cards(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  state TEXT,
  priority TEXT,
  client_id UUID,
  contact_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.type,
    kc.title,
    kc.state,
    kc.priority,
    kc.client_id,
    kc.contact_id,
    kc.created_at
  FROM kanban_cards kc
  WHERE kc.job_id = p_job_id
  ORDER BY kc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job progress summary
CREATE OR REPLACE FUNCTION get_job_progress(p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  v_progress JSON;
BEGIN
  SELECT json_build_object(
    'total_cards', COUNT(*),
    'by_state', json_object_agg(state, count),
    'by_type', json_object_agg(type, type_count)
  ) INTO v_progress
  FROM (
    SELECT
      state,
      COUNT(*) as count,
      type,
      COUNT(*) OVER (PARTITION BY type) as type_count
    FROM kanban_cards
    WHERE job_id = p_job_id
    GROUP BY state, type
  ) subq;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON COLUMN kanban_cards.job_id IS 'Links card to a job/campaign (NULL for standalone cards)';
COMMENT ON COLUMN kanban_cards.task_id IS 'Links card to specific job_task (1:many - one task spawns multiple cards)';
COMMENT ON COLUMN agent_runs.job_id IS 'Tracks which job this run processed (NULL for regular runs)';


-- ============================================================================
-- MIGRATION 3: Create Job Metrics View
-- ============================================================================

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
