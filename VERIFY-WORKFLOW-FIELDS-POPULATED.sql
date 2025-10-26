-- ==============================================
-- VERIFY WORKFLOW FIELDS WERE POPULATED
-- Check if the new appraisal fields have data
-- ==============================================

-- Check a few sample orders to see if workflow fields have data
SELECT 
  order_number,
  property_address,
  -- NEW WORKFLOW FIELDS:
  scope_of_work,
  intended_use,
  report_form_type,
  additional_forms,
  billing_method,
  sales_campaign,
  service_region,
  site_influence,
  is_multiunit,
  multiunit_type,
  is_new_construction,
  zoning_type,
  inspection_date,
  -- Original fields for comparison:
  fee_amount,
  status
FROM orders
WHERE source = 'asana'
ORDER BY ordered_date DESC
LIMIT 5;

-- ==============================================
-- COUNT HOW MANY ORDERS HAVE DATA IN EACH FIELD
-- ==============================================

SELECT 
  COUNT(*) as total_orders,
  COUNT(scope_of_work) as has_scope_of_work,
  COUNT(intended_use) as has_intended_use,
  COUNT(report_form_type) as has_report_form,
  COUNT(additional_forms) as has_additional_forms,
  COUNT(billing_method) as has_billing_method,
  COUNT(sales_campaign) as has_sales_campaign,
  COUNT(service_region) as has_service_region,
  COUNT(site_influence) as has_site_influence,
  COUNT(CASE WHEN is_multiunit = true THEN 1 END) as multiunit_count,
  COUNT(CASE WHEN is_new_construction = true THEN 1 END) as new_construction_count,
  COUNT(zoning_type) as has_zoning_type
FROM orders
WHERE source = 'asana';

-- ==============================================
-- CHECK IF DATA IS IN PROPS INSTEAD
-- ==============================================

-- Maybe the data went to props instead of dedicated columns?
SELECT 
  order_number,
  property_address,
  props->>'scope_of_work' as props_scope,
  props->>'report_format' as props_report_format,
  props->>'billing_method' as props_billing,
  props->>'area' as props_area,
  props->>'original_address' as props_original_address
FROM orders
WHERE source = 'asana'
LIMIT 5;

-- ==============================================
-- INTERPRETATION
-- ==============================================

-- If the COUNT query shows all zeros for the workflow fields,
-- it means the preset didn't map them during import.
-- This can happen if:
-- 1. The preset wasn't applied (we manually mapped only external_id)
-- 2. The CSV column names didn't match the preset mappings
-- 3. The transform functions had errors

-- If the data IS in props, we can migrate it to the dedicated columns
-- If the data isn't anywhere, we may need to re-import with proper mappings

