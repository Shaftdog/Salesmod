---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing API Quick Reference

## All Endpoints

### Invoice CRUD
```
GET    /api/invoices              List invoices (paginated, filtered)
POST   /api/invoices              Create invoice
GET    /api/invoices/[id]         Get invoice details
PATCH  /api/invoices/[id]         Update invoice
DELETE /api/invoices/[id]         Delete/void invoice
```

### Invoice Actions
```
POST   /api/invoices/[id]/send         Send invoice via email
POST   /api/invoices/[id]/mark-paid    Mark as paid (COD)
POST   /api/invoices/[id]/cancel       Cancel invoice
POST   /api/invoices/[id]/stripe-link  Generate Stripe payment link
```

### Payments
```
GET    /api/invoices/[id]/payments     List payments for invoice
POST   /api/invoices/[id]/payments     Record payment
DELETE /api/payments/[id]              Delete payment (admin)
```

### Reports
```
GET    /api/reports/outstanding              Outstanding invoices with aging
GET    /api/reports/aging                    AR aging by client (30/60/90)
GET    /api/reports/revenue                  Revenue recognition report
GET    /api/reports/client-history/[clientId] Client payment history
```

### Batch Operations
```
POST   /api/invoices/batch          Create multiple invoices
POST   /api/invoices/batch-send     Send multiple invoices
```

### Webhooks
```
POST   /api/webhooks/stripe         Stripe webhook handler
```

## Common Workflows

### Workflow 1: COD Invoice (Immediate Payment)
```typescript
// 1. Create invoice with COD method
POST /api/invoices
{
  client_id: "...",
  payment_method: "cod",
  cod_collected_by: "John Smith",
  cod_collection_method: "cash",
  line_items: [...]
}

// 2. Mark as paid immediately
POST /api/invoices/[id]/mark-paid
{
  payment_method: "cash",
  reference_number: "RECEIPT-123"
}

// Result: Invoice status = 'paid'
```

### Workflow 2: Stripe Payment Link
```typescript
// 1. Create invoice with Stripe method
POST /api/invoices
{
  client_id: "...",
  payment_method: "stripe_link",
  stripe_customer_id: "cus_...",  // optional
  line_items: [...]
}

// 2. Generate payment link
POST /api/invoices/[id]/stripe-link
{
  description: "Appraisal services"
}

// 3. Send link to client (returned in response)
// 4. Webhook automatically records payment when client pays
// Result: Invoice status = 'paid' (via webhook)
```

### Workflow 3: NET Terms Invoice
```typescript
// 1. Create invoice with NET terms
POST /api/invoices
{
  client_id: "...",
  payment_method: "net_terms",
  line_items: [...]
}

// 2. Send invoice
POST /api/invoices/[id]/send
{
  email: "client@example.com",
  subject: "Invoice #INV-00001"
}

// 3. Client pays via check/ACH/wire
// 4. Record payment manually
POST /api/invoices/[id]/payments
{
  amount: 450.00,
  payment_method: "check",
  reference_number: "CHECK-5678"
}

// Result: Invoice status = 'paid'
```

### Workflow 4: Partial Payments
```typescript
// Record first payment
POST /api/invoices/[id]/payments
{
  amount: 250.00,
  payment_method: "check"
}
// Status: 'partially_paid'

// Record second payment
POST /api/invoices/[id]/payments
{
  amount: 200.00,
  payment_method: "check"
}
// Status: 'paid' (if total >= total_amount)
```

### Workflow 5: Batch Invoicing
```typescript
// Create multiple invoices at once
POST /api/invoices/batch
{
  send_immediately: true,
  invoices: [
    { client_id: "...", payment_method: "net_terms", line_items: [...] },
    { client_id: "...", payment_method: "net_terms", line_items: [...] },
    { client_id: "...", payment_method: "net_terms", line_items: [...] }
  ]
}

// Result: All invoices created and sent in one request
```

## Invoice Status Transitions

```
draft          Initial state
  ↓ send
sent           Invoice sent to client
  ↓ Stripe
viewed         Client viewed invoice
  ↓ partial payment
partially_paid Some payment received
  ↓ full payment
paid           Fully paid
  ↓ past due_date
overdue        Payment overdue

cancelled      Cancelled (no payments)
void           Voided (accounting correction)
```

## Filter Examples

### Find overdue invoices
```typescript
GET /api/invoices?overdue_only=true&sort_by=due_date
```

### Find all Stripe invoices sent this month
```typescript
GET /api/invoices?payment_method=stripe_link&status=sent&date_from=2025-11-01
```

### Search by invoice number or client
```typescript
GET /api/invoices?search=INV-00042
```

### Get invoices for specific client
```typescript
GET /api/invoices?client_id=uuid-here
```

## Report Examples

### See all invoices overdue 90+ days
```typescript
GET /api/reports/outstanding?aging_bucket=90+
```

### Get AR aging for all clients
```typescript
GET /api/reports/aging?sort_by=aged_90_plus&sort_order=desc
```

### Monthly revenue analysis
```typescript
GET /api/reports/revenue?start_month=2025-01&end_month=2025-12&group_by=month
```

### Client payment performance
```typescript
GET /api/reports/client-history/[clientId]
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| BAD_REQUEST | 400 | Business logic violation |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No access to resource |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate or constraint violation |
| INTERNAL_ERROR | 500 | Server error |

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (deleted) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Validation Rules

### Invoice
- `client_id` - Required, must exist and belong to org
- `payment_method` - Required: 'cod', 'stripe_link', or 'net_terms'
- `line_items` - Required, at least one item
- `tax_rate` - Optional, 0-1 range (e.g., 0.08 = 8%)
- `discount_amount` - Optional, non-negative

### COD-Specific
- `cod_collected_by` - Required if payment_method = 'cod'
- `cod_collection_method` - Required if payment_method = 'cod'

### Stripe-Specific
- `stripe_customer_id` - Optional, created if not provided

### Line Items
- `description` - Required, max 500 chars
- `quantity` - Required, positive number
- `unit_price` - Required, non-negative
- `order_id` - Optional, links to order

### Payments
- `amount` - Required, positive, cannot exceed amount_due
- `payment_method` - Required: 'cash', 'check', 'credit_card', 'stripe', 'ach', 'wire', 'money_order', 'other'

## Business Rules

### Cannot Edit
- Paid invoices
- Cancelled invoices
- Voided invoices
- Invoices with payments (cannot change amounts)

### Cannot Delete
- Invoices with payments (voided instead)
- Non-draft invoices (voided instead)

### Cannot Cancel
- Invoices with payments (must void instead)
- Already cancelled/void invoices

### Cannot Record Payment
- Cancelled invoices
- Voided invoices
- Amounts exceeding amount_due

### Cannot Generate Stripe Link
- Non-Stripe payment method invoices
- Paid/cancelled/void invoices
- Zero balance invoices

## Rate Limits

TODO: Implement rate limiting

Recommended:
- Standard endpoints: 100 req/min
- Batch operations: 10 req/min
- Webhooks: Unlimited (verified)

## Pagination Defaults

- Default page: 1
- Default limit: 20
- Max limit: 100
- Sort order: desc
- Sort by: created_at

## Database Views Used

- `outstanding_invoices` - Unpaid/partial with aging
- `invoice_aging_report` - AR aging by client
- `client_payment_history` - Client metrics
- `revenue_recognition` - Revenue by month/status

## Stripe Events Handled

- `invoice.payment_succeeded` ✅ Auto-record payment
- `invoice.payment_failed` ✅ Log failure
- `invoice.finalized` ✅ Update metadata
- `invoice.sent` ✅ Update sent status
- `invoice.voided` ✅ Void invoice

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # For webhooks
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional
NODE_ENV=                       # 'development' shows error details
```

## Testing Endpoints

Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code)
- cURL

Example cURL:
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid-here",
    "payment_method": "net_terms",
    "line_items": [
      {
        "description": "Test Service",
        "quantity": 1,
        "unit_price": 100
      }
    ]
  }'
```

## Next Steps

1. Review [Full API Documentation](./API-ROUTES.md)
2. Check [Implementation Summary](./IMPLEMENTATION-SUMMARY.md)
3. Build frontend components
4. Set up email service
5. Configure Stripe webhooks
6. Write integration tests
