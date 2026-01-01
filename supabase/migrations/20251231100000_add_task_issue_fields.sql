-- Add issue tracking fields to production_tasks
-- Migration: 20251231100000_add_task_issue_fields.sql
-- Purpose: Support ISSUES column in Resource Tasks Kanban board

-- Add issue tracking columns
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS has_issue BOOLEAN DEFAULT FALSE;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS issue_description TEXT;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS issue_created_at TIMESTAMPTZ;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS issue_created_by UUID REFERENCES profiles(id);

-- Index for efficient issue queries
CREATE INDEX IF NOT EXISTS idx_production_tasks_has_issue
  ON production_tasks(has_issue) WHERE has_issue = TRUE;

-- Comment for documentation
COMMENT ON COLUMN production_tasks.has_issue IS 'True when task has been flagged with an issue via Resource Tasks Kanban';
COMMENT ON COLUMN production_tasks.issue_description IS 'Description of the issue when task is moved to ISSUES column';
COMMENT ON COLUMN production_tasks.issue_created_at IS 'Timestamp when issue was created';
COMMENT ON COLUMN production_tasks.issue_created_by IS 'User who created the issue';
