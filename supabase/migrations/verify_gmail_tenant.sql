-- Verification query for Gmail tenant_id migration
-- This will show the structure and data status

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Gmail Tenant Migration Verification';
  RAISE NOTICE '=================================================================';
END $$;

-- Check gmail_sync_state columns
DO $$
DECLARE
  has_tenant_id BOOLEAN;
  has_org_id BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmail_sync_state' AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmail_sync_state' AND column_name = 'org_id'
  ) INTO has_org_id;

  RAISE NOTICE '';
  RAISE NOTICE 'gmail_sync_state table:';
  RAISE NOTICE '  tenant_id column: %', CASE WHEN has_tenant_id THEN 'EXISTS ✓' ELSE 'MISSING ✗' END;
  RAISE NOTICE '  org_id column: %', CASE WHEN has_org_id THEN 'EXISTS ✓' ELSE 'MISSING ✗' END;
END $$;

-- Check gmail_messages columns
DO $$
DECLARE
  has_tenant_id BOOLEAN;
  has_org_id BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmail_messages' AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmail_messages' AND column_name = 'org_id'
  ) INTO has_org_id;

  RAISE NOTICE '';
  RAISE NOTICE 'gmail_messages table:';
  RAISE NOTICE '  tenant_id column: %', CASE WHEN has_tenant_id THEN 'EXISTS ✓' ELSE 'MISSING ✗' END;
  RAISE NOTICE '  org_id column: %', CASE WHEN has_org_id THEN 'EXISTS ✓' ELSE 'MISSING ✗' END;
END $$;

-- Check indexes
DO $$
DECLARE
  sync_state_idx_count INT;
  messages_idx_count INT;
BEGIN
  SELECT COUNT(*) INTO sync_state_idx_count
  FROM pg_indexes
  WHERE tablename = 'gmail_sync_state' AND indexname LIKE '%tenant%';

  SELECT COUNT(*) INTO messages_idx_count
  FROM pg_indexes
  WHERE tablename = 'gmail_messages' AND indexname LIKE '%tenant%';

  RAISE NOTICE '';
  RAISE NOTICE 'Indexes:';
  RAISE NOTICE '  gmail_sync_state tenant indexes: %', sync_state_idx_count;
  RAISE NOTICE '  gmail_messages tenant indexes: %', messages_idx_count;
END $$;

-- Check RLS policies
DO $$
DECLARE
  sync_state_policy_count INT;
  messages_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO sync_state_policy_count
  FROM pg_policies
  WHERE tablename = 'gmail_sync_state';

  SELECT COUNT(*) INTO messages_policy_count
  FROM pg_policies
  WHERE tablename = 'gmail_messages';

  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies:';
  RAISE NOTICE '  gmail_sync_state policies: %', sync_state_policy_count;
  RAISE NOTICE '  gmail_messages policies: %', messages_policy_count;
END $$;

-- Check data backfill status
DO $$
DECLARE
  sync_total INT;
  sync_with_tenant INT;
  msg_total INT;
  msg_with_tenant INT;
BEGIN
  SELECT COUNT(*), COUNT(tenant_id) INTO sync_total, sync_with_tenant
  FROM gmail_sync_state;

  SELECT COUNT(*), COUNT(tenant_id) INTO msg_total, msg_with_tenant
  FROM gmail_messages;

  RAISE NOTICE '';
  RAISE NOTICE 'Data Status:';
  RAISE NOTICE '  gmail_sync_state: % total, % with tenant_id', sync_total, sync_with_tenant;
  RAISE NOTICE '  gmail_messages: % total, % with tenant_id', msg_total, msg_with_tenant;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Verification Complete';
  RAISE NOTICE '=================================================================';
END $$;
