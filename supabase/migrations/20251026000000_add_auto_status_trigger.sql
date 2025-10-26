-- ==============================================
-- AUTO-SET ORDER STATUS FROM DATES
-- Trigger to automatically set status='completed' when completed_date is set
-- ==============================================

-- Create trigger function
CREATE OR REPLACE FUNCTION auto_set_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_date is set and status isn't 'completed', auto-update it
  IF NEW.completed_date IS NOT NULL AND NEW.status != 'completed' THEN
    NEW.status = 'completed';
    RAISE NOTICE 'Auto-set status to completed for order % (completed_date: %)', NEW.order_number, NEW.completed_date;
  END IF;
  
  -- If completed_date is NULL and status is 'completed', that's inconsistent
  -- Reset to appropriate status based on other dates
  IF NEW.completed_date IS NULL AND NEW.status = 'completed' THEN
    -- Revert to previous status or 'in_progress' if we have assignment
    IF NEW.assigned_to IS NOT NULL THEN
      NEW.status = 'in_progress';
      RAISE NOTICE 'Reset status from completed to in_progress for order % (no completed_date)', NEW.order_number;
    ELSE
      NEW.status = 'assigned';
      RAISE NOTICE 'Reset status from completed to assigned for order % (no completed_date)', NEW.order_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER trigger_auto_set_order_status
  BEFORE INSERT OR UPDATE OF completed_date, status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_order_status();

-- Add documentation
COMMENT ON FUNCTION auto_set_order_status IS 
  'Automatically sets order status to completed when completed_date is populated. 
   Prevents inconsistent states where an order has a completion date but status is not completed.
   Also prevents status=completed when completed_date is NULL.';

COMMENT ON TRIGGER trigger_auto_set_order_status ON public.orders IS
  'Enforces business rule: completed_date requires status=completed and vice versa.';

-- ==============================================
-- TEST THE TRIGGER
-- ==============================================

-- This should auto-set status to 'completed' even though we specify 'new'
INSERT INTO orders (
  order_number,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  borrower_name,
  client_id,
  fee_amount,
  total_amount,
  status,
  priority,
  order_type,
  ordered_date,
  due_date,
  completed_date,  -- Has completion date!
  created_by,
  org_id,
  source
) VALUES (
  'TEST-TRIGGER-' || (EXTRACT(EPOCH FROM NOW())::bigint),
  '123 Test St',
  'Orlando',
  'FL',
  '32801',
  'single_family',
  'Test Borrower',
  (SELECT id FROM clients LIMIT 1),
  100,
  100,
  'new',  -- We're setting it to 'new'
  'normal',
  'other',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '5 days',
  NOW() - INTERVAL '1 day',  -- But it has a completion date!
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'test'
);

-- Verify trigger worked - status should be 'completed' not 'new'
SELECT 
  order_number,
  status,
  completed_date,
  CASE 
    WHEN status = 'completed' THEN '✅ Trigger worked!'
    ELSE '❌ Trigger failed'
  END as test_result
FROM orders
WHERE order_number LIKE 'TEST-TRIGGER-%'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test order
DELETE FROM orders WHERE order_number LIKE 'TEST-TRIGGER-%';

-- ==============================================
-- EXPECTED BEHAVIOR
-- ==============================================

-- Going forward:
-- 1. INSERT order with completed_date → status auto-set to 'completed'
-- 2. UPDATE order, set completed_date → status auto-set to 'completed'
-- 3. UPDATE order, clear completed_date → status reverted to 'in_progress' or 'assigned'
-- 4. Cannot have completed_date with status != 'completed'
-- 5. Cannot have status = 'completed' with NULL completed_date

