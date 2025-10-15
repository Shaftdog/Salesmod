-- ===========================================================
-- COMPLETE AGENT SETUP SCRIPT
-- Run this entire script in your Supabase SQL Editor
-- ===========================================================

-- Step 1: Apply the agent migration (create all tables)
\i supabase/migrations/20251015000000_account_manager_agent.sql

-- Step 2: Get your user ID (run this query first to see your ID)
SELECT id, email FROM auth.users LIMIT 5;

-- Step 3: Initialize agent settings for your user
-- REPLACE 'YOUR-USER-UUID-HERE' with your actual user ID from above

INSERT INTO agent_settings (
  org_id,
  mode,
  quiet_hours_start,
  quiet_hours_end,
  timezone,
  daily_send_limit,
  cooldown_days,
  escalation_threshold,
  enabled
)
VALUES (
  'YOUR-USER-UUID-HERE',  -- CHANGE THIS!
  'review',
  '22:00:00',
  '08:00:00',
  'America/New_York',
  50,
  5,
  0.75,
  true
)
ON CONFLICT (org_id) DO UPDATE SET
  enabled = true,
  updated_at = NOW();

-- Step 4: Verify settings were created
SELECT * FROM agent_settings WHERE org_id = 'YOUR-USER-UUID-HERE';  -- CHANGE THIS!

-- Step 5: Create a test goal (optional but recommended)
INSERT INTO goals (
  metric_type,
  target_value,
  period_type,
  period_start,
  period_end,
  is_active,
  created_by,
  description
)
VALUES (
  'revenue',
  100000,
  'monthly',
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
  true,
  'YOUR-USER-UUID-HERE',  -- CHANGE THIS!
  'Monthly revenue target for agent testing'
)
ON CONFLICT DO NOTHING;

-- Step 6: Verify everything is ready
SELECT 
  'agent_runs' as table_name, 
  COUNT(*) as count 
FROM agent_runs
UNION ALL
SELECT 'kanban_cards', COUNT(*) FROM kanban_cards
UNION ALL
SELECT 'agent_settings', COUNT(*) FROM agent_settings
UNION ALL
SELECT 'goals', COUNT(*) FROM goals WHERE is_active = true;

-- Done! You're ready to test the agent.

