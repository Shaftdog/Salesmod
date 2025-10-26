-- ==============================================
-- HISTORICAL ORDERS - BATCH 3 (SAFE VERSION)
-- Orders 601-900
-- With fallback client matching
-- ==============================================

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207341410055697', 'asana', 'ORD-1207341410055697',
  '5775 Northwest 10th', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-17T00:00:00.000Z', '2024-06-11T00:00:00.000Z', '2024-06-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "5775 Northwest 10th, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207349618675079', 'asana', 'ORD-1207349618675079',
  '13473 SW 60th Ave', 'Ocala', 'FL', '13473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-17T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "13473 SW 60th Ave, Ocala, FL 13473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207347927364909', 'asana', 'ORD-1207347927364909',
  '28 Aspen Dr', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-17T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "28 Aspen Dr, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207347927364895', 'asana', 'ORD-1207347927364895',
  '13 Aspen Dr', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-17T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "13 Aspen Dr, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207349066917070', 'asana', 'ORD-1207349066917070',
  '11 Ash Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-17T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "11 Ash Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207339600854583', 'asana', 'ORD-1207339600854583',
  '6951 Stone Rd Port', 'Richey', 'FL', '34668', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-22T00:00:00.000Z', '2024-05-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6951 Stone Rd Port, Richey, FL 34668"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207339600854571', 'asana', 'ORD-1207339600854571',
  '13320 Chippendale St Spring', 'Hill', 'FL', '13320', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-22T00:00:00.000Z', '2024-05-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "13320 Chippendale St Spring, Hill, FL 13320"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207339879171468', 'asana', 'ORD-1207339879171468',
  '6063 Shingler Ave', 'Spring Hill', 'FL', '34608', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-22T00:00:00.000Z', '2024-05-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6063 Shingler Ave, Spring Hill, FL 34608"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207337684846996', 'asana', 'ORD-1207337684846996',
  '5811 NW 10th St', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "5811 NW 10th St, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207331191374402', 'asana', 'ORD-1207331191374402',
  '2420 EDWIN ST NE', 'WINTER HAVEN', 'FL', '33881', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-23T00:00:00.000Z', '2024-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2420 EDWIN ST NE, WINTER HAVEN, FL 33881"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207331265331138', 'asana', 'ORD-1207331265331138',
  '411 TONKLIN RD SW', 'PALM BAY', 'FL', '32908', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-16T00:00:00.000Z', '2024-05-23T00:00:00.000Z', '2024-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "411 TONKLIN RD SW, PALM BAY, FL 32908"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207331126168858', 'asana', 'ORD-1207331126168858',
  '133 DEAUVILLE AVE SE', 'PALM BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-05-15T00:00:00.000Z', '2024-05-24T00:00:00.000Z', '2024-05-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "133 DEAUVILLE AVE SE, PALM BAY, FL 32909"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207307860735417', 'asana', 'ORD-1207307860735417',
  '601 GRAND ST', 'ORLANDO', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-05-15T00:00:00.000Z', '2024-05-23T00:00:00.000Z', '2024-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "601 GRAND ST, ORLANDO, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207330782462845', 'asana', 'ORD-1207330782462845',
  '5218 BONNIE BRAE CIR', 'ORLANDO', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-05-15T00:00:00.000Z', '2024-05-23T00:00:00.000Z', '2024-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5218 BONNIE BRAE CIR, ORLANDO, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207330828922488', 'asana', 'ORD-1207330828922488',
  '5108 CASSATT AVE', 'ORLANDO', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-05-15T00:00:00.000Z', '2024-06-14T00:00:00.000Z', '2024-06-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5108 CASSATT AVE, ORLANDO, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207328739529712', 'asana', 'ORD-1207328739529712',
  '615 Concord Ln Holmes', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2024-05-15T00:00:00.000Z', '2024-05-17T00:00:00.000Z', '2024-05-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "615 Concord Ln Holmes, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207317594245473', 'asana', 'ORD-1207317594245473',
  '3819 Doune Way', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-05-14T00:00:00.000Z', '2024-05-15T00:00:00.000Z', '2024-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1007',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3819 Doune Way, Clermont, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207317547340387', 'asana', 'ORD-1207317547340387',
  '8810 North Mulberry Street', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-14T00:00:00.000Z', '2024-05-21T00:00:00.000Z', '2024-05-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8810 North Mulberry Street, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207316578725477', 'asana', 'ORD-1207316578725477',
  '8810 North Mulberry Street', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-14T00:00:00.000Z', '2024-05-21T00:00:00.000Z', '2024-05-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8810 North Mulberry Street, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207310505389089', 'asana', 'ORD-1207310505389089',
  '1661 MORAVIA AVE', 'DAYTONA BEACH', 'FL', '32117', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  600, 600,
  'completed', 'normal', 'refinance',
  '2024-05-13T00:00:00.000Z', '2024-05-24T00:00:00.000Z', '2024-05-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1661 MORAVIA AVE, DAYTONA BEACH, FL 32117"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207308910106070', 'asana', 'ORD-1207308910106070',
  '8534 Lansmere Ln', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-13T00:00:00.000Z', '2024-05-23T00:00:00.000Z', '2024-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8534 Lansmere Ln, Orlando, FL 32835"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207290938586921', 'asana', 'ORD-1207290938586921',
  '10 Cedar Trace', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-13T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "10 Cedar Trace, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207308029182133', 'asana', 'ORD-1207308029182133',
  '11 Cedar Trace Ln', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-13T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "11 Cedar Trace Ln, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207307795878856', 'asana', 'ORD-1207307795878856',
  '2920 SE 50th Ct SE', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-13T00:00:00.000Z', '2024-06-18T00:00:00.000Z', '2024-06-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2920 SE 50th Ct SE, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207288086678840', 'asana', 'ORD-1207288086678840',
  '535 WINDERMERE', 'LAKELAND', 'FL', '33809', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  595, 595,
  'completed', 'normal', 'refinance',
  '2024-05-10T00:00:00.000Z', '2024-05-17T00:00:00.000Z', '2024-05-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "535 WINDERMERE, LAKELAND, FL 33809"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207277934007581', 'asana', 'ORD-1207277934007581',
  '9824 Royal Vista Ave', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-09T00:00:00.000Z', '2024-05-15T00:00:00.000Z', '2024-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "9824 Royal Vista Ave, Clermont, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207272697477775', 'asana', 'ORD-1207272697477775',
  '8050 Hoboh Ln', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Allstate Appraisal%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-08T00:00:00.000Z', '2024-05-15T00:00:00.000Z', '2024-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8050 Hoboh Ln, Clermont, FL 34714"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207271042108626', 'asana', 'ORD-1207271042108626',
  'Lot 305 Coyote Creek Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2024-05-08T00:00:00.000Z', '2024-05-13T00:00:00.000Z', '2024-05-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "Lot 305 Coyote Creek Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207260613984748', 'asana', 'ORD-1207260613984748',
  '1039 DILLON CIR New Smyrna', 'Beach', 'FL', '32168', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-07T00:00:00.000Z', '2024-05-15T00:00:00.000Z', '2024-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "1039 DILLON CIR New Smyrna, Beach, FL 32168"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207259866977664', 'asana', 'ORD-1207259866977664',
  '115 Spring Cove Trail Altamonte', 'Springs', 'FL', '32714', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Corporate Settlement Solutions' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Corporate Settlement Solutions%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-07T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "115 Spring Cove Trail Altamonte, Springs, FL 32714"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207258973322262', 'asana', 'ORD-1207258973322262',
  '3004 5Th St', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-07T00:00:00.000Z', '2024-05-10T00:00:00.000Z', '2024-05-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3004 5Th St, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207258304691699', 'asana', 'ORD-1207258304691699',
  '3001 Sidney Ave', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-07T00:00:00.000Z', '2024-05-13T00:00:00.000Z', '2024-05-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3001 Sidney Ave, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207233529560203', 'asana', 'ORD-1207233529560203',
  '5300 Ocean Beach BLVD Unit 507 Cocoa', 'Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-05-03T00:00:00.000Z', '2024-05-14T00:00:00.000Z', '2024-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "5300 Ocean Beach BLVD Unit 507 Cocoa, Beach, FL 32931"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207232776808397', 'asana', 'ORD-1207232776808397',
  '5300 Ocean Beach BLVD Unit 509 Cocoa', 'Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-05-03T00:00:00.000Z', '2024-05-14T00:00:00.000Z', '2024-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "5300 Ocean Beach BLVD Unit 509 Cocoa, Beach, FL 32931"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207215539045722', 'asana', 'ORD-1207215539045722',
  '3 Oak Run Ocala', 'FL', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-01T00:00:00.000Z', '2024-05-24T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3 Oak Run Ocala, FL, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207214008395491', 'asana', 'ORD-1207214008395491',
  '2200 N Glenwood Dr', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-01T00:00:00.000Z', '2024-05-08T00:00:00.000Z', '2024-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "2200 N Glenwood Dr, Tampa, FL 33602"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207208844800816', 'asana', 'ORD-1207208844800816',
  '35636 ROSE MOSS AVE', 'Leesburg', 'FL', '35636', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2024-04-30T00:00:00.000Z', '2024-05-07T00:00:00.000Z', '2024-05-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "35636 ROSE MOSS AVE, Leesburg, FL 35636"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207208370641994', 'asana', 'ORD-1207208370641994',
  '1151 TIGER ST SE', 'PALM BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-04-30T00:00:00.000Z', '2024-05-08T00:00:00.000Z', '2024-05-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1151 TIGER ST SE, PALM BAY, FL 32909"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207184905685997', 'asana', 'ORD-1207184905685997',
  '570 Manor Road Maitland Florida', '32751', 'FL', '32751', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  990, 990,
  'completed', 'normal', 'refinance',
  '2024-04-26T00:00:00.000Z', '2024-05-02T00:00:00.000Z', '2024-05-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "570 Manor Road Maitland Florida, 32751, FL 32751"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207176694277939', 'asana', 'ORD-1207176694277939',
  '2320 174th Ct Silver', 'Springs', 'FL', '34488', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Great SouthBay Appraisal Management Company%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2024-04-25T00:00:00.000Z', '2024-05-02T00:00:00.000Z', '2024-05-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Reverse Mortgage', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2320 174th Ct Silver, Springs, FL 34488"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207174919365956', 'asana', 'ORD-1207174919365956',
  '8616 21st Ave NW', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-25T00:00:00.000Z', '2024-05-01T00:00:00.000Z', '2024-05-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8616 21st Ave NW, Bradenton, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207165537869250', 'asana', 'ORD-1207165537869250',
  '1958 Brantley Cir', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2024-04-24T00:00:00.000Z', '2024-04-26T00:00:00.000Z', '2024-04-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1958 Brantley Cir, Clermont, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207164800254934', 'asana', 'ORD-1207164800254934',
  '807 E. Ida St Unit A', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  750, 750,
  'completed', 'normal', 'refinance',
  '2024-04-24T00:00:00.000Z', '2024-05-01T00:00:00.000Z', '2024-05-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "807 E. Ida St Unit A, Tampa, FL 33603"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207164664816464', 'asana', 'ORD-1207164664816464',
  '807 E. Ida St Unit A', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  750, 750,
  'completed', 'normal', 'refinance',
  '2024-04-24T00:00:00.000Z', '2024-05-01T00:00:00.000Z', '2024-05-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "807 E. Ida St Unit A, Tampa, FL 33603"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207161610330371', 'asana', 'ORD-1207161610330371',
  '115 W Hiawatha St', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-24T00:00:00.000Z', '2024-05-01T00:00:00.000Z', '2024-05-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "115 W Hiawatha St, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207153539144374', 'asana', 'ORD-1207153539144374',
  '2516 Old New York Ave', 'Deland', 'FL', '32720', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2024-04-23T00:00:00.000Z', '2024-04-23T00:00:00.000Z', '2024-04-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2516 Old New York Ave, Deland, FL 32720"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207152978686449', 'asana', 'ORD-1207152978686449',
  '1301 CHESTERTON AVE', 'ORLANDO', 'FL', '32809', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-04-23T00:00:00.000Z', '2024-04-29T00:00:00.000Z', '2024-04-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1301 CHESTERTON AVE, ORLANDO, FL 32809"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207150490435654', 'asana', 'ORD-1207150490435654',
  '219 W 7TH ST', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2024-04-23T00:00:00.000Z', '2024-04-26T00:00:00.000Z', '2024-04-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "219 W 7TH ST, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207142597259153', 'asana', 'ORD-1207142597259153',
  '1050 Clear Creek Cir', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-04-22T00:00:00.000Z', '2024-04-29T00:00:00.000Z', '2024-04-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1050 Clear Creek Cir, Clermont, FL 34714"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207139198857566', 'asana', 'ORD-1207139198857566',
  '870 87th Ave N', 'St. Petersburg', 'FL', '33702', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-22T00:00:00.000Z', '2024-04-24T00:00:00.000Z', '2024-04-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "870 87th Ave N, St. Petersburg, FL 33702"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207127136437770', 'asana', 'ORD-1207127136437770',
  '303 65th St', 'Holmes Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2024-04-19T00:00:00.000Z', '2024-04-24T00:00:00.000Z', '2024-04-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "303 65th St, Holmes Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207126465015771', 'asana', 'ORD-1207126465015771',
  '10320 SW 42nd Ave', 'Ocala', 'FL', '10320', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2024-04-19T00:00:00.000Z', '2024-04-24T00:00:00.000Z', '2024-04-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "10320 SW 42nd Ave, Ocala, FL 10320"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207101212042534', 'asana', 'ORD-1207101212042534',
  '6883 SW 146th Ln Rd', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-17T00:00:00.000Z', '2024-04-23T00:00:00.000Z', '2024-04-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6883 SW 146th Ln Rd, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207092734718894', 'asana', 'ORD-1207092734718894',
  '918 Oregon St', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  328, 328,
  'completed', 'normal', 'refinance',
  '2024-04-16T00:00:00.000Z', '2024-04-23T00:00:00.000Z', '2024-04-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "918 Oregon St, Orlando, FL 32803"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207090981268300', 'asana', 'ORD-1207090981268300',
  '1288 SE 32nd St', 'Ocala', 'FL', '34471', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-16T00:00:00.000Z', '2024-04-23T00:00:00.000Z', '2024-04-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1288 SE 32nd St, Ocala, FL 34471"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207067916603501', 'asana', 'ORD-1207067916603501',
  '325 N Florida Ave', 'DeLand', 'FL', '32720', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  2250, 2250,
  'completed', 'normal', 'refinance',
  '2024-04-12T00:00:00.000Z', '2024-05-03T00:00:00.000Z', '2024-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "325 N Florida Ave, DeLand, FL 32720"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207059148947904', 'asana', 'ORD-1207059148947904',
  '2230 Chuluota Rd', 'Orlando', 'FL', '32820', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-04-11T00:00:00.000Z', '2024-04-16T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'LAND',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "2230 Chuluota Rd, Orlando, FL 32820"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207049562285340', 'asana', 'ORD-1207049562285340',
  '5180 Cypress Creek Dr #101', 'Orlando', 'FL', '32811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-04-10T00:00:00.000Z', '2024-04-17T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5180 Cypress Creek Dr #101, Orlando, FL 32811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207048802536195', 'asana', 'ORD-1207048802536195',
  '63 Princeton Avenue', 'Frostproof', 'FL', '33843', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-10T00:00:00.000Z', '2024-04-17T00:00:00.000Z', '2024-04-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "63 Princeton Avenue, Frostproof, FL 33843"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207048716872225', 'asana', 'ORD-1207048716872225',
  '7801 Almark St', 'Tampa', 'FL', '33625', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-10T00:00:00.000Z', '2024-04-16T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7801 Almark St, Tampa, FL 33625"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207041521814111', 'asana', 'ORD-1207041521814111',
  '1043 N New York Ave', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-04-09T00:00:00.000Z', '2024-04-15T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1043 N New York Ave, Lakeland, FL 33805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207040342490903', 'asana', 'ORD-1207040342490903',
  '1426 San Mateo Dr', 'Dunedin', 'FL', '34698', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-09T00:00:00.000Z', '2024-04-12T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1426 San Mateo Dr, Dunedin, FL 34698"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207040206203911', 'asana', 'ORD-1207040206203911',
  '1826 14th St S', 'Saint Petersburg', 'FL', '33705', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-04-09T00:00:00.000Z', '2024-04-12T00:00:00.000Z', '2024-04-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Pre-Listing', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1826 14th St S, Saint Petersburg, FL 33705"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207039711064668', 'asana', 'ORD-1207039711064668',
  '308 N E Street', 'Pensacola', 'FL', '32501', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-09T00:00:00.000Z', '2024-04-26T00:00:00.000Z', '2024-04-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "308 N E Street, Pensacola, FL 32501"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207010943567157', 'asana', 'ORD-1207010943567157',
  '7903 Juniper Rd', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-05T00:00:00.000Z', '2024-04-16T00:00:00.000Z', '2024-04-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "7903 Juniper Rd, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207002050150857', 'asana', 'ORD-1207002050150857',
  '528 NW 59th Ave', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "528 NW 59th Ave, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001897302664', 'asana', 'ORD-1207001897302664',
  '49 Cypress Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "49 Cypress Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001899847121', 'asana', 'ORD-1207001899847121',
  '3442 SW 165th Loop', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3442 SW 165th Loop, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001788889319', 'asana', 'ORD-1207001788889319',
  '591 Marion Oaks Pass', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "591 Marion Oaks Pass, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001641378129', 'asana', 'ORD-1207001641378129',
  '5474 NW 6th St', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "5474 NW 6th St, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001570916586', 'asana', 'ORD-1207001570916586',
  '10320 SW 42nd Ave', 'Ocala', 'FL', '10320', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "10320 SW 42nd Ave, Ocala, FL 10320"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001443873964', 'asana', 'ORD-1207001443873964',
  '13401 SW 47th Terrace', 'Ocala', 'FL', '13401', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "13401 SW 47th Terrace, Ocala, FL 13401"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001283494153', 'asana', 'ORD-1207001283494153',
  '550 NW 59th Ave', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "550 NW 59th Ave, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207001096597238', 'asana', 'ORD-1207001096597238',
  '12 Cedar Trace', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-04-04T00:00:00.000Z', '2024-04-11T00:00:00.000Z', '2024-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "12 Cedar Trace, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206994368333849', 'asana', 'ORD-1206994368333849',
  '3465 Seneca Club Loop', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  352, 352,
  'completed', 'normal', 'refinance',
  '2024-04-03T00:00:00.000Z', '2024-04-15T00:00:00.000Z', '2024-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3465 Seneca Club Loop, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206992403907914', 'asana', 'ORD-1206992403907914',
  '4 Chase Rd', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-04-03T00:00:00.000Z', '2024-04-09T00:00:00.000Z', '2024-04-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "4 Chase Rd, Windermere, FL 34786"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206985525848088', 'asana', 'ORD-1206985525848088',
  '7 Water Trak', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  200, 200,
  'completed', 'normal', 'refinance',
  '2024-04-02T00:00:00.000Z', '2024-04-03T00:00:00.000Z', '2024-04-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7 Water Trak, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206982238382004', 'asana', 'ORD-1206982238382004',
  '1009 Thunderhead Ln', 'Minneola', 'FL', '34715', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2024-04-02T00:00:00.000Z', '2024-04-09T00:00:00.000Z', '2024-04-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1009 Thunderhead Ln, Minneola, FL 34715"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206981159326333', 'asana', 'ORD-1206981159326333',
  '1705 N Orange Plant', 'City', 'FL', '33563', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-04-02T00:00:00.000Z', '2024-04-05T00:00:00.000Z', '2024-04-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1705 N Orange Plant, City, FL 33563"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206974758318151', 'asana', 'ORD-1206974758318151',
  '37149 SANDY LANE', 'GRAND ISLAND', 'FL', '37149', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  304, 304,
  'completed', 'normal', 'refinance',
  '2024-04-01T00:00:00.000Z', '2024-04-05T00:00:00.000Z', '2024-04-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "37149 SANDY LANE, GRAND ISLAND, FL 37149"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206973433074741', 'asana', 'ORD-1206973433074741',
  '304 Eunice Dr. Plant', 'City', 'FL', '33563', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-04-01T00:00:00.000Z', '2024-04-04T00:00:00.000Z', '2024-04-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "304 Eunice Dr. Plant, City, FL 33563"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206962422431478', 'asana', 'ORD-1206962422431478',
  '1771 Oasis Ave', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  620, 620,
  'completed', 'normal', 'refinance',
  '2024-03-29T00:00:00.000Z', '2024-04-08T00:00:00.000Z', '2024-04-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1771 Oasis Ave, Deltona, FL 32725"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206958953535052', 'asana', 'ORD-1206958953535052',
  '1513 23rd St', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-29T00:00:00.000Z', '2024-04-05T00:00:00.000Z', '2024-04-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1513 23rd St, Orlando, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206951182463943', 'asana', 'ORD-1206951182463943',
  '230 Ann Rustin Dr Ormond', 'Beach', 'FL', '32176', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-03-28T00:00:00.000Z', '2024-04-03T00:00:00.000Z', '2024-04-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "230 Ann Rustin Dr Ormond, Beach, FL 32176"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206926465230267', 'asana', 'ORD-1206926465230267',
  '1043 N New York Ave', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2024-03-25T00:00:00.000Z', '2024-03-28T00:00:00.000Z', '2024-03-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1043 N New York Ave, Lakeland, FL 33805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206911440395752', 'asana', 'ORD-1206911440395752',
  '6301 Metz Rd', 'Groveland', 'FL', '34736', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  490, 490,
  'completed', 'normal', 'refinance',
  '2024-03-22T00:00:00.000Z', '2024-03-28T00:00:00.000Z', '2024-03-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6301 Metz Rd, Groveland, FL 34736"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206910162286931', 'asana', 'ORD-1206910162286931',
  '1827 SW 108th Ln unit B-C', 'Ocala', 'FL', '34476', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-22T00:00:00.000Z', '2024-04-05T00:00:00.000Z', '2024-04-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1827 SW 108th Ln unit B-C, Ocala, FL 34476"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206910137308359', 'asana', 'ORD-1206910137308359',
  '6001 Beau Ln', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-03-22T00:00:00.000Z', '2024-03-27T00:00:00.000Z', '2024-03-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6001 Beau Ln, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206901519895783', 'asana', 'ORD-1206901519895783',
  '1827 Southwest 108th Ln unit A', 'Ocala', 'FL', '34476', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-21T00:00:00.000Z', '2024-04-04T00:00:00.000Z', '2024-04-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1827 Southwest 108th Ln unit A, Ocala, FL 34476"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206882698078076', 'asana', 'ORD-1206882698078076',
  '1816 NW 36th Pl', 'Cape Coral', 'FL', '33993', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2024-03-19T00:00:00.000Z', '2024-03-19T00:00:00.000Z', '2024-03-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1816 NW 36th Pl, Cape Coral, FL 33993"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206872758819063', 'asana', 'ORD-1206872758819063',
  '9425 W Milwaukee Ct', 'Crystal River', 'FL', '34428', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-18T00:00:00.000Z', '2024-03-22T00:00:00.000Z', '2024-03-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', NULL, '1025',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "9425 W Milwaukee Ct, Crystal River, FL 34428"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206865341391600', 'asana', 'ORD-1206865341391600',
  '1402 Bessmor Rd Winter', 'Park', 'FL', '32789', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-18T00:00:00.000Z', '2024-03-18T00:00:00.000Z', '2024-03-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1402 Bessmor Rd Winter, Park, FL 32789"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206851914228292', 'asana', 'ORD-1206851914228292',
  '7724 Pengrove Pass', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-15T00:00:00.000Z', '2024-03-26T00:00:00.000Z', '2024-03-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7724 Pengrove Pass, Orlando, FL 32835"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206846337169975', 'asana', 'ORD-1206846337169975',
  '1668 Bear Crossing Cir', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  352, 352,
  'completed', 'normal', 'refinance',
  '2024-03-14T00:00:00.000Z', '2024-03-14T00:00:00.000Z', '2024-04-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1668 Bear Crossing Cir, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206845999951505', 'asana', 'ORD-1206845999951505',
  '616 CASABELLA DR', 'BRADENTON', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2024-03-14T00:00:00.000Z', '2024-03-20T00:00:00.000Z', '2024-03-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "616 CASABELLA DR, BRADENTON, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206832523306806', 'asana', 'ORD-1206832523306806',
  '21 Ash Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-13T00:00:00.000Z', '2024-03-21T00:00:00.000Z', '2024-03-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "21 Ash Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206831993751178', 'asana', 'ORD-1206831993751178',
  '4 Ash Radial', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-13T00:00:00.000Z', '2024-03-21T00:00:00.000Z', '2024-03-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "4 Ash Radial, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206826768759837', 'asana', 'ORD-1206826768759837',
  '33869 Sky Blossom Circle Leesburg', 'Florida 34788', 'FL', '33869', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  525, 525,
  'completed', 'normal', 'refinance',
  '2024-03-12T00:00:00.000Z', '2024-03-19T00:00:00.000Z', '2024-03-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "33869 Sky Blossom Circle Leesburg, Florida 34788, FL 33869"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206817652804615', 'asana', 'ORD-1206817652804615',
  '2520 Citrus Club Lane', 'Orlando', 'FL', '32839', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-11T00:00:00.000Z', '2024-03-20T00:00:00.000Z', '2024-03-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2520 Citrus Club Lane, Orlando, FL 32839"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206809372033928', 'asana', 'ORD-1206809372033928',
  '12727 SW 93RD ST', 'Dunnellon', 'FL', '12727', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-03-11T00:00:00.000Z', '2024-03-18T00:00:00.000Z', '2024-03-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "12727 SW 93RD ST, Dunnellon, FL 12727"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206771170673399', 'asana', 'ORD-1206771170673399',
  '2211 N Archer Rd', 'Avon Park', 'FL', '33825', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-06T00:00:00.000Z', '2024-03-08T00:00:00.000Z', '2024-03-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2211 N Archer Rd, Avon Park, FL 33825"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206782056572351', 'asana', 'ORD-1206782056572351',
  '2211 N Archer Rd', 'Avon Park', 'FL', '33825', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-06T00:00:00.000Z', '2024-03-11T00:00:00.000Z', '2024-03-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2211 N Archer Rd, Avon Park, FL 33825"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206781950505484', 'asana', 'ORD-1206781950505484',
  '561 Rhodes Dr', 'Deland', 'FL', '32720', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  600, 600,
  'completed', 'normal', 'refinance',
  '2024-03-06T00:00:00.000Z', '2024-03-13T00:00:00.000Z', '2024-03-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "561 Rhodes Dr, Deland, FL 32720"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206780473304960', 'asana', 'ORD-1206780473304960',
  '616 Casabella Dr', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-03-06T00:00:00.000Z', '2024-03-12T00:00:00.000Z', '2024-03-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "616 Casabella Dr, Bradenton, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206779148154010', 'asana', 'ORD-1206779148154010',
  '5039 Old Cheney Hwy', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-03-06T00:00:00.000Z', '2024-03-19T00:00:00.000Z', '2024-03-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5039 Old Cheney Hwy, Orlando, FL 32807"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206771173940632', 'asana', 'ORD-1206771173940632',
  '250 E Silver Star Rd', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  214, 214,
  'completed', 'normal', 'refinance',
  '2024-03-05T00:00:00.000Z', '2024-03-11T00:00:00.000Z', '2024-03-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "250 E Silver Star Rd, Ocoee, FL 34761"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206769863677256', 'asana', 'ORD-1206769863677256',
  '448 N Hastings St', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-03-05T00:00:00.000Z', '2024-03-11T00:00:00.000Z', '2024-03-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "448 N Hastings St, Orlando, FL 32835"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206768885158104', 'asana', 'ORD-1206768885158104',
  '2710 Child St', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  470, 470,
  'completed', 'normal', 'refinance',
  '2024-03-05T00:00:00.000Z', '2024-03-11T00:00:00.000Z', '2024-03-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2710 Child St, Ocoee, FL 34761"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206766397007422', 'asana', 'ORD-1206766397007422',
  '40 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-03-05T00:00:00.000Z', '2024-03-15T00:00:00.000Z', '2024-03-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "40 Willow Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206743457206330', 'asana', 'ORD-1206743457206330',
  '219 Florida Ave', 'New Smyrna Beach', 'FL', '32169', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  720, 720,
  'completed', 'normal', 'refinance',
  '2024-03-01T00:00:00.000Z', '2024-03-07T00:00:00.000Z', '2024-03-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "219 Florida Ave, New Smyrna Beach, FL 32169"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206742497627093', 'asana', 'ORD-1206742497627093',
  '635 104th Ave N', 'Naples', 'FL', '34108', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-03-01T00:00:00.000Z', '2024-03-08T00:00:00.000Z', '2024-03-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "635 104th Ave N, Naples, FL 34108"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206739595382810', 'asana', 'ORD-1206739595382810',
  '106 Hilton Dr Fort', 'Pierce', 'FL', '34946', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  200, 200,
  'completed', 'normal', 'refinance',
  '2024-03-01T00:00:00.000Z', '2024-03-07T00:00:00.000Z', '2024-03-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "106 Hilton Dr Fort, Pierce, FL 34946"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206728383058834', 'asana', 'ORD-1206728383058834',
  '45 NEPTUNE RD', 'KISSIMMEE', 'FL', '34744', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  625, 625,
  'completed', 'normal', 'refinance',
  '2024-02-29T00:00:00.000Z', '2024-03-08T00:00:00.000Z', '2024-03-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "45 NEPTUNE RD, KISSIMMEE, FL 34744"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206728144523835', 'asana', 'ORD-1206728144523835',
  '31 NEPTUNE RD', 'KISSIMMEE', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  495, 495,
  'completed', 'normal', 'refinance',
  '2024-02-29T00:00:00.000Z', '2024-03-08T00:00:00.000Z', '2024-03-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "31 NEPTUNE RD, KISSIMMEE, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206727921531376', 'asana', 'ORD-1206727921531376',
  '17 NEPTUNE RD', 'KISSIMMEE', 'FL', '34744', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  495, 495,
  'completed', 'normal', 'refinance',
  '2024-02-29T00:00:00.000Z', '2024-03-07T00:00:00.000Z', '2024-03-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "17 NEPTUNE RD, KISSIMMEE, FL 34744"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206708947314626', 'asana', 'ORD-1206708947314626',
  '1801 Sunrise Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-27T00:00:00.000Z', '2024-03-08T00:00:00.000Z', '2024-03-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1801 Sunrise Dr, Sebring, FL 33872"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206684999435683', 'asana', 'ORD-1206684999435683',
  '3819 Doune Way', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-23T00:00:00.000Z', '2024-02-27T00:00:00.000Z', '2024-02-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3819 Doune Way, Clermont, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206681984982444', 'asana', 'ORD-1206681984982444',
  '2180 Sterling Creek Pkwy', 'OVIEDO', 'FL', '32766', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-02-23T00:00:00.000Z', '2024-03-05T00:00:00.000Z', '2024-03-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2180 Sterling Creek Pkwy, OVIEDO, FL 32766"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206674604233914', 'asana', 'ORD-1206674604233914',
  '14 Pecan Course Loop', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-22T00:00:00.000Z', '2024-02-29T00:00:00.000Z', '2024-02-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "14 Pecan Course Loop, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206674568899835', 'asana', 'ORD-1206674568899835',
  '561 Minneola Ave', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2024-02-22T00:00:00.000Z', '2024-03-05T00:00:00.000Z', '2024-03-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "561 Minneola Ave, Clermont, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206670548566035', 'asana', 'ORD-1206670548566035',
  '1716 HIGHBANKS CIR WINTER', 'GARDEN', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-22T00:00:00.000Z', '2024-02-28T00:00:00.000Z', '2024-02-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1716 HIGHBANKS CIR WINTER, GARDEN, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206660379071671', 'asana', 'ORD-1206660379071671',
  '13957 Florigold Dr', 'Windermere', 'FL', '13957', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Allstate Appraisal%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-21T00:00:00.000Z', '2024-02-27T00:00:00.000Z', '2024-02-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "13957 Florigold Dr, Windermere, FL 13957"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206647745108686', 'asana', 'ORD-1206647745108686',
  '19 Diamond Ridge Way', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-02-20T00:00:00.000Z', '2024-02-26T00:00:00.000Z', '2024-02-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "19 Diamond Ridge Way, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206637569217740', 'asana', 'ORD-1206637569217740',
  '4117 NW 36th Terrace', 'Cape Coral', 'FL', '33993', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-02-19T00:00:00.000Z', '2024-02-23T00:00:00.000Z', '2024-02-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "4117 NW 36th Terrace, Cape Coral, FL 33993"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206624969591044', 'asana', 'ORD-1206624969591044',
  '7 Water Trak', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  645, 645,
  'completed', 'normal', 'refinance',
  '2024-02-16T00:00:00.000Z', '2024-02-26T00:00:00.000Z', '2024-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7 Water Trak, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206617973279311', 'asana', 'ORD-1206617973279311',
  '1605 Asher Ln', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-15T00:00:00.000Z', '2024-02-22T00:00:00.000Z', '2024-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1605 Asher Ln, Orlando, FL 32803"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206616703307924', 'asana', 'ORD-1206616703307924',
  '1432 Elizabeth St New Smyrna', 'Beach', 'FL', '32168', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  100, 100,
  'completed', 'normal', 'refinance',
  '2024-02-15T00:00:00.000Z', '2024-02-19T00:00:00.000Z', '2024-02-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1432 Elizabeth St New Smyrna, Beach, FL 32168"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206596567917117', 'asana', 'ORD-1206596567917117',
  '3940 Carnaby Dr', 'Oviedo', 'FL', '32765', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2024-02-13T00:00:00.000Z', '2024-02-16T00:00:00.000Z', '2024-02-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3940 Carnaby Dr, Oviedo, FL 32765"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206559803776440', 'asana', 'ORD-1206559803776440',
  '25 NEPTUNE RD', 'KISSIMMEE', 'FL', '34744', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  775, 775,
  'completed', 'normal', 'refinance',
  '2024-02-08T00:00:00.000Z', '2024-02-16T00:00:00.000Z', '2024-02-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "25 NEPTUNE RD, KISSIMMEE, FL 34744"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206548674193691', 'asana', 'ORD-1206548674193691',
  '1 Cedar Run', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-02-07T00:00:00.000Z', '2024-02-15T00:00:00.000Z', '2024-02-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1 Cedar Run, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206548494116130', 'asana', 'ORD-1206548494116130',
  '608 S Lakeview Ave', 'Winter Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  620, 620,
  'completed', 'normal', 'refinance',
  '2024-02-07T00:00:00.000Z', '2024-02-15T00:00:00.000Z', '2024-02-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "608 S Lakeview Ave, Winter Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206498943923018', 'asana', 'ORD-1206498943923018',
  '114 Dogwood Dr Loop', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-01T00:00:00.000Z', '2024-02-13T00:00:00.000Z', '2024-02-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "114 Dogwood Dr Loop, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206498639641754', 'asana', 'ORD-1206498639641754',
  '1071 Kershaw Dr Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Corporate Settlement Solutions' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Corporate Settlement Solutions%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-02-01T00:00:00.000Z', '2024-02-07T00:00:00.000Z', '2024-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1071 Kershaw Dr Winter, Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206488764143935', 'asana', 'ORD-1206488764143935',
  '2586 Cedarwood Drive Lake', 'Wales', 'FL', '33898', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2024-01-31T00:00:00.000Z', '2024-02-07T00:00:00.000Z', '2024-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2586 Cedarwood Drive Lake, Wales, FL 33898"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206488792237457', 'asana', 'ORD-1206488792237457',
  '1372 Harvard St SW', 'Palm Bay', 'FL', '32908', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2024-01-31T00:00:00.000Z', '2024-02-06T00:00:00.000Z', '2024-02-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1372 Harvard St SW, Palm Bay, FL 32908"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206447841890255', 'asana', 'ORD-1206447841890255',
  '1460 11th Ave', 'DeLand', 'FL', '32724', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2024-01-25T00:00:00.000Z', '2024-02-12T00:00:00.000Z', '2024-02-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1460 11th Ave, DeLand, FL 32724"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206436945909540', 'asana', 'ORD-1206436945909540',
  '5205 2nd st', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-01-25T00:00:00.000Z', '2024-01-25T00:00:00.000Z', '2024-02-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5205 2nd st, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206446149381874', 'asana', 'ORD-1206446149381874',
  '6 Lincoln Blvd Orlando', '32810', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-01-25T00:00:00.000Z', '2024-01-25T00:00:00.000Z', '2024-02-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6 Lincoln Blvd Orlando, 32810, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206445625346686', 'asana', 'ORD-1206445625346686',
  '2727 CULLENS COURT', 'OCOEE', 'FL', '34761', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  370, 370,
  'completed', 'normal', 'refinance',
  '2024-01-25T00:00:00.000Z', '2024-01-31T00:00:00.000Z', '2024-01-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Asset Valuation', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2727 CULLENS COURT, OCOEE, FL 34761"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206437208126505', 'asana', 'ORD-1206437208126505',
  '561 West Minneola Avenue Clermont Florida', '34711', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-01-24T00:00:00.000Z', '2024-01-30T00:00:00.000Z', '2024-01-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "561 West Minneola Avenue Clermont Florida, 34711, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206436952261336', 'asana', 'ORD-1206436952261336',
  '1614 GADSEN BLVD', 'ORLANDO', 'FL', '32812', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Flagstar Bank%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  600, 600,
  'completed', 'normal', 'refinance',
  '2024-01-24T00:00:00.000Z', '2024-01-31T00:00:00.000Z', '2024-01-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1614 GADSEN BLVD, ORLANDO, FL 32812"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206436862912672', 'asana', 'ORD-1206436862912672',
  '2682 Palmetto Ridge Cir', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  100, 100,
  'completed', 'normal', 'refinance',
  '2024-01-24T00:00:00.000Z', '2024-01-26T00:00:00.000Z', '2024-03-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2682 Palmetto Ridge Cir, Apopka, FL 32712"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206435470167575', 'asana', 'ORD-1206435470167575',
  '8125 Resort Village Dr #5902', 'Orlando', 'FL', '32821', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2024-01-24T00:00:00.000Z', '2024-02-01T00:00:00.000Z', '2024-01-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "8125 Resort Village Dr #5902, Orlando, FL 32821"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206434427181687', 'asana', 'ORD-1206434427181687',
  '1432 Elizabeth Street New Smyrna', 'Beach', 'FL', '32168', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  200, 200,
  'completed', 'normal', 'refinance',
  '2024-01-24T00:00:00.000Z', '2024-01-30T00:00:00.000Z', '2024-01-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1432 Elizabeth Street New Smyrna, Beach, FL 32168"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206424300096341', 'asana', 'ORD-1206424300096341',
  '1102 HAMLIN AVE', 'HOWEY IN THE HILLS', 'FL', '34737', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  304, 304,
  'completed', 'normal', 'refinance',
  '2024-01-23T00:00:00.000Z', '2024-01-26T00:00:00.000Z', '2024-01-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1102 HAMLIN AVE, HOWEY IN THE HILLS, FL 34737"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206412228079538', 'asana', 'ORD-1206412228079538',
  '1517 E 27th Ave unit b', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-01-23T00:00:00.000Z', '2024-01-26T00:00:00.000Z', '2024-01-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1517 E 27th Ave unit b, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206423712622435', 'asana', 'ORD-1206423712622435',
  '1517 E 27th Ave unit a', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-01-23T00:00:00.000Z', '2024-01-26T00:00:00.000Z', '2024-01-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1517 E 27th Ave unit a, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206378754666906', 'asana', 'ORD-1206378754666906',
  '2682 Palmetto Ridge Cir', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2024-01-17T00:00:00.000Z', '2024-01-19T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2682 Palmetto Ridge Cir, Apopka, FL 32712"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206365802884846', 'asana', 'ORD-1206365802884846',
  'Lot 305 Coyote Creek Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2024-01-16T00:00:00.000Z', '2024-01-19T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "Lot 305 Coyote Creek Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206341351664356', 'asana', 'ORD-1206341351664356',
  '66 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-01-12T00:00:00.000Z', '2024-01-22T00:00:00.000Z', '2024-01-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "66 Willow Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206338916089296', 'asana', 'ORD-1206338916089296',
  '388 FAMAGUSTA DR # LOT 84', 'DAVENPORT', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  670, 670,
  'completed', 'normal', 'refinance',
  '2024-01-12T00:00:00.000Z', '2024-01-22T00:00:00.000Z', '2024-01-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "388 FAMAGUSTA DR # LOT 84, DAVENPORT, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206338338886314', 'asana', 'ORD-1206338338886314',
  '2920 N Woodrow Ave', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-01-12T00:00:00.000Z', '2024-01-16T00:00:00.000Z', '2024-01-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2920 N Woodrow Ave, Tampa, FL 33602"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206333323179527', 'asana', 'ORD-1206333323179527',
  '308 Arcadia Ave', 'Melbourne', 'FL', '32901', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2024-01-11T00:00:00.000Z', '2024-01-18T00:00:00.000Z', '2024-01-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "308 Arcadia Ave, Melbourne, FL 32901"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206324954312674', 'asana', 'ORD-1206324954312674',
  '1792 Balsawood Ct', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2024-01-10T00:00:00.000Z', '2024-01-15T00:00:00.000Z', '2024-02-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1004',
  NULL,
  'bill', 'meeting', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1792 Balsawood Ct, Orlando, FL 32818"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206323585797751', 'asana', 'ORD-1206323585797751',
  '2230 Chuluota Rd', 'Orlando', 'FL', '32820', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-01-10T00:00:00.000Z', '2024-01-15T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'LAND',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2230 Chuluota Rd, Orlando, FL 32820"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206302924866596', 'asana', 'ORD-1206302924866596',
  '5789 NW 10th St', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2024-01-10T00:00:00.000Z', '2024-01-22T00:00:00.000Z', '2024-01-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5789 NW 10th St, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206323528872825', 'asana', 'ORD-1206323528872825',
  '34 Laurel Ct', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2024-01-10T00:00:00.000Z', '2024-01-24T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "34 Laurel Ct, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206323251532853', 'asana', 'ORD-1206323251532853',
  '3940 Carnaby Dr', 'Oviedo', 'FL', '32765', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2024-01-10T00:00:00.000Z', '2024-01-17T00:00:00.000Z', '2024-01-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3940 Carnaby Dr, Oviedo, FL 32765"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206313687005830', 'asana', 'ORD-1206313687005830',
  '13147 Casper Ln', 'Clermont', 'FL', '13147', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  304, 304,
  'completed', 'normal', 'refinance',
  '2024-01-09T00:00:00.000Z', '2024-01-12T00:00:00.000Z', '2024-01-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13147 Casper Ln, Clermont, FL 13147"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206312810957754', 'asana', 'ORD-1206312810957754',
  '211 Fairway Dr', 'Haines City', 'FL', '33844', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  645, 645,
  'completed', 'normal', 'refinance',
  '2024-01-09T00:00:00.000Z', '2024-01-16T00:00:00.000Z', '2024-01-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "211 Fairway Dr, Haines City, FL 33844"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206310706503438', 'asana', 'ORD-1206310706503438',
  '14 Fir Trail Way', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2024-01-09T00:00:00.000Z', '2024-01-12T00:00:00.000Z', '2024-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "14 Fir Trail Way, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206304274535390', 'asana', 'ORD-1206304274535390',
  '4446 LENOX BLVD', 'ORLANDO', 'FL', '32811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  645, 645,
  'completed', 'normal', 'refinance',
  '2024-01-08T00:00:00.000Z', '2024-01-08T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4446 LENOX BLVD, ORLANDO, FL 32811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206302996533951', 'asana', 'ORD-1206302996533951',
  '7157 Blickley Pl', 'The Villages', 'FL', '34762', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2024-01-08T00:00:00.000Z', '2024-01-12T00:00:00.000Z', '2024-01-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7157 Blickley Pl, The Villages, FL 34762"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206255476059719', 'asana', 'ORD-1206255476059719',
  '11216 Country Hill Rd', 'Clermont', 'FL', '11216', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-12-29T00:00:00.000Z', '2024-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "11216 Country Hill Rd, Clermont, FL 11216"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206251372220492', 'asana', 'ORD-1206251372220492',
  '680 Rosemont Loop The', 'Villages', 'FL', '34762', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-28T00:00:00.000Z', '2024-01-08T00:00:00.000Z', '2024-01-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "680 Rosemont Loop The, Villages, FL 34762"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206245267319874', 'asana', 'ORD-1206245267319874',
  '710 Albeto St NE Palm', 'Bay', 'FL', '32905', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-27T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "710 Albeto St NE Palm, Bay, FL 32905"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206241460525299', 'asana', 'ORD-1206241460525299',
  '2861 Paige Dr', 'Kissimmee', 'FL', '34741', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Allstate Appraisal%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-12-26T00:00:00.000Z', '2023-12-29T00:00:00.000Z', '2023-12-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2861 Paige Dr, Kissimmee, FL 34741"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206231871425287', 'asana', 'ORD-1206231871425287',
  'Lot 305 Coyote Creek Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-12-22T00:00:00.000Z', '2023-12-27T00:00:00.000Z', '2023-12-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "Lot 305 Coyote Creek Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206227572590863', 'asana', 'ORD-1206227572590863',
  'Parcel # 27-27-19-743000-002141 State Rd. Haines City', 'Florida 33844', 'FL', '74300', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-12-21T00:00:00.000Z', '2023-12-26T00:00:00.000Z', '2023-12-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "Parcel # 27-27-19-743000-002141 State Rd. Haines City, Florida 33844, FL 74300"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206226481153766', 'asana', 'ORD-1206226481153766',
  '140 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-21T00:00:00.000Z', '2024-01-11T00:00:00.000Z', '2024-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "140 Willow Rd, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206225596595890', 'asana', 'ORD-1206225596595890',
  '15101 SW 35TH CIR', 'OCALA', 'FL', '15101', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-12-21T00:00:00.000Z', '2023-12-28T00:00:00.000Z', '2023-12-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "15101 SW 35TH CIR, OCALA, FL 15101"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206214479771647', 'asana', 'ORD-1206214479771647',
  '6903 Dickinson Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-20T00:00:00.000Z', '2024-01-24T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6903 Dickinson Dr, Sebring, FL 33872"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206209254332085', 'asana', 'ORD-1206209254332085',
  '2412 Avenue C Bradenton', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2023-12-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2412 Avenue C Bradenton, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206206334535491', 'asana', 'ORD-1206206334535491',
  '6936 Dickinson Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2024-01-10T00:00:00.000Z', '2024-01-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6936 Dickinson Dr, Sebring, FL 33872"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206208970014404', 'asana', 'ORD-1206208970014404',
  '6910 Dickinson Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2024-01-23T00:00:00.000Z', '2024-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6910 Dickinson Dr, Sebring, FL 33872"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206206551215333', 'asana', 'ORD-1206206551215333',
  '6915 N Highland Ave', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6915 N Highland Ave, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206206551215331', 'asana', 'ORD-1206206551215331',
  '2918 N Woodrow Ave', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2918 N Woodrow Ave, Tampa, FL 33602"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206206551215325', 'asana', 'ORD-1206206551215325',
  '1207 E 24th Ave', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1207 E 24th Ave, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206206551215323', 'asana', 'ORD-1206206551215323',
  '4805 N 10th St', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4805 N 10th St, Tampa, FL 33603"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206208861417303', 'asana', 'ORD-1206208861417303',
  '6913 N Highland Ave', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6913 N Highland Ave, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206208228065691', 'asana', 'ORD-1206208228065691',
  '1018 E 24th Ave', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-19T00:00:00.000Z', '2023-12-27T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1018 E 24th Ave, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206194970271586', 'asana', 'ORD-1206194970271586',
  '27107 Nature View St', 'Leesburg', 'FL', '27107', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Corporate Settlement Solutions' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Corporate Settlement Solutions%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-18T00:00:00.000Z', '2023-12-21T00:00:00.000Z', '2023-12-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "27107 Nature View St, Leesburg, FL 27107"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206186971740080', 'asana', 'ORD-1206186971740080',
  '2620 NE 19th AveLighthouse', 'Point', 'FL', '33064', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-20T00:00:00.000Z', '2023-12-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Investment', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2620 NE 19th AveLighthouse, Point, FL 33064"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206187070791543', 'asana', 'ORD-1206187070791543',
  '1390 Emerald Drive Kissimmee Florida', '34744', 'FL', '34744', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-21T00:00:00.000Z', '2023-12-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "1390 Emerald Drive Kissimmee Florida, 34744, FL 34744"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206185475444132', 'asana', 'ORD-1206185475444132',
  '219 Bradley Lane Lady', 'Lake', 'FL', '32159', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "219 Bradley Lane Lady, Lake, FL 32159"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206176126979460', 'asana', 'ORD-1206176126979460',
  '1522 E 21st Ave', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-22T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1522 E 21st Ave, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206176126979452', 'asana', 'ORD-1206176126979452',
  '2601 N 19th St', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-27T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2601 N 19th St, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206184957429718', 'asana', 'ORD-1206184957429718',
  '903 E 124th Ave', 'Tampa', 'FL', '33612', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-20T00:00:00.000Z', '2024-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out', '1025',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "903 E 124th Ave, Tampa, FL 33612"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206184590294859', 'asana', 'ORD-1206184590294859',
  '345 Bocelli Dr', 'Nokomis', 'FL', '34275', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2024-01-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "345 Bocelli Dr, Nokomis, FL 34275"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206183349042631', 'asana', 'ORD-1206183349042631',
  '120 N Hudson St', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-15T00:00:00.000Z', '2023-12-21T00:00:00.000Z', '2023-12-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "120 N Hudson St, Orlando, FL 32835"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206175155106387', 'asana', 'ORD-1206175155106387',
  '596 S Andrea Cir Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Great SouthBay Appraisal Management Company%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-12-14T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2023-12-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "596 S Andrea Cir Haines, City, FL 33844"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206174748029146', 'asana', 'ORD-1206174748029146',
  '226 Periwinkle Plaza', 'Anna Maria', 'FL', '34216', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2023-12-14T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2023-12-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "226 Periwinkle Plaza, Anna Maria, FL 34216"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206159321836551', 'asana', 'ORD-1206159321836551',
  '2942 Tanzanite Ter', 'Kissimmee', 'FL', '34758', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2023-12-13T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2023-12-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2942 Tanzanite Ter, Kissimmee, FL 34758"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206154029966389', 'asana', 'ORD-1206154029966389',
  '125 Crown Point Cir', 'Longwood', 'FL', '32779', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-12-12T00:00:00.000Z', '2023-12-20T00:00:00.000Z', '2023-12-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "125 Crown Point Cir, Longwood, FL 32779"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206144632034515', 'asana', 'ORD-1206144632034515',
  '6234 Jennings Rd', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-11T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2023-12-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6234 Jennings Rd, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206144341746974', 'asana', 'ORD-1206144341746974',
  '9642 Rampart Road', 'Leesburg', 'FL', '34788', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-12-11T00:00:00.000Z', '2023-12-15T00:00:00.000Z', '2023-12-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "9642 Rampart Road, Leesburg, FL 34788"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206130781212145', 'asana', 'ORD-1206130781212145',
  '410 Wingback Ct', 'Lake Mary', 'FL', '32746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Allstate Appraisal%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-12-08T00:00:00.000Z', '2023-12-14T00:00:00.000Z', '2023-12-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "410 Wingback Ct, Lake Mary, FL 32746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206121504122935', 'asana', 'ORD-1206121504122935',
  '1683 SW 3rd St', 'Ocala', 'FL', '34471', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-12-07T00:00:00.000Z', '2023-12-12T00:00:00.000Z', '2023-12-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1683 SW 3rd St, Ocala, FL 34471"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206112946394031', 'asana', 'ORD-1206112946394031',
  '596 S Andrea Cir Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Great SouthBay Appraisal Management Company%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-06T00:00:00.000Z', '2023-12-14T00:00:00.000Z', '2023-12-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": "596 S Andrea Cir Haines, City, FL 33844"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206081735114802', 'asana', 'ORD-1206081735114802',
  '2240 Sandridge Cir', 'Eustis', 'FL', '32726', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-12-01T00:00:00.000Z', '2023-12-07T00:00:00.000Z', '2023-12-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2240 Sandridge Cir, Eustis, FL 32726"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206073327847285', 'asana', 'ORD-1206073327847285',
  '545 106th Ave N', 'Naples', 'FL', '34108', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-30T00:00:00.000Z', '2023-12-05T00:00:00.000Z', '2023-12-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "545 106th Ave N, Naples, FL 34108"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206072991361519', 'asana', 'ORD-1206072991361519',
  '2508 N Waco Dr', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-30T00:00:00.000Z', '2023-12-05T00:00:00.000Z', '2023-12-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2508 N Waco Dr, Deltona, FL 32738"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206070095072413', 'asana', 'ORD-1206070095072413',
  '4399 Collins Rd Spring', 'Hill', 'FL', '34606', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-11-30T00:00:00.000Z', '2023-12-06T00:00:00.000Z', '2023-12-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "4399 Collins Rd Spring, Hill, FL 34606"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206052821298008', 'asana', 'ORD-1206052821298008',
  '1237 Coletta Dr', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-11-28T00:00:00.000Z', '2023-11-28T00:00:00.000Z', '2024-01-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1237 Coletta Dr, Orlando, FL 32807"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206052797289294', 'asana', 'ORD-1206052797289294',
  '5925 Ross Creek Rd', 'Lakeland', 'FL', '33810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-11-28T00:00:00.000Z', '2023-12-05T00:00:00.000Z', '2023-12-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5925 Ross Creek Rd, Lakeland, FL 33810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206013992185462', 'asana', 'ORD-1206013992185462',
  '155 Alameda Dr', 'Kissimmee', 'FL', '34743', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-11-22T00:00:00.000Z', '2023-11-22T00:00:00.000Z', '2023-11-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "155 Alameda Dr, Kissimmee, FL 34743"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206013127358518', 'asana', 'ORD-1206013127358518',
  '601 Sweet Birdie St Champions', 'Gate', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-11-22T00:00:00.000Z', '2023-11-30T00:00:00.000Z', '2023-11-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "601 Sweet Birdie St Champions, Gate, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206012819631067', 'asana', 'ORD-1206012819631067',
  '1908 Robi Cir', 'Titusville', 'FL', '32796', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  100, 100,
  'completed', 'normal', 'refinance',
  '2023-11-22T00:00:00.000Z', '2023-11-28T00:00:00.000Z', '2023-11-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', 'HUD',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1908 Robi Cir, Titusville, FL 32796"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206004116862854', 'asana', 'ORD-1206004116862854',
  '2721 Bookmark Drive', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-21T00:00:00.000Z', '2023-11-30T00:00:00.000Z', '2023-11-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2721 Bookmark Drive, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1206004101916092', 'asana', 'ORD-1206004101916092',
  '485 Armas View Lane', 'Auburndale', 'FL', '33823', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-11-21T00:00:00.000Z', '2023-11-28T00:00:00.000Z', '2023-11-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "485 Armas View Lane, Auburndale, FL 33823"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205981433643521', 'asana', 'ORD-1205981433643521',
  '7523 Bliss Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-17T00:00:00.000Z', '2023-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7523 Bliss Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205980889028192', 'asana', 'ORD-1205980889028192',
  '2056 Sunnyside Pl', 'Sarasota', 'FL', '34239', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-22T00:00:00.000Z', '2023-12-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2056 Sunnyside Pl, Sarasota, FL 34239"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205969970296043', 'asana', 'ORD-1205969970296043',
  '2513 Avenue L Fort', 'Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Arivs' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Arivs%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  175, 175,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-24T00:00:00.000Z', '2023-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2513 Avenue L Fort, Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205969970296035', 'asana', 'ORD-1205969970296035',
  '2505 Avenue L Fort', 'Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Arivs' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Arivs%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  175, 175,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-24T00:00:00.000Z', '2023-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2505 Avenue L Fort, Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205980015990260', 'asana', 'ORD-1205980015990260',
  '2504 Wilkins Ave Fort', 'Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Arivs' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Arivs%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  175, 175,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-24T00:00:00.000Z', '2023-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2504 Wilkins Ave Fort, Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205979440675510', 'asana', 'ORD-1205979440675510',
  '6849 SE 123rd Pl', 'Belleview', 'FL', '34420', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-17T00:00:00.000Z', '2023-11-22T00:00:00.000Z', '2023-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "6849 SE 123rd Pl, Belleview, FL 34420"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205968271554417', 'asana', 'ORD-1205968271554417',
  '2446 Wildwood Dr.', 'Mims', 'FL', '32754', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  100, 100,
  'completed', 'normal', 'refinance',
  '2023-11-16T00:00:00.000Z', '2023-11-22T00:00:00.000Z', '2023-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'HUD',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2446 Wildwood Dr., Mims, FL 32754"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205963513474657', 'asana', 'ORD-1205963513474657',
  '1120 Challenge Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-11-15T00:00:00.000Z', '2023-11-21T00:00:00.000Z', '2023-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1120 Challenge Dr, Davenport, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205961358250480', 'asana', 'ORD-1205961358250480',
  '2686 S E172nd St', 'Summerfield', 'FL', '34491', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-11-15T00:00:00.000Z', '2023-11-20T00:00:00.000Z', '2023-11-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2686 S E172nd St, Summerfield, FL 34491"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205954440340214', 'asana', 'ORD-1205954440340214',
  '918 Seburn Rd', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  238, 238,
  'completed', 'normal', 'refinance',
  '2023-11-14T00:00:00.000Z', '2023-11-20T00:00:00.000Z', '2023-11-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "918 Seburn Rd, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205946819702599', 'asana', 'ORD-1205946819702599',
  'CONTACT ROD ON', 'SKYPE', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-11-14T00:00:00.000Z', '2023-11-14T00:00:00.000Z', '2023-11-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "CONTACT ROD ON, SKYPE, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205943224427121', 'asana', 'ORD-1205943224427121',
  '2626 Espanola Ave', 'Sarasota', 'FL', '34239', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-11-13T00:00:00.000Z', '2023-11-18T00:00:00.000Z', '2023-11-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Reverse Mortgage', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2626 Espanola Ave, Sarasota, FL 34239"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205919634577114', 'asana', 'ORD-1205919634577114',
  '3380 Holly Spring Dr Hernando', 'Beach', 'FL', '34607', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-11-09T00:00:00.000Z', '2023-11-15T00:00:00.000Z', '2023-11-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3380 Holly Spring Dr Hernando, Beach, FL 34607"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205920439844081', 'asana', 'ORD-1205920439844081',
  '4030 SANTA BARBARA RD', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2023-11-09T00:00:00.000Z', '2023-11-14T00:00:00.000Z', '2023-11-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4030 SANTA BARBARA RD, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205920249868716', 'asana', 'ORD-1205920249868716',
  '3171 Sea Grape Dr Hernando', 'Beach', 'FL', '34607', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-11-09T00:00:00.000Z', '2023-11-15T00:00:00.000Z', '2023-11-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3171 Sea Grape Dr Hernando, Beach, FL 34607"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205908561501342', 'asana', 'ORD-1205908561501342',
  '1025 COLOMBO ST', 'JACKSONVILLE', 'FL', '32207', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-08T00:00:00.000Z', '2023-11-13T00:00:00.000Z', '2023-11-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1025 COLOMBO ST, JACKSONVILLE, FL 32207"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205907031220548', 'asana', 'ORD-1205907031220548',
  '10 Locust Trce', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-11-08T00:00:00.000Z', '2023-11-13T00:00:00.000Z', '2023-11-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "10 Locust Trce, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205903766338948', 'asana', 'ORD-1205903766338948',
  '[Converted to template] SUPERVISOR ORDER', 'REVIEW', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-11-07T00:00:00.000Z', '2023-11-07T00:00:00.000Z', '2023-11-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "[Converted to template] SUPERVISOR ORDER, REVIEW, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205901184017602', 'asana', 'ORD-1205901184017602',
  '6820 Woodgrain Ct', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-11-07T00:00:00.000Z', '2023-11-10T00:00:00.000Z', '2023-11-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6820 Woodgrain Ct, Ocoee, FL 34761"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205900377730385', 'asana', 'ORD-1205900377730385',
  '412 Jessamine Ave New Smyrna', 'Beach', 'FL', '32169', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  525, 525,
  'completed', 'normal', 'refinance',
  '2023-11-07T00:00:00.000Z', '2023-11-10T00:00:00.000Z', '2023-11-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "412 Jessamine Ave New Smyrna, Beach, FL 32169"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205892068557045', 'asana', 'ORD-1205892068557045',
  '8419 N Hubert Ave', 'Tampa', 'FL', '33614', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-11-06T00:00:00.000Z', '2023-11-10T00:00:00.000Z', '2023-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8419 N Hubert Ave, Tampa, FL 33614"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205889640481923', 'asana', 'ORD-1205889640481923',
  '414 Jessamine Ave New Smyrna', 'Beach', 'FL', '32169', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-11-06T00:00:00.000Z', '2023-11-10T00:00:00.000Z', '2023-11-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "414 Jessamine Ave New Smyrna, Beach, FL 32169"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205874614673890', 'asana', 'ORD-1205874614673890',
  '1595 14th St', 'Orange City', 'FL', '32763', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-03T00:00:00.000Z', '2023-11-06T00:00:00.000Z', '2023-11-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1595 14th St, Orange City, FL 32763"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205873990017564', 'asana', 'ORD-1205873990017564',
  '698 Forsyth St', 'Boca Raton', 'FL', '33487', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-11-03T00:00:00.000Z', '2023-11-08T00:00:00.000Z', '2023-11-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "698 Forsyth St, Boca Raton, FL 33487"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205863778206260', 'asana', 'ORD-1205863778206260',
  '409 NW 19th Ct', 'Ocala', 'FL', '34475', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-11-02T00:00:00.000Z', '2023-11-09T00:00:00.000Z', '2023-11-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "409 NW 19th Ct, Ocala, FL 34475"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205863322888015', 'asana', 'ORD-1205863322888015',
  '1952 black Lake Blvd', 'winter garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-11-02T00:00:00.000Z', '2023-11-07T00:00:00.000Z', '2023-11-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Divorce', '1004',
  NULL,
  'online', 'new_client', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1952 black Lake Blvd, winter garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205862536639353', 'asana', 'ORD-1205862536639353',
  '25431 NIXON ST', 'ASTALULA', 'FL', '25431', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-11-02T00:00:00.000Z', '2023-11-09T00:00:00.000Z', '2023-11-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "25431 NIXON ST, ASTALULA, FL 25431"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205857879553721', 'asana', 'ORD-1205857879553721',
  '414 Harrison Ave Cape', 'Canaveral', 'FL', '32920', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-11-01T00:00:00.000Z', '2023-11-07T00:00:00.000Z', '2023-11-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "414 Harrison Ave Cape, Canaveral, FL 32920"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205857857943287', 'asana', 'ORD-1205857857943287',
  '0 Sequoia Drive Lane', 'Ocklawaha', 'FL', '32179', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-11-01T00:00:00.000Z', '2023-11-06T00:00:00.000Z', '2023-11-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "0 Sequoia Drive Lane, Ocklawaha, FL 32179"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205854585821694', 'asana', 'ORD-1205854585821694',
  '3475 Gretchen Dr', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-11-01T00:00:00.000Z', '2023-11-06T00:00:00.000Z', '2023-11-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3475 Gretchen Dr, Ocoee, FL 34761"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205839082611810', 'asana', 'ORD-1205839082611810',
  '1 Aqualane Dr', 'Winter Haven', 'FL', '33880', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  394, 394,
  'completed', 'normal', 'refinance',
  '2023-10-30T00:00:00.000Z', '2023-11-03T00:00:00.000Z', '2023-11-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1 Aqualane Dr, Winter Haven, FL 33880"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205838224661084', 'asana', 'ORD-1205838224661084',
  '1255 Robbin Dr', 'Port Orange', 'FL', '32129', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2023-10-30T00:00:00.000Z', '2023-11-07T00:00:00.000Z', '2023-11-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1255 Robbin Dr, Port Orange, FL 32129"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205836757721415', 'asana', 'ORD-1205836757721415',
  '124 Freddie St Indian Harbor', 'Beach', 'FL', '32937', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-30T00:00:00.000Z', '2023-11-03T00:00:00.000Z', '2023-11-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "124 Freddie St Indian Harbor, Beach, FL 32937"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205825912071503', 'asana', 'ORD-1205825912071503',
  '202 75th Street #A Holmes', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-10-27T00:00:00.000Z', '2023-11-01T00:00:00.000Z', '2023-11-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "202 75th Street #A Holmes, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205825741790922', 'asana', 'ORD-1205825741790922',
  '2036 Lacey Oak Dr', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  328, 328,
  'completed', 'normal', 'refinance',
  '2023-10-27T00:00:00.000Z', '2023-11-03T00:00:00.000Z', '2023-11-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2036 Lacey Oak Dr, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205825522087934', 'asana', 'ORD-1205825522087934',
  '905 Lotus Vista Dr', 'Apt 102 Altamonte Springs', 'FL', '32714', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-27T00:00:00.000Z', '2023-11-01T00:00:00.000Z', '2023-11-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "905 Lotus Vista Dr, Apt 102 Altamonte Springs, FL 32714"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205817171616794', 'asana', 'ORD-1205817171616794',
  '4535 West Gore Avenue', 'Orlando', 'FL', '32811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-10-26T00:00:00.000Z', '2023-10-31T00:00:00.000Z', '2023-10-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4535 West Gore Avenue, Orlando, FL 32811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205807999400461', 'asana', 'ORD-1205807999400461',
  '2592 Grassy Point Dr UNIT 112 Lake', 'Mary', 'FL', '32746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-10-25T00:00:00.000Z', '2023-11-02T00:00:00.000Z', '2023-10-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2592 Grassy Point Dr UNIT 112 Lake, Mary, FL 32746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205800727804628', 'asana', 'ORD-1205800727804628',
  '7 Forest Lane', 'Eustis', 'FL', '32726', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-10-24T00:00:00.000Z', '2023-11-09T00:00:00.000Z', '2023-11-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7 Forest Lane, Eustis, FL 32726"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205799850613892', 'asana', 'ORD-1205799850613892',
  '1677 Beasley Dr', 'DeLand', 'FL', '32720', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-10-24T00:00:00.000Z', '2023-11-02T00:00:00.000Z', '2023-10-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1677 Beasley Dr, DeLand, FL 32720"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205799654355913', 'asana', 'ORD-1205799654355913',
  '0 Westchester Dr Cocoa', 'Beach', 'FL', '32926', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  260, 260,
  'completed', 'normal', 'refinance',
  '2023-10-24T00:00:00.000Z', '2023-10-31T00:00:00.000Z', '2023-10-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "0 Westchester Dr Cocoa, Beach, FL 32926"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205787088917618', 'asana', 'ORD-1205787088917618',
  '322 Jackson Dr', 'Sarasota', 'FL', '34236', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-23T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-11-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "322 Jackson Dr, Sarasota, FL 34236"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205787088917608', 'asana', 'ORD-1205787088917608',
  '540 Polk Dr', 'Sarasota', 'FL', '34236', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-23T00:00:00.000Z', '2023-10-31T00:00:00.000Z', '2023-11-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "540 Polk Dr, Sarasota, FL 34236"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205788425963821', 'asana', 'ORD-1205788425963821',
  '135 Avenida Veneccia', 'Sarasota', 'FL', '34242', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-23T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "135 Avenida Veneccia, Sarasota, FL 34242"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205787259743225', 'asana', 'ORD-1205787259743225',
  '1043 N New York Ave', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-10-23T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1043 N New York Ave, Lakeland, FL 33805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205786498228762', 'asana', 'ORD-1205786498228762',
  '13612 N 22nd St', 'Tampa', 'FL', '13612', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-23T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13612 N 22nd St, Tampa, FL 13612"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205771577396299', 'asana', 'ORD-1205771577396299',
  '5104 5th B St E', 'Bradenton', 'FL', '34203', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Management Solutions' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Management Solutions%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-25T00:00:00.000Z', '2023-10-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5104 5th B St E, Bradenton, FL 34203"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205769214014782', 'asana', 'ORD-1205769214014782',
  '1537 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1537 SW GOPHER TRL PALM, CITY, FL 34990"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205769214014772', 'asana', 'ORD-1205769214014772',
  '1610 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1610 SW GOPHER TRL PALM, CITY, FL 34990"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205769214014746', 'asana', 'ORD-1205769214014746',
  '1573 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1573 SW GOPHER TRL PALM, CITY, FL 34990"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205770913709360', 'asana', 'ORD-1205770913709360',
  '1586 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1586 SW GOPHER TRL PALM, CITY, FL 34990"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205770175450595', 'asana', 'ORD-1205770175450595',
  '634 Steve Roberts Special', 'Zolfo Springs', 'FL', '33890', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-26T00:00:00.000Z', '2023-10-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "634 Steve Roberts Special, Zolfo Springs, FL 33890"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205770115244162', 'asana', 'ORD-1205770115244162',
  '698 Forsyth St', 'Boca Raton', 'FL', '33487', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-10-20T00:00:00.000Z', '2023-10-27T00:00:00.000Z', '2023-10-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "698 Forsyth St, Boca Raton, FL 33487"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205753310770389', 'asana', 'ORD-1205753310770389',
  '10103 HIGHWAY 27', 'Frostproof', 'FL', '10103', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-10-18T00:00:00.000Z', '2023-10-27T00:00:00.000Z', '2023-10-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Initial', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "10103 HIGHWAY 27, Frostproof, FL 10103"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205751829871507', 'asana', 'ORD-1205751829871507',
  '6019 Grand Coulee Rd', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-10-18T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6019 Grand Coulee Rd, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205751684385555', 'asana', 'ORD-1205751684385555',
  '6184 NW 67th Ave', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-18T00:00:00.000Z', '2023-10-23T00:00:00.000Z', '2023-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "6184 NW 67th Ave, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205751235241904', 'asana', 'ORD-1205751235241904',
  '345 Bocelli Dr', 'Nokomis', 'FL', '34275', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-10-18T00:00:00.000Z', '2023-10-27T00:00:00.000Z', '2023-11-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "345 Bocelli Dr, Nokomis, FL 34275"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205750869678061', 'asana', 'ORD-1205750869678061',
  '4828 Grovemont Pl', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Property Rate%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-10-18T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4828 Grovemont Pl, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205742498152108', 'asana', 'ORD-1205742498152108',
  '635 Majestic Oak Dr', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-17T00:00:00.000Z', '2023-10-23T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "635 Majestic Oak Dr, Apopka, FL 32712"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205741813691842', 'asana', 'ORD-1205741813691842',
  '1351 Via Markham Ct', 'Lake Mary', 'FL', '32746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-10-17T00:00:00.000Z', '2023-10-23T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1351 Via Markham Ct, Lake Mary, FL 32746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205741458206761', 'asana', 'ORD-1205741458206761',
  '706 Church Avenue Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-17T00:00:00.000Z', '2023-10-21T00:00:00.000Z', '2023-10-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "706 Church Avenue Haines, City, FL 33844"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205731331933330', 'asana', 'ORD-1205731331933330',
  '2720 SW 17th Ave', 'Cape Coral', 'FL', '33914', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-16T00:00:00.000Z', '2023-10-24T00:00:00.000Z', '2023-10-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2720 SW 17th Ave, Cape Coral, FL 33914"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205733668472998', 'asana', 'ORD-1205733668472998',
  '1816 NW 36th Pl', 'Cape Coral', 'FL', '33993', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-16T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1816 NW 36th Pl, Cape Coral, FL 33993"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205721021230373', 'asana', 'ORD-1205721021230373',
  '30107 Rainey Rd', 'Sorrento', 'FL', '30107', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-10-13T00:00:00.000Z', '2023-10-19T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "30107 Rainey Rd, Sorrento, FL 30107"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205718878168851', 'asana', 'ORD-1205718878168851',
  '4684 NW Coker St', 'Arcadia', 'FL', '34266', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-10-13T00:00:00.000Z', '2023-10-19T00:00:00.000Z', '2023-10-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'REO', '2055',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4684 NW Coker St, Arcadia, FL 34266"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205714663982897', 'asana', 'ORD-1205714663982897',
  '935 NW 57th Ct', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-13T00:00:00.000Z', '2023-10-18T00:00:00.000Z', '2023-10-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "935 NW 57th Ct, Ocala, FL 34482"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205714447605357', 'asana', 'ORD-1205714447605357',
  'SW 165th street Road', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-10-13T00:00:00.000Z', '2023-10-18T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "SW 165th street Road, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205714272998728', 'asana', 'ORD-1205714272998728',
  '570 Casler Avenue', 'Clearwater FL', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-13T00:00:00.000Z', '2023-10-18T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "570 Casler Avenue, Clearwater FL, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205705170060015', 'asana', 'ORD-1205705170060015',
  '305 Brimming Lake Rd', 'Minneola', 'FL', '34715', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-19T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "305 Brimming Lake Rd, Minneola, FL 34715"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205705308586603', 'asana', 'ORD-1205705308586603',
  '900 S Chickasaw Trl', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "900 S Chickasaw Trl, Orlando, FL 32825"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205705107828292', 'asana', 'ORD-1205705107828292',
  '5039 Old Cheney Hwy', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', 'LAND',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5039 Old Cheney Hwy, Orlando, FL 32807"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205704752080033', 'asana', 'ORD-1205704752080033',
  '5039 Old Cheney Highway Lot 24', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5039 Old Cheney Highway Lot 24, Orlando, FL 32807"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205703728470040', 'asana', 'ORD-1205703728470040',
  '297 Oak Lane Dr', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "297 Oak Lane Dr, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205703669213224', 'asana', 'ORD-1205703669213224',
  '4107 Westgate Road', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-10-11T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4107 Westgate Road, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205695660604394', 'asana', 'ORD-1205695660604394',
  '847 Chippendale St', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-18T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Sale', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "847 Chippendale St, Deltona, FL 32725"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205682578703655', 'asana', 'ORD-1205682578703655',
  '33 Princeton Ln', 'Palm Coast', 'FL', '32164', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "33 Princeton Ln, Palm Coast, FL 32164"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205682578703647', 'asana', 'ORD-1205682578703647',
  '160 E Oak St', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "160 E Oak St, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205682578703639', 'asana', 'ORD-1205682578703639',
  '31 Radford Ln', 'Palm Coast', 'FL', '32164', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "31 Radford Ln, Palm Coast, FL 32164"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205682578703630', 'asana', 'ORD-1205682578703630',
  '7 Richland Ln', 'Palm Coast', 'FL', '32164', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7 Richland Ln, Palm Coast, FL 32164"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205692430713760', 'asana', 'ORD-1205692430713760',
  '7035 W Price Blvd', 'North Port', 'FL', '34291', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-10T00:00:00.000Z', '2023-10-17T00:00:00.000Z', '2023-10-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7035 W Price Blvd, North Port, FL 34291"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205672989416712', 'asana', 'ORD-1205672989416712',
  '617 Siesta Drive', 'Sarasota', 'FL', '34242', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-10-07T00:00:00.000Z', '2023-10-12T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "617 Siesta Drive, Sarasota, FL 34242"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205672822629214', 'asana', 'ORD-1205672822629214',
  '29528 Central Blvd', 'Paisley', 'FL', '29528', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  435, 435,
  'completed', 'normal', 'refinance',
  '2023-10-07T00:00:00.000Z', '2023-10-07T00:00:00.000Z', '2023-10-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "29528 Central Blvd, Paisley, FL 29528"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205671172446391', 'asana', 'ORD-1205671172446391',
  '2434 Fairway Ave', 'Eustis', 'FL', '32726', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-06T00:00:00.000Z', '2023-10-13T00:00:00.000Z', '2023-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2434 Fairway Ave, Eustis, FL 32726"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205671170974892', 'asana', 'ORD-1205671170974892',
  '105 Tangerine St. Bowling', 'Green', 'FL', '33834', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-10-06T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "105 Tangerine St. Bowling, Green, FL 33834"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205670708526923', 'asana', 'ORD-1205670708526923',
  '1807 E Henry Ave', 'Tampa', 'FL', '33610', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-06T00:00:00.000Z', '2023-10-11T00:00:00.000Z', '2023-10-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1807 E Henry Ave, Tampa, FL 33610"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205670546546298', 'asana', 'ORD-1205670546546298',
  '311 Spring Avenue', 'Anna Maria', 'FL', '34216', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-10-06T00:00:00.000Z', '2023-10-11T00:00:00.000Z', '2023-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "311 Spring Avenue, Anna Maria, FL 34216"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205663144380335', 'asana', 'ORD-1205663144380335',
  '3935 Pine Gate Trail', 'Orlando', 'FL', '32824', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-05T00:00:00.000Z', '2023-10-16T00:00:00.000Z', '2023-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3935 Pine Gate Trail, Orlando, FL 32824"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205662285938963', 'asana', 'ORD-1205662285938963',
  '3143 Loblolly St', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-05T00:00:00.000Z', '2023-10-13T00:00:00.000Z', '2023-10-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "3143 Loblolly St, Deltona, FL 32725"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205654327400293', 'asana', 'ORD-1205654327400293',
  '1007 58th Avenue Dr E', 'Bradenton', 'FL', '34203', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-10-04T00:00:00.000Z', '2023-10-07T00:00:00.000Z', '2023-10-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1007 58th Avenue Dr E, Bradenton, FL 34203"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205651938916488', 'asana', 'ORD-1205651938916488',
  '717 Gulf Land Dr', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-10-04T00:00:00.000Z', '2023-10-11T00:00:00.000Z', '2023-10-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "717 Gulf Land Dr, Apopka, FL 32712"}'::jsonb
);


-- Verify batch
SELECT COUNT(*) as total FROM orders WHERE source = 'asana';