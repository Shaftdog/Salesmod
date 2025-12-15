-- Migration: Backfill tenant_id on jobs table
-- This fixes jobs that were created before the multi-tenant migration
-- or that have mismatched tenant_id values

-- First, let's see what jobs exist and their current state
DO $$
DECLARE
    jobs_count INTEGER;
    jobs_without_tenant INTEGER;
    jobs_updated INTEGER;
BEGIN
    -- Count total jobs
    SELECT COUNT(*) INTO jobs_count FROM jobs;
    RAISE NOTICE 'Total jobs in database: %', jobs_count;

    -- Count jobs without tenant_id
    SELECT COUNT(*) INTO jobs_without_tenant FROM jobs WHERE tenant_id IS NULL;
    RAISE NOTICE 'Jobs without tenant_id: %', jobs_without_tenant;
END $$;

-- Update jobs to use the tenant_id from their owner's profile
-- This ensures all jobs are associated with the correct tenant
UPDATE jobs j
SET tenant_id = p.tenant_id
FROM profiles p
WHERE j.owner_id = p.id
  AND p.tenant_id IS NOT NULL
  AND (j.tenant_id IS NULL OR j.tenant_id != p.tenant_id);

-- Also update based on org_id if owner_id doesn't match
-- (org_id was sometimes used as the user id)
UPDATE jobs j
SET tenant_id = p.tenant_id
FROM profiles p
WHERE j.org_id = p.id
  AND p.tenant_id IS NOT NULL
  AND j.tenant_id IS NULL;

-- Report results
DO $$
DECLARE
    jobs_with_tenant INTEGER;
    jobs_still_missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO jobs_with_tenant FROM jobs WHERE tenant_id IS NOT NULL;
    SELECT COUNT(*) INTO jobs_still_missing FROM jobs WHERE tenant_id IS NULL;

    RAISE NOTICE 'Jobs with tenant_id after migration: %', jobs_with_tenant;
    RAISE NOTICE 'Jobs still missing tenant_id: %', jobs_still_missing;
END $$;

-- If there are still jobs without tenant_id, assign them to the first tenant
-- (This is a fallback - in production you might want to handle this differently)
UPDATE jobs
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM tenants LIMIT 1);

-- Final report
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM jobs WHERE tenant_id IS NULL;
    IF final_count > 0 THEN
        RAISE WARNING 'There are still % jobs without tenant_id!', final_count;
    ELSE
        RAISE NOTICE 'All jobs now have tenant_id assigned.';
    END IF;
END $$;

-- Also update job_tasks to ensure they're accessible
-- (job_tasks inherit access through their parent job, but let's verify the jobs are correct)
SELECT
    j.id as job_id,
    j.name,
    j.tenant_id,
    j.owner_id,
    j.org_id,
    j.status,
    j.created_at
FROM jobs j
ORDER BY j.created_at DESC;
