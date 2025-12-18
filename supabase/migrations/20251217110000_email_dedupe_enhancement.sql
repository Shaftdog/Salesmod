-- Email Dedupe Enhancement
-- Adds stronger deduplication guarantees for Gmail message processing

-- ============================================================================
-- Unique Constraint on gmail_messages
-- ============================================================================

-- Add unique constraint on tenant_id + gmail_message_id to prevent race conditions
-- ON CONFLICT DO NOTHING pattern will safely handle concurrent inserts
ALTER TABLE gmail_messages
DROP CONSTRAINT IF EXISTS gmail_messages_tenant_message_unique;

ALTER TABLE gmail_messages
ADD CONSTRAINT gmail_messages_tenant_message_unique
UNIQUE (tenant_id, gmail_message_id);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gmail_messages_tenant_message
ON gmail_messages(tenant_id, gmail_message_id);

-- ============================================================================
-- Gmail Sync Checkpoints
-- ============================================================================

-- Add history_id column to gmail_sync_state for incremental sync
ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS history_id TEXT;

-- Add history_id checkpointing columns
ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS last_history_id TEXT;

ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS history_checkpoint_at TIMESTAMPTZ;

-- Add sync statistics
ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS duplicate_messages_skipped INTEGER DEFAULT 0;

ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS last_sync_duration_ms INTEGER;

ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS sync_error_count INTEGER DEFAULT 0;

ALTER TABLE gmail_sync_state
ADD COLUMN IF NOT EXISTS last_sync_error TEXT;

-- ============================================================================
-- Processed Message IDs Cache (for fast dedupe lookups)
-- ============================================================================

-- Table to cache recently processed message IDs
-- This provides faster dedupe checks than querying gmail_messages
CREATE TABLE IF NOT EXISTS gmail_message_ids_cache (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, gmail_message_id)
);

-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_gmail_message_ids_cache_cleanup
ON gmail_message_ids_cache(processed_at);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if message was already processed (fast path)
CREATE OR REPLACE FUNCTION is_gmail_message_processed(
  p_tenant_id UUID,
  p_gmail_message_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check the fast cache
  IF EXISTS (
    SELECT 1 FROM gmail_message_ids_cache
    WHERE tenant_id = p_tenant_id AND gmail_message_id = p_gmail_message_id
  ) THEN
    RETURN true;
  END IF;

  -- Fall back to checking the full messages table
  RETURN EXISTS (
    SELECT 1 FROM gmail_messages
    WHERE tenant_id = p_tenant_id AND gmail_message_id = p_gmail_message_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to mark message as processed (with race-safe upsert)
CREATE OR REPLACE FUNCTION mark_gmail_message_processed(
  p_tenant_id UUID,
  p_gmail_message_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_inserted BOOLEAN := false;
BEGIN
  -- Insert into cache (ignore conflicts)
  INSERT INTO gmail_message_ids_cache (tenant_id, gmail_message_id)
  VALUES (p_tenant_id, p_gmail_message_id)
  ON CONFLICT (tenant_id, gmail_message_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update history checkpoint
CREATE OR REPLACE FUNCTION update_gmail_history_checkpoint(
  p_tenant_id UUID,
  p_history_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE gmail_sync_state
  SET
    last_history_id = p_history_id,
    history_checkpoint_at = NOW(),
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old cache entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_gmail_message_ids_cache(
  p_older_than_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM gmail_message_ids_cache
  WHERE processed_at < NOW() - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE gmail_message_ids_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON gmail_message_ids_cache
FOR ALL USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE gmail_message_ids_cache IS 'Fast lookup cache for processed Gmail message IDs to prevent duplicate processing';
COMMENT ON COLUMN gmail_sync_state.last_history_id IS 'Gmail history ID checkpoint for incremental sync';
COMMENT ON COLUMN gmail_sync_state.duplicate_messages_skipped IS 'Count of duplicate messages skipped during sync';
COMMENT ON FUNCTION is_gmail_message_processed(UUID, TEXT) IS 'Check if a Gmail message was already processed (fast cache + fallback)';
COMMENT ON FUNCTION mark_gmail_message_processed(UUID, TEXT) IS 'Mark a Gmail message as processed in the cache (race-safe)';
