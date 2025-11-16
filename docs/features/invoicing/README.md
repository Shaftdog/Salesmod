---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing System Documentation

Complete invoicing system for appraisal software with support for three payment collection methods: COD, Stripe Payment Links, and Net Terms invoicing.

## Quick Links

- [System Design](INVOICING_SYSTEM_DESIGN.md) - Complete architecture and design documentation
- [SQL Reference](INVOICING_SQL_REFERENCE.md) - Common queries and operations
- [Testing Guide](INVOICING_TESTING_GUIDE.md) - Test scenarios and sample data
- [TypeScript Types](/home/user/Salesmod/src/types/invoicing.ts) - Frontend type definitions
- [Migration File](/home/user/Salesmod/supabase/migrations/20251116120000_create_invoicing_system.sql) - Database schema

## Overview

This invoicing system supports three distinct payment workflows:

### 1. COD (Cash on Delivery)
Collect payment in person when delivering appraisal reports.
- Track collection method (cash, check, money order)
- Record who collected payment
- Generate receipt numbers
- Immediate payment processing

### 2. Stripe Payment Link
Send automated payment links via Stripe invoices.
- Generate Stripe invoices via API
- Send payment links to clients
- Webhook-based payment tracking
- Automatic status updates

### 3. Net Terms Invoice
Traditional NET-30/60/90 invoicing.
- Based on client payment terms
- Support partial payments
- Aging reports (30/60/90 days)
- Overdue tracking

## Key Features

- **Auto-generating invoice numbers** - Sequential per organization
- **Multi-order invoicing** - Group multiple orders on one invoice
- **Partial payments** - Track multiple payments per invoice
- **Automatic calculations** - Totals, tax, status updates via triggers
- **Aging reports** - Track overdue invoices
- **Revenue recognition** - Accrual accounting views
- **Full RLS** - Multi-tenant security
- **Stripe integration ready** - Webhook handlers included

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `invoices` | Main invoice records |
| `invoice_line_items` | Individual line items (supports multi-order invoices) |
| `payments` | Payment records (supports partial payments) |
| `invoice_number_sequences` | Auto-incrementing invoice numbers per org |

### Helper Views

| View | Purpose |
|------|---------|
| `outstanding_invoices` | All unpaid/partially paid invoices with aging |
| `invoice_aging_report` | AR aging by client (30/60/90 days) |
| `client_payment_history` | Payment performance metrics |
| `revenue_recognition` | Revenue by month and payment method |

## Quick Start

### 1. Run Migration

```bash
# Apply migration to your Supabase database
supabase db push

# Or apply to remote database
supabase db push --remote
```

### 2. Verify Installation

```sql
-- Run verification function
SELECT * FROM public.verify_invoicing_setup();

-- Should return counts for:
-- - Invoices
-- - Invoice Line Items
-- - Payments
-- - Invoice Number Sequences
```

### 3. Create Your First Invoice

```sql
-- Create a NET-30 invoice
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
    'your-org-id',
    'your-client-id',
    'net_terms',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.07  -- 7% tax
  )
  RETURNING id, invoice_number
)
-- Add line items
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price
)
SELECT
  id,
  'order-id',
  'Residential Appraisal - 123 Main St',
  1,
  450.00
FROM new_invoice
RETURNING *;

-- Invoice number auto-generated!
-- Totals auto-calculated!
```

### 4. Record a Payment

```sql
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number
)
VALUES (
  'invoice-id',
  'your-org-id',
  481.50,
  'check',
  'CHECK-12345'
);

-- Invoice status automatically updates to 'paid'!
```

## Usage Examples

### Create Multi-Order Invoice

Group several completed orders on one invoice:

```sql
-- See SQL Reference for full example
-- docs/features/invoicing/INVOICING_SQL_REFERENCE.md#create-multi-order-invoice
```

### Get Aging Report

```sql
SELECT * FROM invoice_aging_report
WHERE org_id = 'your-org-id'
  AND total_outstanding_amount > 0
ORDER BY aged_90_plus DESC;
```

### Find Uninvoiced Orders

```sql
SELECT o.*
FROM orders o
WHERE o.status = 'completed'
  AND o.id NOT IN (
    SELECT order_id
    FROM invoice_line_items
    WHERE order_id IS NOT NULL
  );
```

## Frontend Integration

### TypeScript Types

All types are available in `/home/user/Salesmod/src/types/invoicing.ts`:

```typescript
import {
  Invoice,
  InvoiceLineItem,
  Payment,
  CreateInvoiceRequest,
  OutstandingInvoice,
  InvoiceAgingReport
} from '@/types/invoicing';
```

### Supabase Queries

```typescript
// Fetch outstanding invoices
const { data: invoices } = await supabase
  .from('outstanding_invoices')
  .select('*')
  .eq('org_id', orgId)
  .order('days_overdue', { ascending: false });

// Create invoice with line items
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    org_id: orgId,
    client_id: clientId,
    payment_method: 'net_terms',
    tax_rate: 0.07
  })
  .select()
  .single();

// Add line items
await supabase
  .from('invoice_line_items')
  .insert(lineItems);
```

## Stripe Integration

### Creating Stripe Invoice

See [System Design](INVOICING_SYSTEM_DESIGN.md#stripe-integration) for complete example.

```typescript
// 1. Create invoice in database
// 2. Create Stripe invoice via API
// 3. Update database with Stripe details
// 4. Send payment link to client
```

### Webhook Handler

```typescript
// Handle Stripe webhook events
// - invoice.payment_succeeded
// - invoice.viewed
// - invoice.voided
```

## Reports

### Aging Report

Track overdue invoices by aging bucket (current, 1-30, 31-60, 61-90, 90+ days):

```sql
SELECT * FROM invoice_aging_report
WHERE org_id = 'your-org-id';
```

### Revenue by Month

```sql
SELECT
  DATE_TRUNC('month', invoice_date) AS month,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_invoiced,
  SUM(amount_paid) AS amount_collected
FROM invoices
WHERE org_id = 'your-org-id'
GROUP BY month
ORDER BY month DESC;
```

### Client Payment Performance

```sql
SELECT * FROM client_payment_history
WHERE avg_days_to_pay > payment_terms  -- Slow payers
ORDER BY (avg_days_to_pay - payment_terms) DESC;
```

## Best Practices

1. **Let triggers handle calculations** - Don't manually calculate totals or status
2. **Always include org_id** - For RLS and multi-tenancy
3. **Use payment records** - Even for COD, create payment record
4. **Mark status transitions explicitly** - draft → sent, sent → overdue
5. **Reconcile payments** - Mark payments as reconciled after bank reconciliation
6. **Use views for reports** - Pre-optimized for common queries

## Troubleshooting

### Invoice totals don't match line items

```sql
-- Recalculate invoice totals
SELECT calculate_invoice_totals('invoice-id');
```

### Payment applied but status didn't update

```sql
-- Update invoice payment status
SELECT update_invoice_payment_status('invoice-id');
```

### Invoice number sequence issues

```sql
-- Check current sequence
SELECT * FROM invoice_number_sequences
WHERE org_id = 'your-org-id';

-- Preview next number (this increments the sequence!)
SELECT generate_invoice_number('your-org-id');
```

## Testing

Complete test scenarios available in [Testing Guide](INVOICING_TESTING_GUIDE.md):

- COD workflow
- Stripe workflow
- Net Terms workflow
- Partial payments
- Overdue invoices
- Discounts
- Edge cases
- Performance tests

## Migration Details

**File:** `/home/user/Salesmod/supabase/migrations/20251116120000_create_invoicing_system.sql`

**Includes:**
- 4 core tables
- 8 indexes
- 5 helper functions
- 8 triggers
- 4 views
- Complete RLS policies
- Comments and documentation

**Safe to run:** Migration uses `IF NOT EXISTS` and `DO $$ BEGIN ... EXCEPTION` for idempotency.

## Documentation Structure

```
docs/features/invoicing/
├── README.md                      # This file - overview and quick start
├── INVOICING_SYSTEM_DESIGN.md     # Complete architecture and design
├── INVOICING_SQL_REFERENCE.md     # Common queries and operations
└── INVOICING_TESTING_GUIDE.md     # Test scenarios and sample data

src/types/
└── invoicing.ts                   # TypeScript type definitions

supabase/migrations/
└── 20251116120000_create_invoicing_system.sql  # Database schema
```

## Next Steps

1. **Run migration** - Apply schema to your database
2. **Test workflows** - Use testing guide to verify functionality
3. **Integrate Stripe** - Set up Stripe webhook handlers
4. **Build UI** - Create invoice management interface
5. **Add reports** - Implement aging and revenue reports
6. **Set up automation** - Scheduled jobs for overdue tracking

## Support

For questions or issues:
- Check [SQL Reference](INVOICING_SQL_REFERENCE.md) for common queries
- Review [System Design](INVOICING_SYSTEM_DESIGN.md) for architecture details
- Use [Testing Guide](INVOICING_TESTING_GUIDE.md) to verify functionality

## Version History

- **v1.0.0** (2025-11-16) - Initial release
  - Three payment methods (COD, Stripe, Net Terms)
  - Auto-generating invoice numbers
  - Partial payment support
  - Aging reports
  - Revenue recognition
  - Full RLS implementation

---

**Last Updated:** 2025-11-16
**Migration File:** `20251116120000_create_invoicing_system.sql`
**Status:** Ready for production use
