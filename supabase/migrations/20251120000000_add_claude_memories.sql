-- Migration: Add Claude Code Long-Term Memory System
-- This table stores vector embeddings of memories for semantic search
-- Designed for use across multiple projects via MCP server

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create claude_memories table for long-term memory storage
CREATE TABLE IF NOT EXISTS claude_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project context
  project_name TEXT NOT NULL DEFAULT 'global',  -- e.g., "Salesmod", "global"
  project_path TEXT,                             -- Full path for disambiguation

  -- Memory content
  category TEXT NOT NULL DEFAULT 'general',      -- decision, pattern, preference, lesson, context
  title TEXT NOT NULL,                           -- Short summary for display
  content TEXT NOT NULL,                         -- Full memory content

  -- Vector embedding for semantic search
  embedding VECTOR(1536),                        -- OpenAI ada-002 dimensions

  -- Metadata and scoring
  metadata JSONB DEFAULT '{}',                   -- Flexible additional data
  importance DECIMAL(3,2) DEFAULT 0.5,           -- 0-1 importance score
  access_count INTEGER DEFAULT 0,                -- Track usage frequency

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                         -- Optional TTL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_claude_memories_project
  ON claude_memories(project_name);

CREATE INDEX IF NOT EXISTS idx_claude_memories_category
  ON claude_memories(category);

CREATE INDEX IF NOT EXISTS idx_claude_memories_importance
  ON claude_memories(importance DESC);

CREATE INDEX IF NOT EXISTS idx_claude_memories_created
  ON claude_memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claude_memories_expires
  ON claude_memories(expires_at)
  WHERE expires_at IS NOT NULL;

-- IVFFLAT index for vector similarity search
-- Using 100 lists for good balance of speed and accuracy
CREATE INDEX IF NOT EXISTS idx_claude_memories_vector
  ON claude_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function to search memories by semantic similarity
CREATE OR REPLACE FUNCTION search_claude_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_project TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  include_global BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  project_name TEXT,
  category TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  importance DECIMAL,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.project_name,
    cm.category,
    cm.title,
    cm.content,
    cm.metadata,
    cm.importance,
    1 - (cm.embedding <=> query_embedding) AS similarity,
    cm.created_at
  FROM claude_memories cm
  WHERE
    -- Filter by similarity threshold
    1 - (cm.embedding <=> query_embedding) > match_threshold
    -- Filter by project (include global if requested)
    AND (
      filter_project IS NULL
      OR cm.project_name = filter_project
      OR (include_global AND cm.project_name = 'global')
    )
    -- Filter by category
    AND (filter_category IS NULL OR cm.category = filter_category)
    -- Exclude expired memories
    AND (cm.expires_at IS NULL OR cm.expires_at > NOW())
  ORDER BY
    -- Boost by importance, then sort by similarity
    (1 - (cm.embedding <=> query_embedding)) * (0.7 + 0.3 * cm.importance) DESC
  LIMIT match_count;
END;
$$;

-- Function to update access tracking
CREATE OR REPLACE FUNCTION update_memory_access(memory_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE claude_memories
  SET
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = memory_id;
END;
$$;

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM claude_memories
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_claude_memories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER claude_memories_updated_at
  BEFORE UPDATE ON claude_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_claude_memories_updated_at();

-- Row Level Security (RLS)
ALTER TABLE claude_memories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated service role
-- Since this is used by MCP server with service role key, allow full access
CREATE POLICY "Service role full access" ON claude_memories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE claude_memories IS 'Long-term memory storage for Claude Code with vector embeddings for semantic search';
COMMENT ON COLUMN claude_memories.project_name IS 'Project identifier (e.g., "Salesmod") or "global" for cross-project memories';
COMMENT ON COLUMN claude_memories.category IS 'Memory type: decision, pattern, preference, lesson, context, general';
COMMENT ON COLUMN claude_memories.embedding IS 'OpenAI ada-002 embedding (1536 dimensions) for semantic search';
COMMENT ON COLUMN claude_memories.importance IS 'Priority score 0-1, used to boost search results';
COMMENT ON FUNCTION search_claude_memories IS 'Semantic search with project filtering and importance boosting';
