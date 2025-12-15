-- =============================================
-- Add tenant_id to deals table for proper multi-tenant RLS enforcement
-- Created: 2025-12-01
-- Following the multi-tenant pattern established in 20251129 migrations
-- =============================================

-- 1. Add tenant_id column (nullable first for backfill)
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- 2. Backfill tenant_id from client relationship (clients have tenant_id)
UPDATE public.deals d
SET tenant_id = c.tenant_id
FROM public.clients c
WHERE d.client_id = c.id
  AND d.tenant_id IS NULL
  AND c.tenant_id IS NOT NULL;

-- 3. For any remaining NULL values, get tenant_id from created_by user's profile
UPDATE public.deals d
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE d.created_by = p.id
  AND d.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- 4. Make NOT NULL (only if no NULL values remain)
DO $$
BEGIN
  -- Check if there are any NULL values remaining
  IF NOT EXISTS (SELECT 1 FROM public.deals WHERE tenant_id IS NULL) THEN
    ALTER TABLE public.deals ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END
$$;

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id
ON public.deals(tenant_id);

-- 6. Update RLS policies to use tenant_id
-- First, drop any existing policies
DROP POLICY IF EXISTS "Deals viewable by authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can update deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can delete deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view their deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their deals" ON public.deals;

-- New policies using tenant_id for proper multi-tenant isolation
CREATE POLICY "deals_select_tenant"
  ON public.deals FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "deals_insert_tenant"
  ON public.deals FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "deals_update_tenant"
  ON public.deals FOR UPDATE
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

CREATE POLICY "deals_delete_tenant"
  ON public.deals FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- 7. Add comment
COMMENT ON COLUMN public.deals.tenant_id IS 'Tenant ID for multi-tenant RLS enforcement - organization that owns this deal';
