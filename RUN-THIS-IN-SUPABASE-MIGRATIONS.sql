-- =============================================
-- COMBINED MIGRATIONS FOR SUPABASE DASHBOARD
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- =============================================

-- =============================================
-- MIGRATION 1: Data Migration System
-- =============================================

-- Add props JSONB columns with GIN indexes
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

-- Migration Jobs Table
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

CREATE INDEX IF NOT EXISTS idx_migration_jobs_user_id ON public.migration_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_status ON public.migration_jobs(status);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_created_at ON public.migration_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_idempotency ON public.migration_jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Migration Errors Table
CREATE TABLE IF NOT EXISTS public.migration_errors (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.migration_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  raw_data JSONB,
  error_message TEXT NOT NULL,
  field TEXT,
  matched_on TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_errors_job_id ON public.migration_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_migration_errors_created_at ON public.migration_errors(created_at DESC);

-- Enable RLS
ALTER TABLE public.migration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_errors ENABLE ROW LEVEL SECURITY;

-- Migration Jobs RLS Policies
DROP POLICY IF EXISTS "Users can view their own migration jobs" ON public.migration_jobs;
CREATE POLICY "Users can view their own migration jobs"
  ON public.migration_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create migration jobs" ON public.migration_jobs;
CREATE POLICY "Users can create migration jobs"
  ON public.migration_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own migration jobs" ON public.migration_jobs;
CREATE POLICY "Users can update their own migration jobs"
  ON public.migration_jobs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own migration jobs" ON public.migration_jobs;
CREATE POLICY "Users can delete their own migration jobs"
  ON public.migration_jobs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Migration Errors RLS Policies
DROP POLICY IF EXISTS "Users can view errors for their migration jobs" ON public.migration_errors;
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

DROP POLICY IF EXISTS "Users can create migration errors" ON public.migration_errors;
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

-- Helper Functions
CREATE OR REPLACE FUNCTION cleanup_old_migration_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.migration_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
  AND finished_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- MIGRATION 2: Contacts Management System
-- =============================================

-- Contact-Company Relationship Table
CREATE TABLE IF NOT EXISTS public.contact_companies (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'other',
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  reason_for_leaving TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, company_id, start_date)
);

-- Data Quality Constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_email_lower 
  ON public.contacts(lower(email)) 
  WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_domain_lower 
  ON public.clients(lower(domain)) 
  WHERE domain IS NOT NULL AND domain != '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_primary_contact_company
  ON public.contact_companies(contact_id) 
  WHERE is_primary = true AND end_date IS NULL;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contact_companies_contact 
  ON public.contact_companies(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_companies_company 
  ON public.contact_companies(company_id);

CREATE INDEX IF NOT EXISTS idx_contact_companies_current 
  ON public.contact_companies(contact_id, is_primary) 
  WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_companies_dates 
  ON public.contact_companies(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_contacts_client_id 
  ON public.contacts(client_id);

CREATE INDEX IF NOT EXISTS idx_contacts_is_primary 
  ON public.contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
  ON public.contacts(created_at DESC);

-- Full-Text Search
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS search tsvector;

CREATE INDEX IF NOT EXISTS idx_contacts_search 
  ON public.contacts USING gin(search);

-- Trigger for full-text search
CREATE OR REPLACE FUNCTION public.update_contact_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search := 
    setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.department, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_search_update ON public.contacts;

CREATE TRIGGER contacts_search_update
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_search();

-- Backfill search column
UPDATE public.contacts SET search = 
  setweight(to_tsvector('english', COALESCE(first_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(last_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(title, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(department, '')), 'D')
WHERE search IS NULL;

-- Contact Transfer Function
CREATE OR REPLACE FUNCTION public.transfer_contact_company(
  p_contact_id UUID,
  p_new_company_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_company_id UUID;
  v_contact_title TEXT;
  v_result JSONB;
BEGIN
  SELECT client_id, title INTO v_old_company_id, v_contact_title
  FROM public.contacts WHERE id = p_contact_id;

  IF v_old_company_id IS NOT NULL THEN
    UPDATE public.contact_companies
    SET 
      end_date = CURRENT_DATE,
      is_primary = false,
      reason_for_leaving = p_reason,
      updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND company_id = v_old_company_id
      AND end_date IS NULL;
  END IF;

  INSERT INTO public.contact_companies (
    contact_id, company_id, title, role, is_primary, start_date
  ) VALUES (
    p_contact_id, p_new_company_id, v_contact_title, 'employee', true, CURRENT_DATE
  )
  ON CONFLICT (contact_id, company_id, start_date) 
  DO UPDATE SET is_primary = true, end_date = NULL, updated_at = NOW();

  UPDATE public.contacts 
  SET client_id = p_new_company_id, updated_at = NOW()
  WHERE id = p_contact_id;

  v_result := jsonb_build_object(
    'success', true,
    'contact_id', p_contact_id,
    'old_company_id', v_old_company_id,
    'new_company_id', p_new_company_id,
    'transferred_at', CURRENT_DATE
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contact History Function
CREATE OR REPLACE FUNCTION public.get_contact_with_history(contact_uuid UUID)
RETURNS TABLE (
  contact_data JSONB,
  current_company JSONB,
  company_history JSONB,
  activity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(c.*) as contact_data,
    to_jsonb(cl.*) as current_company,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'company_id', cc.company_id,
          'company_name', cl2.company_name,
          'title', cc.title,
          'role', cc.role,
          'start_date', cc.start_date,
          'end_date', cc.end_date,
          'reason_for_leaving', cc.reason_for_leaving,
          'is_primary', cc.is_primary
        ) ORDER BY cc.start_date DESC
      )
      FROM public.contact_companies cc
      LEFT JOIN public.clients cl2 ON cc.company_id = cl2.id
      WHERE cc.contact_id = c.id
    ) as company_history,
    COUNT(a.id) as activity_count
  FROM public.contacts c
  LEFT JOIN public.clients cl ON c.client_id = cl.id
  LEFT JOIN public.activities a ON a.contact_id = c.id
  WHERE c.id = contact_uuid
  GROUP BY c.id, cl.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on contact_companies
ALTER TABLE public.contact_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view contact companies" ON public.contact_companies;
CREATE POLICY "Users can view contact companies"
  ON public.contact_companies FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert contact companies" ON public.contact_companies;
CREATE POLICY "Users can insert contact companies"
  ON public.contact_companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update contact companies" ON public.contact_companies;
CREATE POLICY "Users can update contact companies"
  ON public.contact_companies FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete contact companies" ON public.contact_companies;
CREATE POLICY "Users can delete contact companies"
  ON public.contact_companies FOR DELETE
  TO authenticated
  USING (true);

-- Data Integrity Triggers
CREATE TRIGGER update_contact_companies_updated_at
  BEFORE UPDATE ON public.contact_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_orphan_contacts()
RETURNS TRIGGER AS $$
DECLARE
  v_active_contacts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active_contacts
  FROM public.contact_companies
  WHERE company_id = OLD.id
    AND is_primary = true
    AND end_date IS NULL;

  IF v_active_contacts > 0 THEN
    RAISE EXCEPTION 'Cannot delete company: % active primary contact(s) exist. Transfer contacts first.', v_active_contacts;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_orphan_contacts_trigger ON public.clients;

CREATE TRIGGER prevent_orphan_contacts_trigger
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_orphan_contacts();

-- Contacts with Company View
CREATE OR REPLACE VIEW public.contacts_with_company AS
SELECT 
  c.*,
  cl.company_name as current_company_name,
  cl.id as current_company_id,
  (SELECT COUNT(*) FROM public.activities a WHERE a.contact_id = c.id) as activity_count,
  (SELECT MAX(a.created_at) FROM public.activities a WHERE a.contact_id = c.id) as last_activity_at
FROM public.contacts c
LEFT JOIN public.clients cl ON c.client_id = cl.id;

-- =============================================
-- DONE! All migrations applied successfully
-- =============================================

SELECT 'Migrations completed successfully!' as status;


