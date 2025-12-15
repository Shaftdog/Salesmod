-- Backfill tenant_id for properties from org_id -> profiles.tenant_id
-- Migration: 20251201000001_backfill_properties_tenant_id

BEGIN;

-- Step 1: Backfill tenant_id for properties
UPDATE public.properties prop
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE prop.org_id = p.id
  AND prop.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- Step 2: Get counts for reporting
DO $$
DECLARE
  total_count INTEGER;
  with_tenant_count INTEGER;
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.properties;
  SELECT COUNT(tenant_id) INTO with_tenant_count FROM public.properties;

  RAISE NOTICE 'Backfill Complete:';
  RAISE NOTICE '  Total properties: %', total_count;
  RAISE NOTICE '  With tenant_id: %', with_tenant_count;
  RAISE NOTICE '  Missing tenant_id: %', (total_count - with_tenant_count);
END $$;

COMMIT;
