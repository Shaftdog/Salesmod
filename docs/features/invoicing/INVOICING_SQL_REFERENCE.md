---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing System SQL Quick Reference

Common SQL queries and operations for the invoicing system.

## Table of Contents
- [Create Operations](#create-operations)
- [Read Operations](#read-operations)
- [Update Operations](#update-operations)
- [Reports](#reports)
- [Maintenance](#maintenance)

## Create Operations

### Create Invoice with Auto-Generated Number

```sql
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  invoice_date,
  due_date,
  tax_rate
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000', -- org_id
  '123e4567-e89b-12d3-a456-426614174001', -- client_id
  'net_terms',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  0.07 -- 7% tax rate
)
RETURNING id, invoice_number;
```

### Add Line Items to Invoice

```sql
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price,
  line_order
)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174002', -- invoice_id
    '123e4567-e89b-12d3-a456-426614174003', -- order_id
    'Residential Appraisal - 123 Main St',
    1,
    450.00,
    1
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    '123e4567-e89b-12d3-a456-426614174004',
    'Residential Appraisal - 456 Oak Ave',
    1,
    450.00,
    2
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    NULL, -- Custom line item (no order)
    'Rush Fee',
    1,
    100.00,
    3
  );
-- Totals automatically calculated!
```

### Record Payment

```sql
INSERT INTO payments (
  invoice_id,
  org_id,
  payment_date,
  amount,
  payment_method,
  reference_number,
  notes
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174002',
  '123e4567-e89b-12d3-a456-426614174000',
  CURRENT_DATE,
  500.00,
  'check',
  'CHECK-12345',
  'Payment received via mail'
)
RETURNING id;
-- Invoice status automatically updated!
```

### Create Multi-Order Invoice

```sql
-- Step 1: Create invoice
WITH new_invoice AS (
  INSERT INTO invoices (
    org_id,
    client_id,
    payment_method,
    invoice_date,
    due_date,
    tax_rate
  )
  VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    'net_terms',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.07
  )
  RETURNING id, org_id
)
-- Step 2: Add all completed orders for this client
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price,
  line_order
)
SELECT
  new_invoice.id,
  o.id,
  'Appraisal - ' || o.property_address,
  1,
  o.fee_amount,
  ROW_NUMBER() OVER (ORDER BY o.completed_date)
FROM orders o
CROSS JOIN new_invoice
WHERE o.client_id = '123e4567-e89b-12d3-a456-426614174001'
  AND o.status = 'completed'
  AND o.id NOT IN (
    -- Exclude already invoiced orders
    SELECT order_id
    FROM invoice_line_items
    WHERE order_id IS NOT NULL
  );
```

### Create COD Invoice

```sql
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  cod_collected_by,
  cod_collection_method,
  invoice_date,
  due_date
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  'cod',
  'John Smith',
  'cash',
  CURRENT_DATE,
  CURRENT_DATE -- COD invoices due immediately
)
RETURNING id, invoice_number;
```

### Create Stripe Invoice

```sql
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  stripe_customer_id,
  invoice_date,
  due_date
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174001',
  'stripe_link',
  'cus_stripe123456',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '15 days'
)
RETURNING id, invoice_number;
```

## Read Operations

### Get Invoice with Full Details

```sql
SELECT
  i.*,
  c.company_name AS client_name,
  c.email AS client_email,
  c.payment_terms,
  json_agg(
    json_build_object(
      'id', li.id,
      'order_id', li.order_id,
      'description', li.description,
      'quantity', li.quantity,
      'unit_price', li.unit_price,
      'amount', li.amount,
      'line_order', li.line_order
    ) ORDER BY li.line_order
  ) AS line_items,
  COALESCE(
    json_agg(
      json_build_object(
        'id', p.id,
        'payment_date', p.payment_date,
        'amount', p.amount,
        'payment_method', p.payment_method,
        'reference_number', p.reference_number
      ) ORDER BY p.payment_date
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) AS payments
FROM invoices i
JOIN clients c ON i.client_id = c.id
LEFT JOIN invoice_line_items li ON i.id = li.invoice_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.id = '123e4567-e89b-12d3-a456-426614174002'
GROUP BY i.id, c.company_name, c.email, c.payment_terms;
```

### List All Invoices for Organization

```sql
SELECT
  i.id,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.status,
  i.payment_method,
  i.total_amount,
  i.amount_paid,
  i.amount_due,
  c.company_name AS client_name,
  CASE
    WHEN i.status IN ('sent', 'viewed', 'partially_paid', 'overdue')
      AND i.due_date < CURRENT_DATE
    THEN CURRENT_DATE - i.due_date
    ELSE 0
  END AS days_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.org_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY i.invoice_date DESC;
```

### Find Uninvoiced Completed Orders

```sql
SELECT
  o.id,
  o.order_number,
  o.property_address,
  o.completed_date,
  o.fee_amount,
  c.company_name AS client_name
FROM orders o
JOIN clients c ON o.client_id = c.id
WHERE o.org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND o.status = 'completed'
  AND o.id NOT IN (
    SELECT order_id
    FROM invoice_line_items
    WHERE order_id IS NOT NULL
  )
ORDER BY o.completed_date DESC;
```

### Get Outstanding Invoices

```sql
SELECT * FROM outstanding_invoices
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY days_overdue DESC, total_amount DESC;
```

### Search Invoices

```sql
SELECT
  i.id,
  i.invoice_number,
  i.invoice_date,
  i.status,
  i.total_amount,
  c.company_name
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND (
    i.invoice_number ILIKE '%12345%'
    OR c.company_name ILIKE '%smith%'
    OR i.notes ILIKE '%rush%'
  )
ORDER BY i.invoice_date DESC;
```

## Update Operations

### Update Invoice Status

```sql
-- Mark invoice as sent
UPDATE invoices
SET status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002'
  AND status = 'draft';

-- Mark invoice as cancelled
UPDATE invoices
SET status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002'
  AND status = 'draft';

-- Mark invoice as void
UPDATE invoices
SET status = 'void',
    voided_at = NOW(),
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002';
```

### Update Stripe Details After Creating Stripe Invoice

```sql
UPDATE invoices
SET stripe_invoice_id = 'in_stripe123456',
    stripe_payment_link_url = 'https://invoice.stripe.com/i/acct_xxx/test_xxx',
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002';
```

### Record COD Collection

```sql
UPDATE invoices
SET cod_collected_at = NOW(),
    cod_receipt_number = 'RECEIPT-12345',
    cod_notes = 'Collected at property',
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002'
  AND payment_method = 'cod';

-- Also record as payment
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
  cod_receipt_number
FROM invoices
WHERE id = '123e4567-e89b-12d3-a456-426614174002';
-- Status automatically updates to 'paid'!
```

### Apply Discount to Invoice

```sql
UPDATE invoices
SET discount_amount = 50.00,
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174002';
-- Totals automatically recalculated!
```

### Mark Payment as Reconciled

```sql
UPDATE payments
SET is_reconciled = true,
    reconciled_at = NOW(),
    reconciled_by = '123e4567-e89b-12d3-a456-426614174000',
    updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174005';
```

### Bulk Update Overdue Invoices

```sql
-- Run this daily or on-demand to mark overdue invoices
UPDATE invoices
SET status = 'overdue',
    updated_at = NOW()
WHERE status IN ('sent', 'viewed', 'partially_paid')
  AND due_date < CURRENT_DATE
  AND amount_due > 0;
```

## Reports

### Aging Report by Client

```sql
SELECT
  client_name,
  client_email,
  payment_terms,
  total_outstanding_invoices,
  total_outstanding_amount,
  current_amount,
  aged_1_30,
  aged_31_60,
  aged_61_90,
  aged_90_plus
FROM invoice_aging_report
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND total_outstanding_amount > 0
ORDER BY aged_90_plus DESC, total_outstanding_amount DESC;
```

### Revenue by Month

```sql
SELECT
  DATE_TRUNC('month', invoice_date) AS month,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_invoiced,
  SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) AS paid_amount,
  SUM(amount_due) AS outstanding_amount,
  ROUND(
    SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END)::NUMERIC /
    NULLIF(SUM(total_amount), 0) * 100,
    2
  ) AS collection_rate_pct
FROM invoices
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND invoice_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;
```

### Revenue by Payment Method

```sql
SELECT
  payment_method,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_amount,
  SUM(amount_paid) AS amount_paid,
  SUM(amount_due) AS amount_due,
  ROUND(
    AVG(CASE WHEN status = 'paid' THEN paid_at::DATE - invoice_date END),
    1
  ) AS avg_days_to_payment
FROM invoices
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status NOT IN ('draft', 'cancelled', 'void')
GROUP BY payment_method
ORDER BY total_amount DESC;
```

### Client Payment Performance

```sql
SELECT
  company_name,
  payment_terms,
  total_invoices,
  paid_invoices,
  outstanding_invoices,
  total_outstanding,
  avg_days_to_pay,
  avg_days_to_pay - payment_terms AS avg_days_late,
  overdue_count,
  CASE
    WHEN avg_days_to_pay IS NULL THEN 'No history'
    WHEN avg_days_to_pay <= payment_terms THEN 'On time'
    WHEN avg_days_to_pay <= payment_terms + 7 THEN 'Slightly late'
    WHEN avg_days_to_pay <= payment_terms + 30 THEN 'Frequently late'
    ELSE 'Very late'
  END AS payment_rating
FROM client_payment_history
WHERE total_invoices > 0
ORDER BY (avg_days_to_pay - payment_terms) DESC NULLS LAST;
```

### Top Clients by Revenue

```sql
SELECT
  c.company_name,
  COUNT(i.id) AS invoice_count,
  SUM(i.total_amount) AS total_invoiced,
  SUM(i.amount_paid) AS total_paid,
  SUM(i.amount_due) AS total_outstanding,
  MAX(i.invoice_date) AS last_invoice_date
FROM clients c
JOIN invoices i ON c.id = i.client_id
WHERE i.org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND i.status NOT IN ('draft', 'cancelled', 'void')
GROUP BY c.id, c.company_name
ORDER BY total_invoiced DESC
LIMIT 20;
```

### Unpaid Invoices Summary

```sql
SELECT
  status,
  COUNT(*) AS count,
  SUM(total_amount) AS total_amount,
  SUM(amount_due) AS amount_due,
  MIN(due_date) AS oldest_due_date,
  MAX(due_date) AS newest_due_date
FROM invoices
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status IN ('sent', 'viewed', 'partially_paid', 'overdue')
  AND amount_due > 0
GROUP BY status
ORDER BY
  CASE status
    WHEN 'overdue' THEN 1
    WHEN 'partially_paid' THEN 2
    WHEN 'viewed' THEN 3
    WHEN 'sent' THEN 4
  END;
```

### Cash Flow Projection

```sql
WITH expected_payments AS (
  SELECT
    due_date,
    SUM(amount_due) AS expected_amount
  FROM invoices
  WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
    AND status IN ('sent', 'viewed', 'partially_paid', 'overdue')
    AND amount_due > 0
  GROUP BY due_date
),
date_series AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    INTERVAL '1 day'
  )::DATE AS date
)
SELECT
  ds.date,
  COALESCE(ep.expected_amount, 0) AS expected_amount,
  SUM(COALESCE(ep.expected_amount, 0)) OVER (
    ORDER BY ds.date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_expected
FROM date_series ds
LEFT JOIN expected_payments ep ON ds.date = ep.due_date
WHERE COALESCE(ep.expected_amount, 0) > 0
ORDER BY ds.date;
```

## Maintenance

### Recalculate Invoice Totals

```sql
-- Recalculate specific invoice
SELECT calculate_invoice_totals('123e4567-e89b-12d3-a456-426614174002');

-- Recalculate all invoices (use sparingly)
SELECT calculate_invoice_totals(id)
FROM invoices
WHERE status = 'draft';
```

### Update Invoice Payment Statuses

```sql
-- Update specific invoice
SELECT update_invoice_payment_status('123e4567-e89b-12d3-a456-426614174002');

-- Update all invoices (use sparingly)
SELECT update_invoice_payment_status(id)
FROM invoices
WHERE status NOT IN ('draft', 'cancelled', 'void');
```

### Generate Invoice Number Preview

```sql
-- See what the next invoice number will be
SELECT generate_invoice_number('123e4567-e89b-12d3-a456-426614174000');
-- Note: This will increment the sequence!
```

### Reset Invoice Number Sequence (DANGEROUS)

```sql
-- Only use this in development or for specific business reasons
UPDATE invoice_number_sequences
SET last_invoice_number = 0
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000';
```

### Customize Invoice Number Format

```sql
-- Change prefix
UPDATE invoice_number_sequences
SET prefix = 'INVOICE-'
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000';

-- Add year suffix
UPDATE invoice_number_sequences
SET suffix_format = '-YYYY'
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000';

-- Change padding (number of digits)
UPDATE invoice_number_sequences
SET padding = 6  -- Will create 000001, 000002, etc.
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000';
```

### Find and Fix Data Issues

```sql
-- Find invoices with mismatched totals
SELECT id, invoice_number, subtotal, tax_amount, total_amount
FROM invoices
WHERE total_amount != (subtotal + tax_amount - COALESCE(discount_amount, 0))
  AND status != 'void';

-- Find invoices with payment mismatch
SELECT
  i.id,
  i.invoice_number,
  i.amount_paid AS recorded_paid,
  COALESCE(SUM(p.amount), 0) AS actual_paid
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.id, i.invoice_number, i.amount_paid
HAVING i.amount_paid != COALESCE(SUM(p.amount), 0);

-- Find orphaned line items (invoice deleted but RLS prevented cascade)
SELECT li.*
FROM invoice_line_items li
LEFT JOIN invoices i ON li.invoice_id = i.id
WHERE i.id IS NULL;
```

### Archive Old Invoices (Soft Delete)

```sql
-- Mark old paid invoices as archived (add archived column first)
-- This is just an example - you'd need to add an 'archived' column
UPDATE invoices
SET status = 'void',
    voided_at = NOW()
WHERE status = 'paid'
  AND paid_at < CURRENT_DATE - INTERVAL '7 years'
  AND org_id = '123e4567-e89b-12d3-a456-426614174000';
```

### Verify System Integrity

```sql
-- Run verification function
SELECT * FROM verify_invoicing_setup();

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('invoices', 'invoice_line_items', 'payments')
ORDER BY tablename, policyname;

-- Check triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('invoices', 'invoice_line_items', 'payments')
ORDER BY event_object_table, trigger_name;
```

## Performance Queries

### Find Slow Queries (requires pg_stat_statements)

```sql
-- Most time-consuming queries related to invoicing
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%invoices%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Check Index Usage

```sql
-- See which indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('invoices', 'invoice_line_items', 'payments')
ORDER BY idx_scan DESC;
```

### Table Statistics

```sql
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE tablename IN ('invoices', 'invoice_line_items', 'payments');
```

---

**Last Updated:** 2025-11-16
**Related Documentation:**
- [Invoicing System Design](/home/user/Salesmod/docs/features/invoicing/INVOICING_SYSTEM_DESIGN.md)
- [Migration File](/home/user/Salesmod/supabase/migrations/20251116120000_create_invoicing_system.sql)
- [TypeScript Types](/home/user/Salesmod/src/types/invoicing.ts)
