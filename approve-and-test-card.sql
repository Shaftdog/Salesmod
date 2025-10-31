-- Get one of the blocked email cards
SELECT id, title, state, action_payload->>'to' as to_field, rationale, description
FROM kanban_cards
WHERE state = 'blocked' 
  AND type = 'send_email'
  AND (rationale LIKE '%rod@myroihome.com%' OR description LIKE '%rod@myroihome.com%')
LIMIT 1;

-- This will return the card ID. Use it in the next query:
-- UPDATE kanban_cards SET state = 'approved', description = rationale WHERE id = '<ID_FROM_ABOVE>';
