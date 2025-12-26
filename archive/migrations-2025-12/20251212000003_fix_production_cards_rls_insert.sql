-- Migration: Fix production_cards RLS policy to allow INSERT
-- The existing policy only has USING clause, which doesn't work for INSERT
-- We need WITH CHECK for INSERT operations

-- Drop existing policy
DROP POLICY IF EXISTS production_cards_tenant_isolation ON public.production_cards;
DROP POLICY IF EXISTS production_cards_org_isolation ON public.production_cards;

-- Create new policy with both USING (for SELECT/UPDATE/DELETE) and WITH CHECK (for INSERT/UPDATE)
CREATE POLICY production_cards_tenant_isolation
  ON public.production_cards
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Also fix production_tasks RLS policy
DROP POLICY IF EXISTS production_tasks_tenant_isolation ON public.production_tasks;

CREATE POLICY production_tasks_tenant_isolation
  ON public.production_tasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.production_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON POLICY production_cards_tenant_isolation ON public.production_cards IS
  'Tenant isolation: users can only access production cards belonging to their tenant';

COMMENT ON POLICY production_tasks_tenant_isolation ON public.production_tasks IS
  'Tenant isolation: users can only access production tasks belonging to their tenant';
