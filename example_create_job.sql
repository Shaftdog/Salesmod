-- Example: Create a Test Job
-- This demonstrates the full workflow of creating a job with tasks

-- ============================================================================
-- 1. CREATE A JOB
-- ============================================================================

-- First, let's create a test campaign job
INSERT INTO jobs (
  org_id,
  name,
  description,
  status,
  params,
  owner_id
)
VALUES (
  auth.uid(), -- Your organization ID
  'Q4 2025 Florida AMC Outreach',
  'Multi-touch email campaign targeting AMC portfolio managers in Florida with property updates and quarterly review invitations.',
  'pending', -- Will be started later
  jsonb_build_object(
    -- Target Configuration
    'target_group', 'AMC',
    'target_filter', jsonb_build_object(
      'state', 'FL',
      'active', true,
      'has_portal_access', true
    ),
    
    -- Email Cadence
    'cadence', jsonb_build_object(
      'day0', true,   -- Initial outreach
      'day4', true,   -- First follow-up
      'day10', true   -- Second follow-up
    ),
    
    -- Email Templates
    'templates', jsonb_build_object(
      'intro', E'Subject: Q4 Property Performance Update\n\nHi {{first_name}},\n\nI hope this message finds you well...',
      'followup1', E'Subject: Re: Q4 Property Performance Update\n\nHi {{first_name}},\n\nFollowing up on my previous email...',
      'followup2', E'Subject: Final Reminder - Q4 Review\n\nHi {{first_name}},\n\nLast chance to schedule...'
    ),
    
    -- Execution Settings
    'review_mode', true,      -- Require human approval before sending
    'batch_size', 10,          -- Process 10 contacts per batch
    'auto_schedule', true,     -- Automatically schedule follow-ups
    'working_hours_only', true -- Only send during 9am-5pm ET
  ),
  auth.uid() -- Owner
)
RETURNING 
  id AS job_id,
  name,
  status,
  created_at;

-- Save the job_id from the output above and use it below
-- For this example, let's assume the job_id is: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
-- Replace this with your actual job_id

-- ============================================================================
-- 2. ADD INITIAL TASKS (Batch 0)
-- ============================================================================

-- Task 1: Draft initial outreach emails
INSERT INTO job_tasks (
  job_id,
  step,
  batch,
  kind,
  input,
  status
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', -- Replace with your job_id
  1,
  0, -- Initial batch
  'draft_email',
  jsonb_build_object(
    'target_type', 'contact_group',
    'filter', jsonb_build_object(
      'organization_type', 'AMC',
      'state', 'FL'
    ),
    'template', 'intro',
    'max_contacts', 10, -- First batch of 10
    'variables', jsonb_build_object(
      'sender_name', 'John Doe',
      'company_name', 'Your Company',
      'quarter', 'Q4 2025'
    )
  ),
  'pending'
)
RETURNING id AS task_id, kind, status;

-- Task 2: Review drafted emails (human step)
INSERT INTO job_tasks (
  job_id,
  step,
  batch,
  kind,
  input,
  status
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', -- Replace with your job_id
  2,
  0,
  'create_task',
  jsonb_build_object(
    'task_type', 'review_emails',
    'wait_for_completion', true,
    'message', 'Review and approve drafted emails before sending'
  ),
  'pending'
)
RETURNING id AS task_id, kind, status;

-- Task 3: Send approved emails
INSERT INTO job_tasks (
  job_id,
  step,
  batch,
  kind,
  input,
  status
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', -- Replace with your job_id
  3,
  0,
  'send_email',
  jsonb_build_object(
    'only_approved', true,
    'respect_working_hours', true,
    'track_opens', true,
    'track_clicks', true
  ),
  'pending'
)
RETURNING id AS task_id, kind, status;

-- Task 4: Schedule follow-up tasks
INSERT INTO job_tasks (
  job_id,
  step,
  batch,
  kind,
  input,
  status
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', -- Replace with your job_id
  4,
  0,
  'create_task',
  jsonb_build_object(
    'task_type', 'schedule_followup',
    'days_after', 4,
    'template', 'followup1',
    'create_calendar_reminder', true
  ),
  'pending'
)
RETURNING id AS task_id, kind, status;

-- ============================================================================
-- 3. START THE JOB
-- ============================================================================

-- Transition the job to 'running' status
SELECT transition_job_status(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', -- Replace with your job_id
  'running'
);

-- ============================================================================
-- 4. QUERY JOB STATUS
-- ============================================================================

-- Check the job and its tasks
SELECT 
  j.id,
  j.name,
  j.status AS job_status,
  j.total_tasks,
  j.completed_tasks,
  j.failed_tasks,
  j.started_at,
  EXTRACT(EPOCH FROM (NOW() - j.started_at)) AS running_seconds
FROM jobs j
WHERE j.id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; -- Replace with your job_id

-- View all tasks for this job
SELECT
  jt.id,
  jt.step,
  jt.batch,
  jt.kind,
  jt.status,
  jt.created_at,
  jt.started_at,
  jt.finished_at,
  jt.error_message
FROM job_tasks jt
WHERE jt.job_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -- Replace with your job_id
ORDER BY jt.batch, jt.step;

-- Get job progress summary
SELECT get_job_progress('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'); -- Replace with your job_id

-- ============================================================================
-- 5. SIMULATE TASK EXECUTION (for testing)
-- ============================================================================

-- Mark first task as running
UPDATE job_tasks
SET 
  status = 'running',
  started_at = NOW()
WHERE job_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -- Replace with your job_id
  AND step = 1
  AND batch = 0;

-- Simulate task completion with output
UPDATE job_tasks
SET 
  status = 'done',
  finished_at = NOW(),
  output = jsonb_build_object(
    'cards_created', 10,
    'card_ids', ARRAY[
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      gen_random_uuid()
    ],
    'contacts_processed', 10,
    'completed_at', NOW()
  )
WHERE job_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -- Replace with your job_id
  AND step = 1
  AND batch = 0;

-- Check metrics (automatically updated by trigger)
SELECT 
  j.total_tasks,
  j.completed_tasks,
  j.failed_tasks,
  j.cards_created
FROM jobs j
WHERE j.id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; -- Replace with your job_id

-- ============================================================================
-- 6. CANCEL JOB (if needed)
-- ============================================================================

-- To cancel a running job and skip all pending tasks:
-- SELECT cancel_job('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'); -- Replace with your job_id

-- ============================================================================
-- 7. VIEW METRICS
-- ============================================================================

-- Refresh materialized view (if needed)
SELECT refresh_job_metrics();

-- View job metrics
SELECT * FROM job_metrics 
WHERE job_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; -- Replace with your job_id

-- View organization performance summary
SELECT * FROM job_performance_summary 
WHERE org_id = auth.uid();

-- ============================================================================
-- CLEANUP (optional - for testing only)
-- ============================================================================

-- To delete the test job (will cascade to job_tasks):
-- DELETE FROM jobs WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; -- Replace with your job_id



