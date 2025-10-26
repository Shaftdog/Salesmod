-- ==============================================
-- HISTORICAL ORDERS IMPORT - BATCH 1 of 5
-- Orders 1-300 (300 orders)
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
  '1211470462214548', 'asana', 'ORD-1211470462214548',
  '2 ORANGE AVE WINTER', 'GARDENFL34787', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-09-25T00:00:00.000Z', '2025-10-03T00:00:00.000Z', '2025-10-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1211468628232794', 'asana', 'ORD-1211468628232794',
  '717 S Atlantic Ave Cocoa', 'Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 700, 700,
  'completed', 'normal', 'refinance',
  '2025-09-25T00:00:00.000Z', '2025-09-30T00:00:00.000Z', '2025-10-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1211462731288105', 'asana', 'ORD-1211462731288105',
  '3625 Boca Ciega Dr APT-111', 'Naples', 'FL', '34112', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-09-24T00:00:00.000Z', '2025-09-30T00:00:00.000Z', '2025-10-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1211368451047049', 'asana', 'ORD-1211368451047049',
  '4523 ROSSMORE DR', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-09-15T00:00:00.000Z', '2025-09-24T00:00:00.000Z', '2025-09-24T00:00:00.000Z',
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
  '1211366047207501', 'asana', 'ORD-1211366047207501',
  '270 Mockingbird Ln', 'Casselberry', 'FL', '32707', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-09-15T00:00:00.000Z', '2025-09-22T00:00:00.000Z', '2025-09-22T00:00:00.000Z',
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
  '1211334003825309', 'asana', 'ORD-1211334003825309',
  '600 Citroen Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-09-11T00:00:00.000Z', '2025-09-18T00:00:00.000Z', '2025-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1211320544921768', 'asana', 'ORD-1211320544921768',
  '3512 Palmway Dr', 'Sanford', 'FL', '32773', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-09-10T00:00:00.000Z', '2025-09-17T00:00:00.000Z', '2025-09-18T00:00:00.000Z',
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
  '1211320277134266', 'asana', 'ORD-1211320277134266',
  '1376 Byrd Ct', 'Rockledge', 'FL', '32955', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-09-10T00:00:00.000Z', '2025-09-12T00:00:00.000Z', '2025-09-12T00:00:00.000Z',
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
  '1211319942590571', 'asana', 'ORD-1211319942590571',
  '1514 Pinecliff Dr Apopka', 'FL', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-09-10T00:00:00.000Z', '2025-09-12T00:00:00.000Z', '2025-09-12T00:00:00.000Z',
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
  '1211319287750613', 'asana', 'ORD-1211319287750613',
  '8011 Bow Creek Rd', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-09-10T00:00:00.000Z', '2025-09-17T00:00:00.000Z', '2025-09-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Divorce', '1004',
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
  '1211296882447068', 'asana', 'ORD-1211296882447068',
  '2727 CULLENS COURTOCOEE', 'FL', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-09-08T00:00:00.000Z', '2025-09-12T00:00:00.000Z', '2025-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
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
  '1211269388659949', 'asana', 'ORD-1211269388659949',
  '15456 Piedmont Avenue', 'Port Charlotte', 'FL', '15456', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-09-05T00:00:00.000Z', '2025-09-12T00:00:00.000Z', '2025-09-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1211215071329451', 'asana', 'ORD-1211215071329451',
  '1270 Fountain Coin Loop', 'Orlando', 'FL', '32828', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-09-02T00:00:00.000Z', '2025-09-08T00:00:00.000Z', '2025-09-09T00:00:00.000Z',
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
  '1211214227332288', 'asana', 'ORD-1211214227332288',
  '605 W MILES ST', 'Deland', 'FL', '32720', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-09-02T00:00:00.000Z', '2025-09-10T00:00:00.000Z', '2025-09-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
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
  '1211185045465374', 'asana', 'ORD-1211185045465374',
  '4907 18th Ave W', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-08-29T00:00:00.000Z', '2025-09-05T00:00:00.000Z', '2025-09-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Ascertain Market Value', 'GP',
  ARRAY['1007']::text[],
  'online', 'partnership', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1211177498685553', 'asana', 'ORD-1211177498685553',
  '6849 SE 123rd Pl', 'Belleview', 'FL', '34420', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-08-28T00:00:00.000Z', '2025-09-10T00:00:00.000Z', '2025-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1211157477936368', 'asana', 'ORD-1211157477936368',
  '3827 Riverhills Drive', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-08-26T00:00:00.000Z', '2025-09-02T00:00:00.000Z', '2025-09-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
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
  '1211116997119388', 'asana', 'ORD-1211116997119388',
  '12102 Walker Pond Rd Winter', 'Garden', 'FL', '12102', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-08-21T00:00:00.000Z', '2025-08-27T00:00:00.000Z', '2025-08-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1211096057144538', 'asana', 'ORD-1211096057144538',
  '4604 S Shore Road', 'Orlando', 'FL', '32839', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-08-19T00:00:00.000Z', '2025-08-25T00:00:00.000Z', '2025-08-25T00:00:00.000Z',
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
  '1211083651445377', 'asana', 'ORD-1211083651445377',
  '591 POPLAR ST SE PALM', 'BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Accurate Group' LIMIT 1), 231, 231,
  'completed', 'normal', 'refinance',
  '2025-08-18T00:00:00.000Z', '2025-08-25T00:00:00.000Z', '2025-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
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
  '1211060057090686', 'asana', 'ORD-1211060057090686',
  '3124 Knottypine Ave', 'Winter Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'The Appraisal HUB' LIMIT 1), 115, 115,
  'completed', 'normal', 'refinance',
  '2025-08-14T00:00:00.000Z', '2025-08-13T00:00:00.000Z', '2025-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1211059916066455', 'asana', 'ORD-1211059916066455',
  '3124 Knottypine Ave', 'Winter Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'The Appraisal HUB' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-08-14T00:00:00.000Z', '2025-08-19T00:00:00.000Z', '2025-08-18T00:00:00.000Z',
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
  '1211039321593370', 'asana', 'ORD-1211039321593370',
  '220 S Stone St', 'Deland', 'FL', '32720', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-08-12T00:00:00.000Z', '2025-08-19T00:00:00.000Z', '2025-08-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1211039123253736', 'asana', 'ORD-1211039123253736',
  '1497 N Normandy Blvd', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-08-12T00:00:00.000Z', '2025-08-19T00:00:00.000Z', '2025-08-18T00:00:00.000Z',
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
  '1211026950413002', 'asana', 'ORD-1211026950413002',
  '2232 Hilton St', 'Port Charlotte', 'FL', '33948', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 200, 200,
  'new', 'normal', 'refinance',
  '2025-08-11T00:00:00.000Z', '2025-08-15T00:00:00.000Z', NULL,
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1211002621262091', 'asana', 'ORD-1211002621262091',
  '539 Clark Street', 'Maitland', 'FL', '32751', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2025-08-07T00:00:00.000Z', '2025-08-11T00:00:00.000Z', '2025-08-14T00:00:00.000Z',
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
  '1210991965516360', 'asana', 'ORD-1210991965516360',
  '2174 WALLINGFORD LOOP', 'Mount Dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-08-06T00:00:00.000Z', '2025-08-11T00:00:00.000Z', '2025-08-11T00:00:00.000Z',
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
  '1210981920479657', 'asana', 'ORD-1210981920479657',
  '11184 Kimberly Ave', 'Englewood', 'FL', '11184', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-08-05T00:00:00.000Z', '2025-08-12T00:00:00.000Z', '2025-08-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  ARRAY['1007']::text[],
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
  '1210979875867035', 'asana', 'ORD-1210979875867035',
  '2619 DIANJO DR', 'ORLANDO', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-08-05T00:00:00.000Z', '2025-08-05T00:00:00.000Z', '2025-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
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
  '1210969499842397', 'asana', 'ORD-1210969499842397',
  '6103 6th Ave NW', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 874, 874,
  'completed', 'normal', 'refinance',
  '2025-08-04T00:00:00.000Z', '2025-08-08T00:00:00.000Z', '2025-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210959587282189', 'asana', 'ORD-1210959587282189',
  '1821 37TH ST', 'ORLANDO', 'FL', '32839', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-08-03T00:00:00.000Z', '2025-08-08T00:00:00.000Z', '2025-08-07T00:00:00.000Z',
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
  '1210959526581760', 'asana', 'ORD-1210959526581760',
  '207 W Gladys St', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-08-03T00:00:00.000Z', '2025-08-05T00:00:00.000Z', '2025-08-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1210941877070923', 'asana', 'ORD-1210941877070923',
  '2360 Central Pkwy', 'Deland', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-31T00:00:00.000Z', '2025-08-07T00:00:00.000Z', '2025-08-06T00:00:00.000Z',
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
  '1210933291073415', 'asana', 'ORD-1210933291073415',
  '205 W Gladys St', 'Tampa', 'FL', '33602', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-07-30T00:00:00.000Z', '2025-08-05T00:00:00.000Z', '2025-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1210931309016657', 'asana', 'ORD-1210931309016657',
  '2232 Hilton St', 'Port Charlotte', 'FL', '33948', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-07-30T00:00:00.000Z', '2025-08-07T00:00:00.000Z', '2025-08-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210933327988082', 'asana', 'ORD-1210933327988082',
  '2224 Hilton St', 'Port Charlotte', 'FL', '33948', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-07-30T00:00:00.000Z', '2025-08-04T00:00:00.000Z', '2025-08-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210897400932389', 'asana', 'ORD-1210897400932389',
  '7 Bahia Cir Way', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-07-26T00:00:00.000Z', '2025-07-30T00:00:00.000Z', '2025-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210897426049845', 'asana', 'ORD-1210897426049845',
  '40 Willow Rd', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-26T00:00:00.000Z', '2025-08-01T00:00:00.000Z', '2025-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210897277698531', 'asana', 'ORD-1210897277698531',
  '3428 SOHO ST Apartment 307 # CONDO', 'ORLANDO', 'FL', '32835', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-07-26T00:00:00.000Z', '2025-08-15T00:00:00.000Z', '2025-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1210885547486398', 'asana', 'ORD-1210885547486398',
  '302 Bamboo Dr', 'Port Charlotte', 'FL', '33954', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2025-07-24T00:00:00.000Z', '2025-07-30T00:00:00.000Z', '2025-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004D',
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
  '1210884591903983', 'asana', 'ORD-1210884591903983',
  '7815 16th Ave NW', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 737, 737,
  'completed', 'normal', 'refinance',
  '2025-07-24T00:00:00.000Z', '2025-07-29T00:00:00.000Z', '2025-07-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210875364866637', 'asana', 'ORD-1210875364866637',
  '2413 Clematis Street', 'Sarasota', 'FL', '34239', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-07-23T00:00:00.000Z', '2025-07-30T00:00:00.000Z', '2025-07-31T00:00:00.000Z',
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
  '1210853323802599', 'asana', 'ORD-1210853323802599',
  '10 Trout Way', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'new', 'normal', 'refinance',
  '2025-07-21T00:00:00.000Z', '2025-07-21T00:00:00.000Z', NULL,
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1210850273340436', 'asana', 'ORD-1210850273340436',
  '6 Locust Loop Pl', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-21T00:00:00.000Z', '2025-07-29T00:00:00.000Z', '2025-07-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210850273340426', 'asana', 'ORD-1210850273340426',
  '15 Laurel Ct', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-21T00:00:00.000Z', '2025-07-21T00:00:00.000Z', '2025-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210853009187093', 'asana', 'ORD-1210853009187093',
  '12 Willow Ter', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-21T00:00:00.000Z', '2025-07-29T00:00:00.000Z', '2025-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210851542063498', 'asana', 'ORD-1210851542063498',
  '319 Anchovie Ct', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-21T00:00:00.000Z', '2025-07-28T00:00:00.000Z', '2025-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1210839578932174', 'asana', 'ORD-1210839578932174',
  '717 S Atlantic Ave Cocoa', 'Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 700, 700,
  'completed', 'normal', 'refinance',
  '2025-07-20T00:00:00.000Z', '2025-07-25T00:00:00.000Z', '2025-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
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
  '1210828363159483', 'asana', 'ORD-1210828363159483',
  '486 Ogden Ave', 'Umatilla', 'FL', '32784', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Atlas VMS' LIMIT 1), 360, 360,
  'completed', 'normal', 'refinance',
  '2025-07-17T00:00:00.000Z', '2025-07-24T00:00:00.000Z', '2025-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Reverse Mortgage', 'FHA',
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
  '1210828346863628', 'asana', 'ORD-1210828346863628',
  '1813 Glenbay Court', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-07-17T00:00:00.000Z', '2025-07-17T00:00:00.000Z', '2025-07-18T00:00:00.000Z',
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
  '1210828322378601', 'asana', 'ORD-1210828322378601',
  '4732 Babys Breath Place', 'Lake Hamilton', 'FL', '33851', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-07-17T00:00:00.000Z', '2025-07-17T00:00:00.000Z', '2025-07-29T00:00:00.000Z',
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
  '1210827559605916', 'asana', 'ORD-1210827559605916',
  '615 Marmora Avenue', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-07-17T00:00:00.000Z', '2025-07-21T00:00:00.000Z', '2025-07-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'New Construction', '1004',
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
  '1210796737934190', 'asana', 'ORD-1210796737934190',
  '1843 Bramblewood Dr', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-15T00:00:00.000Z', '2025-07-18T00:00:00.000Z', '2025-07-21T00:00:00.000Z',
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
  '1210794918624722', 'asana', 'ORD-1210794918624722',
  '2702 Graduate Court', 'Orlando', 'FL', '32826', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-07-14T00:00:00.000Z', '2025-07-18T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
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
  '1210778640304382', 'asana', 'ORD-1210778640304382',
  '41428 Rabanal Trail', 'EUSTIS', 'FL', '41428', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-07-12T00:00:00.000Z', '2025-07-12T00:00:00.000Z', '2025-07-21T00:00:00.000Z',
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
  '1210761723254050', 'asana', 'ORD-1210761723254050',
  '17046 Byron Ave', 'Port Charlotte', 'FL', '17046', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2025-07-10T00:00:00.000Z', '2025-07-11T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004D',
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
  '1210758400452654', 'asana', 'ORD-1210758400452654',
  '539 Clark Street', 'Maitland', 'FL', '32751', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-07-09T00:00:00.000Z', '2025-07-16T00:00:00.000Z', '2025-07-20T00:00:00.000Z',
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
  '1210758297398039', 'asana', 'ORD-1210758297398039',
  '521 Sunrise Dr', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 100, 100,
  'completed', 'normal', 'refinance',
  '2025-07-09T00:00:00.000Z', '2025-07-15T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
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
  '1210748119571412', 'asana', 'ORD-1210748119571412',
  '897 S Hickory Ridge Ln', 'Avon Park', 'FL', '33825', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 414, 414,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-16T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1210748231827148', 'asana', 'ORD-1210748231827148',
  '15 Bahia Court Track', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-16T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210747552176882', 'asana', 'ORD-1210747552176882',
  '3606 Lake Buynak Road', 'Windmere', 'FL', '34786', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-15T00:00:00.000Z', '2025-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'New Construction', '1004',
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
  '1210741193172387', 'asana', 'ORD-1210741193172387',
  '3743 Waterbird Dr', 'New Port Richey', 'FL', '34652', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-09T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210737410798598', 'asana', 'ORD-1210737410798598',
  '236 21st Ave N', 'Saint Petersburg', 'FL', '33704', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-10T00:00:00.000Z', '2025-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
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
  '1210737176215869', 'asana', 'ORD-1210737176215869',
  '1899 Barker St NE', 'Palm Bay', 'FL', '32907', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-07-08T00:00:00.000Z', '2025-07-08T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
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
  '1210737277247677', 'asana', 'ORD-1210737277247677',
  '1470 NE Old Mill Drive', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-07-07T00:00:00.000Z', '2025-07-24T00:00:00.000Z', '2025-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1210719306757772', 'asana', 'ORD-1210719306757772',
  '3444 21st St N', 'St. Petersburg', 'FL', '33713', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-07-04T00:00:00.000Z', '2025-07-14T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
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
  '1210713415643358', 'asana', 'ORD-1210713415643358',
  '1495 Penniwa St Intercession City FL', '3384', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-07-03T00:00:00.000Z', '2025-07-14T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['216']::text[],
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
  '1210713092991945', 'asana', 'ORD-1210713092991945',
  '2713 Brianholly Drive', 'Valrico', 'FL', '33596', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-07-03T00:00:00.000Z', '2025-07-08T00:00:00.000Z', '2025-07-14T00:00:00.000Z',
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
  '1210713135856929', 'asana', 'ORD-1210713135856929',
  '1417 Addison Bluff Lane', 'Kissimmee', 'FL', '34744', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-07-03T00:00:00.000Z', '2025-07-10T00:00:00.000Z', '2025-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210702820154925', 'asana', 'ORD-1210702820154925',
  '2206 Stonington Ave Unit 2206', 'Orlando', 'FL', '32817', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-07-02T00:00:00.000Z', '2025-07-10T00:00:00.000Z', '2025-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1210692039211605', 'asana', 'ORD-1210692039211605',
  '1762 Regal River Circle', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-07-01T00:00:00.000Z', '2025-07-01T00:00:00.000Z', '2025-07-07T00:00:00.000Z',
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
  '1210692275777257', 'asana', 'ORD-1210692275777257',
  '254 Glasgow Court', 'Davenport', 'FL', '33897', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-07-01T00:00:00.000Z', '2025-07-09T00:00:00.000Z', '2025-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210679969476969', 'asana', 'ORD-1210679969476969',
  '2585 Lorraine Ct', 'West Palm Beach', 'FL', '33403', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-30T00:00:00.000Z', '2025-07-09T00:00:00.000Z', '2025-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'SW - OUT OF AREA', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210665330088856', 'asana', 'ORD-1210665330088856',
  '2817 Fitzooth Drive Winter', 'Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-06-28T00:00:00.000Z', '2025-07-02T00:00:00.000Z', '2025-07-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004',
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
  '1210665315359739', 'asana', 'ORD-1210665315359739',
  '100 Tuomey Court Lake', 'Placid', 'FL', '33852', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-06-27T00:00:00.000Z', '2025-07-08T00:00:00.000Z', '2025-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
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
  '1210655772712414', 'asana', 'ORD-1210655772712414',
  '8145 N Triana Dr', 'Dunnellon', 'FL', '34434', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-27T00:00:00.000Z', '2025-06-27T00:00:00.000Z', '2025-06-27T00:00:00.000Z',
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
  '1210655503166381', 'asana', 'ORD-1210655503166381',
  '9979 Schroeder Aly Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-06-27T00:00:00.000Z', '2025-07-03T00:00:00.000Z', '2025-07-02T00:00:00.000Z',
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
  '1210655578953537', 'asana', 'ORD-1210655578953537',
  '1840 Anzle Ave Winter', 'Park', 'FL', '32789', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-26T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-27T00:00:00.000Z',
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
  '1210645310364665', 'asana', 'ORD-1210645310364665',
  '60 ALHAMBRA DR MERRITT', 'ISLAND', 'FL', '32952', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-06-25T00:00:00.000Z', '2025-07-02T00:00:00.000Z', '2025-07-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210645232705371', 'asana', 'ORD-1210645232705371',
  '690 Balmoral Rd', 'Winter Park', 'FL', '32789', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-06-25T00:00:00.000Z', '2025-07-02T00:00:00.000Z', '2025-07-02T00:00:00.000Z',
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
  '1210645213287966', 'asana', 'ORD-1210645213287966',
  '647 Washington Way Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-06-25T00:00:00.000Z', '2025-07-07T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210634260615287', 'asana', 'ORD-1210634260615287',
  '126 D St', 'Lake Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-07-04T00:00:00.000Z', '2025-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  ARRAY['1007']::text[],
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
  '1210634043109338', 'asana', 'ORD-1210634043109338',
  '1274 Bertland Way', 'Clearwater', 'FL', '33755', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-07-04T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210623708931079', 'asana', 'ORD-1210623708931079',
  '306-308 Caldbeck Way', 'Kissimmee', 'FL', '34758', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-06-24T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['216']::text[],
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
  '1210623708931067', 'asana', 'ORD-1210623708931067',
  '408-410 Cocoa Ct', 'Kissimmee', 'FL', '34758', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-06-24T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['216']::text[],
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
  '1210633800930884', 'asana', 'ORD-1210633800930884',
  '526-528 Imperial Place', 'Kissimmee', 'FL', '34758', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-06-24T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['216']::text[],
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
  '1210633448158874', 'asana', 'ORD-1210633448158874',
  '3533 Anibal Street', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210626367205349', 'asana', 'ORD-1210626367205349',
  '3414 East 32nd Avenue', 'Tampa', 'FL', '33610', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-06-24T00:00:00.000Z', '2025-06-27T00:00:00.000Z', '2025-06-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1210609319858039', 'asana', 'ORD-1210609319858039',
  '2639 Cayman Way Winter', 'Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319858031', 'asana', 'ORD-1210609319858031',
  '6011 Greenwood Ln', 'Pensacola', 'FL', '32504', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'SW - OUT OF AREA', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609319858023', 'asana', 'ORD-1210609319858023',
  '1405 Jersey Ave', 'Fort Pierce', 'FL', '34950', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319858015', 'asana', 'ORD-1210609319858015',
  '403 Virginia St', 'Frostproof', 'FL', '33843', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319858006', 'asana', 'ORD-1210609319858006',
  '1244 W 25th St', 'Riviera Beach', 'FL', '33404', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857994', 'asana', 'ORD-1210609319857994',
  '1306 South C Terrace', 'Lake Worth Beach', 'FL', '33460', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857986', 'asana', 'ORD-1210609319857986',
  '1008 Cochran Dr', 'Lake Worth Beach', 'FL', '33461', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857978', 'asana', 'ORD-1210609319857978',
  '1021 S C St', 'Lake Worth Beach', 'FL', '33460', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857968', 'asana', 'ORD-1210609319857968',
  '1011 22nd St', 'West Palm Beach', 'FL', '33407', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857958', 'asana', 'ORD-1210609319857958',
  '1030 22nd St', 'West Palm Beach', 'FL', '33407', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609226168530', 'asana', 'ORD-1210609226168530',
  '6438 Hudson Rd', 'Cocoa', 'FL', '32927', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-23T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609226168522', 'asana', 'ORD-1210609226168522',
  '524 Westminster Ave', 'Melbourne', 'FL', '32935', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609226168514', 'asana', 'ORD-1210609226168514',
  '22257 Yonkers Ave', 'Port Charlotte', 'FL', '22257', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210609319857943', 'asana', 'ORD-1210609319857943',
  '392 Arora Blvd', 'Orange Park', 'FL', '32073', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609225796884', 'asana', 'ORD-1210609225796884',
  '1995 W 4th St', 'Jacksonville', 'FL', '32209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609225796876', 'asana', 'ORD-1210609225796876',
  '1995 W 4th St', 'Jacksonville', 'FL', '32209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609225796868', 'asana', 'ORD-1210609225796868',
  '65 White Hall Dr', 'Palm Coast', 'FL', '32164', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210609259432452', 'asana', 'ORD-1210609259432452',
  '4218 W Nassau St', 'Tampa', 'FL', '33607', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-22T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Purchase', '2055',
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
  '1210604875920876', 'asana', 'ORD-1210604875920876',
  '4314 Cedar Grove St', 'Holiday', 'FL', '34691', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210606995263882', 'asana', 'ORD-1210606995263882',
  '412 Hancock Ln', 'Pensacola', 'FL', '32503', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'SW - OUT OF AREA', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210604875920864', 'asana', 'ORD-1210604875920864',
  '9704 Gatun St', 'New Port Richey', 'FL', '34654', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-07-02T00:00:00.000Z', '2025-07-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210604875920832', 'asana', 'ORD-1210604875920832',
  '4701 W Trilby Ave', 'Tampa', 'FL', '33616', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
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
  '1210604875920824', 'asana', 'ORD-1210604875920824',
  '401 Grassy Key Way', 'Groveland', 'FL', '34736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
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
  '1210606826874313', 'asana', 'ORD-1210606826874313',
  '2796 Nautilus Dr', 'Avon Park', 'FL', '33825', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
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
  '1210602264305964', 'asana', 'ORD-1210602264305964',
  '3186 Dudley Dr', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210606016077295', 'asana', 'ORD-1210606016077295',
  '7311 Cedar Point Dr', 'New Port Richey', 'FL', '34653', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210605871698842', 'asana', 'ORD-1210605871698842',
  '363 Dundee Dr', 'Kissimmee', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-21T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
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
  '1210605853298913', 'asana', 'ORD-1210605853298913',
  '1308 33rd St NW', 'Winter Haven', 'FL', '33881', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-20T00:00:00.000Z', '2025-06-30T00:00:00.000Z', '2025-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1210596763894947', 'asana', 'ORD-1210596763894947',
  '2111 Como St', 'Port Charlotte', 'FL', '33948', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-19T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
  ARRAY['1007']::text[],
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
  '1210595108127227', 'asana', 'ORD-1210595108127227',
  '361 Wade Park Ct', 'Davenport', 'FL', '33897', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-06-19T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1210587329026380', 'asana', 'ORD-1210587329026380',
  '9500 Shortleaf Court', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 514, 514,
  'completed', 'normal', 'refinance',
  '2025-06-18T00:00:00.000Z', '2025-06-25T00:00:00.000Z', '2025-06-25T00:00:00.000Z',
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
  '1210587071300553', 'asana', 'ORD-1210587071300553',
  '4601 121st Terrace N', 'Royal Palm Beach', 'FL', '33411', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-06-18T00:00:00.000Z', '2025-06-23T00:00:00.000Z', '2025-06-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'SW - OUT OF AREA', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210577439365856', 'asana', 'ORD-1210577439365856',
  '316 Pitch Pine Dr', 'Debary', 'FL', '32713', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-17T00:00:00.000Z', '2025-06-23T00:00:00.000Z', '2025-06-18T00:00:00.000Z',
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
  '1210574656252836', 'asana', 'ORD-1210574656252836',
  '700 Remington Oak Dr', 'Lake Mary', 'FL', '32746', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-06-17T00:00:00.000Z', '2025-06-23T00:00:00.000Z', '2025-06-23T00:00:00.000Z',
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
  '1210548099175307', 'asana', 'ORD-1210548099175307',
  '1400 Eudora Rd APT G70', 'Mount Dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-06-13T00:00:00.000Z', '2025-06-19T00:00:00.000Z', '2025-06-19T00:00:00.000Z',
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
  '1210547824837527', 'asana', 'ORD-1210547824837527',
  '5921 Cornelia Ave', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-06-13T00:00:00.000Z', '2025-06-13T00:00:00.000Z', '2025-07-09T00:00:00.000Z',
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
  '1210539256688957', 'asana', 'ORD-1210539256688957',
  '1470 Lake Harney Woods Blvd', 'Mims', 'FL', '32754', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Accurate Group' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-06-12T00:00:00.000Z', '2025-06-19T00:00:00.000Z', '2025-06-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004C',
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
  '1210526438678538', 'asana', 'ORD-1210526438678538',
  '11012 Ullswater Ln', 'Windermere', 'FL', '11012', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Atlas VMS' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-06-11T00:00:00.000Z', '2025-06-16T00:00:00.000Z', '2025-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1210517603109644', 'asana', 'ORD-1210517603109644',
  '14501 Grove Park Resort Avenue Unit 4-4220 Winter Garden', 'Florida 34787', 'FL', '14501', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 470, 470,
  'completed', 'normal', 'refinance',
  '2025-06-10T00:00:00.000Z', '2025-06-17T00:00:00.000Z', '2025-06-18T00:00:00.000Z',
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
  '1210515648112273', 'asana', 'ORD-1210515648112273',
  '665 Summit River Dr', 'Apopka', 'FL', '32712', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-06-10T00:00:00.000Z', '2025-06-17T00:00:00.000Z', '2025-06-16T00:00:00.000Z',
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
  '1210502338480161', 'asana', 'ORD-1210502338480161',
  '5827 Wedgefield Dr', 'Zephyrhills', 'FL', '33541', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-06-09T00:00:00.000Z', '2025-06-16T00:00:00.000Z', '2025-06-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210505118982969', 'asana', 'ORD-1210505118982969',
  '5857 Wedgefield Dr', 'Zephyrhills', 'FL', '33541', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-06-09T00:00:00.000Z', '2025-06-16T00:00:00.000Z', '2025-06-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210505132625799', 'asana', 'ORD-1210505132625799',
  '216 San Fernando Court', 'Sanford', 'FL', '32773', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-06-09T00:00:00.000Z', '2025-06-16T00:00:00.000Z', '2025-06-13T00:00:00.000Z',
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
  '1210504070567713', 'asana', 'ORD-1210504070567713',
  '5256 County Road 542f', 'Bushnell', 'FL', '33513', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 225, 225,
  'completed', 'normal', 'refinance',
  '2025-06-09T00:00:00.000Z', '2025-06-13T00:00:00.000Z', '2025-06-11T00:00:00.000Z',
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
  '1210490129111786', 'asana', 'ORD-1210490129111786',
  '2783 Gardenia Rd', 'DeLand', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-07T00:00:00.000Z', '2025-06-17T00:00:00.000Z', '2025-06-17T00:00:00.000Z',
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
  '1210488811320578', 'asana', 'ORD-1210488811320578',
  '12850 LEXINGTON SUMMIT ST', 'ORLANDO', 'FL', '12850', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-06-06T00:00:00.000Z', '2025-06-13T00:00:00.000Z', '2025-06-12T00:00:00.000Z',
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
  '1210478427949736', 'asana', 'ORD-1210478427949736',
  '11120 Whistling Pine Way', 'Orlando', 'FL', '11120', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-06-05T00:00:00.000Z', '2025-06-12T00:00:00.000Z', '2025-06-10T00:00:00.000Z',
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
  '1210469487470564', 'asana', 'ORD-1210469487470564',
  '1618 12th St S', 'St. Petersburg', 'FL', '33705', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-06-04T00:00:00.000Z', '2025-06-12T00:00:00.000Z', '2025-06-10T00:00:00.000Z',
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
  '1210456916255084', 'asana', 'ORD-1210456916255084',
  '14 Dogwood Trail', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-03T00:00:00.000Z', '2025-06-12T00:00:00.000Z', '2025-06-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210456421590279', 'asana', 'ORD-1210456421590279',
  '209 Lemans Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-03T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210456499054016', 'asana', 'ORD-1210456499054016',
  '17046 Byron Ave', 'Port Charlotte', 'FL', '17046', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-06-03T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210456160424074', 'asana', 'ORD-1210456160424074',
  '302 Bamboo Dr', 'Port Charlotte', 'FL', '33954', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-06-03T00:00:00.000Z', '2025-06-26T00:00:00.000Z', '2025-06-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1210445626296837', 'asana', 'ORD-1210445626296837',
  '10641 Broadland Pass', 'Thonotosassa', 'FL', '10641', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-06-02T00:00:00.000Z', '2025-06-06T00:00:00.000Z', '2025-06-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '2000',
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
  '1210445445208267', 'asana', 'ORD-1210445445208267',
  '284 Pinestraw Cir', 'Altamonte Springs', 'FL', '32714', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-06-02T00:00:00.000Z', '2025-06-09T00:00:00.000Z', '2025-06-10T00:00:00.000Z',
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
  '1210427068001401', 'asana', 'ORD-1210427068001401',
  '2207 Eiffel Dr', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-05-30T00:00:00.000Z', '2025-07-14T00:00:00.000Z', '2025-07-15T00:00:00.000Z',
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
  '1210426807765136', 'asana', 'ORD-1210426807765136',
  '13556 Hawkeye Dr', 'Orlando', 'FL', '13556', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-05-30T00:00:00.000Z', '2025-06-24T00:00:00.000Z', '2025-06-23T00:00:00.000Z',
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
  '1210406043137032', 'asana', 'ORD-1210406043137032',
  '26551 BLOOMFIELD AVE', 'Yalaha', 'FL', '26551', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-05-28T00:00:00.000Z', '2025-06-04T00:00:00.000Z', '2025-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1210405680929712', 'asana', 'ORD-1210405680929712',
  '10081 Cobalt Bay Road', 'Orlando', 'FL', '10081', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-05-28T00:00:00.000Z', '2025-06-06T00:00:00.000Z', '2025-06-03T00:00:00.000Z',
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
  '1210393278782434', 'asana', 'ORD-1210393278782434',
  '630 SAILFISH RD', 'Winter Springs', 'FL', '32708', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-05-27T00:00:00.000Z', '2025-05-30T00:00:00.000Z', '2025-05-30T00:00:00.000Z',
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
  '1210393228911976', 'asana', 'ORD-1210393228911976',
  '4014 Hemingway Cir Haines', 'City', 'FL', '33844', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-05-27T00:00:00.000Z', '2025-06-03T00:00:00.000Z', '2025-06-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1210392787059767', 'asana', 'ORD-1210392787059767',
  '8929 Legacy Court Apartment 106', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-05-27T00:00:00.000Z', '2025-06-05T00:00:00.000Z', '2025-06-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1210381257604778', 'asana', 'ORD-1210381257604778',
  '352 Inglenook Circle Winter', 'Springs', 'FL', '32708', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-05-26T00:00:00.000Z', '2025-06-02T00:00:00.000Z', '2025-05-30T00:00:00.000Z',
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
  '1210369643228172', 'asana', 'ORD-1210369643228172',
  '5251 Lanette St', 'Orlando', 'FL', '32811', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-05-23T00:00:00.000Z', '2025-06-03T00:00:00.000Z', '2025-06-02T00:00:00.000Z',
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
  '1210367125878306', 'asana', 'ORD-1210367125878306',
  '1535 W EUCLID AVE', 'Deland', 'FL', '32720', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-05-23T00:00:00.000Z', '2025-05-23T00:00:00.000Z', '2025-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1210346709322316', 'asana', 'ORD-1210346709322316',
  '1735 Louisiana St', 'Wauchula', 'FL', '33873', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-05-21T00:00:00.000Z', '2025-05-27T00:00:00.000Z', '2025-05-27T00:00:00.000Z',
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
  '1210345859588371', 'asana', 'ORD-1210345859588371',
  '1791 Taylor Ave Winter', 'Park', 'FL', '32789', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-05-21T00:00:00.000Z', '2025-06-10T00:00:00.000Z', '2025-06-11T00:00:00.000Z',
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
  '1210345551374117', 'asana', 'ORD-1210345551374117',
  '1627 Mizell Ave', 'Winter Park', 'FL', '32789', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-05-21T00:00:00.000Z', '2025-06-10T00:00:00.000Z', '2025-06-12T00:00:00.000Z',
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
  '1210323961539726', 'asana', 'ORD-1210323961539726',
  '5307 22nd Ave W', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 985, 985,
  'completed', 'normal', 'refinance',
  '2025-05-19T00:00:00.000Z', '2025-05-22T00:00:00.000Z', '2025-05-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210321107253689', 'asana', 'ORD-1210321107253689',
  '1265 Sunningdale Ln Ormond', 'Beach', 'FL', '32174', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-05-19T00:00:00.000Z', '2025-05-26T00:00:00.000Z', '2025-05-23T00:00:00.000Z',
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
  '1210278340998516', 'asana', 'ORD-1210278340998516',
  '0 Lake Caloosa Landing Frostproof', 'FL', 'FL', '33843', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-05-16T00:00:00.000Z', '2025-05-23T00:00:00.000Z', '2025-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', 'FHA',
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
  '1210277554159858', 'asana', 'ORD-1210277554159858',
  '1030-1032 Northwest 57th Court', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2025-05-16T00:00:00.000Z', '2025-05-22T00:00:00.000Z', '2025-05-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004D',
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
  '1210260908105303', 'asana', 'ORD-1210260908105303',
  '9126 Lake Coventry Ct', 'Gotha', 'FL', '34734', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-05-15T00:00:00.000Z', '2025-05-22T00:00:00.000Z', '2025-05-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210256105570238', 'asana', 'ORD-1210256105570238',
  '801 Fox Valley Dr', 'Longwood', 'FL', '32779', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 314, 314,
  'completed', 'normal', 'refinance',
  '2025-05-14T00:00:00.000Z', '2025-05-21T00:00:00.000Z', '2025-05-20T00:00:00.000Z',
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
  '1210244832767326', 'asana', 'ORD-1210244832767326',
  '1395 ENGLEWOOD DR', 'Saint Cloud', 'FL', '34772', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-05-13T00:00:00.000Z', '2025-05-15T00:00:00.000Z', '2025-05-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1210244561850205', 'asana', 'ORD-1210244561850205',
  '551 Sandra Ave', 'Daytona Beach', 'FL', '32114', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-05-13T00:00:00.000Z', '2025-05-13T00:00:00.000Z', '2025-05-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210237453701645', 'asana', 'ORD-1210237453701645',
  '1231 Dunbar Ave', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-05-13T00:00:00.000Z', '2025-05-16T00:00:00.000Z', '2025-05-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'LAND',
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
  '1210210794157396', 'asana', 'ORD-1210210794157396',
  '6147 Arbor Watch Loop', 'Orlando', 'FL', '32829', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-05-09T00:00:00.000Z', '2025-05-15T00:00:00.000Z', '2025-05-15T00:00:00.000Z',
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
  '1210199605581894', 'asana', 'ORD-1210199605581894',
  '6012 Oak Green Loop', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-05-08T00:00:00.000Z', '2025-05-14T00:00:00.000Z', '2025-05-14T00:00:00.000Z',
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
  '1210192394859641', 'asana', 'ORD-1210192394859641',
  '411 Palm Ave', 'Anna Maria', 'FL', '34216', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-05-07T00:00:00.000Z', '2025-06-03T00:00:00.000Z', '2025-06-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210191688366060', 'asana', 'ORD-1210191688366060',
  '1302 Fort Meade Rd', 'Frostproof', 'FL', '33843', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-05-07T00:00:00.000Z', '2025-05-15T00:00:00.000Z', '2025-05-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1210177399381601', 'asana', 'ORD-1210177399381601',
  '3310 NW 172nd Terrace', 'Miami Gardens', 'FL', '33056', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-05-06T00:00:00.000Z', '2025-05-15T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
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
  '1210177043248057', 'asana', 'ORD-1210177043248057',
  '2112 Fish Eagle St', 'Clermont', 'FL', '34714', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-05-06T00:00:00.000Z', '2025-05-13T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
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
  '1210176727355796', 'asana', 'ORD-1210176727355796',
  '2923 Unity Tree Dr', 'Edgewater', 'FL', '32141', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-05-06T00:00:00.000Z', '2025-05-13T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1210166343053778', 'asana', 'ORD-1210166343053778',
  '36129 E Eldorado Lake Drive', 'Eustis', 'FL', '36129', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 700, 700,
  'completed', 'normal', 'refinance',
  '2025-05-05T00:00:00.000Z', '2025-05-08T00:00:00.000Z', '2025-05-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1210165483085201', 'asana', 'ORD-1210165483085201',
  'Duplex North End of', 'Titusville', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-05-05T00:00:00.000Z', '2025-05-14T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1025',
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
  '1210138838093021', 'asana', 'ORD-1210138838093021',
  '21 Southland Rd', 'Venice', 'FL', '34293', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-05-02T00:00:00.000Z', '2025-05-12T00:00:00.000Z', '2025-05-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210138837408016', 'asana', 'ORD-1210138837408016',
  '3451 Devonshire Dr', 'Holiday', 'FL', '34691', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-05-02T00:00:00.000Z', '2025-05-12T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210147320475341', 'asana', 'ORD-1210147320475341',
  '3850 Moog Rd', 'Holiday', 'FL', '34691', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-05-02T00:00:00.000Z', '2025-05-09T00:00:00.000Z', '2025-05-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210147101156206', 'asana', 'ORD-1210147101156206',
  '170 East Davis Boulevard', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-05-02T00:00:00.000Z', '2025-05-07T00:00:00.000Z', '2025-05-07T00:00:00.000Z',
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
  '1210146278138293', 'asana', 'ORD-1210146278138293',
  'Northwest 57th Court 1030-1032', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-05-02T00:00:00.000Z', '2025-05-13T00:00:00.000Z', '2025-05-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1210137413799908', 'asana', 'ORD-1210137413799908',
  '1813 Puffin St', 'Sebring', 'FL', '33870', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-05-01T00:00:00.000Z', '2025-05-08T00:00:00.000Z', '2025-05-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210139920499047', 'asana', 'ORD-1210139920499047',
  '2115 Puffin St', 'Sebring', 'FL', '33870', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-05-01T00:00:00.000Z', '2025-05-08T00:00:00.000Z', '2025-05-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1210137914325079', 'asana', 'ORD-1210137914325079',
  '1538 Brookebridge Drive', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-05-01T00:00:00.000Z', '2025-05-08T00:00:00.000Z', '2025-05-07T00:00:00.000Z',
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
  '1210119999529138', 'asana', 'ORD-1210119999529138',
  '3860 Branch Avenue Mount', 'Dora', 'FL', '32757', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-04-29T00:00:00.000Z', '2025-05-07T00:00:00.000Z', '2025-05-02T00:00:00.000Z',
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
  '1210120079960743', 'asana', 'ORD-1210120079960743',
  '7351 Capstone Drive', 'Groveland', 'FL', '34736', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-04-29T00:00:00.000Z', '2025-05-20T00:00:00.000Z', '2025-05-20T00:00:00.000Z',
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
  '1210113654656796', 'asana', 'ORD-1210113654656796',
  '14441 Liberty St', 'Orlando', 'FL', '14441', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2025-04-29T00:00:00.000Z', '2025-05-05T00:00:00.000Z', '2025-05-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004C',
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
  '1210103110549311', 'asana', 'ORD-1210103110549311',
  '7830 Hawk Crest Ln', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-04-28T00:00:00.000Z', '2025-05-02T00:00:00.000Z', '2025-05-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1210098374873943', 'asana', 'ORD-1210098374873943',
  '1705 Amsel Falls Dr Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 569, 569,
  'completed', 'normal', 'refinance',
  '2025-04-28T00:00:00.000Z', '2025-05-05T00:00:00.000Z', '2025-05-02T00:00:00.000Z',
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
  '1210087052061273', 'asana', 'ORD-1210087052061273',
  '130 Adriatic Ave', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-25T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-05-02T00:00:00.000Z',
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
  '1210087070599631', 'asana', 'ORD-1210087070599631',
  '128 Adriatic Ave', 'Tampa', 'FL', '33606', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-25T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-05-02T00:00:00.000Z',
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
  '1210086311585000', 'asana', 'ORD-1210086311585000',
  '3320 W Villa Rosa St', 'Tampa', 'FL', '33611', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-25T00:00:00.000Z', '2025-04-29T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
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
  '1210076268245716', 'asana', 'ORD-1210076268245716',
  '13334 Sw 100Th Ln', 'Dunnellon', 'FL', '13334', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-04-24T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
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
  '1210076123102056', 'asana', 'ORD-1210076123102056',
  '28 Da Rosa Ave', 'Debary', 'FL', '32713', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-04-24T00:00:00.000Z', '2025-04-29T00:00:00.000Z', '2025-04-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1210064186587519', 'asana', 'ORD-1210064186587519',
  '1111 N Lavon Ave', 'Kissimmee', 'FL', '34741', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 725, 725,
  'completed', 'normal', 'refinance',
  '2025-04-23T00:00:00.000Z', '2025-05-01T00:00:00.000Z', '2025-04-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
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
  '1210062359044630', 'asana', 'ORD-1210062359044630',
  '1019 ROYAL OAKS DR', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-23T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
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
  '1210061668657073', 'asana', 'ORD-1210061668657073',
  '5640 S Dede Ter', 'Inverness', 'FL', '34452', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 425, 425,
  'completed', 'normal', 'refinance',
  '2025-04-23T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
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
  '1210052398699159', 'asana', 'ORD-1210052398699159',
  '2080 Mango Tree Dr', 'Edgewater', 'FL', '32141', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-04-22T00:00:00.000Z', '2025-04-30T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
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
  '1210050501884034', 'asana', 'ORD-1210050501884034',
  '401 Century Blvd #C', 'Auburndale', 'FL', '33823', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-04-22T00:00:00.000Z', '2025-04-29T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1210050189018206', 'asana', 'ORD-1210050189018206',
  '7147 Brandywine Dr', 'Englewood', 'FL', '34224', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-22T00:00:00.000Z', '2025-04-25T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1210038634819225', 'asana', 'ORD-1210038634819225',
  '5155 Haywood Ruffin Rd', 'Saint Cloud', 'FL', '34771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2025-04-21T00:00:00.000Z', '2025-04-28T00:00:00.000Z', '2025-04-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1210026594494362', 'asana', 'ORD-1210026594494362',
  '14376 SE 61st Avenue', 'Summerfield', 'FL', '14376', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-04-18T00:00:00.000Z', '2025-04-25T00:00:00.000Z', '2025-04-25T00:00:00.000Z',
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
  '1210026394176456', 'asana', 'ORD-1210026394176456',
  '613 W 25th St', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 537, 537,
  'completed', 'normal', 'refinance',
  '2025-04-18T00:00:00.000Z', '2025-04-29T00:00:00.000Z', '2025-04-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
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
  '1210025873893526', 'asana', 'ORD-1210025873893526',
  '11105 2nd St E', 'Treasure Island', 'FL', '11105', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-18T00:00:00.000Z', '2025-04-25T00:00:00.000Z', '2025-04-23T00:00:00.000Z',
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
  '1210008657384819', 'asana', 'ORD-1210008657384819',
  '5823 Wingate Dr', 'Orlando', 'FL', '32839', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-16T00:00:00.000Z', '2025-04-23T00:00:00.000Z', '2025-04-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209998026053009', 'asana', 'ORD-1209998026053009',
  '691 S Gulfview Blvd Unit 1211', 'Clearwater', 'FL', '33767', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 750, 750,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-25T00:00:00.000Z', '2025-04-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1073',
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
  '1209996725905010', 'asana', 'ORD-1209996725905010',
  '24853 Jackson St', 'Astatula', 'FL', '24853', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-22T00:00:00.000Z', '2025-07-17T00:00:00.000Z',
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
  '1209996359828237', 'asana', 'ORD-1209996359828237',
  '1497 N Normandy Blvd', 'Deltona', 'FL', '32725', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 475, 475,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-22T00:00:00.000Z', '2025-04-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1209995703722717', 'asana', 'ORD-1209995703722717',
  '509 N Garfield Ave', 'Deland', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-22T00:00:00.000Z', '2025-04-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209995499603934', 'asana', 'ORD-1209995499603934',
  '14662 74th St N', 'Loxahatchee', 'FL', '14662', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-21T00:00:00.000Z', '2025-04-21T00:00:00.000Z',
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
  '1209988450580973', 'asana', 'ORD-1209988450580973',
  '2210 NW 2nd Ave', 'Cape Coral', 'FL', '33993', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-15T00:00:00.000Z', '2025-04-21T00:00:00.000Z', '2025-04-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209982369622196', 'asana', 'ORD-1209982369622196',
  '8945 Hinsdale Heights Dr', 'Polk City', 'FL', '33868', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-14T00:00:00.000Z', '2025-04-21T00:00:00.000Z', '2025-04-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1209981759621271', 'asana', 'ORD-1209981759621271',
  '12993 Overstreet Rd', 'Windermere', 'FL', '12993', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-14T00:00:00.000Z', '2025-04-21T00:00:00.000Z', '2025-04-21T00:00:00.000Z',
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
  '1209976853939168', 'asana', 'ORD-1209976853939168',
  '1413 Warwick Pl', 'Orlando', 'FL', '32806', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-14T00:00:00.000Z', '2025-04-18T00:00:00.000Z', '2025-04-22T00:00:00.000Z',
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
  '1209981360493396', 'asana', 'ORD-1209981360493396',
  '2027 E Harding St', 'Orlando', 'FL', '32806', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-14T00:00:00.000Z', '2025-04-18T00:00:00.000Z', '2025-04-22T00:00:00.000Z',
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
  '1209966086118939', 'asana', 'ORD-1209966086118939',
  '1356 Willow Wind Drive', 'Clermont', 'FL', '34711', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-04-11T00:00:00.000Z', '2025-04-18T00:00:00.000Z', '2025-04-16T00:00:00.000Z',
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
  '1209966164453576', 'asana', 'ORD-1209966164453576',
  '1612 Sherwood Ave', 'West Palm Beach', 'FL', '33407', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-11T00:00:00.000Z', '2025-04-21T00:00:00.000Z', '2025-04-18T00:00:00.000Z',
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
  '1209953688313774', 'asana', 'ORD-1209953688313774',
  '17041 Malta Ave', 'Port Charlotte', 'FL', '17041', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-10T00:00:00.000Z', '2025-04-16T00:00:00.000Z', '2025-04-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1209952585764001', 'asana', 'ORD-1209952585764001',
  '13334 Sw 100Th Ln', 'Dunnellon', 'FL', '13334', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-10T00:00:00.000Z', '2025-04-16T00:00:00.000Z', '2025-04-17T00:00:00.000Z',
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
  '1209944279495791', 'asana', 'ORD-1209944279495791',
  '29 S Ivey Lane', 'Orlando Fl. 32811', 'FL', '32811', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-04-09T00:00:00.000Z', '2025-04-15T00:00:00.000Z', '2025-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', 'LAND',
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
  '1209942881628315', 'asana', 'ORD-1209942881628315',
  '17529 Eve Dr', 'Montverde', 'FL', '17529', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 418, 418,
  'completed', 'normal', 'refinance',
  '2025-04-09T00:00:00.000Z', '2025-04-16T00:00:00.000Z', '2025-04-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Short Sale', 'FHA',
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
  '1209922903459896', 'asana', 'ORD-1209922903459896',
  '8751 Sand Lake Ct', 'Wellington', 'FL', '33467', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-08T00:00:00.000Z', '2025-04-10T00:00:00.000Z', '2025-04-09T00:00:00.000Z',
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
  '1209915331884865', 'asana', 'ORD-1209915331884865',
  '2492 Brookshire Ave', 'Winter Park', 'FL', '32792', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-04-07T00:00:00.000Z', '2025-04-11T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
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
  '1209900763359341', 'asana', 'ORD-1209900763359341',
  '401 73rd St', 'Holmes Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-04-04T00:00:00.000Z', '2025-04-15T00:00:00.000Z', '2025-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
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
  '1209898810024163', 'asana', 'ORD-1209898810024163',
  '7228 - 7234 New York Ave', 'Hudson', 'FL', '34667', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-04T00:00:00.000Z', '2025-04-11T00:00:00.000Z', '2025-04-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209891931596322', 'asana', 'ORD-1209891931596322',
  '1791 Nebraska Loop', 'Sumterville', 'FL', '33585', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Bluebird Valuation' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-04-04T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209891323538199', 'asana', 'ORD-1209891323538199',
  '1212 SE Nancy Ln', 'Port St. Lucie', 'FL', '34983', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-11T00:00:00.000Z', '2025-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209891246240891', 'asana', 'ORD-1209891246240891',
  '11053 Mayflower Rd', 'Spring Hill', 'FL', '11053', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-16T00:00:00.000Z', '2025-04-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1209891111483518', 'asana', 'ORD-1209891111483518',
  '8048 Sherwood Cir', 'LaBelle', 'FL', '33935', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-10T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1209885968404859', 'asana', 'ORD-1209885968404859',
  '1590 Gayle Avenue', 'Titusville', 'FL', '32780', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-10T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
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
  '1209877054785136', 'asana', 'ORD-1209877054785136',
  '1043 N New York Ave', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  ARRAY['1007']::text[],
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
  '1209877054785128', 'asana', 'ORD-1209877054785128',
  '13 Aspen Dr', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-03T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-09T00:00:00.000Z',
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
  '1209877054785114', 'asana', 'ORD-1209877054785114',
  '28 Aspen Dr', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-09T00:00:00.000Z',
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
  '1209878113361481', 'asana', 'ORD-1209878113361481',
  '20 Spruce Loop', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209878100265366', 'asana', 'ORD-1209878100265366',
  '804 Ware Ave NE', 'Winter Haven', 'FL', '33881', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
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
  '1209877054785058', 'asana', 'ORD-1209877054785058',
  '9416 Greystone Rd', 'Thonotosassa', 'FL', '33592', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-10T00:00:00.000Z', '2025-04-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1209877054785054', 'asana', 'ORD-1209877054785054',
  '5789- 5791 Northwest 10th Street', 'Ocala', 'FL', '34482', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1209877054785044', 'asana', 'ORD-1209877054785044',
  '6903 Dickinson Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-10T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1025',
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
  '1209877889411409', 'asana', 'ORD-1209877889411409',
  '6910 Dickinson Dr', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1209877797978853', 'asana', 'ORD-1209877797978853',
  '138 W Northside Dr', 'Lake Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
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
  '1209877829132468', 'asana', 'ORD-1209877829132468',
  '23 Sawfish Ct', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209876516104419', 'asana', 'ORD-1209876516104419',
  '6276 Blueberry Dr', 'Englewood', 'FL', '34224', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-04-02T00:00:00.000Z', '2025-04-09T00:00:00.000Z', '2025-04-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
  NULL,
  'online', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209860625141319', 'asana', 'ORD-1209860625141319',
  'SW 158th Loop', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-04-01T00:00:00.000Z', '2025-04-08T00:00:00.000Z', '2025-04-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
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
  '1209860305919532', 'asana', 'ORD-1209860305919532',
  '730 Campo Ln', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 125, 125,
  'completed', 'normal', 'refinance',
  '2025-04-01T00:00:00.000Z', '2025-05-05T00:00:00.000Z', '2025-04-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Investment', '1007',
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
  '1209811284044473', 'asana', 'ORD-1209811284044473',
  '3850 Pompano Dr SE unit 8', 'St. Petersburg', 'FL', '33705', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 461.54, 461.54,
  'completed', 'normal', 'refinance',
  '2025-03-27T00:00:00.000Z', '2025-04-02T00:00:00.000Z', '2025-04-02T00:00:00.000Z',
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
  '1209811284044461', 'asana', 'ORD-1209811284044461',
  '3850 Pompano Dr SE unit 5', 'St. Petersburg', 'FL', '33705', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 461.54, 461.54,
  'completed', 'normal', 'refinance',
  '2025-03-27T00:00:00.000Z', '2025-04-02T00:00:00.000Z', '2025-04-02T00:00:00.000Z',
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
  '1209803244293393', 'asana', 'ORD-1209803244293393',
  '1639 Saddlehorn Dr', 'Lakeland', 'FL', '33810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1), 520, 520,
  'completed', 'normal', 'refinance',
  '2025-03-26T00:00:00.000Z', '2025-04-01T00:00:00.000Z', '2025-03-28T00:00:00.000Z',
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
  '1209792618751839', 'asana', 'ORD-1209792618751839',
  '809 E Louisiana Ave', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-03-25T00:00:00.000Z', '2025-03-31T00:00:00.000Z', '2025-03-28T00:00:00.000Z',
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
  '1209758440445006', 'asana', 'ORD-1209758440445006',
  'Whitehall Street Plant', 'City', 'FL', '33563', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-03-21T00:00:00.000Z', '2025-03-28T00:00:00.000Z', '2025-03-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1209758440444986', 'asana', 'ORD-1209758440444986',
  'Whitehall Street Plant', 'City', 'FL', '33563', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-03-21T00:00:00.000Z', '2025-03-28T00:00:00.000Z', '2025-03-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1209758479717541', 'asana', 'ORD-1209758479717541',
  'Whitehall Street Plant', 'City', 'FL', '33563', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-03-21T00:00:00.000Z', '2025-03-28T00:00:00.000Z', '2025-03-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1209744063941545', 'asana', 'ORD-1209744063941545',
  '3510 SW Voyager St', 'Port St. Lucie', 'FL', '34953', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 250, 250,
  'completed', 'normal', 'refinance',
  '2025-03-20T00:00:00.000Z', '2025-03-25T00:00:00.000Z', '2025-03-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Other (see description)', '1004D',
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
  '1209743749856763', 'asana', 'ORD-1209743749856763',
  '21142 Lionheart Dr', 'Leesburg', 'FL', '21142', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 394, 394,
  'completed', 'normal', 'refinance',
  '2025-03-20T00:00:00.000Z', '2025-03-27T00:00:00.000Z', '2025-03-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209733498782927', 'asana', 'ORD-1209733498782927',
  '6855 Gulfwinds Dr St Pete', 'Beach', 'FL', '33706', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 600, 600,
  'completed', 'normal', 'refinance',
  '2025-03-19T00:00:00.000Z', '2025-03-25T00:00:00.000Z', '2025-03-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1209717226465683', 'asana', 'ORD-1209717226465683',
  '1310 E Kay St unit 3', 'Tampa', 'FL', '00000', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-03-18T00:00:00.000Z', '2025-03-26T00:00:00.000Z', '2025-03-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
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
  '1209706735545440', 'asana', 'ORD-1209706735545440',
  '297 Oak Ln Wy', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-03-17T00:00:00.000Z', '2025-03-25T00:00:00.000Z', '2025-03-24T00:00:00.000Z',
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
  '1209705276134998', 'asana', 'ORD-1209705276134998',
  '16701 84th Ct N', 'Loxahatchee', 'FL', '16701', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-03-17T00:00:00.000Z', '2025-03-21T00:00:00.000Z', '2025-03-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'online', 'client_selection', 'TAMPA - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209704851769690', 'asana', 'ORD-1209704851769690',
  '3315 Parkchester Sq Blvd Apt 206', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-03-17T00:00:00.000Z', '2025-03-21T00:00:00.000Z', '2025-03-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
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
  '1209704349881611', 'asana', 'ORD-1209704349881611',
  '2645 Oneida Loop', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 525, 525,
  'completed', 'normal', 'refinance',
  '2025-03-17T00:00:00.000Z', '2025-03-24T00:00:00.000Z', '2025-03-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
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
  '1209682638633152', 'asana', 'ORD-1209682638633152',
  '2369 TOM JONES ST Unit 8', 'ORLANDO', 'FL', '32839', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-03-14T00:00:00.000Z', '2025-03-14T00:00:00.000Z', '2025-03-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
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
  '1209682275839314', 'asana', 'ORD-1209682275839314',
  '1614 West Orange Street', 'Kissimmee', 'FL', '34741', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'STEWART VALUATION INTELLIGENCE, LLC' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-03-14T00:00:00.000Z', '2025-03-17T00:00:00.000Z', '2025-03-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1007',
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
  '1209671290044755', 'asana', 'ORD-1209671290044755',
  '10348 BUCK RD', 'Orlando', 'FL', '10348', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-03-13T00:00:00.000Z', '2025-03-20T00:00:00.000Z', '2025-03-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209654820265974', 'asana', 'ORD-1209654820265974',
  '51 E Willow Mist Road', 'Inlet Beach', 'FL', '32461', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-03-12T00:00:00.000Z', '2025-03-19T00:00:00.000Z', '2025-03-19T00:00:00.000Z',
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
  '1209635143509489', 'asana', 'ORD-1209635143509489',
  '6308 BEGGS RD', 'ORLANDO', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'SWBC LENDING SOLUTIONS LLC' LIMIT 1), 150, 150,
  'completed', 'normal', 'refinance',
  '2025-03-10T00:00:00.000Z', '2025-03-12T00:00:00.000Z', '2025-03-12T00:00:00.000Z',
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
  '1209634574576169', 'asana', 'ORD-1209634574576169',
  '1731 Avenue C Ne Winter', 'Haven', 'FL', '33881', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-03-10T00:00:00.000Z', '2025-03-10T00:00:00.000Z', '2025-03-12T00:00:00.000Z',
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
  '1209632239233587', 'asana', 'ORD-1209632239233587',
  '3096 SW 172ND LANE RD', 'Ocala', 'FL', '33743', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-03-10T00:00:00.000Z', '2025-03-13T00:00:00.000Z', '2025-03-12T00:00:00.000Z',
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
  '1209615885034845', 'asana', 'ORD-1209615885034845',
  '122 Wandering Trail', 'Jupiter', 'FL', '33458', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-03-07T00:00:00.000Z', '2025-03-18T00:00:00.000Z', '2025-03-18T00:00:00.000Z',
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
  '1209609268572688', 'asana', 'ORD-1209609268572688',
  '5142 Wood Ridge Ct', 'Ocoee', 'FL', '34761', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-03-07T00:00:00.000Z', '2025-03-13T00:00:00.000Z', '2025-03-11T00:00:00.000Z',
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
  '1209597964113330', 'asana', 'ORD-1209597964113330',
  '34392 Broken Stone St', 'Webster', 'FL', '34392', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 350, 350,
  'completed', 'normal', 'refinance',
  '2025-03-06T00:00:00.000Z', '2025-03-13T00:00:00.000Z', '2025-03-13T00:00:00.000Z',
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
  '1209576151739008', 'asana', 'ORD-1209576151739008',
  '2452 Gillard Way  Okahumpka', 'Florida  34762', 'FL', '34762', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 175, 175,
  'completed', 'normal', 'refinance',
  '2025-03-04T00:00:00.000Z', '2025-03-12T00:00:00.000Z', '2025-03-12T00:00:00.000Z',
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
  '1209576177504332', 'asana', 'ORD-1209576177504332',
  '5618 South Sheridan Road', 'Tampa', 'FL', '33611', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-03-04T00:00:00.000Z', '2025-03-06T00:00:00.000Z', '2025-03-06T00:00:00.000Z',
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
  '1209559140902909', 'asana', 'ORD-1209559140902909',
  '1724 Elizabeth Avenue', 'Titusville', 'FL', '32780', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-03-03T00:00:00.000Z', '2025-03-06T00:00:00.000Z', '2025-03-06T00:00:00.000Z',
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
  '1209536455175801', 'asana', 'ORD-1209536455175801',
  '13685 SOUTH HIGHWAY 4', 'Summerfield', 'FL', '13685', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-02-28T00:00:00.000Z', '2025-03-10T00:00:00.000Z', '2025-03-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
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
  '1209540884312318', 'asana', 'ORD-1209540884312318',
  '13685 SOUTH HIGHWAY 4', 'Summerfield', 'FL', '13685', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-02-28T00:00:00.000Z', '2025-03-10T00:00:00.000Z', '2025-03-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
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
  '1209529228422959', 'asana', 'ORD-1209529228422959',
  '5560 Bess Ln Winter', 'Haven', 'FL', '33884', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-02-27T00:00:00.000Z', '2025-03-06T00:00:00.000Z', '2025-03-05T00:00:00.000Z',
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
  '1209512366443862', 'asana', 'ORD-1209512366443862',
  '212 North Chester Street Leesburg Florida', '34748', 'FL', '34748', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 410, 410,
  'completed', 'normal', 'refinance',
  '2025-02-26T00:00:00.000Z', '2025-03-04T00:00:00.000Z', '2025-02-28T00:00:00.000Z',
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
  '1209489930638554', 'asana', 'ORD-1209489930638554',
  '0 Commonwealth Ave N Polk', 'City', 'FL', '33868', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-02-24T00:00:00.000Z', '2025-02-28T00:00:00.000Z', '2025-02-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004C',
  NULL,
  'bill', 'bid_request', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209485641458032', 'asana', 'ORD-1209485641458032',
  '836 5th St N', 'St. Petersburg', 'FL', '33701', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 650, 650,
  'completed', 'normal', 'refinance',
  '2025-02-24T00:00:00.000Z', '2025-02-28T00:00:00.000Z', '2025-02-26T00:00:00.000Z',
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
  '1209470158477327', 'asana', 'ORD-1209470158477327',
  '6162 Mulligan Run The', 'Villages', 'FL', '32163', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-02-21T00:00:00.000Z', '2025-03-03T00:00:00.000Z', '2025-03-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209468092482945', 'asana', 'ORD-1209468092482945',
  '925 N County Road 13', 'Orlando', 'FL', '32820', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-02-21T00:00:00.000Z', '2025-02-28T00:00:00.000Z', '2025-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
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
  '1209460795668436', 'asana', 'ORD-1209460795668436',
  '131 Bristol Forest Trl', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-02-20T00:00:00.000Z', '2025-02-26T00:00:00.000Z', '2025-02-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
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
  '1209448184613080', 'asana', 'ORD-1209448184613080',
  '2754 Parkfield Rd Saint', 'Cloud', 'FL', '34772', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-02-19T00:00:00.000Z', '2025-02-26T00:00:00.000Z', '2025-02-25T00:00:00.000Z',
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
  '1209429385027674', 'asana', 'ORD-1209429385027674',
  '44199 Us Highway 27 N', 'Davenport', 'FL', '44199', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 225, 225,
  'completed', 'normal', 'refinance',
  '2025-02-17T00:00:00.000Z', '2025-02-21T00:00:00.000Z', '2025-02-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'COMMERCIAL',
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
  '1209379940806649', 'asana', 'ORD-1209379940806649',
  '399 Quentin Ave NW', 'Winter Haven', 'FL', '33881', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-02-13T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209379940806640', 'asana', 'ORD-1209379940806640',
  '7044 Hemlock Crse', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-02-13T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209379940806630', 'asana', 'ORD-1209379940806630',
  '9156 Agate St', 'Port Charlotte', 'FL', '33981', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-02-13T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1025',
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
  '1209403457236121', 'asana', 'ORD-1209403457236121',
  '1850 Calle Alto Vista', 'DeLand', 'FL', '32724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 550, 550,
  'completed', 'normal', 'refinance',
  '2025-02-13T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Cash Out Refinance', '1004',
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
  '1209401803416617', 'asana', 'ORD-1209401803416617',
  '18724 STATE ROAD 19', 'Groveland', 'FL', '18724', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-02-13T00:00:00.000Z', '2025-02-18T00:00:00.000Z', '2025-02-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Home Equity', '1004',
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
  '1209391661911412', 'asana', 'ORD-1209391661911412',
  '6308 BEGGS RD', 'ORLANDO', 'FL', '32810', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'SWBC LENDING SOLUTIONS LLC' LIMIT 1), 395, 395,
  'completed', 'normal', 'refinance',
  '2025-02-12T00:00:00.000Z', '2025-02-24T00:00:00.000Z', '2025-02-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
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
  '1209390722608031', 'asana', 'ORD-1209390722608031',
  '154 WOODED VINE DR WINTER', 'SPRINGSFL32708-0035', 'FL', '32708', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Allstate Appraisal' LIMIT 1), 500, 500,
  'completed', 'normal', 'refinance',
  '2025-02-12T00:00:00.000Z', '2025-02-18T00:00:00.000Z', '2025-02-18T00:00:00.000Z',
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
  '1209381594874974', 'asana', 'ORD-1209381594874974',
  '1899 Riveredge Dr', 'Astor', 'FL', '32102', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1), 400, 400,
  'completed', 'normal', 'refinance',
  '2025-02-11T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
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
  '1209381125087470', 'asana', 'ORD-1209381125087470',
  '85 West Towne Place', 'Titusville', 'FL', '32796', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 700, 700,
  'completed', 'normal', 'refinance',
  '2025-02-11T00:00:00.000Z', '2025-02-19T00:00:00.000Z', '2025-02-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
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
  '1209355414341469', 'asana', 'ORD-1209355414341469',
  '5908 Edgewater Terrace', 'Sebring', 'FL', '33876', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-02-07T00:00:00.000Z', '2025-02-11T00:00:00.000Z', '2025-02-11T00:00:00.000Z',
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
  '1209345436501000', 'asana', 'ORD-1209345436501000',
  '341 HAMMOND ST', 'NEW SMYRNA BEACH', 'FL', '32168', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 1000, 1000,
  'completed', 'normal', 'refinance',
  '2025-02-06T00:00:00.000Z', '2025-02-14T00:00:00.000Z', '2025-02-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'FEMA 50 - ACV ', 'FEMA',
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
  '1209343423055828', 'asana', 'ORD-1209343423055828',
  '3927 Columbia St', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 0, 0,
  'completed', 'normal', 'refinance',
  '2025-02-06T00:00:00.000Z', '2025-02-12T00:00:00.000Z', '2025-02-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1007',
  NULL,
  'bill', 'partnership', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": ""}'::jsonb
);
INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1209324608966048', 'asana', 'ORD-1209324608966048',
  '2452 Gillard Way Okahumpka Florida', '34762', 'FL', '34762', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1), 375, 375,
  'completed', 'normal', 'refinance',
  '2025-02-04T00:00:00.000Z', '2025-02-11T00:00:00.000Z', '2025-02-11T00:00:00.000Z',
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
  '1209312177380879', 'asana', 'ORD-1209312177380879',
  '102 E 19th St', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-02-03T00:00:00.000Z', '2025-02-06T00:00:00.000Z', '2025-02-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Pre-Listing', 'GP',
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
  '1209312215431556', 'asana', 'ORD-1209312215431556',
  '4878 Nantucket Ln', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1), 450, 450,
  'completed', 'normal', 'refinance',
  '2025-02-03T00:00:00.000Z', '2025-02-06T00:00:00.000Z', '2025-02-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Pre-Listing', 'GP',
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
  '1209285265618181', 'asana', 'ORD-1209285265618181',
  '805 Nottingham Street', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 300, 300,
  'completed', 'normal', 'refinance',
  '2025-01-30T00:00:00.000Z', '2025-02-06T00:00:00.000Z', '2025-02-07T00:00:00.000Z',
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
  '1209285150798896', 'asana', 'ORD-1209285150798896',
  '13716 Fox Glove St', 'Winter Garden', 'FL', '13716', 'single_family',
  'Unknown Borrower', (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1), 75, 75,
  'completed', 'normal', 'refinance',
  '2025-01-30T00:00:00.000Z', '2025-02-05T00:00:00.000Z', '2025-03-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
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
  '1209256365342033', 'asana', 'ORD-1209256365342033',
  '2742 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
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
  '1209256365342025', 'asana', 'ORD-1209256365342025',
  '2752 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
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
  '1209256365342017', 'asana', 'ORD-1209256365342017',
  '2758 5th Ave S', 'St. Petersburg', 'FL', '33712', 'single_family',
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

-- ==============================================
-- BATCH VERIFICATION
-- ==============================================

-- Should show 300 total orders after this batch
SELECT COUNT(*) as total_orders FROM orders WHERE source = 'asana';
SELECT status, COUNT(*) as count FROM orders WHERE source = 'asana' GROUP BY status;