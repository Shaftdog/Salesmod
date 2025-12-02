---
status: current
last_verified: 2025-12-01
updated_by: Claude Code
issue: Deals not visible to users
resolution: tenant_id mismatch fixed
---

# Deal Visibility Issue - Tenant ID Mismatch

## Problem Summary

Users could not see their deals in the application despite the deals existing in the database with `tenant_id` values set.

## Root Cause

**Tenant ID Mismatch**: Three deals had incorrect `tenant_id` values that didn't match any existing user's `tenant_id`.

### Investigation Results

**Deals Table Analysis:**
- Total deals: 4
- Problematic deals: 3
- All created by: rod@myroihome.com (user ID: bde00714-427d-4024-9fbd-6f895824f733)

**The Mismatch:**
- Deals had `tenant_id`: `da0563f7-7d29-4c02-b835-422f31c82b7b` (orphaned - no user has this)
- Creator's actual `tenant_id`: `8df02ee5-5e0b-40e1-aa25-6a8ed9a461de`

**Affected Deals:**
1. "Gold Coast DOF - Sedgwick Ave Retrospective Appraisal"
2. "Reggora Platinum Panel"
3. "6 Orders - Frank Giacomo Deal"

## Why This Happened

The deals were created with a `tenant_id` that doesn't exist in the profiles table. This likely occurred due to:

1. A data migration or import that used incorrect tenant IDs
2. A bug in the deal creation logic that assigned wrong tenant_id
3. Manual database changes that didn't maintain referential integrity

## RLS Impact

Row Level Security (RLS) policies filter data by `tenant_id`:

```sql
-- Typical RLS policy
CREATE POLICY "Users can only see deals from their tenant"
ON deals FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));
```

When a deal's `tenant_id` doesn't match any user's `tenant_id`, it becomes invisible to all users.

## Resolution

### Scripts Created

1. **Diagnostic Script**: `scripts/debug-deals-tenants.js`
   - Queries deals and profiles tables
   - Identifies tenant_id mismatches
   - Shows detailed analysis

2. **Fix Script**: `scripts/fix-deal-tenant-mismatch.js`
   - Updates deal tenant_ids to match their creators
   - Includes dry-run mode for safety
   - Provides detailed change log

### Fix Applied

```bash
# Run diagnostic
node scripts/debug-deals-tenants.js

# Preview changes (dry-run)
node scripts/fix-deal-tenant-mismatch.js

# Apply fix
node scripts/fix-deal-tenant-mismatch.js --confirm
```

**Result:**
- Successfully updated 3 deals
- All deals now have `tenant_id`: `8df02ee5-5e0b-40e1-aa25-6a8ed9a461de`
- Deals are now visible to their creator and tenant members

### Verification

After fix:
```
Unique tenant_ids in deals: [ '8df02ee5-5e0b-40e1-aa25-6a8ed9a461de' ]
✓ All deal tenant_ids match profile tenant_ids
✓ All deals created by users with tenant_id
```

## Prevention

### 1. Database Constraints

Consider adding a foreign key constraint:

```sql
ALTER TABLE deals
ADD CONSTRAINT fk_deals_tenant
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
ON DELETE RESTRICT;
```

### 2. Application-Level Checks

Ensure all deal creation code sets `tenant_id` from the creator's profile:

```typescript
// Good: Get tenant_id from user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', userId)
  .single();

const { data: deal } = await supabase
  .from('deals')
  .insert({
    title: dealTitle,
    tenant_id: profile.tenant_id, // Use creator's tenant_id
    created_by: userId
  });
```

### 3. Data Validation

Add validation in API routes:

```typescript
// Validate tenant_id exists before creating deal
if (!userTenantId) {
  throw new Error('User must belong to a tenant');
}

// Verify tenant_id matches user's tenant
if (dealData.tenant_id !== userTenantId) {
  throw new Error('Cannot create deal for different tenant');
}
```

### 4. Migration Testing

When running data migrations:
- Always verify tenant_id mappings
- Run diagnostic scripts before/after
- Test visibility after migration
- Include rollback procedures

## Monitoring

Run periodic checks to detect orphaned tenant_ids:

```bash
# Check for mismatches
node scripts/debug-deals-tenants.js
```

Add to CI/CD or cron job to catch issues early.

## Related Documentation

- [Multi-Tenant Architecture](../architecture/multi-tenant-isolation.md)
- [RLS Policies](../operations/database-migrations/rls-policies.md)
- [Deal Management](../features/case-management/deals.md)

## Files Modified

- Created: `scripts/debug-deals-tenants.js`
- Created: `scripts/fix-deal-tenant-mismatch.js`
- Created: `docs/troubleshooting/deal-visibility-tenant-mismatch.md`

## Timeline

- **2025-12-01**: Issue identified and resolved
- **Affected Period**: Unknown (deals created before fix)
- **Users Impacted**: rod@myroihome.com and tenant members
- **Resolution Time**: ~10 minutes
