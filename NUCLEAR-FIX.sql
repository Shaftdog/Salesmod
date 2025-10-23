-- NUCLEAR OPTION: Remove ALL idempotency tracking temporarily
-- This will let imports work while we debug the address issue

-- Step 1: Remove the column entirely (this will cascade drop all constraints/indexes)
ALTER TABLE migration_jobs DROP COLUMN IF EXISTS base_idempotency_key CASCADE;

-- Step 2: Add it back without any constraints
ALTER TABLE migration_jobs ADD COLUMN base_idempotency_key TEXT;

-- Step 3: Create a simple index (no uniqueness)
CREATE INDEX IF NOT EXISTS idx_migration_jobs_base_idempotency 
ON migration_jobs(base_idempotency_key) 
WHERE base_idempotency_key IS NOT NULL;

-- Now you can import the same file as many times as you want
-- We'll add the constraint back later once we verify the address fix works

