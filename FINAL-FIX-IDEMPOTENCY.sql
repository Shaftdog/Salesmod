-- Complete fix for idempotency constraint issues
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing constraints and indexes related to base_idempotency_key
DROP INDEX IF EXISTS unique_base_idempotency_key_active CASCADE;
ALTER TABLE migration_jobs DROP CONSTRAINT IF EXISTS unique_base_idempotency_key CASCADE;

-- Step 2: Verify they're gone
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'migration_jobs' AND constraint_name LIKE '%idempotency%';

-- Step 3: Create the partial index that allows re-imports but prevents duplicates
-- This index ONLY prevents duplicates for pending/processing jobs, not completed/failed/cancelled
CREATE UNIQUE INDEX unique_base_idempotency_key_active
ON migration_jobs(user_id, base_idempotency_key)
WHERE status IN ('pending', 'processing');

-- Step 4: Verify the index was created
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'migration_jobs' AND indexname = 'unique_base_idempotency_key_active';

-- Done! Now you can:
-- 1. Re-import the same file after a previous import completes
-- 2. Still prevented from running duplicate imports simultaneously

