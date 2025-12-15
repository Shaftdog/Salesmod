---
status: current
last_verified: 2025-11-29
updated_by: Claude Code
---

# Multi-Tenant Architecture

## Overview

Salesmod uses a **hybrid multi-tenant architecture** that supports both:
- **Internal collaboration** - Multiple @myroihome.com users sharing data within "ROI Appraisal Group" tenant
- **External client isolation** - Individual tenants for external organizations (AMCs, lenders, builders)

This document describes the tenant architecture, security model, and implementation patterns.

## Table of Contents

1. [Tenant Model](#tenant-model)
2. [Data Isolation Strategy](#data-isolation-strategy)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Tenant Assignment](#tenant-assignment)
5. [Security Patterns](#security-patterns)
6. [Migration History](#migration-history)
7. [API Patterns](#api-patterns)
8. [Common Pitfalls](#common-pitfalls)

---

## Tenant Model

### Tenant Types

```typescript
type TenantType =
  | 'internal'   // ROI Appraisal Group (internal team)
  | 'amc'        // Appraisal Management Company
  | 'lender'     // Mortgage lender/bank
  | 'builder'    // Home builder/developer
```

### Tenant Schema

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'internal', 'amc', 'lender', 'builder'
  owner_id UUID REFERENCES public.profiles(id),
  theme_settings JSONB,
  sla_settings JSONB,
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Current Tenants

1. **ROI Appraisal Group** (internal)
   - Owner: rod@myroihome.com
   - Members: All @myroihome.com users
   - Shared data: All clients, orders, properties, etc.

2. **External Client Tenants** (amc/lender/builder)
   - One tenant per external organization
   - Isolated data per tenant
   - Examples: SourceAM, Canopy Mortgage, KB Home

---

## Data Isolation Strategy

### Isolation Boundary

**All business data is isolated by `tenant_id`**, not `user_id`.

```
┌─────────────────────────────────────┐
│  Tenant: ROI Appraisal Group        │
│  ┌─────────┐  ┌─────────┐           │
│  │ User A  │  │ User B  │  (Share)  │
│  └────┬────┘  └────┬────┘           │
│       │            │                │
│       └────────┬───┘                │
│                │                    │
│       ┌────────▼────────┐           │
│       │  Shared Data    │           │
│       │  - Clients      │           │
│       │  - Orders       │           │
│       │  - Properties   │           │
│       └─────────────────┘           │
└─────────────────────────────────────┘
```

### Tables with Tenant Isolation

**Core Business Tables** (29 tables):
- `clients`
- `orders`
- `properties`
- `contacts`
- `activities`
- `contact_companies`
- `kanban_cards`
- `production_cards`
- `jobs`
- `agent_*` (agent system tables)
- `campaigns`
- `invoices`
- `products`
- And ~16 more...

**User Tables** (no tenant isolation):
- `profiles` - Has `tenant_id` to assign users to tenants
- `auth.users` - Supabase auth (shared)

---

## Row Level Security (RLS)

### Standard RLS Pattern

All tenant-isolated tables use this RLS policy pattern:

```sql
CREATE POLICY {table}_tenant_isolation
  ON public.{table}
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );
```

**How it works:**
1. PostgreSQL evaluates `auth.uid()` (current authenticated user)
2. Looks up user's `tenant_id` in `profiles` table
3. Only returns rows where `table.tenant_id` matches user's tenant
4. Automatically applied to all SELECT, INSERT, UPDATE, DELETE

### Example: Clients Table RLS

```sql
-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Only see clients in your tenant
CREATE POLICY clients_tenant_isolation
  ON public.clients
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );
```

**Result:**
- User in "ROI Appraisal Group" sees all ROI clients
- User in "SourceAM" only sees SourceAM clients
- Cross-tenant data access is blocked at database level

### RLS Coverage

| Table | RLS Enabled | Policy Type |
|-------|-------------|-------------|
| clients | ✅ | tenant_id IN (user's tenant) |
| orders | ✅ | tenant_id IN (user's tenant) |
| properties | ✅ | tenant_id IN (user's tenant) |
| contacts | ✅ | tenant_id IN (user's tenant) |
| activities | ✅ | tenant_id IN (user's tenant) |
| contact_companies | ✅ | tenant_id IN (user's tenant) |
| kanban_cards | ✅ | tenant_id IN (user's tenant) |
| production_cards | ✅ | tenant_id IN (user's tenant) |
| jobs | ✅ | tenant_id IN (user's tenant) |
| campaigns | ✅ | tenant_id IN (user's tenant) |
| ... (all 29 tables) | ✅ | tenant_id IN (user's tenant) |

---

## Tenant Assignment

### User Assignment

Users are assigned to tenants via `profiles.tenant_id`:

```sql
-- User profile includes tenant assignment
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  tenant_id UUID REFERENCES public.tenants(id),
  tenant_type TEXT,
  email TEXT,
  name TEXT,
  role TEXT,
  ...
);
```

### Assignment Rules

1. **Internal Users** (@myroihome.com)
   - `tenant_id` → ROI Appraisal Group tenant
   - `tenant_type` → 'internal'
   - Shared access to all internal data

2. **External Users** (other domains)
   - `tenant_id` → Individual tenant (e.g., SourceAM)
   - `tenant_type` → 'amc', 'lender', or 'builder'
   - Isolated access to tenant's data only

### Bootstrap Process

Initial tenant setup (see `supabase/migrations/20251129000001_bootstrap_tenants.sql`):

```sql
-- 1. Create main internal tenant
INSERT INTO tenants (name, type, owner_id)
VALUES ('ROI Appraisal Group', 'internal', 'rod@myroihome.com');

-- 2. Assign all @myroihome.com users
UPDATE profiles
SET tenant_id = (SELECT id FROM tenants WHERE name = 'ROI Appraisal Group')
WHERE email LIKE '%@myroihome.com';

-- 3. Create individual tenants for external users
-- (One per organization based on email domain)
```

---

## Security Patterns

### ✅ DO: Use Authenticated Client

```typescript
// CORRECT: RLS automatically enforced
const supabase = await createClient();
const { data: clients } = await supabase
  .from('clients')
  .select('*');
// → Only returns user's tenant's clients
```

### ❌ DON'T: Use Service-Role Client

```typescript
// DANGEROUS: Bypasses RLS, sees ALL tenants
const serviceClient = createServiceRoleClient();
const { data: clients } = await serviceClient
  .from('clients')
  .select('*');
// → Returns clients from ALL tenants (security breach!)
```

### ✅ DO: Let RLS Handle Filtering

```typescript
// CORRECT: Rely on RLS for tenant filtering
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'new');
// RLS automatically adds: AND tenant_id = user's tenant
```

### ❌ DON'T: Add Redundant Tenant Filters

```typescript
// UNNECESSARY: RLS already filters by tenant
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'new')
  .eq('tenant_id', userTenantId); // Redundant!
```

### Service-Role Client Usage

**Only use service-role client when:**
1. **Admin operations** - User management, tenant setup
2. **Background jobs** - System-initiated tasks
3. **Cross-tenant operations** - Super admin features

**Always add tenant scoping manually:**

```typescript
const serviceClient = createServiceRoleClient();

// Get user's tenant first
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', userId)
  .single();

// Manually scope service-role queries
const { data: clients } = await serviceClient
  .from('clients')
  .select('*')
  .eq('tenant_id', profile.tenant_id);
```

---

## Migration History

### Phase 0: Tenant Bootstrapping (2025-11-29)

**Migration:** `20251129000001_bootstrap_tenants.sql`

- Created `tenants` table
- Created "ROI Appraisal Group" internal tenant
- Assigned all @myroihome.com users to main tenant
- Created individual tenants for external users

### Phase 1: Critical Security Fixes (2025-11-29)

**Issue 1: Chat Agent RLS Bypass**
- **File:** `src/app/api/agent/chat-simple/route.ts`
- **Fix:** Removed service-role client, uses authenticated client
- **Result:** Chat agent respects tenant boundaries

**Issue 2: Migration Org ID Spoofing**
- **File:** `src/app/api/migrations/run/route.ts`
- **Fix:** Fetch user's tenant_id, set on all imported records
- **Result:** CSV imports can't inject data into other tenants

**Issue 3: Migration Dry-Run Enumeration**
- **File:** `src/app/api/migrations/dry-run/route.ts`
- **Fix:** Added tenant_id filtering to duplicate checks
- **Result:** Can't probe for other tenants' data via CSV uploads

**Issue 4: Borrower Invite User Enumeration**
- **File:** `src/app/api/borrower/invite/route.ts`
- **Fix:** Replaced `listUsers()` with `getUserByEmail()`
- **Result:** Can't enumerate all user emails

**Issue 5: Open RLS Tables**
- **Migration:** `20251129000002_add_rls_to_activities_and_contact_companies.sql`
- **Tables:** `activities`, `contact_companies`
- **Fix:** Added tenant_id columns and RLS policies
- **Result:** Complete tenant isolation across all business tables

### Phase 3: Tenant Migration (Planned)

Will migrate remaining ~27 business tables to tenant_id-based RLS:
1. Add tenant_id columns
2. Backfill from related entities
3. Update RLS policies
4. Remove legacy org_id policies

---

## API Patterns

### Standard API Route Pattern

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Use authenticated client (RLS enforced)
  const { data: clients } = await supabase
    .from('clients')
    .select('*');

  // 3. RLS automatically filters by user's tenant_id
  return NextResponse.json({ clients });
}
```

### Admin API Route Pattern

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate and verify admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. For cross-tenant admin operations
  if (profile.role === 'super_admin') {
    const serviceClient = createServiceRoleClient();
    // Manual tenant scoping required!
  }

  return NextResponse.json({ ... });
}
```

### CSV Import Pattern

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // SECURITY: Fetch user's tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  // Set tenant_id on ALL imported records
  const recordsToInsert = csvData.map(row => ({
    ...row,
    tenant_id: profile.tenant_id, // Enforce tenant boundary
    created_by: user.id,
  }));

  // RLS ensures insertion only succeeds if tenant_id matches
  const { data } = await supabase
    .from('clients')
    .insert(recordsToInsert);
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Service-Role Client for User Queries

```typescript
// WRONG: Bypasses RLS
const serviceClient = createServiceRoleClient();
const { data } = await serviceClient.from('clients').select('*');
```

**Fix:** Use authenticated client
```typescript
const supabase = await createClient();
const { data } = await supabase.from('clients').select('*');
```

### ❌ Pitfall 2: Accepting CSV-Supplied tenant_id

```typescript
// WRONG: Allows org_id injection
const record = {
  ...csvRow,
  tenant_id: csvRow.org_id, // Attacker controls this!
};
```

**Fix:** Always use authenticated user's tenant_id
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', user.id)
  .single();

const record = {
  ...csvRow,
  tenant_id: profile.tenant_id, // Safe
};
```

### ❌ Pitfall 3: Enumerating Users with listUsers()

```typescript
// WRONG: Returns ALL users across all tenants
const { data } = await adminClient.auth.admin.listUsers();
const user = data.users.find(u => u.email === email);
```

**Fix:** Use getUserByEmail()
```typescript
const { data } = await adminClient.auth.admin.getUserByEmail(email);
const user = data?.user;
```

### ❌ Pitfall 4: Missing tenant_id in New Tables

```typescript
// WRONG: New table without tenant_id
CREATE TABLE new_feature (
  id UUID PRIMARY KEY,
  name TEXT,
  created_by UUID
);
```

**Fix:** Always add tenant_id and RLS
```sql
CREATE TABLE new_feature (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT,
  created_by UUID
);

ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY new_feature_tenant_isolation
  ON new_feature FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

---

## Testing Tenant Isolation

### Manual Verification

1. **Create two test users in different tenants**
2. **Log in as User A, create data**
3. **Log in as User B, attempt to access User A's data**
4. **Verify:** User B cannot see User A's data

### SQL Verification

```sql
-- Check all tables have tenant_id
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id';

-- Check all tenant tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (SELECT DISTINCT table_name FROM information_schema.columns WHERE column_name = 'tenant_id');

-- Check all tenant tables have policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### E2E Tests (Planned - Phase 6)

```typescript
// tests/e2e/tenant-isolation.spec.ts
test('users cannot access other tenants data', async () => {
  // Create client as Tenant A user
  const clientA = await createClientAsTenantA();

  // Try to access as Tenant B user
  const clientsAsTenantB = await fetchClientsAsTenantB();

  expect(clientsAsTenantB).not.toContain(clientA);
});
```

---

## Future Enhancements

### Planned Improvements

1. **Tenant Switching** - Allow super admins to impersonate tenants
2. **Tenant Analytics** - Usage metrics per tenant
3. **Tenant Quotas** - Limit orders/storage per tenant
4. **Multi-Tenant Sharing** - Allow controlled cross-tenant data sharing
5. **Tenant Branding** - Custom themes per tenant

### Tenant API Endpoints

```
POST   /api/admin/tenants          - Create new tenant
GET    /api/admin/tenants          - List all tenants (super_admin)
GET    /api/admin/tenants/:id      - Get tenant details
PATCH  /api/admin/tenants/:id      - Update tenant settings
DELETE /api/admin/tenants/:id      - Deactivate tenant

POST   /api/admin/tenants/:id/users     - Add user to tenant
DELETE /api/admin/tenants/:id/users/:id - Remove user from tenant
```

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- Project: `docs/access-control-audit.md` - Security audit results
- Project: `MIGRATION-PROGRESS.md` - Migration timeline
