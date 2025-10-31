-- E2E Email Test: Create, Approve, and Verify
-- Run this in Supabase SQL Editor

-- 1. Create a test email card with TO field
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
  'bde00714-427d-4024-9fbd-6f895824f733', -- Your org_id
  'send_email',
  'E2E Test Email - Direct SQL',
  'End-to-end test to verify email execution with TO field',
  'medium',
  'approved', -- Create as approved so we can execute immediately
  '{"to": "rod@myroihome.com", "subject": "E2E Test - SQL Creation", "body": "<p>This email was created via SQL and executed to test the complete flow.</p><p>If you see this, the fallback and execution logic is working.</p>", "replyTo": "test@example.com"}'::jsonb,
  'bde00714-427d-4024-9fbd-6f895824f733'
)
RETURNING id, title, state, action_payload->>'to' as to_address;

-- 2. View the created card
SELECT 
  id,
  title,
  state,
  action_payload->>'to' as to_address,
  action_payload->>'subject' as subject
FROM kanban_cards
WHERE title = 'E2E Test Email - Direct SQL'
ORDER BY created_at DESC
LIMIT 1;

