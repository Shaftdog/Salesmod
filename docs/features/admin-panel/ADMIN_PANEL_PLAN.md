---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Admin Panel Implementation Plan

**Project:** Salesmod (AppraiseTrack)
**Branch:** `claude/create-admin-panel-011CUT7Xyw84p5DrvXo37yb3`
**Created:** 2025-10-25

---

## Overview

This document outlines the comprehensive plan for implementing an admin panel to control users, system settings, and operations as the application rolls into production.

### Current State
- **Tech Stack:** Next.js 15 + React 18, TypeScript, Supabase (PostgreSQL), Tailwind CSS
- **Authentication:** Supabase Auth (email/password)
- **Current Gap:** No role-based access control (RBAC) - all authenticated users have equal access
- **Database:** 20+ tables including profiles, orders, properties, clients, contacts, etc.

---

## Phase 1: Role-Based Access Control (RBAC) Foundation

### 1.1 Database Schema

**New Tables:**

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- e.g., 'users', 'orders', 'properties'
  action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission junction table
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role to profiles table
ALTER TABLE profiles
ADD COLUMN role VARCHAR(50) DEFAULT 'user' REFERENCES roles(name);

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_profiles_role ON profiles(role);
```

**Default Roles:**
- `admin` - Full system access
- `manager` - Manage orders, properties, clients (no user management)
- `user` - Standard user access (default)

**Default Permissions:**
- `manage_users` - Create, edit, delete users
- `manage_roles` - Assign roles to users
- `view_audit_logs` - View system audit logs
- `manage_settings` - Edit system settings
- `manage_orders` - Full order management
- `view_orders` - View orders only
- `manage_properties` - Full property management
- `view_analytics` - Access analytics dashboard
- `impersonate_users` - View app as another user

### 1.2 Backend Authorization

**Utility Functions** (`lib/admin/permissions.ts`):
```typescript
// Check if user has specific role
async function hasRole(userId: string, roleName: string): Promise<boolean>

// Check if user has specific permission
async function hasPermission(userId: string, permissionName: string): Promise<boolean>

// Get user's role and permissions
async function getUserPermissions(userId: string): Promise<Permission[]>

// Require role (throws error if not authorized)
async function requireRole(userId: string, roleName: string): Promise<void>

// Require permission (throws error if not authorized)
async function requirePermission(userId: string, permissionName: string): Promise<void>
```

**Middleware** (`middleware/admin.ts`):
- Check user authentication
- Verify admin role for protected routes
- Log admin actions to audit log

**API Protection:**
- All `/api/admin/*` routes require admin role
- Sensitive operations require specific permissions
- Rate limiting on admin endpoints

### 1.3 Frontend Authorization

**Components:**
- `<ProtectedRoute requiredRole="admin">` - Wrapper for admin-only pages
- `<RequirePermission permission="manage_users">` - Conditional rendering
- `useAdmin()` - Hook to get current user's role and permissions
- `useHasPermission(permission)` - Hook to check specific permission

---

## Phase 2: Admin Dashboard & Navigation

### 2.1 Admin Layout

**File:** `app/admin/layout.tsx`

**Features:**
- Sidebar navigation with sections:
  - Dashboard
  - Users
  - Settings
  - Audit Logs
  - Analytics
- Collapsible sidebar
- Admin-only header with quick actions
- Breadcrumb navigation
- User menu with profile/logout

### 2.2 Dashboard Overview

**File:** `app/admin/page.tsx`

**Sections:**
1. **Key Metrics Cards**
   - Total users (with active/inactive breakdown)
   - Active orders (today/this week)
   - System health status
   - Storage usage

2. **Recent Activity Feed**
   - Latest user registrations
   - Recent orders created
   - Admin actions from audit log

3. **Quick Actions Panel**
   - Create new user
   - View pending orders
   - System settings
   - Export data

4. **System Alerts**
   - Failed background jobs
   - Low storage warnings
   - Security alerts

---

## Phase 3: User Management

### 3.1 User List & Search

**File:** `app/admin/users/page.tsx`

**Features:**
- Paginated table (TanStack Table)
- Columns: Avatar, Name, Email, Role, Status, Last Active, Created Date, Actions
- Search by name/email
- Filter by role, status, date range
- Sort by any column
- Bulk actions:
  - Activate/deactivate accounts
  - Assign role
  - Delete users (with confirmation)
- Export to CSV

### 3.2 User Details & Editing

**File:** `app/admin/users/[id]/page.tsx`

**Sections:**
1. **User Profile**
   - View/edit basic info (name, email, avatar)
   - Account status (active/inactive toggle)
   - Created date, last login
   - Password reset button

2. **Role & Permissions**
   - Change user role (dropdown)
   - View effective permissions
   - Custom permission overrides (advanced)

3. **User Activity**
   - Recent logins
   - Orders created/modified
   - Properties managed
   - API usage stats

4. **Related Data**
   - User's orders (with links)
   - User's properties (with links)
   - User's clients/contacts

### 3.3 User Activity Logs

**File:** `app/admin/users/[id]/activity/page.tsx`

**Features:**
- Timeline of user actions
- Filter by action type, date range
- Export user data (GDPR compliance)
- Permanently delete user (with warning)

---

## Phase 4: System Configuration

### 4.1 Settings Management

**File:** `app/admin/settings/page.tsx`

**Sections:**
1. **General Settings**
   - Site name, logo
   - Default timezone
   - Date/time formats

2. **Email Settings**
   - SMTP configuration
   - Email templates
   - Default sender address

3. **Integration Settings**
   - HubSpot API credentials
   - Asana API tokens
   - Other third-party integrations

4. **Feature Flags**
   - Enable/disable features
   - Beta feature access

5. **AI Agent Configuration**
   - Model selection
   - Temperature settings
   - Rate limits

### 4.2 Audit Logging

**File:** `app/admin/audit-logs/page.tsx`

**Features:**
- Comprehensive audit log table
- Columns: Timestamp, User, Action, Resource, Changes, IP Address
- Filter by:
  - User
  - Action type
  - Resource type
  - Date range
- Search by keyword
- View detailed changes (JSON diff)
- Export logs for compliance

---

## Phase 5: Advanced Features

### 5.1 Analytics & Reporting

**File:** `app/admin/analytics/page.tsx`

**Charts & Metrics:**
- User growth over time (line chart)
- Order processing statistics (bar chart)
- User engagement metrics (active users, session duration)
- System performance (API response times, error rates)
- Custom date range selector
- Export charts as PNG/PDF

### 5.2 Content Management

**Files:** `app/admin/content/*`

**Features:**
- Property templates manager
- Email template editor (WYSIWYG)
- FAQ/Help content management
- Upload/manage assets (images, PDFs)

### 5.3 User Impersonation

**Features:**
- Safely view the app as another user (for support)
- Clear banner showing "Viewing as [User Name]"
- Exit impersonation button
- Complete audit trail of impersonation sessions
- Restricted actions while impersonating (no password changes, etc.)

---

## Implementation Priority Levels

### 🔴 Critical (Week 1-2)
**Must-have for production rollout:**
- Phase 1: Complete RBAC foundation
  - Database schema and migrations
  - Backend authorization utilities
  - Frontend role checking
- Basic user management:
  - View user list
  - Edit user roles
  - Activate/deactivate accounts
- Admin authentication check on all admin routes

### 🟡 Important (Week 2-3)
**Essential for smooth operations:**
- Admin dashboard with key metrics
- Complete user management features:
  - User search and filtering
  - Bulk actions
  - User activity view
- Audit logging:
  - Log all admin actions
  - Basic audit log viewer
- System settings UI (basic)

### 🟢 Nice-to-Have (Week 3-4)
**Enhances admin experience:**
- Advanced analytics and reporting
- Complete system configuration UI
- Content management tools
- User impersonation
- Custom report builder
- Export capabilities

---

## File Structure

```
app/
├── admin/
│   ├── layout.tsx                      # Admin layout with sidebar
│   ├── page.tsx                        # Dashboard overview
│   ├── users/
│   │   ├── page.tsx                   # User list with search/filter
│   │   ├── new/page.tsx               # Create new user
│   │   └── [id]/
│   │       ├── page.tsx               # User details/edit
│   │       ├── activity/page.tsx      # User activity log
│   │       └── loading.tsx            # Loading state
│   ├── settings/
│   │   ├── page.tsx                   # General settings
│   │   ├── email/page.tsx             # Email configuration
│   │   ├── integrations/page.tsx      # Integration configs
│   │   └── features/page.tsx          # Feature flags
│   ├── audit-logs/
│   │   └── page.tsx                   # Audit log viewer
│   ├── analytics/
│   │   └── page.tsx                   # Analytics dashboard
│   └── content/
│       ├── templates/page.tsx         # Property templates
│       └── emails/page.tsx            # Email templates
│
├── api/
│   └── admin/
│       ├── users/
│       │   ├── route.ts               # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts           # GET, PATCH, DELETE
│       │       └── impersonate/route.ts
│       ├── roles/
│       │   └── route.ts               # List roles and permissions
│       ├── audit-logs/
│       │   └── route.ts               # Query audit logs
│       ├── settings/
│       │   └── route.ts               # Get/update settings
│       └── analytics/
│           └── route.ts               # Get analytics data
│
components/
└── admin/
    ├── layout/
    │   ├── admin-sidebar.tsx          # Sidebar navigation
    │   ├── admin-header.tsx           # Admin header
    │   └── breadcrumb.tsx             # Breadcrumb navigation
    ├── dashboard/
    │   ├── stats-card.tsx             # Metric card component
    │   ├── activity-feed.tsx          # Recent activity
    │   └── quick-actions.tsx          # Quick action buttons
    ├── users/
    │   ├── user-table.tsx             # User list table
    │   ├── user-form.tsx              # User create/edit form
    │   ├── role-select.tsx            # Role selector
    │   ├── user-status-badge.tsx      # Status badge
    │   └── bulk-actions.tsx           # Bulk action toolbar
    ├── audit/
    │   ├── audit-log-table.tsx        # Audit log table
    │   └── change-diff.tsx            # JSON diff viewer
    ├── settings/
    │   ├── settings-form.tsx          # Settings form sections
    │   └── integration-card.tsx       # Integration config card
    └── shared/
        ├── protected-route.tsx        # Role-based route wrapper
        ├── require-permission.tsx     # Permission-based rendering
        └── impersonation-banner.tsx   # Active impersonation banner
│
lib/
├── admin/
│   ├── permissions.ts                 # Permission checking utilities
│   ├── audit.ts                       # Audit logging utilities
│   ├── roles.ts                       # Role management
│   └── settings.ts                    # Settings management
├── hooks/
│   ├── use-admin.ts                   # Get current admin user
│   ├── use-has-permission.ts          # Check permission hook
│   └── use-audit-log.ts               # Audit log queries
└── db/
    └── migrations/
        ├── 001_create_rbac_tables.sql
        ├── 002_add_role_to_profiles.sql
        ├── 003_create_audit_logs.sql
        └── 004_seed_default_roles.sql
```

---

## Security Considerations

### 1. Row-Level Security (RLS)
Update Supabase policies for admin tables:
```sql
-- Only admins can read/write roles and permissions
CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audit logs are read-only for admins
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 2. API Protection
- All `/api/admin/*` endpoints require admin role
- Validate user role on every request (don't trust client)
- Use middleware to check permissions before route handler
- Rate limiting: 100 requests/minute for admin endpoints

### 3. Audit Everything
Log all admin actions including:
- User creation/modification/deletion
- Role changes
- Settings updates
- Data exports
- Failed authentication attempts
- Impersonation sessions

### 4. Password & Session Security
- Enforce strong passwords for admin accounts
- Consider two-factor authentication (2FA) for admins
- Admin sessions timeout after 30 minutes of inactivity
- Force logout on password change
- IP whitelisting option for admin panel

### 5. Data Protection
- Encrypt sensitive settings (API keys, passwords)
- Mask sensitive data in audit logs
- GDPR compliance: user data export and deletion
- Regular database backups before bulk operations

### 6. Input Validation
- Validate all inputs with Zod schemas
- Sanitize user-provided content
- Prevent SQL injection (use parameterized queries)
- CSRF protection on all forms

---

## API Endpoints Reference

### User Management
```
GET    /api/admin/users              # List users (paginated, filtered)
POST   /api/admin/users              # Create new user
GET    /api/admin/users/:id          # Get user details
PATCH  /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id          # Delete user (soft delete)
POST   /api/admin/users/:id/impersonate   # Start impersonation
GET    /api/admin/users/:id/activity # Get user activity log
POST   /api/admin/users/:id/reset-password # Send password reset
```

### Roles & Permissions
```
GET    /api/admin/roles              # List all roles
GET    /api/admin/permissions        # List all permissions
POST   /api/admin/roles/:id/permissions # Assign permission to role
```

### Audit Logs
```
GET    /api/admin/audit-logs         # Query audit logs (filtered)
GET    /api/admin/audit-logs/:id     # Get specific log entry
```

### Settings
```
GET    /api/admin/settings           # Get all settings
PATCH  /api/admin/settings           # Update settings
GET    /api/admin/settings/integrations # Get integration configs
```

### Analytics
```
GET    /api/admin/analytics/users    # User growth data
GET    /api/admin/analytics/orders   # Order statistics
GET    /api/admin/analytics/system   # System health metrics
```

---

## Testing Strategy

### Unit Tests
- Permission checking functions
- Role assignment logic
- Audit log creation
- Settings validation

### Integration Tests
- API endpoints with role-based access
- User CRUD operations
- Bulk user actions
- Impersonation flow

### E2E Tests
- Admin login flow
- User management workflow
- Settings update flow
- Audit log viewing

### Security Tests
- Unauthorized access attempts
- Role escalation prevention
- SQL injection prevention
- XSS prevention in admin forms

---

## Deployment Checklist

### Before Production
- [ ] All database migrations tested
- [ ] Row-level security policies enabled
- [ ] Admin user created in production
- [ ] All API endpoints protected
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Error tracking setup (Sentry)
- [ ] Backup strategy in place

### First Production Admin
```sql
-- Create first admin user (run manually in Supabase SQL editor)
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Monitoring
- Track admin login attempts
- Monitor API response times
- Alert on failed authentication
- Daily backup verification
- Weekly audit log review

---

## Future Enhancements

### Phase 6+ (Post-Launch)
1. **Multi-tenancy Support**
   - Separate admin panels per organization
   - Cross-tenant reporting for super admins

2. **Advanced Permissions**
   - Custom permission sets
   - Conditional permissions (time-based, IP-based)
   - Permission inheritance

3. **Workflow Automation**
   - Automated user onboarding
   - Scheduled reports
   - Alert rules and notifications

4. **Mobile Admin App**
   - React Native admin app
   - Push notifications for critical alerts

5. **API Management**
   - API key generation for users
   - API usage tracking
   - Rate limit customization

6. **Advanced Analytics**
   - Predictive analytics
   - Custom dashboard builder
   - Real-time metrics

---

## Technology Stack Summary

**Already in Use:**
- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui, Lucide Icons
- **Forms:** React Hook Form, Zod
- **State Management:** React Query, Zustand
- **Charts:** Recharts
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

**New Dependencies (if needed):**
- `@tanstack/react-table` - Advanced data tables
- `date-fns` - Date formatting/manipulation
- `react-json-view` - JSON diff viewer for audit logs
- `react-hot-toast` - Toast notifications

---

## Success Metrics

### Week 1-2
- [ ] RBAC system fully functional
- [ ] Admin can view and manage users
- [ ] All admin actions logged

### Week 2-3
- [ ] Admin dashboard live with key metrics
- [ ] Complete user management features
- [ ] Settings UI functional

### Week 3-4
- [ ] Analytics dashboard operational
- [ ] All Phase 1-4 features complete
- [ ] Production-ready security measures

### Post-Launch
- Track admin user satisfaction
- Monitor system performance impact
- Gather feedback for Phase 5+ features

---

## Support & Maintenance

### Documentation
- Admin user guide (how to use admin panel)
- Developer documentation (how to extend)
- API documentation (admin endpoints)
- Troubleshooting guide

### Ongoing Tasks
- Regular security audits
- Performance optimization
- Feature requests from admin users
- Bug fixes and patches

---

## Questions & Decisions Needed

Before starting implementation, confirm:

1. **Default Admin:** Who should be the first admin user? (email address)
2. **Permissions:** Are the default permissions sufficient, or do you need custom ones?
3. **Audit Retention:** How long should audit logs be kept? (30 days, 90 days, 1 year?)
4. **User Deletion:** Hard delete or soft delete (keep record)?
5. **Email Notifications:** Should admins get email alerts for critical actions?
6. **Backup Strategy:** Who manages database backups?

---

## Contact & Resources

**Project Repository:** `/home/user/Salesmod`
**Development Branch:** `claude/create-admin-panel-011CUT7Xyw84p5DrvXo37yb3`
**Database:** Supabase PostgreSQL

---

*This plan is a living document and will be updated as implementation progresses.*
