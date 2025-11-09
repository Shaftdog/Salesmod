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
