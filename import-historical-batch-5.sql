-- ==============================================
-- HISTORICAL ORDERS IMPORT - BATCH 5 of 5
-- Orders 1201-1319 (119 orders)
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
  '1204947527488578', 'asana', 'ORD-1204947527488578',
  '13102 Mulberry Park Drive #914', 'Orlando', 'FL', '13102', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204947229221541', 'asana', 'ORD-1204947229221541',
  '13102 Mulberry Park Dr APT 911', 'Orlando', 'FL', '13102', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204946874206757', 'asana', 'ORD-1204946874206757',
  '13003 Plantation Park Cir APT 1319', 'Orlando', 'FL', '13003', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-06-30T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204946383717816', 'asana', 'ORD-1204946383717816',
  '13016 Plantation Park Circle #1121', 'OrlandoFL32821', 'FL', '13016', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 2450, 2450,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204946391276226', 'asana', 'ORD-1204946391276226',
  '11514 Westwood Blvd APT 411', 'Orlando', 'FL', '11514', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
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
  '1204946303220489', 'asana', 'ORD-1204946303220489',
  '11520 Westwood Boulevard #518', 'Orlando', 'FL', '11520', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1204939615868681', 'asana', 'ORD-1204939615868681',
  'INTAKE - 114 W Park Ave', 'Edgewater', 'FL', '32132', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-06-29T00:00:00.000Z', '2023-06-30T00:00:00.000Z',
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
  '1204940582741672', 'asana', 'ORD-1204940582741672',
  '204 E South St #5043', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-06T00:00:00.000Z', '2023-07-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1204940682468357', 'asana', 'ORD-1204940682468357',
  '1310 W STATE ROAD 40', 'PIERSON', 'FL', '32180', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 281, 281,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-03T00:00:00.000Z', '2023-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Home Equity', '2055',
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
  '1204940471311673', 'asana', 'ORD-1204940471311673',
  '3930 LAGUNA Drive Indian lake', 'Estates', 'FL', '33855', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204939987847940', 'asana', 'ORD-1204939987847940',
  '159 N Robin Hood Rd', 'Inverness', 'FL', '34450', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-04T00:00:00.000Z', '2023-07-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'quote_follow_up', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204939898002534', 'asana', 'ORD-1204939898002534',
  '443 Cool Summer Lane', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-03T00:00:00.000Z', '2023-06-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1007',
  NULL,
  'bill', 'additional_service', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204939361885603', 'asana', 'ORD-1204939361885603',
  '14501 Grove Resort Ave #1409', 'Winter Garden', 'FL', '14501', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-29T00:00:00.000Z', '2023-07-07T00:00:00.000Z', '2023-07-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
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
  '1204932181288341', 'asana', 'ORD-1204932181288341',
  '2272 Wildwood Trail', 'Geneva', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-06-28T00:00:00.000Z', '2023-07-13T00:00:00.000Z', '2023-07-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', 'GP',
  NULL,
  'online', 'client_maintenance', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204931797936465', 'asana', 'ORD-1204931797936465',
  '4221 W Spruce St', '2407', 'FL', '33607', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'SUNTENDER VALUATIONS INC' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-28T00:00:00.000Z', '2023-07-05T00:00:00.000Z', '2023-07-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'quote_follow_up', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204931506521743', 'asana', 'ORD-1204931506521743',
  '2320 FLEET CIR', 'ORLANDO', 'FL', '32817', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-28T00:00:00.000Z', '2023-07-05T00:00:00.000Z', '2023-06-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'quote_follow_up', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204926896281965', 'asana', 'ORD-1204926896281965',
  '7714 Farmlawn Dr Port', 'Richey', 'FL', '34668', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-28T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204920793592406', 'asana', 'ORD-1204920793592406',
  '8287 N Quarry Way Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-06-27T00:00:00.000Z', '2023-07-05T00:00:00.000Z', '2023-07-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'quote_follow_up', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204919449792268', 'asana', 'ORD-1204919449792268',
  '304 Drum Ct', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-27T00:00:00.000Z', '2023-07-13T00:00:00.000Z', '2023-07-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204918794585934', 'asana', 'ORD-1204918794585934',
  '1520 Hunter Rd', 'Okeechobee', 'FL', '34974', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2023-06-27T00:00:00.000Z', '2023-06-21T00:00:00.000Z', '2023-06-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1204912170481886', 'asana', 'ORD-1204912170481886',
  '4925 VICTORIA AVE', 'SARASOTA', 'FL', '34233', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-26T00:00:00.000Z', '2023-06-30T00:00:00.000Z', '2023-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'LAND',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204911835088843', 'asana', 'ORD-1204911835088843',
  '1754 Bayview Dr', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2023-06-26T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'additional_service', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204909612424398', 'asana', 'ORD-1204909612424398',
  '1330 Idlewild Dr', 'Daytona Beach', 'FL', '32114', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-26T00:00:00.000Z', '2023-06-30T00:00:00.000Z', '2023-06-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Reverse Mortgage', 'FHA',
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
  '1204894212868882', 'asana', 'ORD-1204894212868882',
  '7828 Lakeside Woods Dr', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-23T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-07-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'quote_follow_up', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204894078975050', 'asana', 'ORD-1204894078975050',
  '4617 Seneca Ave', 'Tampa', 'FL', '33617', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-23T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204893475301560', 'asana', 'ORD-1204893475301560',
  '3006 RODRICK CIRCLE', 'Orlando', 'FL', '32824', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 352, 352,
  'completed', 'normal', 'refinance',
  '2023-06-23T00:00:00.000Z', '2023-07-05T00:00:00.000Z', '2023-07-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1204893310074306', 'asana', 'ORD-1204893310074306',
  '2170 Kalin Way', 'Tavares', 'FL', '32778', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Arivs' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-23T00:00:00.000Z', '2023-06-30T00:00:00.000Z', '2023-07-03T00:00:00.000Z',
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
  '1204886228757533', 'asana', 'ORD-1204886228757533',
  '1433 OSPREY RIDGE', 'EUSTIS', 'FL', '32736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 304, 304,
  'completed', 'normal', 'refinance',
  '2023-06-22T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
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
  '1204886186039464', 'asana', 'ORD-1204886186039464',
  '408 SOUTH RD', 'LAKELAND', 'FL', '33809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2023-06-22T00:00:00.000Z', '2023-06-29T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204886077274185', 'asana', 'ORD-1204886077274185',
  '6430 Barberry Ct Lakewood', 'Ranch', 'FL', '34202', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-22T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204885197938849', 'asana', 'ORD-1204885197938849',
  '1603 North Indian River Road New Smyrna', 'Beach', 'FL', '32169', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-22T00:00:00.000Z', '2023-06-30T00:00:00.000Z', '2023-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1204885017566536', 'asana', 'ORD-1204885017566536',
  '245 PIMA TRIAL', 'GROVELAND', 'FL', '34736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 275, 275,
  'completed', 'normal', 'refinance',
  '2023-06-22T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
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
  '1204878124007510', 'asana', 'ORD-1204878124007510',
  '35 CHESTNUT PL', 'OCALA', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
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
  '1204878183730931', 'asana', 'ORD-1204878183730931',
  '23299 Thomas Allen Rd', 'Howey In The Hills', 'FL', '23299', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'STEWART VALUATION INTELLIGENCE, LLC' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'additional_service', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204877726744956', 'asana', 'ORD-1204877726744956',
  '2260 Treasure Hill Street', 'Minneola', 'FL', '34715', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-28T00:00:00.000Z', '2023-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'additional_service', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204877318243611', 'asana', 'ORD-1204877318243611',
  '13824 Camden Crest Ter', 'Bradenton', 'FL', '13824', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'SWBC LENDING SOLUTIONS LLC' LIMIT 1), 335, 335,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204876923420254', 'asana', 'ORD-1204876923420254',
  '178 12th Ave', 'Longwood', 'FL', '32750', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-26T00:00:00.000Z', '2023-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204876564045268', 'asana', 'ORD-1204876564045268',
  '34230 Woodridge Ln', 'Eustis', 'FL', '34230', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-26T00:00:00.000Z',
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
  '1204876513508366', 'asana', 'ORD-1204876513508366',
  '6275 Paradise Island Court Port', 'Orange', 'FL', '32128', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-21T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204867681535794', 'asana', 'ORD-1204867681535794',
  '7115 Dellwood DR', 'Tampa', 'FL', '33619', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-20T00:00:00.000Z', '2023-06-26T00:00:00.000Z', '2023-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
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
  '1204867272861937', 'asana', 'ORD-1204867272861937',
  '1019 Green Rd', 'Rockledge', 'FL', '32955', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-20T00:00:00.000Z', '2023-06-26T00:00:00.000Z', '2023-06-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204866341081031', 'asana', 'ORD-1204866341081031',
  '1320 DUNBAR AVENUE', 'SANFORD', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-20T00:00:00.000Z', '2023-06-26T00:00:00.000Z', '2023-06-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
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
  '1204866059365352', 'asana', 'ORD-1204866059365352',
  '2546 BRINSMADE CT', 'APOPKA', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-20T00:00:00.000Z', '2023-06-26T00:00:00.000Z', '2023-06-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1204864644168279', 'asana', 'ORD-1204864644168279',
  '4121 10Th Ave N', 'St Petersburg', 'FL', '33713', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-20T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Foreclosure', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204857186632276', 'asana', 'ORD-1204857186632276',
  '1017 Margot LnLake Wales', 'FL', 'FL', '33853', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-19T00:00:00.000Z', '2023-06-23T00:00:00.000Z', '2023-06-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1204844671941551', 'asana', 'ORD-1204844671941551',
  '4918 Golden Zenith Way Mount Dora', 'Florida 32757', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2023-06-16T00:00:00.000Z', '2023-06-27T00:00:00.000Z', '2023-06-27T00:00:00.000Z',
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
  '1204844360222295', 'asana', 'ORD-1204844360222295',
  '9505 INGEBORG CT', 'WINDERMERE', 'FL', '34786', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-06-16T00:00:00.000Z', '2023-06-22T00:00:00.000Z', '2023-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
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
  '1204843452855229', 'asana', 'ORD-1204843452855229',
  '443 Cool Summer Lane', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-16T00:00:00.000Z', '2023-06-23T00:00:00.000Z', '2023-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204838477166372', 'asana', 'ORD-1204838477166372',
  '6506 US HIGHWAY 17 92 N', 'DAVENPORT', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2023-06-15T00:00:00.000Z', '2023-06-20T00:00:00.000Z', '2023-06-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'quote_follow_up', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204838278628737', 'asana', 'ORD-1204838278628737',
  '33960 Sky Blossom Circle Leesburg Florida', '34788', 'FL', '33960', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-15T00:00:00.000Z', '2023-06-21T00:00:00.000Z', '2023-06-22T00:00:00.000Z',
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
  '1204836508298982', 'asana', 'ORD-1204836508298982',
  '4386 Southwest 169th Lane Road', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-15T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1204835666735639', 'asana', 'ORD-1204835666735639',
  '601 Highlands Lake Dr Lake', 'Placid', 'FL', '33852', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-15T00:00:00.000Z', '2023-06-20T00:00:00.000Z', '2023-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204829448963838', 'asana', 'ORD-1204829448963838',
  '4089 King Richard Dr', 'Sarasota', 'FL', '34232', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-14T00:00:00.000Z', '2023-06-21T00:00:00.000Z', '2023-06-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'quote_follow_up', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204827217990793', 'asana', 'ORD-1204827217990793',
  '32700 Scenic Hills Dr', 'Mount Dora', 'FL', '32700', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1), 352, 352,
  'completed', 'normal', 'refinance',
  '2023-06-14T00:00:00.000Z', '2023-06-20T00:00:00.000Z', '2023-06-23T00:00:00.000Z',
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
  '1204820699750896', 'asana', 'ORD-1204820699750896',
  '613 Montezuma Drive', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-13T00:00:00.000Z', '2023-06-19T00:00:00.000Z', '2023-06-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1204820822472898', 'asana', 'ORD-1204820822472898',
  '4403 HECTOR CT APT 8', 'ORLANDO', 'FL', '32822', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Flagstar Bank' LIMIT 1), 413, 413,
  'completed', 'normal', 'refinance',
  '2023-06-13T00:00:00.000Z', '2023-06-20T00:00:00.000Z', '2023-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
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
  '1204816869998420', 'asana', 'ORD-1204816869998420',
  '5539 HEAD WAY The', 'Villages', 'FL', '32163', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-13T00:00:00.000Z', '2023-06-19T00:00:00.000Z', '2023-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'new_client', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204811657063060', 'asana', 'ORD-1204811657063060',
  '2656 Sumba Ave', 'OrlandoFL32837', 'FL', '32837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-12T00:00:00.000Z', '2023-06-15T00:00:00.000Z', '2023-06-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Ascertain Market Value', '2055',
  NULL,
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204809866435936', 'asana', 'ORD-1204809866435936',
  '116 PECAN RUN', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-12T00:00:00.000Z', '2023-06-15T00:00:00.000Z', '2023-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'New Construction', '1004D',
  NULL,
  'bill', 'new_client', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204796506308580', 'asana', 'ORD-1204796506308580',
  '1026 Jeater Bend Dr', 'Celebration', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-09T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204796526962046', 'asana', 'ORD-1204796526962046',
  '2260 Treasure Hill Street', 'Minneola', 'FL', '34715', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-06-09T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
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
  '1204796388455065', 'asana', 'ORD-1204796388455065',
  '1520 Hunter Rd', 'Okeechobee', 'FL', '34974', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2023-06-09T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204796332132333', 'asana', 'ORD-1204796332132333',
  '1226 Keats Avenue', 'Orlando', 'FL', '32809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-06-09T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
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
  '1204791073176349', 'asana', 'ORD-1204791073176349',
  '600 Manatee Ave Unit 223 BRADENTON', 'BEACH', 'FL', '34217', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1204790179043739', 'asana', 'ORD-1204790179043739',
  '508 Glenn Cross Dr', 'RUSKIN', 'FL', '33570', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'REO', '2055',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204789713201822', 'asana', 'ORD-1204789713201822',
  '621 Beach Bum Blvd Daytona', 'Beach', 'FL', '32124', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'First Community Mortgage, INC' LIMIT 1), 215, 215,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
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
  '1204789534044438', 'asana', 'ORD-1204789534044438',
  '1010 Victoria Hills Dr S', 'Deland', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1), 315, 315,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
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
  '1204789319662089', 'asana', 'ORD-1204789319662089',
  '611 Drop Shot Drive', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
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
  '1204788898185752', 'asana', 'ORD-1204788898185752',
  'Parcel# 06-20-31-300-015J-0000', 'SANFORD', 'FL', '32773', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 200, 200,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-12T00:00:00.000Z', '2023-06-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Ascertain Market Value', 'LAND',
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
  '1204788499545678', 'asana', 'ORD-1204788499545678',
  '900 S CHIKASAW TRAIL', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 275, 275,
  'completed', 'normal', 'refinance',
  '2023-06-08T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
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
  '1204782718889992', 'asana', 'ORD-1204782718889992',
  '119 Walnut Rd', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2023-06-07T00:00:00.000Z', '2023-06-12T00:00:00.000Z', '2023-06-13T00:00:00.000Z',
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
  '1204782426593077', 'asana', 'ORD-1204782426593077',
  '5524 25th St W Bradenton Florida', '34207', 'FL', '34207', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 560, 560,
  'completed', 'normal', 'refinance',
  '2023-06-07T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204781739075685', 'asana', 'ORD-1204781739075685',
  '6853 SE 3rd St', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-07T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-12T00:00:00.000Z',
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
  '1204780854439403', 'asana', 'ORD-1204780854439403',
  '3925 Wateroak Way', 'Titusville', 'FL', '32796', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-07T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-12T00:00:00.000Z',
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
  '1204780543483960', 'asana', 'ORD-1204780543483960',
  '579 East Palmetto Avenue', 'Longwood', 'FL', '32750', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-07T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
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
  '1204774343846200', 'asana', 'ORD-1204774343846200',
  '4221 Lana Ave', 'DAVENPORT', 'FL', '33897', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'SUNTENDER VALUATIONS INC' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204774276810947', 'asana', 'ORD-1204774276810947',
  '50 Central Ave Unit 14-G', 'Sarasota', 'FL', '34236', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-12T00:00:00.000Z', '2023-06-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204773969435052', 'asana', 'ORD-1204773969435052',
  '4297 Green Gables Place', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-12T00:00:00.000Z', '2023-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204773566175945', 'asana', 'ORD-1204773566175945',
  '5132 W Colonial Dr', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'BAAR Realty Advisors' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-14T00:00:00.000Z', '2023-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
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
  '1204772514833699', 'asana', 'ORD-1204772514833699',
  '745 SR 64TH EAST ZOLFO', 'SPRINGS', 'FL', '33890', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1), 225, 225,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'REO', '2055',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204771276000106', 'asana', 'ORD-1204771276000106',
  '255 Florida Parkway', 'Kissimmee', 'FL', '34743', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-06T00:00:00.000Z', '2023-06-13T00:00:00.000Z', '2023-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
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
  '1204761992136769', 'asana', 'ORD-1204761992136769',
  'INTAKE: 4142 Lake Forest Street Mount', 'Dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-05T00:00:00.000Z', '2023-06-06T00:00:00.000Z',
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
  '1204762813195041', 'asana', 'ORD-1204762813195041',
  '2632 Dover Glen Cir', 'Orlando', 'FL', '32828', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'quote_follow_up', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204762450925412', 'asana', 'ORD-1204762450925412',
  '675 Sausalito Blvd', 'Casselberry', 'FL', '32707', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204761523720951', 'asana', 'ORD-1204761523720951',
  '5903 Garden Ln H-24', 'Bradenton', 'FL', '34207', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'A1 AMC INC' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'new_client', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204760483127486', 'asana', 'ORD-1204760483127486',
  '1776 Roseberry Ln', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204759735984203', 'asana', 'ORD-1204759735984203',
  '33507 LINDA DR', 'LEESBURG', 'FL', '33507', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-06-05T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', ' Other - Mortgage Finance Transaction', '2055',
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
  '1204749096147777', 'asana', 'ORD-1204749096147777',
  '724 Hyperion Drive DeBary Florida', '3271', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-05T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'quote_follow_up', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204749056144125', 'asana', 'ORD-1204749056144125',
  '2703 Magnolia Ave', 'Sanford', 'FL', '32773', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-02T00:00:00.000Z', '2023-06-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'quote_follow_up', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204748674823056', 'asana', 'ORD-1204748674823056',
  '6461 Cherry Grove Cir', 'Orlando', 'FL', '32809', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-07T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
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
  '1204748462619256', 'asana', 'ORD-1204748462619256',
  '2673 SCRAPBOOK STREET', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 225, 225,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-12T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204748262073999', 'asana', 'ORD-1204748262073999',
  '717 PALAISEAU COURT', 'KISSIMMEE', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-07T00:00:00.000Z', '2023-06-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204748184785719', 'asana', 'ORD-1204748184785719',
  '4573 Cabello Loop Kissimmee Florida', '34746', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'new_client', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204746772005477', 'asana', 'ORD-1204746772005477',
  '137 E 10Th St', 'ChuluotaFL32766', 'FL', '32766', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'ALL PRO APPRAISAL MANAGEMENT INC' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-06-02T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1204739111312353', 'asana', 'ORD-1204739111312353',
  '428 Marcello Blvd', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2023-06-01T00:00:00.000Z', '2023-06-05T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'quote_follow_up', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204738589033730', 'asana', 'ORD-1204738589033730',
  '244 Paloma Dr', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-01T00:00:00.000Z', '2023-06-09T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204737260048023', 'asana', 'ORD-1204737260048023',
  '611 Drop Shot Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-06-01T00:00:00.000Z', '2023-06-06T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204737016284328', 'asana', 'ORD-1204737016284328',
  '1138 Calico Pointe Circle Groveland Florida', '34736', 'FL', '34736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-01T00:00:00.000Z', '2023-06-07T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1204735787655168', 'asana', 'ORD-1204735787655168',
  '308 N Garfield Ave.', 'Deland', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-06-01T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1204730608008812', 'asana', 'ORD-1204730608008812',
  '7800 Whitemarsh Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-05-31T00:00:00.000Z', '2023-06-06T00:00:00.000Z', '2023-06-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'quote_follow_up', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204728873949181', 'asana', 'ORD-1204728873949181',
  '1723 E Idell ST', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2023-05-31T00:00:00.000Z', '2023-06-05T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
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
  '1204728470403592', 'asana', 'ORD-1204728470403592',
  '7805 GULF DR # B HOLMES', 'BEACH', 'FL', '34217', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2023-05-31T00:00:00.000Z', '2023-06-02T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204728131460609', 'asana', 'ORD-1204728131460609',
  '1683 SW 3rd St', 'Ocala', 'FL', '34471', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-05-31T00:00:00.000Z', '2023-06-19T00:00:00.000Z', '2023-06-16T00:00:00.000Z',
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
  '1204727658937699', 'asana', 'ORD-1204727658937699',
  '719 28th Street', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2023-05-31T00:00:00.000Z', '2023-06-08T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
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
  '1204718838794182', 'asana', 'ORD-1204718838794182',
  '14420 Sunbridge Cir Winter', 'Garden', 'FL', '14420', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 325, 325,
  'completed', 'normal', 'refinance',
  '2023-05-30T00:00:00.000Z', '2023-06-02T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'quote_follow_up', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204716638254666', 'asana', 'ORD-1204716638254666',
  '618 Old Bradenton Rd', 'Wauchula', 'FL', '33873', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-05-30T00:00:00.000Z', '2023-06-01T00:00:00.000Z', '2023-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204715944460438', 'asana', 'ORD-1204715944460438',
  '25228 Luke St', 'Christmas', 'FL', '25228', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-05-30T00:00:00.000Z', '2023-05-31T00:00:00.000Z', '2023-06-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Mortgage Servicing', '1004C',
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
  '1204689182424847', 'asana', 'ORD-1204689182424847',
  '1036 Courtland St', 'Orlando', 'FL', '32804', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2023-05-26T00:00:00.000Z', '2023-05-31T00:00:00.000Z', '2023-06-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'additional_service', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204688303196993', 'asana', 'ORD-1204688303196993',
  '3580 GOPHER TURTLE RUN', 'LAKE WALES', 'FL', '33898', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2023-05-26T00:00:00.000Z', '2023-05-31T00:00:00.000Z', '2023-06-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Foreclosure', 'FHA',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204688267638481', 'asana', 'ORD-1204688267638481',
  '922 Lake Shore Ranch Dr', 'Seffner', 'FL', '33584', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2023-05-26T00:00:00.000Z', '2023-06-01T00:00:00.000Z', '2023-06-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204687842224826', 'asana', 'ORD-1204687842224826',
  '3524 Big Sky Way', 'Bradenton', 'FL', '34211', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2023-05-26T00:00:00.000Z', '2023-06-16T00:00:00.000Z', '2023-06-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'quote_follow_up', 'TAMPA - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204681052096986', 'asana', 'ORD-1204681052096986',
  '12046 CITATION RD SPRING', 'HILL', 'FL', '12046', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2023-05-25T00:00:00.000Z', '2023-06-01T00:00:00.000Z', '2023-06-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'HELOC', '1004',
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
  '1204631187274283', 'asana', 'ORD-1204631187274283',
  '3961 Lana Avenue', 'Davenport', 'FL', '33897', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1), 225, 225,
  'completed', 'normal', 'refinance',
  '2023-05-18T00:00:00.000Z', '2023-05-19T00:00:00.000Z', '2023-05-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
  NULL,
  'bill', 'new_client', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204630802037154', 'asana', 'ORD-1204630802037154',
  '7896 Ficquette Road Windermere Florida', '34786', 'FL', '34786', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Arivs' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2023-05-18T00:00:00.000Z', '2023-05-25T00:00:00.000Z', '2023-05-23T00:00:00.000Z',
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
  '1204519413821662', 'asana', 'ORD-1204519413821662',
  '[Converted to template] SUPERVISOR ORDER', 'REVIEW', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z',
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
  '1204519526460360', 'asana', 'ORD-1204519526460360',
  '[Converted to template]', 'HABU', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z',
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
  '1204519526430371', 'asana', 'ORD-1204519526430371',
  '[Converted to template] SETUP', 'REVIEW', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z',
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
  '1204519525315332', 'asana', 'ORD-1204519525315332',
  '[Converted to template] SETUP AND MARKET', 'ANALYSIS', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z',
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
  '1204519525975154', 'asana', 'ORD-1204519525975154',
  '[Converted to template]', 'INVOICE', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z', '2023-05-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);

-- ==============================================
-- BATCH VERIFICATION
-- ==============================================

-- Should show 1319 total orders after this batch
SELECT COUNT(*) as total_orders FROM orders WHERE source = 'asana';
SELECT status, COUNT(*) as count FROM orders WHERE source = 'asana' GROUP BY status;