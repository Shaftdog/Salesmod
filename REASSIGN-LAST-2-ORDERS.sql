-- ==============================================
-- REASSIGN LAST 2 UNASSIGNED ORDERS
-- Manual assignment by order number
-- ==============================================

-- Let's first check what client names are in the notes for these 2 orders
SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount,
  SUBSTRING(o.props->>'notes', 
    POSITION('Client is not an AMC please put the Name Below' IN o.props->>'notes'), 
    200
  ) as client_section
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE c.company_name = '[Unassigned Orders]'
  AND o.source = 'asana'
  AND o.order_number IN ('ORD-1761341959454', 'ORD-1761341960814');

-- ==============================================
-- REASSIGN BY ORDER NUMBER (Safest approach)
-- ==============================================

-- Reassign ORD-1761341959454 (205 E Magnolia St, Davenport) → Yunior Castroy
UPDATE orders
SET client_id = (SELECT id FROM clients WHERE company_name = 'Yunior Castroy' LIMIT 1)
WHERE order_number = 'ORD-1761341959454';

-- Reassign ORD-1761341960814 (1974 IBIS BAY COURT, Ocoee) → ThinkLattice LLC
UPDATE orders
SET client_id = (SELECT id FROM clients WHERE company_name = 'ThinkLattice LLC' LIMIT 1)
WHERE order_number = 'ORD-1761341960814';

-- ==============================================
-- VERIFY - Should return 0 rows (no unassigned left)
-- ==============================================

SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE c.company_name = '[Unassigned Orders]'
  AND o.source = 'asana';

-- ==============================================
-- FINAL VERIFICATION - All 20 orders assigned
-- ==============================================

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

-- ==============================================
-- EXPECTED FINAL RESULTS
-- ==============================================

-- You should see:
-- i Fund Cities LLC (company) - 6 orders - $3,300
-- Applied Valuation Services Inc (company) - 5 orders - $1,500
-- Allstate Appraisal (company) - 3 orders
-- Consolidated Analytics (company) - 2 orders
-- Marcus Ellington (individual) - 1 order - $450
-- Yunior Castroy (individual) - 1 order - $450
-- ThinkLattice LLC (company) - 1 order - $345
-- Property Rate (company) - 1 order
--
-- TOTAL: 8 clients, 20 orders, ~$9,000 revenue
-- [Unassigned Orders]: 0 orders ✅

