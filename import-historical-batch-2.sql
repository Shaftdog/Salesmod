-- ==============================================
-- HISTORICAL ORDERS IMPORT - BATCH 2 of 5
-- Orders 301-600 (300 orders)
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
  '1209256365342009', 'asana', 'ORD-1209256365342009',
  '2712 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2025-01-29T00:00:00.000Z', '2025-02-07T00:00:00.000Z', '2025-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209256365342001', 'asana', 'ORD-1209256365342001',
  '2706 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2025-01-29T00:00:00.000Z', '2025-02-07T00:00:00.000Z', '2025-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209275107892351', 'asana', 'ORD-1209275107892351',
  '2724 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2025-01-29T00:00:00.000Z', '2025-02-07T00:00:00.000Z', '2025-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209265572241704', 'asana', 'ORD-1209265572241704',
  '2718 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-01-28T00:00:00.000Z', '2025-02-07T00:00:00.000Z', '2025-02-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209252983628958', 'asana', 'ORD-1209252983628958',
  '1688 ORRINGTON PAYNE PL', 'Casselberry', 'FL', '32707', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-01-27T00:00:00.000Z', '2025-01-30T00:00:00.000Z', '2025-01-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209237951635020', 'asana', 'ORD-1209237951635020',
  '3812 West Rogers Avenue', 'Tampa', 'FL', '33611', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-01-24T00:00:00.000Z', '2025-01-30T00:00:00.000Z', '2025-01-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209237313523990', 'asana', 'ORD-1209237313523990',
  '3341 SW 26th Street', 'Ocala', 'FL', '34474', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 395, 395,
  'completed', 'normal', 'refinance',
  '2025-01-24T00:00:00.000Z', '2025-01-30T00:00:00.000Z', '2025-01-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209231521333508', 'asana', 'ORD-1209231521333508',
  '5256 Dover St St', 'petersburg', 'FL', '33703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-01-23T00:00:00.000Z', '2025-01-30T00:00:00.000Z', '2025-01-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209231326425911', 'asana', 'ORD-1209231326425911',
  '140 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-01-23T00:00:00.000Z', '2025-01-29T00:00:00.000Z', '2025-01-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209231143857554', 'asana', 'ORD-1209231143857554',
  '933-955 NW 57th Ct', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-01-23T00:00:00.000Z', '2025-01-29T00:00:00.000Z', '2025-01-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209215908689056', 'asana', 'ORD-1209215908689056',
  '13716 Fox Glove St', 'Winter Garden', 'FL', '13716', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2025-01-22T00:00:00.000Z', '2025-01-30T00:00:00.000Z', '2025-01-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209197760836210', 'asana', 'ORD-1209197760836210',
  '113 147TH AVE. E.', 'MADEIRA BEACH', 'FL', '33708', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-01-20T00:00:00.000Z', '2025-01-28T00:00:00.000Z', '2025-01-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209170498504372', 'asana', 'ORD-1209170498504372',
  '1017 NW 57th Ct', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-01-16T00:00:00.000Z', '2025-01-22T00:00:00.000Z', '2025-01-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209164191662197', 'asana', 'ORD-1209164191662197',
  '7616 Autumn Pines Dr', 'Orlando', 'FL', '32822', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-01-15T00:00:00.000Z', '2025-01-23T00:00:00.000Z', '2025-01-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209154006156020', 'asana', 'ORD-1209154006156020',
  '1053 LAKE PEARL PL', 'Umatilla', 'FL', '32784', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-01-14T00:00:00.000Z', '2025-01-20T00:00:00.000Z', '2025-01-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209150584201454', 'asana', 'ORD-1209150584201454',
  '6401 Haughton Ln', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-01-14T00:00:00.000Z', '2025-01-21T00:00:00.000Z', '2025-01-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209146502070281', 'asana', 'ORD-1209146502070281',
  '4461 Shore Acres Blvd NE', 'Saint Petersburg', 'FL', '33703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-01-13T00:00:00.000Z', '2025-01-20T00:00:00.000Z', '2025-01-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209144959245970', 'asana', 'ORD-1209144959245970',
  '601 Forest Hills Dr', 'Brandon', 'FL', '33510', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-01-13T00:00:00.000Z', '2025-01-20T00:00:00.000Z', '2025-01-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209128991370622', 'asana', 'ORD-1209128991370622',
  '9285 Gran Teatro Dr Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-01-10T00:00:00.000Z', '2025-01-15T00:00:00.000Z', '2025-01-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209119363038466', 'asana', 'ORD-1209119363038466',
  '5 Dogwood Ct', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-01-09T00:00:00.000Z', '2025-01-15T00:00:00.000Z', '2025-01-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209110840584007', 'asana', 'ORD-1209110840584007',
  '1373 Pacific Ct', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-01-08T00:00:00.000Z', '2025-01-14T00:00:00.000Z', '2025-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209103454311215', 'asana', 'ORD-1209103454311215',
  '12605 Corral Road', 'Tampa', 'FL', '12605', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-01-07T00:00:00.000Z', '2025-01-13T00:00:00.000Z', '2025-01-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209103246664071', 'asana', 'ORD-1209103246664071',
  '2904 Lakemont Ct', 'Palm Beach Gardens', 'FL', '33403', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-01-07T00:00:00.000Z', '2025-01-13T00:00:00.000Z', '2025-01-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209079971375690', 'asana', 'ORD-1209079971375690',
  '16905 SE 248th Ter', 'Umatilla', 'FL', '16905', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-01-03T00:00:00.000Z', '2025-01-10T00:00:00.000Z', '2025-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209076777830254', 'asana', 'ORD-1209076777830254',
  '8260 SW 41st Place Rd', 'Ocala', 'FL', '34481', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-01-03T00:00:00.000Z', '2025-01-08T00:00:00.000Z', '2025-01-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209072464164318', 'asana', 'ORD-1209072464164318',
  '8311 Millwood Dr', 'Tampa', 'FL', '33615', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-01-02T00:00:00.000Z', '2025-01-08T00:00:00.000Z', '2025-01-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209062026691110', 'asana', 'ORD-1209062026691110',
  '804 Northeast 24th Street', 'Gainseville', 'FL', '32641', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2024-12-30T00:00:00.000Z', '2025-01-07T00:00:00.000Z', '2025-01-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209054319756590', 'asana', 'ORD-1209054319756590',
  '4902 briar Oak Circle', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-12-27T00:00:00.000Z', '2025-01-03T00:00:00.000Z', '2025-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'partnership', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209053646128704', 'asana', 'ORD-1209053646128704',
  '21343 SE 142ND PL', 'Umatilla', 'FL', '21343', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-12-27T00:00:00.000Z', '2025-01-07T00:00:00.000Z', '2025-01-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209053019748140', 'asana', 'ORD-1209053019748140',
  '1526 Lakewood Road', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-12-27T00:00:00.000Z', '2024-12-31T00:00:00.000Z', '2025-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209049479033077', 'asana', 'ORD-1209049479033077',
  '21 Seaside Court Holmes', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-12-26T00:00:00.000Z', '2025-01-02T00:00:00.000Z', '2025-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209048943710685', 'asana', 'ORD-1209048943710685',
  '40949 State Road 19', 'Umatilla', 'FL', '40949', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-12-26T00:00:00.000Z', '2024-12-27T00:00:00.000Z', '2024-12-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209038428733626', 'asana', 'ORD-1209038428733626',
  '15133 87th Trail N', 'West Palm Beach', 'FL', '15133', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2024-12-23T00:00:00.000Z', '2024-12-27T00:00:00.000Z', '2025-01-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209037961061323', 'asana', 'ORD-1209037961061323',
  '2842 LINGO LN', 'ORLANDO', 'FL', '32822', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-23T00:00:00.000Z', '2024-12-30T00:00:00.000Z', '2024-12-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209027535332108', 'asana', 'ORD-1209027535332108',
  '4041 Sonoma Blvd', 'Kissimmee', 'FL', '34741', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-12-20T00:00:00.000Z', '2024-12-27T00:00:00.000Z', '2024-12-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209025108476477', 'asana', 'ORD-1209025108476477',
  '1524 Foggy Ridge Pkwy', 'Lutz', 'FL', '33559', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2024-12-20T00:00:00.000Z', '2024-12-27T00:00:00.000Z', '2024-12-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209018339005770', 'asana', 'ORD-1209018339005770',
  '4157 VERSAILLES DR', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-12-19T00:00:00.000Z', '2024-12-23T00:00:00.000Z', '2024-12-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209010566581253', 'asana', 'ORD-1209010566581253',
  '5908 Edgewater Terrace', 'Sebring', 'FL', '33876', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 200, 200,
  'completed', 'normal', 'refinance',
  '2024-12-18T00:00:00.000Z', '2024-12-20T00:00:00.000Z', '2024-12-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209008548855399', 'asana', 'ORD-1209008548855399',
  '10215 Tarpon Drive Treasure', 'Island', 'FL', '10215', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-12-18T00:00:00.000Z', '2024-12-26T00:00:00.000Z', '2024-12-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209006966078368', 'asana', 'ORD-1209006966078368',
  '4362 SEVEN CANYONS DR', 'KISSIMMEE', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-18T00:00:00.000Z', '2024-12-26T00:00:00.000Z', '2024-12-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208999678647592', 'asana', 'ORD-1208999678647592',
  '1942 SPRING SHOWER CIRCLE', 'Kissimmee', 'FL', '34744', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-12-17T00:00:00.000Z', '2024-12-19T00:00:00.000Z', '2024-12-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208971117241962', 'asana', 'ORD-1208971117241962',
  '3510 SW Voyager St', 'Port St. Lucie', 'FL', '34953', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-19T00:00:00.000Z', '2024-12-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208971101255425', 'asana', 'ORD-1208971101255425',
  '2514 Canterbury Dr N', 'Riviera Beach', 'FL', '33407', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-19T00:00:00.000Z', '2024-12-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490819', 'asana', 'ORD-1208960853490819',
  '21 Locust Course Radial', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490811', 'asana', 'ORD-1208960853490811',
  '9 Ash Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490803', 'asana', 'ORD-1208960853490803',
  '134 Dogwood Dr Cir', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490789', 'asana', 'ORD-1208960853490789',
  '67 Dogwood Dr Loop Ocala', '34472', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490785', 'asana', 'ORD-1208960853490785',
  '11 Dogwood Trail Ct', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490777', 'asana', 'ORD-1208960853490777',
  '34 Laurel Ct', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208960853490769', 'asana', 'ORD-1208960853490769',
  '66 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208969744632278', 'asana', 'ORD-1208969744632278',
  '13473 SW 60th Avenue Rd', 'Ocala', 'FL', '13473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208969576430655', 'asana', 'ORD-1208969576430655',
  '7 Oak Run Pl', 'Ocala', 'FL', '34471', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-18T00:00:00.000Z', '2024-12-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208969688253305', 'asana', 'ORD-1208969688253305',
  '244 Tanager Ave', 'Sebring', 'FL', '33870', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-12-12T00:00:00.000Z', '2024-12-19T00:00:00.000Z', '2024-12-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208948606754096', 'asana', 'ORD-1208948606754096',
  '463 85th Ave', 'St Pete Beach', 'FL', '33706', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-12-10T00:00:00.000Z', '2024-12-17T00:00:00.000Z', '2024-12-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208938325376971', 'asana', 'ORD-1208938325376971',
  '4790 Drummond Ln', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-12-09T00:00:00.000Z', '2024-12-13T00:00:00.000Z', '2024-12-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208904915813396', 'asana', 'ORD-1208904915813396',
  '8598 SE 163rd Pl', 'Summerfield', 'FL', '34491', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-12-04T00:00:00.000Z', '2024-12-10T00:00:00.000Z', '2024-12-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208896773884089', 'asana', 'ORD-1208896773884089',
  '8324 DIAMOND COVE CIR', 'ORLANDO', 'FL', '32836', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-12-03T00:00:00.000Z', '2024-12-09T00:00:00.000Z', '2024-12-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Ascertain Market Value', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208895979459309', 'asana', 'ORD-1208895979459309',
  '555 7th St S', 'Safety Harbor', 'FL', '34695', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-12-03T00:00:00.000Z', '2024-12-10T00:00:00.000Z', '2024-12-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208894246739075', 'asana', 'ORD-1208894246739075',
  '1391 Sea Gull Dr S', 'St. Petersburg', 'FL', '33707', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-12-03T00:00:00.000Z', '2024-12-10T00:00:00.000Z', '2024-12-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208881180338982', 'asana', 'ORD-1208881180338982',
  '2 Dogwood Drive Run', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-02T00:00:00.000Z', '2024-12-12T00:00:00.000Z', '2024-12-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208888314931975', 'asana', 'ORD-1208888314931975',
  '6184 NW 67th Ave', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-02T00:00:00.000Z', '2024-12-12T00:00:00.000Z', '2024-12-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208888020861830', 'asana', 'ORD-1208888020861830',
  '1550 E Bay St', 'Bartow', 'FL', '33830', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-02T00:00:00.000Z', '2024-12-12T00:00:00.000Z', '2024-12-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208887840883856', 'asana', 'ORD-1208887840883856',
  '1288 SE 32nd St', 'Ocala', 'FL', '34471', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-02T00:00:00.000Z', '2024-12-12T00:00:00.000Z', '2024-12-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208887543914118', 'asana', 'ORD-1208887543914118',
  '38 Juniper Loop Cir', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-12-02T00:00:00.000Z', '2024-12-12T00:00:00.000Z', '2024-12-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208842663961957', 'asana', 'ORD-1208842663961957',
  '991 Almond Tree Cir', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2024-11-25T00:00:00.000Z', '2024-11-26T00:00:00.000Z', '2024-12-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'HELOC', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208840009524188', 'asana', 'ORD-1208840009524188',
  '13812 Mattix Avenue', 'Hudson', 'FL', '13812', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-25T00:00:00.000Z', '2024-12-03T00:00:00.000Z', '2024-11-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208831977026860', 'asana', 'ORD-1208831977026860',
  '2167 Blake Way', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 328, 328,
  'completed', 'normal', 'refinance',
  '2024-11-24T00:00:00.000Z', '2024-11-29T00:00:00.000Z', '2024-11-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208828830289365', 'asana', 'ORD-1208828830289365',
  '713 Aspen Rd', 'West Palm Beach', 'FL', '33409', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-11-22T00:00:00.000Z', '2024-12-02T00:00:00.000Z', '2024-12-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208828874903598', 'asana', 'ORD-1208828874903598',
  '4949 Spiral Way', 'Saint Cloud', 'FL', '34771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-11-22T00:00:00.000Z', '2024-11-29T00:00:00.000Z', '2024-11-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208827305097676', 'asana', 'ORD-1208827305097676',
  '6021 CANDLEWOOD LN', 'ORLANDOFL32809', 'FL', '32809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-11-22T00:00:00.000Z', '2024-11-29T00:00:00.000Z', '2024-11-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208827208941080', 'asana', 'ORD-1208827208941080',
  '542 Estates Pl', 'LongwoodFL32779', 'FL', '32779', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-11-22T00:00:00.000Z', '2024-11-29T00:00:00.000Z', '2024-11-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208821870128434', 'asana', 'ORD-1208821870128434',
  '16333 SE 81st Terrace', 'Summerfield', 'FL', '16333', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-11-21T00:00:00.000Z', '2024-12-03T00:00:00.000Z', '2024-12-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208821169541132', 'asana', 'ORD-1208821169541132',
  '13068 SUNRISE HARVEST AVE WINTER', 'GARDEN', 'FL', '13068', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-11-21T00:00:00.000Z', '2024-11-22T00:00:00.000Z', '2024-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208820546760045', 'asana', 'ORD-1208820546760045',
  '2923 W Averill Ave', 'Tampa', 'FL', '33611', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-11-21T00:00:00.000Z', '2024-11-28T00:00:00.000Z', '2024-12-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208819564292669', 'asana', 'ORD-1208819564292669',
  '113 Milestone Dr', 'Haines City', 'FL', '33844', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-11-21T00:00:00.000Z', '2024-11-26T00:00:00.000Z', '2024-11-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208812709974346', 'asana', 'ORD-1208812709974346',
  '40949 State Road 19', 'Umatilla', 'FL', '40949', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-11-20T00:00:00.000Z', '2024-12-03T00:00:00.000Z', '2024-12-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208810709210798', 'asana', 'ORD-1208810709210798',
  '4660 Old Polk City Rd', 'Lakeland', 'FL', '33809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-11-20T00:00:00.000Z', '2024-11-27T00:00:00.000Z', '2024-11-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208801896006930', 'asana', 'ORD-1208801896006930',
  '860 N ORANGE AVE', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-11-19T00:00:00.000Z', '2024-11-25T00:00:00.000Z', '2024-11-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208800999452145', 'asana', 'ORD-1208800999452145',
  '8356 Jacaranda Avenue', 'Seminole', 'FL', '33777', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-11-19T00:00:00.000Z', '2024-11-25T00:00:00.000Z', '2024-11-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208800467680549', 'asana', 'ORD-1208800467680549',
  '8050 Hoboh Ln', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-19T00:00:00.000Z', '2024-12-09T00:00:00.000Z', '2024-12-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208791503971964', 'asana', 'ORD-1208791503971964',
  '50 W 12th St', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-22T00:00:00.000Z', '2024-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208791503971950', 'asana', 'ORD-1208791503971950',
  '44 W 12th St', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-22T00:00:00.000Z', '2024-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208792228368088', 'asana', 'ORD-1208792228368088',
  '40 W 12th St', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-22T00:00:00.000Z', '2024-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208791133533263', 'asana', 'ORD-1208791133533263',
  '1526 Lakewood Rd', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-25T00:00:00.000Z', '2024-11-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'USDA',
  NULL,
  'bill', 'bid_request', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208790665509480', 'asana', 'ORD-1208790665509480',
  '4408 W Varn Ave', 'Tampa', 'FL', '33616', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-25T00:00:00.000Z', '2024-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208790325091779', 'asana', 'ORD-1208790325091779',
  '1015 Fantasy Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Elite Valuations' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-11-18T00:00:00.000Z', '2024-11-22T00:00:00.000Z', '2024-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208779008384601', 'asana', 'ORD-1208779008384601',
  '325 Edwin Ave', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 200, 200,
  'completed', 'normal', 'refinance',
  '2024-11-15T00:00:00.000Z', '2024-11-21T00:00:00.000Z', '2024-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208743421327333', 'asana', 'ORD-1208743421327333',
  '5511 Clearview Dr', 'Orlando', 'FL', '32819', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-11-11T00:00:00.000Z', '2024-11-15T00:00:00.000Z', '2024-11-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208729287865900', 'asana', 'ORD-1208729287865900',
  '7760 Sandy Ridge Drive # 116', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-11-08T00:00:00.000Z', '2024-11-08T00:00:00.000Z', '2024-11-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208719547031469', 'asana', 'ORD-1208719547031469',
  '407 Ulelah Avenue', 'FL Palm Harbor', 'FL', '34683', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-11-07T00:00:00.000Z', '2024-11-07T00:00:00.000Z', '2024-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208719414513465', 'asana', 'ORD-1208719414513465',
  '4604 South Shore Road', 'Orlando', 'FL', '32839', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-11-07T00:00:00.000Z', '2024-11-14T00:00:00.000Z', '2024-11-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208700972093258', 'asana', 'ORD-1208700972093258',
  '5954 Churchill Square Way', 'Groveland', 'FL', '34736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-11-05T00:00:00.000Z', '2024-11-11T00:00:00.000Z', '2024-11-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208693280856616', 'asana', 'ORD-1208693280856616',
  '2621 21st Pl SW', 'Largo', 'FL', '33774', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-11-04T00:00:00.000Z', '2024-11-18T00:00:00.000Z', '2024-11-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208692772211109', 'asana', 'ORD-1208692772211109',
  '13068 SUNRISE HARVEST AVE WINTER', 'GARDEN', 'FL', '13068', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-11-04T00:00:00.000Z', '2024-11-11T00:00:00.000Z', '2024-11-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208679473823700', 'asana', 'ORD-1208679473823700',
  '208 Palm Way', 'Tavares', 'FL', '32778', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-11-01T00:00:00.000Z', '2024-11-07T00:00:00.000Z', '2024-11-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Divorce', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208677561547944', 'asana', 'ORD-1208677561547944',
  '1316 Olympia Park Cir', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-11-01T00:00:00.000Z', '2024-11-07T00:00:00.000Z', '2024-11-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208671675115554', 'asana', 'ORD-1208671675115554',
  '800 N Shore Dr', 'Leesburg', 'FL', '34748', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-10-31T00:00:00.000Z', '2024-11-07T00:00:00.000Z', '2024-11-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208671535977182', 'asana', 'ORD-1208671535977182',
  '72 BARLOW ST', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-31T00:00:00.000Z', '2024-11-05T00:00:00.000Z', '2024-11-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208664957598155', 'asana', 'ORD-1208664957598155',
  '5827 Legacy Crescent Pl', 'Unit 302 Riverview', 'FL', '33578', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 125, 125,
  'completed', 'normal', 'refinance',
  '2024-10-30T00:00:00.000Z', '2024-10-30T00:00:00.000Z', '2024-11-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208663756948306', 'asana', 'ORD-1208663756948306',
  '6075 WAUCHULA RD', 'Myakka City', 'FL', '34251', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-10-30T00:00:00.000Z', '2024-11-08T00:00:00.000Z', '2024-11-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208662699071800', 'asana', 'ORD-1208662699071800',
  '7935 CARMEN RENE WAY', 'The Villages', 'FL', '34762', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2024-10-30T00:00:00.000Z', '2024-11-01T00:00:00.000Z', '2024-10-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208662312199770', 'asana', 'ORD-1208662312199770',
  '8075 John Hancock Dr Winter', 'GardenFL34787', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-10-30T00:00:00.000Z', '2024-11-04T00:00:00.000Z', '2024-11-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208643435206145', 'asana', 'ORD-1208643435206145',
  '2023 Blackbird Dr', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-10-28T00:00:00.000Z', '2024-11-06T00:00:00.000Z', '2024-11-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208628746026451', 'asana', 'ORD-1208628746026451',
  '9299 Westside Hills Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-25T00:00:00.000Z', '2024-11-01T00:00:00.000Z', '2024-11-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208604658242805', 'asana', 'ORD-1208604658242805',
  '11539 Audubond Ln', 'Clermont', 'FL', '11539', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-10-22T00:00:00.000Z', '2024-10-30T00:00:00.000Z', '2024-10-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208595968466489', 'asana', 'ORD-1208595968466489',
  '2515 Cedar Rose St', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-25T00:00:00.000Z', '2024-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208590981843180', 'asana', 'ORD-1208590981843180',
  '6319 Crete Court', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-24T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208594846219752', 'asana', 'ORD-1208594846219752',
  '860 N ORANGE AVE', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-24T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208593951234275', 'asana', 'ORD-1208593951234275',
  '4 Cedar Run', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-28T00:00:00.000Z', '2024-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208593437230341', 'asana', 'ORD-1208593437230341',
  '505 S SUMMERLIN AVE', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-24T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208593255300751', 'asana', 'ORD-1208593255300751',
  '3012 Chelsea St', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-24T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208593083115849', 'asana', 'ORD-1208593083115849',
  '2217 Howard Dr Winter', 'Park', 'FL', '32789', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-23T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208591225283263', 'asana', 'ORD-1208591225283263',
  '22 Hemlock Radial Ln', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-21T00:00:00.000Z', '2024-10-25T00:00:00.000Z', '2024-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208580108016553', 'asana', 'ORD-1208580108016553',
  '472 Wedgefield Dr Spring', 'Hill', 'FL', '34609', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2024-10-18T00:00:00.000Z', '2024-10-23T00:00:00.000Z', '2024-10-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208579793727827', 'asana', 'ORD-1208579793727827',
  '5636 Chukar dr', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2024-10-18T00:00:00.000Z', '2024-10-23T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208570977489959', 'asana', 'ORD-1208570977489959',
  '13053 SW 73rd Court Rd', 'Ocala', 'FL', '13053', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-17T00:00:00.000Z', '2024-10-28T00:00:00.000Z', '2024-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208568412306197', 'asana', 'ORD-1208568412306197',
  '2559 Comet Ln', 'North Port', 'FL', '34286', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-10-17T00:00:00.000Z', '2024-10-23T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208562867592268', 'asana', 'ORD-1208562867592268',
  '2405 BANCHORY RD Winter', 'Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-16T00:00:00.000Z', '2024-10-21T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208562679165155', 'asana', 'ORD-1208562679165155',
  '233 Council Bluffs Dr', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2024-10-16T00:00:00.000Z', '2024-10-22T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208561660159692', 'asana', 'ORD-1208561660159692',
  '345 West Hornbeam Drive', 'Longwood', 'FL', '32779', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-10-16T00:00:00.000Z', '2024-10-17T00:00:00.000Z', '2024-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Acquisition', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208556036101553', 'asana', 'ORD-1208556036101553',
  '3012 Chelsea St', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-15T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208556036101543', 'asana', 'ORD-1208556036101543',
  '860 N ORANGE AVE', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-15T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208555637430753', 'asana', 'ORD-1208555637430753',
  '4324 AETNA DR', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-10-15T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208552819476821', 'asana', 'ORD-1208552819476821',
  '6470 BETHEL ST', 'COCOA', 'FL', '32927', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-15T00:00:00.000Z', '2024-10-15T00:00:00.000Z', '2024-11-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208552643684128', 'asana', 'ORD-1208552643684128',
  '385 APOPKA HILLS CIR', 'APOPKA', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-10-15T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208544203960289', 'asana', 'ORD-1208544203960289',
  '502 Alcazar Ct', 'Lady Lake', 'FL', '32159', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 260, 260,
  'completed', 'normal', 'refinance',
  '2024-10-14T00:00:00.000Z', '2024-10-17T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208544045791007', 'asana', 'ORD-1208544045791007',
  '712 Ridge Club Dr Unit 39', 'Melbourne', 'FL', '32934', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Rapid Appraisal Management System' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-10-14T00:00:00.000Z', '2024-10-16T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208543919370196', 'asana', 'ORD-1208543919370196',
  '3326 Albatross Ave', 'Sebring', 'FL', '33875', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-14T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208543844609460', 'asana', 'ORD-1208543844609460',
  '3320 Albatross Ave', 'Sebring', 'FL', '33875', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-14T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208532873636121', 'asana', 'ORD-1208532873636121',
  'Lot 1 816 South Central Avenue', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 975, 975,
  'completed', 'normal', 'refinance',
  '2024-10-11T00:00:00.000Z', '2024-10-17T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208531831912615', 'asana', 'ORD-1208531831912615',
  '205 SHADY PL Daytona', 'Beach', 'FL', '32114', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2024-10-11T00:00:00.000Z', '2024-10-17T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208524761107213', 'asana', 'ORD-1208524761107213',
  '2437 Park Ridge St', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-10-10T00:00:00.000Z', '2024-10-11T00:00:00.000Z', '2024-10-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208523342266133', 'asana', 'ORD-1208523342266133',
  '208 Faye St', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Elite Valuations' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2024-10-10T00:00:00.000Z', '2024-10-18T00:00:00.000Z', '2024-10-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208522497040715', 'asana', 'ORD-1208522497040715',
  '5804 LACONIA RD', 'ORLANDO', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-10-10T00:00:00.000Z', '2024-10-17T00:00:00.000Z', '2024-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208470864089930', 'asana', 'ORD-1208470864089930',
  '3045 Dove Ln', 'Mulberry', 'FL', '33860', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-10-03T00:00:00.000Z', '2024-10-08T00:00:00.000Z', '2024-10-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208461774779530', 'asana', 'ORD-1208461774779530',
  '230 SW 2nd Ave APT 212', 'Gainesville', 'FL', '32601', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-10-02T00:00:00.000Z', '2024-10-09T00:00:00.000Z', '2024-10-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208452269790551', 'asana', 'ORD-1208452269790551',
  '220 NW 28TH ST', 'OCALA', 'FL', '34475', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 194, 194,
  'completed', 'normal', 'refinance',
  '2024-10-01T00:00:00.000Z', '2024-10-16T00:00:00.000Z', '2024-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208451255470366', 'asana', 'ORD-1208451255470366',
  '3482 Dawn Ave', 'Kissimmee', 'FL', '34744', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-10-01T00:00:00.000Z', '2024-10-08T00:00:00.000Z', '2024-10-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208450654820500', 'asana', 'ORD-1208450654820500',
  '2751 Sydelle St', 'Sarasota', 'FL', '34237', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-10-01T00:00:00.000Z', '2024-10-08T00:00:00.000Z', '2024-10-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208442168862679', 'asana', 'ORD-1208442168862679',
  '472 Wedgefield Dr Spring', 'Hill', 'FL', '34609', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 125, 125,
  'completed', 'normal', 'refinance',
  '2024-09-30T00:00:00.000Z', '2024-10-04T00:00:00.000Z', '2024-10-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208420592889336', 'asana', 'ORD-1208420592889336',
  '7935 CARMEN RENE WAY', 'The Villages', 'FL', '34762', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2024-09-27T00:00:00.000Z', '2024-10-03T00:00:00.000Z', '2024-10-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208413585408699', 'asana', 'ORD-1208413585408699',
  '101 Markham Court', 'Longwood', 'FL', '32779', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-09-26T00:00:00.000Z', '2024-10-02T00:00:00.000Z', '2024-10-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208413161485986', 'asana', 'ORD-1208413161485986',
  '386 RIGGS CIR', 'DAVENPORT', 'FL', '33897', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-09-26T00:00:00.000Z', '2024-10-03T00:00:00.000Z', '2024-10-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208404442175843', 'asana', 'ORD-1208404442175843',
  '1020 Woodsong Way', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2024-09-25T00:00:00.000Z', '2024-10-01T00:00:00.000Z', '2024-10-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208394511779480', 'asana', 'ORD-1208394511779480',
  '1176 BRAMPTON PL', 'Heathrow', 'FL', '32746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 394, 394,
  'completed', 'normal', 'refinance',
  '2024-09-24T00:00:00.000Z', '2024-09-27T00:00:00.000Z', '2024-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208393200678270', 'asana', 'ORD-1208393200678270',
  '725 NEUMANN VILLAGE CT', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-09-24T00:00:00.000Z', '2024-09-27T00:00:00.000Z', '2024-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208365261356365', 'asana', 'ORD-1208365261356365',
  '31201 Merry Rd', 'Tavares', 'FL', '31201', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-09-20T00:00:00.000Z', '2024-09-26T00:00:00.000Z', '2024-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208362365124758', 'asana', 'ORD-1208362365124758',
  '2539 Bates Ave', 'Eustis', 'FL', '32726', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-09-20T00:00:00.000Z', '2024-09-26T00:00:00.000Z', '2024-10-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208356544901093', 'asana', 'ORD-1208356544901093',
  '5114 Keith Pl', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 720, 720,
  'completed', 'normal', 'refinance',
  '2024-09-19T00:00:00.000Z', '2024-09-24T00:00:00.000Z', '2024-09-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208356377413930', 'asana', 'ORD-1208356377413930',
  '2005 Anglers Cv Vero', 'Beach', 'FL', '32963', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-09-19T00:00:00.000Z', '2024-09-24T00:00:00.000Z', '2024-09-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208352964774822', 'asana', 'ORD-1208352964774822',
  '5636 Chukar dr', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-09-19T00:00:00.000Z', '2024-09-27T00:00:00.000Z', '2024-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208347060571391', 'asana', 'ORD-1208347060571391',
  '35202 PINEGATE TRL', 'Eustis', 'FL', '35202', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-09-18T00:00:00.000Z', '2024-09-24T00:00:00.000Z', '2024-09-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208346051853398', 'asana', 'ORD-1208346051853398',
  '341 HAMMOND ST', 'NEW SMYRNA BEACH', 'FL', '32168', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-09-18T00:00:00.000Z', '2024-09-26T00:00:00.000Z', '2024-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208344796364035', 'asana', 'ORD-1208344796364035',
  '309 S 4th St', 'Cocoa Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-09-18T00:00:00.000Z', '2024-09-23T00:00:00.000Z', '2024-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Pre-Listing', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208344570376366', 'asana', 'ORD-1208344570376366',
  '4104 Warwick Hills Drive Wesley', 'Chapel', 'FL', '33543', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-09-18T00:00:00.000Z', '2024-09-24T00:00:00.000Z', '2024-09-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208337297451392', 'asana', 'ORD-1208337297451392',
  '519 Cadiz Dr', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-09-17T00:00:00.000Z', '2024-09-25T00:00:00.000Z', '2024-09-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208327716230229', 'asana', 'ORD-1208327716230229',
  '233 Council Bluffs Dr', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-09-16T00:00:00.000Z', '2024-09-23T00:00:00.000Z', '2024-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208327526618570', 'asana', 'ORD-1208327526618570',
  '15404 Heron Hideaway Cir', 'Winter Garden', 'FL', '15404', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 275, 275,
  'completed', 'normal', 'refinance',
  '2024-09-16T00:00:00.000Z', '2024-09-19T00:00:00.000Z', '2024-09-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208308278350410', 'asana', 'ORD-1208308278350410',
  '6627 Queens Borough Ave #207', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-09-13T00:00:00.000Z', '2024-09-19T00:00:00.000Z', '2024-09-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'feedback', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208307056614764', 'asana', 'ORD-1208307056614764',
  '1609 E Yonge St', 'Pensacola', 'FL', '32503', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-09-13T00:00:00.000Z', '2024-09-25T00:00:00.000Z', '2024-09-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208304701485431', 'asana', 'ORD-1208304701485431',
  '2608 Hoover Dr', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-09-13T00:00:00.000Z', '2024-09-23T00:00:00.000Z', '2024-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208287356563407', 'asana', 'ORD-1208287356563407',
  '306 LEMON ST', 'Maitland', 'FL', '32751', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-09-11T00:00:00.000Z', '2024-09-17T00:00:00.000Z', '2024-09-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208287074275810', 'asana', 'ORD-1208287074275810',
  '1731 TWIN LAKE DR', 'Gotha', 'FL', '34734', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-09-11T00:00:00.000Z', '2024-09-18T00:00:00.000Z', '2024-09-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208278136104136', 'asana', 'ORD-1208278136104136',
  '10 Cedar Trace', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-09-10T00:00:00.000Z', '2024-09-17T00:00:00.000Z', '2024-09-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208273569042732', 'asana', 'ORD-1208273569042732',
  '712 Ridge Club Dr', 'Melbourne', 'FL', '32934', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Rapid Appraisal Management System' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2024-09-10T00:00:00.000Z', '2024-09-16T00:00:00.000Z', '2024-09-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'feedback', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208273152297145', 'asana', 'ORD-1208273152297145',
  '1016 W 8TH ST', 'SANFORD', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-09-10T00:00:00.000Z', '2024-09-18T00:00:00.000Z', '2024-09-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'feedback', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208240913833648', 'asana', 'ORD-1208240913833648',
  '1213 BRAMPTON PL', 'LAKE MARY', 'FL', '32746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 720, 720,
  'completed', 'normal', 'refinance',
  '2024-09-05T00:00:00.000Z', '2024-09-12T00:00:00.000Z', '2024-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'feedback', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208239399817736', 'asana', 'ORD-1208239399817736',
  '450 S Gulfview Blvd 504', 'Clearwater', 'FL', '33767', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2024-09-05T00:00:00.000Z', '2024-09-09T00:00:00.000Z', '2024-09-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208230377234788', 'asana', 'ORD-1208230377234788',
  '302 BROADWAY ST # 240', 'OCALA', 'FL', '34471', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 620, 620,
  'completed', 'normal', 'refinance',
  '2024-09-04T00:00:00.000Z', '2024-09-12T00:00:00.000Z', '2024-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208229491564188', 'asana', 'ORD-1208229491564188',
  '14320 North Berwick Court', 'Orlando', 'FL', '14320', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 295, 295,
  'completed', 'normal', 'refinance',
  '2024-09-04T00:00:00.000Z', '2024-09-05T00:00:00.000Z', '2024-09-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208186204100798', 'asana', 'ORD-1208186204100798',
  '13516 LARANJA STREET', 'Clermont', 'FL', '13516', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 418, 418,
  'completed', 'normal', 'refinance',
  '2024-08-29T00:00:00.000Z', '2024-09-11T00:00:00.000Z', '2024-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208185871945069', 'asana', 'ORD-1208185871945069',
  '14501 Grove Resort Ave', '3110', 'FL', '14501', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-08-29T00:00:00.000Z', '2024-08-29T00:00:00.000Z', '2024-09-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208186310610351', 'asana', 'ORD-1208186310610351',
  '421 West Highbanks Road   DeBary', 'Florida  32713', 'FL', '32713', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-08-29T00:00:00.000Z', '2024-08-30T00:00:00.000Z', '2024-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'LAND',
  NULL,
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208183718549005', 'asana', 'ORD-1208183718549005',
  '220 NW 28TH ST', 'OCALA', 'FL', '34475', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-08-29T00:00:00.000Z', '2024-09-10T00:00:00.000Z', '2024-09-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208173255762646', 'asana', 'ORD-1208173255762646',
  '7335 BENT GRASS DR', 'WINTER HAVEN', 'FL', '33884', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 720, 720,
  'completed', 'normal', 'refinance',
  '2024-08-28T00:00:00.000Z', '2024-09-05T00:00:00.000Z', '2024-09-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208173014324960', 'asana', 'ORD-1208173014324960',
  '1420 WACO BLVD', 'PALM BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 720, 720,
  'completed', 'normal', 'refinance',
  '2024-08-28T00:00:00.000Z', '2024-08-30T00:00:00.000Z', '2024-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208170934062679', 'asana', 'ORD-1208170934062679',
  '950 20th St', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-28T00:00:00.000Z', '2024-09-03T00:00:00.000Z', '2024-09-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208162556994755', 'asana', 'ORD-1208162556994755',
  '4453 SHUMARD OAK CT', 'ORLANDO', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 620, 620,
  'completed', 'normal', 'refinance',
  '2024-08-27T00:00:00.000Z', '2024-09-04T00:00:00.000Z', '2024-09-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208162043783518', 'asana', 'ORD-1208162043783518',
  '3426 GRANT BLVD', 'ORLANDO', 'FL', '32804', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 495, 495,
  'completed', 'normal', 'refinance',
  '2024-08-27T00:00:00.000Z', '2024-09-04T00:00:00.000Z', '2024-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208152683666901', 'asana', 'ORD-1208152683666901',
  '1160 36th Ave N', 'St. Petersburg', 'FL', '33704', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-26T00:00:00.000Z', '2024-09-03T00:00:00.000Z', '2024-09-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208129687903372', 'asana', 'ORD-1208129687903372',
  '1725 Stacey Dr Mount', 'dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Atlas VMS' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-22T00:00:00.000Z', '2024-08-27T00:00:00.000Z', '2024-09-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208128281768777', 'asana', 'ORD-1208128281768777',
  '138 West Northside Drive Lake', 'Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-08-22T00:00:00.000Z', '2024-08-30T00:00:00.000Z', '2024-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208127176893749', 'asana', 'ORD-1208127176893749',
  '12693 135th St', 'Largo', 'FL', '12693', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-22T00:00:00.000Z', '2024-08-30T00:00:00.000Z', '2024-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208115137238550', 'asana', 'ORD-1208115137238550',
  '1460 ROYAL FOREST LOOP', 'LAKELAND', 'FL', '33811', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-21T00:00:00.000Z', '2024-08-26T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208107796749770', 'asana', 'ORD-1208107796749770',
  '2205 AMBERLY AVE', 'ORLANDO', 'FL', '32833', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-08-20T00:00:00.000Z', '2024-08-28T00:00:00.000Z', '2024-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208107677500594', 'asana', 'ORD-1208107677500594',
  '2254 AMBERLY AVE', 'ORLANDO', 'FL', '32833', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-08-20T00:00:00.000Z', '2024-08-28T00:00:00.000Z', '2024-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208094079665355', 'asana', 'ORD-1208094079665355',
  '128 Adriatic Ave', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-20T00:00:00.000Z', '2024-08-28T00:00:00.000Z', '2024-08-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208105395267814', 'asana', 'ORD-1208105395267814',
  '130 Adriatic Ave', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-20T00:00:00.000Z', '2024-08-28T00:00:00.000Z', '2024-08-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208094079665172', 'asana', 'ORD-1208094079665172',
  '1517 E 27th Street', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-08-19T00:00:00.000Z', '2024-08-22T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208095539803846', 'asana', 'ORD-1208095539803846',
  '1515 E 27th Street', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-08-19T00:00:00.000Z', '2024-08-22T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208094232226868', 'asana', 'ORD-1208094232226868',
  '7314 Windsor Ln', 'Clearwater', 'FL', '33764', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-19T00:00:00.000Z', '2024-08-27T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208092877549713', 'asana', 'ORD-1208092877549713',
  '12260 Eldon Dr', 'Largo', 'FL', '12260', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-19T00:00:00.000Z', '2024-08-27T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208080262353201', 'asana', 'ORD-1208080262353201',
  '39 Redwood Track Run', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-16T00:00:00.000Z', '2024-08-27T00:00:00.000Z', '2024-08-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208079392862612', 'asana', 'ORD-1208079392862612',
  '334 Gravina Pt', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 200, 200,
  'completed', 'normal', 'refinance',
  '2024-08-16T00:00:00.000Z', '2024-08-20T00:00:00.000Z', '2024-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'new_client', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208079574321287', 'asana', 'ORD-1208079574321287',
  '14342 Lake Pickett Rd', 'Orlando', 'FL', '14342', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-08-16T00:00:00.000Z', '2024-08-23T00:00:00.000Z', '2024-08-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208068750870610', 'asana', 'ORD-1208068750870610',
  '2114 W Southview Ave', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 1500, 1500,
  'completed', 'normal', 'refinance',
  '2024-08-15T00:00:00.000Z', '2024-08-21T00:00:00.000Z', '2024-08-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208066549589365', 'asana', 'ORD-1208066549589365',
  'Lot 305 Coyote Creek Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 125, 125,
  'completed', 'normal', 'refinance',
  '2024-08-15T00:00:00.000Z', '2024-08-27T00:00:00.000Z', '2024-08-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208059775798870', 'asana', 'ORD-1208059775798870',
  '303 E Fountain St', 'Fruitland Park', 'FL', '34731', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-14T00:00:00.000Z', '2024-08-29T00:00:00.000Z', '2024-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'REO', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208058554106440', 'asana', 'ORD-1208058554106440',
  '13143 Oulton Circle', 'Orlando', 'FL', '13143', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Rapid Appraisal Management System' LIMIT 1), 410, 410,
  'completed', 'normal', 'refinance',
  '2024-08-14T00:00:00.000Z', '2024-08-19T00:00:00.000Z', '2024-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208057261898182', 'asana', 'ORD-1208057261898182',
  '2914 Summer Swan Dr', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-08-14T00:00:00.000Z', '2024-08-20T00:00:00.000Z', '2024-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Ascertain Market Value', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208049580602860', 'asana', 'ORD-1208049580602860',
  'LOT 32 SW CARDINAL AVE', 'Dunnellon', 'FL', '34431', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-08-13T00:00:00.000Z', '2024-08-20T00:00:00.000Z', '2024-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'LAND',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208048676104597', 'asana', 'ORD-1208048676104597',
  '605 Westchester Ave', 'Melbourne', 'FL', '32935', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-13T00:00:00.000Z', '2024-08-22T00:00:00.000Z', '2024-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208048363043667', 'asana', 'ORD-1208048363043667',
  '1393 Murells Inlet Loop The', 'Villages', 'FL', '32162', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-08-13T00:00:00.000Z', '2024-08-22T00:00:00.000Z', '2024-08-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208038891781309', 'asana', 'ORD-1208038891781309',
  '2524 30th Ave E', 'Bradenton', 'FL', '34208', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-08-12T00:00:00.000Z', '2024-08-21T00:00:00.000Z', '2024-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208036153736381', 'asana', 'ORD-1208036153736381',
  '5908 Edgewater Terrace', 'Sebring', 'FL', '33876', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-08-12T00:00:00.000Z', '2024-08-16T00:00:00.000Z', '2024-08-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208024915481971', 'asana', 'ORD-1208024915481971',
  '11318 NATHANIEL DR', 'ORLANDO', 'FL', '11318', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 97, 97,
  'completed', 'normal', 'refinance',
  '2024-08-09T00:00:00.000Z', '2024-08-19T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208024915481961', 'asana', 'ORD-1208024915481961',
  '11318 NATHANIEL DR', 'ORLANDO', 'FL', '11318', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 97, 97,
  'completed', 'normal', 'refinance',
  '2024-08-09T00:00:00.000Z', '2024-08-19T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208024915337195', 'asana', 'ORD-1208024915337195',
  '11312 NATHANIEL DR', 'ORLANDO', 'FL', '11312', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 97, 97,
  'completed', 'normal', 'refinance',
  '2024-08-09T00:00:00.000Z', '2024-08-19T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208024624351130', 'asana', 'ORD-1208024624351130',
  '11306 NATHANIEL DR', 'ORLANDO', 'FL', '11306', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 97, 97,
  'completed', 'normal', 'refinance',
  '2024-08-09T00:00:00.000Z', '2024-08-19T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'DAIR',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208024154066447', 'asana', 'ORD-1208024154066447',
  '4042 Homestead Dr', 'Lakeland', 'FL', '33810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-08-09T00:00:00.000Z', '2024-08-16T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208012305659767', 'asana', 'ORD-1208012305659767',
  '2115 Puffin St', 'Sebring', 'FL', '33870', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-08-08T00:00:00.000Z', '2024-08-08T00:00:00.000Z', '2024-10-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208012140721648', 'asana', 'ORD-1208012140721648',
  '10 Cedar Trce', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-08-08T00:00:00.000Z', '2024-08-08T00:00:00.000Z', '2024-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1208003599779358', 'asana', 'ORD-1208003599779358',
  '900 79th St S', 'St. Petersburg', 'FL', '33707', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 700, 700,
  'completed', 'normal', 'refinance',
  '2024-08-07T00:00:00.000Z', '2024-08-15T00:00:00.000Z', '2024-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207984203413982', 'asana', 'ORD-1207984203413982',
  '616 Southeast 31st Terrace Ocala', 'FL', 'FL', '34471', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-08-05T00:00:00.000Z', '2024-08-09T00:00:00.000Z', '2024-08-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207966970271228', 'asana', 'ORD-1207966970271228',
  '455 TIERRA VERDE LN Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 522, 522,
  'completed', 'normal', 'refinance',
  '2024-08-02T00:00:00.000Z', '2024-08-07T00:00:00.000Z', '2024-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207957789998344', 'asana', 'ORD-1207957789998344',
  '2746 Via Tivoli UNIT 115B', 'Clearwater', 'FL', '33764', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-08-01T00:00:00.000Z', '2024-08-06T00:00:00.000Z', '2024-08-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', 'GP',
  NULL,
  'bill', 'new_client', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207955508195535', 'asana', 'ORD-1207955508195535',
  '14008 Eden Isle Blvd', 'Windermere', 'FL', '14008', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-08-01T00:00:00.000Z', '2024-08-12T00:00:00.000Z', '2024-08-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'new_client', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204822526350650', 'asana', 'ORD-1204822526350650',
  '3275Fitzgerald Dr.', 'Orlando', 'FL', '33805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-07-30T00:00:00.000Z', '2024-07-31T00:00:00.000Z', '2024-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, 'Asset Valuation', NULL,
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207935837382389', 'asana', 'ORD-1207935837382389',
  '3341 SW 26th St', 'Ocala', 'FL', '34474', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2024-07-30T00:00:00.000Z', '2024-08-08T00:00:00.000Z', '2024-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207902405965525', 'asana', 'ORD-1207902405965525',
  '2216 Cherbourg Ct', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 495, 495,
  'completed', 'normal', 'refinance',
  '2024-07-25T00:00:00.000Z', '2024-08-14T00:00:00.000Z', '2024-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207892101084662', 'asana', 'ORD-1207892101084662',
  '311 Oak Crest Dr', 'Safety Harbor', 'FL', '34695', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-07-24T00:00:00.000Z', '2024-07-26T00:00:00.000Z', '2024-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207873759289914', 'asana', 'ORD-1207873759289914',
  '3036 Condel Dr', 'Orlando', 'FL', '32812', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-07-22T00:00:00.000Z', '2024-07-31T00:00:00.000Z', '2024-07-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207870660146333', 'asana', 'ORD-1207870660146333',
  '501 CARRIAGE RD', 'SATELLITE BEACH', 'FL', '32937', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-07-22T00:00:00.000Z', '2024-07-30T00:00:00.000Z', '2024-07-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207863443081715', 'asana', 'ORD-1207863443081715',
  '815 W Columbus Dr', 'Tampa', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-07-21T00:00:00.000Z', '2024-07-22T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'online', 'new_client', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207856935964097', 'asana', 'ORD-1207856935964097',
  '807 E. Ida St Unit B', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-07-19T00:00:00.000Z', '2024-07-26T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207857934297220', 'asana', 'ORD-1207857934297220',
  '807 E. Ida St Unit A', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-07-19T00:00:00.000Z', '2024-07-26T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207848757123178', 'asana', 'ORD-1207848757123178',
  '11306 NATHANIEL DR', 'ORLANDO', 'FL', '11306', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 695, 695,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-08-05T00:00:00.000Z', '2024-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207848757123176', 'asana', 'ORD-1207848757123176',
  '11306 NATHANIEL DR', 'ORLANDO', 'FL', '11306', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 695, 695,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-08-05T00:00:00.000Z', '2024-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207848757123174', 'asana', 'ORD-1207848757123174',
  '11306 NATHANIEL DR', 'ORLANDO', 'FL', '11306', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 620, 620,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-08-02T00:00:00.000Z', '2024-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207850025069180', 'asana', 'ORD-1207850025069180',
  '11306 NATHANIEL DR', 'ORLANDO', 'FL', '11306', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 695, 695,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-08-05T00:00:00.000Z', '2024-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207848928471893', 'asana', 'ORD-1207848928471893',
  '31731 Redtail Blvd', 'Sorrento', 'FL', '31731', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Corporate Settlement Solutions' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-07-26T00:00:00.000Z', '2024-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'HELOC', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207848670709942', 'asana', 'ORD-1207848670709942',
  '240 OLEANDER AVE', 'DAYTONA BEACH', 'FL', '32118', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 625, 625,
  'completed', 'normal', 'refinance',
  '2024-07-18T00:00:00.000Z', '2024-07-26T00:00:00.000Z', '2024-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207836888003775', 'asana', 'ORD-1207836888003775',
  '209 HIDEAWAY BEACH LANE', 'KISSIMMEE', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2024-07-17T00:00:00.000Z', '2024-07-22T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207836684061740', 'asana', 'ORD-1207836684061740',
  '8 Emerald Trail Way', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-07-17T00:00:00.000Z', '2024-08-07T00:00:00.000Z', '2024-08-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207836120965721', 'asana', 'ORD-1207836120965721',
  '3502 Rutland Lane Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-07-17T00:00:00.000Z', '2024-07-24T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207834408123324', 'asana', 'ORD-1207834408123324',
  '5659 NW 2nd St', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-07-17T00:00:00.000Z', '2024-07-25T00:00:00.000Z', '2024-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207827213080721', 'asana', 'ORD-1207827213080721',
  '674 Frederica Ln', 'Dunedin', 'FL', '34698', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-07-16T00:00:00.000Z', '2024-07-25T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207823320836529', 'asana', 'ORD-1207823320836529',
  '501 Triumph Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-07-16T00:00:00.000Z', '2024-07-25T00:00:00.000Z', '2024-07-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207817625392186', 'asana', 'ORD-1207817625392186',
  '691 Dropshot Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2024-07-15T00:00:00.000Z', '2024-07-19T00:00:00.000Z', '2024-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207788240316026', 'asana', 'ORD-1207788240316026',
  '1295 S BANANA RIVER DR', 'MERRITT ISLAND', 'FL', '32952', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-07-11T00:00:00.000Z', '2024-07-19T00:00:00.000Z', '2024-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207781761863499', 'asana', 'ORD-1207781761863499',
  '3920 Kestrel St', 'Palm Harbor', 'FL', '34683', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-07-10T00:00:00.000Z', '2024-07-19T00:00:00.000Z', '2024-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207779165704796', 'asana', 'ORD-1207779165704796',
  '13442 BISCAYNE DR GRAND', 'ISLAND', 'FL', '13442', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-07-10T00:00:00.000Z', '2024-07-18T00:00:00.000Z', '2024-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Foreclosure', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207771542636662', 'asana', 'ORD-1207771542636662',
  '1725-1729 Crystal Grove Drive', 'Lakeland', 'FL', '33801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-07-09T00:00:00.000Z', '2024-07-09T00:00:00.000Z', '2024-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207771067948537', 'asana', 'ORD-1207771067948537',
  '334 Gravina Pt', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 850, 850,
  'completed', 'normal', 'refinance',
  '2024-07-09T00:00:00.000Z', '2024-07-17T00:00:00.000Z', '2024-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207768407411018', 'asana', 'ORD-1207768407411018',
  '1147 MANATEE DR', 'ROCKLEDGE', 'FL', '32955', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2024-07-09T00:00:00.000Z', '2024-07-17T00:00:00.000Z', '2024-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207759119774587', 'asana', 'ORD-1207759119774587',
  '2609 NW 4th St', 'Okeechobee', 'FL', '34972', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-07-08T00:00:00.000Z', '2024-07-15T00:00:00.000Z', '2024-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207759084973113', 'asana', 'ORD-1207759084973113',
  '2615 NW 4th St', 'Okeechobee', 'FL', '34972', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-07-08T00:00:00.000Z', '2024-07-15T00:00:00.000Z', '2024-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207720153201149', 'asana', 'ORD-1207720153201149',
  '1817 PALM BLVD', 'MELBOURNE', 'FL', '32901', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-07-02T00:00:00.000Z', '2024-07-10T00:00:00.000Z', '2024-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207719861391000', 'asana', 'ORD-1207719861391000',
  '259 Emerald Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2024-07-02T00:00:00.000Z', '2024-08-06T00:00:00.000Z', '2024-08-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207716708281857', 'asana', 'ORD-1207716708281857',
  '9 Cedar Tree Pl', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-07-02T00:00:00.000Z', '2024-07-11T00:00:00.000Z', '2024-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207711808452913', 'asana', 'ORD-1207711808452913',
  '9540 WICKHAM WAY', 'ORLANDO', 'FL', '32836', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Appraisal Shield' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2024-07-01T00:00:00.000Z', '2024-07-09T00:00:00.000Z', '2024-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207708369197089', 'asana', 'ORD-1207708369197089',
  '15255 E Oakland Ave Winter', 'Garden', 'FL', '15255', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 675, 675,
  'completed', 'normal', 'refinance',
  '2024-07-01T00:00:00.000Z', '2024-07-16T00:00:00.000Z', '2024-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207651411931354', 'asana', 'ORD-1207651411931354',
  '3212 S Lockwood Ridge Rd', 'Sarasota', 'FL', '34239', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-06-24T00:00:00.000Z', '2024-06-26T00:00:00.000Z', '2024-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'online', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207650279922630', 'asana', 'ORD-1207650279922630',
  '1661 MORAVIA AVE', 'DAYTONA BEACH', 'FL', '32117', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 620, 620,
  'completed', 'normal', 'refinance',
  '2024-06-24T00:00:00.000Z', '2024-07-02T00:00:00.000Z', '2024-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207625386994965', 'asana', 'ORD-1207625386994965',
  '1725-1729 Crystal Grove Drive', 'Lakeland', 'FL', '33801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2024-06-20T00:00:00.000Z', '2024-06-28T00:00:00.000Z', '2024-07-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207596407676202', 'asana', 'ORD-1207596407676202',
  '365 Sycamore Dr', 'Freeport', 'FL', '32439', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-06-17T00:00:00.000Z', '2024-06-21T00:00:00.000Z', '2024-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207594326740426', 'asana', 'ORD-1207594326740426',
  '1331 ALSTON BAY BLVDUNIT 470', 'APOPKA', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2024-06-17T00:00:00.000Z', '2024-06-24T00:00:00.000Z', '2024-06-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207578111367688', 'asana', 'ORD-1207578111367688',
  '17017 Marsh Rd Winter', 'garden', 'FL', '17017', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1), 800, 800,
  'completed', 'normal', 'refinance',
  '2024-06-14T00:00:00.000Z', '2024-06-28T00:00:00.000Z', '2024-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Foreclosure', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207564985893067', 'asana', 'ORD-1207564985893067',
  '238 Oak Ln Loop', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-06-13T00:00:00.000Z', '2024-06-19T00:00:00.000Z', '2024-06-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207565780415729', 'asana', 'ORD-1207565780415729',
  '297 Oak Ln Wy', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-06-13T00:00:00.000Z', '2024-06-19T00:00:00.000Z', '2024-06-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207565412484292', 'asana', 'ORD-1207565412484292',
  '49 Cypress Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2024-06-13T00:00:00.000Z', '2024-06-19T00:00:00.000Z', '2024-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207564683917073', 'asana', 'ORD-1207564683917073',
  '259 Emerald Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-06-13T00:00:00.000Z', '2024-06-19T00:00:00.000Z', '2024-06-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207554184828747', 'asana', 'ORD-1207554184828747',
  '2620 NE 19th Ave Lighthouse', 'Point', 'FL', '33064', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1), 200, 200,
  'completed', 'normal', 'refinance',
  '2024-06-12T00:00:00.000Z', '2024-06-18T00:00:00.000Z', '2024-06-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207553080564539', 'asana', 'ORD-1207553080564539',
  '114 S 35TH ST', 'MEXICO BEACH', 'FL', '32456', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 595, 595,
  'completed', 'normal', 'refinance',
  '2024-06-12T00:00:00.000Z', '2024-06-21T00:00:00.000Z', '2024-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207553085875898', 'asana', 'ORD-1207553085875898',
  '117 S 36TH ST', 'MEXICO BEACH', 'FL', '32456', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-06-12T00:00:00.000Z', '2024-06-21T00:00:00.000Z', '2024-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207517222491242', 'asana', 'ORD-1207517222491242',
  '1830 Cobble Ln', 'Mt Dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 275, 275,
  'completed', 'normal', 'refinance',
  '2024-06-07T00:00:00.000Z', '2024-06-17T00:00:00.000Z', '2024-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207499767890225', 'asana', 'ORD-1207499767890225',
  '1020 Woodsong Way', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-06-05T00:00:00.000Z', '2024-06-14T00:00:00.000Z', '2024-06-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Pre-Listing', 'GP',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207499561186006', 'asana', 'ORD-1207499561186006',
  '472 Wedgefield Dr Spring', 'Hill', 'FL', '34609', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-06-05T00:00:00.000Z', '2024-06-13T00:00:00.000Z', '2024-06-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Reverse Mortgage', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207499356256852', 'asana', 'ORD-1207499356256852',
  '42 Oceanside Drive Palm', 'Coast', 'FL', '32137', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2024-06-05T00:00:00.000Z', '2024-06-17T00:00:00.000Z', '2024-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207485867114053', 'asana', 'ORD-1207485867114053',
  '1301 Bailey Ave', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2024-06-04T00:00:00.000Z', '2024-06-11T00:00:00.000Z', '2024-06-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207475776771886', 'asana', 'ORD-1207475776771886',
  '1823 Forest Preserve Blvd Port', 'Orange', 'FL', '32128', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 418, 418,
  'completed', 'normal', 'refinance',
  '2024-06-03T00:00:00.000Z', '2024-06-11T00:00:00.000Z', '2024-06-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207475551413967', 'asana', 'ORD-1207475551413967',
  '222 Willowick Ave', 'Tampa', 'FL', '33617', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2024-06-03T00:00:00.000Z', '2024-06-07T00:00:00.000Z', '2024-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956075647', 'asana', 'ORD-1207456956075647',
  '3926 SW 133RD LOOP', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956075635', 'asana', 'ORD-1207456956075635',
  '16516 SW 54TH COURT RD', 'OCALA', 'FL', '16516', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956075623', 'asana', 'ORD-1207456956075623',
  '15283 SW 59TH CT', 'OCALA', 'FL', '15283', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956075611', 'asana', 'ORD-1207456956075611',
  '13250 SW 79TH CIR', 'OCALA', 'FL', '13250', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-11T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956075599', 'asana', 'ORD-1207456956075599',
  '14422 SW 32ND TERRACE RD', 'OCALA', 'FL', '14422', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456956073561', 'asana', 'ORD-1207456956073561',
  '14432 SW 32ND TERRACE RD', 'OCALA', 'FL', '14432', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207457074272567', 'asana', 'ORD-1207457074272567',
  '6078 SW 150TH LN', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207456042410312', 'asana', 'ORD-1207456042410312',
  '3932 SW 133RD LOOP', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-31T00:00:00.000Z', '2024-06-10T00:00:00.000Z', '2024-06-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207449359673278', 'asana', 'ORD-1207449359673278',
  '342 Evergreen Ct', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 660, 660,
  'completed', 'normal', 'refinance',
  '2024-05-30T00:00:00.000Z', '2024-05-22T00:00:00.000Z', '2024-06-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207437858690758', 'asana', 'ORD-1207437858690758',
  '10854 Lake Minneola Shrs', 'Clermont', 'FL', '10854', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-29T00:00:00.000Z', '2024-06-07T00:00:00.000Z', '2024-06-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207437480675395', 'asana', 'ORD-1207437480675395',
  '16050 SW 21st', 'CtOcala', 'FL', '16050', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-29T00:00:00.000Z', '2024-06-06T00:00:00.000Z', '2024-06-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207427971357889', 'asana', 'ORD-1207427971357889',
  '2544 STATE ROAD 557', 'Lake Alfred', 'FL', '33850', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2024-05-28T00:00:00.000Z', '2024-06-05T00:00:00.000Z', '2024-06-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207407045830340', 'asana', 'ORD-1207407045830340',
  '209 N Himes Avenue', 'Tampa', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-05-26T00:00:00.000Z', '2024-05-26T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207407045830338', 'asana', 'ORD-1207407045830338',
  '2750 Roosevelt Blvd', 'Clearwater', 'FL', '33760', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-05-26T00:00:00.000Z', '2024-05-26T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207405402195382', 'asana', 'ORD-1207405402195382',
  '2800 N Highland Ave', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-24T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207402880933839', 'asana', 'ORD-1207402880933839',
  '5740 Driftwood Dr', 'Lakeland', 'FL', '33809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2024-05-24T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-05-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207398193867922', 'asana', 'ORD-1207398193867922',
  'SETUP AND MARKET ANALYSIS - 209 N Himes Avenue', 'Tampa', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2024-05-23T00:00:00.000Z', '2024-05-24T00:00:00.000Z', '2024-05-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207395917127129', 'asana', 'ORD-1207395917127129',
  '1840 Lemon Drop Ct', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2024-05-23T00:00:00.000Z', '2024-06-04T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207395440129583', 'asana', 'ORD-1207395440129583',
  '401 N OLEANDER AVE', 'DAYTONA BEACH', 'FL', '32118', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 620, 620,
  'completed', 'normal', 'refinance',
  '2024-05-23T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207387680827967', 'asana', 'ORD-1207387680827967',
  '2710 22nd Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-05-28T00:00:00.000Z', '2024-05-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207384849731413', 'asana', 'ORD-1207384849731413',
  '832 PYRACANTHA ST NW', 'PALM BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207385699010297', 'asana', 'ORD-1207385699010297',
  '118 BEACHWAY DR', 'PALM COAST', 'FL', '32137', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-04T00:00:00.000Z', '2024-05-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207384809434671', 'asana', 'ORD-1207384809434671',
  '58 BIRD OF PARADISE DR', 'PALM COAST', 'FL', '32137', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-04T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207386556689567', 'asana', 'ORD-1207386556689567',
  '15 SEA GARDEN PATH', 'PALM COAST', 'FL', '32164', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-04T00:00:00.000Z', '2024-05-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207382703092359', 'asana', 'ORD-1207382703092359',
  '1214 TARLETON ST SE', 'PALM BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-05-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207383861754422', 'asana', 'ORD-1207383861754422',
  '1398 TARLETON ST SE', 'PALM BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-05-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207383626200915', 'asana', 'ORD-1207383626200915',
  '1282 HEGIRA ST NW', 'PALM BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1207383407840478', 'asana', 'ORD-1207383407840478',
  '1296 HEGIRA ST NW', 'PALM BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2024-05-22T00:00:00.000Z', '2024-06-03T00:00:00.000Z', '2024-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);

-- ==============================================
-- BATCH VERIFICATION
-- ==============================================

-- Should show 600 total orders after this batch
SELECT COUNT(*) as total_orders FROM orders WHERE source = 'asana';
SELECT status, COUNT(*) as count FROM orders WHERE source = 'asana' GROUP BY status;