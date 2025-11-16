---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing System API Routes Documentation

Complete API reference for the invoicing system with examples and integration guides.

## Table of Contents

1. [Authentication](#authentication)
2. [Invoice CRUD](#invoice-crud)
3. [Invoice Actions](#invoice-actions)
4. [Payment Management](#payment-management)
5. [Stripe Integration](#stripe-integration)
6. [Reports](#reports)
7. [Batch Operations](#batch-operations)
8. [Error Handling](#error-handling)
9. [Webhooks](#webhooks)

---

## Authentication

All API routes require authentication via Supabase session cookies. The authenticated user's `org_id` is automatically extracted from the session.

```typescript
// Automatically handled by middleware
// User must be logged in via Supabase Auth
```

---

## Invoice CRUD

### List Invoices

**Endpoint:** `GET /api/invoices`

**Query Parameters:**
```typescript
{
  // Filters
  client_id?: string;           // Filter by client
  status?: InvoiceStatusType | InvoiceStatusType[];
  payment_method?: PaymentMethodType | PaymentMethodType[];
  date_from?: string;           // ISO date
  date_to?: string;             // ISO date
  overdue_only?: boolean;
  search?: string;              // Search invoice number or client name

  // Pagination
  page?: number;                // Default: 1
  limit?: number;               // Default: 20, max: 100
  sort_by?: string;             // Default: 'created_at'
  sort_order?: 'asc' | 'desc';  // Default: 'desc'
}
```

**Example Request:**
```typescript
const response = await fetch('/api/invoices?' + new URLSearchParams({
  status: 'sent',
  page: '1',
  limit: '20',
  sort_by: 'due_date',
  sort_order: 'asc'
}));

const { data, meta } = await response.json();
```

**Response:**
```typescript
{
  data: InvoiceWithDetails[];
  meta: {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3
  }
}
```

---

### Create Invoice

**Endpoint:** `POST /api/invoices`

**Request Body:**
```typescript
{
  client_id: string;                    // Required
  payment_method: 'cod' | 'stripe_link' | 'net_terms';  // Required

  // Optional dates
  invoice_date?: string;                // Default: today
  due_date?: string;                    // Default: calculated from client payment terms

  // Financial
  tax_rate?: number;                    // Default: 0 (0-1 range, e.g., 0.08 = 8%)
  discount_amount?: number;             // Default: 0

  // Content
  notes?: string;
  terms_and_conditions?: string;
  footer_text?: string;

  // Stripe-specific (required if payment_method = 'stripe_link')
  stripe_customer_id?: string;

  // COD-specific (required if payment_method = 'cod')
  cod_collected_by?: string;
  cod_collection_method?: 'cash' | 'check' | 'money_order' | 'cashiers_check';
  cod_notes?: string;

  // Line items (required, at least one)
  line_items: [
    {
      order_id?: string;                // Optional link to order
      description: string;              // Required
      quantity: number;                 // Default: 1
      unit_price: number;               // Required
      tax_rate?: number;                // Default: 0
      line_order?: number;              // Optional ordering
    }
  ]
}
```

**Example Request:**
```typescript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'uuid-here',
    payment_method: 'net_terms',
    tax_rate: 0.08,
    notes: 'NET-30 payment terms apply',
    line_items: [
      {
        order_id: 'order-uuid',
        description: 'Residential Appraisal - 123 Main St',
        quantity: 1,
        unit_price: 450.00
      },
      {
        description: 'Rush Fee',
        quantity: 1,
        unit_price: 100.00
      }
    ]
  })
});

const { data, message } = await response.json();
// data: InvoiceWithDetails
// message: "Invoice created successfully"
```

---

### Get Invoice Details

**Endpoint:** `GET /api/invoices/[id]`

**Response:**
```typescript
{
  data: InvoiceWithDetails  // Includes client, line_items, payments
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid');
const { data: invoice } = await response.json();

console.log(invoice.invoice_number);  // "INV-00001"
console.log(invoice.client.company_name);
console.log(invoice.line_items);
console.log(invoice.payments);
```

---

### Update Invoice

**Endpoint:** `PATCH /api/invoices/[id]`

**Request Body:** (all fields optional)
```typescript
{
  status?: InvoiceStatusType;
  due_date?: string;
  tax_rate?: number;
  discount_amount?: number;
  notes?: string;
  terms_and_conditions?: string;
  footer_text?: string;

  // Stripe updates
  stripe_invoice_id?: string;
  stripe_payment_link_url?: string;
  stripe_payment_intent_id?: string;
  stripe_metadata?: Record<string, any>;

  // COD updates
  cod_collected_at?: string;
  cod_receipt_number?: string;
  cod_notes?: string;
}
```

**Restrictions:**
- Cannot edit invoices with status: `paid`, `cancelled`, `void`
- Cannot modify amounts if payments exist

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Updated payment instructions',
    due_date: '2025-12-31T00:00:00Z'
  })
});
```

---

### Delete Invoice

**Endpoint:** `DELETE /api/invoices/[id]`

**Behavior:**
- **Draft invoices with no payments:** Hard deleted
- **All other invoices:** Voided instead of deleted

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid', {
  method: 'DELETE'
});

// Returns 204 No Content for hard delete
// Returns 200 with void status for voided invoices
```

---

## Invoice Actions

### Send Invoice

**Endpoint:** `POST /api/invoices/[id]/send`

**Request Body:**
```typescript
{
  email?: string;               // Override client email
  cc_emails?: string[];         // CC recipients
  subject?: string;             // Email subject
  message?: string;             // Email body
  send_copy_to_self?: boolean;  // Default: false
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Invoice #INV-00001',
    message: 'Please find your invoice attached.',
    send_copy_to_self: true
  })
});

// Updates invoice status to 'sent' and sets sent_at timestamp
```

---

### Mark as Paid (COD)

**Endpoint:** `POST /api/invoices/[id]/mark-paid`

**Request Body:**
```typescript
{
  payment_method: PaymentType;  // Required: 'cash', 'check', etc.
  payment_date?: string;        // Default: today
  reference_number?: string;    // Check number, receipt, etc.
  notes?: string;
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid/mark-paid', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment_method: 'cash',
    reference_number: 'RECEIPT-123',
    notes: 'Collected at property'
  })
});

// Creates payment record for full amount_due
// Updates invoice status to 'paid'
```

---

### Cancel Invoice

**Endpoint:** `POST /api/invoices/[id]/cancel`

**Request Body:**
```typescript
{
  reason?: string;  // Cancellation reason (added to notes)
}
```

**Restrictions:**
- Cannot cancel invoices with payments (must void instead)

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: 'Order cancelled by client'
  })
});

// Updates status to 'cancelled' and sets cancelled_at
```

---

## Payment Management

### List Invoice Payments

**Endpoint:** `GET /api/invoices/[id]/payments`

**Response:**
```typescript
{
  data: Payment[]
}
```

---

### Record Payment

**Endpoint:** `POST /api/invoices/[id]/payments`

**Request Body:**
```typescript
{
  amount: number;                   // Required, positive number
  payment_method: PaymentType;      // Required
  payment_date?: string;            // Default: today
  reference_number?: string;        // Check number, transaction ID, etc.
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  notes?: string;
}
```

**Validation:**
- Amount cannot exceed `invoice.amount_due`
- Cannot record payment for cancelled/void invoices

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 250.00,
    payment_method: 'check',
    reference_number: 'CHECK-5678',
    notes: 'Partial payment'
  })
});

// Creates payment record
// Updates invoice amount_paid, amount_due, and status
// If amount_paid < total_amount, status becomes 'partially_paid'
// If amount_paid >= total_amount, status becomes 'paid'
```

---

### Delete Payment

**Endpoint:** `DELETE /api/payments/[id]`

**Restrictions:**
- Cannot delete reconciled payments

**Example:**
```typescript
const response = await fetch('/api/payments/payment-uuid', {
  method: 'DELETE'
});

// Deletes payment and recalculates invoice status
```

---

## Stripe Integration

### Generate Stripe Payment Link

**Endpoint:** `POST /api/invoices/[id]/stripe-link`

**Prerequisites:**
- Invoice must have `payment_method: 'stripe_link'`
- Invoice must not be paid, cancelled, or void

**Request Body:**
```typescript
{
  description?: string;         // Stripe invoice description
  metadata?: Record<string, any>;  // Additional metadata
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/invoice-uuid/stripe-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Appraisal services - 123 Main St',
    metadata: { property_id: 'prop-uuid' }
  })
});

const { data } = await response.json();
console.log(data.stripe_invoice_url);  // Send this to client
```

**What it does:**
1. Creates or retrieves Stripe customer
2. Creates Stripe invoice with line items
3. Finalizes invoice to generate payment link
4. Updates local invoice with Stripe IDs
5. Sets status to 'sent'

**Response:**
```typescript
{
  data: {
    invoice: InvoiceWithDetails,
    stripe_invoice_url: string,
    stripe_invoice_id: string
  }
}
```

---

## Reports

### Outstanding Invoices Report

**Endpoint:** `GET /api/reports/outstanding`

**Query Parameters:**
```typescript
{
  aging_bucket?: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  min_amount?: number;
  sort_by?: 'due_date' | 'amount_due' | 'days_overdue';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

**Example:**
```typescript
const response = await fetch('/api/reports/outstanding?' + new URLSearchParams({
  aging_bucket: '90+',
  sort_by: 'amount_due',
  sort_order: 'desc'
}));

const { data, meta } = await response.json();
console.log(meta.summary.total_outstanding);
console.log(meta.summary.aging_buckets);
```

---

### Aging Report

**Endpoint:** `GET /api/reports/aging`

**Query Parameters:**
```typescript
{
  client_id?: string;
  min_outstanding?: number;
  sort_by?: 'total_outstanding_amount' | 'aged_90_plus';
  sort_order?: 'asc' | 'desc';
}
```

**Response includes:**
- Per-client breakdown of outstanding amounts
- Aging buckets (current, 1-30, 31-60, 61-90, 90+)
- Summary totals across all clients

---

### Revenue Recognition Report

**Endpoint:** `GET /api/reports/revenue`

**Query Parameters:**
```typescript
{
  start_month?: string;         // YYYY-MM
  end_month?: string;           // YYYY-MM
  payment_method?: PaymentMethodType;
  group_by?: 'month' | 'payment_method' | 'status';
}
```

**Example:**
```typescript
const response = await fetch('/api/reports/revenue?' + new URLSearchParams({
  start_month: '2025-01',
  end_month: '2025-12',
  group_by: 'month'
}));

const { data, meta } = await response.json();
console.log(meta.summary.recognized_revenue);
console.log(meta.summary.deferred_revenue);
```

---

### Client Payment History

**Endpoint:** `GET /api/reports/client-history/[clientId]`

**Response:**
```typescript
{
  data: {
    client_id: string;
    company_name: string;
    total_invoices: number;
    paid_invoices: number;
    outstanding_invoices: number;
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    avg_days_to_pay: number;
    overdue_count: number;
    invoices: Invoice[];           // Full invoice list
    recent_payments: Payment[];    // Last 10 payments
  }
}
```

---

## Batch Operations

### Batch Create Invoices

**Endpoint:** `POST /api/invoices/batch`

**Request Body:**
```typescript
{
  invoices: CreateInvoiceInput[];  // 1-100 invoices
  send_immediately?: boolean;      // Default: false
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    send_immediately: true,
    invoices: [
      {
        client_id: 'client-1',
        payment_method: 'net_terms',
        line_items: [{ description: 'Service 1', quantity: 1, unit_price: 100 }]
      },
      {
        client_id: 'client-2',
        payment_method: 'net_terms',
        line_items: [{ description: 'Service 2', quantity: 1, unit_price: 200 }]
      }
    ]
  })
});

const { data } = await response.json();
console.log(data.success);  // Successfully created invoices
console.log(data.failed);   // Failed invoices with error details
```

---

### Batch Send Invoices

**Endpoint:** `POST /api/invoices/batch-send`

**Request Body:**
```typescript
{
  invoice_ids: string[];        // 1-50 invoice IDs
  email_template?: {
    subject?: string;
    message?: string;
    cc_emails?: string[];
  }
}
```

**Example:**
```typescript
const response = await fetch('/api/invoices/batch-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice_ids: ['inv-1', 'inv-2', 'inv-3'],
    email_template: {
      subject: 'Your Monthly Invoice',
      message: 'Please find your invoice attached.'
    }
  })
});

const { data } = await response.json();
console.log(data.sent);    // Successfully sent invoice IDs
console.log(data.failed);  // Failed sends with error details
```

---

## Error Handling

All API routes return consistent error responses:

```typescript
{
  error: {
    message: string;
    code: string;
    details?: any;
    statusCode: number;
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - No access to resource
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Duplicate or constraint violation
- `INTERNAL_ERROR` (500) - Server error

**Example Error Handling:**
```typescript
const response = await fetch('/api/invoices/invalid-id');

if (!response.ok) {
  const { error } = await response.json();
  console.error(`[${error.code}] ${error.message}`);
  console.error(error.details);
}
```

---

## Webhooks

### Stripe Webhook Handler

**Endpoint:** `POST /api/webhooks/stripe`

**Webhook Events Handled:**
- `invoice.payment_succeeded` - Records payment automatically
- `invoice.payment_failed` - Logs failure
- `invoice.finalized` - Updates Stripe metadata
- `invoice.sent` - Updates sent status
- `invoice.voided` - Voids local invoice

**Setup:**

1. Add webhook endpoint in Stripe Dashboard:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

2. Set webhook secret in environment:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Select events to listen for:
   - invoice.payment_succeeded
   - invoice.payment_failed
   - invoice.finalized
   - invoice.sent
   - invoice.voided

**Webhook Signature Verification:**

The webhook handler automatically verifies Stripe signatures using the `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For webhooks

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## TypeScript Types

All request/response types are available at:
- `/src/types/invoicing.ts` - Database types
- `/src/lib/validations/invoicing.ts` - Zod schemas and inferred types

**Example Usage:**
```typescript
import type { InvoiceWithDetails, CreatePaymentInput } from '@/types/invoicing';
import { CreateInvoiceSchema } from '@/lib/validations/invoicing';

// Validate data before sending
const validated = CreateInvoiceSchema.parse(formData);
```

---

## Next Steps

- [Frontend Components](./FRONTEND-COMPONENTS.md)
- [Email Templates](./EMAIL-TEMPLATES.md)
- [PDF Generation](./PDF-GENERATION.md)
- [Testing Guide](./TESTING.md)
