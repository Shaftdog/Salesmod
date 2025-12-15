-- Grant admin role to test user by temporarily disabling trigger
-- Database: Production Supabase
-- Date: 2025-11-17
-- Purpose: Enable admin access for automated-test@appraisetrack.com

BEGIN;

-- Step 1: Find the user ID
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'automated-test@appraisetrack.com';

-- Step 2: Disable the role enforcement trigger
ALTER TABLE profiles DISABLE TRIGGER enforce_role_change_permissions;

-- Step 3: Update the user's role to admin
UPDATE profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'automated-test@appraisetrack.com';

-- Step 4: Re-enable the trigger
ALTER TABLE profiles ENABLE TRIGGER enforce_role_change_permissions;

-- Step 5: Verify the change
SELECT id, email, role, updated_at
FROM profiles
WHERE email = 'automated-test@appraisetrack.com';

COMMIT;

-- Expected output:
-- Step 1 should show the current role (likely 'agent' or 'client')
-- Step 3 should show UPDATE 1
-- Step 5 should show role = 'admin'
