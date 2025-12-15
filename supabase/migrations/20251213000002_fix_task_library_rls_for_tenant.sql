-- Migration: Fix task_library RLS policies for tenant-based access
-- Current policy only allows creator/owner to update
-- New policy allows any user in the same tenant to update

-- First add tenant_id column if it doesn't exist
ALTER TABLE task_library
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Backfill tenant_id from the creator's profile
UPDATE task_library t
SET tenant_id = p.tenant_id
FROM profiles p
WHERE t.created_by = p.id
  AND t.tenant_id IS NULL;

-- If created_by is null, try org_id
UPDATE task_library t
SET tenant_id = p.tenant_id
FROM profiles p
WHERE t.org_id = p.id
  AND t.tenant_id IS NULL;

-- Create index on tenant_id
CREATE INDEX IF NOT EXISTS idx_task_library_tenant ON task_library(tenant_id);

-- Drop existing update policy
DROP POLICY IF EXISTS task_library_update ON task_library;

-- Create new update policy that allows tenant members to update
CREATE POLICY task_library_update ON task_library
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Also update delete policy
DROP POLICY IF EXISTS task_library_delete ON task_library;

CREATE POLICY task_library_delete ON task_library
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update read policy to be tenant-scoped (optional but recommended)
DROP POLICY IF EXISTS task_library_read ON task_library;

CREATE POLICY task_library_read ON task_library
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update insert policy to set tenant_id
DROP POLICY IF EXISTS task_library_create ON task_library;

CREATE POLICY task_library_create ON task_library
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Also fix task_library_subtasks policies
DROP POLICY IF EXISTS task_library_subtasks_update ON task_library_subtasks;

CREATE POLICY task_library_subtasks_update ON task_library_subtasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_library t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = task_library_subtasks.library_task_id
        AND t.tenant_id = p.tenant_id
    )
  );

DROP POLICY IF EXISTS task_library_subtasks_delete ON task_library_subtasks;

CREATE POLICY task_library_subtasks_delete ON task_library_subtasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_library t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = task_library_subtasks.library_task_id
        AND t.tenant_id = p.tenant_id
    )
  );

DROP POLICY IF EXISTS task_library_subtasks_read ON task_library_subtasks;

CREATE POLICY task_library_subtasks_read ON task_library_subtasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_library t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = task_library_subtasks.library_task_id
        AND t.tenant_id = p.tenant_id
    )
  );

DROP POLICY IF EXISTS task_library_subtasks_create ON task_library_subtasks;

CREATE POLICY task_library_subtasks_create ON task_library_subtasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_library t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = task_library_subtasks.library_task_id
        AND t.tenant_id = p.tenant_id
    )
  );
