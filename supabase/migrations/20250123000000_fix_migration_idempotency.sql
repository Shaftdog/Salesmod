-- Fix migration idempotency race condition
-- Add unique constraint to prevent duplicate imports

-- Add a new column for the base idempotency key (without timestamp)
ALTER TABLE public.migration_jobs 
ADD COLUMN IF NOT EXISTS base_idempotency_key TEXT;

-- Update existing records to populate base_idempotency_key
-- Extract the base key from existing idempotency_key values
UPDATE public.migration_jobs 
SET base_idempotency_key = REGEXP_REPLACE(idempotency_key, '_[0-9]+$', '')
WHERE base_idempotency_key IS NULL 
AND idempotency_key IS NOT NULL;

-- Mark duplicate jobs as 'cancelled' to clean up the data
-- Keep only the first job for each base_idempotency_key
WITH duplicates AS (
  SELECT 
    id,
    base_idempotency_key,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, base_idempotency_key 
      ORDER BY created_at ASC
    ) as rn
  FROM public.migration_jobs
  WHERE base_idempotency_key IS NOT NULL
)
UPDATE public.migration_jobs
SET status = 'cancelled',
    error_message = 'Duplicate job - cancelled during migration cleanup'
FROM duplicates
WHERE migration_jobs.id = duplicates.id
  AND duplicates.rn > 1;

-- Create index for the base idempotency key
CREATE INDEX IF NOT EXISTS idx_migration_jobs_base_idempotency 
ON public.migration_jobs(base_idempotency_key) 
WHERE base_idempotency_key IS NOT NULL;

-- Add unique constraint to prevent duplicate imports of the same file/mapping
-- This will prevent race conditions at the database level
-- Only applies to non-cancelled jobs
CREATE UNIQUE INDEX IF NOT EXISTS unique_base_idempotency_key_active
ON public.migration_jobs(user_id, base_idempotency_key)
WHERE status != 'cancelled';

-- Add comment explaining the fix
COMMENT ON COLUMN public.migration_jobs.base_idempotency_key IS 'Base idempotency key without timestamp for duplicate prevention';
COMMENT ON INDEX unique_base_idempotency_key_active IS 'Prevents duplicate imports of the same file/mapping combination (excluding cancelled jobs)';
