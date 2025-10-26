-- ==============================================
-- HISTORICAL ORDERS - BATCH 4 (SAFE VERSION)
-- Orders 901-1200
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
  '1205643884641191', 'asana', 'ORD-1205643884641191',
  '531 9th Street Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-10-03T00:00:00.000Z', '2023-10-09T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "531 9th Street Winter, Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205634970798053', 'asana', 'ORD-1205634970798053',
  '819 Parrotfish St Palm', 'Bay', 'FL', '32908', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-02T00:00:00.000Z', '2023-10-06T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "819 Parrotfish St Palm, Bay, FL 32908"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205634571835744', 'asana', 'ORD-1205634571835744',
  'LAND SW 44th CIRCLE', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-10-02T00:00:00.000Z', '2023-10-11T00:00:00.000Z', '2023-10-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "LAND SW 44th CIRCLE, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205617797240362', 'asana', 'ORD-1205617797240362',
  '3002 Ponderosa Trl', 'Wimauma', 'FL', '33598', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-29T00:00:00.000Z', '2023-10-04T00:00:00.000Z', '2023-10-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "3002 Ponderosa Trl, Wimauma, FL 33598"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205607492029311', 'asana', 'ORD-1205607492029311',
  '16870 Sanctuary Dr', 'Winter Garden', 'FL', '16870', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  100, 100,
  'completed', 'normal', 'refinance',
  '2023-09-28T00:00:00.000Z', '2023-10-03T00:00:00.000Z', '2023-10-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "16870 Sanctuary Dr, Winter Garden, FL 16870"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205607591190645', 'asana', 'ORD-1205607591190645',
  '16870 Sanctuary Dr', 'Winter Garden', 'FL', '16870', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-09-28T00:00:00.000Z', '2023-10-12T00:00:00.000Z', '2023-10-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "16870 Sanctuary Dr, Winter Garden, FL 16870"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205605320340602', 'asana', 'ORD-1205605320340602',
  'Duplicate of', 'HABU', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-28T00:00:00.000Z', '2023-09-28T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "Duplicate of, HABU, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205605007514620', 'asana', 'ORD-1205605007514620',
  '5429 Vanderlin Street', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  338, 338,
  'completed', 'normal', 'refinance',
  '2023-09-28T00:00:00.000Z', '2023-10-04T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5429 Vanderlin Street, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205604305226568', 'asana', 'ORD-1205604305226568',
  '912 W Lake Holden Pt', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-09-28T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-10-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "912 W Lake Holden Pt, Orlando, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205598250189546', 'asana', 'ORD-1205598250189546',
  '642 Home Grove Dr', 'Winter Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  435, 435,
  'completed', 'normal', 'refinance',
  '2023-09-27T00:00:00.000Z', '2023-10-04T00:00:00.000Z', '2023-10-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "642 Home Grove Dr, Winter Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588155425548', 'asana', 'ORD-1205588155425548',
  '7520 Bliss Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-27T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7520 Bliss Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588155425534', 'asana', 'ORD-1205588155425534',
  '7501 Pelham Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-27T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7501 Pelham Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205589049570447', 'asana', 'ORD-1205589049570447',
  '13013 BROMBOROUGH DR', 'ORLANDO', 'FL', '13013', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-27T00:00:00.000Z', '2023-10-04T00:00:00.000Z', '2023-10-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13013 BROMBOROUGH DR, ORLANDO, FL 13013"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205589034706831', 'asana', 'ORD-1205589034706831',
  '3194 PRINCE DR Unit A LAKE', 'WORTH', 'FL', '33461', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3194 PRINCE DR Unit A LAKE, WORTH, FL 33461"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588892384528', 'asana', 'ORD-1205588892384528',
  '3588 LAURETTE LN UNIT A LAKE', 'WORTH', 'FL', '33461', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3588 LAURETTE LN UNIT A LAKE, WORTH, FL 33461"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588975584047', 'asana', 'ORD-1205588975584047',
  '1537 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-10T00:00:00.000Z', '2023-10-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
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
  '1205588970930823', 'asana', 'ORD-1205588970930823',
  '1610 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-10T00:00:00.000Z', '2023-10-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
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
  '1205588961770021', 'asana', 'ORD-1205588961770021',
  '1573 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-10T00:00:00.000Z', '2023-10-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
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
  '1205588953712296', 'asana', 'ORD-1205588953712296',
  '1586 SW GOPHER TRL PALM', 'CITY', 'FL', '34990', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-10T00:00:00.000Z', '2023-10-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
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
  '1205588704521538', 'asana', 'ORD-1205588704521538',
  '809 S H ST UNIT A LAKE WORTH', 'BEACH', 'FL', '33460', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "809 S H ST UNIT A LAKE WORTH, BEACH, FL 33460"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588826587396', 'asana', 'ORD-1205588826587396',
  '1430 STACY ST N Unit A WEST PALM', 'BEACH', 'FL', '33417', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1430 STACY ST N Unit A WEST PALM, BEACH, FL 33417"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588801860124', 'asana', 'ORD-1205588801860124',
  '1317 N FEDERAL HWY Unit 1 LAKE', 'WORTH', 'FL', '33460', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1317 N FEDERAL HWY Unit 1 LAKE, WORTH, FL 33460"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205588483942477', 'asana', 'ORD-1205588483942477',
  '1303 WHITE PINE DR UNIT A', 'WELLINGTON', 'FL', '33414', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-26T00:00:00.000Z', '2023-10-20T00:00:00.000Z', '2023-10-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1303 WHITE PINE DR UNIT A, WELLINGTON, FL 33414"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205574388881580', 'asana', 'ORD-1205574388881580',
  '1101 S Orlando Ave', 'Cocoa Beach', 'FL', '32931', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  525, 525,
  'completed', 'normal', 'refinance',
  '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z', '2023-10-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1101 S Orlando Ave, Cocoa Beach, FL 32931"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205560679953024', 'asana', 'ORD-1205560679953024',
  '103 4th St N', 'Bradenton Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-22T00:00:00.000Z', '2023-09-27T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "103 4th St N, Bradenton Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205552489151731', 'asana', 'ORD-1205552489151731',
  '33870 Sky Blossom Circle Building Leesburg Florida', '34788', 'FL', '33870', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-09-21T00:00:00.000Z', '2023-09-27T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "33870 Sky Blossom Circle Building Leesburg Florida, 34788, FL 33870"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205552103868166', 'asana', 'ORD-1205552103868166',
  '2173 NW RICHARD AVE', 'ARCADIA', 'FL', '34266', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-21T00:00:00.000Z', '2023-10-04T00:00:00.000Z', '2023-10-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'REO', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2173 NW RICHARD AVE, ARCADIA, FL 34266"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205551310562504', 'asana', 'ORD-1205551310562504',
  '6076 Sierra Crown Street Mount Dora', 'Florida 32757', 'FL', '32757', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-09-21T00:00:00.000Z', '2023-09-27T00:00:00.000Z', '2023-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6076 Sierra Crown Street Mount Dora, Florida 32757, FL 32757"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205551087323089', 'asana', 'ORD-1205551087323089',
  '4414 Carrollwood Village Dr', 'Tampa', 'FL', '33618', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-21T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4414 Carrollwood Village Dr, Tampa, FL 33618"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205550872900438', 'asana', 'ORD-1205550872900438',
  '40009 FRENCH ROAD LADY', 'LAKE', 'FL', '40009', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-21T00:00:00.000Z', '2023-09-28T00:00:00.000Z', '2023-09-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "40009 FRENCH ROAD LADY, LAKE, FL 40009"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205544355556724', 'asana', 'ORD-1205544355556724',
  '1343 Yorkshire Ct', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  410, 410,
  'completed', 'normal', 'refinance',
  '2023-09-20T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1343 Yorkshire Ct, Davenport, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205543248739783', 'asana', 'ORD-1205543248739783',
  '453 Marion Oaks Ln', 'Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-20T00:00:00.000Z', '2023-10-12T00:00:00.000Z', '2023-10-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "453 Marion Oaks Ln, Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205542326990410', 'asana', 'ORD-1205542326990410',
  'Parcel ID #1814-008-008', 'ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-20T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "Parcel ID #1814-008-008, ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205542002773898', 'asana', 'ORD-1205542002773898',
  '7526 Country Run Pkwy', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-20T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7526 Country Run Pkwy, Orlando, FL 32818"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205539494802672', 'asana', 'ORD-1205539494802672',
  'Duplicate of Contact', 'Attempt', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-20T00:00:00.000Z', '2023-09-20T00:00:00.000Z', '2023-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "Duplicate of Contact, Attempt, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205535967968796', 'asana', 'ORD-1205535967968796',
  '7400 Ardenwood St', 'Tampa', 'FL', '33625', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'online', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7400 Ardenwood St, Tampa, FL 33625"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205535822189152', 'asana', 'ORD-1205535822189152',
  '1408 Allison Ave Altamonte', 'Springs', 'FL', '32701', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1408 Allison Ave Altamonte, Springs, FL 32701"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842852', 'asana', 'ORD-1205533558842852',
  '7509 Bliss Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-10-02T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7509 Bliss Way, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842838', 'asana', 'ORD-1205533558842838',
  '7523 Bliss Way', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
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
  '1205533558842796', 'asana', 'ORD-1205533558842796',
  '2884 Oakwater Drive', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2884 Oakwater Drive, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842782', 'asana', 'ORD-1205533558842782',
  '2872 Oakwater Drive', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2872 Oakwater Drive, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842768', 'asana', 'ORD-1205533558842768',
  '2868 Oakwater Drive.', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2868 Oakwater Drive., Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842754', 'asana', 'ORD-1205533558842754',
  '2882 Oakwater Dr', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2882 Oakwater Dr, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205533558842742', 'asana', 'ORD-1205533558842742',
  '2852 Oakwater Drive.', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2852 Oakwater Drive., Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205535462556877', 'asana', 'ORD-1205535462556877',
  '2866 Oakwater Drive', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-10-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2866 Oakwater Drive, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205534411505653', 'asana', 'ORD-1205534411505653',
  '7183 SW LARK DR', 'Arcadia', 'FL', '34266', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nations Valuation Services Inc%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  225, 225,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7183 SW LARK DR, Arcadia, FL 34266"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205532683336056', 'asana', 'ORD-1205532683336056',
  '4 Chase Rd', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-19T00:00:00.000Z', '2023-09-28T00:00:00.000Z', '2023-09-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'cod', 'bid_request', 'ORL - SW - PRIMARY', 'none',
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
  '1205525834429225', 'asana', 'ORD-1205525834429225',
  '10 Dogwood Dr Course', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-25T00:00:00.000Z', '2023-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "10 Dogwood Dr Course, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205525701125076', 'asana', 'ORD-1205525701125076',
  '1619 Cumin Drive', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1619 Cumin Drive, Poinciana, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205525771864387', 'asana', 'ORD-1205525771864387',
  '1617 Cumin Drive', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1617 Cumin Drive, Poinciana, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205525417505621', 'asana', 'ORD-1205525417505621',
  '1621 Cumin Drive', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1621 Cumin Drive, Poinciana, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205524243092788', 'asana', 'ORD-1205524243092788',
  '2560 Euston Rd Winter', 'Park', 'FL', '32789', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MountainSeed Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MountainSeed Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-20T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2560 Euston Rd Winter, Park, FL 32789"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205524341728562', 'asana', 'ORD-1205524341728562',
  '1615 Cumin Drive', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1615 Cumin Drive, Poinciana, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205523970306750', 'asana', 'ORD-1205523970306750',
  '3871 Oyster Ct', 'Orlando', 'FL', '32812', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-18T00:00:00.000Z', '2023-09-20T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3871 Oyster Ct, Orlando, FL 32812"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205511863832026', 'asana', 'ORD-1205511863832026',
  '2717 KATHRYN AVE', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-09-15T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2717 KATHRYN AVE, Lakeland, FL 33805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205505393342549', 'asana', 'ORD-1205505393342549',
  '238 Henley Cir', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-15T00:00:00.000Z', '2023-09-22T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "238 Henley Cir, Davenport, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205505379768647', 'asana', 'ORD-1205505379768647',
  '5855 Midnight Pass Rd #621', 'Sarasota', 'FL', '34242', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-18T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": "5855 Midnight Pass Rd #621, Sarasota, FL 34242"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651670', 'asana', 'ORD-1205493977651670',
  '1108 Nordic St NW PALM', 'BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1108 Nordic St NW PALM, BAY, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651654', 'asana', 'ORD-1205493977651654',
  '1114 Serenade Street NW PALM', 'BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1114 Serenade Street NW PALM, BAY, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651638', 'asana', 'ORD-1205493977651638',
  '887 San Filippo Dr SE PALM', 'BAY', 'FL', '32909', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "887 San Filippo Dr SE PALM, BAY, FL 32909"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651622', 'asana', 'ORD-1205493977651622',
  '1157 Kareena Street NW PALM', 'BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1157 Kareena Street NW PALM, BAY, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651606', 'asana', 'ORD-1205493977651606',
  '1760 Ashcroft Street NW PALM', 'BAY', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1760 Ashcroft Street NW PALM, BAY, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651590', 'asana', 'ORD-1205493977651590',
  '459 Krassner Drive N PALM', 'bAY', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "459 Krassner Drive N PALM, bAY, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651574', 'asana', 'ORD-1205493977651574',
  '1544 Holcomb St NW', 'Palm Bay', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1544 Holcomb St NW, Palm Bay, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651558', 'asana', 'ORD-1205493977651558',
  '1197 Kareena St NW', 'Palm Bay', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1197 Kareena St NW, Palm Bay, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205504462436916', 'asana', 'ORD-1205504462436916',
  '1400 Palau St SE', 'Palm Bay', 'FL', '32909', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z', '2023-09-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1400 Palau St SE, Palm Bay, FL 32909"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205504065567494', 'asana', 'ORD-1205504065567494',
  '2413 Myrtle Ave', 'Sanford', 'FL', '32771', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-20T00:00:00.000Z', '2023-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2413 Myrtle Ave, Sanford, FL 32771"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205504017414394', 'asana', 'ORD-1205504017414394',
  '10544 Wyndcliff Dr', 'Orlando', 'FL', '10544', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-19T00:00:00.000Z', '2023-09-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "10544 Wyndcliff Dr, Orlando, FL 10544"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651419', 'asana', 'ORD-1205493977651419',
  '5 Dogwood Ct', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5 Dogwood Ct, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493977651403', 'asana', 'ORD-1205493977651403',
  '38 Juniper Loop Cir', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-26T00:00:00.000Z', '2023-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "38 Juniper Loop Cir, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205500826553305', 'asana', 'ORD-1205500826553305',
  '3106 EFFINGHAM DR', 'CLERMONT', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-14T00:00:00.000Z', '2023-09-14T00:00:00.000Z', '2023-10-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3106 EFFINGHAM DR, CLERMONT, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205493716640647', 'asana', 'ORD-1205493716640647',
  '3801 McKinnon Rd', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  2500, 2500,
  'completed', 'normal', 'refinance',
  '2023-09-13T00:00:00.000Z', '2023-09-15T00:00:00.000Z', '2023-09-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "3801 McKinnon Rd, Windermere, FL 34786"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205467016995612', 'asana', 'ORD-1205467016995612',
  '2110 Logan Drive', 'Titusville', 'FL', '32780', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-12T00:00:00.000Z', '2023-09-19T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2110 Logan Drive, Titusville, FL 32780"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205483157614563', 'asana', 'ORD-1205483157614563',
  '6124 Holiday Hill Lane', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-12T00:00:00.000Z', '2023-09-19T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6124 Holiday Hill Lane, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205483231670591', 'asana', 'ORD-1205483231670591',
  '40616 Central Avenue', 'Umatilla', 'FL', '40616', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-09-12T00:00:00.000Z', '2023-09-19T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "40616 Central Avenue, Umatilla, FL 40616"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205479923217833', 'asana', 'ORD-1205479923217833',
  '3330 Yorktown St', 'Sarasota', 'FL', '34231', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-09-12T00:00:00.000Z', '2023-09-15T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'DAIR',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "3330 Yorktown St, Sarasota, FL 34231"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205479621504550', 'asana', 'ORD-1205479621504550',
  '914 Whitaker Rd', 'Lutz', 'FL', '33549', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-09-12T00:00:00.000Z', '2023-09-14T00:00:00.000Z', '2023-09-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "914 Whitaker Rd, Lutz, FL 33549"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205470537190583', 'asana', 'ORD-1205470537190583',
  '226 Lakeside Dr', 'Lutz', 'FL', '33549', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-09-11T00:00:00.000Z', '2023-09-18T00:00:00.000Z', '2023-09-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "226 Lakeside Dr, Lutz, FL 33549"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205454383440380', 'asana', 'ORD-1205454383440380',
  '7183 SW Lark Dr', 'Arcadia', 'FL', '34269', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-09-08T00:00:00.000Z', '2023-09-18T00:00:00.000Z', '2023-09-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7183 SW Lark Dr, Arcadia, FL 34269"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205454187756012', 'asana', 'ORD-1205454187756012',
  '5379 Vineland Rd Unit 4-G', 'Orlando', 'FL', '32811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-08T00:00:00.000Z', '2023-09-15T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5379 Vineland Rd Unit 4-G, Orlando, FL 32811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205453167306442', 'asana', 'ORD-1205453167306442',
  '2353 SW 165th Street Rd', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-09-08T00:00:00.000Z', '2023-09-13T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'New Construction', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2353 SW 165th Street Rd, OCALA, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205452699517823', 'asana', 'ORD-1205452699517823',
  '311 58th Ave E', 'Bradenton', 'FL', '34203', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-08T00:00:00.000Z', '2023-09-18T00:00:00.000Z', '2023-09-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "311 58th Ave E, Bradenton, FL 34203"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205446054655741', 'asana', 'ORD-1205446054655741',
  '2365 SW 165TH Street Rd', 'Lot 2 Ocala', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-07T00:00:00.000Z', '2023-09-13T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2365 SW 165TH Street Rd, Lot 2 Ocala, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205446261002370', 'asana', 'ORD-1205446261002370',
  '1191 NW 68th Pl', 'Ocala', 'FL', '34475', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-07T00:00:00.000Z', '2023-09-11T00:00:00.000Z', '2023-09-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1191 NW 68th Pl, Ocala, FL 34475"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205444399966409', 'asana', 'ORD-1205444399966409',
  '4705 1st St NE APT 337', 'Saint Petersburg', 'FL', '33703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-09-07T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Trust Valuation', '1073',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4705 1st St NE APT 337, Saint Petersburg, FL 33703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205436427360292', 'asana', 'ORD-1205436427360292',
  '5049 Blue Hammock Court', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-09-06T00:00:00.000Z', '2023-09-11T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5049 Blue Hammock Court, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205435680635035', 'asana', 'ORD-1205435680635035',
  '1335 STERLING POINTE DRIVE', 'DELTONAFL32725', 'FL', '32725', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-09-06T00:00:00.000Z', '2023-09-13T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Bid-Instruction', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1335 STERLING POINTE DRIVE, DELTONAFL32725, FL 32725"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205428667172069', 'asana', 'ORD-1205428667172069',
  '5307 1ST AVENUE DR NW', 'BRADENTON', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-05T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5307 1ST AVENUE DR NW, BRADENTON, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205427681131051', 'asana', 'ORD-1205427681131051',
  '201 Emerald Loop Way', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-05T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "201 Emerald Loop Way, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205427961872741', 'asana', 'ORD-1205427961872741',
  '11 Hickory Track Drive', 'Ocala', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-09-05T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "11 Hickory Track Drive, Ocala, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205427579416050', 'asana', 'ORD-1205427579416050',
  '3314 SUNSET RIDGE CT', 'LONGWOOD', 'FL', '32779', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VOXTUR VALUATION, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  228, 228,
  'completed', 'normal', 'refinance',
  '2023-09-05T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3314 SUNSET RIDGE CT, LONGWOOD, FL 32779"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205426769252309', 'asana', 'ORD-1205426769252309',
  '112 BYRON PL SE Winter', 'Haven', 'FL', '33884', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-05T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Investment', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "112 BYRON PL SE Winter, Haven, FL 33884"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205419882440821', 'asana', 'ORD-1205419882440821',
  '1220 SUNSHINE TREE BLVD', 'LONGWOOD', 'FL', '32779', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-09-04T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1220 SUNSHINE TREE BLVD, LONGWOOD, FL 32779"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205408765132484', 'asana', 'ORD-1205408765132484',
  '1028 Butler St E', 'Lehigh Acres', 'FL', '33974', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1028 Butler St E, Lehigh Acres, FL 33974"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205408751168365', 'asana', 'ORD-1205408751168365',
  '1024 Butler St E', 'Lehigh Acres', 'FL', '33974', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1024 Butler St E, Lehigh Acres, FL 33974"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205408504046121', 'asana', 'ORD-1205408504046121',
  '311 Long Ave', 'Lehigh Acres', 'FL', '33974', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "311 Long Ave, Lehigh Acres, FL 33974"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205408321245076', 'asana', 'ORD-1205408321245076',
  '349 Austin Ave', 'Lehigh Acres', 'FL', '33974', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "349 Austin Ave, Lehigh Acres, FL 33974"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205408291945140', 'asana', 'ORD-1205408291945140',
  '1083 Calico Pointe Circle Groveland Florida', '34736', 'FL', '34736', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1083 Calico Pointe Circle Groveland Florida, 34736, FL 34736"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205407866825816', 'asana', 'ORD-1205407866825816',
  '2220 Marconi Street', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2220 Marconi Street, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205407749265477', 'asana', 'ORD-1205407749265477',
  '1598 Cumin Dr', 'Kissimmee', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1598 Cumin Dr, Kissimmee, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205407567149100', 'asana', 'ORD-1205407567149100',
  '1550 Cumin Dr', 'Kissimmee', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1550 Cumin Dr, Kissimmee, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205407074392637', 'asana', 'ORD-1205407074392637',
  '3640 Daydream Pl Saint', 'Cloud', 'FL', '34772', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  420, 420,
  'completed', 'normal', 'refinance',
  '2023-09-01T00:00:00.000Z', '2023-09-22T00:00:00.000Z', '2023-09-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "3640 Daydream Pl Saint, Cloud, FL 34772"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205401306248377', 'asana', 'ORD-1205401306248377',
  '7675 Comrow Street', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7675 Comrow Street, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205401126961429', 'asana', 'ORD-1205401126961429',
  '4906 Haiti Cir', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisals 2U, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisals 2U, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4906 Haiti Cir, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205401187849707', 'asana', 'ORD-1205401187849707',
  '5142 N Apopka Vineland Rd', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Accelerated Appraisal Management Company' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Accelerated Appraisal Management Company%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  520, 520,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-11T00:00:00.000Z', '2023-09-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5142 N Apopka Vineland Rd, Orlando, FL 32818"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205400884083811', 'asana', 'ORD-1205400884083811',
  '2617 Rosemont Crcl', 'Davenport', 'FL', '33837', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2617 Rosemont Crcl, Davenport, FL 33837"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934904', 'asana', 'ORD-1205384774934904',
  'TBD Locust Place', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "TBD Locust Place, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934893', 'asana', 'ORD-1205384774934893',
  'Lot 10 Locust Loop Radial', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "Lot 10 Locust Loop Radial, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934870', 'asana', 'ORD-1205384774934870',
  'Lot 9 Locust Loop Radial', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "Lot 9 Locust Loop Radial, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934835', 'asana', 'ORD-1205384774934835',
  'TBD Oak Circle Lot #9', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "TBD Oak Circle Lot #9, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934825', 'asana', 'ORD-1205384774934825',
  '11286 N Terra Cotta Dr Citrus', 'Springs', 'FL', '11286', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "11286 N Terra Cotta Dr Citrus, Springs, FL 11286"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934815', 'asana', 'ORD-1205384774934815',
  '11222 N Terra Cotta Dr Citrus', 'Springs', 'FL', '11222', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "11222 N Terra Cotta Dr Citrus, Springs, FL 11222"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934805', 'asana', 'ORD-1205384774934805',
  '11214 N Terra Cotta Dr Citrus', 'Springs', 'FL', '11214', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "11214 N Terra Cotta Dr Citrus, Springs, FL 11214"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934779', 'asana', 'ORD-1205384774934779',
  '1587 W Riley Dr Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1587 W Riley Dr Citrus, Springs, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934768', 'asana', 'ORD-1205384774934768',
  '6975 N Lynn Point Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6975 N Lynn Point Citrus, Springs, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934682', 'asana', 'ORD-1205384774934682',
  '9172 Golfview Drive Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "9172 Golfview Drive Citrus, Springs, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205384774934680', 'asana', 'ORD-1205384774934680',
  '9166 Golfview Drive Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "9166 Golfview Drive Citrus, Springs, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205399170668987', 'asana', 'ORD-1205399170668987',
  '9162 Golfview Drive Citrus', 'Springs', 'FL', '34434', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "9162 Golfview Drive Citrus, Springs, FL 34434"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205398783675289', 'asana', 'ORD-1205398783675289',
  '12345 Sunshine Dr', 'Clermont', 'FL', '12345', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  394, 394,
  'completed', 'normal', 'refinance',
  '2023-08-31T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "12345 Sunshine Dr, Clermont, FL 12345"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205390437355251', 'asana', 'ORD-1205390437355251',
  '3604 Clemwood Dr', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-30T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3604 Clemwood Dr, Orlando, FL 32803"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205390017243944', 'asana', 'ORD-1205390017243944',
  '4436-4438 25th St Sw', 'Lehigh Acres', 'FL', '33973', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  625, 625,
  'completed', 'normal', 'refinance',
  '2023-08-30T00:00:00.000Z', '2023-09-08T00:00:00.000Z', '2023-09-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "4436-4438 25th St Sw, Lehigh Acres, FL 33973"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205381538889898', 'asana', 'ORD-1205381538889898',
  '22 Hemlock Radial Ln', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-29T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "22 Hemlock Radial Ln, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205380835703811', 'asana', 'ORD-1205380835703811',
  '4 Cedar Run', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-29T00:00:00.000Z', '2023-09-05T00:00:00.000Z', '2023-09-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "4 Cedar Run, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205378676343332', 'asana', 'ORD-1205378676343332',
  '4508 Fire Ct', 'Labelle', 'FL', '33935', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-29T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "4508 Fire Ct, Labelle, FL 33935"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205370783234147', 'asana', 'ORD-1205370783234147',
  '2830 7TH ST S ST', 'PETERSBURGFL33705', 'FL', '33705', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  225, 225,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2830 7TH ST S ST, PETERSBURGFL33705, FL 33705"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205369375734488', 'asana', 'ORD-1205369375734488',
  '1552 FAIRVIEW CIR', 'REUNION', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Refinance', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1552 FAIRVIEW CIR, REUNION, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205369296745536', 'asana', 'ORD-1205369296745536',
  '2353 SW 165th Street Rd', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2353 SW 165th Street Rd, OCALA, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205368965138086', 'asana', 'ORD-1205368965138086',
  '5700 Arundel Dr', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-09-01T00:00:00.000Z', '2023-08-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5700 Arundel Dr, Orlando, FL 32808"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205368510932700', 'asana', 'ORD-1205368510932700',
  '380 Crestview ST NE Palm', 'Bay', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "380 Crestview ST NE Palm, Bay, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205368231591522', 'asana', 'ORD-1205368231591522',
  '1949 Trotter Rd', 'Largo', 'FL', '33774', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-08-31T00:00:00.000Z', '2023-09-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1949 Trotter Rd, Largo, FL 33774"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205367833105718', 'asana', 'ORD-1205367833105718',
  '1016 Inman Ter', 'Winter Haven', 'FL', '33881', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-08-28T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1016 Inman Ter, Winter Haven, FL 33881"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205357833468671', 'asana', 'ORD-1205357833468671',
  '9590 Bahia Rd', 'ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-26T00:00:00.000Z', '2023-10-12T00:00:00.000Z', '2023-10-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "9590 Bahia Rd, ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205357244092338', 'asana', 'ORD-1205357244092338',
  '4414 Hector CtUNIT 5', 'OrlandoFL32822', 'FL', '32822', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-25T00:00:00.000Z', '2023-08-31T00:00:00.000Z', '2023-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4414 Hector CtUNIT 5, OrlandoFL32822, FL 32822"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205356912038779', 'asana', 'ORD-1205356912038779',
  '1568 Sunset View Cir', 'Apopka', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-08-25T00:00:00.000Z', '2023-08-31T00:00:00.000Z', '2023-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Ascertain Market Value', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1568 Sunset View Cir, Apopka, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205356014228613', 'asana', 'ORD-1205356014228613',
  '5026 SE 37th Ave', 'Ocala', 'FL', '34480', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-08-25T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5026 SE 37th Ave, Ocala, FL 34480"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205355227313413', 'asana', 'ORD-1205355227313413',
  '3225 Keystone Rd', 'Tarpon Springs', 'FL', '34688', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Settlement one' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Settlement one%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  900, 900,
  'completed', 'normal', 'refinance',
  '2023-08-25T00:00:00.000Z', '2023-09-12T00:00:00.000Z', '2023-09-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "3225 Keystone Rd, Tarpon Springs, FL 34688"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205349364708253', 'asana', 'ORD-1205349364708253',
  '8920 N Otis Ave', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-24T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8920 N Otis Ave, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205348379795380', 'asana', 'ORD-1205348379795380',
  '407 N Observatory Dr', 'Orlando', 'FL', '32835', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-24T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "407 N Observatory Dr, Orlando, FL 32835"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205348098672624', 'asana', 'ORD-1205348098672624',
  '3998 Lana Avenue', 'Davenport', 'FL', '33897', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-24T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3998 Lana Avenue, Davenport, FL 33897"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205340939012166', 'asana', 'ORD-1205340939012166',
  '6300 Flotilla Drive # 91', 'Holmes Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-08-23T00:00:00.000Z', '2023-08-29T00:00:00.000Z', '2023-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1073',
  ARRAY['216']::text[],
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "6300 Flotilla Drive # 91, Holmes Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205340579698794', 'asana', 'ORD-1205340579698794',
  '2133 44th Ave N Saint', 'Petersburg', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-23T00:00:00.000Z', '2023-08-29T00:00:00.000Z', '2023-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2133 44th Ave N Saint, Petersburg, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205340406443803', 'asana', 'ORD-1205340406443803',
  '11446 Jasper Kay Ter', 'Windermere', 'FL', '11446', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-23T00:00:00.000Z', '2023-08-31T00:00:00.000Z', '2023-08-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "11446 Jasper Kay Ter, Windermere, FL 11446"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205338275781816', 'asana', 'ORD-1205338275781816',
  '8809 Kensington Ct', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-08-23T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8809 Kensington Ct, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205330313169706', 'asana', 'ORD-1205330313169706',
  '1008 Venetian Avenue', 'Orlando', 'FL', '32804', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-30T00:00:00.000Z', '2023-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1008 Venetian Avenue, Orlando, FL 32804"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205330144690735', 'asana', 'ORD-1205330144690735',
  '4438 SMALL CREEK ROAD', 'KISSIMMEE', 'FL', '34744', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4438 SMALL CREEK ROAD, KISSIMMEE, FL 34744"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205329985513864', 'asana', 'ORD-1205329985513864',
  '2029 Whispering Trails Blvd', 'Winter Haven', 'FL', '33884', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-09-07T00:00:00.000Z', '2023-09-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2029 Whispering Trails Blvd, Winter Haven, FL 33884"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205329495750663', 'asana', 'ORD-1205329495750663',
  '5144 Oxford Drive', 'Sarasota', 'FL', '34242', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Foreclosure', '2055',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5144 Oxford Drive, Sarasota, FL 34242"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205329272817246', 'asana', 'ORD-1205329272817246',
  '29374 Fedora Cir', 'Brooksville', 'FL', '29374', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-09-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "29374 Fedora Cir, Brooksville, FL 29374"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205329028855459', 'asana', 'ORD-1205329028855459',
  '608 MILES BLVD', 'DUNDEE', 'FL', '33838', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "608 MILES BLVD, DUNDEE, FL 33838"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205328832744896', 'asana', 'ORD-1205328832744896',
  '753 Firestone St NE Palm', 'Bay', 'FL', '32907', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-29T00:00:00.000Z', '2023-08-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "753 Firestone St NE Palm, Bay, FL 32907"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205328445840949', 'asana', 'ORD-1205328445840949',
  '11984 Kajetan Ln', 'Orlando', 'FL', '11984', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-22T00:00:00.000Z', '2023-08-29T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "11984 Kajetan Ln, Orlando, FL 11984"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205320652365686', 'asana', 'ORD-1205320652365686',
  '1861 RIVIERA CIR', 'Sarasota', 'FL', '34232', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'HELOC', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1861 RIVIERA CIR, Sarasota, FL 34232"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205320517701214', 'asana', 'ORD-1205320517701214',
  '137 W Stuart Ave Lake', 'Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-24T00:00:00.000Z', '2023-08-23T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "137 W Stuart Ave Lake, Wales, FL 33853"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205320211243771', 'asana', 'ORD-1205320211243771',
  '3448 Beekman Pl 49', 'Sarasota', 'FL', '34235', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VOXTUR VALUATION, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1073',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": "3448 Beekman Pl 49, Sarasota, FL 34235"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205320263535987', 'asana', 'ORD-1205320263535987',
  '835 MCFALL AVE', 'ORLANDO', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  225, 225,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-26T00:00:00.000Z', '2023-08-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "835 MCFALL AVE, ORLANDO, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205319809391990', 'asana', 'ORD-1205319809391990',
  '835 MCFALL AVE', 'ORLANDO', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-25T00:00:00.000Z', '2023-08-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "835 MCFALL AVE, ORLANDO, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205319145163723', 'asana', 'ORD-1205319145163723',
  '2556 44TH ST VERO', 'BEACH', 'FL', '32967', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-24T00:00:00.000Z', '2023-08-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Investment', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2556 44TH ST VERO, BEACH, FL 32967"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205318906618585', 'asana', 'ORD-1205318906618585',
  '636 Black Eagle Dr', 'Groveland', 'FL', '34736', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-21T00:00:00.000Z', '2023-08-24T00:00:00.000Z', '2023-08-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "636 Black Eagle Dr, Groveland, FL 34736"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205304654771827', 'asana', 'ORD-1205304654771827',
  '900 Kenilworth Ct', 'Titusville', 'FL', '32780', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-18T00:00:00.000Z', '2023-08-25T00:00:00.000Z', '2023-08-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "900 Kenilworth Ct, Titusville, FL 32780"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205288643529156', 'asana', 'ORD-1205288643529156',
  '1707 N Dovetail Dr', 'Fort Pierce', 'FL', '34982', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-16T00:00:00.000Z', '2023-08-22T00:00:00.000Z', '2023-08-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Acquisition', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1707 N Dovetail Dr, Fort Pierce, FL 34982"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205288569275497', 'asana', 'ORD-1205288569275497',
  '954 Lake Destiny Rd', 'Unit H Altamonte Springs', 'FL', '32714', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-16T00:00:00.000Z', '2023-08-18T00:00:00.000Z', '2023-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1075',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "954 Lake Destiny Rd, Unit H Altamonte Springs, FL 32714"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205288021007257', 'asana', 'ORD-1205288021007257',
  '6934 Sun N', 'Sebring', 'FL', '33872', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-08-16T00:00:00.000Z', '2023-08-21T00:00:00.000Z', '2023-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "6934 Sun N, Sebring, FL 33872"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205280977003475', 'asana', 'ORD-1205280977003475',
  '7611 Senrab Drive', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-08-15T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-29T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7611 Senrab Drive, Bradenton, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205280726648889', 'asana', 'ORD-1205280726648889',
  '2751 ALDINE CIRCLE', 'LAKELAND', 'FL', '33801', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-08-15T00:00:00.000Z', '2023-08-21T00:00:00.000Z', '2023-08-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2751 ALDINE CIRCLE, LAKELAND, FL 33801"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205279820475145', 'asana', 'ORD-1205279820475145',
  '10417 HART BRANCH CIR', 'Orlando', 'FL', '10417', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Prosperity Home Mortgage, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Prosperity Home Mortgage, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2023-08-15T00:00:00.000Z', '2023-08-18T00:00:00.000Z', '2023-08-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "10417 HART BRANCH CIR, Orlando, FL 10417"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205278631432881', 'asana', 'ORD-1205278631432881',
  '12773 Weston Oak Ln', 'Riverview', 'FL', '12773', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-08-15T00:00:00.000Z', '2023-08-18T00:00:00.000Z', '2023-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "12773 Weston Oak Ln, Riverview, FL 12773"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205278900342391', 'asana', 'ORD-1205278900342391',
  '613 Montezuma Dr', 'Bradenton', 'FL', '34209', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Property Rate%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-15T00:00:00.000Z', '2023-08-17T00:00:00.000Z', '2023-08-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "613 Montezuma Dr, Bradenton, FL 34209"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205272994262338', 'asana', 'ORD-1205272994262338',
  '660 Cricklewood Ter Lake', 'Mary', 'FL', '32746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-14T00:00:00.000Z', '2023-08-18T00:00:00.000Z', '2023-08-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "660 Cricklewood Ter Lake, Mary, FL 32746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205272900300984', 'asana', 'ORD-1205272900300984',
  '10201 FORGET ME NOT CT', 'ORLANDO', 'FL', '10201', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-14T00:00:00.000Z', '2023-08-17T00:00:00.000Z', '2023-08-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "10201 FORGET ME NOT CT, ORLANDO, FL 10201"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205272689986674', 'asana', 'ORD-1205272689986674',
  '570 Bern Ct', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-08-14T00:00:00.000Z', '2023-08-21T00:00:00.000Z', '2023-08-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "570 Bern Ct, Deltona, FL 32738"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205271201296920', 'asana', 'ORD-1205271201296920',
  '1611 Pine Bay Dr', 'Sarasota', 'FL', '34231', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-08-14T00:00:00.000Z', '2023-08-21T00:00:00.000Z', '2023-08-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1611 Pine Bay Dr, Sarasota, FL 34231"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205263245452892', 'asana', 'ORD-1205263245452892',
  '137 W Stuart Ave Lake', 'Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-08-13T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "137 W Stuart Ave Lake, Wales, FL 33853"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205260347972131', 'asana', 'ORD-1205260347972131',
  '205 Bonnie Court', 'Satellite Beach', 'FL', '32937', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-11T00:00:00.000Z', '2023-08-16T00:00:00.000Z', '2023-08-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "205 Bonnie Court, Satellite Beach, FL 32937"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205259956978092', 'asana', 'ORD-1205259956978092',
  '3801 Mckinnon Rd', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  900, 900,
  'completed', 'normal', 'refinance',
  '2023-08-11T00:00:00.000Z', '2023-08-16T00:00:00.000Z', '2023-08-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "3801 Mckinnon Rd, Windermere, FL 34786"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205259001031679', 'asana', 'ORD-1205259001031679',
  '4005 Dorwood Drive', 'Orlando', 'FL', '32818', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Tamarisk' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Tamarisk%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-11T00:00:00.000Z', '2023-08-17T00:00:00.000Z', '2023-08-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4005 Dorwood Drive, Orlando, FL 32818"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205253564171175', 'asana', 'ORD-1205253564171175',
  '7 Spring Pass', 'Ocala', 'FL', '34472', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-10T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "7 Spring Pass, Ocala, FL 34472"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205253403854479', 'asana', 'ORD-1205253403854479',
  '2446 Wildwood Dr.', 'Mims', 'FL', '32754', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-10T00:00:00.000Z', '2023-09-06T00:00:00.000Z', '2023-09-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', 'HUD',
  NULL,
  'bill', 'bid_request', 'ORL - SE - SECONDARY', 'none',
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
  '1205253189989764', 'asana', 'ORD-1205253189989764',
  '1312 Fern Creek Ave', 'Orlando', 'FL', '32803', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-10T00:00:00.000Z', '2023-08-16T00:00:00.000Z', '2023-08-16T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1312 Fern Creek Ave, Orlando, FL 32803"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205252973900287', 'asana', 'ORD-1205252973900287',
  'Parcel ID 9031-0958-16', 'Ocklawaha', 'FL', '32179', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-10T00:00:00.000Z', '2023-08-17T00:00:00.000Z', '2023-08-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "Parcel ID 9031-0958-16, Ocklawaha, FL 32179"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205252392312623', 'asana', 'ORD-1205252392312623',
  '6076 Sierra Crown Street Mount Dora Florida', '32757', 'FL', '32757', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Home Base Appraisal Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Home Base Appraisal Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-08-10T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6076 Sierra Crown Street Mount Dora Florida, 32757, FL 32757"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205243065165065', 'asana', 'ORD-1205243065165065',
  '4110 Elm St', 'Lady Lake', 'FL', '32159', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  418, 418,
  'completed', 'normal', 'refinance',
  '2023-08-09T00:00:00.000Z', '2023-08-31T00:00:00.000Z', '2023-09-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4110 Elm St, Lady Lake, FL 32159"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205242619436647', 'asana', 'ORD-1205242619436647',
  '4297 Green Gables Place', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-09T00:00:00.000Z', '2023-08-14T00:00:00.000Z', '2023-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4297 Green Gables Place, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205242677358727', 'asana', 'ORD-1205242677358727',
  '1515 Elizabeth Ave', 'Titusville', 'FL', '32780', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-09T00:00:00.000Z', '2023-08-14T00:00:00.000Z', '2023-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1515 Elizabeth Ave, Titusville, FL 32780"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205237818917674', 'asana', 'ORD-1205237818917674',
  '8939 Cabot Cliffs Drive', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-08-09T00:00:00.000Z', '2023-08-28T00:00:00.000Z', '2023-08-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "8939 Cabot Cliffs Drive, Davenport, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205237123058061', 'asana', 'ORD-1205237123058061',
  '712 W Plymouth St', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-08T00:00:00.000Z', '2023-08-11T00:00:00.000Z', '2023-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "712 W Plymouth St, Tampa, FL 33603"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205236283764606', 'asana', 'ORD-1205236283764606',
  '729 MONMOUTH WAY Winter', 'Park', 'FL', '32792', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-08-08T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "729 MONMOUTH WAY Winter, Park, FL 32792"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205235545861578', 'asana', 'ORD-1205235545861578',
  '2621 Robinson Ave', 'Sarasota', 'FL', '34232', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'A1 AMC INC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%A1 AMC INC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-08-08T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2621 Robinson Ave, Sarasota, FL 34232"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205235857338539', 'asana', 'ORD-1205235857338539',
  'MARION OAKS UNIT 10 BLK 971 LOT 25', 'OCALA', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-08-08T00:00:00.000Z', '2023-08-16T00:00:00.000Z', '2023-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "MARION OAKS UNIT 10 BLK 971 LOT 25, OCALA, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205228460839320', 'asana', 'ORD-1205228460839320',
  '555 Granite Cr Oviedo', 'Florida 32766', 'FL', '32766', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Property Science' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Property Science%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-16T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "555 Granite Cr Oviedo, Florida 32766, FL 32766"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205228435275880', 'asana', 'ORD-1205228435275880',
  '2429 Stuart St', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2429 Stuart St, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205228426140186', 'asana', 'ORD-1205228426140186',
  '2431 Stuart St', 'Tampa', 'FL', '33605', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2431 Stuart St, Tampa, FL 33605"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205228714107676', 'asana', 'ORD-1205228714107676',
  '710 W Plymouth St', 'Tampa', 'FL', '33603', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "710 W Plymouth St, Tampa, FL 33603"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205227594376753', 'asana', 'ORD-1205227594376753',
  '4903 NW Locust St', 'Arcadia', 'FL', '34266', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-09T00:00:00.000Z', '2023-08-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4903 NW Locust St, Arcadia, FL 34266"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205226329274053', 'asana', 'ORD-1205226329274053',
  '55 Sea Park Blvd Unit 603 Satellite', 'Beach', 'FL', '32937', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-07T00:00:00.000Z', '2023-08-11T00:00:00.000Z', '2023-08-15T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "55 Sea Park Blvd Unit 603 Satellite, Beach, FL 32937"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205214757860112', 'asana', 'ORD-1205214757860112',
  'SETUP AND MARKET', 'ANALYSIS', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-08-04T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "SETUP AND MARKET, ANALYSIS, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205215052807472', 'asana', 'ORD-1205215052807472',
  '406 Van Reed Manor Dr', 'Brandon', 'FL', '33511', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-04T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  NULL,
  'online', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "406 Van Reed Manor Dr, Brandon, FL 33511"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205214770039793', 'asana', 'ORD-1205214770039793',
  '6704 N Harer St', 'Tampa', 'FL', '33604', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-08-04T00:00:00.000Z', '2023-08-11T00:00:00.000Z', '2023-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "6704 N Harer St, Tampa, FL 33604"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205214455390029', 'asana', 'ORD-1205214455390029',
  '114 8TH ST S', 'BRADENTON BEACH', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  650, 650,
  'completed', 'normal', 'refinance',
  '2023-08-04T00:00:00.000Z', '2023-08-10T00:00:00.000Z', '2023-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'online', 'client_selection', 'TAMPA - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "114 8TH ST S, BRADENTON BEACH, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205214276325518', 'asana', 'ORD-1205214276325518',
  '4612 Terry Town Dr', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-04T00:00:00.000Z', '2023-08-15T00:00:00.000Z', '2023-08-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4612 Terry Town Dr, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205206240718917', 'asana', 'ORD-1205206240718917',
  '201 Wood Hollow Rd', 'Deland', 'FL', '32724', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-03T00:00:00.000Z', '2023-08-09T00:00:00.000Z', '2023-08-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "201 Wood Hollow Rd, Deland, FL 32724"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205198442291672', 'asana', 'ORD-1205198442291672',
  '2315 Hively St', 'Sarasota', 'FL', '34231', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'SWBC LENDING SOLUTIONS LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%SWBC LENDING SOLUTIONS LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-08-02T00:00:00.000Z', '2023-08-08T00:00:00.000Z', '2023-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2315 Hively St, Sarasota, FL 34231"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205197992094321', 'asana', 'ORD-1205197992094321',
  '212 GLADIOLUS STREET ANNA', 'MARIA', 'FL', '34216', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'LRES Corporation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%LRES Corporation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-08-02T00:00:00.000Z', '2023-08-09T00:00:00.000Z', '2023-08-09T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Foreclosure', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "212 GLADIOLUS STREET ANNA, MARIA, FL 34216"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205197157134012', 'asana', 'ORD-1205197157134012',
  '1332 Silverthorn Dr', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-02T00:00:00.000Z', '2023-08-07T00:00:00.000Z', '2023-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "1332 Silverthorn Dr, Orlando, FL 32825"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205197089862015', 'asana', 'ORD-1205197089862015',
  '3947 Glen Oaks Manor Dr', 'Sarasota', 'FL', '34232', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-02T00:00:00.000Z', '2023-08-07T00:00:00.000Z', '2023-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "3947 Glen Oaks Manor Dr, Sarasota, FL 34232"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205196774151968', 'asana', 'ORD-1205196774151968',
  '7901 COOT ST', 'ORLANDOFL32822', 'FL', '32822', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-08-02T00:00:00.000Z', '2023-08-07T00:00:00.000Z', '2023-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', '2055',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7901 COOT ST, ORLANDOFL32822, FL 32822"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205188984705161', 'asana', 'ORD-1205188984705161',
  '0000 Hancock And Olympia Ave Palm', 'Bay', 'FL', '32908', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-01T00:00:00.000Z', '2023-08-08T00:00:00.000Z', '2023-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "0000 Hancock And Olympia Ave Palm, Bay, FL 32908"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205188587235703', 'asana', 'ORD-1205188587235703',
  '608 Fish Hatchery Rd', 'Lakeland', 'FL', '33801', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'SUNTENDER VALUATIONS INC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%SUNTENDER VALUATIONS INC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-08-01T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1025',
  NULL,
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "608 Fish Hatchery Rd, Lakeland, FL 33801"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205187592333083', 'asana', 'ORD-1205187592333083',
  '1009 24th St', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  238, 238,
  'completed', 'normal', 'refinance',
  '2023-08-01T00:00:00.000Z', '2023-08-07T00:00:00.000Z', '2023-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1009 24th St, Orlando, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205187701457633', 'asana', 'ORD-1205187701457633',
  '4789 ANTRIM DR', 'SARASOTA', 'FL', '34240', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-08-01T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "4789 ANTRIM DR, SARASOTA, FL 34240"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205186993538754', 'asana', 'ORD-1205186993538754',
  '2107 E Jersey Ave', 'Orlando', 'FL', '32806', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-08-01T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-08T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2107 E Jersey Ave, Orlando, FL 32806"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205176539397200', 'asana', 'ORD-1205176539397200',
  '103 Caroline Ave', 'Lady Lake', 'FL', '32159', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-07-31T00:00:00.000Z', '2023-08-03T00:00:00.000Z', '2023-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "103 Caroline Ave, Lady Lake, FL 32159"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205176224227996', 'asana', 'ORD-1205176224227996',
  '1055 Pineapple Way', 'Kissimmee', 'FL', '34741', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-07-31T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1055 Pineapple Way, Kissimmee, FL 34741"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205174933906653', 'asana', 'ORD-1205174933906653',
  '418 Quail St Lady', 'Lake', 'FL', '32159', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-07-31T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-08-04T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "418 Quail St Lady, Lake, FL 32159"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205163999015376', 'asana', 'ORD-1205163999015376',
  '1455 PORTOFINO MEADOWS BLVD', 'ORLANDO', 'FL', '32824', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  352, 352,
  'completed', 'normal', 'refinance',
  '2023-07-28T00:00:00.000Z', '2023-08-05T00:00:00.000Z', '2023-08-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "1455 PORTOFINO MEADOWS BLVD, ORLANDO, FL 32824"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205163439109130', 'asana', 'ORD-1205163439109130',
  '5049 Blue Hammock Court', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-28T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5049 Blue Hammock Court, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205162175729025', 'asana', 'ORD-1205162175729025',
  '3402 Basie Pl', 'Orlando', 'FL', '32805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-28T00:00:00.000Z', '2023-08-14T00:00:00.000Z', '2023-08-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3402 Basie Pl, Orlando, FL 32805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205162137740159', 'asana', 'ORD-1205162137740159',
  '3009 DRAKE DR', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-07-28T00:00:00.000Z', '2023-08-02T00:00:00.000Z', '2023-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Asset Valuation', '2055',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3009 DRAKE DR, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205156932866682', 'asana', 'ORD-1205156932866682',
  '3728 Briar Run Dr', 'ClermontFL34711', 'FL', '34711', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-27T00:00:00.000Z', '2023-08-03T00:00:00.000Z', '2023-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3728 Briar Run Dr, ClermontFL34711, FL 34711"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205156259682667', 'asana', 'ORD-1205156259682667',
  '5929 WILDWOOD AVE', 'SARASOTA', 'FL', '34231', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-07-27T00:00:00.000Z', '2023-08-02T00:00:00.000Z', '2023-08-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "5929 WILDWOOD AVE, SARASOTA, FL 34231"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205147765738439', 'asana', 'ORD-1205147765738439',
  '2359 Old Train Rd', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'product_expansion', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2359 Old Train Rd, Deltona, FL 32738"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205147481186619', 'asana', 'ORD-1205147481186619',
  '836 MURDOCK BLVD', 'Orlando', 'FL', '32825', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VOXTUR VALUATION, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-08-01T00:00:00.000Z', '2023-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "836 MURDOCK BLVD, Orlando, FL 32825"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205147369045687', 'asana', 'ORD-1205147369045687',
  '915 Golden Bear Dr', 'Reunion', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-08-04T00:00:00.000Z', '2023-08-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "915 Golden Bear Dr, Reunion, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205147330563034', 'asana', 'ORD-1205147330563034',
  '2120 SW 158th Street Rd', 'OcalaFL34473', 'FL', '34473', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  275, 275,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2120 SW 158th Street Rd, OcalaFL34473, FL 34473"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205146546847923', 'asana', 'ORD-1205146546847923',
  '13305 Lacebark Pine Rd', 'Orlando', 'FL', '13305', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-08-02T00:00:00.000Z', '2023-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13305 Lacebark Pine Rd, Orlando, FL 13305"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205146092518431', 'asana', 'ORD-1205146092518431',
  '3010 39th Ave W', 'Bradenton', 'FL', '34205', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-26T00:00:00.000Z', '2023-07-28T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3010 39th Ave W, Bradenton, FL 34205"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205139334988883', 'asana', 'ORD-1205139334988883',
  '652 NW Sunset Dr', 'Stuart', 'FL', '34994', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-25T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "652 NW Sunset Dr, Stuart, FL 34994"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205139123866907', 'asana', 'ORD-1205139123866907',
  '4191 67th Ave N', 'Pinellas Park', 'FL', '33781', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  225, 225,
  'completed', 'normal', 'refinance',
  '2023-07-25T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'bid_request', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4191 67th Ave N, Pinellas Park, FL 33781"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205138347939438', 'asana', 'ORD-1205138347939438',
  '2943 Penelope Loop', 'Kissimmee', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-07-25T00:00:00.000Z', '2023-08-02T00:00:00.000Z', '2023-08-03T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2943 Penelope Loop, Kissimmee, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205138282210169', 'asana', 'ORD-1205138282210169',
  '689 CANOPY ESTATES DR WINTER', 'GARDEN', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-07-25T00:00:00.000Z', '2023-07-29T00:00:00.000Z', '2023-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "689 CANOPY ESTATES DR WINTER, GARDEN, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205132281779277', 'asana', 'ORD-1205132281779277',
  '838 Bethune Avenue Winter', 'Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-24T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "838 Bethune Avenue Winter, Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205130474090482', 'asana', 'ORD-1205130474090482',
  '262 Dirksen Drive', 'DeBary', 'FL', '32713', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-24T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Refinance', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "262 Dirksen Drive, DeBary, FL 32713"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205116956600791', 'asana', 'ORD-1205116956600791',
  '[Converted to template] SETUP AND MARKET', 'ANALYSIS', 'FL', '00000', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-07-22T00:00:00.000Z', '2023-07-22T00:00:00.000Z', '2023-07-22T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "[Converted to template] SETUP AND MARKET, ANALYSIS, FL 00000"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205115468784384', 'asana', 'ORD-1205115468784384',
  '5021 Stone Harbor Cir', 'Wimauma', 'FL', '33598', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  385, 385,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "5021 Stone Harbor Cir, Wimauma, FL 33598"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205115516714455', 'asana', 'ORD-1205115516714455',
  '2347 MOCKINGBIRD HILL DR', 'APOPKAFL32703', 'FL', '32703', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2347 MOCKINGBIRD HILL DR, APOPKAFL32703, FL 32703"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205115750633727', 'asana', 'ORD-1205115750633727',
  '1402 W WINNEMISSETT AVENUE', 'DELANDFL32720', 'FL', '32720', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-28T00:00:00.000Z', '2023-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1402 W WINNEMISSETT AVENUE, DELANDFL32720, FL 32720"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205114508213417', 'asana', 'ORD-1205114508213417',
  '15005 Sunglow Court', 'Tampa', 'FL', '15005', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-25T00:00:00.000Z', '2023-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "15005 Sunglow Court, Tampa, FL 15005"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205113979658055', 'asana', 'ORD-1205113979658055',
  '1035 Coletta Dr', 'Orlando', 'FL', '32807', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-31T00:00:00.000Z', '2023-07-31T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1035 Coletta Dr, Orlando, FL 32807"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205113754210843', 'asana', 'ORD-1205113754210843',
  '3045 Dove Ln', 'Mulberry', 'FL', '33860', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-08-02T00:00:00.000Z', '2023-08-02T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "3045 Dove Ln, Mulberry, FL 33860"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205111585565659', 'asana', 'ORD-1205111585565659',
  '400 Manatee Ave Holmes', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-21T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "400 Manatee Ave Holmes, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205106097795065', 'asana', 'ORD-1205106097795065',
  '2414 Avenue C Bradenton', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-20T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2414 Avenue C Bradenton, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205106355682159', 'asana', 'ORD-1205106355682159',
  '243 S Harbor Dr Holmes', 'Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-20T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "243 S Harbor Dr Holmes, Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205105543812942', 'asana', 'ORD-1205105543812942',
  '1508 24th Avenue Dr W', 'BradentonFL34205', 'FL', '34205', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-20T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1508 24th Avenue Dr W, BradentonFL34205, FL 34205"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205097369419179', 'asana', 'ORD-1205097369419179',
  '260 VENETIAN PALMS New Smyrna', 'Beach', 'FL', '32168', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Amo Services' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Amo Services%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Mortgage Servicing', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "260 VENETIAN PALMS New Smyrna, Beach, FL 32168"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096834245126', 'asana', 'ORD-1205096834245126',
  '196 Bimini Dr', 'PalmettoFL34221', 'FL', '34221', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-08-30T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
  NULL,
  'bill', 'bid_request', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "196 Bimini Dr, PalmettoFL34221, FL 34221"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096779493452', 'asana', 'ORD-1205096779493452',
  '2865 Clever Ln Winter', 'parkFL32792', 'FL', '32792', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-28T00:00:00.000Z', '2023-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2865 Clever Ln Winter, parkFL32792, FL 32792"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096667946810', 'asana', 'ORD-1205096667946810',
  '4903 NW Locust St', 'Arcadia', 'FL', '34266', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  410, 410,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "4903 NW Locust St, Arcadia, FL 34266"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096747948362', 'asana', 'ORD-1205096747948362',
  '12611 Castleberry Ct', 'Hudson', 'FL', '12611', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-28T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "12611 Castleberry Ct, Hudson, FL 12611"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096742470913', 'asana', 'ORD-1205096742470913',
  '4427 Old Government Rd', 'Lakeland', 'FL', '33811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-28T00:00:00.000Z', '2023-08-01T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "4427 Old Government Rd, Lakeland, FL 33811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096120571840', 'asana', 'ORD-1205096120571840',
  '204 E South St #5043', 'Orlando', 'FL', '32801', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  80, 80,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z', '2023-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'Purchase', '1007',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "204 E South St #5043, Orlando, FL 32801"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205096208991133', 'asana', 'ORD-1205096208991133',
  '1318 CARMEN AVENUE DAYTONA', 'BEACH', 'FL', '32117', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-25T00:00:00.000Z', '2023-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1318 CARMEN AVENUE DAYTONA, BEACH, FL 32117"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205095597432883', 'asana', 'ORD-1205095597432883',
  '1020 Lee St', 'Leesburg', 'FL', '34748', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  330, 330,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1020 Lee St, Leesburg, FL 34748"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205094821329497', 'asana', 'ORD-1205094821329497',
  '2509 Ave L 2509 Ave', 'L', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z', '2023-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "2509 Ave L 2509 Ave, L, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205089324420473', 'asana', 'ORD-1205089324420473',
  '415 W. 2nd Ave', 'Windermere', 'FL', '34786', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-18T00:00:00.000Z', '2023-07-25T00:00:00.000Z', '2023-07-24T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "415 W. 2nd Ave, Windermere, FL 34786"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205088257402037', 'asana', 'ORD-1205088257402037',
  '4464 Brooke St', 'OrlandoFL32811', 'FL', '32811', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-07-18T00:00:00.000Z', '2023-07-24T00:00:00.000Z', '2023-07-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Mortgage Servicing', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "4464 Brooke St, OrlandoFL32811, FL 32811"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205087972711447', 'asana', 'ORD-1205087972711447',
  '4089 King Richard Dr', 'Sarasota', 'FL', '34232', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-07-18T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004D',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "4089 King Richard Dr, Sarasota, FL 34232"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205079276473757', 'asana', 'ORD-1205079276473757',
  '5712 Satel Dr', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-07-17T00:00:00.000Z', '2023-07-21T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - SW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "5712 Satel Dr, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205078705354123', 'asana', 'ORD-1205078705354123',
  '600 5TH AVE DAYTONA', 'BEACH', 'FL', '32118', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  250, 250,
  'completed', 'normal', 'refinance',
  '2023-07-17T00:00:00.000Z', '2023-07-25T00:00:00.000Z', '2023-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Mortgage Servicing', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "600 5TH AVE DAYTONA, BEACH, FL 32118"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205046248551817', 'asana', 'ORD-1205046248551817',
  '1765 5th Ave', 'DeLand', 'FL', '32724', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-14T00:00:00.000Z', '2023-07-21T00:00:00.000Z', '2023-07-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1765 5th Ave, DeLand, FL 32724"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205067764002697', 'asana', 'ORD-1205067764002697',
  '7510 HOLLY ST MOUNT', 'DORA', 'FL', '32757', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-14T00:00:00.000Z', '2023-07-21T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "7510 HOLLY ST MOUNT, DORA, FL 32757"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205067726229778', 'asana', 'ORD-1205067726229778',
  '13330 Georgia Ave', 'Astatula', 'FL', '13330', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-07-14T00:00:00.000Z', '2023-07-24T00:00:00.000Z', '2023-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', 'FHA',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13330 Georgia Ave, Astatula, FL 13330"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205046118391126', 'asana', 'ORD-1205046118391126',
  '16450 GULF BOULEVARD UNIT #265 NORTH REDINGTON', 'BEACH', 'FL', '16450', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VOXTUR VALUATION, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  225, 225,
  'completed', 'normal', 'refinance',
  '2023-07-14T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-07-26T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1075',
  NULL,
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "16450 GULF BOULEVARD UNIT #265 NORTH REDINGTON, BEACH, FL 16450"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205065997142654', 'asana', 'ORD-1205065997142654',
  '3010 39th Ave W', 'Bradenton', 'FL', '34205', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  317, 317,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3010 39th Ave W, Bradenton, FL 34205"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205065968293948', 'asana', 'ORD-1205065968293948',
  '1844 7th Ave', 'DeLand', 'FL', '32724', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-21T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1844 7th Ave, DeLand, FL 32724"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205044386864178', 'asana', 'ORD-1205044386864178',
  '1190 SHORE VIEW DR', 'ENGLEWOOD', 'FL', '34223', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": "1190 SHORE VIEW DR, ENGLEWOOD, FL 34223"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205065815465429', 'asana', 'ORD-1205065815465429',
  '1618 Redfin Dr', 'Poinciana', 'FL', '34759', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-21T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1618 Redfin Dr, Poinciana, FL 34759"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205058043816456', 'asana', 'ORD-1205058043816456',
  '40151 Sherydan Glenn', 'Lady Lake', 'FL', '40151', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  185, 185,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-20T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "40151 Sherydan Glenn, Lady Lake, FL 40151"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205065061042282', 'asana', 'ORD-1205065061042282',
  '1603 North Indian River Road New Smyrna', 'Beach', 'FL', '32169', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-13T00:00:00.000Z', '2023-07-20T00:00:00.000Z', '2023-07-25T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'bid_request', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1603 North Indian River Road New Smyrna, Beach, FL 32169"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205041472235970', 'asana', 'ORD-1205041472235970',
  '4621 103rd St W', 'BradentonFL34210', 'FL', '34210', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'APPRAISAL LINKS INC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%APPRAISAL LINKS INC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  53, 53,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-21T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Ascertain Market Value', '1004',
  NULL,
  'bill', 'bid_request', 'TAMPA - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4621 103rd St W, BradentonFL34210, FL 34210"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205055879414322', 'asana', 'ORD-1205055879414322',
  '15179 sw 29th ave rd', 'Ocala', 'FL', '15179', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '2000',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "15179 sw 29th ave rd, Ocala, FL 15179"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205062990497349', 'asana', 'ORD-1205062990497349',
  '9015 Pelican Cove Trave', 'Kissimmee', 'FL', '34747', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "9015 Pelican Cove Trave, Kissimmee, FL 34747"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205055789975070', 'asana', 'ORD-1205055789975070',
  '8112 SERGEANT PEPPER DR HOWEY IN', 'HLS', 'FL', '34737', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-17T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "8112 SERGEANT PEPPER DR HOWEY IN, HLS, FL 34737"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205055469095373', 'asana', 'ORD-1205055469095373',
  'INTAKE - 2536 17th Ave S St.', 'Petersburg', 'FL', '33712', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  0, 0,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  NULL, NULL, NULL,
  NULL,
  'bill', 'client_selection', NULL, 'none',
  'residential', false, false,
  '{"original_address": "INTAKE - 2536 17th Ave S St., Petersburg, FL 33712"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205041093665572', 'asana', 'ORD-1205041093665572',
  '2412 Avenue C', 'Bradenton Beach', 'FL', '34217', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  400, 400,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-26T00:00:00.000Z', '2023-07-28T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2412 Avenue C, Bradenton Beach, FL 34217"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205055460601930', 'asana', 'ORD-1205055460601930',
  '2504 Wilkins Ave', 'Fort Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2504 Wilkins Ave, Fort Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205055381303436', 'asana', 'ORD-1205055381303436',
  '2513 Ave L Fort', 'Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2513 Ave L Fort, Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205040756686134', 'asana', 'ORD-1205040756686134',
  '2507 Avenue L', 'Fort Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-13T00:00:00.000Z', '2023-07-18T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2507 Avenue L, Fort Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205040547698938', 'asana', 'ORD-1205040547698938',
  '2505 Ave L Fort', 'Pierce', 'FL', '34947', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-12T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "2505 Ave L Fort, Pierce, FL 34947"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205014847485485', 'asana', 'ORD-1205014847485485',
  '691 Dropshot Dr', 'Davenport', 'FL', '33896', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-11T00:00:00.000Z', '2023-07-27T00:00:00.000Z', '2023-07-27T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "691 Dropshot Dr, Davenport, FL 33896"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205014958138094', 'asana', 'ORD-1205014958138094',
  'LOT 138 Shirley Shores Rd', 'Tavares', 'FL', '32778', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-11T00:00:00.000Z', '2023-07-17T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Other (see description)', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NW - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "LOT 138 Shirley Shores Rd, Tavares, FL 32778"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205014709482067', 'asana', 'ORD-1205014709482067',
  '2359 Old Train Road', 'Deltona', 'FL', '32738', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'AppraiserVendor.com, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%AppraiserVendor.com, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-07-11T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004D',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "2359 Old Train Road, Deltona, FL 32738"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205014567733963', 'asana', 'ORD-1205014567733963',
  '1600 W Lake Parker Dr #A3', 'Lakeland', 'FL', '33805', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  325, 325,
  'completed', 'normal', 'refinance',
  '2023-07-11T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "1600 W Lake Parker Dr #A3, Lakeland, FL 33805"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205013515338793', 'asana', 'ORD-1205013515338793',
  '520 S 10TH ST', 'Lake Wales', 'FL', '33853', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-07-11T00:00:00.000Z', '2023-07-18T00:00:00.000Z', '2023-07-19T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "520 S 10TH ST, Lake Wales, FL 33853"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205006095389782', 'asana', 'ORD-1205006095389782',
  '1508 BROKEN OAK DR # 24C', 'Winter Garden', 'FL', '34787', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Consolidated Analytics' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Consolidated Analytics%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  328, 328,
  'completed', 'normal', 'refinance',
  '2023-07-10T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_recognition', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "1508 BROKEN OAK DR # 24C, Winter Garden, FL 34787"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205006017579903', 'asana', 'ORD-1205006017579903',
  '9748 50th Street Cir E', 'Duette', 'FL', '34219', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nations Valuation Services Inc' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nations Valuation Services Inc%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-07-10T00:00:00.000Z', '2023-07-17T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  NULL,
  'bill', 'client_recognition', 'TAMPA - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "9748 50th Street Cir E, Duette, FL 34219"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205005775057440', 'asana', 'ORD-1205005775057440',
  '3001 Sidney Avenue', 'Orlando', 'FL', '32810', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = '[Unknown Client]' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%[Unknown Client]%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-07-10T00:00:00.000Z', '2023-07-19T00:00:00.000Z', '2023-07-20T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1025',
  NULL,
  'bill', 'new_client', 'ORL - SW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "3001 Sidney Avenue, Orlando, FL 32810"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205004010518033', 'asana', 'ORD-1205004010518033',
  '802 Clear Brook Ct', 'Fruitland Park', 'FL', '34731', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%E STREET APPRAISAL MANAGEMENT LLC (EVO)%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-10T00:00:00.000Z', '2023-07-17T00:00:00.000Z', '2023-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Other (see description)', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NW - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "802 Clear Brook Ct, Fruitland Park, FL 34731"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1205003044243930', 'asana', 'ORD-1205003044243930',
  '4320 OLD TAMPA HWY', 'KISSIMMEE', 'FL', '34746', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Valutrust Solutions LLC.' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Valutrust Solutions LLC.%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  200, 200,
  'completed', 'normal', 'refinance',
  '2023-07-10T00:00:00.000Z', '2023-07-13T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'bid_request', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "4320 OLD TAMPA HWY, KISSIMMEE, FL 34746"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204991290019544', 'asana', 'ORD-1204991290019544',
  '85 Forestway Circle #102 Altamonte', 'Springs', 'FL', '32701', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Core Valuation Management' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Core Valuation Management%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  475, 475,
  'completed', 'normal', 'refinance',
  '2023-07-07T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "85 Forestway Circle #102 Altamonte, Springs, FL 32701"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204991226965827', 'asana', 'ORD-1204991226965827',
  '17108 Carrington Park Drive', '713 Tampa', 'FL', '17108', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  375, 375,
  'completed', 'normal', 'refinance',
  '2023-07-07T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-17T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'quote_follow_up', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "17108 Carrington Park Drive, 713 Tampa, FL 17108"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204990236249281', 'asana', 'ORD-1204990236249281',
  '3330 Yorktown St', 'Sarasota', 'FL', '34231', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  300, 300,
  'completed', 'normal', 'refinance',
  '2023-07-07T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-11T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'water',
  'residential', false, false,
  '{"original_address": "3330 Yorktown St, Sarasota, FL 34231"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204984059997207', 'asana', 'ORD-1204984059997207',
  '4828 Grovemont Pl', 'Orlando', 'FL', '32808', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Property Rate' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Property Rate%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  150, 150,
  'completed', 'normal', 'refinance',
  '2023-07-06T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-13T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004D',
  NULL,
  'bill', 'additional_service', 'ORL - SW - PRIMARY', 'none',
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
  '1204984001876672', 'asana', 'ORD-1204984001876672',
  '3837 OCITA DR', 'Orlando', 'FL', '32837', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Nationwide Appraisal Network' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Nationwide Appraisal Network%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-07-06T00:00:00.000Z', '2023-07-13T00:00:00.000Z', '2023-07-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "3837 OCITA DR, Orlando, FL 32837"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204983667799618', 'asana', 'ORD-1204983667799618',
  '1699 BRENTLAWN ST', 'DELTONAFL32725', 'FL', '32725', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  445, 445,
  'completed', 'normal', 'refinance',
  '2023-07-06T00:00:00.000Z', '2023-07-12T00:00:00.000Z', '2023-07-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  NULL,
  'bill', 'bid_request', 'ORL - NE - PRIMARY', 'water',
  'residential', false, false,
  '{"original_address": "1699 BRENTLAWN ST, DELTONAFL32725, FL 32725"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204981808237646', 'asana', 'ORD-1204981808237646',
  '4186 Tee Rd', 'Sarasota', 'FL', '34235', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VOXTUR VALUATION, LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  215, 215,
  'completed', 'normal', 'refinance',
  '2023-07-06T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-12T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'exterior_only', 'Loan Servicing', 'FHA',
  NULL,
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "4186 Tee Rd, Sarasota, FL 34235"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204959974116303', 'asana', 'ORD-1204959974116303',
  '30051 STATE ROAD 44', 'EUSTISFL32736', 'FL', '30051', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  500, 500,
  'completed', 'normal', 'refinance',
  '2023-07-03T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004C',
  NULL,
  'bill', 'client_selection', 'ORL - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "30051 STATE ROAD 44, EUSTISFL32736, FL 30051"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204958571813574', 'asana', 'ORD-1204958571813574',
  '5119 Rue Vendome', 'Lutz', 'FL', '33558', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'NVS' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%NVS%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  125, 125,
  'completed', 'normal', 'refinance',
  '2023-07-03T00:00:00.000Z', '2023-07-08T00:00:00.000Z', '2023-07-05T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'desktop', 'HELOC', '1004',
  NULL,
  'bill', 'client_selection', 'TAMPA - NE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5119 Rue Vendome, Lutz, FL 33558"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204958286306208', 'asana', 'ORD-1204958286306208',
  '108 Firenze Ave E', 'Venice', 'FL', '34285', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Class Valuation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Class Valuation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  450, 450,
  'completed', 'normal', 'refinance',
  '2023-07-03T00:00:00.000Z', '2023-07-14T00:00:00.000Z', '2023-07-14T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['216']::text[],
  'bill', 'client_selection', 'TAMPA - SW - SECONDARY', 'none',
  'residential', false, false,
  '{"original_address": "108 Firenze Ave E, Venice, FL 34285"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204947853849808', 'asana', 'ORD-1204947853849808',
  '13028 Plantation Park Cir #1234', 'OrlandoFL32821', 'FL', '13028', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'MTS GROUP LLC' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%MTS GROUP LLC%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  350, 350,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-07T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Refinance', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "13028 Plantation Park Cir #1234, OrlandoFL32821, FL 13028"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204947840439193', 'asana', 'ORD-1204947840439193',
  '1550 E Bay St', 'Bartow', 'FL', '33830', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'VISION' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%VISION%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  550, 550,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-07T00:00:00.000Z', '2023-07-06T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'New Construction', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'TAMPA - SW - EXTENDED', 'none',
  'residential', false, false,
  '{"original_address": "1550 E Bay St, Bartow, FL 33830"}'::jsonb
);

INSERT INTO orders (
  external_id, source, order_number,
  property_address, property_city, property_state, property_zip, property_type,
  borrower_name, client_id, fee_amount, total_amount,
  status, priority, order_type,
  ordered_date, due_date, completed_date,
  created_by, org_id,
  scope_of_work, intended_use, report_form_type, additional_forms,
  billing_method, sales_campaign, service_region, site_influence,
  zoning_type, is_multiunit, is_new_construction,
  props
) VALUES (
  '1204947808934600', 'asana', 'ORD-1204947808934600',
  '5421 Snowflake Ct', 'OrlandoFL32839', 'FL', '32839', 'single_family',
  'Unknown Borrower',
  COALESCE(
    (SELECT id FROM clients WHERE company_name = 'Appraisal Nation' LIMIT 1),
    (SELECT id FROM clients WHERE company_name ILIKE '%Appraisal Nation%' LIMIT 1),
    (SELECT id FROM clients WHERE company_name = '[Unassigned Orders]' LIMIT 1)
  ),
  425, 425,
  'completed', 'normal', 'refinance',
  '2023-06-30T00:00:00.000Z', '2023-07-10T00:00:00.000Z', '2023-07-10T00:00:00.000Z',
  (SELECT id FROM profiles LIMIT 1), (SELECT id FROM profiles LIMIT 1),
  'interior', 'Purchase', '1004',
  ARRAY['1007']::text[],
  'bill', 'client_selection', 'ORL - SE - PRIMARY', 'none',
  'residential', false, false,
  '{"original_address": "5421 Snowflake Ct, OrlandoFL32839, FL 32839"}'::jsonb
);


-- Verify batch
SELECT COUNT(*) as total FROM orders WHERE source = 'asana';