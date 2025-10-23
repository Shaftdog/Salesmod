-- SIMPLEST FIX: Clear base_idempotency_key for all completed/failed jobs
-- This allows immediate re-imports without changing constraints

UPDATE migration_jobs
SET base_idempotency_key = NULL
WHERE status IN ('completed', 'failed', 'cancelled');

-- Verify (should show 0 completed jobs with base_idempotency_key)
SELECT COUNT(*) 
FROM migration_jobs 
WHERE status IN ('completed', 'failed', 'cancelled') 
AND base_idempotency_key IS NOT NULL;

