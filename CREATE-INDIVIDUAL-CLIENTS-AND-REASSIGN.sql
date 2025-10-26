-- ==============================================
-- CREATE INDIVIDUAL CLIENTS & REASSIGN ORDERS
-- For individuals who aren't companies
-- ==============================================

-- ==============================================
-- STEP 1: Create the 3 individual clients
-- ==============================================

-- Create Marcus Ellington if doesn't exist
INSERT INTO clients (
  company_name,
  primary_contact, 
  email,
  phone,
  address,
  billing_address,
  client_type
)
SELECT 
  'Marcus Ellington',
  'Marcus Ellington',
  'marcusellington@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE company_name = 'Marcus Ellington'
);

-- Create Yunior Castroy if doesn't exist
INSERT INTO clients (
  company_name,
  primary_contact, 
  email,
  phone,
  address,
  billing_address,
  client_type
)
SELECT
  'Yunior Castroy',
  'Yunior Castro',
  'yohanny.castro96@gmail.com',
  '305-244-7702',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE company_name = 'Yunior Castroy'
);

-- Create ThinkLattice LLC if doesn't exist
INSERT INTO clients (
  company_name,
  primary_contact, 
  email,
  phone,
  address,
  billing_address,
  client_type
)
SELECT
  'ThinkLattice LLC',
  'Primary Contact',
  'contact@thinklattice.com',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE company_name = 'ThinkLattice LLC'
);

-- Confirm they were created
SELECT 
  company_name,
  client_type,
  email,
  phone
FROM clients
WHERE company_name IN ('Marcus Ellington', 'Yunior Castroy', 'ThinkLattice LLC');

-- ==============================================
-- STEP 2: Reassign ALL Unassigned Orders
-- ==============================================

-- 2A. Reassign Consolidated Analytics orders (2 orders)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name ILIKE '%Consolidated Analytics%'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND (
    o.props->>'amc_client' ILIKE '%Consolidated Analytics%'
    OR o.props->>'notes' ILIKE '%Consolidated Analytics%'
  );

-- 2B. Reassign Property Rate orders (1 order)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name ILIKE '%PROPERTYRATE%'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND o.props->>'notes' ILIKE '%Property Rate%';

-- 2C. Reassign Allstate Appraisal orders (3 orders)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name ILIKE '%Allstate Appraisal%'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND (
    o.props->>'amc_client' ILIKE '%Allstate%'
    OR o.props->>'notes' ILIKE '%Allstate%'
  );

-- 2D. Reassign Marcus Ellington orders (1 order)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name = 'Marcus Ellington'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND (
    o.props->>'notes' ILIKE '%Marcus Ellington%'
    OR o.property_address ILIKE '%Bramblewood%' -- From CSV data
  );

-- 2E. Reassign Yunior Castroy orders (1 order)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name = 'Yunior Castroy'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND (
    o.props->>'notes' ILIKE '%Yunior Castro%'
    OR o.property_address ILIKE '%Magnolia St%Davenport%' -- From CSV data
  );

-- 2F. Reassign ThinkLattice LLC orders (1 order)
UPDATE orders o
SET client_id = c.id
FROM clients c
WHERE c.company_name = 'ThinkLattice LLC'
  AND o.client_id = (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  AND (
    o.props->>'notes' ILIKE '%ThinkLattice%'
    OR o.property_address ILIKE '%IBIS BAY%Ocoee%' -- From CSV data
  );

-- ==============================================
-- STEP 3: VERIFY RESULTS
-- ==============================================

-- Show final client distribution
SELECT 
  c.company_name,
  c.client_type,
  COUNT(o.id) as order_count,
  SUM(o.fee_amount)::money as total_revenue
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE o.source = 'asana'
GROUP BY c.company_name, c.client_type
ORDER BY order_count DESC;

-- Check for any remaining unassigned orders
SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount,
  LEFT(o.props->>'notes', 100) as notes_snippet
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE c.company_name = '[Unassigned Orders]'
  AND o.source = 'asana';

-- ==============================================
-- EXPECTED RESULTS
-- ==============================================

-- After running this script, you should have:
-- - i Fund Cities LLC: 6 orders (company)
-- - Applied Valuation Services Inc: 5 orders (company)
-- - Allstate Appraisal: 3 orders (company)
-- - Consolidated Analytics: 2 orders (company)
-- - Marcus Ellington: 1 order (individual)
-- - Yunior Castroy: 1 order (individual)
-- - ThinkLattice LLC: 1 order (company)
-- - Property Rate: 1 order (company)
-- - [Unassigned Orders]: 0 orders (should be empty!)

-- Total: 20 orders, all properly assigned

