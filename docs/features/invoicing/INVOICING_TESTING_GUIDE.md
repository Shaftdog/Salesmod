---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing System Testing Guide

Comprehensive testing scenarios and sample data for the invoicing system.

## Table of Contents
- [Test Data Setup](#test-data-setup)
- [Test Scenarios](#test-scenarios)
- [Automated Tests](#automated-tests)
- [Edge Cases](#edge-cases)
- [Performance Testing](#performance-testing)

## Test Data Setup

### Create Test Organization and Client

```sql
-- Insert test org (assuming you have a test user)
INSERT INTO profiles (id, name, email, role)
VALUES (
  'test-org-uuid-0000-0000-000000000001',
  'Test Organization',
  'test@example.com',
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- Create test client
INSERT INTO clients (
  id,
  org_id,
  company_name,
  primary_contact,
  email,
  phone,
  address,
  billing_address,
  payment_terms,
  is_active
)
VALUES (
  'test-client-uuid-0000-0000-000000000001',
  'test-org-uuid-0000-0000-000000000001',
  'ABC Mortgage Company',
  'John Smith',
  'john.smith@abcmortgage.com',
  '555-0100',
  '123 Business St, Miami, FL 33101',
  '123 Business St, Miami, FL 33101',
  30, -- NET-30
  true
) ON CONFLICT (id) DO NOTHING;

-- Create test orders
INSERT INTO orders (
  id,
  org_id,
  client_id,
  order_number,
  property_address,
  property_city,
  property_state,
  property_zip,
  property_type,
  order_type,
  status,
  fee_amount,
  total_amount,
  completed_date
)
VALUES
  (
    'test-order-uuid-0000-0000-000000000001',
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'ORD-001',
    '123 Main Street',
    'Miami',
    'FL',
    '33101',
    'Single Family',
    'Purchase',
    'completed',
    450.00,
    450.00,
    CURRENT_DATE - INTERVAL '5 days'
  ),
  (
    'test-order-uuid-0000-0000-000000000002',
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'ORD-002',
    '456 Oak Avenue',
    'Miami',
    'FL',
    '33102',
    'Condo',
    'Refinance',
    'completed',
    400.00,
    400.00,
    CURRENT_DATE - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;
```

### Initialize Invoice Number Sequence

```sql
INSERT INTO invoice_number_sequences (org_id, prefix, padding)
VALUES ('test-org-uuid-0000-0000-000000000001', 'INV-', 5)
ON CONFLICT (org_id) DO NOTHING;
```

## Test Scenarios

### Scenario 1: COD Invoice - Full Payment at Collection

**Business Case:** Appraiser collects cash payment upon delivering report.

```sql
-- Step 1: Create COD invoice
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    cod_collected_by,
    cod_collection_method,
    invoice_date,
    due_date,
    tax_rate
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'cod',
    'John Appraiser',
    'cash',
    CURRENT_DATE,
    CURRENT_DATE,
    0.07
  )
  RETURNING id, invoice_number
)
-- Step 2: Add line item
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price
)
SELECT
  id,
  'test-order-uuid-0000-0000-000000000001',
  'Residential Appraisal - 123 Main Street',
  1,
  450.00
FROM new_invoice
RETURNING *;

-- Step 3: Verify invoice totals
SELECT
  invoice_number,
  status,
  subtotal,
  tax_amount,
  total_amount,
  amount_due
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='draft', subtotal=450.00, tax_amount=31.50, total_amount=481.50

-- Step 4: Mark as sent (appraiser going to collect)
UPDATE invoices
SET status = 'sent',
    sent_at = NOW()
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'draft'
RETURNING invoice_number, status;

-- Step 5: Record payment upon collection
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number
)
SELECT
  id,
  org_id,
  total_amount,
  'cash',
  'RECEIPT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'sent'
ORDER BY created_at DESC
LIMIT 1
RETURNING *;

-- Step 6: Update COD fields
UPDATE invoices
SET cod_collected_at = NOW(),
    cod_receipt_number = 'RECEIPT-20251116-143000',
    cod_notes = 'Payment collected at property delivery'
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'paid' -- Status auto-updated by payment trigger
ORDER BY created_at DESC
LIMIT 1;

-- Step 7: Verify final state
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  amount_due,
  cod_collected_at IS NOT NULL AS collected,
  paid_at IS NOT NULL AS paid
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='paid', amount_paid=481.50, amount_due=0.00, collected=true, paid=true
```

### Scenario 2: Stripe Payment Link - Single Payment

**Business Case:** Send Stripe invoice link to client, they pay online.

```sql
-- Step 1: Create invoice with Stripe method
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    stripe_customer_id,
    invoice_date,
    due_date,
    tax_rate
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'stripe_link',
    'cus_test123456', -- Mock Stripe customer ID
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '15 days',
    0.07
  )
  RETURNING id, invoice_number
)
-- Step 2: Add line item
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price
)
SELECT
  id,
  'test-order-uuid-0000-0000-000000000002',
  'Residential Appraisal - 456 Oak Avenue',
  1,
  400.00
FROM new_invoice
RETURNING *;

-- Step 3: Simulate Stripe invoice creation (this would be done by API)
UPDATE invoices
SET stripe_invoice_id = 'in_test_' || gen_random_uuid()::text,
    stripe_payment_link_url = 'https://invoice.stripe.com/test/inv_test123',
    status = 'sent',
    sent_at = NOW()
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'stripe_link'
  AND status = 'draft'
ORDER BY created_at DESC
LIMIT 1
RETURNING invoice_number, stripe_payment_link_url;

-- Step 4: Simulate client viewing invoice
UPDATE invoices
SET status = 'viewed',
    viewed_at = NOW()
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'sent'
ORDER BY created_at DESC
LIMIT 1;

-- Step 5: Simulate Stripe webhook - payment succeeded
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  stripe_payment_intent_id,
  reference_number
)
SELECT
  id,
  org_id,
  total_amount,
  'stripe',
  'pi_test_' || gen_random_uuid()::text,
  'STRIPE-' || invoice_number
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'stripe_link'
  AND status = 'viewed'
ORDER BY created_at DESC
LIMIT 1
RETURNING *;

-- Step 6: Verify final state
SELECT
  invoice_number,
  status,
  payment_method,
  total_amount,
  amount_paid,
  stripe_invoice_id IS NOT NULL AS has_stripe_invoice,
  paid_at IS NOT NULL AS is_paid
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'stripe_link'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='paid', amount_paid=428.00, has_stripe_invoice=true, is_paid=true
```

### Scenario 3: Net Terms Invoice - Partial Payments

**Business Case:** NET-30 invoice, client makes partial payments.

```sql
-- Step 1: Create NET-30 invoice with multiple orders
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    invoice_date,
    due_date,
    tax_rate,
    notes
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'net_terms',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.07,
    'Payment due NET-30'
  )
  RETURNING id
)
-- Step 2: Add multiple line items
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price,
  line_order
)
SELECT id, 'test-order-uuid-0000-0000-000000000001', 'Appraisal - 123 Main Street', 1, 450.00, 1 FROM new_invoice
UNION ALL
SELECT id, 'test-order-uuid-0000-0000-000000000002', 'Appraisal - 456 Oak Avenue', 1, 400.00, 2 FROM new_invoice
UNION ALL
SELECT id, NULL, 'Rush Fee', 1, 100.00, 3 FROM new_invoice;

-- Step 3: Mark as sent
UPDATE invoices
SET status = 'sent',
    sent_at = NOW()
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
  AND status = 'draft'
ORDER BY created_at DESC
LIMIT 1;

-- Step 4: Verify invoice totals
SELECT
  invoice_number,
  status,
  subtotal,
  tax_amount,
  total_amount,
  amount_due,
  due_date
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: subtotal=950.00, tax_amount=66.50, total_amount=1016.50

-- Step 5: Record first partial payment (half)
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number,
  notes
)
SELECT
  id,
  org_id,
  500.00,
  'check',
  'CHECK-12345',
  'Partial payment - check received'
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
  AND status = 'sent'
ORDER BY created_at DESC
LIMIT 1
RETURNING *;

-- Step 6: Verify partial payment status
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  amount_due,
  first_payment_at IS NOT NULL AS has_payment
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='partially_paid', amount_paid=500.00, amount_due=516.50

-- Step 7: Record second partial payment
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number,
  notes
)
SELECT
  id,
  org_id,
  300.00,
  'check',
  'CHECK-12346',
  'Second partial payment'
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
  AND status = 'partially_paid'
ORDER BY created_at DESC
LIMIT 1;

-- Step 8: Verify still partially paid
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  amount_due
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='partially_paid', amount_paid=800.00, amount_due=216.50

-- Step 9: Record final payment
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number,
  notes
)
SELECT
  id,
  org_id,
  amount_due,
  'ach',
  'ACH-20251116',
  'Final payment via ACH'
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
  AND status = 'partially_paid'
ORDER BY created_at DESC
LIMIT 1;

-- Step 10: Verify fully paid
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  amount_due,
  paid_at IS NOT NULL AS is_paid
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND payment_method = 'net_terms'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='paid', amount_paid=1016.50, amount_due=0.00, is_paid=true
```

### Scenario 4: Overdue Invoice Handling

**Business Case:** Invoice becomes overdue, then paid late.

```sql
-- Step 1: Create NET-30 invoice with past due date
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    invoice_date,
    due_date,
    tax_rate,
    status,
    sent_at
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'net_terms',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '15 days', -- 15 days overdue
    0.07,
    'sent',
    CURRENT_DATE - INTERVAL '45 days'
  )
  RETURNING id
)
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
SELECT id, 'Past due invoice test', 1, 500.00 FROM new_invoice;

-- Step 2: Mark as overdue (normally done by scheduled job)
UPDATE invoices
SET status = 'overdue'
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'sent'
  AND due_date < CURRENT_DATE
  AND amount_due > 0;

-- Step 3: Verify overdue status
SELECT
  invoice_number,
  status,
  due_date,
  CURRENT_DATE - due_date AS days_overdue,
  total_amount,
  amount_due
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'overdue'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status='overdue', days_overdue=15

-- Step 4: Record late payment
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number,
  notes
)
SELECT
  id,
  org_id,
  total_amount,
  'check',
  'CHECK-LATE-001',
  'Late payment received - 15 days past due'
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND status = 'overdue'
ORDER BY created_at DESC
LIMIT 1;

-- Step 5: Verify paid (should auto-update from overdue to paid)
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  paid_at IS NOT NULL AS is_paid,
  paid_at::DATE - due_date AS days_late
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND invoice_number = (
    SELECT invoice_number FROM invoices
    WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
    ORDER BY created_at DESC
    LIMIT 1
  );
-- Expected: status='paid', amount_paid=535.00, is_paid=true, days_late=15
```

### Scenario 5: Invoice with Discount

**Business Case:** Apply volume discount to multi-order invoice.

```sql
-- Step 1: Create invoice
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    invoice_date,
    due_date,
    tax_rate,
    discount_amount,
    notes
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'net_terms',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.07,
    50.00,
    'Volume discount applied - 10% off for 5+ orders'
  )
  RETURNING id
)
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_order)
SELECT id, 'Order #1', 1, 100.00, 1 FROM new_invoice
UNION ALL SELECT id, 'Order #2', 1, 100.00, 2 FROM new_invoice
UNION ALL SELECT id, 'Order #3', 1, 100.00, 3 FROM new_invoice
UNION ALL SELECT id, 'Order #4', 1, 100.00, 4 FROM new_invoice
UNION ALL SELECT id, 'Order #5', 1, 100.00, 5 FROM new_invoice;

-- Step 2: Verify discount calculation
SELECT
  invoice_number,
  subtotal,
  discount_amount,
  subtotal - discount_amount AS after_discount,
  tax_rate,
  tax_amount,
  total_amount
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: subtotal=500.00, discount=50.00, after_discount=450.00, tax=31.50, total=481.50
```

## Automated Tests

### Trigger Test: Auto-Calculate Line Item Amount

```sql
-- Test that line item amount is auto-calculated
DO $$
DECLARE
  v_invoice_id UUID;
  v_line_item_amount DECIMAL;
BEGIN
  -- Create test invoice
  INSERT INTO invoices (org_id, client_id, payment_method)
  VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms')
  RETURNING id INTO v_invoice_id;

  -- Insert line item with quantity and unit price
  INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
  VALUES (v_invoice_id, 'Test item', 3, 100.00);

  -- Verify amount was calculated
  SELECT amount INTO v_line_item_amount
  FROM invoice_line_items
  WHERE invoice_id = v_invoice_id;

  ASSERT v_line_item_amount = 300.00, 'Line item amount should be 300.00 (3 * 100.00)';

  -- Cleanup
  DELETE FROM invoices WHERE id = v_invoice_id;

  RAISE NOTICE 'TEST PASSED: Auto-calculate line item amount';
END $$;
```

### Trigger Test: Auto-Update Invoice Status on Payment

```sql
-- Test that invoice status updates when payment is added
DO $$
DECLARE
  v_invoice_id UUID;
  v_invoice_status invoice_status_type;
  v_total_amount DECIMAL;
BEGIN
  -- Create and send invoice
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    status,
    sent_at
  )
  VALUES (
    'test-org-uuid-0000-0000-000000000001',
    'test-client-uuid-0000-0000-000000000001',
    'net_terms',
    'sent',
    NOW()
  )
  RETURNING id, total_amount INTO v_invoice_id, v_total_amount;

  -- Add line item
  INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
  VALUES (v_invoice_id, 'Test', 1, 1000.00);

  -- Get updated total
  SELECT total_amount INTO v_total_amount FROM invoices WHERE id = v_invoice_id;

  -- Add full payment
  INSERT INTO payments (invoice_id, org_id, amount, payment_method)
  VALUES (v_invoice_id, 'test-org-uuid-0000-0000-000000000001', v_total_amount, 'check');

  -- Verify status changed to paid
  SELECT status INTO v_invoice_status FROM invoices WHERE id = v_invoice_id;

  ASSERT v_invoice_status = 'paid', 'Invoice status should be paid after full payment';

  -- Cleanup
  DELETE FROM invoices WHERE id = v_invoice_id;

  RAISE NOTICE 'TEST PASSED: Auto-update invoice status on payment';
END $$;
```

### Function Test: Generate Invoice Number

```sql
-- Test invoice number generation
DO $$
DECLARE
  v_org_id UUID := 'test-org-uuid-0000-0000-000000000001';
  v_invoice_num1 TEXT;
  v_invoice_num2 TEXT;
BEGIN
  -- Ensure sequence exists
  INSERT INTO invoice_number_sequences (org_id, prefix, padding)
  VALUES (v_org_id, 'TEST-', 3)
  ON CONFLICT (org_id) DO UPDATE SET prefix = 'TEST-', padding = 3;

  -- Reset sequence
  UPDATE invoice_number_sequences SET last_invoice_number = 0 WHERE org_id = v_org_id;

  -- Generate first number
  v_invoice_num1 := generate_invoice_number(v_org_id);
  ASSERT v_invoice_num1 = 'TEST-001', 'First invoice should be TEST-001, got: ' || v_invoice_num1;

  -- Generate second number
  v_invoice_num2 := generate_invoice_number(v_org_id);
  ASSERT v_invoice_num2 = 'TEST-002', 'Second invoice should be TEST-002, got: ' || v_invoice_num2;

  RAISE NOTICE 'TEST PASSED: Generate invoice number';
END $$;
```

## Edge Cases

### Edge Case 1: Overpayment

```sql
-- Test what happens if payment exceeds total
INSERT INTO invoices (org_id, client_id, payment_method, status)
VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms', 'sent')
RETURNING id;

-- Add line item: $100 invoice
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
SELECT id, 'Test', 1, 100.00 FROM invoices ORDER BY created_at DESC LIMIT 1;

-- Try to pay $150 (overpayment)
INSERT INTO payments (invoice_id, org_id, amount, payment_method)
SELECT id, org_id, 150.00, 'check' FROM invoices ORDER BY created_at DESC LIMIT 1;

-- Check result
SELECT invoice_number, total_amount, amount_paid, amount_due, status
FROM invoices ORDER BY created_at DESC LIMIT 1;
-- amount_due will be negative - application should handle this
```

### Edge Case 2: Delete Payment (Should Update Invoice)

```sql
-- Create invoice and payment
WITH inv AS (
  INSERT INTO invoices (org_id, client_id, payment_method, status)
  VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms', 'sent')
  RETURNING id, org_id
),
line AS (
  INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
  SELECT id, 'Test', 1, 100.00 FROM inv
),
pmt AS (
  INSERT INTO payments (invoice_id, org_id, amount, payment_method)
  SELECT id, org_id, 100.00, 'check' FROM inv
  RETURNING id, invoice_id
)
SELECT * FROM pmt;

-- Verify paid
SELECT status, amount_paid FROM invoices ORDER BY created_at DESC LIMIT 1;
-- Should be: status='paid', amount_paid=100.00

-- Delete payment
DELETE FROM payments WHERE id = (SELECT id FROM payments ORDER BY created_at DESC LIMIT 1);

-- Verify status reverted
SELECT status, amount_paid, amount_due FROM invoices ORDER BY created_at DESC LIMIT 1;
-- Should be: status='sent', amount_paid=0.00, amount_due=100.00
```

### Edge Case 3: Concurrent Invoice Number Generation

This tests that invoice numbers remain sequential even with concurrent inserts.

```sql
-- This would need to be run from multiple sessions simultaneously
-- Session 1:
INSERT INTO invoices (org_id, client_id, payment_method)
VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms');

-- Session 2 (run at same time):
INSERT INTO invoices (org_id, client_id, payment_method)
VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms');

-- Both sessions should get unique, sequential invoice numbers
-- No duplicates should occur due to row-level locking in generate_invoice_number()
```

## Performance Testing

### Test 1: Large Invoice with Many Line Items

```sql
-- Create invoice with 100 line items
WITH new_invoice AS (
  INSERT INTO invoices (org_id, client_id, payment_method)
  VALUES ('test-org-uuid-0000-0000-000000000001', 'test-client-uuid-0000-0000-000000000001', 'net_terms')
  RETURNING id
)
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_order)
SELECT
  id,
  'Line item ' || num,
  1,
  RANDOM() * 1000,
  num
FROM new_invoice
CROSS JOIN generate_series(1, 100) AS num;

-- Verify calculation performance
EXPLAIN ANALYZE
SELECT calculate_invoice_totals(id)
FROM invoices
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2: Aging Report Performance

```sql
-- Create 1000 test invoices with various ages
INSERT INTO invoices (org_id, client_id, payment_method, status, invoice_date, due_date, sent_at)
SELECT
  'test-org-uuid-0000-0000-000000000001',
  'test-client-uuid-0000-0000-000000000001',
  'net_terms',
  'sent',
  CURRENT_DATE - (RANDOM() * 365)::INTEGER * INTERVAL '1 day',
  CURRENT_DATE - (RANDOM() * 365)::INTEGER * INTERVAL '1 day',
  NOW()
FROM generate_series(1, 1000);

-- Add line items
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price)
SELECT id, 'Bulk test item', 1, 500.00
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001';

-- Test aging report performance
EXPLAIN ANALYZE
SELECT * FROM invoice_aging_report
WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
-- Should complete in < 100ms even with 1000 invoices
```

### Test 3: Payment History Query Performance

```sql
-- Add payments to test invoices
INSERT INTO payments (invoice_id, org_id, amount, payment_method, payment_date)
SELECT
  id,
  org_id,
  RANDOM() * 500,
  'check',
  CURRENT_DATE - (RANDOM() * 90)::INTEGER * INTERVAL '1 day'
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
  AND RANDOM() > 0.5; -- 50% of invoices get payments

-- Test client payment history performance
EXPLAIN ANALYZE
SELECT * FROM client_payment_history
WHERE client_id = 'test-client-uuid-0000-0000-000000000001';
```

## Cleanup Test Data

```sql
-- Remove all test data
DELETE FROM payments WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
DELETE FROM invoice_line_items WHERE invoice_id IN (
  SELECT id FROM invoices WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
);
DELETE FROM invoices WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
DELETE FROM invoice_number_sequences WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
DELETE FROM orders WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
DELETE FROM clients WHERE org_id = 'test-org-uuid-0000-0000-000000000001';
-- Don't delete profile if it's a real user

-- Verify cleanup
SELECT
  'invoices' AS table_name,
  COUNT(*) AS count
FROM invoices
WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
UNION ALL
SELECT 'payments', COUNT(*) FROM payments WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
UNION ALL
SELECT 'line_items', COUNT(*) FROM invoice_line_items WHERE invoice_id IN (
  SELECT id FROM invoices WHERE org_id = 'test-org-uuid-0000-0000-000000000001'
);
-- All counts should be 0
```

## Test Checklist

- [ ] Invoice number auto-generation works
- [ ] Line item amounts auto-calculate
- [ ] Invoice totals auto-calculate from line items
- [ ] Tax calculation is correct
- [ ] Discount application works
- [ ] Payment triggers status updates
- [ ] Partial payments work correctly
- [ ] Overpayment handling
- [ ] COD workflow complete
- [ ] Stripe workflow complete
- [ ] Net Terms workflow complete
- [ ] Overdue detection works
- [ ] Aging reports accurate
- [ ] Revenue recognition correct
- [ ] Client payment history accurate
- [ ] RLS policies prevent cross-org access
- [ ] Triggers fire correctly
- [ ] Views return correct data
- [ ] Performance is acceptable (< 100ms for reports)
- [ ] Concurrent invoice creation works
- [ ] Delete payment updates invoice correctly

---

**Last Updated:** 2025-11-16
**Related Documentation:**
- [Invoicing System Design](/home/user/Salesmod/docs/features/invoicing/INVOICING_SYSTEM_DESIGN.md)
- [SQL Reference](/home/user/Salesmod/docs/features/invoicing/INVOICING_SQL_REFERENCE.md)
- [Migration File](/home/user/Salesmod/supabase/migrations/20251116120000_create_invoicing_system.sql)
