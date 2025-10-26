-- ==============================================
-- BACKFILL WORKFLOW FIELDS FOR 20 ORDERS
-- Generated from October_Orders_Consolidated.csv
-- ==============================================

-- Order 1: 215 S French Ave, Fort Meade, FL 33841 
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SE - EXTENDED',
  site_influence = 'none'
WHERE external_id = '1211674388034570';

-- Order 2: 5255 IMAGES CIR, UNIT 305 KISSIMMEE, FL 34746
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Other (see description)',
  report_form_type = '1073',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211640028782630';

-- Order 3: 5271 IMAGES CIR, UNIT 303 KISSIMMEE, FL 34746
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Other (see description)',
  report_form_type = '1073',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211640028782580';

-- Order 4: 1843 Bramblewood Dr, Orlando, FL 32818
UPDATE orders SET
  scope_of_work = 'interior',
  report_form_type = 'GP',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211624625042602';

-- Order 5: 3602 Gillot Blvd, Port Charlotte, FL 33981 
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Cash Out Refinance',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'TAMPA - SE - EXTENDED',
  site_influence = 'none'
WHERE external_id = '1211624625042546';

-- Order 6: 2602 W 20th St, Sanford, FL 32771
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - NE - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211611375835362';

-- Order 7: 12 N Ohio St, Orlando, FL 32805
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1025',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211611375391625';

-- Order 8: 10 N Ohio St Orlando, FL 32805
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1025',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211610050432796';

-- Order 9: 1724 Elizabeth Ave, Titusville, FL 32780 
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Cash Out Refinance',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SE - SECONDARY',
  site_influence = 'none'
WHERE external_id = '1211578191312525';

-- Order 10:  5013 Myrtlewood Rd, LaBelle, FL 33935 
UPDATE orders SET
  scope_of_work = 'exterior_only',
  intended_use = 'Other (see description)',
  report_form_type = '2055',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211578190240425';

-- Order 11: 5587 DEVONBRIAR WAY UNIT J-102 , Orlando, FL 32822
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1073',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211578190240423';

-- Order 12: 4401 THORNBRIAR LN UNIT R-201 , Orlando, FL 32822
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1073',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211578190240421';

-- Order 13: 4225 THORNBRIAR LN UNIT O-209  Orlando, FL  32822
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1073',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211577429465274';

-- Order 14: 1012 Diego Ct Lady Lake, FL 32159
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = '1004',
  additional_forms = ARRAY['AFTER REPAIR VALUE']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - NW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211565589370963';

-- Order 15: 5911 Carter St, Orlando, FL 32835
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1004',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211546417153586';

-- Order 16: 2460 Plumadore Dr, Grand Island, FL, 32735
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = 'FHA',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - NW - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211529199735731';

-- Order 17: 9517 W Flora St, Tampa, FL 33615 
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'TAMPA - NE - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211526441920687';

-- Order 18: 205 E Magnolia St,, Davenport, FL  33837
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = 'GP',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - SECONDARY',
  site_influence = 'none'
WHERE external_id = '1211526126122046';

-- Order 19:  4801 S 88th St, Tampa, FL 33619 
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = '1004',
  additional_forms = ARRAY['AFTER REPAIR VALUE']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'TAMPA - NE - PRIMARY',
  site_influence = 'none'
WHERE external_id = '1211524294829250';

-- Order 20: 1974 IBIS BAY COURT Ocoee FL 34761
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Refinance',
  report_form_type = '1004',
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SW - PRIMARY',
  site_influence = 'water'
WHERE external_id = '1211522402921020';


-- ==============================================
-- VERIFY BACKFILL RESULTS
-- ==============================================


SELECT 
  COUNT(*) as total_orders,
  COUNT(scope_of_work) as has_scope,
  COUNT(intended_use) as has_intended_use,
  COUNT(report_form_type) as has_report_form,
  COUNT(billing_method) as has_billing,
  COUNT(sales_campaign) as has_campaign,
  COUNT(service_region) as has_region
FROM orders
WHERE source = 'asana';
