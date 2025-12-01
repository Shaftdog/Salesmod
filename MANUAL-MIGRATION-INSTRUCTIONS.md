# Manual Migration Instructions: Fix Role Change Functionality

## Issue
The Admin Panel role change feature is not working due to:
1. **Missing RLS Policy**: No policy allows admins to UPDATE other users' profiles
2. **Buggy Trigger**: The `prevent_role_change` trigger checks the TARGET user's role instead of the REQUESTING user's role

## Migration Status
**Migration File Created**: `supabase/migrations/20251127000001_fix_role_change_trigger.sql`

**Automatic Execution Failed**: Network connectivity to Supabase database is blocked from this machine.

## Manual Execution Steps

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm
   - Navigate to: **SQL Editor** (left sidebar)

2. **Create New Query**:
   - Click **"New Query"** button
   - Copy the entire SQL from the file below

3. **Execute the Migration**:
   - Paste the SQL into the editor
   - Click **"Run"** (or press Ctrl+Enter)
   - Verify you see: `"Migration complete - role changes now work for admins!"`

4. **Verify Success**:
   - Check that no errors appear
   - The query should complete successfully

### Option 2: Using psql (If you have it installed)

```bash
# From project root
psql "postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres" -f supabase/migrations/20251127000001_fix_role_change_trigger.sql
```

### Option 3: Copy & Paste SQL Below

If the file path is not accessible, here's the complete SQL to run:

```sql
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
SELECT 'Migration complete - role changes now work for admins!' AS status;
```

## What This Migration Does

### Part 1: RLS Policy Fix
- **Drops**: Old policy that only allowed users to update their own profile
- **Creates**: New policy that allows:
  - Users to update their own profile (unchanged)
  - Admins and Super Admins to update ANY user's profile (NEW!)

### Part 2: Trigger Fix
- **Before**: Trigger checked if the TARGET user (being edited) had admin role
- **After**: Trigger now checks if the REQUESTING user (making the change) has admin/super_admin role
- **Result**: Only admins can change roles, but they can change anyone's role

## Testing After Migration

1. **Log in as Admin/Super Admin** to the Admin Panel
2. **Navigate to** Settings > Admin Panel > Users tab
3. **Select a user** and try to change their role
4. **Expected Result**: Role change should succeed
5. **Try as Regular User**: Role changes should be prevented (for security)

## Troubleshooting

### If Migration Fails
- Check for syntax errors in the SQL
- Verify you're connected to the correct database
- Ensure you have sufficient permissions (should work with project owner account)

### If Role Changes Still Don't Work
1. Verify the migration ran successfully (no errors in SQL Editor)
2. Check browser console for errors
3. Verify the user making the change has `role = 'admin'` or `role = 'super_admin'` in the `profiles` table
4. Try refreshing the page and logging out/in

## Network Issue Details

**Problem**: Direct database connections are being blocked from this machine.
- Supabase pooler: `aws-1-us-east-1.pooler.supabase.com` - Connection timeout
- Likely cause: Corporate firewall, VPN, or network restrictions

**Solution**: Use Supabase Dashboard SQL Editor (web-based, no local connectivity required)

## After Running Migration

Once you've successfully run the migration through the Supabase Dashboard:

1. The migration file will remain in `supabase/migrations/` for version control
2. You can manually log it in the migration history if desired:

```sql
INSERT INTO migration_history (migration_name)
VALUES ('20251127000001_fix_role_change_trigger.sql')
ON CONFLICT (migration_name) DO NOTHING;
```

## Files Created

- Migration SQL: `C:\Users\shaug\source\repos\Shaftdog\Salesmod\supabase\migrations\20251127000001_fix_role_change_trigger.sql`
- This guide: `C:\Users\shaug\source\repos\Shaftdog\Salesmod\MANUAL-MIGRATION-INSTRUCTIONS.md`
- Helper scripts (for future use when network is available):
  - `scripts/apply-role-fix.js`
  - `scripts/apply-role-fix-pooler.js`

---

**Status**: Ready to run manually via Supabase Dashboard
**Priority**: High (fixes critical Admin Panel functionality)
**Estimated Time**: 2 minutes
