-- ==============================================
-- FIX ORDER STATUS BASED ON COMPLETION DATES
-- Sets status='completed' for orders with completed_date
-- ==============================================

-- Show current status before fix
SELECT 
  status,
  COUNT(*) as order_count,
  COUNT(completed_date) as have_completed_date
FROM orders
WHERE source = 'asana'
GROUP BY status;

-- ==============================================
-- FIX EXISTING ORDERS
-- ==============================================

-- Update orders with completed_date to status='completed'
UPDATE orders
SET status = 'completed'
WHERE source = 'asana'
  AND completed_date IS NOT NULL
  AND status != 'completed';

-- Show what was updated
SELECT 
  order_number,
  property_address,
  status,
  ordered_date::date as ordered,
  completed_date::date as completed,
  EXTRACT(DAY FROM (completed_date - ordered_date)) as days_to_complete
FROM orders
WHERE source = 'asana'
  AND completed_date IS NOT NULL
ORDER BY completed_date DESC;

-- ==============================================
-- VERIFY RESULTS
-- ==============================================

-- Should now show proper status distribution
SELECT 
  status,
  COUNT(*) as order_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_date - ordered_date))/86400), 1) as avg_days_to_complete
FROM orders
WHERE source = 'asana'
GROUP BY status
ORDER BY order_count DESC;

-- Check for any inconsistencies
SELECT 
  order_number,
  status,
  completed_date,
  'Should be completed' as issue
FROM orders
WHERE source = 'asana'
  AND completed_date IS NOT NULL
  AND status != 'completed';

-- ==============================================
-- EXPECTED RESULTS
-- ==============================================

-- Most October orders should be 'completed' (they're from the past)
-- Only recent orders should be 'new' or 'assigned'
-- No orders should have completed_date but status='new'

