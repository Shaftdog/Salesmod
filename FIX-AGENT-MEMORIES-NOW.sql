-- ============================================
-- FIX AGENT MEMORIES FOR CARD FEEDBACK
-- Run this in Supabase SQL Editor
-- ============================================

-- Issue 1: scope constraint doesn't include 'card_feedback'
-- Issue 2: RLS enabled but no policies (all operations blocked)

BEGIN;

-- 1. Drop the existing scope constraint
ALTER TABLE agent_memories
  DROP CONSTRAINT IF EXISTS agent_memories_scope_check;

-- 2. Add new constraint that includes 'card_feedback'
ALTER TABLE agent_memories
  ADD CONSTRAINT agent_memories_scope_check
  CHECK (scope IN ('chat', 'email', 'session', 'client_context', 'card_feedback'));

-- 3. Add RLS policies (currently has NONE, so all operations are blocked)
DROP POLICY IF EXISTS "Users can view their own memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON agent_memories;

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

COMMIT;

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'agent_memories table now supports card_feedback scope';
  RAISE NOTICE 'RLS policies added for all operations';
END $$;

-- Show current state
SELECT
  'Scope constraint updated' as status,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'agent_memories_scope_check';

SELECT
  'RLS policies created' as status,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'agent_memories'
ORDER BY cmd;
