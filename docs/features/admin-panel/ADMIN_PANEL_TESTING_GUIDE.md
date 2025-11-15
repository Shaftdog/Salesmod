# Admin Panel Phase 1 - Testing Guide

## Prerequisites
- ✅ Supabase project access
- ✅ Admin access to your Supabase dashboard
- ✅ Your email address for creating the first admin user

---

## Step 1: Run Database Migrations ⚙️

### Go to Supabase SQL Editor

1. Open https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Run Migrations in Order

Copy and paste each migration file into the SQL Editor and click **Run**:

#### 1️⃣ Create RBAC Tables
- File: `supabase/migrations/20251025000000_create_rbac_tables.sql`
- Creates: roles, permissions, role_permissions tables
- Expected: "Success. No rows returned"

#### 2️⃣ Add Role to Profiles
- File: `supabase/migrations/20251025000001_add_role_to_profiles.sql`
- Adds: role column to profiles table
- Expected: "Success. No rows returned"

#### 3️⃣ Create Audit Logs
- File: `supabase/migrations/20251025000002_create_audit_logs.sql`
- Creates: audit_logs table
- Expected: "Success. No rows returned"

#### 4️⃣ Seed Default Data
- File: `supabase/migrations/20251025000003_seed_default_roles_permissions.sql`
- Seeds: 3 roles and 26 permissions
- Expected: "Success. No rows returned" (it runs multiple INSERT statements)

---

## Step 2: Verify Setup ✅

Run this query in SQL Editor:

```sql
SELECT * FROM public.verify_rbac_setup();
```

**Expected Output:**
```
component           | count | status
--------------------|-------|--------
Roles               |     3 | OK
Permissions         |    26 | OK
Admin Permissions   |    15 | OK
Manager Permissions |     9 | OK
User Permissions    |     5 | OK
```

If you see "OK" for all components, the migrations worked! ✅

---

## Step 3: Create Your First Admin User 👤

Replace `your-email@example.com` with your actual email:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Verify it worked:**

```sql
SELECT id, name, email, role
FROM profiles
WHERE role = 'admin';
```

You should see your user with role = 'admin'.

---

## Step 4: Create a Test Page 📄

Create a new file to test the admin panel:

**File:** `src/app/admin-test/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/use-admin'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/lib/admin/permissions'

export default function AdminTestPage() {
  const { isAdmin, role, userId, isLoading, error } = useAdmin()
  const { hasPermission: canManageUsers } = usePermission(PERMISSIONS.MANAGE_USERS)
  const { hasPermission: canViewAnalytics } = usePermission(PERMISSIONS.VIEW_ANALYTICS)
  const [permissions, setPermissions] = useState<any[]>([])

  useEffect(() => {
    async function loadPermissions() {
      if (!role) return

      const supabase = createClient()
      const { data } = await supabase.rpc('get_role_permissions', { role_name: role })
      setPermissions(data || [])
    }

    loadPermissions()
  }, [role])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Panel Test Page</h1>

      {/* User Info */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Your Account</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {userId || 'Not found'}</p>
          <p><strong>Role:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{role || 'user'}</span></p>
          <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      {/* Permission Checks */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Permission Tests</h2>
        <div className="space-y-2">
          <p>
            <strong>Can Manage Users:</strong> {canManageUsers ? '✅ Yes' : '❌ No'}
          </p>
          <p>
            <strong>Can View Analytics:</strong> {canViewAnalytics ? '✅ Yes' : '❌ No'}
          </p>
        </div>
      </div>

      {/* All Permissions */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Your Permissions ({permissions.length})
        </h2>
        {permissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {permissions.map((perm, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span className="font-mono">{perm.permission_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No permissions loaded</p>
        )}
      </div>

      {/* Test Results */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <ul className="space-y-1 text-sm">
          <li>{userId ? '✅' : '❌'} User authentication</li>
          <li>{role ? '✅' : '❌'} Role detection</li>
          <li>{isAdmin ? '✅' : '❌'} Admin status</li>
          <li>{permissions.length > 0 ? '✅' : '❌'} Permission loading</li>
          <li>{canManageUsers || canViewAnalytics ? '✅' : '❌'} Permission checks</li>
        </ul>
      </div>
    </div>
  )
}
```

---

## Step 5: Test the Page 🧪

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the test page:**
   ```
   http://localhost:3000/admin-test
   ```

3. **What you should see:**
   - ✅ Your user ID
   - ✅ Role: "admin"
   - ✅ Is Admin: "✅ Yes"
   - ✅ Can Manage Users: "✅ Yes"
   - ✅ Can View Analytics: "✅ Yes"
   - ✅ List of 15+ permissions

---

## Step 6: Test Route Protection 🔒

### Test 1: Admin Middleware

**Important:** The middleware protection is currently in our branch but was removed in main branch. To test it, ensure you're on the admin panel branch.

1. Try to visit: `http://localhost:3000/admin`
2. **Expected:** If not admin, redirected to `/dashboard?error=unauthorized`
3. **Expected:** If admin, page loads (or 404 if page doesn't exist yet - that's ok!)

### Test 2: Non-Admin User

Create a test user without admin role:

```sql
-- First, find a non-admin user or create one
SELECT id, email, role FROM profiles WHERE role != 'admin' LIMIT 1;

-- If none exist, update one temporarily for testing
UPDATE profiles
SET role = 'user'
WHERE email = 'test-user@example.com';
```

Log in as this user and try to:
1. Visit `/admin-test` - Should see "Is Admin: ❌ No"
2. Try to visit `/admin` - Should be redirected to dashboard

---

## Step 7: Test Backend Functions 🔧

Run these in Supabase SQL Editor:

### Test 1: Get Role Permissions
```sql
SELECT * FROM get_role_permissions('admin');
```
**Expected:** List of 15+ permissions

### Test 2: Check Permission
```sql
SELECT role_has_permission('admin', 'manage_users');
```
**Expected:** `true`

```sql
SELECT role_has_permission('user', 'manage_users');
```
**Expected:** `false`

### Test 3: Get User Role
```sql
-- Replace with your user ID
SELECT get_user_role('your-user-id-here');
```
**Expected:** `admin`

---

## Step 8: Test API Protection 🛡️

Create a test API route:

**File:** `src/app/api/admin-test/route.ts`

```typescript
import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextResponse } from 'next/server'

export const GET = withAdminAuth(async (request, { userId, supabase }) => {
  // This will only execute if user is admin
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .limit(5)

  return NextResponse.json({
    message: 'You are an admin!',
    yourUserId: userId,
    users
  })
})
```

### Test in Browser

1. **As admin:** Visit `http://localhost:3000/api/admin-test`
   - **Expected:** JSON with users list

2. **As non-admin:** Log out, log in as regular user, visit same URL
   - **Expected:** `{"error": "Unauthorized: Admin access required"}` with 403 status

---

## Troubleshooting 🔍

### Problem: "Unauthorized: Not authenticated"
**Solution:** You're not logged in. Log in to your app first.

### Problem: "Unauthorized: Admin access required"
**Solution:** Run this SQL to make yourself admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Problem: Permissions showing 0
**Solution:** Check that seed migration ran:
```sql
SELECT COUNT(*) FROM permissions;
-- Should return 26
```

### Problem: Function doesn't exist
**Solution:** Re-run the migration files in order.

### Problem: Middleware not working
**Solution:** Make sure you're on the `claude/create-admin-panel-011CUT7Xyw84p5DrvXo37yb3` branch.

---

## Success Checklist ✅

Phase 1 is working correctly if:

- ✅ All 4 migrations ran successfully
- ✅ `verify_rbac_setup()` shows all "OK"
- ✅ You have an admin user
- ✅ Test page shows your role and permissions
- ✅ Permission checks work (canManageUsers = true)
- ✅ Admin API route returns data (not unauthorized)
- ✅ Non-admin users get "unauthorized" errors

---

## What's Next? 🚀

Once Phase 1 tests pass, you're ready for:

**Phase 2:** Build the admin UI
- Admin dashboard page
- User management interface
- Admin navigation layout

See `ADMIN_PANEL_PLAN.md` for the full roadmap!

---

## Need Help?

If something isn't working:
1. Check the troubleshooting section above
2. Verify you're on the correct git branch
3. Check browser console for errors
4. Check Supabase logs for database errors

All working? Congratulations! 🎉 Phase 1 is complete!
