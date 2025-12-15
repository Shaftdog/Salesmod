-- =============================================================
-- Script to set a user as super_admin
-- =============================================================
--
-- HOW TO RUN THIS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor (left sidebar)
-- 4. Create a new query
-- 5. Copy and paste the SQL below
-- 6. Click "Run" to execute
--
-- NOTE: You must run this in the Supabase SQL Editor because
-- regular users cannot modify their own role due to RLS policies.
-- =============================================================

-- Step 1: Find the user by email to verify they exist
SELECT id, email, name, role
FROM public.profiles
WHERE email = 'rod@myroihome.com';

-- Step 2: Update the user's role to super_admin
UPDATE public.profiles
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = 'rod@myroihome.com';

-- Step 3: Verify the update was successful
SELECT id, email, name, role
FROM public.profiles
WHERE email = 'rod@myroihome.com';
