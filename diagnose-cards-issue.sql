-- ============================================
-- DIAGNOSE: Why Kanban Cards Aren't Showing
-- ============================================
-- Run this in Supabase SQL Editor while logged in

-- 1. Check your current user ID
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. Check if any cards exist in the database
SELECT COUNT(*) as total_cards_in_db
FROM kanban_cards;

-- 3. Check cards that match your user ID
SELECT COUNT(*) as cards_for_current_user
FROM kanban_cards
WHERE org_id = auth.uid();

-- 4. Check what org_ids exist in kanban_cards (to see mismatches)
SELECT DISTINCT org_id, COUNT(*) as card_count
FROM kanban_cards
GROUP BY org_id;

-- 5. List all cards with details
SELECT 
  id,
  org_id,
  type,
  title,
  state,
  priority,
  created_at,
  CASE 
    WHEN org_id = auth.uid() THEN 'YOURS'
    ELSE 'NOT YOURS'
  END as ownership
FROM kanban_cards
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'kanban_cards';

-- ============================================
-- POTENTIAL FIXES
-- ============================================

-- FIX 1: If cards exist but have wrong org_id, update them:
-- (UNCOMMENT to run - BE CAREFUL!)
/*
UPDATE kanban_cards
SET org_id = auth.uid()
WHERE org_id != auth.uid();
*/

-- FIX 2: Delete test cards and start fresh:
-- (UNCOMMENT to run)
/*
DELETE FROM kanban_cards
WHERE org_id = auth.uid();
*/

-- FIX 3: Check if the Supabase client is using the right user
-- (Check the browser's Application -> Cookies -> supabase-auth-token)


