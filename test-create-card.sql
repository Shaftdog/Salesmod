-- Quick test: Create a card and check if it appears
-- Run this in Supabase SQL Editor

-- 1. Check what cards currently exist
SELECT 
  id,
  title,
  type,
  state,
  priority,
  client_id,
  created_at
FROM kanban_cards
WHERE org_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 2. If you want to create a test card manually:
-- (Uncomment the lines below)

/*
INSERT INTO kanban_cards (
  org_id,
  type,
  title,
  rationale,
  priority,
  state,
  action_payload,
  created_by
)
VALUES (
  auth.uid(),
  'send_email',
  'TEST: Email to iFund Cities',
  'Testing card creation from SQL',
  'high',
  'suggested',
  '{}'::jsonb,
  auth.uid()
)
RETURNING id, title, state;
*/

-- 3. Check if any cards exist at all (might be RLS issue)
SELECT COUNT(*) as total_cards
FROM kanban_cards
WHERE org_id = auth.uid();




