-- Add email_classification scope to agent_memories
-- This allows storing user-defined rules for email classification learning

-- Drop existing constraint
ALTER TABLE agent_memories
  DROP CONSTRAINT IF EXISTS agent_memories_scope_check;

-- Add new constraint with email_classification scope
ALTER TABLE agent_memories
  ADD CONSTRAINT agent_memories_scope_check
  CHECK (scope IN ('chat', 'email', 'session', 'client_context', 'card_feedback', 'email_classification'));

-- Create index for fast lookup of classification rules
CREATE INDEX IF NOT EXISTS idx_agent_memories_classification
  ON agent_memories(org_id, scope, importance DESC)
  WHERE scope = 'email_classification';

-- Add comment explaining the new scope
COMMENT ON CONSTRAINT agent_memories_scope_check ON agent_memories IS
  'Valid scopes: chat (conversation history), email (email context), session (temporary),
   client_context (client relationships), card_feedback (card rejection patterns),
   email_classification (user-defined email classification rules)';

-- Example classification rule structure (for documentation):
/*
INSERT INTO agent_memories (org_id, scope, key, content, importance) VALUES (
  'user-uuid',
  'email_classification',
  'rule_hubspot_notifications',
  '{
    "type": "classification_rule",
    "pattern_type": "sender_domain",
    "pattern_value": "hubspot.com",
    "correct_category": "NOTIFICATIONS",
    "wrong_category": "OPPORTUNITY",
    "reason": "HubSpot emails are marketing notifications, not sales opportunities",
    "confidence_override": 0.99,
    "created_from_card_id": "card-uuid",
    "created_at": "2025-11-16T..."
  }'::jsonb,
  0.95
);
*/
