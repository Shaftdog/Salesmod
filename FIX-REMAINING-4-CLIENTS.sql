-- ==============================================
-- FIX REMAINING 4 MISCLASSIFIED CLIENTS
-- These are companies but lack obvious business suffixes
-- ==============================================

-- Manually fix the 4 remaining individuals that are actually companies
UPDATE public.clients
SET client_type = 'company'
WHERE company_name IN (
  'Cashflow Connections',  -- Business service
  'Optimal Offers',         -- Business service
  'VANDALAY INDUSTRIES',    -- Has "INDUSTRIES" - clearly a company
  'Vision VMC'              -- VMC = Vendor Management Company
)
AND client_type = 'individual';

-- Verify the fix
SELECT 
  company_name,
  client_type,
  'Fixed: Changed to company' as note
FROM clients
WHERE company_name IN (
  'Cashflow Connections',
  'Optimal Offers',
  'VANDALAY INDUSTRIES',
  'Vision VMC'
)
ORDER BY company_name;

-- ==============================================
-- FINAL REVIEW: All Individuals
-- ==============================================

-- Show all remaining "individual" clients
-- These should be TRUE individuals (actual people)
SELECT 
  company_name,
  client_type,
  primary_contact,
  CASE
    WHEN array_length(string_to_array(company_name, ' '), 1) BETWEEN 2 AND 3
      THEN '✅ Looks like person name'
    ELSE '⚠️ Review manually'
  END as validation
FROM clients
WHERE client_type = 'individual'
  AND company_name NOT LIKE '[Unassigned%'
ORDER BY company_name;

-- ==============================================
-- EXPECTED RESULTS
-- ==============================================

-- After this fix, "individual" clients should ONLY be:
-- - Actual people's names (FirstName LastName)
-- - No business keywords whatsoever
-- - Examples: "John Smith", "Maria Garcia", "Robert Wilson"

-- Everything else should be "company"

