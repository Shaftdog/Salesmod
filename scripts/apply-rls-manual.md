# Manual Application of Task Library RLS Fix

Since automated methods are failing due to connection issues, here's how to apply the fix manually:

## Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/sql

2. Paste the following SQL and click "RUN":

```sql
-- ============================================================================
-- Drop old restrictive policies
-- ============================================================================

DROP POLICY IF EXISTS task_library_org_isolation ON task_library;
DROP POLICY IF EXISTS task_library_subtasks_via_task ON task_library_subtasks;
DROP POLICY IF EXISTS template_library_tasks_via_template ON template_library_tasks;

-- ============================================================================
-- Create new shared policies
-- ============================================================================

-- Task Library: All authenticated users can read active tasks
CREATE POLICY task_library_read ON task_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY task_library_create ON task_library
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY task_library_update ON task_library
  FOR UPDATE USING (created_by = auth.uid() OR org_id = auth.uid());

CREATE POLICY task_library_delete ON task_library
  FOR DELETE USING (created_by = auth.uid() OR org_id = auth.uid());

-- Task Library Subtasks
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

-- Template Library Tasks
CREATE POLICY template_library_tasks_read ON template_library_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_create ON template_library_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_update ON template_library_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_delete ON template_library_tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);
```

3. Verify the policies were created:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('task_library', 'task_library_subtasks', 'template_library_tasks')
ORDER BY tablename, policyname;
```

## Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db execute -f supabase/migrations/20251125000001_fix_task_library_rls.sql --project-ref zqhenxhgcjxslpfezybm
```

## Option 3: psql Command Line

If you have PostgreSQL psql installed:

```bash
set PGPASSWORD=NsjCsuLJfBswVhdI
psql -h db.zqhenxhgcjxslpfezybm.supabase.co -U postgres -d postgres -f supabase/migrations/20251125000001_fix_task_library_rls.sql
```

## What This Fix Does

This migration makes the task library shared across all authenticated users (like the template library):

- **Before**: Only users in the same org could see tasks
- **After**: All authenticated users can see all tasks (central repository)
- **Modifications**: Still restricted to task creator or org admin

This aligns with how templates work - shared content for everyone to use.

## Verification

After applying, you should see these policies:

### task_library
- `task_library_read` - All authenticated users can SELECT
- `task_library_create` - All authenticated users can INSERT
- `task_library_update` - Only creator/org can UPDATE
- `task_library_delete` - Only creator/org can DELETE

### task_library_subtasks
- `task_library_subtasks_read` - All authenticated users can SELECT
- `task_library_subtasks_create` - All authenticated users can INSERT (if parent task exists)
- `task_library_subtasks_update` - Only parent task creator/org can UPDATE
- `task_library_subtasks_delete` - Only parent task creator/org can DELETE

### template_library_tasks
- `template_library_tasks_read` - All authenticated users can SELECT
- `template_library_tasks_create` - All authenticated users can INSERT
- `template_library_tasks_update` - All authenticated users can UPDATE
- `template_library_tasks_delete` - All authenticated users can DELETE
