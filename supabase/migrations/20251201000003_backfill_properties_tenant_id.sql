-- =============================================
-- Backfill tenant_id for properties table
-- Properties have org_id (user id) but need tenant_id for multi-tenant isolation
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Backfill properties tenant_id from org_id -> profiles.tenant_id
  UPDATE public.properties prop
  SET tenant_id = p.tenant_id
  FROM public.profiles p
  WHERE prop.org_id = p.id
    AND prop.tenant_id IS NULL
    AND p.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % properties from org_id → user tenant', v_updated_count;
END $$;

-- Backfill property_units tenant_id from parent property
DO $$
DECLARE
  v_updated_count INTEGER := 0;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if property_units table has tenant_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'property_units'
      AND column_name = 'tenant_id'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    UPDATE public.property_units pu
    SET tenant_id = prop.tenant_id
    FROM public.properties prop
    WHERE pu.property_id = prop.id
      AND pu.tenant_id IS NULL
      AND prop.tenant_id IS NOT NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % property_units from parent property', v_updated_count;
  ELSE
    RAISE NOTICE 'property_units table does not have tenant_id column - skipping';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROPERTIES TENANT_ID BACKFILL VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_null_count
  FROM public.properties
  WHERE tenant_id IS NULL;

  IF v_null_count > 0 THEN
    RAISE WARNING 'Table properties has % records with NULL tenant_id', v_null_count;
  ELSE
    RAISE NOTICE 'Table properties: All records have tenant_id';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
