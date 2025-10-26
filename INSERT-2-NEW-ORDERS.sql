-- ==============================================
-- INSERT 2 NEW OCTOBER ORDERS
-- With complete workflow field data
-- ==============================================

-- ==============================================
-- STEP 1: Create Missing Clients
-- ==============================================

-- Check if MoFin Lending exists
SELECT 
  id, 
  company_name, 
  client_type
FROM clients
WHERE company_name ILIKE '%MoFin%' OR company_name ILIKE '%Lending%';

-- Create MoFin Lending if doesn't exist
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
  'MoFin Lending',
  'Primary Contact',
  'contact@mofinlending.com',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE company_name = 'MoFin Lending'
);

-- Verify iFund Cities exists (should already be there as "i Fund Cities LLC")
SELECT id, company_name FROM clients WHERE company_name ILIKE '%iFund%' OR company_name ILIKE '%Fund Cities%';

-- ==============================================
-- STEP 2: Insert Orders
-- ==============================================

-- Order 1: 635 Kingbird Cir, Delray Beach, FL 33444 
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip,
  property_type, borrower_name, client_id,
  fee_amount, total_amount, status, priority, order_type,
  ordered_date, due_date, created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1211743535967733',
  'asana',
  'ORD-1761438202377',
  '635 Kingbird Cir',
  'Delray Beach',
  'FL',
  '33444',
  'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'i Fund Cities LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Fund Cities%' LIMIT 1)
  ),
  550.00,
  550.00,
  'new',
  'normal',
  'refinance',
  '2025-10-24',
  '2025-10-30',
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'interior',
  'Other (see description)',
  '1004',
  ARRAY['1007']::text[],
  'bill',
  'client_selection',
  'ORL - NE - PRIMARY',
  'none',
  'residential',
  false,
  false,
  '{"original_address": "635 Kingbird Cir, Delray Beach, FL 33444 ", "admin_worker": "Joy"}'::jsonb
);

-- Order 2: 412-414 Jennifer Ln, Eustis, FL 32726
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip,
  property_type, borrower_name, client_id,
  fee_amount, total_amount, status, priority, order_type,
  ordered_date, due_date, created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1211743535967679',
  'asana',
  'ORD-1761438202378',
  '412-414 Jennifer Ln',
  'Eustis',
  'FL',
  '32726',
  'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MoFin Lending' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MoFin%' LIMIT 1)
  ),
  300.00,
  300.00,
  'new',
  'normal',
  'refinance',
  '2025-10-24',
  '2025-10-29',
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'interior',
  'Other (see description)',
  '1025',
  ARRAY['216']::text[],
  'bill',
  'client_selection',
  'ORL - NW - PRIMARY',
  'none',
  'residential',
  false,
  false,
  '{"original_address": "412-414 Jennifer Ln, Eustis, FL 32726", "admin_worker": "Joy"}'::jsonb
);


-- ==============================================
-- STEP 3: Verify New Orders
-- ==============================================

-- Should show 2 new orders with all workflow fields
SELECT 
  order_number, 
  property_address,
  scope_of_work,
  intended_use,
  report_form_type,
  additional_forms,
  billing_method,
  sales_campaign,
  service_region,
  c.company_name as client,
  c.client_type
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE external_id IN ('1211743535967733', '1211743535967679');

-- ==============================================
-- STEP 4: Final Count
-- ==============================================

-- Should now show 22 total orders (20 + 2 new)
SELECT COUNT(*) as total_october_orders
FROM orders
WHERE source = 'asana';

-- Show all October clients with order counts
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