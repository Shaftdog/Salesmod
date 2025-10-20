-- =============================================
-- Contacts Management System - Database Schema
-- Production-ready relational design with full-text search
-- =============================================

-- =============================================
-- 1. Contact-Company Relationship Table
-- =============================================

-- Track complete history of contact's employment/relationships
CREATE TABLE IF NOT EXISTS public.contact_companies (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'other', -- 'employee', 'contractor', 'partner', 'advisor', 'other'
  title TEXT, -- Job title at this company
  is_primary BOOLEAN DEFAULT false,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL = current employment
  reason_for_leaving TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, company_id, start_date)
);

-- =============================================
-- 2. Data Quality Constraints
-- =============================================

-- Enforce unique email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_email_lower 
  ON public.contacts(lower(email)) 
  WHERE email IS NOT NULL AND email != '';

-- Enforce unique domain for companies (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_domain_lower 
  ON public.clients(lower(domain)) 
  WHERE domain IS NOT NULL AND domain != '';

-- Enforce only ONE primary company per contact at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_primary_contact_company
  ON public.contact_companies(contact_id) 
  WHERE is_primary = true AND end_date IS NULL;

-- =============================================
-- 3. Performance Indexes
-- =============================================

-- Contact-company relationship indexes
CREATE INDEX IF NOT EXISTS idx_contact_companies_contact 
  ON public.contact_companies(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_companies_company 
  ON public.contact_companies(company_id);

CREATE INDEX IF NOT EXISTS idx_contact_companies_current 
  ON public.contact_companies(contact_id, is_primary) 
  WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_companies_dates 
  ON public.contact_companies(start_date, end_date);

-- Existing contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_client_id 
  ON public.contacts(client_id);

CREATE INDEX IF NOT EXISTS idx_contacts_is_primary 
  ON public.contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
  ON public.contacts(created_at DESC);

-- =============================================
-- 4. Full-Text Search
-- =============================================

-- Add search column for fast full-text queries
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS search tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_contacts_search 
  ON public.contacts USING gin(search);

-- Trigger to keep search column updated
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

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS contacts_search_update ON public.contacts;

CREATE TRIGGER contacts_search_update
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_search();

-- Backfill search column for existing contacts
UPDATE public.contacts SET search = 
  setweight(to_tsvector('english', COALESCE(first_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(last_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(title, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(department, '')), 'D')
WHERE search IS NULL;

-- =============================================
-- 5. Helper Functions
-- =============================================

-- Function to get contact with full company history
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

-- Function to transfer contact to new company (handles history atomically)
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
  -- Get current company and title
  SELECT client_id, title INTO v_old_company_id, v_contact_title
  FROM public.contacts WHERE id = p_contact_id;

  -- Close out old company relationship if exists
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

  -- Create new company relationship
  INSERT INTO public.contact_companies (
    contact_id, 
    company_id, 
    title, 
    role, 
    is_primary, 
    start_date
  ) VALUES (
    p_contact_id, 
    p_new_company_id, 
    v_contact_title, 
    'employee', 
    true, 
    CURRENT_DATE
  )
  ON CONFLICT (contact_id, company_id, start_date) 
  DO UPDATE SET
    is_primary = true,
    end_date = NULL,
    updated_at = NOW();

  -- Update current company on contact
  UPDATE public.contacts 
  SET 
    client_id = p_new_company_id,
    updated_at = NOW()
  WHERE id = p_contact_id;

  -- Build result
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

-- =============================================
-- 6. Row Level Security (RLS)
-- =============================================

-- Enable RLS on contact_companies table
ALTER TABLE public.contact_companies ENABLE ROW LEVEL SECURITY;

-- Users can view contact-company relationships for their contacts
CREATE POLICY "Users can view contact companies"
  ON public.contact_companies FOR SELECT
  TO authenticated
  USING (true); -- Assuming contacts already have RLS

-- Users can manage contact-company relationships
CREATE POLICY "Users can insert contact companies"
  ON public.contact_companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contact companies"
  ON public.contact_companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete contact companies"
  ON public.contact_companies FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 7. Data Integrity Triggers
-- =============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_contact_companies_updated_at
  BEFORE UPDATE ON public.contact_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Prevent deleting a company if it has active primary contacts
CREATE OR REPLACE FUNCTION public.prevent_orphan_contacts()
RETURNS TRIGGER AS $$
DECLARE
  v_active_contacts INTEGER;
BEGIN
  -- Count active primary contacts for this company
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

-- =============================================
-- 8. Views for Common Queries
-- =============================================

-- View: Contacts with current company info
CREATE OR REPLACE VIEW public.contacts_with_company AS
SELECT 
  c.*,
  cl.company_name as current_company_name,
  cl.id as current_company_id,
  (
    SELECT COUNT(*) 
    FROM public.activities a 
    WHERE a.contact_id = c.id
  ) as activity_count,
  (
    SELECT MAX(a.created_at) 
    FROM public.activities a 
    WHERE a.contact_id = c.id
  ) as last_activity_at
FROM public.contacts c
LEFT JOIN public.clients cl ON c.client_id = cl.id;

-- =============================================
-- 9. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.contact_companies IS 'Tracks complete employment/relationship history between contacts and companies';
COMMENT ON COLUMN public.contact_companies.is_primary IS 'Only one primary company per contact allowed at any time (enforced by unique index)';
COMMENT ON COLUMN public.contact_companies.end_date IS 'NULL means current employment/relationship';
COMMENT ON COLUMN public.contacts.search IS 'Full-text search vector (auto-updated via trigger)';

COMMENT ON FUNCTION public.transfer_contact_company IS 'Atomically transfers a contact to a new company while preserving history';
COMMENT ON FUNCTION public.get_contact_with_history IS 'Retrieves contact with full company history and activity count';


