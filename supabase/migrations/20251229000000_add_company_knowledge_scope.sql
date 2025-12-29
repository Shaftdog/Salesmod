-- Add company_knowledge scope to agent_memories for tenant company information
-- This allows the AI agent to know about the specific business it's serving

-- 1. Drop the existing scope constraint
ALTER TABLE agent_memories
  DROP CONSTRAINT IF EXISTS agent_memories_scope_check;

-- 2. Add new constraint that includes 'company_knowledge'
ALTER TABLE agent_memories
  ADD CONSTRAINT agent_memories_scope_check
  CHECK (scope IN ('chat', 'email', 'session', 'client_context', 'card_feedback', 'email_classification', 'company_knowledge'));

-- 3. Create index for fast lookup of company knowledge
CREATE INDEX IF NOT EXISTS idx_agent_memories_company_knowledge
  ON agent_memories(tenant_id, scope)
  WHERE scope = 'company_knowledge';

-- 4. Update comment explaining the new scope
COMMENT ON CONSTRAINT agent_memories_scope_check ON agent_memories IS
  'Valid scopes: chat (conversation history), email (email context), session (temporary),
   client_context (client relationships), card_feedback (card rejection patterns),
   email_classification (user-defined email classification rules),
   company_knowledge (tenant company information like name, services, contact details)';
