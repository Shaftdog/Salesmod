-- =============================================
-- Fix Products RLS Policies
-- Problem: Old RLS policies required auth.uid() = org_id
-- But products have org_id from the original creator, not the current user
-- This blocked team members from seeing products
--
-- Solution: Replace org_id-based policies with tenant_id-based policies
-- All team members share the same tenant_id, so they can all see products
-- =============================================

-- =============================================
-- DROP OLD ORG_ID-BASED POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view their org's products" ON public.products;
DROP POLICY IF EXISTS "Users can update their org's products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their org's products" ON public.products;
DROP POLICY IF EXISTS "Users can create products for their org" ON public.products;
DROP POLICY IF EXISTS "products_tenant_isolation" ON public.products;

-- =============================================
-- CREATE NEW TENANT_ID-BASED POLICIES
-- =============================================

CREATE POLICY "products_tenant_select"
ON public.products
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "products_tenant_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "products_tenant_update"
ON public.products
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "products_tenant_delete"
ON public.products
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BACKFILL tenant_id (original content below)
-- =============================================

-- =============================================
-- DIAGNOSTICS BEFORE FIX
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
  v_tenant_count INTEGER;
BEGIN
  -- Count products with NULL tenant_id
  SELECT COUNT(*) INTO v_null_count FROM public.products WHERE tenant_id IS NULL;
  SELECT COUNT(*) INTO v_total_count FROM public.products;
  SELECT COUNT(DISTINCT tenant_id) INTO v_tenant_count FROM public.profiles WHERE tenant_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRODUCTS TENANT_ID FIX - DIAGNOSTICS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total products: %', v_total_count;
  RAISE NOTICE 'Products with NULL tenant_id: %', v_null_count;
  RAISE NOTICE 'Available tenants in profiles: %', v_tenant_count;
  RAISE NOTICE '';
END $$;

-- =============================================
-- FIX 1: Backfill from org_id → profile tenant
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- First attempt: Use org_id to find the user's profile and get their tenant_id
  UPDATE public.products pr
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pr.org_id = p.id
    AND pr.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Fix 1: Backfilled % products from org_id → profile tenant_id', v_updated_count;
END $$;

-- =============================================
-- FIX 2: Backfill from created_by → profile tenant
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Second attempt: Use created_by to find the user's profile and get their tenant_id
  UPDATE public.products pr
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE pr.created_by = p.id
    AND pr.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Fix 2: Backfilled % products from created_by → profile tenant_id', v_updated_count;
END $$;

-- =============================================
-- FIX 3: Use default tenant for remaining orphans
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_default_tenant UUID;
  v_remaining INTEGER;
BEGIN
  -- Check how many products still have NULL tenant_id
  SELECT COUNT(*) INTO v_remaining FROM public.products WHERE tenant_id IS NULL;

  IF v_remaining > 0 THEN
    -- Get the most common tenant_id from profiles (likely the primary tenant)
    SELECT tenant_id INTO v_default_tenant
    FROM public.profiles
    WHERE tenant_id IS NOT NULL
    GROUP BY tenant_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    IF v_default_tenant IS NOT NULL THEN
      -- Apply to remaining products with NULL tenant_id
      UPDATE public.products
      SET tenant_id = v_default_tenant
      WHERE tenant_id IS NULL;

      GET DIAGNOSTICS v_updated_count = ROW_COUNT;
      RAISE NOTICE 'Fix 3: Assigned % orphaned products to default tenant %', v_updated_count, v_default_tenant;
    ELSE
      RAISE WARNING 'No default tenant found - % products remain without tenant_id!', v_remaining;
    END IF;
  ELSE
    RAISE NOTICE 'Fix 3: No orphaned products remaining';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
  v_by_tenant RECORD;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM public.products WHERE tenant_id IS NULL;
  SELECT COUNT(*) INTO v_total_count FROM public.products;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRODUCTS TENANT_ID FIX - VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total products: %', v_total_count;
  RAISE NOTICE 'Products with NULL tenant_id: %', v_null_count;

  IF v_null_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All products have tenant_id set';
  ELSE
    RAISE WARNING 'FAILURE: % products still have NULL tenant_id', v_null_count;
  END IF;

  -- Show distribution by tenant
  RAISE NOTICE '';
  RAISE NOTICE 'Products by tenant:';
  FOR v_by_tenant IN
    SELECT tenant_id, COUNT(*) as cnt
    FROM public.products
    GROUP BY tenant_id
    ORDER BY cnt DESC
  LOOP
    RAISE NOTICE '  Tenant %: % products', v_by_tenant.tenant_id, v_by_tenant.cnt;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback (not recommended - will break RLS):

-- This migration doesn't delete data, it only sets tenant_id
-- To see what was changed, query:
SELECT id, name, org_id, tenant_id, created_by, created_at
FROM products
ORDER BY created_at DESC;

-- If needed to reset (will break product visibility):
-- UPDATE public.products SET tenant_id = NULL WHERE ...;
*/
