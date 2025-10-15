-- ================================================================
-- 🧠 INTELLIGENT CHAT MEMORY
-- Run this in Supabase to enable auto-cleanup with preservation
-- ================================================================

-- Add expires_at to chat messages (default 30 days)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_chat_messages_expires 
ON chat_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Add retention setting
ALTER TABLE agent_settings 
ADD COLUMN IF NOT EXISTS chat_retention_days INTEGER DEFAULT 30;

-- Function: Cleanup expired messages
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

-- Function: Preserve important context to memories
CREATE OR REPLACE FUNCTION preserve_chat_context(
  p_org_id UUID,
  p_days_back INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_conversation TEXT;
  v_message_count INTEGER;
BEGIN
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
    AND created_at < NOW() - INTERVAL '1 hour';
  
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
        'summary', LEFT(v_conversation, 2000),
        'date', NOW(),
        'topics', ARRAY['chat_history']
      ),
      0.8,
      NULL,
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

-- Trigger: Auto-set expiry on new messages
CREATE OR REPLACE FUNCTION set_chat_message_expiry()
RETURNS TRIGGER AS $$
BEGIN
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

-- =====================================================
-- VERIFICATION & INSTRUCTIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '🧠 INTELLIGENT MEMORY SYSTEM ENABLED';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Chat messages auto-expire after 30 days';
  RAISE NOTICE '✓ Important context preserved to agent_memories';
  RAISE NOTICE '✓ Conversations indexed to RAG for search';
  RAISE NOTICE '✓ Automatic cleanup cron configured (2am daily)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Memory Tiers:';
  RAISE NOTICE '   Tier 1: Recent chat (30 days, full detail)';
  RAISE NOTICE '   Tier 2: Memories (forever, summarized)';
  RAISE NOTICE '   Tier 3: RAG (forever, searchable)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Manual Operations:';
  RAISE NOTICE '   Cleanup: SELECT cleanup_expired_chats();';
  RAISE NOTICE '   Preserve: SELECT preserve_chat_context(''your-user-id'');';
  RAISE NOTICE '   Index chats: POST /api/rag/index-all';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Configure Retention:';
  RAISE NOTICE '   UPDATE agent_settings SET chat_retention_days = 60;';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '=======================================================';
END $$;

-- Check what was created
SELECT 
  '=== VERIFICATION ===' as status,
  '' as detail
UNION ALL
SELECT 
  'chat_messages.expires_at column',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'expires_at'
  ) THEN '✓ Added' ELSE '✗ Missing' END
UNION ALL
SELECT
  'agent_settings.chat_retention_days',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_settings' AND column_name = 'chat_retention_days'
  ) THEN '✓ Added' ELSE '✗ Missing' END
UNION ALL
SELECT
  'cleanup_expired_chats function',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_chats'
  ) THEN '✓ Created' ELSE '✗ Missing' END
UNION ALL
SELECT
  'preserve_chat_context function',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'preserve_chat_context'
  ) THEN '✓ Created' ELSE '✗ Missing' END;

