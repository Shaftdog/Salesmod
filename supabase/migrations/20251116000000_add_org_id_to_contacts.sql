-- Add org_id to contacts table for Gmail integration
-- This allows contacts to be created directly from emails without requiring a client first

-- Make client_id nullable to allow contacts without clients (e.g., from emails)
ALTER TABLE contacts
  ALTER COLUMN client_id DROP NOT NULL;

-- Add org_id column to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Backfill org_id for existing contacts from their linked clients
UPDATE contacts
SET org_id = clients.org_id
FROM clients
WHERE contacts.client_id = clients.id
  AND contacts.org_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org_email ON contacts(org_id, email);

-- Add RLS policies for contacts (if not already present)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

-- Create new policies that work with both client_id and org_id
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (
    auth.uid() = org_id
    OR
    client_id IN (
      SELECT id FROM clients WHERE org_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    auth.uid() = org_id
    OR
    client_id IN (
      SELECT id FROM clients WHERE org_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (
    auth.uid() = org_id
    OR
    client_id IN (
      SELECT id FROM clients WHERE org_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (
    auth.uid() = org_id
    OR
    client_id IN (
      SELECT id FROM clients WHERE org_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON COLUMN contacts.org_id IS 'Organization that owns this contact. May exist without a client for Gmail-created contacts.';
COMMENT ON COLUMN contacts.client_id IS 'Client this contact belongs to. Nullable to support contacts created from emails before being assigned to a client.';
