# Quick Fix Guide: Task Library RLS Issue

## Problem
Task Library shows "0 tasks, 0 subtasks" even when authenticated.

## Cause
RLS fix migration not applied to database.

## Solution (Choose One)

### Option A: Supabase CLI (Fastest)
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Option B: Supabase Dashboard (Most Reliable)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy all SQL from: `supabase/migrations/20251125000001_fix_task_library_rls.sql`
3. Paste into SQL editor
4. Click "Run"

### Option C: Manual SQL (Quick & Dirty)
Run this in Supabase SQL Editor:

```sql
-- Drop old restrictive policies
DROP POLICY IF EXISTS task_library_org_isolation ON task_library;
DROP POLICY IF EXISTS task_library_subtasks_via_task ON task_library_subtasks;
DROP POLICY IF EXISTS template_library_tasks_via_template ON template_library_tasks;

-- Create new shared read policies
CREATE POLICY task_library_read ON task_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY task_library_create ON task_library
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY task_library_update ON task_library
  FOR UPDATE USING (created_by = auth.uid() OR org_id = auth.uid());

CREATE POLICY task_library_delete ON task_library
  FOR DELETE USING (created_by = auth.uid() OR org_id = auth.uid());

CREATE POLICY task_library_subtasks_read ON task_library_subtasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY task_library_subtasks_create ON task_library_subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_library
      WHERE task_library.id = task_library_subtasks.library_task_id
        AND auth.uid() IS NOT NULL
    )
  );

CREATE POLICY task_library_subtasks_update ON task_library_subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM task_library
      WHERE task_library.id = task_library_subtasks.library_task_id
        AND (task_library.created_by = auth.uid() OR task_library.org_id = auth.uid())
    )
  );

CREATE POLICY task_library_subtasks_delete ON task_library_subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM task_library
      WHERE task_library.id = task_library_subtasks.library_task_id
        AND (task_library.created_by = auth.uid() OR task_library.org_id = auth.uid())
    )
  );

CREATE POLICY template_library_tasks_read ON template_library_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_create ON template_library_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_update ON template_library_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_delete ON template_library_tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);
```

## Verify Fix

### Automated Test
```bash
npx playwright test e2e/task-library-interactive.spec.ts --headed
```

Expected output:
```
✅ Badge shows "30 tasks, 266 subtasks"
✅ All 10 stages visible
✅ INTAKE shows 16 tasks
```

### Manual Test
1. Open: http://localhost:9002/production/library
2. Check badge at top: Should show "30 tasks, 266 subtasks"
3. Expand INTAKE stage: Should show 16 tasks
4. Click on a task: Should see subtasks

### Database Check
1. Supabase Dashboard → Database → Policies
2. Look for: `task_library_read`
3. Check definition: `auth.uid() IS NOT NULL`

## If Still Not Working

1. Check Supabase logs for errors
2. Verify user is authenticated (check auth.uid() in SQL)
3. Run: `SELECT COUNT(*) FROM task_library;` in SQL editor (should return 30)
4. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_library';`

## Need Help?

See detailed report: `TEST-RESULTS-SUMMARY.md`
