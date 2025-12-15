-- Make primary_contact column optional for clients table
-- This allows creating clients without specifying a primary contact upfront

ALTER TABLE public.clients
  ALTER COLUMN primary_contact DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.clients.primary_contact IS 'Optional primary contact name for the client. Can be null if contacts are managed separately.';
