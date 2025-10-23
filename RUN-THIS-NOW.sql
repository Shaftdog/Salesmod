-- CRITICAL: Run this SQL in Supabase SQL Editor NOW
-- This fixes the idempotency constraint preventing re-imports

-- Drop the problematic constraint
DROP INDEX IF EXISTS unique_base_idempotency_key_active CASCADE;
ALTER TABLE migration_jobs DROP CONSTRAINT IF EXISTS unique_base_idempotency_key CASCADE;

-- Create new partial index that only prevents simultaneous duplicates
CREATE UNIQUE INDEX unique_base_idempotency_key_active
ON migration_jobs(user_id, base_idempotency_key)
WHERE status IN ('pending', 'processing');

-- Verify it worked (should return 1 row)
SELECT indexname FROM pg_indexes 
WHERE tablename = 'migration_jobs' 
AND indexname = 'unique_base_idempotency_key_active';

