-- ==============================================
-- ADD CLIENT TYPE FIELD
-- Allows clients table to handle both companies and individuals
-- ==============================================

-- Add client_type column
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'company' 
  CHECK (client_type IN ('company', 'individual'));

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_clients_client_type 
  ON public.clients(client_type);

-- Add documentation
COMMENT ON COLUMN public.clients.client_type IS 
  'Type of client: company (business entity with employees) or individual (sole proprietor, independent professional). 
  For individuals, company_name contains their full name. This allows the clients table to serve as the primary billing entity for both corporate and individual customers.';

-- ==============================================
-- BACKFILL EXISTING RECORDS
-- ==============================================

-- Auto-detect individuals based on naming patterns
-- If company_name looks like "FirstName LastName" (2-3 words, no business suffixes/keywords), mark as individual
UPDATE public.clients
SET client_type = 'individual'
WHERE client_type = 'company'
  AND (
    -- Two-word names without ANY business indicators
    (array_length(string_to_array(company_name, ' '), 1) = 2
     AND company_name !~* '(LLC|Inc|Corp|Ltd|Limited|Company|Co|Group|Partners|Associates|Services|Solutions|Holdings|Enterprises|Properties|Investments|Management|Consulting|Advisors|Capital|Ventures|Appraisal|Valuation|Analytics|AMC|Real Estate|Realty|Lending|Mortgage|Finance|Financial|Law|Legal|Title|Settlement|VMS|Network|National|Global|Agency|Firm)')
    OR
    -- Three-word names (e.g., "John Michael Smith") without business keywords
    (array_length(string_to_array(company_name, ' '), 1) = 3
     AND company_name !~* '(LLC|Inc|Corp|Ltd|Limited|Company|Co|Group|Partners|Associates|Services|Solutions|Holdings|Enterprises|Properties|Investments|Management|Consulting|Advisors|Capital|Ventures|Appraisal|Valuation|Analytics|AMC|Real Estate|Realty|Lending|Mortgage|Finance|Financial|Law|Legal|Title|Settlement|VMS|Network|National|Global|Agency|Firm)')
  )
  -- Exclude system placeholders (they're not really individuals)
  AND company_name NOT LIKE '[Unassigned%';

-- ==============================================
-- DISPLAY HELPER FUNCTION
-- ==============================================

-- Function to get display name that makes sense for type
CREATE OR REPLACE FUNCTION get_client_display_name(
  p_company_name TEXT,
  p_client_type TEXT,
  p_primary_contact TEXT
)
RETURNS TEXT AS $$
BEGIN
  IF p_client_type = 'individual' THEN
    -- For individuals, use the company_name field (which contains their name)
    RETURN p_company_name;
  ELSE
    -- For companies, optionally include primary contact
    -- Just return company name by default
    RETURN p_company_name;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_client_display_name IS 
  'Returns appropriate display name based on client type. For individuals, returns the name directly. For companies, returns company name.';

-- ==============================================
-- VALIDATION HELPER
-- ==============================================

-- Check for likely misclassified records
SELECT 
  id,
  company_name,
  client_type,
  CASE
    WHEN client_type = 'company' 
         AND array_length(string_to_array(company_name, ' '), 1) = 2
         AND company_name !~* '(LLC|Inc|Corp|Ltd|Company|Group|Partners|Associates|Services|Solutions|Holdings|Enterprises|Properties|Investments|Management|Consulting|Advisors|Capital|Ventures)'
      THEN 'Might be individual'
    WHEN client_type = 'individual'
         AND company_name ~* '(LLC|Inc|Corp|Ltd|Company|Group|Partners|Associates|Services|Solutions|Holdings|Enterprises|Properties|Investments|Management|Consulting|Advisors|Capital|Ventures)'
      THEN 'Might be company'
    ELSE 'Looks correct'
  END as classification_check
FROM public.clients
WHERE client_type IS NOT NULL
ORDER BY classification_check, company_name;

