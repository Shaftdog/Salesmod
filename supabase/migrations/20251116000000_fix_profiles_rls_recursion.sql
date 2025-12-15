-- =============================================
-- FIX: Infinite Recursion in Profiles RLS Policy
-- =============================================
-- Issue: The profiles RLS policy queries profiles table,
-- causing infinite recursion.
--
-- Solution: Create a SECURITY DEFINER function to bypass RLS
-- when getting the current user's tenant_id.
-- =============================================

-- Create a function to get current user's tenant_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN v_tenant_id;
END;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() -- Own profile
    OR
    tenant_id = public.get_current_user_tenant_id() -- Team members (no recursion)
  );

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO authenticated;
