---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Admin Panel - Quick Start Guide

🎉 **Phase 1 RBAC is complete and working!**

This guide will help you quickly test and use the admin panel features.

---

## 🚀 Quick Start (5 minutes)

### 1. Your Admin User is Ready

Your user has been set to admin role:
- **Email:** testuser123@gmail.com
- **Role:** admin
- **Permissions:** All 15 admin permissions

### 2. Start the Dev Server

```bash
npm run dev
```

The app runs on: http://localhost:9002

### 3. Test the Admin Panel

Visit these URLs (make sure you're logged in):

#### Admin Test Page
```
http://localhost:9002/admin-test
```

**What you'll see:**
- ✅ Your user ID
- ✅ Your role (admin)
- ✅ Admin status: Yes
- ✅ Permission checks working
- ✅ List of all 15 admin permissions

**Expected result:** All tests should pass! 🎉

#### Admin API Test
```
http://localhost:9002/api/admin-test
```

**What you'll see:**
```json
{
  "success": true,
  "message": "Admin authentication successful!",
  "yourUserId": "your-user-id",
  "data": {
    "totalUsers": 2,
    "users": [...]
  }
}
```

**Expected result:** JSON with user list (only works when logged in as admin)

---

## 🔐 Testing Different Roles

### Create a Test User

```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET role = 'user' 
WHERE email = 'rod@myroihome.com';
```

Now log in as that user and try:
- Visit `/admin-test` → Should see "Is Admin: ❌ No"
- Visit `/api/admin-test` → Should get 403 Forbidden

### Switch Back to Admin

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'testuser123@gmail.com';
```

---

## 📚 Using RBAC in Your Code

### Check if User is Admin (Client Side)

```tsx
import { useAdmin } from '@/hooks/use-admin'

export function MyComponent() {
  const { isAdmin, role, isLoading } = useAdmin()

  if (isLoading) return <div>Loading...</div>
  
  if (isAdmin) {
    return <AdminPanel />
  }
  
  return <UserDashboard />
}
```

### Check Specific Permission (Client Side)

```tsx
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/lib/admin/permissions'

export function UserManagement() {
  const { hasPermission, isLoading } = usePermission(PERMISSIONS.MANAGE_USERS)

  if (!hasPermission) return null

  return <UserManagementPanel />
}
```

### Protect API Routes (Server Side)

```typescript
import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextResponse } from 'next/server'

export const GET = withAdminAuth(async (request, { userId, supabase }) => {
  // This only runs if user is admin
  const { data } = await supabase.from('sensitive_data').select('*')
  
  return NextResponse.json({ data })
})
```

### Check Permission (Server Side)

```typescript
import { withPermission } from '@/lib/admin/api-middleware'
import { PERMISSIONS } from '@/lib/admin/permissions'

export const POST = withPermission(
  PERMISSIONS.MANAGE_USERS,
  async (request, { userId, supabase }) => {
    // This only runs if user has manage_users permission
    const body = await request.json()
    const { data } = await supabase.from('users').insert(body)
    
    return NextResponse.json({ data })
  }
)
```

---

## 🎯 All Available Permissions

### User Management
- `MANAGE_USERS` - Create, edit, delete users
- `VIEW_USERS` - View user accounts
- `ASSIGN_ROLES` - Change user roles
- `IMPERSONATE_USERS` - View app as another user

### Orders
- `MANAGE_ORDERS` - Full order management
- `CREATE_ORDERS` - Create new orders
- `EDIT_ORDERS` - Edit existing orders
- `DELETE_ORDERS` - Delete orders
- `VIEW_ORDERS` - View orders
- `ASSIGN_ORDERS` - Assign orders to appraisers

### Properties
- `MANAGE_PROPERTIES` - Full property management
- `CREATE_PROPERTIES` - Create new properties
- `EDIT_PROPERTIES` - Edit properties
- `DELETE_PROPERTIES` - Delete properties
- `VIEW_PROPERTIES` - View properties

### Clients
- `MANAGE_CLIENTS` - Full client management
- `CREATE_CLIENTS` - Create new clients
- `EDIT_CLIENTS` - Edit clients
- `DELETE_CLIENTS` - Delete clients
- `VIEW_CLIENTS` - View clients

### Analytics & Reports
- `VIEW_ANALYTICS` - Access analytics dashboard
- `EXPORT_DATA` - Export data to CSV/Excel
- `VIEW_REPORTS` - View system reports

### Audit Logs
- `VIEW_AUDIT_LOGS` - View system audit logs
- `EXPORT_AUDIT_LOGS` - Export audit logs

### Settings
- `MANAGE_SETTINGS` - Edit system settings
- `VIEW_SETTINGS` - View system settings
- `MANAGE_INTEGRATIONS` - Configure integrations

### AI Agents
- `MANAGE_AGENTS` - Configure AI agents
- `VIEW_AGENTS` - View AI agent runs

---

## 📖 Database Functions

You can use these directly in SQL or via Supabase RPC:

### Check Permission
```sql
SELECT role_has_permission('admin', 'manage_users');
-- Returns: true
```

### Get All Permissions for Role
```sql
SELECT * FROM get_role_permissions('admin');
-- Returns: 15 rows
```

### Get User Role
```sql
SELECT get_user_role('user-id-here');
-- Returns: 'admin'
```

### Check if User has Role
```sql
SELECT user_has_role('user-id-here', 'admin');
-- Returns: true/false
```

---

## 🔍 Audit Logging

Audit logging is automatically enabled for profile changes. To log other actions:

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

await supabase.rpc('create_audit_log', {
  p_user_id: userId,
  p_action: 'order.create',
  p_resource_type: 'order',
  p_resource_id: orderId,
  p_changes: {
    new: newOrderData
  },
  p_metadata: {
    client_id: clientId,
    property_id: propertyId
  }
})
```

### View Audit Trail for Resource
```sql
SELECT * FROM get_resource_audit_trail('order', 'order-id-here', 50);
```

### View User Activity
```sql
SELECT * FROM get_user_activity('user-id-here', 50);
```

---

## 🎨 Role-Based UI Components

### Show/Hide Based on Permission

```tsx
import { usePermission } from '@/hooks/use-permission'

export function ConditionalButton() {
  const { hasPermission } = usePermission('manage_users')
  
  if (!hasPermission) return null
  
  return <button>Manage Users</button>
}
```

### Different UI for Different Roles

```tsx
import { useAdmin } from '@/hooks/use-admin'

export function Dashboard() {
  const { role } = useAdmin()
  
  switch(role) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    default:
      return <UserDashboard />
  }
}
```

---

## 🐛 Troubleshooting

### "Unauthorized: Not authenticated"
**Problem:** You're not logged in  
**Solution:** Log in to your app first

### "Unauthorized: Admin access required"
**Problem:** Your user doesn't have admin role  
**Solution:** Run this SQL:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Permissions showing 0
**Problem:** Database functions not working  
**Solution:** Re-run the migration:
```bash
# In Supabase SQL Editor, run:
SELECT * FROM verify_rbac_setup();
# Should show all OK
```

### Hook not working
**Problem:** User profile doesn't have role column  
**Solution:** Check if migration ran:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

---

## 📊 Current System State

### Roles:
- **admin** (3 users max recommended)
- **manager** (for team leads)
- **user** (default for everyone else)

### Total Permissions: 30

### Admin User:
- testuser123@gmail.com (role: admin)

### Test Pages:
- `/admin-test` - RBAC testing page
- `/api/admin-test` - API protection test

---

## ✅ Success Criteria

Phase 1 is working if:

1. ✅ You can log in
2. ✅ `/admin-test` shows your admin status
3. ✅ `/admin-test` shows 15 permissions
4. ✅ `/api/admin-test` returns user list (not unauthorized)
5. ✅ `useAdmin()` hook returns correct role
6. ✅ `usePermission()` hook returns correct permissions

If all of these work, **Phase 1 is complete!** 🎉

---

## 🚀 Next: Phase 2

Ready to build the admin UI! See `ADMIN_PANEL_PLAN.md` for the roadmap.

### Coming Soon:
- Admin dashboard page
- User management interface
- Audit log viewer
- Settings management
- Role assignment UI

---

**Need help?** Check `PHASE-1-TEST-RESULTS.md` for detailed test results.

