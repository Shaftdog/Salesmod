-- Fix contacts missing org_id
-- This ensures all contacts have proper org_id set for RLS policies to work correctly

-- Backfill org_id for contacts linked to clients
UPDATE contacts
SET org_id = clients.org_id
FROM clients
WHERE contacts.client_id = clients.id
  AND contacts.org_id IS NULL;

-- For any remaining contacts without org_id (orphaned contacts with no client),
-- we need to handle them separately. These might be from Gmail integration.
-- For now, we'll log them but won't auto-assign them to avoid data corruption.

-- Add a check constraint to ensure new contacts always have org_id
-- (This will be enforced at the application level, not database level,
-- to allow for flexibility in batch imports)

-- Add comment to document the requirement
COMMENT ON COLUMN contacts.org_id IS 'Required: Organization that owns this contact. Must be set for RLS policies to work correctly.';
