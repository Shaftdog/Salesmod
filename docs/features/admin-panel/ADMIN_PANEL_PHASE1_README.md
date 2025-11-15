# Admin Panel - Phase 1 Implementation

**Status:** ✅ Complete
**Date:** 2025-10-25
**Branch:** `claude/create-admin-panel-011CUT7Xyw84p5DrvXo37yb3`

---

## Overview

Phase 1 implements the **Role-Based Access Control (RBAC) foundation** for the admin panel, including:

- ✅ Database schema for roles, permissions, and audit logs
- ✅ Backend authorization utilities
- ✅ API middleware for protecting routes
- ✅ Frontend hooks and components for role/permission checks
- ✅ Route protection middleware
- ✅ Comprehensive audit logging system

---

## What Was Implemented

### 1. Database Migrations

All migrations are located in `/supabase/migrations/`:

| File | Description |
|------|-------------|
| `20251025000000_create_rbac_tables.sql` | Creates roles, permissions, and role_permissions tables |
| `20251025000001_add_role_to_profiles.sql` | Adds role column to profiles table and helper functions |
| `20251025000002_create_audit_logs.sql` | Creates audit_logs table with triggers for automatic logging |
| `20251025000003_seed_default_roles_permissions.sql` | Seeds default roles (admin, manager, user) and permissions |

**Default Roles:**
- `admin` - Full system access (15+ permissions)
- `manager` - Business operations management (9+ permissions)
- `user` - Standard user access (5+ permissions)

**Default Permissions:**
- User management: `manage_users`, `view_users`, `assign_roles`, `impersonate_users`
- Order management: `manage_orders`, `create_orders`, `edit_orders`, `delete_orders`, `view_orders`, `assign_orders`
- Property management: `manage_properties`, `create_properties`, `edit_properties`, `delete_properties`, `view_properties`
- Client management: `manage_clients`, `create_clients`, `edit_clients`, `delete_clients`, `view_clients`
- Analytics: `view_analytics`, `export_data`, `view_reports`
- Audit logs: `view_audit_logs`, `export_audit_logs`
- Settings: `manage_settings`, `view_settings`, `manage_integrations`
- Agents: `manage_agents`, `view_agents`

### 2. Backend Utilities

**Location:** `/src/lib/admin/`

#### Permission Functions (`permissions.ts`)
```typescript
import {
  requireAdmin,
  requirePermission,
  hasPermission,
  PERMISSIONS
} from '@/lib/admin/permissions'

// Check if user is admin
const isAdmin = await currentUserIsAdmin(supabase)

// Require admin role (throws if not admin)
const userId = await requireAdmin(supabase)

// Check specific permission
const canManageUsers = await hasPermission(userId, PERMISSIONS.MANAGE_USERS)

// Require specific permission (throws if doesn't have it)
await requirePermission(PERMISSIONS.MANAGE_USERS, supabase)
```

#### Audit Logging (`audit.ts`)
```typescript
import { logSuccess, logFailure, AUDIT_ACTIONS } from '@/lib/admin/audit'

// Log successful action
await logSuccess(
  AUDIT_ACTIONS.USER_UPDATE,
  'user',
  userId,
  { name: { old: 'John', new: 'Jane' } }
)

// Log failed action
await logFailure(
  AUDIT_ACTIONS.USER_DELETE,
  'User not found',
  'user',
  userId
)
```

#### API Middleware (`api-middleware.ts`)
```typescript
import { withAdminAuth, withPermission } from '@/lib/admin/api-middleware'

// Protect entire route - admin only
export const GET = withAdminAuth(async (request, { userId, supabase }) => {
  // userId is guaranteed to be an admin
  return NextResponse.json({ data: 'admin data' })
})

// Protect with specific permission
export const POST = withPermission('manage_users', async (request, { userId }) => {
  // userId is guaranteed to have manage_users permission
  return NextResponse.json({ success: true })
})
```

### 3. Route Protection Middleware

**Location:** `/src/lib/supabase/middleware.ts`

- All `/admin/*` routes now require admin role
- Unauthorized users are redirected to `/dashboard?error=unauthorized`
- Works automatically via Next.js middleware

### 4. Frontend Hooks

**Location:** `/src/hooks/`

#### useAdmin Hook
```typescript
import { useAdmin } from '@/hooks/use-admin'

function MyComponent() {
  const { isAdmin, role, isLoading } = useAdmin()

  if (isLoading) return <Spinner />
  if (!isAdmin) return <Unauthorized />

  return <AdminPanel />
}
```

#### usePermission Hook
```typescript
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/lib/admin/permissions'

function MyComponent() {
  const { hasPermission } = usePermission(PERMISSIONS.MANAGE_USERS)

  return (
    <div>
      {hasPermission && <UserManagementButton />}
    </div>
  )
}
```

### 5. Frontend Components

**Location:** `/src/components/admin/`

#### ProtectedRoute Component
```typescript
import { ProtectedRoute, AdminOnly } from '@/components/admin'

// Protect entire page
function AdminPage() {
  return (
    <AdminOnly>
      <AdminDashboard />
    </AdminOnly>
  )
}

// Or with custom role
<ProtectedRoute requiredRole="manager">
  <ManagerDashboard />
</ProtectedRoute>
```

#### RequirePermission Component
```typescript
import { RequirePermission } from '@/components/admin'
import { PERMISSIONS } from '@/lib/admin/permissions'

function MyComponent() {
  return (
    <div>
      <RequirePermission permission={PERMISSIONS.MANAGE_USERS}>
        <UserManagementPanel />
      </RequirePermission>

      {/* Hide button if no permission */}
      <RequirePermission
        permission={PERMISSIONS.DELETE_ORDERS}
        hideIfNoPermission
      >
        <DeleteButton />
      </RequirePermission>
    </div>
  )
}
```

---

## How to Deploy Phase 1

### Step 1: Run Database Migrations

**Option A: Via Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `20251025000000_create_rbac_tables.sql`
   - `20251025000001_add_role_to_profiles.sql`
   - `20251025000002_create_audit_logs.sql`
   - `20251025000003_seed_default_roles_permissions.sql`

**Option B: Via Supabase CLI** (if installed)

```bash
supabase db push
```

### Step 2: Create Your First Admin User

After running the migrations, update your user to be an admin:

```sql
-- Run this in Supabase SQL Editor
-- Replace 'your-email@example.com' with your actual email

UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Step 3: Verify Setup

Run this query to verify everything is set up correctly:

```sql
SELECT * FROM public.verify_rbac_setup();
```

You should see output like:
```
component           | count | status
--------------------|-------|--------
Roles               |     3 | OK
Permissions         |    26 | OK
Admin Permissions   |    15 | OK
Manager Permissions |     9 | OK
User Permissions    |     5 | OK
```

### Step 4: Test Authorization

Create a test page to verify the system works:

```typescript
// app/admin/test/page.tsx
'use client'

import { useAdmin } from '@/hooks/use-admin'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/lib/admin/permissions'

export default function AdminTestPage() {
  const { isAdmin, role, userId } = useAdmin()
  const { hasPermission } = usePermission(PERMISSIONS.MANAGE_USERS)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel Test</h1>
      <div className="space-y-2">
        <p>User ID: {userId}</p>
        <p>Role: {role}</p>
        <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
        <p>Can Manage Users: {hasPermission ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
```

Visit `/admin/test` and verify:
- You can access the page (middleware allows it)
- Your role shows as "admin"
- "Is Admin" shows "Yes"
- "Can Manage Users" shows "Yes"

---

## Database Schema Reference

### Roles Table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,  -- 'users', 'orders', etc.
  action VARCHAR(50) NOT NULL,    -- 'create', 'read', etc.
  created_at TIMESTAMPTZ
);
```

### Role Permissions (Junction Table)
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  created_at TIMESTAMPTZ,
  PRIMARY KEY (role_id, permission_id)
);
```

### Profiles Table (Updated)
```sql
ALTER TABLE profiles
ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- Constraint ensures only valid roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'user'));
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,              -- Before/after values
  metadata JSONB,             -- Additional context
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20),         -- 'success', 'failure', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ
);
```

---

## Database Helper Functions

These functions are automatically created by the migrations:

### Permission Checking
```sql
-- Get all permissions for a role
SELECT * FROM get_role_permissions('admin');

-- Check if role has a permission
SELECT role_has_permission('manager', 'manage_orders');

-- Get user's role
SELECT get_user_role('user-uuid-here');

-- Check if user has a role
SELECT user_has_role('user-uuid-here', 'admin');

-- Check if user has a permission
SELECT user_has_permission('user-uuid-here', 'manage_users');

-- Check if current user has a role (uses auth.uid())
SELECT current_user_has_role('admin');

-- Check if current user has a permission
SELECT current_user_has_permission('manage_users');
```

### Audit Logging
```sql
-- Create audit log entry
SELECT create_audit_log(
  'user-uuid',
  'user.update',
  'user',
  'target-user-uuid',
  '{"name": {"old": "John", "new": "Jane"}}'::jsonb
);

-- Get audit trail for a resource
SELECT * FROM get_resource_audit_trail('user', 'user-uuid', 50);

-- Get user activity log
SELECT * FROM get_user_activity('user-uuid', 50);

-- Cleanup old logs (maintenance)
SELECT cleanup_old_audit_logs(365); -- Keep last 365 days
```

---

## Security Features

### Row-Level Security (RLS)

All tables have RLS enabled with appropriate policies:

**Roles & Permissions:**
- All authenticated users can read
- Only admins can create/update/delete

**Profiles:**
- Users can read their own profile
- Admins can read all profiles
- Users can update their own profile (but not their role)
- Admins can update any profile

**Audit Logs:**
- Only admins can read
- Inserts only via SECURITY DEFINER functions
- No updates or deletes (immutable audit trail)

### Automatic Audit Logging

The system automatically logs:
- Profile changes (create, update, delete)
- Failed admin access attempts
- Failed API authorization attempts

You can manually log additional actions using the audit utilities.

---

## Common Use Cases

### Example 1: Protect an API Route (Admin Only)

```typescript
// app/api/admin/users/route.ts
import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextResponse } from 'next/server'

export const GET = withAdminAuth(async (request, { userId, supabase }) => {
  // Fetch all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')

  return NextResponse.json({ users })
})
```

### Example 2: Protect an API Route (Permission-Based)

```typescript
// app/api/admin/users/[id]/route.ts
import { withPermission } from '@/lib/admin/api-middleware'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { NextResponse } from 'next/server'

export const DELETE = withPermission(
  PERMISSIONS.MANAGE_USERS,
  async (request, { params, supabase }) => {
    const { id } = params

    // Delete user
    await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    return NextResponse.json({ success: true })
  }
)
```

### Example 3: Log Admin Actions

```typescript
import { logSuccess, AUDIT_ACTIONS } from '@/lib/admin/audit'

// After updating a user
await logSuccess(
  AUDIT_ACTIONS.USER_UPDATE,
  'user',
  targetUserId,
  {
    name: { old: oldName, new: newName },
    role: { old: oldRole, new: newRole }
  }
)
```

### Example 4: Conditional UI Rendering

```typescript
import { RequirePermission } from '@/components/admin'
import { PERMISSIONS } from '@/lib/admin/permissions'

function UserRow({ user }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        {/* Only show delete button to users with permission */}
        <RequirePermission
          permission={PERMISSIONS.MANAGE_USERS}
          hideIfNoPermission
        >
          <DeleteButton userId={user.id} />
        </RequirePermission>
      </td>
    </tr>
  )
}
```

---

## Troubleshooting

### Issue: "Unauthorized: Not authenticated"
**Solution:** User is not logged in. Ensure Supabase auth is working correctly.

### Issue: "Unauthorized: Admin access required"
**Solution:** User is logged in but not an admin. Run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: Middleware redirecting to login even when logged in
**Solution:** Clear cookies and log in again. The session might be expired.

### Issue: Permission checks always return false
**Solution:** Verify migrations ran successfully:
```sql
SELECT * FROM public.verify_rbac_setup();
```

### Issue: Can't find user's role
**Solution:** Ensure the user has a profile:
```sql
SELECT * FROM profiles WHERE id = 'user-uuid';
```

If missing, create it:
```sql
INSERT INTO profiles (id, name, email, role)
VALUES ('user-uuid', 'Name', 'email@example.com', 'user');
```

---

## Next Steps (Phase 2)

Now that RBAC is in place, Phase 2 will build:

1. **Admin Dashboard** (`/app/admin/page.tsx`)
   - Key metrics cards
   - Recent activity feed
   - System health status

2. **User Management** (`/app/admin/users/`)
   - User list with search/filter
   - User details and editing
   - Role assignment UI

3. **Admin Layout** (`/app/admin/layout.tsx`)
   - Sidebar navigation
   - Admin header
   - Breadcrumbs

4. **API Endpoints** (`/app/api/admin/`)
   - User CRUD operations
   - Audit log queries
   - Analytics data

See `ADMIN_PANEL_PLAN.md` for the complete roadmap.

---

## Files Created in Phase 1

### Database Migrations
- `/supabase/migrations/20251025000000_create_rbac_tables.sql`
- `/supabase/migrations/20251025000001_add_role_to_profiles.sql`
- `/supabase/migrations/20251025000002_create_audit_logs.sql`
- `/supabase/migrations/20251025000003_seed_default_roles_permissions.sql`

### Backend Utilities
- `/src/lib/admin/permissions.ts` - Permission checking functions
- `/src/lib/admin/audit.ts` - Audit logging utilities
- `/src/lib/admin/api-middleware.ts` - API route protection
- `/src/lib/admin/index.ts` - Main export

### Middleware
- `/src/lib/supabase/middleware.ts` - Updated with admin route protection

### Frontend Hooks
- `/src/hooks/use-admin.ts` - Admin status and role checking
- `/src/hooks/use-permission.ts` - Permission checking

### Frontend Components
- `/src/components/admin/protected-route.tsx` - Route protection components
- `/src/components/admin/index.ts` - Component exports

### Documentation
- `/ADMIN_PANEL_PLAN.md` - Complete implementation plan
- `/ADMIN_PANEL_PHASE1_README.md` - This file

---

## Questions or Issues?

If you encounter any issues or have questions about Phase 1:

1. Check the troubleshooting section above
2. Verify all migrations ran successfully
3. Review the database helper functions
4. Check the example use cases

For Phase 2 and beyond, refer to `ADMIN_PANEL_PLAN.md`.

---

**Phase 1 Status:** ✅ **Complete and Ready for Testing**
