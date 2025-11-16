---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing System Database Design

Complete documentation for the Supabase-based invoicing system supporting three payment collection methods.

## Table of Contents
- [Overview](#overview)
- [Payment Methods](#payment-methods)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Integration Guide](#api-integration-guide)

## Overview

The invoicing system is designed to handle three distinct payment collection workflows:

1. **COD (Cash on Delivery)** - In-person payment collection
2. **Stripe Payment Link** - Automated online payment via Stripe
3. **Net Terms Invoice** - Traditional NET-30/60/90 invoicing

### Key Features

- Auto-generating sequential invoice numbers per organization
- Multi-line invoices (group multiple orders on one invoice)
- Partial payment tracking
- Automatic status updates based on payments
- Aging reports (30/60/90 days overdue)
- Revenue recognition for accrual accounting
- Full multi-tenancy with RLS
- Stripe webhook integration support

## Payment Methods

### 1. COD (Cash on Delivery)

**Use Case:** Collecting payment in person at time of delivery or completion.

**Required Fields:**
- `payment_method = 'cod'`
- `cod_collected_by` - Name of person collecting
- `cod_collection_method` - cash, check, money_order, cashiers_check
- `cod_receipt_number` - Receipt or transaction number
- `cod_collected_at` - Timestamp of collection

**Workflow:**
```
Create Invoice (draft) → Mark as COD → Collect Payment → Update to Paid
```

**Status Flow:**
```
draft → sent → paid
```

### 2. Stripe Payment Link

**Use Case:** Send automated payment link to client via email.

**Required Fields:**
- `payment_method = 'stripe_link'`
- `stripe_payment_link_url` - URL to Stripe payment page
- `stripe_invoice_id` - Stripe invoice ID
- `stripe_customer_id` - Stripe customer ID

**Optional Fields:**
- `stripe_payment_intent_id` - After payment
- `stripe_metadata` - Additional Stripe data

**Workflow:**
```
Create Invoice → Generate Stripe Invoice → Send Link → Client Pays → Webhook Updates Status
```

**Status Flow:**
```
draft → sent → viewed → paid
```

### 3. Net Terms Invoice

**Use Case:** Traditional invoicing with payment terms (NET-30, NET-60, etc.)

**Required Fields:**
- `payment_method = 'net_terms'`
- `due_date` - Calculated from client's payment_terms

**Workflow:**
```
Create Invoice → Send to Client → Track Due Date → Receive Payment → Mark as Paid
```

**Status Flow:**
```
draft → sent → overdue (if past due) → partially_paid → paid
```

## Database Schema

### Core Tables

#### 1. `invoices`

Main invoice records with all payment method support.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization (multi-tenancy) |
| `client_id` | UUID | Client being invoiced |
| `invoice_number` | TEXT | Auto-generated unique per org |
| `invoice_date` | DATE | Date invoice created |
| `due_date` | DATE | Payment due date |
| `payment_method` | ENUM | cod, stripe_link, net_terms |
| `status` | ENUM | draft, sent, viewed, partially_paid, paid, overdue, cancelled, void |
| `subtotal` | DECIMAL | Sum of line items |
| `tax_rate` | DECIMAL | Tax rate (0.00 to 1.00) |
| `tax_amount` | DECIMAL | Calculated tax |
| `discount_amount` | DECIMAL | Discount applied |
| `total_amount` | DECIMAL | Final total |
| `amount_paid` | DECIMAL | Sum of payments |
| `amount_due` | DECIMAL | Remaining balance |

**Stripe Fields:**
- `stripe_invoice_id`
- `stripe_payment_link_url`
- `stripe_payment_intent_id`
- `stripe_customer_id`
- `stripe_metadata` (JSONB)

**COD Fields:**
- `cod_collected_by`
- `cod_collection_method`
- `cod_receipt_number`
- `cod_collected_at`
- `cod_notes`

**State Tracking:**
- `sent_at`
- `viewed_at`
- `first_payment_at`
- `paid_at`
- `cancelled_at`
- `voided_at`

#### 2. `invoice_line_items`

Individual line items on invoices. Supports grouping multiple orders on one invoice.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | Parent invoice |
| `order_id` | UUID | Optional - links to order |
| `description` | TEXT | Line item description |
| `quantity` | DECIMAL | Quantity |
| `unit_price` | DECIMAL | Price per unit |
| `amount` | DECIMAL | Auto-calculated (qty * price) |
| `tax_rate` | DECIMAL | Optional per-line tax |
| `line_order` | INTEGER | Display order |

**Notes:**
- `order_id` is nullable to support custom line items (fees, discounts, etc.)
- Multiple orders can be grouped on one invoice
- `amount` is auto-calculated via trigger

#### 3. `payments`

Individual payment records. Supports partial payments.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | Invoice being paid |
| `org_id` | UUID | Organization |
| `payment_date` | DATE | Date payment received |
| `amount` | DECIMAL | Payment amount |
| `payment_method` | ENUM | cash, check, credit_card, stripe, ach, wire, etc. |
| `reference_number` | TEXT | Check #, transaction ID, etc. |
| `stripe_payment_intent_id` | TEXT | Stripe payment ID |
| `is_reconciled` | BOOLEAN | Bank reconciliation status |

**Notes:**
- Multiple payments can be applied to one invoice
- Each payment triggers invoice status recalculation
- Track reconciliation for accounting

#### 4. `invoice_number_sequences`

Auto-incrementing sequences per organization.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `org_id` | UUID | Organization |
| `last_invoice_number` | INTEGER | Current counter |
| `prefix` | TEXT | Prefix (e.g., "INV-") |
| `suffix_format` | TEXT | Optional suffix (e.g., "-YYYY") |
| `padding` | INTEGER | Zero-padding (5 = "00001") |

**Example Invoice Numbers:**
- `INV-00001`
- `INV-00042-2025`
- `INVOICE-000123`

### Helper Views

#### `outstanding_invoices`

All unpaid and partially paid invoices with aging.

```sql
SELECT * FROM outstanding_invoices
WHERE org_id = 'your-org-id'
ORDER BY days_overdue DESC;
```

**Columns:**
- All invoice fields
- `days_overdue` - Days past due date
- `aging_bucket` - current, 1-30, 31-60, 61-90, 90+

#### `invoice_aging_report`

Accounts receivable aging by client (30/60/90 days).

```sql
SELECT * FROM invoice_aging_report
WHERE org_id = 'your-org-id'
ORDER BY total_outstanding_amount DESC;
```

**Columns:**
- `client_name`
- `total_outstanding_invoices`
- `total_outstanding_amount`
- `current_amount` - Not yet due
- `aged_1_30` - 1-30 days overdue
- `aged_31_60` - 31-60 days overdue
- `aged_61_90` - 61-90 days overdue
- `aged_90_plus` - Over 90 days overdue

#### `client_payment_history`

Payment performance metrics by client.

```sql
SELECT * FROM client_payment_history
WHERE avg_days_to_pay > payment_terms;  -- Slow payers
```

**Columns:**
- `total_invoices`
- `paid_invoices`
- `outstanding_invoices`
- `total_invoiced`
- `total_paid`
- `total_outstanding`
- `avg_days_to_pay` - Average payment time
- `overdue_count`

#### `revenue_recognition`

Revenue by month and payment method (accrual accounting).

```sql
SELECT * FROM revenue_recognition
WHERE revenue_month = '2025-11-01'::DATE;
```

## Data Flow

### Creating an Invoice

#### Basic Flow:

```sql
-- 1. Insert invoice (invoice_number auto-generated)
INSERT INTO invoices (
  org_id,
  client_id,
  invoice_date,
  due_date,
  payment_method,
  tax_rate
) VALUES (
  'org-uuid',
  'client-uuid',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'net_terms',
  0.07  -- 7% tax
) RETURNING id;

-- 2. Add line items
INSERT INTO invoice_line_items (
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price,
  line_order
) VALUES
  ('invoice-uuid', 'order-1-uuid', 'Residential Appraisal - 123 Main St', 1, 450.00, 1),
  ('invoice-uuid', 'order-2-uuid', 'Residential Appraisal - 456 Oak Ave', 1, 450.00, 2),
  ('invoice-uuid', NULL, 'Rush Fee', 1, 100.00, 3);

-- Totals are automatically calculated via triggers!
-- Invoice status automatically updated!
```

#### What Happens Automatically:

1. **Invoice number generated** - Sequential per org
2. **Line item amounts calculated** - `amount = quantity * unit_price`
3. **Invoice totals calculated** - Subtotal, tax, total from line items
4. **Status initialized** - Set to 'draft'

### COD Payment Flow

```sql
-- 1. Create invoice with COD method
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  cod_collected_by,
  cod_collection_method
) VALUES (
  'org-uuid',
  'client-uuid',
  'cod',
  'John Smith',
  'cash'
);

-- 2. Add line items (same as above)

-- 3. Mark as sent when going to collect
UPDATE invoices
SET status = 'sent',
    sent_at = NOW()
WHERE id = 'invoice-uuid';

-- 4. Record payment upon collection
UPDATE invoices
SET cod_collected_at = NOW(),
    cod_receipt_number = 'RECEIPT-12345',
    status = 'paid'
WHERE id = 'invoice-uuid';

-- Or create a payment record for accounting
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number
) VALUES (
  'invoice-uuid',
  'org-uuid',
  500.00,
  'cash',
  'RECEIPT-12345'
);
-- Status automatically updates to 'paid'!
```

### Stripe Payment Flow

```sql
-- 1. Create invoice
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  stripe_customer_id
) VALUES (
  'org-uuid',
  'client-uuid',
  'stripe_link',
  'cus_stripe123'
);

-- 2. Add line items

-- 3. Generate Stripe invoice (in application code)
-- This would use Stripe API to create invoice

-- 4. Update with Stripe details
UPDATE invoices
SET stripe_invoice_id = 'in_stripe456',
    stripe_payment_link_url = 'https://invoice.stripe.com/...',
    status = 'sent',
    sent_at = NOW()
WHERE id = 'invoice-uuid';

-- 5. Client pays via Stripe

-- 6. Webhook handler updates invoice
-- (This happens in application code when Stripe webhook fires)
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  stripe_payment_intent_id,
  reference_number
) VALUES (
  'invoice-uuid',
  'org-uuid',
  500.00,
  'stripe',
  'pi_stripe789',
  'STRIPE-pi_stripe789'
);
-- Status automatically updates to 'paid'!
```

### Net Terms Invoice Flow

```sql
-- 1. Create invoice with due date from client's payment terms
WITH client_terms AS (
  SELECT payment_terms FROM clients WHERE id = 'client-uuid'
)
INSERT INTO invoices (
  org_id,
  client_id,
  payment_method,
  invoice_date,
  due_date
) VALUES (
  'org-uuid',
  'client-uuid',
  'net_terms',
  CURRENT_DATE,
  CURRENT_DATE + (SELECT payment_terms FROM client_terms) * INTERVAL '1 day'
);

-- 2. Add line items

-- 3. Send invoice
UPDATE invoices
SET status = 'sent',
    sent_at = NOW()
WHERE id = 'invoice-uuid';

-- 4. Track overdue (automatic via nightly job or on-demand)
UPDATE invoices
SET status = 'overdue'
WHERE status = 'sent'
  AND due_date < CURRENT_DATE
  AND amount_due > 0;

-- 5. Record partial payment
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number
) VALUES (
  'invoice-uuid',
  'org-uuid',
  250.00,  -- Partial payment
  'check',
  'CHECK-4567'
);
-- Status automatically updates to 'partially_paid'!

-- 6. Record final payment
INSERT INTO payments (
  invoice_id,
  org_id,
  amount,
  payment_method,
  reference_number
) VALUES (
  'invoice-uuid',
  'org-uuid',
  250.00,  -- Remaining balance
  'check',
  'CHECK-5678'
);
-- Status automatically updates to 'paid'!
```

## Usage Examples

### Create Multi-Order Invoice

Group multiple completed orders on one invoice:

```sql
-- Create invoice
WITH new_invoice AS (
  INSERT INTO invoices (org_id, client_id, payment_method)
  VALUES ('org-uuid', 'client-uuid', 'net_terms')
  RETURNING id
)
-- Add all completed orders for this client
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
FROM orders o, new_invoice
WHERE o.client_id = 'client-uuid'
  AND o.status = 'completed'
  AND o.id NOT IN (
    -- Exclude already invoiced orders
    SELECT order_id FROM invoice_line_items WHERE order_id IS NOT NULL
  );
```

### Apply Discount

```sql
-- Update invoice with discount
UPDATE invoices
SET discount_amount = 50.00
WHERE id = 'invoice-uuid';
-- Total automatically recalculated!
```

### Check Invoice Status

```sql
SELECT
  invoice_number,
  status,
  total_amount,
  amount_paid,
  amount_due,
  CASE
    WHEN status = 'paid' THEN 'Paid in full'
    WHEN status = 'partially_paid' THEN 'Partial payment received'
    WHEN status = 'overdue' THEN days_overdue || ' days overdue'
    WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN 'Awaiting payment'
    ELSE status::text
  END AS status_description
FROM invoices
JOIN (
  SELECT id, public.invoice_days_overdue(id) AS days_overdue
  FROM invoices
) AS aging USING (id)
WHERE id = 'invoice-uuid';
```

### Get Aging Report

```sql
SELECT
  client_name,
  total_outstanding_invoices,
  total_outstanding_amount,
  current_amount,
  aged_1_30,
  aged_31_60,
  aged_61_90,
  aged_90_plus
FROM invoice_aging_report
WHERE org_id = 'your-org-id'
  AND total_outstanding_amount > 0
ORDER BY aged_90_plus DESC, total_outstanding_amount DESC;
```

### Find Slow-Paying Clients

```sql
SELECT
  client_name,
  payment_terms,
  avg_days_to_pay,
  avg_days_to_pay - payment_terms AS days_late,
  total_outstanding,
  overdue_count
FROM client_payment_history
WHERE avg_days_to_pay > payment_terms
ORDER BY (avg_days_to_pay - payment_terms) DESC;
```

## Best Practices

### Invoice Numbering

1. **Don't manually set invoice numbers** - Let the system auto-generate
2. **Customize prefix per org** - Set in `invoice_number_sequences` table
3. **Use consistent padding** - Recommended: 5 digits (00001-99999)

### Payment Recording

1. **Always use payments table** - Even for COD, create payment record
2. **Record reference numbers** - Check numbers, transaction IDs, etc.
3. **Reconcile regularly** - Mark payments as reconciled after bank reconciliation
4. **Use correct payment_method** - Helps with reporting

### Status Management

1. **Let triggers handle status** - Don't manually update status except for draft → sent
2. **Mark as sent explicitly** - When you actually send to client
3. **Use cancelled vs void appropriately**:
   - **Cancelled**: Invoice was never sent or acted upon
   - **Void**: Invoice was sent but needs to be nullified for accounting

### Performance

1. **Use views for reports** - Pre-built views are optimized
2. **Index strategy** - All common query patterns are indexed
3. **Pagination for large result sets** - Use LIMIT/OFFSET
4. **Filter by org_id first** - Always include org_id in WHERE clause

### Data Integrity

1. **Soft delete invoices** - Use 'cancelled' or 'void' status, don't DELETE
2. **Audit trail** - created_by, updated_by, timestamps tracked
3. **Validate before insert** - Check client exists, has payment_terms, etc.
4. **Transaction safety** - Wrap multi-step operations in transactions

## API Integration Guide

### Stripe Integration

#### Creating Stripe Invoice

```typescript
// 1. Create invoice in database
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    org_id: orgId,
    client_id: clientId,
    payment_method: 'stripe_link',
    stripe_customer_id: client.stripe_customer_id
  })
  .select()
  .single();

// 2. Add line items
await supabase
  .from('invoice_line_items')
  .insert(lineItems);

// 3. Create Stripe invoice
const stripeInvoice = await stripe.invoices.create({
  customer: client.stripe_customer_id,
  description: `Invoice ${invoice.invoice_number}`,
  metadata: {
    invoice_id: invoice.id,
    org_id: orgId
  }
});

// 4. Add line items to Stripe
for (const item of lineItems) {
  await stripe.invoiceItems.create({
    customer: client.stripe_customer_id,
    invoice: stripeInvoice.id,
    amount: item.amount * 100, // Convert to cents
    currency: 'usd',
    description: item.description
  });
}

// 5. Finalize and get payment link
const finalizedInvoice = await stripe.invoices.finalizeInvoice(
  stripeInvoice.id
);

// 6. Update database with Stripe details
await supabase
  .from('invoices')
  .update({
    stripe_invoice_id: stripeInvoice.id,
    stripe_payment_link_url: finalizedInvoice.hosted_invoice_url,
    status: 'sent',
    sent_at: new Date().toISOString()
  })
  .eq('id', invoice.id);
```

#### Webhook Handler

```typescript
// Handle Stripe webhook events
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const stripeInvoice = event.data.object as Stripe.Invoice;

      // Find our invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('stripe_invoice_id', stripeInvoice.id)
        .single();

      if (!invoice) return;

      // Record payment
      await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          org_id: invoice.org_id,
          amount: stripeInvoice.amount_paid / 100, // Convert from cents
          payment_method: 'stripe',
          stripe_payment_intent_id: stripeInvoice.payment_intent,
          reference_number: `STRIPE-${stripeInvoice.payment_intent}`
        });

      // Status automatically updates to 'paid' via trigger!
      break;
    }

    case 'invoice.viewed': {
      const stripeInvoice = event.data.object as Stripe.Invoice;

      await supabase
        .from('invoices')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('stripe_invoice_id', stripeInvoice.id)
        .eq('status', 'sent'); // Only update if currently 'sent'
      break;
    }
  }
}
```

### Frontend Examples

#### Fetch Outstanding Invoices

```typescript
const { data: outstandingInvoices } = await supabase
  .from('outstanding_invoices')
  .select('*')
  .eq('org_id', orgId)
  .order('days_overdue', { ascending: false });
```

#### Create Invoice with Line Items

```typescript
// Use transaction for data consistency
const { data: invoice, error } = await supabase.rpc(
  'create_invoice_with_items',
  {
    p_org_id: orgId,
    p_client_id: clientId,
    p_payment_method: 'net_terms',
    p_line_items: [
      {
        order_id: orderId1,
        description: 'Appraisal - 123 Main St',
        quantity: 1,
        unit_price: 450
      },
      {
        order_id: orderId2,
        description: 'Appraisal - 456 Oak Ave',
        quantity: 1,
        unit_price: 450
      }
    ]
  }
);
```

#### Record Payment

```typescript
const { data: payment } = await supabase
  .from('payments')
  .insert({
    invoice_id: invoiceId,
    org_id: orgId,
    amount: 500.00,
    payment_method: 'check',
    reference_number: 'CHECK-12345',
    notes: 'Payment received via mail'
  })
  .select()
  .single();

// Invoice status and amounts automatically updated!
```

## Migration File

The complete migration is in:
```
/home/user/Salesmod/supabase/migrations/20251116120000_create_invoicing_system.sql
```

### Running the Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply directly to remote database
supabase db push --remote
```

### Verification

```sql
-- Verify setup
SELECT * FROM public.verify_invoicing_setup();

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('invoices', 'invoice_line_items', 'payments');
```

## Future Enhancements

Potential additions for future iterations:

1. **Recurring Invoices** - Automatic invoice generation on schedule
2. **Payment Plans** - Split large invoices into installments
3. **Late Fees** - Automatic late fee calculation and addition
4. **Credit Memos** - Issue credits against invoices
5. **Email Templates** - Store email templates for invoice sending
6. **PDF Generation** - Store generated PDF URLs
7. **Multi-Currency** - Support for international clients
8. **Approval Workflow** - Require approval before sending large invoices
9. **Stripe Subscriptions** - For retainer-based clients
10. **QuickBooks Integration** - Sync invoices to QuickBooks

## Support

For issues or questions:
- Check existing migrations in `/supabase/migrations/`
- Review Supabase documentation: https://supabase.com/docs
- Contact development team

---

**Last Updated:** 2025-11-16
**Migration File:** `20251116120000_create_invoicing_system.sql`
**Status:** Ready for production use
