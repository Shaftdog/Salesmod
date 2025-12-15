-- =============================================
-- Tenant Bootstrapping Migration
-- Creates tenant records and assigns users to tenants
--
-- Strategy: Hybrid Model
-- - Internal users (@myroihome.com) → Main "ROI Appraisal Group" tenant
-- - External users (other domains) → Individual tenants (one per user for now)
-- =============================================

-- =============================================
-- 1. Create Main Internal Tenant
-- =============================================

DO $$
DECLARE
  v_main_tenant_id UUID;
  v_rod_user_id UUID;
BEGIN
  -- Find the internal admin user dynamically by email
  SELECT id INTO v_rod_user_id
  FROM public.profiles
  WHERE email = 'rod@myroihome.com'
  LIMIT 1;

  -- If admin user not found, try to find any @myroihome.com user as fallback
  IF v_rod_user_id IS NULL THEN
    SELECT id INTO v_rod_user_id
    FROM public.profiles
    WHERE email LIKE '%@myroihome.com'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- If still not found, this is a critical error
  IF v_rod_user_id IS NULL THEN
    RAISE EXCEPTION 'No internal users found (@myroihome.com). Cannot create tenant without an owner.';
  END IF;

  RAISE NOTICE 'Using user % as tenant owner', v_rod_user_id;

  -- Create main ROI Appraisal Group tenant
  INSERT INTO public.tenants (
    id,
    name,
    type,
    owner_id,
    theme_settings,
    sla_settings,
    settings,
    is_active
  ) VALUES (
    gen_random_uuid(),
    'ROI Appraisal Group',
    'internal',
    v_rod_user_id,
    '{
      "primaryColor": "#3b82f6",
      "logo": null,
      "companyName": "ROI Appraisal Group"
    }'::jsonb,
    '{
      "standard_turnaround_days": 7,
      "rush_turnaround_days": 3,
      "notification_before_due_hours": 24
    }'::jsonb,
    '{
      "notifications": true,
      "allowBorrowerAccess": true
    }'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_main_tenant_id;

  -- Store tenant ID for next step
  IF v_main_tenant_id IS NULL THEN
    -- Tenant already exists, get its ID
    SELECT id INTO v_main_tenant_id
    FROM public.tenants
    WHERE name = 'ROI Appraisal Group' AND type = 'internal';
  END IF;

  -- Log tenant creation
  RAISE NOTICE 'Created main tenant: ROI Appraisal Group (ID: %)', v_main_tenant_id;

END $$;

-- =============================================
-- 2. Assign Internal Users to Main Tenant
-- =============================================

DO $$
DECLARE
  v_main_tenant_id UUID;
  v_user_count INTEGER;
BEGIN
  -- Get main tenant ID
  SELECT id INTO v_main_tenant_id
  FROM public.tenants
  WHERE name = 'ROI Appraisal Group' AND type = 'internal';

  IF v_main_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Main tenant not found. Something went wrong.';
  END IF;

  -- Assign all @myroihome.com users to main tenant
  UPDATE public.profiles
  SET
    tenant_id = v_main_tenant_id,
    tenant_type = 'internal',
    updated_at = NOW()
  WHERE email LIKE '%@myroihome.com'
    AND (tenant_id IS NULL OR tenant_id != v_main_tenant_id);

  GET DIAGNOSTICS v_user_count = ROW_COUNT;

  RAISE NOTICE 'Assigned % internal users to main tenant', v_user_count;

END $$;

-- =============================================
-- 3. Create Individual Tenants for External Users
-- =============================================

DO $$
DECLARE
  v_user RECORD;
  v_new_tenant_id UUID;
  v_tenant_count INTEGER := 0;
BEGIN
  -- For each external user (not @myroihome.com) without a tenant
  FOR v_user IN
    SELECT
      p.id as user_id,
      p.email,
      p.name,
      -- Extract company name from email domain
      CASE
        WHEN p.email LIKE '%@sourceam.com' THEN 'SourceAM'
        WHEN p.email LIKE '%@canopymortgage.com' THEN 'Canopy Mortgage'
        WHEN p.email LIKE '%@ascribeval.com' THEN 'Ascribe Valuations'
        WHEN p.email LIKE '%@kbhome.com' THEN 'KB Home'
        WHEN p.email LIKE '%@guardianassetmgt.com' THEN 'Guardian Asset Management'
        ELSE CONCAT(UPPER(SUBSTRING(p.name FROM 1 FOR 1)), LOWER(SUBSTRING(p.name FROM 2)), '''s Organization')
      END as tenant_name,
      -- Determine tenant type from email domain
      CASE
        WHEN p.email LIKE '%@sourceam.com' THEN 'amc'
        WHEN p.email LIKE '%@canopymortgage.com' THEN 'lender'
        WHEN p.email LIKE '%@ascribeval.com' THEN 'amc'
        WHEN p.email LIKE '%@kbhome.com' THEN 'lender'
        WHEN p.email LIKE '%@guardianassetmgt.com' THEN 'amc'
        ELSE 'lender' -- Default for unknown domains
      END as tenant_type
    FROM public.profiles p
    WHERE p.email NOT LIKE '%@myroihome.com'
      AND (p.tenant_id IS NULL OR p.tenant_type IS NULL)
  LOOP
    -- Create individual tenant for this external user
    INSERT INTO public.tenants (
      id,
      name,
      type,
      owner_id,
      theme_settings,
      sla_settings,
      settings,
      is_active
    ) VALUES (
      gen_random_uuid(),
      v_user.tenant_name,
      v_user.tenant_type,
      v_user.user_id,
      '{
        "primaryColor": "#3b82f6",
        "logo": null,
        "companyName": null
      }'::jsonb,
      '{
        "standard_turnaround_days": 7,
        "rush_turnaround_days": 3,
        "notification_before_due_hours": 24
      }'::jsonb,
      '{
        "notifications": true,
        "allowBorrowerAccess": false
      }'::jsonb,
      true
    )
    RETURNING id INTO v_new_tenant_id;

    -- Assign user to their new tenant
    UPDATE public.profiles
    SET
      tenant_id = v_new_tenant_id,
      tenant_type = v_user.tenant_type,
      updated_at = NOW()
    WHERE id = v_user.user_id;

    v_tenant_count := v_tenant_count + 1;

    RAISE NOTICE 'Created tenant "%" (%) for user %', v_user.tenant_name, v_user.tenant_type, v_user.email;

  END LOOP;

  RAISE NOTICE 'Created % external user tenants', v_tenant_count;

END $$;

-- =============================================
-- 4. Verify All Users Have Tenants
-- =============================================

DO $$
DECLARE
  v_orphan_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM public.profiles
  WHERE tenant_id IS NULL;

  IF v_orphan_count > 0 THEN
    RAISE WARNING '% users still have no tenant assigned!', v_orphan_count;

    -- Show orphaned users for debugging
    RAISE NOTICE 'Orphaned users:';
    FOR rec IN
      SELECT id, email, name FROM public.profiles WHERE tenant_id IS NULL
    LOOP
      RAISE NOTICE '  - % (%, %)', rec.email, rec.name, rec.id;
    END LOOP;
  ELSE
    RAISE NOTICE 'All users successfully assigned to tenants';
  END IF;

END $$;

-- =============================================
-- 5. Create Summary View
-- =============================================

-- Temporary view for verification (can be dropped after migration)
CREATE OR REPLACE VIEW tenant_bootstrap_summary AS
SELECT
  t.name as tenant_name,
  t.type as tenant_type,
  COUNT(p.id) as user_count,
  STRING_AGG(p.email, ', ' ORDER BY p.email) as users
FROM public.tenants t
LEFT JOIN public.profiles p ON p.tenant_id = t.id
GROUP BY t.id, t.name, t.type
ORDER BY user_count DESC, t.name;

-- =============================================
-- 6. Output Summary
-- =============================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TENANT BOOTSTRAP SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOR rec IN SELECT * FROM tenant_bootstrap_summary LOOP
    RAISE NOTICE 'Tenant: % (%)', rec.tenant_name, rec.tenant_type;
    RAISE NOTICE '  Users: %', rec.user_count;
    RAISE NOTICE '  Emails: %', rec.users;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON VIEW tenant_bootstrap_summary IS
  'Temporary verification view showing tenant assignment results. Can be dropped after migration verification.';

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration:

-- 1. Remove tenant assignments
UPDATE public.profiles SET tenant_id = NULL, tenant_type = NULL;

-- 2. Delete created tenants
DELETE FROM public.tenants WHERE name IN ('ROI Appraisal Group', 'SourceAM', 'Canopy Mortgage', 'Ascribe Valuations', 'KB Home', 'Guardian Asset Management');
-- Or delete all: DELETE FROM public.tenants;

-- 3. Drop summary view
DROP VIEW IF EXISTS tenant_bootstrap_summary;
*/
