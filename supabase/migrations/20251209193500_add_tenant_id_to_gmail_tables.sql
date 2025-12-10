-- Add tenant_id to Gmail integration tables for multi-tenant isolation
-- This aligns with the tenant_id migration pattern used across the application

-- ============================================================================
-- 1. Add tenant_id column to gmail_sync_state
-- ============================================================================
ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Backfill tenant_id from profiles table using org_id
UPDATE gmail_sync_state gss
SET tenant_id = p.tenant_id
FROM profiles p
WHERE gss.org_id = p.id
  AND gss.tenant_id IS NULL;

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_gmail_sync_state_tenant_id
ON gmail_sync_state(tenant_id);

-- Add unique constraint on tenant_id (one sync state per tenant)
-- First drop the old org_id unique constraint if it exists
ALTER TABLE gmail_sync_state DROP CONSTRAINT IF EXISTS gmail_sync_state_org_id_key;

-- Add new unique constraint on tenant_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gmail_sync_state_tenant_id_key'
  ) THEN
    ALTER TABLE gmail_sync_state ADD CONSTRAINT gmail_sync_state_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

-- ============================================================================
-- 2. Add tenant_id column to gmail_messages
-- ============================================================================
ALTER TABLE gmail_messages
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Backfill tenant_id from profiles table using org_id
UPDATE gmail_messages gm
SET tenant_id = p.tenant_id
FROM profiles p
WHERE gm.org_id = p.id
  AND gm.tenant_id IS NULL;

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_gmail_messages_tenant_id
ON gmail_messages(tenant_id);

-- Update unique constraint to use tenant_id
ALTER TABLE gmail_messages DROP CONSTRAINT IF EXISTS gmail_messages_org_id_gmail_message_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gmail_messages_tenant_gmail_message_id_key'
  ) THEN
    ALTER TABLE gmail_messages ADD CONSTRAINT gmail_messages_tenant_gmail_message_id_key
    UNIQUE (tenant_id, gmail_message_id);
  END IF;
END $$;

-- ============================================================================
-- 3. Update RLS policies to use tenant_id
-- ============================================================================

-- Drop old policies for gmail_sync_state
DROP POLICY IF EXISTS "Users can view their own sync state" ON gmail_sync_state;
DROP POLICY IF EXISTS "Users can insert their own sync state" ON gmail_sync_state;
DROP POLICY IF EXISTS "Users can update their own sync state" ON gmail_sync_state;
DROP POLICY IF EXISTS "Users can delete their own sync state" ON gmail_sync_state;

-- Create new tenant-based policies for gmail_sync_state
CREATE POLICY "tenant_gmail_sync_state_select" ON gmail_sync_state
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_sync_state_insert" ON gmail_sync_state
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_sync_state_update" ON gmail_sync_state
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_sync_state_delete" ON gmail_sync_state
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Drop old policies for gmail_messages
DROP POLICY IF EXISTS "Users can view their own Gmail messages" ON gmail_messages;
DROP POLICY IF EXISTS "Users can insert their own Gmail messages" ON gmail_messages;
DROP POLICY IF EXISTS "Users can update their own Gmail messages" ON gmail_messages;
DROP POLICY IF EXISTS "Users can delete their own Gmail messages" ON gmail_messages;

-- Create new tenant-based policies for gmail_messages
CREATE POLICY "tenant_gmail_messages_select" ON gmail_messages
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_messages_insert" ON gmail_messages
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_messages_update" ON gmail_messages
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tenant_gmail_messages_delete" ON gmail_messages
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- 4. Comments for documentation
-- ============================================================================
COMMENT ON COLUMN gmail_sync_state.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN gmail_messages.tenant_id IS 'Tenant ID for multi-tenant isolation';
