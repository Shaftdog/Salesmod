-- =============================================
-- Fix: Add tenant_id to contacts table
-- The contacts table was missed in the original tenant_id migration
-- but RLS policies reference it - this fixes the mismatch
-- Created: 2025-12-01
-- =============================================

-- 1. Add tenant_id column (nullable first for backfill)
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Backfill tenant_id from client relationship (clients have tenant_id)
UPDATE public.contacts c
SET tenant_id = cl.tenant_id
FROM public.clients cl
WHERE c.client_id = cl.id
  AND c.tenant_id IS NULL
  AND cl.tenant_id IS NOT NULL;

-- 3. For contacts without clients, try to get tenant_id from org_id (user's profile)
UPDATE public.contacts c
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE c.org_id = p.id
  AND c.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id
ON public.contacts(tenant_id);

-- 5. Add index for email lookups within tenant
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email
ON public.contacts(tenant_id, email);

-- 6. Drop the broken RLS policy (references tenant_id that didn't exist)
DROP POLICY IF EXISTS contacts_tenant_isolation ON public.contacts;

-- 7. Create proper RLS policies that support both org_id (legacy) and tenant_id
-- SELECT policy - users can view contacts in their tenant or their own contacts
CREATE POLICY "contacts_select_policy"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (
    org_id = auth.uid()  -- Legacy: own contacts
    OR
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )  -- Multi-tenant: team contacts
  );

-- INSERT policy
CREATE POLICY "contacts_insert_policy"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "contacts_update_policy"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "contacts_delete_policy"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- 8. Add comment
COMMENT ON COLUMN public.contacts.tenant_id IS 'Tenant ID for multi-tenant RLS enforcement - organization that owns this contact';

-- 9. Verification
DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_count FROM public.contacts;
  SELECT COUNT(*) INTO v_null_count FROM public.contacts WHERE tenant_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONTACTS TENANT_ID MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total contacts: %', v_total_count;
  RAISE NOTICE 'Contacts with tenant_id: %', v_total_count - v_null_count;
  RAISE NOTICE 'Contacts without tenant_id: %', v_null_count;
  RAISE NOTICE '';

  IF v_null_count > 0 THEN
    RAISE NOTICE 'WARNING: % contacts still have NULL tenant_id', v_null_count;
    RAISE NOTICE 'These may be orphaned contacts that need manual cleanup';
  ELSE
    RAISE NOTICE 'SUCCESS: All contacts have tenant_id assigned';
  END IF;

  RAISE NOTICE '========================================';
END $$;
