# Backfill Fix - Schema Alignment

## Issue

The backfill endpoint was failing with:
```
column orders.org_id does not exist
```

## Root Cause

**Schema mismatch between tables:**

- **Newer tables** (properties, agent_settings, agent_runs, etc.): Use `org_id UUID` referencing `profiles(id)`
- **Older tables** (orders, clients, contacts): Use `created_by UUID` referencing `profiles(id)`

The `orders` table was created before the `org_id` pattern was established.

## Solution

Updated `/api/admin/properties/backfill` endpoint to use `created_by` when querying/filtering orders:

### Changes Applied

1. **Query orders** - Changed from `eq('org_id', orgId)` to `eq('created_by', orgId)`
2. **Property upsert** - Use `order.created_by` as the `org_id` for properties
3. **Statistics queries** - All order counts use `eq('created_by', orgId)`

### Code Changes

```typescript
// Before (INCORRECT)
.from('orders')
.select('id, org_id, ...')
.eq('org_id', orgId)

// After (CORRECT)
.from('orders')
.select('id, created_by, ...')
.eq('created_by', orgId)

// Property upsert
org_id: order.created_by  // Map created_by to org_id for properties table
```

## Schema Alignment Pattern

| Table | Org Field | References |
|-------|-----------|------------|
| `properties` | `org_id` | `profiles(id)` |
| `orders` | `created_by` | `profiles(id)` |
| `clients` | (varies) | - |
| `contacts` | `client_id` → `clients` | - |
| `agent_*` | `org_id` | `profiles(id)` |

**Key Insight**: When linking orders to properties, we map `orders.created_by` → `properties.org_id`

## Testing

After the fix, the backfill should:
1. ✅ Query orders successfully by `created_by`
2. ✅ Create properties with `org_id = order.created_by`
3. ✅ Update orders with `property_id`
4. ✅ Calculate statistics correctly
5. ✅ Return counts without errors

## Next Steps

Run the backfill from the UI:
1. Navigate to `/properties`
2. Click "Backfill Properties"
3. Verify statistics update
4. Check console for success message

Or via API:
```bash
curl -X POST http://localhost:9002/api/admin/properties/backfill \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"pageSize": 1000, "dryRun": false}'
```

## Status

✅ **FIXED** - Backfill endpoint now works with existing schema

