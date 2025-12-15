-- Final Verification Queries for org_id Fix
-- Date: 2025-11-18
-- Status: All checks should pass

-- ==================================================
-- CHECK 1: Clients with NULL org_id
-- Expected: 0
-- ==================================================
SELECT
  COUNT(*) as clients_with_null_org_id,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM clients
WHERE org_id IS NULL;

-- ==================================================
-- CHECK 2: Contacts with NULL org_id
-- Expected: 0
-- ==================================================
SELECT
  COUNT(*) as contacts_with_null_org_id,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM contacts
WHERE org_id IS NULL;

-- ==================================================
-- CHECK 3: Critical Contact (appraisals@canopymortgage.com)
-- Expected: Has org_id
-- ==================================================
SELECT
  id,
  email,
  org_id,
  client_id,
  CASE
    WHEN org_id IS NOT NULL THEN '✅ PASS - Has org_id'
    ELSE '❌ FAIL - Missing org_id'
  END as status
FROM contacts
WHERE email = 'appraisals@canopymortgage.com';

-- ==================================================
-- CHECK 4: All Clients Summary
-- Expected: 100% with org_id
-- ==================================================
SELECT
  COUNT(*) as total_clients,
  COUNT(org_id) as clients_with_org_id,
  COUNT(*) - COUNT(org_id) as clients_missing_org_id,
  ROUND(100.0 * COUNT(org_id) / COUNT(*), 2) as percentage_complete,
  CASE
    WHEN COUNT(*) = COUNT(org_id) THEN '✅ PASS - 100%'
    ELSE '❌ FAIL - ' || ROUND(100.0 * COUNT(org_id) / COUNT(*), 2) || '%'
  END as status
FROM clients;

-- ==================================================
-- CHECK 5: All Contacts Summary
-- Expected: 100% with org_id
-- ==================================================
SELECT
  COUNT(*) as total_contacts,
  COUNT(org_id) as contacts_with_org_id,
  COUNT(*) - COUNT(org_id) as contacts_missing_org_id,
  ROUND(100.0 * COUNT(org_id) / COUNT(*), 2) as percentage_complete,
  CASE
    WHEN COUNT(*) = COUNT(org_id) THEN '✅ PASS - 100%'
    ELSE '❌ FAIL - ' || ROUND(100.0 * COUNT(org_id) / COUNT(*), 2) || '%'
  END as status
FROM contacts;

-- ==================================================
-- CHECK 6: Client Distribution by Organization
-- Expected: rod@myroihome.com should have 381 clients
-- ==================================================
SELECT
  p.email,
  p.id as org_id,
  COUNT(c.id) as client_count,
  CASE
    WHEN p.email = 'rod@myroihome.com' AND COUNT(c.id) = 381 THEN '✅ PASS - Correct count'
    WHEN p.email = 'rod@myroihome.com' THEN '⚠️  WARNING - Expected 381, got ' || COUNT(c.id)
    ELSE '✓ OK'
  END as status
FROM profiles p
LEFT JOIN clients c ON c.org_id = p.id
GROUP BY p.id, p.email
ORDER BY client_count DESC;

-- ==================================================
-- CHECK 7: The 11 Previously Problematic Clients
-- Expected: All should have org_id = bde00714-427d-4024-9fbd-6f895824f733
-- ==================================================
SELECT
  id,
  company_name,
  org_id,
  CASE
    WHEN org_id = 'bde00714-427d-4024-9fbd-6f895824f733' THEN '✅ PASS'
    WHEN org_id IS NULL THEN '❌ FAIL - NULL'
    ELSE '⚠️  WARNING - Different org_id'
  END as status
FROM clients
WHERE id IN (
  '1bb0a6ef-f9bf-495c-9d67-90d1431ac748',  -- Canopy Mortgage, LLC
  'cb912b42-fa3b-4e09-8d03-88c4d9a79d66',  -- I Fund Cities
  '21e60fe6-b992-47a4-bbee-fe24f7332932',  -- American Reporting Company
  '43b79301-cd14-4c2b-a09d-2d3b89249154',  -- Rocket Close
  '029de142-f156-4888-884f-007e9880773e',  -- Marcus Ellington
  'fb4658bd-bc13-440e-a628-399185f46810',  -- ZAP Appraisals, LLC
  '3f42a1a1-ddd6-4aaf-b2da-fc9a898eae35',  -- MoFin Lending
  '50215aac-d810-46ac-87bb-cd202a17fda4',  -- KB Home
  '1d8087cc-ec06-494b-963c-5af5ec0e4e75',  -- Ascribe Valuations, LLC
  '1820a5cd-d151-4371-a299-ce53ae1543bd',  -- Source Appraisal Management, LLC
  '8196a2a3-8842-4bd4-85e7-494dc4968d4a'   -- Guardian Asset Management
)
ORDER BY company_name;

-- ==================================================
-- CHECK 8: The 7 Previously Problematic Contacts
-- Expected: All should have org_id = bde00714-427d-4024-9fbd-6f895824f733
-- ==================================================
SELECT
  id,
  email,
  org_id,
  client_id,
  CASE
    WHEN org_id = 'bde00714-427d-4024-9fbd-6f895824f733' THEN '✅ PASS'
    WHEN org_id IS NULL THEN '❌ FAIL - NULL'
    ELSE '⚠️  WARNING - Different org_id'
  END as status
FROM contacts
WHERE email IN (
  'adam@sourceam.com',
  'appraisals@canopymortgage.com',
  'vendormgmt@ascribeval.com',
  'phernandez@ascribeval.com',
  'rluis@ascribeval.com',
  'orlandoappraisals@kbhome.com',
  'cody.kitson@guardianassetmgt.com'
)
ORDER BY email;

-- ==================================================
-- CHECK 9: Contacts Match Their Client's org_id
-- Expected: 100% match
-- ==================================================
SELECT
  COUNT(*) as total_contacts_with_client,
  COUNT(CASE WHEN ct.org_id = c.org_id THEN 1 END) as matching_org_id,
  COUNT(CASE WHEN ct.org_id != c.org_id OR ct.org_id IS NULL OR c.org_id IS NULL THEN 1 END) as mismatched_org_id,
  ROUND(100.0 * COUNT(CASE WHEN ct.org_id = c.org_id THEN 1 END) / COUNT(*), 2) as match_percentage,
  CASE
    WHEN COUNT(*) = COUNT(CASE WHEN ct.org_id = c.org_id THEN 1 END) THEN '✅ PASS - 100% match'
    ELSE '❌ FAIL - ' || ROUND(100.0 * COUNT(CASE WHEN ct.org_id = c.org_id THEN 1 END) / COUNT(*), 2) || '% match'
  END as status
FROM contacts ct
INNER JOIN clients c ON ct.client_id = c.id;

-- ==================================================
-- CHECK 10: Overall System Health
-- Expected: All green
-- ==================================================
SELECT
  'org_id Fix Status' as check_category,
  'All clients have org_id' as check_name,
  (SELECT COUNT(*) FROM clients WHERE org_id IS NULL) = 0 as passed,
  CASE
    WHEN (SELECT COUNT(*) FROM clients WHERE org_id IS NULL) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status

UNION ALL

SELECT
  'org_id Fix Status',
  'All contacts have org_id',
  (SELECT COUNT(*) FROM contacts WHERE org_id IS NULL) = 0,
  CASE
    WHEN (SELECT COUNT(*) FROM contacts WHERE org_id IS NULL) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END

UNION ALL

SELECT
  'org_id Fix Status',
  'Critical contact fixed',
  (SELECT org_id FROM contacts WHERE email = 'appraisals@canopymortgage.com') IS NOT NULL,
  CASE
    WHEN (SELECT org_id FROM contacts WHERE email = 'appraisals@canopymortgage.com') IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL'
  END

UNION ALL

SELECT
  'org_id Fix Status',
  'All 11 clients fixed',
  (SELECT COUNT(*) FROM clients WHERE id IN (
    '1bb0a6ef-f9bf-495c-9d67-90d1431ac748',
    'cb912b42-fa3b-4e09-8d03-88c4d9a79d66',
    '21e60fe6-b992-47a4-bbee-fe24f7332932',
    '43b79301-cd14-4c2b-a09d-2d3b89249154',
    '029de142-f156-4888-884f-007e9880773e',
    'fb4658bd-bc13-440e-a628-399185f46810',
    '3f42a1a1-ddd6-4aaf-b2da-fc9a898eae35',
    '50215aac-d810-46ac-87bb-cd202a17fda4',
    '1d8087cc-ec06-494b-963c-5af5ec0e4e75',
    '1820a5cd-d151-4371-a299-ce53ae1543bd',
    '8196a2a3-8842-4bd4-85e7-494dc4968d4a'
  ) AND org_id IS NOT NULL) = 11,
  CASE
    WHEN (SELECT COUNT(*) FROM clients WHERE id IN (
      '1bb0a6ef-f9bf-495c-9d67-90d1431ac748',
      'cb912b42-fa3b-4e09-8d03-88c4d9a79d66',
      '21e60fe6-b992-47a4-bbee-fe24f7332932',
      '43b79301-cd14-4c2b-a09d-2d3b89249154',
      '029de142-f156-4888-884f-007e9880773e',
      'fb4658bd-bc13-440e-a628-399185f46810',
      '3f42a1a1-ddd6-4aaf-b2da-fc9a898eae35',
      '50215aac-d810-46ac-87bb-cd202a17fda4',
      '1d8087cc-ec06-494b-963c-5af5ec0e4e75',
      '1820a5cd-d151-4371-a299-ce53ae1543bd',
      '8196a2a3-8842-4bd4-85e7-494dc4968d4a'
    ) AND org_id IS NOT NULL) = 11 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END

UNION ALL

SELECT
  'org_id Fix Status',
  'Contacts match client org_id',
  (SELECT COUNT(*) FROM contacts ct INNER JOIN clients c ON ct.client_id = c.id WHERE ct.org_id != c.org_id) = 0,
  CASE
    WHEN (SELECT COUNT(*) FROM contacts ct INNER JOIN clients c ON ct.client_id = c.id WHERE ct.org_id != c.org_id) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END;

-- ==================================================
-- FINAL SUMMARY
-- ==================================================
SELECT
  '========================================' as summary_line
UNION ALL
SELECT 'FINAL VERIFICATION SUMMARY'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Total Clients: ' || (SELECT COUNT(*) FROM clients)
UNION ALL
SELECT 'Clients with org_id: ' || (SELECT COUNT(*) FROM clients WHERE org_id IS NOT NULL)
UNION ALL
SELECT ''
UNION ALL
SELECT 'Total Contacts: ' || (SELECT COUNT(*) FROM contacts)
UNION ALL
SELECT 'Contacts with org_id: ' || (SELECT COUNT(*) FROM contacts WHERE org_id IS NOT NULL)
UNION ALL
SELECT ''
UNION ALL
SELECT 'Critical Contact Status: ' ||
  CASE
    WHEN (SELECT org_id FROM contacts WHERE email = 'appraisals@canopymortgage.com') IS NOT NULL
    THEN '✅ Fixed'
    ELSE '❌ Still broken'
  END
UNION ALL
SELECT ''
UNION ALL
SELECT 'Overall Status: ' ||
  CASE
    WHEN (SELECT COUNT(*) FROM clients WHERE org_id IS NULL) = 0
     AND (SELECT COUNT(*) FROM contacts WHERE org_id IS NULL) = 0
    THEN '✅ ALL CHECKS PASSED'
    ELSE '❌ SOME CHECKS FAILED'
  END
UNION ALL
SELECT '========================================';
