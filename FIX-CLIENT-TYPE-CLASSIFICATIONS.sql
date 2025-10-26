-- ==============================================
-- FIX CLIENT TYPE MISCLASSIFICATIONS
-- Corrects companies that were wrongly marked as individuals
-- ==============================================

-- Fix companies that were misclassified as individuals
-- These have business keywords but were missed by initial detection
UPDATE public.clients
SET client_type = 'company'
WHERE client_type = 'individual'
  AND (
    -- Has business/industry keywords (expanded list)
    company_name ~* '(Appraisal|Valuation|Analytics|AMC|Lending|Mortgage|Finance|Financial|VMS|Network|Settlement|Title|Realty|Real Estate|Law|Legal|Agency|Firm|Capital|Solutions|Services|Management|Consulting|Group|Partners|Associates|Holdings|Ventures)'
    OR
    -- Contains @ symbol (brand name style)
    company_name LIKE '%@%'
  )
  -- EXCEPT: Keep system placeholders as they were
  AND company_name NOT LIKE '[Unassigned%';

-- Fix system placeholders - they should be 'company' (they're not real individuals)
UPDATE public.clients
SET client_type = 'company'
WHERE company_name LIKE '[Unassigned%'
  AND client_type = 'individual';

-- ==============================================
-- VERIFY CORRECTIONS
-- ==============================================

-- Show what was fixed
SELECT 
  company_name,
  client_type,
  'Fixed: Was individual, now company' as note
FROM clients
WHERE company_name IN (
  'Allstate Appraisal',
  '@ HOME VMS',
  'Appraisal MC',
  'Cashflow Connections',
  'NFM Lending',
  'Nation Valuation Service',
  'Optimal Offers',
  'TRUEVALUATION FL CO',
  'VANDALAY INDUSTRIES',
  'Vision VMC'
)
ORDER BY company_name;

-- ==============================================
-- FINAL CLASSIFICATION SUMMARY
-- ==============================================

-- Show breakdown by type
SELECT 
  client_type,
  COUNT(*) as client_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM clients
WHERE client_type IS NOT NULL
  AND company_name NOT LIKE '[Unassigned%'
GROUP BY client_type
ORDER BY client_count DESC;

-- ==============================================
-- REVIEW INDIVIDUAL CLASSIFICATIONS
-- ==============================================

-- Show all clients still marked as individual
-- (excluding system placeholders)
SELECT 
  company_name,
  client_type,
  primary_contact,
  email,
  CASE
    WHEN company_name ~* '(Appraisal|Valuation|Lending|Mortgage|Real Estate|Realty|VMS|AMC|Finance|Capital|Solutions|Services|Management|Network|Agency|Firm)'
      THEN '⚠️ Might be company'
    ELSE '✅ Likely correct'
  END as validation_check
FROM clients
WHERE client_type = 'individual'
  AND company_name NOT LIKE '[Unassigned%'
ORDER BY validation_check, company_name;

-- ==============================================
-- EXPECTED RESULTS
-- ==============================================

-- After this script:
-- - Companies with business keywords → client_type = 'company'
-- - True individuals (2-3 word names, no keywords) → client_type = 'individual'
-- - System placeholders ([Unassigned...]) → stay as-is

-- Examples of what SHOULD be individual:
-- - "John Smith"
-- - "Maria Garcia"
-- - "Robert James Wilson"

-- Examples of what SHOULD be company:
-- - "Allstate Appraisal" (has "Appraisal")
-- - "NFM Lending" (has "Lending")
-- - "@ HOME VMS" (has "VMS")
-- - Anything with LLC, Inc, Corp, etc.

