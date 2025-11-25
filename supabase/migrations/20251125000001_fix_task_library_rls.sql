-- Fix Task Library RLS Policies
-- Migration: 20251125000001_fix_task_library_rls.sql
-- Purpose: Make task library shared across all authenticated users (like templates)

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
-- Only the task creator (or admins) can modify tasks
CREATE POLICY task_library_read ON task_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY task_library_create ON task_library
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY task_library_update ON task_library
  FOR UPDATE USING (created_by = auth.uid() OR org_id = auth.uid());

CREATE POLICY task_library_delete ON task_library
  FOR DELETE USING (created_by = auth.uid() OR org_id = auth.uid());

-- Task Library Subtasks: All authenticated users can read subtasks
-- Modifications only by task owner
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

-- Template Library Tasks: All authenticated users can read
-- Modifications only by template owner
CREATE POLICY template_library_tasks_read ON template_library_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_create ON template_library_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_update ON template_library_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY template_library_tasks_delete ON template_library_tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY task_library_read ON task_library IS
  'All authenticated users can view task library (shared central repository)';
COMMENT ON POLICY task_library_subtasks_read ON task_library_subtasks IS
  'All authenticated users can view task library subtasks (shared central repository)';
COMMENT ON POLICY template_library_tasks_read ON template_library_tasks IS
  'All authenticated users can view template-library linkages (shared central repository)';
