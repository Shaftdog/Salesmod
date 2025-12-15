-- =============================================
-- FIX: Role Change Trigger + Admin Update RLS Policy
-- =============================================
-- Problem 1: The trigger checks if the TARGET user's old role is 'admin'
-- instead of checking if the REQUESTING user (auth.uid()) is an admin/super_admin.
--
-- Problem 2: There's no RLS policy allowing admins to UPDATE other users' profiles.
-- The only UPDATE policy is "Users can update own profile" which uses id = auth.uid().
--
-- Run this in the Supabase SQL Editor.
-- =============================================

-- =============================================
-- PART 1: Fix RLS Policy for Admin Updates
-- =============================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policy that allows:
-- 1. Users to update their own profile
-- 2. Admins/Super Admins to update any profile
CREATE POLICY "Users and admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    -- Allow users to update their own profile
    id = auth.uid()
    OR
    -- Allow admins and super_admins to update any profile
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- Allow users to update their own profile
    id = auth.uid()
    OR
    -- Allow admins and super_admins to update any profile
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- PART 2: Fix the Role Change Trigger
-- =============================================

-- Drop the existing buggy function and trigger
DROP TRIGGER IF EXISTS enforce_role_change_permissions ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_change();

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
DECLARE
  requesting_user_role VARCHAR(50);
  is_admin BOOLEAN DEFAULT FALSE;
BEGIN
  -- Only check if role is being changed
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    -- Get the role of the REQUESTING user (the one making this change)
    SELECT role INTO requesting_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Check if requesting user is admin or super_admin
    is_admin := requesting_user_role IN ('admin', 'super_admin');

    -- If requesting user is not admin/super_admin, prevent role change
    IF NOT is_admin THEN
      -- Revert the role to the old value
      NEW.role := OLD.role;

      -- Log the prevention
      RAISE NOTICE 'Role change prevented: user % with role % cannot change roles', auth.uid(), requesting_user_role;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER enforce_role_change_permissions
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Verify the fix
SELECT 'Role change trigger fixed! Admins and Super Admins can now change user roles.' AS status;
