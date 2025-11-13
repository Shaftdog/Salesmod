-- Add org_id column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- Set org_id for all existing clients to Rod's user ID
UPDATE clients
SET org_id = 'bde00714-427d-4024-9fbd-6f895824f733'
WHERE org_id IS NULL;

-- Verify the update
SELECT COUNT(*) as total_clients,
       COUNT(org_id) as clients_with_org_id
FROM clients;
