-- =====================================================
-- AGENT CHAT + RAG SYSTEM
-- Add pgvector embeddings and chat support
-- =====================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLE: embeddings_index
-- Vector embeddings for RAG (semantic search)
-- =====================================================
CREATE TABLE IF NOT EXISTS embeddings_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('email', 'note', 'client_data', 'activity', 'order', 'document')),
  source_id UUID, -- Reference to original record
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimensions
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_org ON embeddings_index(org_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings_index(source, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created ON embeddings_index(created_at DESC);

-- Vector similarity index (ivfflat for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings_index 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =====================================================
-- TABLE: chat_messages
-- Store chat conversation history
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB, -- Store tool invocations
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat messages
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
  CREATE POLICY "Users can manage their own embeddings" ON embeddings_index FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own messages" ON chat_messages FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function for vector similarity search
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

-- Function to auto-update updated_at timestamp
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
-- COMMENTS
-- =====================================================

COMMENT ON TABLE embeddings_index IS 'Vector embeddings for semantic search (RAG)';
COMMENT ON TABLE chat_messages IS 'Chat conversation history with the agent';
COMMENT ON COLUMN embeddings_index.embedding IS 'OpenAI ada-002 vector embedding (1536 dimensions)';
COMMENT ON FUNCTION search_embeddings IS 'Semantic search using cosine similarity';

-- =====================================================
-- SAMPLE QUERY (for testing after data is indexed)
-- =====================================================

-- Test semantic search (after you have embeddings):
-- SELECT * FROM search_embeddings(
--   (SELECT embedding FROM embeddings_index LIMIT 1), -- Use any embedding as test
--   0.7, -- similarity threshold
--   5,   -- max results
--   'your-user-id' -- filter by org
-- );

-- =====================================================
-- END OF MIGRATION
-- =====================================================

