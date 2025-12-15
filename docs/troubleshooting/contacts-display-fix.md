---
status: current
last_verified: 2025-11-18
updated_by: Claude Code
---

# Contacts Not Displaying in UI

## Problem

Contacts are visible to the chat agent but not appearing in the Contacts page UI.

**Example**: MoFin Loans has 5 contacts in the database:
- Appraisal Team (appraisal@mofinloans.com)
- Eric Nevarez (eric.nevarez@mofinloans.com)
- Orders (orders@mofinloans.com)
- Tom Hutchens (tom.hutchens@mofinloans.com)
- Underwriting (underwriting@mofinloans.com)

These contacts are visible when queried by the chat agent but do not appear in the Contacts page for the user.

## Root Cause

The issue is caused by **Row Level Security (RLS) policies** on the `contacts` table.

### RLS Policy Requirements

The `contacts` table has RLS policies that only allow users to view contacts where:

```sql
auth.uid() = org_id
OR
client_id IN (SELECT id FROM clients WHERE org_id = auth.uid())
```

### Why the Issue Occurs

1. **Chat Agent Uses Service Role**: The chat agent queries the database using `createServiceRoleClient()` which bypasses RLS policies, so it sees all contacts
2. **UI Uses Regular Client**: The Contacts page uses `createClient()` which is subject to RLS policies
3. **Missing org_id**: Some contacts (like the MoFin Loans contacts) are missing the `org_id` field
4. **RLS Filters Them Out**: Without a proper `org_id`, these contacts don't match the RLS policy and are filtered out in the UI

## Solution

The fix involves two parts:

### 1. Backfill Missing org_id (Migration)

Apply the migration to set `org_id` for existing contacts based on their linked client:

**Option A: Using SQL** (Supabase Dashboard)

```sql
-- Backfill org_id for contacts linked to clients
UPDATE contacts
SET org_id = clients.org_id
FROM clients
WHERE contacts.client_id = clients.id
  AND contacts.org_id IS NULL;
```

**Option B: Using CLI**

```bash
npm run db:push
```

**Option C: Using API Endpoint**

Make a POST request to `/api/admin/fix-contacts-org-id`:

```bash
curl -X POST http://localhost:9002/api/admin/fix-contacts-org-id
```

Or using the browser console:

```javascript
fetch('/api/admin/fix-contacts-org-id', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### 2. Prevent Future Issues (Code Fix)

The `useCreateContact` hook has been updated to automatically set `org_id` when creating new contacts:

```typescript
// Before (missing org_id)
const { data, error } = await supabase
  .from('contacts')
  .insert(contact)

// After (sets org_id automatically)
const { data: { user } } = await supabase.auth.getUser()
const contactData = {
  ...contact,
  org_id: contact.org_id || user.id,
}
const { data, error } = await supabase
  .from('contacts')
  .insert(contactData)
```

## Verification

After applying the migration:

1. **Refresh the Contacts page** in your browser
2. **Verify all contacts appear** including the MoFin Loans contacts
3. **Check the stats** at the top of the page show the correct total count
4. **Test search and filters** to ensure everything works correctly

### Database Verification

To verify the fix in the database:

```sql
-- Check for contacts still missing org_id
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.client_id,
  c.org_id,
  cl.company_name
FROM contacts c
LEFT JOIN clients cl ON c.client_id = cl.id
WHERE c.org_id IS NULL;
```

This should return no rows (or only orphaned contacts without a client).

## Related Files

- `supabase/migrations/20251116000000_add_org_id_to_contacts.sql` - Original RLS policies
- `supabase/migrations/20251118000000_fix_contacts_org_id.sql` - Backfill migration
- `src/hooks/use-contacts.ts` - Updated contact hooks
- `src/app/api/admin/fix-contacts-org-id/route.ts` - API endpoint to apply fix

## Prevention

To prevent this issue from occurring again:

1. ✅ **Code Fix Applied**: The `useCreateContact` hook now automatically sets `org_id`
2. ✅ **Migration Available**: Run the backfill migration for existing data
3. ⚠️ **Manual Imports**: When importing contacts via SQL or CSV, ensure `org_id` is set
4. ⚠️ **Third-party Integrations**: Ensure Gmail integration and other tools set `org_id` when creating contacts

## Technical Details

### RLS Policy Location

File: `supabase/migrations/20251116000000_add_org_id_to_contacts.sql`

```sql
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (
    auth.uid() = org_id
    OR
    client_id IN (
      SELECT id FROM clients WHERE org_id = auth.uid()
    )
  );
```

### Service Role vs Regular Client

```typescript
// Service Role (bypasses RLS) - used by chat agent
import { createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServiceRoleClient()

// Regular Client (subject to RLS) - used by UI
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

## Testing

After applying the fix:

```bash
# Run the automated tests
npm run test:e2e -- contacts
```

The tests should verify:
- All contacts display correctly
- Contact creation sets org_id
- RLS policies work as expected
- Search and filtering work properly
