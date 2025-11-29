---
status: current
last_verified: 2025-11-29
updated_by: Claude Code
---

# Service-Role Client Usage Audit

**Phase 4: Service-Role Hardening**

This document catalogs all service-role client usages in the codebase and their security status after the tenant migration.

## Executive Summary

- **Total files with service-role usage**: 12
- **Safe/Acceptable**: 4 files (helper libraries, tests, legitimate admin operations)
- **Needs tenant_id migration**: 4 files (currently use org_id, need to switch to tenant_id)
- **Obsolete (can delete)**: 1 file (org_id backfill no longer needed)
- **Already fixed in Phase 1**: 3 files (chat-simple, migrations/run, migrations/dry-run)

## Safe/Acceptable Usages (No Changes Required)

### 1. `src/lib/supabase/admin.ts` ✅ SAFE
**Purpose**: Helper library for controlled service-role operations

**Security Measures**:
- `executeAsAdmin()` wrapper enforces authentication before ANY service-role operation
- All operations logged for audit trail
- Service-role key never exposed to client
- Verified user authentication via regular client first

**Allowed use cases**:
- Tenant creation during user registration
- Magic link generation for borrowers
- Automated system tasks

**Verdict**: ✅ **Correct pattern - keep as-is**

---

### 2. `src/app/api/auth/register/route.ts` ✅ SAFE
**Purpose**: User registration - creates user + tenant atomically

**Service-role usage**:
```typescript
const tenant = await executeAsAdmin(
  'create_tenant_during_registration',
  userId,
  async (adminClient) => {
    const { data, error } = await adminClient
      .from('tenants')
      .insert({ name: tenantName, type: tenantType, owner_id: userId })
      .select()
      .single();
    return data;
  }
);
```

**Why safe**:
- Uses `executeAsAdmin` wrapper with user authentication
- Tenant creation requires service-role (RLS would block new tenant creation)
- Legitimate use case: new users need a tenant to access the app
- User ID comes from authenticated Supabase auth, not user input

**Verdict**: ✅ **Legitimate use case - keep as-is**

---

### 3. `src/lib/supabase/server.ts` ✅ SAFE
**Purpose**: Supabase client factory

**Service-role usage**:
```typescript
export function createServiceRoleClient() {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
```

**Why safe**:
- Just exports factory function
- Actual usage controlled by callers
- Not a security issue itself

**Verdict**: ✅ **Factory function - keep as-is**

---

### 4. `src/lib/agent/__tests__/orchestrator-job-cards.test.ts` ✅ SAFE
**Purpose**: Test file

**Why safe**:
- Test code, not production
- Service-role used to set up test data

**Verdict**: ✅ **Test code - keep as-is**

---

## Already Fixed in Phase 1 ✅

### 5. `src/app/api/agent/chat-simple/route.ts` ✅ FIXED
**Status**: Fixed in Phase 1.1 (2025-11-29)

**Original issue**: Service-role client bypassed RLS, accessed all tenants' data

**Fix**: Removed all service-role usage, replaced with authenticated client

**Result**: Chat agent now respects RLS and tenant boundaries

---

### 6. `src/app/api/migrations/run/route.ts` ✅ FIXED
**Status**: Fixed in Phase 1.2 (2025-11-29)

**Original issue**: Trusted CSV-supplied org_id, allowed data injection into other orgs

**Fix**:
- Fetch user's tenant_id from profile
- Set tenant_id on all imported records
- Ignore CSV-supplied org_id

**Result**: CSV imports properly scoped to user's tenant

---

### 7. `src/app/api/migrations/dry-run/route.ts` ✅ FIXED
**Status**: Fixed in Phase 1.3 (2025-11-29)

**Original issue**: Duplicate checks didn't filter by tenant, allowed enumeration

**Fix**:
- Added tenant_id filtering to all duplicate check queries
- Contacts, clients, orders all scoped by tenant

**Result**: Cross-tenant enumeration eliminated

---

## Needs Tenant Migration (org_id → tenant_id)

### 8. `src/lib/agent/orchestrator.ts` ⚠️ NEEDS UPDATE
**File**: Lines 600-610
**Function**: `processActiveJobs(orgId: string, runId: string)`

**Current code**:
```typescript
const supabase = createServiceRoleClient();
const { data: activeJobs, error: jobsError } = await supabase
  .from('jobs')
  .select('*')
  .eq('org_id', orgId)  // ⚠️ Uses org_id
  .eq('status', 'running')
  .order('created_at', { ascending: true });
```

**Issue**:
- Uses `org_id` for filtering jobs
- After tenant migration, jobs table has `tenant_id` with RLS policies
- Should fetch user's tenant_id and use that instead

**Recommended fix**:
```typescript
// Get user's tenant_id
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', orgId)
  .single();

// Query jobs by tenant_id
const { data: activeJobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('tenant_id', profile.tenant_id)  // ✅ Use tenant_id
  .eq('status', 'running')
  .order('created_at', { ascending: true });
```

**Priority**: Medium (agent system still functional, but uses old pattern)

---

### 9. `src/lib/agent/job-planner.ts` ⚠️ NEEDS UPDATE
**File**: Multiple locations
**Functions**: `expandTaskToCards`, `getTargetContacts`

**Current code** (multiple instances):
```typescript
const supabase = createServiceRoleClient();

// Line 283, 384
const targets = await getTargetContacts(input, params, supabase, job.org_id);

// Line 506
.eq('clients.org_id', orgId)

// Line 544
.eq('org_id', orgId)

// Line 623
.eq('clients.org_id', orgId)

// Line 715
.eq('org_id', orgId)

// Line 745
.eq('org_id', orgId)
```

**Issue**:
- Heavily uses `org_id` for filtering across multiple tables
- Clients, contacts, email_suppressions, agent_memories all queried by org_id
- After migration, these tables use tenant_id

**Recommended fix**:
1. Update function signature to accept `tenantId` instead of `orgId`:
   ```typescript
   async function getTargetContacts(
     input: EmailInput,
     params: JobParams,
     supabase: any,
     tenantId: string  // ✅ Change from orgId
   ): Promise<TargetContact[]>
   ```

2. Replace all `.eq('org_id', orgId)` with `.eq('tenant_id', tenantId)`

3. Get tenantId from job record:
   ```typescript
   const targets = await getTargetContacts(input, params, supabase, job.tenant_id);
   ```

**Priority**: Medium (agent system uses old pattern)

---

### 10. `src/app/api/email/webhook/route.ts` ⚠️ NEEDS UPDATE
**File**: Lines 33-39
**Function**: `handleBounce(supabase, data)`

**Current code**:
```typescript
// Get org_id from contact's client
const { data: client } = await supabase
  .from('clients')
  .select('org_id')
  .eq('id', contact.client_id)
  .single();

const orgId = client?.org_id;

// Later: Line 63, 71
.eq('org_id', orgId)
```

**Issue**:
- Gets `org_id` from client to scope email suppressions
- After migration, should use `tenant_id`

**Recommended fix**:
```typescript
// Get tenant_id from contact's client
const { data: client } = await supabase
  .from('clients')
  .select('tenant_id')  // ✅ Change to tenant_id
  .eq('id', contact.client_id)
  .single();

const tenantId = client?.tenant_id;

// Update email_suppressions queries
.eq('tenant_id', tenantId)
```

**Priority**: Low (webhooks still functional, just uses old pattern)

---

### 11. `src/app/api/admin/properties/backfill/route.ts` ⚠️ NEEDS UPDATE
**File**: Lines 30-63
**Function**: POST handler

**Current code**:
```typescript
const {
  orgId = user.id,  // ⚠️ org_id concept
  pageSize = 1000,
  start = 0,
  dryRun = false
} = body;

// Verify user owns the org
if (orgId !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Query orders
const { data: orders } = await supabase
  .from('orders')
  .select('...')
  .eq('created_by', orgId)  // ⚠️ Uses created_by as org filter
  .is('property_id', null)
```

**Issue**:
- Uses `orgId` parameter and `created_by` as org identifier
- After migration, should use user's `tenant_id` to filter orders

**Recommended fix**:
```typescript
// Get user's tenant_id
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', user.id)
  .single();

const tenantId = profile?.tenant_id;

// Query orders by tenant
const { data: orders } = await supabase
  .from('orders')
  .select('...')
  .eq('tenant_id', tenantId)  // ✅ Use tenant_id
  .is('property_id', null)
```

**Priority**: Low (admin backfill tool, rarely used)

---

## Obsolete (Can Delete After Migration)

### 12. `src/app/api/admin/fix-contacts-org-id/route.ts` ❌ OBSOLETE
**File**: Admin endpoint for org_id backfill

**Purpose**: Backfills `org_id` on contacts from their clients

**Current code**:
```typescript
UPDATE contacts
SET org_id = clients.org_id
FROM clients
WHERE contacts.client_id = clients.id
  AND contacts.org_id IS NULL
```

**Why obsolete**:
- After tenant migration, `org_id` is no longer the isolation boundary
- Contacts table now has `tenant_id` with RLS policies
- This backfill operation is no longer needed

**Recommended action**:
1. ✅ Delete this file after confirming migration is complete
2. ✅ Remove route from API
3. ✅ Update admin UI to remove this option

**Priority**: Low (not harmful to keep, but no longer needed)

---

## Summary Table

| File | Status | Priority | Action Required |
|------|--------|----------|----------------|
| admin.ts | ✅ Safe | - | None - keep as-is |
| auth/register/route.ts | ✅ Safe | - | None - keep as-is |
| server.ts | ✅ Safe | - | None - keep as-is |
| orchestrator-job-cards.test.ts | ✅ Safe | - | None - test code |
| chat-simple/route.ts | ✅ Fixed | - | Already fixed in Phase 1.1 |
| migrations/run/route.ts | ✅ Fixed | - | Already fixed in Phase 1.2 |
| migrations/dry-run/route.ts | ✅ Fixed | - | Already fixed in Phase 1.3 |
| **orchestrator.ts** | ⚠️ Update needed | Medium | Change org_id → tenant_id |
| **job-planner.ts** | ⚠️ Update needed | Medium | Change org_id → tenant_id |
| **email/webhook/route.ts** | ⚠️ Update needed | Low | Change org_id → tenant_id |
| **properties/backfill/route.ts** | ⚠️ Update needed | Low | Change org_id → tenant_id |
| **fix-contacts-org-id/route.ts** | ❌ Obsolete | Low | Delete after migration |

---

## Recommendations

### Immediate Actions (Phase 4)
1. ✅ Document all service-role usages (this file)
2. 🔄 Update orchestrator.ts and job-planner.ts to use tenant_id
3. 🔄 Update email webhook handler to use tenant_id
4. 🔄 Update properties backfill to use tenant_id

### Post-Migration Cleanup (Phase 5)
1. Delete `fix-contacts-org-id/route.ts` endpoint
2. Remove route from API and admin UI
3. Verify all org_id references removed from agent system

### Testing (Phase 6)
1. Test job creation and execution with tenant isolation
2. Test email bounce webhook handling
3. Verify agent system respects tenant boundaries
4. E2E test: Multiple tenants, ensure no cross-tenant data access

---

## Security Principles

**When is service-role client acceptable?**
1. ✅ Wrapped in `executeAsAdmin` with authentication check
2. ✅ Used for legitimate admin operations (tenant creation, magic links)
3. ✅ Manually scoped to authenticated user's tenant_id
4. ✅ All operations logged for audit

**When is service-role client a security risk?**
1. ❌ Direct queries without tenant_id filtering
2. ❌ Trusting user-supplied IDs without validation
3. ❌ No authentication check before usage
4. ❌ Bypassing RLS without manual tenant scoping

**Post-migration best practice**:
- Prefer authenticated client with RLS over service-role client
- If service-role needed, always filter by authenticated user's tenant_id
- Use executeAsAdmin wrapper for all admin operations
- Document why service-role is required in comments

---

## References

- [Multi-Tenant Architecture](./ARCHITECTURE-tenancy.md)
- [Access Control Audit](./access-control-audit.md)
- [Migration Progress](../MIGRATION-PROGRESS.md)
- [Service-Role Usage Patterns](./ARCHITECTURE-tenancy.md#service-role-client-usage)
