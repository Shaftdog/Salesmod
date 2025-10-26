-- ==============================================
-- FIX 6 UNLINKED ORDERS - CREATE PROPERTIES & LINK
-- Fixes city parsing issues and creates missing properties
-- ==============================================

-- ==============================================
-- STEP 1: Fix Address Parsing Issues
-- ==============================================

-- Fix orders where city ended up in the street field
-- Pattern: "123 Street CityName" should be "123 Street" + city="CityName"

-- Order 1: 10 N Ohio St Orlando → city should be "Orlando"
UPDATE orders 
SET 
  property_address = '10 N Ohio St',
  property_city = 'Orlando'
WHERE order_number = 'ORD-1761341952272';

-- Order 2: 4225 THORNBRIAR LN UNIT O-209 Orlando → city should be "Orlando"
UPDATE orders 
SET 
  property_address = '4225 THORNBRIAR LN UNIT O-209',
  property_city = 'Orlando'
WHERE order_number = 'ORD-1761341955839';

-- Order 3: 1012 Diego Ct Lady Lake → city should be "Lady Lake"
UPDATE orders 
SET 
  property_address = '1012 Diego Ct',
  property_city = 'Lady Lake'
WHERE order_number = 'ORD-1761341956200';

-- Order 4: 1974 IBIS BAY COURT Ocoee → city should be "Ocoee"
UPDATE orders 
SET 
  property_address = '1974 IBIS BAY COURT',
  property_city = 'Ocoee'
WHERE order_number = 'ORD-1761341960814';

-- Verify fixes
SELECT 
  order_number,
  property_address,
  property_city,
  property_state,
  property_zip
FROM orders
WHERE order_number IN (
  'ORD-1761341952272',
  'ORD-1761341955839', 
  'ORD-1761341956200',
  'ORD-1761341960814',
  'ORD-1761438202377',
  'ORD-1761438202378'
);

-- ==============================================
-- STEP 2: Create Properties for All 6 Unlinked Orders
-- ==============================================

-- Create properties using order's address data
-- Uses ON CONFLICT to handle duplicates gracefully
INSERT INTO properties (
  org_id,
  address_line1,
  city,
  state,
  postal_code,
  property_type,
  addr_hash
)
SELECT DISTINCT ON (o.property_address, o.property_city, o.property_state, o.property_zip)
  o.created_by as org_id,
  o.property_address,
  o.property_city,
  UPPER(o.property_state),
  o.property_zip,
  o.property_type,
  md5(
    LOWER(TRIM(o.property_address)) || '|' || 
    LOWER(TRIM(o.property_city)) || '|' || 
    UPPER(TRIM(o.property_state)) || '|' || 
    TRIM(o.property_zip)
  ) as addr_hash
FROM orders o
WHERE o.source = 'asana'
  AND o.property_id IS NULL
  AND o.property_city != 'Unknown'
  AND o.property_state != 'XX'
  AND o.property_zip != '00000'
ON CONFLICT (org_id, addr_hash) DO NOTHING;

-- Show created properties
SELECT 
  id,
  address_line1,
  city,
  state,
  postal_code
FROM properties
WHERE (address_line1, city, state, postal_code) IN (
  SELECT DISTINCT property_address, property_city, property_state, property_zip
  FROM orders
  WHERE source = 'asana' AND property_id IS NULL
);

-- ==============================================
-- STEP 3: Link Orders to Properties
-- ==============================================

-- Link each order to its property using address matching
UPDATE orders o
SET property_id = p.id
FROM properties p
WHERE o.source = 'asana'
  AND o.property_id IS NULL
  AND p.org_id = o.created_by
  AND p.addr_hash = md5(
    LOWER(TRIM(o.property_address)) || '|' || 
    LOWER(TRIM(o.property_city)) || '|' || 
    UPPER(TRIM(o.property_state)) || '|' || 
    TRIM(o.property_zip)
  );

-- ==============================================
-- STEP 4: Verify All Orders Are Now Linked
-- ==============================================

-- Count should show 22 linked, 0 unlinked
SELECT 
  COUNT(*) as total_orders,
  COUNT(property_id) as linked_orders,
  COUNT(*) - COUNT(property_id) as unlinked_orders,
  ROUND(COUNT(property_id)::numeric / COUNT(*)::numeric * 100, 1) as link_rate_pct
FROM orders
WHERE source = 'asana';

-- Show the 6 orders that should now be linked
SELECT 
  o.order_number,
  o.property_address,
  o.property_city,
  o.property_state,
  o.property_zip,
  p.id as property_id,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Still unlinked'
  END as status
FROM orders o
LEFT JOIN properties p ON o.property_id = p.id
WHERE o.order_number IN (
  'ORD-1761341952272',
  'ORD-1761341955839',
  'ORD-1761341956200',
  'ORD-1761341960814',
  'ORD-1761438202377',
  'ORD-1761438202378'
)
ORDER BY o.order_number;

-- ==============================================
-- STEP 5: Final Property Count
-- ==============================================

-- Should now show 22 properties (matching 22 orders)
SELECT COUNT(*) as total_properties
FROM properties
WHERE org_id IN (SELECT DISTINCT created_by FROM orders WHERE source = 'asana');

-- Show property distribution by city
SELECT 
  city,
  COUNT(*) as property_count
FROM properties
WHERE org_id IN (SELECT DISTINCT created_by FROM orders WHERE source = 'asana')
GROUP BY city
ORDER BY property_count DESC;

-- ==============================================
-- EXPECTED RESULTS
-- ==============================================

-- After running this script:
-- Total Orders: 22
-- Linked Orders: 22 (was 16)
-- Unlinked Orders: 0 (was 6)
-- Link Rate: 100%
-- Total Properties: 22 (was 16)

