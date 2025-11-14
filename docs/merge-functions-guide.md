# Contact & Client Merge Functions - Developer Guide

## Quick Start

The merge system provides safe deduplication of contacts and clients with complete audit trails.

## Finding Duplicates

### Find Duplicate Contacts

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Get current user's org ID
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .single();

// Find duplicate contacts
const { data, error } = await supabase.rpc('find_duplicate_contacts', {
  p_org_id: profile.id,
  p_limit: 50
});

// Results:
// [
//   {
//     contact1_id: '...',
//     contact1_name: 'John Smith',
//     contact1_email: 'john@example.com',
//     contact2_id: '...',
//     contact2_name: 'John Smith',
//     contact2_email: 'john@example.com',
//     match_type: 'exact_email',
//     similarity_score: 1.0
//   }
// ]
```

### Find Duplicate Clients

```typescript
const { data, error } = await supabase.rpc('find_duplicate_clients', {
  p_org_id: profile.id,
  p_limit: 50
});

// Results have similar structure with client fields
```

## Merging Records

### Merge Contacts

```typescript
// Merge contact2 into contact1 (contact2 will be deleted)
const { data, error } = await supabase.rpc('merge_contacts', {
  p_winner_id: contact1.id,  // Keep this one
  p_loser_id: contact2.id    // Delete this one
});

if (error) {
  console.error('Merge failed:', error.message);
  return;
}

// Success response:
// {
//   success: true,
//   winner_id: '...',
//   loser_id: '...',
//   merged_at: '2025-11-14T20:30:00Z',
//   counts: {
//     activities: 5,
//     email_suppressions: 1,
//     email_notifications: 3,
//     kanban_cards: 2,
//     deals: 1,
//     tasks: 4,
//     cases: 0,
//     company_history: 2
//   }
// }
```

### Merge Clients

```typescript
const { data, error } = await supabase.rpc('merge_clients', {
  p_winner_id: client1.id,
  p_loser_id: client2.id
});

// Returns similar structure with client-specific counts:
// {
//   counts: {
//     contacts: 3,
//     company_history: 5,
//     orders: 2,
//     properties: 1,
//     activities: 4,
//     deals: 0,
//     tasks: 3,
//     cases: 1
//   }
// }
```

## Viewing Merge History

```typescript
const { data: mergeHistory } = await supabase
  .from('merge_audit')
  .select('*')
  .order('merged_at', { ascending: false })
  .limit(20);

// Each record contains:
// {
//   id: '...',
//   merge_type: 'contact',
//   winner_id: '...',
//   loser_id: '...',
//   loser_data: { /* complete snapshot of deleted record */ },
//   merged_by: 'user-id',
//   merged_at: '2025-11-14T20:30:00Z',
//   counts: { /* transfer counts */ },
//   org_id: '...'
// }
```

## What Gets Merged

### Contact Merge

**Transferred to Winner:**
- All activities
- Email suppressions (duplicates removed)
- Email notifications
- Kanban cards
- Deals
- Tasks
- Cases
- Contact-company history

**Merged Data:**
- Tags (combined, duplicates removed)
- Notes (concatenated with separator)
- Email (loser's used if winner is missing)
- Phone (loser's used if winner is missing)
- Mobile (loser's used if winner is missing)

**Deleted:**
- Loser contact record
- Snapshot saved in merge_audit

### Client Merge

**Transferred to Winner:**
- All contacts
- Contact-company history
- Orders
- Properties
- Activities
- Deals
- Tasks
- Cases

**Merged Data:**
- Domain (loser's used if winner is missing)
- Phone (loser's used if winner is missing)
- Address fields (loser's used if winner is missing)

**Deleted:**
- Loser client record
- Snapshot saved in merge_audit

## Error Handling

The merge functions will raise exceptions if:

1. **Same ID:** Cannot merge a record with itself
2. **Not Found:** Winner or loser doesn't exist
3. **Different Orgs:** Records belong to different organizations
4. **Constraint Violation:** Any database constraint would be violated

All errors trigger automatic rollback - no partial merges.

```typescript
try {
  const { data, error } = await supabase.rpc('merge_contacts', {
    p_winner_id: winnerId,
    p_loser_id: loserId
  });

  if (error) {
    if (error.message.includes('different organizations')) {
      alert('Cannot merge contacts from different organizations');
    } else if (error.message.includes('not found')) {
      alert('One or both contacts not found');
    } else {
      alert('Merge failed: ' + error.message);
    }
    return;
  }

  // Success
  alert(`Merged successfully! Transferred ${data.counts.activities} activities.`);
} catch (err) {
  console.error('Unexpected error:', err);
}
```

## UI Component Example

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DuplicateContactsFinder() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

  const findDuplicates = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    const { data, error } = await supabase.rpc('find_duplicate_contacts', {
      p_org_id: profile.id,
      p_limit: 50
    });

    if (!error && data) {
      setDuplicates(data);
    }
    setLoading(false);
  };

  const mergePair = async (winnerId: string, loserId: string) => {
    const supabase = createClient();

    const confirmed = confirm(
      'Are you sure you want to merge these contacts? This cannot be undone.'
    );

    if (!confirmed) return;

    const { data, error } = await supabase.rpc('merge_contacts', {
      p_winner_id: winnerId,
      p_loser_id: loserId
    });

    if (error) {
      alert('Merge failed: ' + error.message);
      return;
    }

    alert(`Merged successfully! Transferred ${data.counts.activities} activities.`);
    // Refresh the list
    await findDuplicates();
  };

  return (
    <div>
      <button onClick={findDuplicates} disabled={loading}>
        {loading ? 'Searching...' : 'Find Duplicates'}
      </button>

      {duplicates.map((dup, i) => (
        <div key={i} className="border p-4 my-2">
          <div className="flex justify-between">
            <div>
              <h3>{dup.contact1_name}</h3>
              <p>{dup.contact1_email}</p>
            </div>
            <div>vs</div>
            <div>
              <h3>{dup.contact2_name}</h3>
              <p>{dup.contact2_email}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm">
              {dup.match_type} (similarity: {dup.similarity_score})
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => mergePair(dup.contact1_id, dup.contact2_id)}>
              Keep Left
            </button>
            <button onClick={() => mergePair(dup.contact2_id, dup.contact1_id)}>
              Keep Right
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Security Notes

1. **Organization Isolation:**
   - Both records must belong to same organization
   - RLS policies enforce org-level access
   - No cross-org data leakage possible

2. **Audit Trail:**
   - All merges logged in merge_audit table
   - Complete snapshot of deleted record
   - Can be used to reconstruct merge history

3. **Transaction Safety:**
   - All operations are atomic
   - Any error rolls back entire merge
   - No partial or inconsistent states

## Performance Tips

1. **Finding Duplicates:**
   - Use reasonable limits (50-100)
   - Similarity searches use GIN indexes
   - Very fast even with large datasets

2. **Merging:**
   - Operations are transactional
   - Speed depends on number of related records
   - Typically completes in < 1 second

3. **Audit Queries:**
   - Filtered by org_id automatically
   - Use pagination for large histories
   - Indexes support fast chronological queries

## Testing

Use the test script to verify functionality:

```bash
node scripts/test-merge-functions.js
```

This will:
- Test duplicate finding
- Verify security settings
- Check index performance
- Confirm all functions work

## Common Patterns

### Batch Duplicate Resolution

```typescript
const { data: duplicates } = await supabase.rpc('find_duplicate_contacts', {
  p_org_id: orgId,
  p_limit: 100
});

// Let user review and approve each merge
for (const dup of duplicates) {
  const choice = await askUserWhichToKeep(dup);
  if (choice) {
    await supabase.rpc('merge_contacts', {
      p_winner_id: choice.winnerId,
      p_loser_id: choice.loserId
    });
  }
}
```

### Scheduled Duplicate Detection

```typescript
// Run weekly to find new duplicates
async function findNewDuplicates() {
  const { data: contacts } = await supabase.rpc('find_duplicate_contacts', {
    p_org_id: orgId,
    p_limit: 50
  });

  const { data: clients } = await supabase.rpc('find_duplicate_clients', {
    p_org_id: orgId,
    p_limit: 50
  });

  // Send notification to admin
  if (contacts.length > 0 || clients.length > 0) {
    await notifyAdmin({
      contactDuplicates: contacts.length,
      clientDuplicates: clients.length
    });
  }
}
```

### Undo Last Merge (Advanced)

```typescript
// Get the most recent merge
const { data: lastMerge } = await supabase
  .from('merge_audit')
  .select('*')
  .order('merged_at', { ascending: false })
  .limit(1)
  .single();

// Restore the deleted record (requires custom logic)
// This is complex - loser_data contains the snapshot
// but you'd need to manually recreate and re-link everything
```

## Support

For questions or issues:
- Review the migration report: `MIGRATION-20251114-MERGE-FUNCTIONS.md`
- Check function source: `supabase/migrations/20251114000000_add_merge_functions.sql`
- Run tests: `node scripts/test-merge-functions.js`
