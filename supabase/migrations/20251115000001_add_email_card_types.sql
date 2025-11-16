-- Add new card types for Gmail email processing
-- Adds: reply_to_email, needs_human_response

-- Drop the old constraint
ALTER TABLE kanban_cards
  DROP CONSTRAINT IF EXISTS kanban_cards_type_check;

-- Add new constraint with email card types
ALTER TABLE kanban_cards
  ADD CONSTRAINT kanban_cards_type_check
  CHECK (type IN (
    'send_email',
    'schedule_call',
    'research',
    'create_task',
    'follow_up',
    'create_deal',
    'reply_to_email',        -- Reply to incoming Gmail message
    'needs_human_response'   -- Gmail message needs human attention
  ));

-- Comments
COMMENT ON COLUMN kanban_cards.type IS 'Card action type. Email types: reply_to_email (agent responds), needs_human_response (escalated to human)';
