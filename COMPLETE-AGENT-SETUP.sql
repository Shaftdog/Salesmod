-- ================================================================
-- COMPLETE AGENT SETUP - ALL-IN-ONE SCRIPT
-- Copy this entire file and run in Supabase SQL Editor
-- ================================================================

-- STEP 1: Create all agent tables (the migration)
\ir supabase/migrations/20251015000000_account_manager_agent.sql

-- STEP 2: Get your user ID (this will display your user ID)
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'YOUR USER ID: %', v_user_id;
  RAISE NOTICE 'YOUR EMAIL: %', v_user_email;
  RAISE NOTICE '=================================================';
  
  -- STEP 3: Initialize agent settings for this user
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
    
  RAISE NOTICE 'Agent settings initialized ✓';
  
  -- STEP 4: Create a test goal
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
    v_user_id,
    'Monthly revenue target for agent testing'
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Test goal created ✓';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Setup complete! Go to http://localhost:9002/agent';
  RAISE NOTICE 'Click "Start Agent Cycle" to test!';
  RAISE NOTICE '=================================================';
END $$;

-- STEP 5: Verify everything is set up correctly
SELECT 
  'SETUP VERIFICATION' as check_type,
  '' as table_name,
  0 as count,
  'Results below' as status
UNION ALL
SELECT 
  '',
  'agent_settings' as table_name, 
  COUNT(*)::INTEGER as count,
  CASE WHEN COUNT(*) >= 1 THEN '✓ Ready' ELSE '✗ Missing' END as status
FROM agent_settings
UNION ALL
SELECT 
  '',
  'agent_runs',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) = 0 THEN '✓ Ready (empty)' ELSE 'Has data' END
FROM agent_runs
UNION ALL
SELECT 
  '',
  'kanban_cards',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) = 0 THEN '✓ Ready (empty)' ELSE 'Has data' END
FROM kanban_cards
UNION ALL
SELECT 
  '',
  'goals (active)',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) >= 1 THEN '✓ Ready' ELSE '⚠ No goals' END
FROM goals WHERE is_active = true
UNION ALL
SELECT 
  '',
  'clients',
  COUNT(*)::INTEGER,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✓ Has clients'
    ELSE '⚠ No clients (agent will still work but may not create many actions)'
  END
FROM clients WHERE is_active = true;

