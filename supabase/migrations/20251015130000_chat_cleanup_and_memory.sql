-- =====================================================
-- CHAT CLEANUP & MEMORY PRESERVATION
-- Auto-delete old chat messages while preserving important context
-- =====================================================

-- Add expires_at column to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days';

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires 
ON chat_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Function to cleanup expired chat messages
CREATE OR REPLACE FUNCTION cleanup_expired_chats()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_messages
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired chat messages', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to summarize and preserve important chat context
CREATE OR REPLACE FUNCTION preserve_chat_context(
  p_org_id UUID,
  p_days_back INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_conversation TEXT;
  v_message_count INTEGER;
BEGIN
  -- Get recent messages
  SELECT 
    COUNT(*),
    STRING_AGG(
      CASE 
        WHEN role = 'user' THEN 'User: ' || content
        WHEN role = 'assistant' THEN 'Agent: ' || content
        ELSE content
      END,
      E'\n'
      ORDER BY created_at
    )
  INTO v_message_count, v_conversation
  FROM chat_messages
  WHERE org_id = p_org_id
    AND created_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND created_at < NOW() - INTERVAL '1 hour'; -- Only summarize completed conversations
  
  -- If there are messages to summarize, store as memory
  IF v_message_count > 0 THEN
    INSERT INTO agent_memories (
      org_id,
      scope,
      key,
      content,
      importance,
      expires_at,
      last_used_at
    )
    VALUES (
      p_org_id,
      'chat',
      'conversation_summary_' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
      jsonb_build_object(
        'message_count', v_message_count,
        'summary', LEFT(v_conversation, 2000), -- First 2000 chars
        'date', NOW(),
        'topics', ARRAY['chat_history']
      ),
      0.8, -- High importance
      NULL, -- Never expires
      NOW()
    )
    ON CONFLICT (org_id, scope, key) 
    DO UPDATE SET
      content = EXCLUDED.content,
      last_used_at = NOW();
      
    RAISE NOTICE 'Preserved % messages to memory', v_message_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expires_at on insert
CREATE OR REPLACE FUNCTION set_chat_message_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiry to 30 days from now if not set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_message_expiry ON chat_messages;
CREATE TRIGGER chat_message_expiry
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_chat_message_expiry();

-- Add chat_retention_days to agent_settings
ALTER TABLE agent_settings 
ADD COLUMN IF NOT EXISTS chat_retention_days INTEGER DEFAULT 30;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION cleanup_expired_chats IS 'Delete chat messages older than their expiry date';
COMMENT ON FUNCTION preserve_chat_context IS 'Summarize recent conversations into agent_memories before cleanup';
COMMENT ON COLUMN chat_messages.expires_at IS 'When this message will be auto-deleted (default 30 days)';
COMMENT ON COLUMN agent_settings.chat_retention_days IS 'How long to keep raw chat messages before cleanup';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '✓ CHAT CLEANUP & MEMORY PRESERVATION ENABLED';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Features Added:';
  RAISE NOTICE '   - Chat messages auto-expire after 30 days';
  RAISE NOTICE '   - cleanup_expired_chats() function available';
  RAISE NOTICE '   - preserve_chat_context() function available';
  RAISE NOTICE '   - Important conversations saved to agent_memories';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 How to Use:';
  RAISE NOTICE '   Manual cleanup: SELECT cleanup_expired_chats();';
  RAISE NOTICE '   Preserve context: SELECT preserve_chat_context(''user-id'');';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Set custom retention (in days):';
  RAISE NOTICE '   UPDATE agent_settings SET chat_retention_days = 60;';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
END $$;

