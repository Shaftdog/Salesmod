---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Testing Instructions - Job Cards Not Creating

## What I Fixed

### 1. Added Comprehensive Logging
**Files Modified:**
- `src/lib/agent/orchestrator.ts` (lines 663-680)
- `src/lib/agent/job-planner.ts` (multiple locations)

The code now logs:
- When expansion starts
- How many contacts were found
- What filters are being used
- Any errors from Supabase queries
- When tasks are marked as error

### 2. Fixed "Pending Task Forever" Bug
**File:** `src/lib/agent/orchestrator.ts` line 667-678

**Before:**
```typescript
if (cards.length === 0) {
  console.log(`Task expanded to 0 cards`);
  continue; // ❌ BUG: Leaves task pending forever
}
```

**After:**
```typescript
if (cards.length === 0) {
  console.error(`Task expanded to 0 cards - marking as error`);
  await supabase
    .from('job_tasks')
    .update({
      status: 'error',
      error_message: 'Expansion returned 0 cards',
      finished_at: new Date().toISOString(),
    })
    .eq('id', task.id);
  continue;
}
```

### 3. Service Role Client (Already Done)
**File:** `src/lib/agent/job-planner.ts` line 7, 146

Changed from `createClient()` to `createServiceRoleClient()` to bypass RLS.

### 4. Reset Pending Tasks
Deleted the stuck pending tasks so the agent can retry.

---

## How to Test

### Step 1: Restart Your Dev Server
**CRITICAL**: The TypeScript changes need to be recompiled!

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
# or
yarn dev
```

### Step 2: Run the Agent
Go to `/agent` page and click "Run Agent" button

### Step 3: Watch the Server Console
You should see detailed logs like:

```
[Jobs] Processing 1 active jobs
[Jobs] Processing job: Rod AMC Profile Check (730a5759-...)
[Jobs] Generated 2 tasks for batch 1
[Jobs] Expanding task 7 (draft_email)...
[expandDraftEmailTask] Task 7: Getting target contacts...
[expandDraftEmailTask] Input: {"template":"Day 4 - Follow-up","variables":{}...}
[getTargetContacts] Called with input: ...
[getTargetContacts] Using target_filter: {"is_active":true,"primary_role_code":"amc_contact"}
[getTargetContacts] Filtering by primary_role_code: amc_contact
[getTargetContacts] Filtering by is_active: true
[getTargetContacts] Executing query with batch size: 10
[getTargetContacts] Query returned 10 contacts
[expandDraftEmailTask] Found 10 target contacts
[expandDraftEmailTask] Using template: Day 4 - Follow-up
[Jobs] Task 7 expanded to 10 cards
[Jobs] Expanding task 7 to 10 cards
[Jobs] Created 10 cards from active jobs
```

---

## Possible Outcomes

### ✅ Success (Expected)
**Console Output:**
```
[getTargetContacts] Query returned 10 contacts
[Jobs] Task 7 expanded to 10 cards
[Jobs] Created 10 cards from active jobs
```

**Database:**
- 10 kanban cards created with `job_id` set
- Task status = 'done'
- Job `cards_created` = 10

**UI:**
- 10 email cards appear in `/agent` with state='suggested'

---

### ❌ Scenario 1: RLS Still Blocking

**Console Output:**
```
[getTargetContacts] Query returned 0 contacts
[expandDraftEmailTask] No target contacts found!
[Jobs] Task 7 (draft_email) expanded to 0 cards - marking as error
```

**What This Means:**
The service role client isn't working or wasn't loaded.

**Solutions:**
1. Verify dev server was restarted (TypeScript needs recompile)
2. Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`
3. Verify import in `job-planner.ts` line 7:
   ```typescript
   import { createServiceRoleClient } from '@/lib/supabase/server';
   ```

---

### ❌ Scenario 2: Query Error

**Console Output:**
```
[getTargetContacts] Failed to fetch contacts with filter: ...
[getTargetContacts] Error details: { message: "...", code: "..." }
```

**What This Means:**
The Supabase query has a syntax error or schema mismatch.

**Solutions:**
1. Check error message in console
2. Verify schema has `primary_role_code` and `is_active` columns
3. Run test query directly in database

---

### ❌ Scenario 3: Wrong Template

**Console Output:**
```
[expandDraftEmailTask] Template Day 4 - Follow-up not found in job params
[expandDraftEmailTask] Available templates: ["Day 0 - Initial Contact", ...]
```

**What This Means:**
The template selection logic is picking the wrong template.

**Solution:**
The planner uses `Object.keys(templates)` which has random order in Python/JS.
Need to fix template selection logic.

---

### ❌ Scenario 4: Card Insert Fails

**Console Output:**
```
[getTargetContacts] Query returned 10 contacts
[expandDraftEmailTask] Found 10 target contacts
[Jobs] Task 7 expanded to 10 cards
[Jobs] Failed to create cards for task 7: ...
```

**What This Means:**
Cards were created but couldn't be inserted into database.

**Solutions:**
1. Check error message
2. Verify `kanban_cards` table has `job_id` and `task_id` columns
3. Check RLS policies on `kanban_cards`

---

## Debugging Queries

### Check if tasks were created:
```sql
SELECT 
  id, batch, step, kind, status, 
  error_message, created_at
FROM job_tasks
WHERE job_id = '730a5759-37b1-4c90-99a2-f166ab19704d'
ORDER BY created_at DESC;
```

### Check if cards were created:
```sql
SELECT 
  id, title, state, job_id, task_id, created_at
FROM kanban_cards
WHERE job_id = '730a5759-37b1-4c90-99a2-f166ab19704d'
ORDER BY created_at DESC;
```

### Test contact query directly:
```sql
SELECT COUNT(*) as count
FROM contacts c
JOIN clients cl ON c.client_id = cl.id
WHERE c.email IS NOT NULL
  AND cl.primary_role_code = 'amc_contact'
  AND cl.is_active = true;
-- Should return 134
```

---

## Summary

✅ **Code fixed** with comprehensive logging  
✅ **Pending tasks cleared** so agent can retry  
✅ **Service role client** to bypass RLS  
✅ **Bug fixed** where tasks stayed pending forever  

**Next Action:** 
1. **Restart dev server** (most important!)
2. Run agent from `/agent` page
3. Watch server console for logs
4. Report back what you see in the console

The logs will tell us exactly where it's failing! 🔍



