-- ==============================================
-- FIND MARCUS ELLINGTON'S ORDER AND REASSIGN IT
-- ==============================================

-- First, check if Marcus Ellington client exists
SELECT 
  id,
  company_name,
  client_type,
  email
FROM clients
WHERE company_name = 'Marcus Ellington';

-- Find all orders that mention Marcus Ellington in notes
-- (should be assigned to him, but currently assigned to someone else)
SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount,
  c.company_name as current_client,
  CASE 
    WHEN o.props->>'notes' ILIKE '%Marcus Ellington%' THEN '✅ Mentions Marcus'
    ELSE '❌ No mention'
  END as has_marcus_mention
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE o.source = 'asana'
  AND o.props->>'notes' ILIKE '%Marcus Ellington%';

-- ==============================================
-- REASSIGN TO MARCUS ELLINGTON
-- ==============================================

-- Reassign the order that mentions Marcus Ellington
UPDATE orders o
SET client_id = (SELECT id FROM clients WHERE company_name = 'Marcus Ellington' LIMIT 1)
FROM clients c
WHERE o.client_id = c.id
  AND o.source = 'asana'
  AND o.props->>'notes' ILIKE '%Marcus Ellington%'
  AND c.company_name != 'Marcus Ellington'; -- Don't update if already assigned

-- Show what was reassigned
SELECT 
  o.order_number,
  o.property_address,
  o.fee_amount,
  c.company_name as new_client
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE c.company_name = 'Marcus Ellington';

-- ==============================================
-- FINAL VERIFICATION
-- ==============================================

-- Should now show 8 clients with orders (including Marcus)
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

-- Verify total is still 20
SELECT COUNT(*) as total_orders
FROM orders
WHERE source = 'asana';

