-- =============================================
-- Admin Panel: Add Role Column to Profiles
-- Phase 1: Extend Profiles with Role
-- =============================================

-- =============================================
-- 1. ADD ROLE COLUMN TO PROFILES
-- =============================================

-- Add role column (defaults to 'user')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- =============================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- =============================================

-- Note: We add this constraint AFTER seeding default roles in next migration
-- This is a soft reference for now (will be enforced after seed data exists)

-- =============================================
-- 3. ADD INDEX FOR PERFORMANCE
-- =============================================

-- Index for filtering/searching users by role
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

-- Composite index for common admin queries (role + created_at)
CREATE INDEX IF NOT EXISTS idx_profiles_role_created
  ON public.profiles(role, created_at DESC);

-- =============================================
-- 4. UPDATE RLS POLICIES
-- =============================================

-- Drop existing policies if they exist (to recreate with role awareness)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own profile (but not their role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Either role hasn't changed, or user is admin
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Admins can update any profile (including roles)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to get user's role by user ID
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = role_name
  ) INTO has_role;

  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_role(auth.uid(), role_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
  has_perm BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  -- Check if role has the permission
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Use the role_has_permission function
  RETURN public.role_has_permission(user_role, permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has a specific permission
CREATE OR REPLACE FUNCTION public.current_user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_permission(auth.uid(), permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN public.profiles.role IS 'User role for RBAC (admin, manager, user). Default: user';

COMMENT ON FUNCTION public.get_user_role IS 'Returns the role for a given user ID';
COMMENT ON FUNCTION public.user_has_role IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION public.current_user_has_role IS 'Checks if current authenticated user has a specific role';
COMMENT ON FUNCTION public.user_has_permission IS 'Checks if a user has a specific permission based on their role';
COMMENT ON FUNCTION public.current_user_has_permission IS 'Checks if current authenticated user has a specific permission';
