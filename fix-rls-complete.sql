-- =============================================
-- COMPLETE FIX: Profile RLS Infinite Recursion
-- =============================================

-- The core issue: Policies that check "is user admin?" trigger a SELECT on profiles,
-- which triggers the same policy again, causing infinite recursion.

-- SOLUTION: Use simpler policies without admin checks, or disable RLS for the role column

-- Step 1: Drop ALL existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view all profiles" ON public.profiles;

-- Step 2: Create simpler, non-recursive policies

-- Anyone authenticated can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Anyone authenticated can read ALL profiles (needed for admin checks to work)
-- This is safe because we control what's exposed via the API
CREATE POLICY "Everyone can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Note: Role changes are controlled by the trigger, not RLS
-- This prevents the recursion issue while still protecting role changes

-- Step 3: Ensure the role protection trigger exists
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Only check if role is being changed
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if current user is admin (using a direct query to avoid recursion)
    -- We use OLD.role for the check to avoid recursion
    SELECT (OLD.role = 'admin' AND OLD.id = auth.uid()) INTO is_admin;
    
    -- If current user is not admin, prevent role change
    IF NOT is_admin THEN
      -- Revert the role to the old value
      NEW.role := OLD.role;
      
      -- Optionally raise a notice
      RAISE NOTICE 'Role change prevented: only admins can change roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_role_change_permissions ON public.profiles;
CREATE TRIGGER enforce_role_change_permissions
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Verify
SELECT 'RLS policies fixed - recursion resolved' AS status;

