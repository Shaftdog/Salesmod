---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Database Migration Report - Contact/Client Merge Functions

**Migration File:** `20251114000000_add_merge_functions.sql`
**Applied:** November 14, 2025
**Status:** ✅ SUCCESS

## Summary

Successfully applied the contact and client merge functions migration with critical security fixes and performance optimizations.

## Migration Contents

### 1. Database Functions Created (4)

All functions created with **SECURITY DEFINER** privilege and auth.uid() validation:

1. **merge_contacts(p_winner_id UUID, p_loser_id UUID)**
   - Merges two contacts into one canonical contact
   - Re-links all dependent records (activities, suppressions, notifications, cards, deals, tasks, cases)
   - Merges tags and notes
   - Creates audit trail
   - Validates organization ownership
   - Returns: JSONB with merge results and counts

2. **merge_clients(p_winner_id UUID, p_loser_id UUID)**
   - Merges two clients (companies) into one
   - Transfers contacts, orders, activities, deals, tasks, cases
   - Updates contact-company history
   - Creates audit trail
   - Validates organization ownership
   - Returns: JSONB with merge results and counts

3. **find_duplicate_contacts(p_org_id UUID, p_limit INTEGER DEFAULT 50)**
   - Finds potential duplicate contacts based on:
     - Exact email matches
     - Similar names within same client (>60% similarity)
   - Excludes system placeholders (names starting with '[')
   - Returns: Table with match details and similarity scores

4. **find_duplicate_clients(p_org_id UUID, p_limit INTEGER DEFAULT 50)**
   - Finds potential duplicate clients based on:
     - Exact domain matches
     - Similar company names (>70% similarity)
   - Excludes system placeholders (names starting with '[')
   - Returns: Table with match details and similarity scores

### 2. Audit Table Created

**Table:** `merge_audit`

**Columns:**
- `id` (UUID, PRIMARY KEY, auto-generated)
- `merge_type` (TEXT, NOT NULL) - 'contact' or 'client'
- `winner_id` (UUID, NOT NULL) - ID of kept record
- `loser_id` (UUID, NOT NULL) - ID of deleted record
- `loser_data` (JSONB, NOT NULL) - Complete snapshot before deletion
- `merged_by` (UUID) - References auth.users(id)
- `merged_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `counts` (JSONB) - Counts of updated records
- `org_id` (UUID, NOT NULL) - Organization for filtering

**Security:**
- Row Level Security (RLS) enabled
- Policy: `select_merge_audit` - Users can only view their organization's audits

**USPAP Compliance:**
- Maintains complete audit trail for all merge operations
- Records snapshot of deleted data
- Tracks who performed the merge and when

### 3. Performance Indexes Created (22 total)

#### Merge Audit Indexes (4)
- `idx_merge_audit_winner` - Query by merge type and winner ID
- `idx_merge_audit_loser` - Query by merge type and loser ID
- `idx_merge_audit_org` - Filter by organization
- `idx_merge_audit_date` - Sort by date (DESC)

#### Contact Foreign Key Indexes (7)
- `idx_activities_contact_id` - Activities by contact
- `idx_email_suppressions_contact_id` - Email suppressions by contact
- `idx_email_notifications_contact_id` - Email notifications by contact
- `idx_kanban_cards_contact_id` - Kanban cards by contact
- `idx_deals_contact_id` - Deals by contact
- `idx_tasks_contact_id` - Tasks by contact
- `idx_cases_contact_id` - Cases by contact

#### Client Foreign Key Indexes (7)
- `idx_contacts_client_id` - Contacts by client
- `idx_orders_client_id` - Orders by client
- `idx_activities_client_id` - Activities by client
- `idx_deals_client_id` - Deals by client
- `idx_tasks_client_id` - Tasks by client
- `idx_cases_client_id` - Cases by client
- `idx_contact_companies_company_id` - Contact-company history

#### Similarity Search Indexes (4)
- `idx_clients_company_name_trgm` - GIN index for company name similarity
- `idx_clients_domain_lower` - Exact domain matching
- `idx_contacts_name_trgm` - GIN index for contact name similarity
- `idx_contacts_email_lower` - Exact email matching

### 4. Extension Enabled

**pg_trgm** (v1.6) - PostgreSQL trigram extension
- Enables similarity() function for fuzzy text matching
- Powers duplicate detection algorithms
- Used by GIN indexes for efficient similarity searches

## Security Features

### Authentication & Authorization
✅ All SECURITY DEFINER functions validate `auth.uid()`
✅ Organization ownership verified before any operations
✅ Prevents cross-organization data access
✅ RLS policy on audit table restricts viewing to own org

### Data Protection
✅ Complete audit trail for USPAP compliance
✅ Snapshot of deleted records preserved
✅ Automatic transaction rollback on errors
✅ Comprehensive error handling with context

### Query Safety
✅ All indexes use IF NOT EXISTS (safe re-running)
✅ Functions use CREATE OR REPLACE (safe updates)
✅ Proper handling of unique constraints
✅ Foreign key validation

## Performance Optimizations

### Index Strategy
- All foreign key columns used in merge operations are indexed
- Partial indexes with WHERE clauses reduce index size
- GIN indexes for full-text similarity searches
- Proper index ordering for common query patterns

### Expected Performance Impact
- **Contact merge**: ~50-200ms for typical contact (depends on related records)
- **Client merge**: ~100-500ms for typical client (depends on contacts and orders)
- **Duplicate detection**: ~10-50ms for 50 results (with indexes)
- **Merge audits query**: <10ms (indexed by org and date)

## Migration Statistics

- **Functions**: 4 created
- **Tables**: 1 created (merge_audit)
- **Indexes**: 22 created
- **Extensions**: 1 enabled (pg_trgm)
- **RLS Policies**: 1 created
- **Total Migration Size**: ~27KB SQL

## Testing Recommendations

### Unit Tests Needed
1. Test `merge_contacts` with various scenarios:
   - Basic merge with no related records
   - Merge with activities, deals, tasks
   - Merge with email suppressions (unique constraint)
   - Merge contacts from different orgs (should fail)
   - Merge same contact (should fail)
   - Unauthorized user attempt (should fail)

2. Test `merge_clients` with various scenarios:
   - Basic merge with no contacts
   - Merge with contacts, orders, deals
   - Merge clients from different orgs (should fail)
   - Merge same client (should fail)
   - Unauthorized user attempt (should fail)

3. Test duplicate detection:
   - Find exact email matches
   - Find similar names
   - Verify system placeholders excluded
   - Test pagination limits

4. Test audit trail:
   - Verify audit records created
   - Verify loser data snapshot complete
   - Verify RLS policy enforcement
   - Test querying audit history

### Integration Tests Needed
1. Test merge through API endpoints
2. Test duplicate detection UI workflow
3. Test merge confirmation UI
4. Test audit log viewing
5. Test error handling and rollback

## API Usage Examples

### Merge Contacts
```sql
SELECT public.merge_contacts(
  'winner-contact-uuid'::uuid,
  'loser-contact-uuid'::uuid
);
```

### Merge Clients
```sql
SELECT public.merge_clients(
  'winner-client-uuid'::uuid,
  'loser-client-uuid'::uuid
);
```

### Find Duplicate Contacts
```sql
SELECT * FROM public.find_duplicate_contacts(
  'org-uuid'::uuid,
  50  -- limit
);
```

### Find Duplicate Clients
```sql
SELECT * FROM public.find_duplicate_clients(
  'org-uuid'::uuid,
  50  -- limit
);
```

### View Merge Audit Log
```sql
SELECT * FROM public.merge_audit
WHERE org_id = auth.uid()
  AND merge_type = 'contact'
ORDER BY merged_at DESC
LIMIT 100;
```

## Known Limitations

1. **Properties Transfer**: Properties are NOT transferred during client merge
   - Reason: Properties.org_id references organization (user), not client
   - Fix: Add client_id column to properties table if needed
   - Current behavior: Properties remain with original organization

2. **Duplicate Contact History**: Duplicate contact-company history entries are deleted
   - Reason: Prevents constraint violations
   - Note: Audit log preserves all deleted data

3. **Transaction Pooler**: Migration applied via pooler (session mode)
   - Note: Some DDL operations may have limitations
   - Solution: Use direct connection if issues arise

## Rollback Plan

If migration needs to be rolled back:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS public.merge_contacts;
DROP FUNCTION IF EXISTS public.merge_clients;
DROP FUNCTION IF EXISTS public.find_duplicate_contacts;
DROP FUNCTION IF EXISTS public.find_duplicate_clients;

-- Drop indexes (non-critical, can keep for performance)
DROP INDEX IF EXISTS public.idx_merge_audit_winner;
DROP INDEX IF EXISTS public.idx_merge_audit_loser;
DROP INDEX IF EXISTS public.idx_merge_audit_org;
DROP INDEX IF EXISTS public.idx_merge_audit_date;
-- ... (drop all 22 indexes if needed)

-- Drop audit table
DROP TABLE IF EXISTS public.merge_audit;

-- Note: Keep pg_trgm extension (used by other features)
```

## Next Steps

1. ✅ Migration applied successfully
2. ⬜ Create API endpoints for merge operations
3. ⬜ Build duplicate detection UI
4. ⬜ Create merge confirmation dialog
5. ⬜ Add audit log viewer page
6. ⬜ Write unit tests for merge functions
7. ⬜ Write integration tests for API
8. ⬜ Add E2E tests for UI workflow
9. ⬜ Update documentation
10. ⬜ Monitor performance in production

## Conclusion

The migration has been successfully applied with all security features and performance optimizations in place. All 4 functions are created with SECURITY DEFINER privileges and proper auth.uid() validation. The merge_audit table provides USPAP-compliant audit trails, and 22 performance indexes ensure efficient merge operations.

**Status:** Ready for API and UI implementation.
