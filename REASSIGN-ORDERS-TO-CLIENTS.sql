-- ==============================================
-- REASSIGN UNASSIGNED ORDERS TO CORRECT CLIENTS
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Reassign Consolidated Analytics orders (2 orders expected)
UPDATE orders o
SET client_id = c.id
FROM clients c,
     clients uc
WHERE c.company_name ILIKE '%Consolidated Analytics%'
  AND uc.company_name = '[Unassigned Orders]'
  AND o.client_id = uc.id
  AND (
    o.props->>'amc_client' ILIKE '%Consolidated Analytics%'
    OR o.props->>'notes' ILIKE '%Consolidated Analytics%'
  )
  AND c.id = (
    SELECT id FROM clients 
    WHERE company_name ILIKE '%Consolidated Analytics%' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- 2. Reassign Property Rate orders (1 order expected)
UPDATE orders o
SET client_id = c.id
FROM clients c,
     clients uc
WHERE c.company_name ILIKE '%PROPERTYRATE%'
  AND uc.company_name = '[Unassigned Orders]'
  AND o.client_id = uc.id
  AND o.props->>'notes' ILIKE '%Property Rate%'
  AND c.id = (
    SELECT id FROM clients 
    WHERE company_name ILIKE '%PROPERTYRATE%' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- 3. Reassign Allstate Appraisal orders (3 orders expected)
UPDATE orders o
SET client_id = c.id
FROM clients c,
     clients uc
WHERE c.company_name ILIKE '%Allstate Appraisal%'
  AND uc.company_name = '[Unassigned Orders]'
  AND o.client_id = uc.id
  AND (
    o.props->>'amc_client' ILIKE '%Allstate%'
    OR o.props->>'notes' ILIKE '%Allstate%'
  )
  AND c.id = (
    SELECT id FROM clients 
    WHERE company_name ILIKE '%Allstate Appraisal%' 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- ==============================================
-- VERIFY THE RESULTS
-- ==============================================

-- Show order distribution by client
SELECT 
  c.company_name,
  COUNT(o.id) as order_count,
  SUM(o.fee_amount) as total_revenue
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE o.source = 'asana'
GROUP BY c.company_name
ORDER BY order_count DESC;

-- Check remaining unassigned orders (should be 6 or fewer)
SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount,
  LEFT(o.props->>'notes', 200) as notes_snippet
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE c.company_name = '[Unassigned Orders]'
  AND o.source = 'asana';

