---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Migration Report: Contact & Client Merge Functions

**Migration File:** `supabase/migrations/20251114000000_add_merge_functions.sql`
**Applied:** 2025-11-14 20:23:57 UTC
**Status:** ✅ SUCCESS

## Overview

This migration adds comprehensive contact and client merging functionality with USPAP-compliant audit logging and security features. The system allows for safe deduplication of contacts and clients while maintaining complete data integrity and audit trails.

## What Was Created

### 1. Audit Table (`merge_audit`)
A USPAP-compliant audit log for tracking all merge operations:

**Columns:**
- `id` (uuid) - Primary key
- `merge_type` (text) - Either 'contact' or 'client'
- `winner_id` (uuid) - ID of the record that was kept
- `loser_id` (uuid) - ID of the record that was deleted
- `loser_data` (jsonb) - Complete snapshot of deleted record
- `merged_by` (uuid) - User who performed the merge
- `merged_at` (timestamptz) - When the merge occurred
- `counts` (jsonb) - Count of records transferred
- `org_id` (uuid) - Organization for security filtering

**Security:**
- Row-Level Security (RLS) enabled
- Users can only view merges for their organization
- Complete audit trail for compliance

**Indexes:**
- `idx_merge_audit_winner` - Fast lookups by winner
- `idx_merge_audit_loser` - Fast lookups by loser
- `idx_merge_audit_org` - Organization filtering
- `idx_merge_audit_date` - Chronological queries

### 2. Merge Functions

#### `merge_contacts(winner_id, loser_id)`
Merges two contacts into one canonical contact.

**What it does:**
1. Validates both contacts exist and belong to same organization
2. Transfers all dependent records to winner:
   - Activities
   - Email suppressions (handles duplicates)
   - Email notifications
   - Kanban cards
   - Deals
   - Tasks
   - Cases
   - Contact-company history
3. Merges metadata (tags, notes)
4. Preserves loser's data if winner is missing it (email, phone)
5. Logs complete audit record
6. Deletes loser contact

**Security:**
- Organization validation prevents cross-org merges
- Automatic transaction rollback on any error
- Complete audit trail

**Returns:** JSON with success status and transfer counts

#### `merge_clients(winner_id, loser_id)`
Merges two clients (companies) into one canonical client.

**What it does:**
1. Validates both clients exist and belong to same organization
2. Transfers all dependent records to winner:
   - Contacts
   - Contact-company history
   - Orders
   - Properties
   - Activities
   - Deals
   - Tasks
   - Cases
3. Preserves loser's data if winner is missing it
4. Logs complete audit record
5. Deletes loser client

**Security:**
- Organization validation prevents cross-org merges
- Automatic transaction rollback on any error
- Complete audit trail

**Returns:** JSON with success status and transfer counts

### 3. Helper Functions

#### `find_duplicate_contacts(org_id, limit)`
Finds potential duplicate contacts for review.

**Detection methods:**
- Exact email matches (similarity: 1.0)
- Similar names within same client (similarity > 0.6)

**Returns:** Table with contact pairs, match type, and similarity score

#### `find_duplicate_clients(org_id, limit)`
Finds potential duplicate clients for review.

**Detection methods:**
- Exact domain matches (similarity: 1.0)
- Similar company names (similarity > 0.7)

**Returns:** Table with client pairs, match type, and similarity score

### 4. Performance Indexes

**For similarity searches (using pg_trgm extension):**
- `idx_clients_company_name_trgm` - Fast company name similarity
- `idx_contacts_name_trgm` - Fast contact name similarity

**For exact matches:**
- `idx_clients_domain_lower` - Fast domain lookups
- `idx_contacts_email_lower` - Fast email lookups

### 5. PostgreSQL Extension

**pg_trgm (Trigram) v1.6:**
- Enables fast fuzzy text matching
- Powers the similarity() function for duplicate detection
- GIN indexes for efficient searching

## Verification Results

✅ **merge_audit table:** Created with 9 columns, RLS enabled
✅ **Functions:** 4 functions created and callable
✅ **Indexes:** 8 performance indexes created
✅ **Extension:** pg_trgm v1.6 enabled
✅ **Migration history:** Recorded successfully

## Usage Examples

### Finding Duplicates

```sql
-- Find duplicate contacts
SELECT * FROM find_duplicate_contacts(
  'org-id-here',  -- your organization ID
  50              -- max results
);

-- Find duplicate clients
SELECT * FROM find_duplicate_clients(
  'org-id-here',
  50
);
```

### Merging Records

```sql
-- Merge contacts
SELECT merge_contacts(
  'winner-contact-id',  -- keep this one
  'loser-contact-id'    -- delete this one
);

-- Merge clients
SELECT merge_clients(
  'winner-client-id',
  'loser-client-id'
);
```

### Viewing Audit History

```sql
-- See recent merges for your organization
SELECT
  merge_type,
  winner_id,
  loser_id,
  loser_data,
  merged_at,
  counts
FROM merge_audit
WHERE org_id = 'your-org-id'
ORDER BY merged_at DESC;
```

## Security Features

1. **Organization Validation:**
   - Both records must belong to same organization
   - Prevents accidental cross-org data leakage
   - Raises exception if organizations don't match

2. **Row-Level Security:**
   - merge_audit table has RLS enabled
   - Users can only see merges for their org
   - Automatic filtering by org_id

3. **Atomic Transactions:**
   - All operations wrapped in transactions
   - Any error rolls back entire merge
   - Data consistency guaranteed

4. **Audit Trail:**
   - Complete snapshot of deleted record
   - Transfer counts for all related records
   - Timestamp and user tracking
   - Permanent record for compliance

## USPAP Compliance

This migration meets USPAP requirements for:

- **Data Integrity:** Complete audit trail of all merges
- **Reproducibility:** loser_data contains full snapshot for reconstruction
- **Accountability:** Records who performed merge and when
- **Transparency:** All operations logged and queryable

## Next Steps

### For UI Integration

1. Create UI for duplicate detection:
   - Call `find_duplicate_contacts()` or `find_duplicate_clients()`
   - Display potential duplicates with similarity scores
   - Allow user to review and approve merges

2. Create merge confirmation dialog:
   - Show both records side-by-side
   - Preview what will be kept/merged
   - Require explicit user confirmation

3. Add merge history view:
   - Query `merge_audit` table
   - Show recent merges with undo option (if needed)
   - Display transfer counts and timestamps

### For Testing

Use the test script:
```bash
node scripts/test-merge-functions.js
```

This will:
- Find duplicate contacts and clients
- Test merge audit access
- Verify performance indexes
- Confirm all functions are working

## Rollback Plan

If needed, the migration can be rolled back by:

1. Dropping the functions:
```sql
DROP FUNCTION IF EXISTS merge_contacts(UUID, UUID);
DROP FUNCTION IF EXISTS merge_clients(UUID, UUID);
DROP FUNCTION IF EXISTS find_duplicate_contacts(UUID, INTEGER);
DROP FUNCTION IF EXISTS find_duplicate_clients(UUID, INTEGER);
```

2. Dropping the indexes:
```sql
DROP INDEX IF EXISTS idx_merge_audit_winner;
DROP INDEX IF EXISTS idx_merge_audit_loser;
DROP INDEX IF EXISTS idx_merge_audit_org;
DROP INDEX IF EXISTS idx_merge_audit_date;
DROP INDEX IF EXISTS idx_clients_company_name_trgm;
DROP INDEX IF EXISTS idx_clients_domain_lower;
DROP INDEX IF EXISTS idx_contacts_name_trgm;
DROP INDEX IF EXISTS idx_contacts_email_lower;
```

3. Dropping the table (WARNING: loses audit history):
```sql
DROP TABLE IF EXISTS merge_audit;
```

Note: The audit table should generally be preserved for compliance.

## Files Involved

- **Migration:** `C:\Users\shaug\source\repos\Shaftdog\Salesmod\supabase\migrations\20251114000000_add_merge_functions.sql`
- **Test Script:** `C:\Users\shaug\source\repos\Shaftdog\Salesmod\scripts\test-merge-functions.js`
- **This Report:** `C:\Users\shaug\source\repos\Shaftdog\Salesmod\MIGRATION-20251114-MERGE-FUNCTIONS.md`

## Performance Considerations

- **Similarity searches** use GIN indexes for fast trigram matching
- **Exact matches** use B-tree indexes for instant lookups
- **Merge operations** are transactional and atomic
- **RLS policies** add minimal overhead on audit queries

## Support

For issues or questions about this migration:
1. Check the test script output for diagnostic information
2. Query the merge_audit table to see what was merged
3. Review function comments in the migration file
4. Check PostgreSQL logs for any error details
