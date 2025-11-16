# Job System Fix Summary

## Problem
You created a job but the autonomous agent wasn't creating cards for it.

## Root Causes Identified

### 1. Job Not Started
- **Issue**: Job was created with status `'pending'` but never transitioned to `'running'`
- **Fix**: Used `transition_job_status()` function to start the job
- **Result**: ✅ Job is now running

### 2. Schema Mismatch in Job Planner
- **Issue**: The `job-planner.ts` code was querying for fields that don't exist:
  - Looking for `clients.state` (doesn't exist)
  - Looking for `clients.active` (actual field is `is_active`)
  - Not querying `clients.primary_role_code` (needed for AMC filtering)
  
- **Fix**: Updated `/src/lib/agent/job-planner.ts` (lines 382-414):
  ```typescript
  // BEFORE: Wrong fields
  clients!inner(
    id,
    company_name,
    client_type,
    state,        // ❌ doesn't exist
    active        // ❌ wrong field name
  )
  
  // AFTER: Correct fields
  clients!inner(
    id,
    company_name,
    client_type,
    primary_role_code,  // ✅ added
    is_active           // ✅ correct name
  )
  ```

- **Filter logic updated**:
  ```typescript
  // Added support for primary_role_code filtering
  if (filter.primary_role_code) {
    query = query.eq('clients.primary_role_code', filter.primary_role_code);
  }
  
  // Fixed is_active filtering
  if (filter.is_active !== undefined) {
    query = query.eq('clients.is_active', filter.is_active);
  }
  ```

### 3. Job Missing Target Filter
- **Issue**: Job was created with `target_group: 'AMC Contact'` but had empty `target_filter: {}`
- **Fix**: Updated job params to include proper filter:
  ```json
  {
    "target_filter": {
      "primary_role_code": "amc_contact",
      "is_active": true
    }
  }
  ```
- **Result**: ✅ Query now finds 134 AMC contacts

### 4. Stale Batch 0 Tasks
- **Issue**: Job had batch 0 tasks created with empty filters before the fixes
- **Fix**: Deleted batch 0 tasks so agent can create fresh batch 1 with correct settings
- **Result**: ✅ Agent will now generate proper tasks

---

## Current Status

### ✅ All Fixes Applied

1. **Job Started**: Status = `'running'`
2. **Code Fixed**: `job-planner.ts` now queries correct fields
3. **Job Configured**: Proper target_filter in place
4. **Tasks Reset**: Ready for agent to generate fresh batch

### 📊 Database State

- **Job ID**: `730a5759-37b1-4c90-99a2-f166ab19704d`
- **Job Name**: "Rod AMC Profile Check"
- **Status**: `running`
- **Target**: 134 AMC contacts (will process 10 per batch)
- **Templates**: 4 email templates (Day 0, 4, 10, 21)
- **Batch Size**: 10 contacts per batch
- **Review Mode**: `true` (cards will be suggested, not auto-sent)

---

## How to Test

### Option 1: Wait for Scheduled Run
The agent likely runs automatically on a schedule. Next time it runs, it will:
1. Find your running job
2. See batch 0 is complete (no tasks)
3. Generate batch 1 tasks with correct filter
4. Create 10 email cards for the first 10 AMC contacts
5. Cards will appear in `/agent` with state `'suggested'`

### Option 2: Manually Trigger Agent
From your app, trigger the agent:
```bash
# Via UI: Go to /agent page and click "Run Agent" button

# Via API (with auth):
POST /api/agent/run
Body: { "mode": "review" }
```

### Option 3: Direct Function Call (Development)
```typescript
import { runWorkBlock } from '@/lib/agent/orchestrator';

// In a server context with proper auth
await runWorkBlock(orgId, 'review');
```

---

## What Will Happen

When the agent runs, it will:

1. **Find Active Jobs**
   ```sql
   SELECT * FROM jobs 
   WHERE org_id = '...' 
     AND status = 'running'
   ```

2. **Check Current Batch**
   - Latest batch: 0 (no tasks)
   - Pending tasks in batch 0: 0
   - Conclusion: Batch 0 is complete, proceed to batch 1

3. **Generate Batch 1 Tasks**
   - Select template: "Day 0 - Initial Contact" (first in cadence)
   - Create `draft_email` task with target_filter
   - Create `send_email` task (depends on draft_email)

4. **Expand Tasks to Cards**
   - Query contacts:
     ```sql
     SELECT c.id, c.first_name, c.last_name, c.email, c.client_id
     FROM contacts c
     JOIN clients cl ON c.client_id = cl.id
     WHERE c.email IS NOT NULL
       AND cl.primary_role_code = 'amc_contact'
       AND cl.is_active = true
     LIMIT 10
     ```
   - For each of 10 contacts, create a kanban card:
     - Type: `'send_email'`
     - State: `'suggested'` (review_mode = true)
     - Title: "Email: [Contact Name] - [Subject]"
     - Payload: { to, subject, body with variables replaced }
     - Linked to job_id and task_id

5. **Update Job Metrics**
   - `cards_created`: 10
   - `total_tasks`: 2 (draft_email, send_email)
   - `last_run_at`: current timestamp

---

## Expected Result

### In the Database

```sql
-- Job updated
SELECT * FROM jobs WHERE id = '730a5759-37b1-4c90-99a2-f166ab19704d';
-- status: 'running'
-- cards_created: 10
-- total_tasks: 2

-- Tasks created
SELECT * FROM job_tasks WHERE job_id = '730a5759-37b1-4c90-99a2-f166ab19704d';
-- Batch 1, Step 0: draft_email (status: done)
-- Batch 1, Step 1: send_email (status: pending)

-- Cards created
SELECT * FROM kanban_cards WHERE job_id = '730a5759-37b1-4c90-99a2-f166ab19704d';
-- 10 email cards, all with:
--   - state: 'suggested'
--   - type: 'send_email'
--   - job_id: linked to job
--   - task_id: linked to draft_email task
--   - action_payload: contains email details
```

### In the UI (`/agent` page)

You should see 10 new suggested cards like:
- **Email: [Contact Name] - Quick Check-in - Confirming Active Status**
  - Priority: medium
  - State: Suggested (needs review)
  - Rationale: Job "Rod AMC Profile Check" - Day 0 - Initial Contact template (batch 1)
  - Contains personalized email with contact's name replaced

---

## Next Steps After Cards Are Created

1. **Review Cards**: Go to `/agent` and review the suggested email cards
2. **Approve or Reject**: 
   - Approve cards you want to send
   - Reject or edit cards that need changes
3. **Agent Sends Approved**: Next agent run will execute approved cards
4. **Batch 2 Generated**: After batch 1 completes, agent will generate batch 2 (Day 4 follow-up)
5. **Repeat**: Process continues through all cadence steps (Day 0, 4, 10, 21)

---

## Files Modified

### ✅ `/src/lib/agent/job-planner.ts`
- Fixed `getTargetContacts()` query to use correct field names
- Added `primary_role_code` filtering
- Fixed `is_active` vs `active` field name
- Removed non-existent `state` field

### ✅ Database: `jobs` table
- Updated job params with correct `target_filter`

### ✅ Database: `job_tasks` table
- Deleted stale batch 0 tasks

---

## Verification Query

Run this to check current job status:

```sql
-- Job details
SELECT 
  j.id,
  j.name,
  j.status,
  j.total_tasks,
  j.completed_tasks,
  j.cards_created,
  j.params->'target_filter' as target_filter
FROM jobs j
WHERE j.status = 'running';

-- Tasks for this job
SELECT 
  jt.batch,
  jt.step,
  jt.kind,
  jt.status,
  jt.input
FROM job_tasks jt
WHERE jt.job_id = '730a5759-37b1-4c90-99a2-f166ab19704d'
ORDER BY jt.batch, jt.step;

-- Cards from this job
SELECT 
  kc.id,
  kc.type,
  kc.title,
  kc.state,
  kc.created_at
FROM kanban_cards kc
WHERE kc.job_id = '730a5759-37b1-4c90-99a2-f166ab19704d'
ORDER BY kc.created_at DESC;
```

---

## Summary

✅ **Root causes identified and fixed**
✅ **Code updated to match database schema**  
✅ **Job configured with correct filters**  
✅ **Ready for agent to process**

The agent will create cards on its next run. You should see 10 email cards appear for your AMC contacts! 🎉



