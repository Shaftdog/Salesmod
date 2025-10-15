-- =====================================================
-- AGENT SETUP HELPER SCRIPT
-- Run this to initialize agent settings for a user
-- =====================================================

-- Replace 'USER_UUID_HERE' with your actual user UUID
-- You can get this from: SELECT id FROM profiles WHERE email = 'your-email@example.com';

DO $$
DECLARE
  v_user_id UUID := 'USER_UUID_HERE'; -- CHANGE THIS!
BEGIN
  -- Insert default agent settings if not exists
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
    v_user_id,
    'review', -- Start in review mode (safe)
    '22:00:00', -- 10 PM
    '08:00:00', -- 8 AM
    'America/New_York',
    50, -- Max 50 emails per day
    5, -- Wait 5 days between contacts
    0.75, -- Force review if risk > 75%
    true -- Agent enabled
  )
  ON CONFLICT (org_id) DO NOTHING;

  RAISE NOTICE 'Agent settings initialized for user %', v_user_id;
END $$;

-- Verify settings
SELECT 
  org_id,
  mode,
  enabled,
  daily_send_limit,
  cooldown_days,
  timezone
FROM agent_settings
WHERE org_id = 'USER_UUID_HERE'; -- CHANGE THIS!

-- Optional: Manually trigger first run
-- (Usually done via UI or cron, but you can test manually)
/*
INSERT INTO agent_runs (org_id, started_at, status, mode)
VALUES (
  'USER_UUID_HERE', -- CHANGE THIS!
  NOW(),
  'running',
  'review'
);
*/


