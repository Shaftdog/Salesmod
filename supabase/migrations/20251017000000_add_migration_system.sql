-- =============================================
-- Migration System - Database Schema
-- Adds support for data migrations from Asana, HubSpot, etc.
-- =============================================

-- =============================================
-- 1. Add props JSONB columns with GIN indexes
-- =============================================

-- Add props columns for flexible field storage
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '{}'::jsonb;

-- Add migration-specific columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS domain TEXT;

-- Create GIN indexes for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_contacts_props ON public.contacts USING gin (props);
CREATE INDEX IF NOT EXISTS idx_clients_props ON public.clients USING gin (props);
CREATE INDEX IF NOT EXISTS idx_orders_props ON public.orders USING gin (props);

-- Create indexes for migration columns
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_clients_domain ON public.clients(domain);

-- Create functional index for case-insensitive email lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower ON public.contacts(lower(email));

-- =============================================
-- 2. Migration Jobs Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('asana', 'hubspot', 'csv', 'other')),
  entity TEXT NOT NULL CHECK (entity IN ('orders', 'contacts', 'clients', 'deals', 'tasks')),
  mode TEXT NOT NULL DEFAULT 'csv' CHECK (mode IN ('csv', 'api')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  totals JSONB DEFAULT '{}'::jsonb,
  mapping JSONB NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create indexes for migration_jobs
CREATE INDEX IF NOT EXISTS idx_migration_jobs_user_id ON public.migration_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_status ON public.migration_jobs(status);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_created_at ON public.migration_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_idempotency ON public.migration_jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- =============================================
-- 3. Migration Errors Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.migration_errors (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.migration_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  raw_data JSONB,
  error_message TEXT NOT NULL,
  field TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast error lookups
CREATE INDEX IF NOT EXISTS idx_migration_errors_job_id ON public.migration_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_migration_errors_created_at ON public.migration_errors(created_at DESC);

-- =============================================
-- 4. Row Level Security (RLS)
-- =============================================

-- Enable RLS on migration tables
ALTER TABLE public.migration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_errors ENABLE ROW LEVEL SECURITY;

-- Migration Jobs Policies
CREATE POLICY "Users can view their own migration jobs"
  ON public.migration_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create migration jobs"
  ON public.migration_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own migration jobs"
  ON public.migration_jobs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own migration jobs"
  ON public.migration_jobs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Migration Errors Policies (via job ownership)
CREATE POLICY "Users can view errors for their migration jobs"
  ON public.migration_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.migration_jobs
      WHERE migration_jobs.id = migration_errors.job_id
      AND migration_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create migration errors"
  ON public.migration_errors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.migration_jobs
      WHERE migration_jobs.id = migration_errors.job_id
      AND migration_jobs.user_id = auth.uid()
    )
  );

-- =============================================
-- 5. Helper Functions
-- =============================================

-- Function to clean up old migration jobs (optional, for housekeeping)
CREATE OR REPLACE FUNCTION cleanup_old_migration_jobs()
RETURNS void AS $$
BEGIN
  -- Delete completed jobs older than 90 days
  DELETE FROM public.migration_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
  AND finished_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get migration job statistics
CREATE OR REPLACE FUNCTION get_migration_stats(job_uuid UUID)
RETURNS TABLE (
  total_errors BIGINT,
  unique_error_types BIGINT,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_errors,
    COUNT(DISTINCT error_message)::BIGINT as unique_error_types,
    (finished_at - started_at) as avg_processing_time
  FROM public.migration_jobs j
  LEFT JOIN public.migration_errors e ON j.id = e.job_id
  WHERE j.id = job_uuid
  GROUP BY j.id, j.finished_at, j.started_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.migration_jobs IS 'Tracks data migration jobs from external sources like Asana and HubSpot';
COMMENT ON TABLE public.migration_errors IS 'Stores detailed error information for failed migration records';

COMMENT ON COLUMN public.orders.props IS 'Flexible JSONB storage for unmapped fields from imports';
COMMENT ON COLUMN public.contacts.props IS 'Flexible JSONB storage for unmapped fields from imports';
COMMENT ON COLUMN public.clients.props IS 'Flexible JSONB storage for unmapped fields from imports';
COMMENT ON COLUMN public.orders.external_id IS 'External system ID (e.g., Asana gid, HubSpot object ID)';
COMMENT ON COLUMN public.orders.source IS 'Source system of the order (asana, hubspot, manual, etc.)';
COMMENT ON COLUMN public.clients.domain IS 'Email domain for matching contacts to clients';

COMMENT ON COLUMN public.migration_jobs.idempotency_key IS 'Prevents duplicate imports of the same file/mapping combination';
COMMENT ON COLUMN public.migration_jobs.totals IS 'JSON object: {total, inserted, updated, skipped, errors}';
COMMENT ON COLUMN public.migration_jobs.mapping IS 'Complete field mapping configuration used for this migration';

