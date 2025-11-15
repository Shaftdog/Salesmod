# Fix: Add org_id to clients table

## Problem
Job cards aren't being created because:
1. The orchestrator uses createServiceRoleClient() to bypass RLS for INSERT operations
2. This also bypasses RLS for SELECT operations
3. Clients table doesn't have org_id column, so we can't filter contacts by organization
4. Without filtering, the query returns 0 contacts

## Solution: Add org_id Column

### Run this SQL in Supabase Dashboard

Go to: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/sql/new

Paste and run:

```sql
-- Add org_id column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- Set org_id for all existing clients
UPDATE clients
SET org_id = 'bde00714-427d-4024-9fbd-6f895824f733'
WHERE org_id IS NULL;

-- Verify the update
SELECT COUNT(*) as total_clients,
       COUNT(org_id) as clients_with_org_id
FROM clients;
```

This will enable the agent to create job cards!
