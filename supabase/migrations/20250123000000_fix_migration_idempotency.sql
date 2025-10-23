-- Fix migration idempotency race condition
-- Add unique constraint to prevent duplicate imports

-- Add a new column for the base idempotency key (without timestamp)
ALTER TABLE public.migration_jobs 
ADD COLUMN IF NOT EXISTS base_idempotency_key TEXT;

-- Create index for the base idempotency key
CREATE INDEX IF NOT EXISTS idx_migration_jobs_base_idempotency 
ON public.migration_jobs(base_idempotency_key) 
WHERE base_idempotency_key IS NOT NULL;

-- Add unique constraint to prevent duplicate imports of the same file/mapping
-- This will prevent race conditions at the database level
ALTER TABLE public.migration_jobs 
ADD CONSTRAINT unique_base_idempotency_key 
UNIQUE (user_id, base_idempotency_key);

-- Update existing records to populate base_idempotency_key
-- Extract the base key from existing idempotency_key values
UPDATE public.migration_jobs 
SET base_idempotency_key = REGEXP_REPLACE(idempotency_key, '_[0-9]+$', '')
WHERE base_idempotency_key IS NULL 
AND idempotency_key IS NOT NULL;

-- Add comment explaining the fix
COMMENT ON COLUMN public.migration_jobs.base_idempotency_key IS 'Base idempotency key without timestamp for duplicate prevention';
COMMENT ON CONSTRAINT unique_base_idempotency_key ON public.migration_jobs IS 'Prevents duplicate imports of the same file/mapping combination';
