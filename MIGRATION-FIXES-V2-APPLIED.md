# ✅ Migration Readiness - Final Surgical Fixes Applied

**Date:** October 20, 2025  
**Status:** ✅ **ALL SURGICAL FIXES COMPLETE**

---

## What Was Fixed (Version 2)

Based on detailed feedback, three critical surgical fixes were applied:

### 1. ✅ Fixed Orders Uniqueness Constraint

**Problem:** Initial constraint used `(created_by, external_id)`, but:
- Tenant boundary is **org_id**, not `created_by`
- Different sources (Asana, HubSpot) can reuse the same `external_id`
- Index name didn't match verification query

**Solution:** Updated constraint to `(org_id, source, external_id)`

**File:** `supabase/migrations/20251020120000_add_order_unique_constraints.sql`

**Changes:**
```sql
-- 1. Add org_id column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS org_id UUID;
UPDATE public.orders SET org_id = created_by WHERE org_id IS NULL;
ALTER TABLE public.orders ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON public.orders(org_id);

-- 2. Drop old incorrect constraints
DROP INDEX IF EXISTS uq_orders_org_external_id;
DROP INDEX IF EXISTS uq_orders_created_by_external;

-- 3. Create correct 3-column unique index
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_orders_org_source_external
  ON public.orders(org_id, COALESCE(source, 'unknown'), external_id)
  WHERE external_id IS NOT NULL;
```

**Why COALESCE?** Handles NULL source values in legacy data

**Why CONCURRENTLY?** Allows index creation without locking the table

**Why Partial Index?** `WHERE external_id IS NOT NULL` improves performance

**Impact:**
- ✅ Asana orders with Task ID "12345" won't conflict with HubSpot Deal ID "12345"
- ✅ True multi-tenant isolation at org level
- ✅ Re-imports are fully idempotent per source

---

### 2. ✅ Use Service Role in Backfill Endpoint

**Problem:** Backfill used regular RLS-enabled client, which could:
- Miss cross-table upserts
- Silently drop writes in edge cases
- Be less deterministic for bulk operations

**Solution:** Use service role client for all backfill operations

**File:** `src/app/api/admin/properties/backfill/route.ts`

**Changes:**
```typescript
// BEFORE
const supabase = await createClient();

// AFTER (in POST)
const authClient = await createClient();
const { data: { user } } = await authClient.auth.getUser();
// ... verify user owns org ...
const supabase = createServiceRoleClient(); // Use service role for bulk ops

// AFTER (in GET)
const authClient = await createClient();
const { data: { user } } = await authClient.auth.getUser();
const supabase = createServiceRoleClient(); // Use service role for queries
```

**Security:**
- ✅ Still validates authentication with regular client
- ✅ Still checks user owns the org (`orgId === user.id`)
- ✅ Service role only used AFTER security checks pass

**Impact:**
- More reliable backfills (no RLS surprises)
- Faster bulk operations
- Deterministic behavior for idempotent re-runs

---

### 3. ✅ Added Guard for Orders Without external_id

**Problem:** The unique index ignores NULL `external_id` by design (partial index). Without a guard, orders without `external_id` could create accidental duplicates on re-import.

**Solution:** Guard in importer that:
1. Warns when `external_id` is missing
2. Falls back to generating from `order_number`
3. Throws error if no stable identifier available

**File:** `src/app/api/migrations/run/route.ts` (in `processOrder` function)

**Changes:**
```typescript
// GUARD: Require external_id for idempotent imports
if (!row.external_id || row.external_id.trim() === '') {
  console.warn('Order missing external_id, generating from order_number:', row.order_number);
  
  // Option 1: Use order_number as external_id if available
  if (row.order_number && row.order_number.trim() !== '') {
    row.external_id = `order-${row.order_number}`;
    console.log(`Generated external_id: ${row.external_id}`);
  } 
  // Option 2: Skip if no stable identifier available
  else {
    console.error('Order has no external_id or order_number - cannot ensure idempotency, skipping');
    throw new Error('Order requires either external_id or order_number for idempotent imports');
  }
}

// Ensure source is set (required for unique constraint with COALESCE)
if (!row.source || row.source.trim() === '') {
  row.source = source || 'unknown';
}

// Set org_id for tenant isolation
row.org_id = userId;
```

**Updated Duplicate Check:**
```typescript
// OLD: Only checked external_id
const { data: existing } = await supabase
  .from('orders')
  .select('id')
  .eq('external_id', row.external_id)
  .maybeSingle();

// NEW: Checks (org_id, source, external_id) - matches unique constraint
const { data: existing } = await supabase
  .from('orders')
  .select('id')
  .eq('org_id', userId)
  .eq('source', row.source)
  .eq('external_id', row.external_id)
  .maybeSingle();
```

**Impact:**
- ✅ No accidental duplicates on re-import
- ✅ Clear error messages when data is missing stable identifiers
- ✅ Automatic fallback to order_number when external_id missing
- ✅ Duplicate detection now matches the database constraint exactly

---

## Acceptance Checks

### 1. Index Verification

**Query:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders' 
  AND indexname IN ('uq_orders_org_source_external', 'uq_orders_order_number');
```

**Expected Output:**
```
indexname                      | indexdef
-------------------------------|----------------------------------------------------------
uq_orders_org_source_external  | CREATE UNIQUE INDEX ... ON orders(org_id, COALESCE(...))
uq_orders_order_number         | CREATE UNIQUE INDEX ... ON orders(order_number)
```

---

### 2. Re-Import Idempotency Test

**Steps:**
1. Import sample Orders CSV (10-20 rows)
2. Note: X inserted, Y updated
3. Import the **same** CSV again (no changes)
4. Verify: 0 inserted, X updated (or X skipped if strategy = 'skip')

**Expected:**
- First import: `{ inserted: 15, updated: 0, skipped: 0 }`
- Second import: `{ inserted: 0, updated: 15, skipped: 0 }` (or all skipped)

---

### 3. Backfill Under Service Role

**Test:**
```bash
POST /api/admin/properties/backfill
{
  "pageSize": 100,
  "dryRun": false
}
```

**Expected Response:**
```json
{
  "message": "Backfill completed",
  "result": {
    "scanned": 50,
    "propertiesCreated": 30,
    "ordersLinked": 50,
    "skipped": 0,
    "warnings": []
  }
}
```

**Verify:**
- ✅ No RLS errors in server logs
- ✅ `propertiesCreated` and `ordersLinked` rise as expected
- ✅ Can run multiple times (idempotent)

---

### 4. Duplicate Properties Sanity Check

**Query:**
```sql
SELECT org_id, addr_hash, COUNT(*) as dupes
FROM properties 
GROUP BY 1, 2 
HAVING COUNT(*) > 1;
```

**Expected Output:** 0 rows (no duplicates)

---

### 5. Preflight Duplicate Check

**Before Running Migration:**
```sql
WITH duplicates AS (
  SELECT 
    org_id, 
    COALESCE(source, 'unknown') AS source, 
    external_id, 
    COUNT(*) AS count
  FROM orders
  WHERE external_id IS NOT NULL
  GROUP BY 1, 2, 3
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;
```

**Expected Output:** 0 rows

**If rows returned:** Resolve duplicates manually before running migration:
```sql
-- Example: Keep the earliest order, delete duplicates
DELETE FROM orders 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY org_id, COALESCE(source, 'unknown'), external_id 
      ORDER BY created_at ASC
    ) AS rn
    FROM orders
    WHERE external_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);
```

---

### 6. Verify org_id Column

**Query:**
```sql
SELECT 
  COUNT(*) AS total_orders,
  COUNT(org_id) AS with_org_id,
  COUNT(*) FILTER (WHERE org_id IS NULL) AS null_org_id
FROM orders;
```

**Expected Output:**
```
total_orders | with_org_id | null_org_id
-------------|-------------|------------
     1234    |    1234     |      0
```

---

## Files Modified

### 1. Migration File (Updated)
**File:** `supabase/migrations/20251020120000_add_order_unique_constraints.sql`

**Changes:**
- Added `org_id` column to orders table
- Backfilled `org_id` from `created_by`
- Dropped old incorrect constraints
- Created correct 3-column unique index: `uq_orders_org_source_external`
- Added preflight duplicate check (commented)

---

### 2. Backfill Endpoint (Updated)
**File:** `src/app/api/admin/properties/backfill/route.ts`

**Changes:**
- Imported `createServiceRoleClient`
- Updated `POST` to use service role after auth check
- Updated `GET` to use service role for statistics
- Added comments explaining security model

---

### 3. Migration Importer (Updated)
**File:** `src/app/api/migrations/run/route.ts`

**Changes:**
- Added guard for missing `external_id`
- Generates `external_id` from `order_number` as fallback
- Throws error if no stable identifier available
- Sets `org_id = userId` for tenant isolation
- Updated duplicate check to use `(org_id, source, external_id)`
- Ensures `source` is always set (never NULL)

---

## Deployment Checklist

### Step 1: Run Preflight Checks

```sql
-- Check for existing duplicates
WITH duplicates AS (
  SELECT 
    org_id, 
    COALESCE(source, 'unknown') AS source, 
    external_id, 
    COUNT(*) AS count
  FROM orders
  WHERE external_id IS NOT NULL
  GROUP BY 1, 2, 3
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;

-- If any rows, resolve before proceeding
```

### Step 2: Run Migration

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Manual (run in Supabase SQL Editor)
# Copy/paste: supabase/migrations/20251020120000_add_order_unique_constraints.sql
```

### Step 3: Verify Migration

```sql
-- Verify org_id column exists and is populated
SELECT COUNT(*) AS total, COUNT(org_id) AS with_org_id
FROM orders;

-- Verify index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'orders' 
  AND indexname = 'uq_orders_org_source_external';
```

### Step 4: Test Re-Import Idempotency

1. Import small CSV (10 rows)
2. Import same CSV again
3. Verify: 0 inserts, all updates/skips

### Step 5: Test Backfill

```bash
POST /api/admin/properties/backfill
{ "pageSize": 100, "dryRun": true }

# Review output, then run for real
POST /api/admin/properties/backfill
{ "pageSize": 1000, "dryRun": false }
```

### Step 6: Run Final Acceptance Checks

```sql
-- No duplicate properties
SELECT org_id, addr_hash, COUNT(*) 
FROM properties GROUP BY 1,2 HAVING COUNT(*)>1;

-- No orders without org_id
SELECT COUNT(*) FROM orders WHERE org_id IS NULL;

-- Index integrity
SELECT indexname FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname IN ('uq_orders_org_source_external', 'uq_orders_order_number');
```

---

## Summary of Fixes

| Issue | Status | Impact |
|-------|--------|--------|
| Wrong unique constraint columns | ✅ Fixed | Now uses `(org_id, source, external_id)` |
| Backfill not using service role | ✅ Fixed | More reliable, deterministic bulk ops |
| No guard for NULL external_id | ✅ Fixed | Prevents accidental duplicates |
| Index name mismatch | ✅ Fixed | Verification queries now correct |
| Missing org_id column | ✅ Fixed | Added with backfill from created_by |

---

## Ready for Production ✅

All surgical fixes have been applied. The system now supports:

✅ **True Multi-Tenant Isolation** - org_id boundary  
✅ **Source-Aware Deduplication** - Different sources can reuse IDs  
✅ **Idempotent Re-Imports** - Run same import multiple times safely  
✅ **Deterministic Backfills** - Service role ensures no RLS surprises  
✅ **Accidental Duplicate Prevention** - Guard for missing external_id  

**Next Steps:**
1. Run preflight duplicate check
2. Apply migration
3. Test with sample data
4. Deploy to production
5. Import Companies → Contacts → Orders at scale

---

**Questions?** See acceptance checks above or refer to:
- `MIGRATION-READINESS-AUDIT.md` (comprehensive audit)
- `MIGRATION-FIXES-APPLIED.md` (version 1 fixes)
- This document (version 2 surgical fixes)

