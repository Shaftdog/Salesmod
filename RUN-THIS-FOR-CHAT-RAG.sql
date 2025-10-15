-- ================================================================
-- 🤖 AGENT CHAT + RAG SETUP
-- Run this in Supabase SQL Editor to enable chat and knowledge base
-- ================================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLE: embeddings_index (Knowledge Base)
-- =====================================================
CREATE TABLE IF NOT EXISTS embeddings_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('email', 'note', 'client_data', 'activity', 'order', 'document')),
  source_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_org ON embeddings_index(org_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings_index(source, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created ON embeddings_index(created_at DESC);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings_index 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =====================================================
-- TABLE: chat_messages (Conversation History)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_org ON chat_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE embeddings_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own embeddings" ON embeddings_index FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage embeddings" ON embeddings_index FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage messages" ON chat_messages FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- FUNCTION: Vector Similarity Search
-- =====================================================

CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  source_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source,
    e.source_id,
    e.title,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings_index e
  WHERE (filter_org_id IS NULL OR e.org_id = filter_org_id)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS embeddings_updated_at ON embeddings_index;
CREATE TRIGGER embeddings_updated_at
  BEFORE UPDATE ON embeddings_index
  FOR EACH ROW
  EXECUTE FUNCTION update_embeddings_updated_at();

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '✓ CHAT + RAG TABLES CREATED';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next Steps:';
  RAISE NOTICE '   1. Index your data: POST /api/rag/index-all';
  RAISE NOTICE '   2. Go to http://localhost:9002/agent';
  RAISE NOTICE '   3. Click "Agent Control Panel"';
  RAISE NOTICE '   4. Click "Chat" tab';
  RAISE NOTICE '   5. Start chatting with your AI agent!';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Try asking:';
  RAISE NOTICE '   - "What are my goals?"';
  RAISE NOTICE '   - "Tell me about ifund Cities"';
  RAISE NOTICE '   - "Draft an email to Acme"';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
END $$;

-- Check what was created
SELECT 
  '=== SETUP VERIFICATION ===' as status,
  '' as table_name,
  0 as count
UNION ALL
SELECT 
  '',
  'embeddings_index',
  COUNT(*)::INT
FROM embeddings_index
UNION ALL
SELECT 
  '',
  'chat_messages',
  COUNT(*)::INT
FROM chat_messages
UNION ALL
SELECT
  '',
  'pgvector extension',
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN 1 ELSE 0 END;

