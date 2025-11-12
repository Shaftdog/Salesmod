-- Add org_id column to clients table
-- This allows clients to be properly scoped to organizations

-- Add org_id column (nullable initially)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES auth.users(id);

-- Populate org_id from existing properties
-- Logic: Set client.org_id to the org_id of any property that references this client
UPDATE clients c
SET org_id = (
  SELECT p.org_id
  FROM properties p
  WHERE p.client_id = c.id
  LIMIT 1
)
WHERE c.org_id IS NULL;

-- If any clients still don't have org_id, set to first user (fallback)
UPDATE clients c
SET org_id = (SELECT id FROM auth.users LIMIT 1)
WHERE c.org_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE clients
ALTER COLUMN org_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- Update RLS policies to use org_id
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = org_id);

DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
CREATE POLICY "Users can create their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = org_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = org_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = org_id);

-- Create function to auto-set org_id on insert
CREATE OR REPLACE FUNCTION set_client_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_client_org_id ON clients;
CREATE TRIGGER trigger_set_client_org_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_client_org_id();

COMMENT ON COLUMN clients.org_id IS 'Organization/user that owns this client';
