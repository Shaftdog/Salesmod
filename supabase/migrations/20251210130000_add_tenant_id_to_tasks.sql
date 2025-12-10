-- =============================================
-- Add tenant_id to tasks table
-- Created: 2025-12-10
-- Fix for: "Could not find the 'tenant_id' column of 'tasks' in the schema cache"
-- =============================================

-- 1. Add tenant_id column (nullable first for backfill)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- 2. Backfill tenant_id from assigned_to user's profile
UPDATE public.tasks t
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE t.assigned_to = p.id
  AND t.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- 3. Backfill from created_by user's profile (if assigned_to didn't work)
UPDATE public.tasks t
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE t.created_by = p.id
  AND t.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- 4. Backfill from client's tenant_id
UPDATE public.tasks t
SET tenant_id = c.tenant_id
FROM public.clients c
WHERE t.client_id = c.id
  AND t.tenant_id IS NULL
  AND c.tenant_id IS NOT NULL;

-- 5. Final fallback: Use the main tenant for any remaining NULLs
UPDATE public.tasks
SET tenant_id = 'da0563f7-7d29-4c02-b835-422f31c82b7b'
WHERE tenant_id IS NULL;

-- 6. Make NOT NULL
ALTER TABLE public.tasks ALTER COLUMN tenant_id SET NOT NULL;

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id
ON public.tasks(tenant_id);

-- 8. Update RLS policies to use tenant_id
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

-- New tenant-based RLS policies
CREATE POLICY "tasks_select_tenant"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_tenant"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_tenant"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete_tenant"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- 9. Add comment
COMMENT ON COLUMN public.tasks.tenant_id IS 'Tenant ID for multi-tenant RLS enforcement';
