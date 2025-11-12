-- Fix agent_memories to support card feedback storage
-- Issue: scope constraint doesn't include 'card_feedback' and missing RLS policies

-- 1. Drop the existing scope constraint
ALTER TABLE agent_memories
  DROP CONSTRAINT IF EXISTS agent_memories_scope_check;

-- 2. Add new constraint that includes 'card_feedback'
ALTER TABLE agent_memories
  ADD CONSTRAINT agent_memories_scope_check
  CHECK (scope IN ('chat', 'email', 'session', 'client_context', 'card_feedback'));

-- 3. Add RLS policies for agent_memories (currently has RLS enabled but no policies)
CREATE POLICY "Users can view their own memories"
  ON agent_memories FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can insert their own memories"
  ON agent_memories FOR INSERT
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own memories"
  ON agent_memories FOR UPDATE
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can delete their own memories"
  ON agent_memories FOR DELETE
  USING (auth.uid() = org_id);

-- 4. Add index for card_feedback queries
CREATE INDEX IF NOT EXISTS idx_agent_memories_card_feedback
  ON agent_memories(org_id, scope)
  WHERE scope = 'card_feedback';

COMMENT ON TABLE agent_memories IS 'Stores agent learning including chat history, context, and card feedback rules';
COMMENT ON COLUMN agent_memories.scope IS 'Memory type: chat, email, session, client_context, or card_feedback';
