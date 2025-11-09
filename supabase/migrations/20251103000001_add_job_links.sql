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
