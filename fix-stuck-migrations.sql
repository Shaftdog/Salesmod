-- Check stuck migration jobs (processing for more than 10 minutes)
SELECT 
  id,
  status,
  entity,
  created_at,
  started_at,
  finished_at,
  totals,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_since_created
FROM migration_jobs
WHERE status IN ('processing', 'pending')
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Mark stuck jobs as completed (if they have inserted records)
UPDATE migration_jobs
SET 
  status = 'completed',
  finished_at = NOW()
WHERE status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND (totals->>'inserted')::int > 0;

-- Mark stuck jobs as failed (if they have no inserted records)
UPDATE migration_jobs
SET 
  status = 'failed',
  finished_at = NOW(),
  error_message = 'Job timed out - no records processed'
WHERE status IN ('processing', 'pending')
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND COALESCE((totals->>'inserted')::int, 0) = 0;

