-- ================================================================
-- CHECK CHAT MESSAGE PERSISTENCE
-- Run these queries in Supabase SQL Editor to diagnose the issue
-- ================================================================

-- 1. Check if any messages exist
SELECT COUNT(*) as total_messages 
FROM chat_messages;

-- 2. Check YOUR messages (replace with your actual org_id)
SELECT 
  id,
  role,
  LEFT(content, 100) as content_preview,
  created_at
FROM chat_messages 
WHERE org_id = 'bde00714-427d-4024-9fbd-6f895824f733'
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Check recent messages (last hour)
SELECT 
  org_id,
  role,
  LEFT(content, 80) as content_preview,
  created_at
FROM chat_messages 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'chat_messages';

-- 6. Test manual insert (to verify permissions work)
INSERT INTO chat_messages (
  org_id, 
  role, 
  content, 
  metadata
) VALUES (
  'bde00714-427d-4024-9fbd-6f895824f733',
  'user',
  'Manual test insert - ' || NOW()::TEXT,
  '{"test": true}'::JSONB
) RETURNING *;

-- ================================================================
-- INTERPRETATION OF RESULTS
-- ================================================================

-- If Query 1 returns 0:
--   → Table exists but is empty
--   → Messages are NOT being saved

-- If Query 2 returns results:
--   → Messages ARE being saved to database
--   → Problem is UI not refreshing

-- If Query 2 returns 0 but Query 1 has results:
--   → Wrong org_id (check auth user ID)

-- If Query 6 fails:
--   → RLS policies are blocking inserts
--   → Need to fix policies

-- ================================================================

