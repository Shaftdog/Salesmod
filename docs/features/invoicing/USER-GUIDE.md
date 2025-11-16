---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing Module User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating Invoices](#creating-invoices)
4. [Managing Invoices](#managing-invoices)
5. [Recording Payments](#recording-payments)
6. [Sending Invoices](#sending-invoices)
7. [Reports and Analytics](#reports-and-analytics)
8. [Common Workflows](#common-workflows)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

The Salesmod Invoicing Module is a comprehensive billing system designed for appraisal businesses. It supports multiple payment methods and automates many aspects of invoice and payment management.

### Key Features

- **Multiple Payment Methods**: COD (Cash on Delivery), Stripe Online Payments, Net Terms
- **Automated Invoice Numbering**: Sequential invoice numbers per organization
- **Payment Tracking**: Automatic status updates based on payments received
- **Stripe Integration**: Generate secure payment links for online payments
- **Flexible Line Items**: Invoice for appraisal orders or custom services
- **Reporting**: Outstanding invoices, aging reports, revenue tracking, client history
- **Email Delivery**: Send invoices directly to clients (coming soon)
- **Automatic Calculations**: Subtotals, tax, discounts, and totals calculated automatically

### Payment Methods Explained

1. **COD (Cash on Delivery)**: Collect payment in person with cash, check, or money order
2. **Stripe Link**: Generate online payment links for credit card payments
3. **Net Terms**: Traditional invoicing (e.g., Net 30) - client pays within specified days

---

## Getting Started

### Prerequisites

Before you can create invoices, ensure you have:

- [ ] Active clients in your system
- [ ] Orders or services to invoice for (optional - you can create custom line items)
- [ ] Your organization's default payment terms configured
- [ ] Stripe account connected (if using online payments)

### Understanding Invoice Statuses

Invoices move through different statuses as they're processed:

| Status | Meaning | What You Can Do |
|--------|---------|-----------------|
| **Draft** | Invoice created but not sent | Edit, send, cancel, or void |
| **Sent** | Invoice delivered to client | Mark as viewed, record payments, cancel |
| **Viewed** | Client has opened the invoice | Record payments, follow up |
| **Partially Paid** | Some payment received | Record remaining payment |
| **Paid** | Fully paid | View only (can void if refund needed) |
| **Overdue** | Past due date, not fully paid | Send reminders, record payments |
| **Cancelled** | Invoice cancelled before payment | View only |
| **Void** | Invoice voided (used for refunds) | View only |

---

## Creating Invoices

### Method 1: Create a Single Invoice via API

**Endpoint**: `POST /api/invoices`

#### Step 1: Prepare Invoice Data

You'll need:
- Client ID (UUID of the client)
- Payment method (cod, stripe_link, or net_terms)
- Line items (services/products being invoiced)
- Optional: invoice date, due date, notes, terms

#### Step 2: Send Request

```bash
curl -X POST https://your-domain.com/api/invoices \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-uuid-here",
    "payment_method": "stripe_link",
    "invoice_date": "2025-11-16",
    "line_items": [
      {
        "description": "Residential Appraisal - 123 Main St",
        "quantity": 1,
        "unit_price": 450.00,
        "tax_rate": 0.06
      },
      {
        "description": "Rush Fee",
        "quantity": 1,
        "unit_price": 50.00
      }
    ],
    "notes": "Thank you for your business!",
    "terms_and_conditions": "Payment due within 30 days."
  }'
```

#### Step 3: Review Response

You'll receive a complete invoice object including:
- Invoice number (e.g., INV-2025-00001)
- Calculated totals
- Due date (auto-calculated based on payment terms)
- Invoice ID for future reference

### Method 2: Create Multiple Invoices (Batch)

**Endpoint**: `POST /api/invoices/batch`

Perfect for billing multiple clients at once:

```bash
curl -X POST https://your-domain.com/api/invoices/batch \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoices": [
      {
        "client_id": "client1-uuid",
        "payment_method": "net_terms",
        "line_items": [
          {
            "description": "Monthly Appraisal Services",
            "quantity": 5,
            "unit_price": 450.00
          }
        ]
      },
      {
        "client_id": "client2-uuid",
        "payment_method": "cod",
        "line_items": [
          {
            "description": "Commercial Appraisal",
            "quantity": 1,
            "unit_price": 1200.00
          }
        ]
      }
    ]
  }'
```

The response will show which invoices succeeded and which failed (if any).

### Creating Different Invoice Types

#### COD (Cash on Delivery) Invoice

Required additional fields:
- `cod_collected_by`: Name of person collecting payment
- `cod_collection_method`: cash, check, money_order, or cashiers_check

```json
{
  "client_id": "client-uuid",
  "payment_method": "cod",
  "cod_collected_by": "John Smith",
  "cod_collection_method": "cash",
  "cod_notes": "Collect at property inspection",
  "line_items": [...]
}
```

#### Stripe Payment Link Invoice

Required field:
- `stripe_customer_id`: Stripe customer ID (or will be created automatically)

```json
{
  "client_id": "client-uuid",
  "payment_method": "stripe_link",
  "stripe_customer_id": "cus_ABC123",
  "line_items": [...]
}
```

After creating, generate the payment link (see [Generating Stripe Payment Links](#generating-stripe-payment-links)).

#### Net Terms Invoice

No additional fields required. Due date is calculated based on client's payment terms:

```json
{
  "client_id": "client-uuid",
  "payment_method": "net_terms",
  "line_items": [...]
}
```

### Understanding Line Items

Each line item represents a billable item:

```json
{
  "description": "What you're charging for",
  "quantity": 1,
  "unit_price": 450.00,
  "tax_rate": 0.06,           // Optional: 6% tax
  "order_id": "order-uuid",   // Optional: link to appraisal order
  "line_order": 1             // Optional: display order
}
```

**Calculations**:
- Line Item Amount = quantity × unit_price
- Tax = amount × tax_rate
- Invoice Subtotal = sum of all line item amounts
- Invoice Tax = sum of all line item taxes
- Invoice Total = subtotal + tax - discount

### Adding Discounts

Apply a discount to the entire invoice:

```json
{
  "client_id": "client-uuid",
  "payment_method": "net_terms",
  "discount_amount": 50.00,  // $50 off total
  "line_items": [...]
}
```

---

## Managing Invoices

### Viewing Invoices

**Endpoint**: `GET /api/invoices`

#### List All Invoices

```bash
curl https://your-domain.com/api/invoices \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Filter Invoices

```bash
# Get only unpaid invoices
curl "https://your-domain.com/api/invoices?status=sent&status=overdue" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Get invoices for a specific client
curl "https://your-domain.com/api/invoices?client_id=client-uuid" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Get overdue invoices
curl "https://your-domain.com/api/invoices?overdue_only=true" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Search by invoice number or client name
curl "https://your-domain.com/api/invoices?search=Smith" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Sort and Paginate

```bash
# Get page 2, 50 results per page, sorted by due date
curl "https://your-domain.com/api/invoices?page=2&limit=50&sort_by=due_date&sort_order=asc" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### View Single Invoice Details

**Endpoint**: `GET /api/invoices/{invoice_id}`

```bash
curl https://your-domain.com/api/invoices/invoice-uuid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns complete invoice with:
- Client information
- All line items
- Payment history
- Calculated totals
- Status information

### Updating an Invoice

**Endpoint**: `PATCH /api/invoices/{invoice_id}`

You can update certain fields on draft or sent invoices:

```bash
curl -X PATCH https://your-domain.com/api/invoices/invoice-uuid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "due_date": "2025-12-15",
    "notes": "Updated payment instructions",
    "discount_amount": 25.00
  }'
```

**Note**: You cannot update paid, cancelled, or void invoices.

### Deleting an Invoice

**Endpoint**: `DELETE /api/invoices/{invoice_id}`

```bash
curl -X DELETE https://your-domain.com/api/invoices/invoice-uuid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Restrictions**:
- Can only delete draft invoices
- Cannot delete invoices with payments
- Cannot delete sent, paid, or void invoices (cancel or void instead)

### Cancelling an Invoice

**Endpoint**: `POST /api/invoices/{invoice_id}/cancel`

Use when invoice was sent in error or is no longer valid:

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/cancel \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Client cancelled order"
  }'
```

**Restrictions**:
- Cannot cancel paid invoices (void instead)
- Cannot cancel if any payments have been received

---

## Recording Payments

### Manual Payment Entry

**Endpoint**: `POST /api/invoices/{invoice_id}/payments`

Use this to record payments received outside the system (cash, check, wire transfer):

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/payments \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 450.00,
    "payment_method": "check",
    "payment_date": "2025-11-16",
    "reference_number": "Check #1234",
    "notes": "Received via mail"
  }'
```

**Payment Methods**:
- `cash`
- `check`
- `credit_card`
- `stripe` (automatic via webhook)
- `ach`
- `wire`
- `money_order`
- `other`

### Quick Mark as Paid

**Endpoint**: `POST /api/invoices/{invoice_id}/mark-paid`

Shortcut to mark invoice as fully paid:

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/mark-paid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "cash",
    "payment_date": "2025-11-16",
    "reference_number": "Receipt #5678"
  }'
```

This automatically:
- Creates a payment record for the full amount due
- Updates invoice status to "paid"
- Records the payment date and method

### Partial Payments

Simply record the partial amount:

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/payments \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200.00,
    "payment_method": "check",
    "notes": "Partial payment - remainder due in 2 weeks"
  }'
```

The invoice will automatically:
- Update to "partially_paid" status
- Update `amount_paid` to $200
- Update `amount_due` to remaining balance
- Show payment in payment history

### Viewing Payment History

**Endpoint**: `GET /api/invoices/{invoice_id}/payments`

```bash
curl https://your-domain.com/api/invoices/invoice-uuid/payments \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns all payments for that invoice with:
- Payment amounts and dates
- Payment methods
- Reference numbers
- Timestamps

### Updating a Payment

**Endpoint**: `PATCH /api/payments/{payment_id}`

```bash
curl -X PATCH https://your-domain.com/api/payments/payment-uuid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference_number": "Updated Check #1234A",
    "notes": "Corrected check number",
    "is_reconciled": true
  }'
```

### Deleting a Payment

**Endpoint**: `DELETE /api/payments/{payment_id}`

```bash
curl -X DELETE https://your-domain.com/api/payments/payment-uuid \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

This will:
- Remove the payment record
- Update invoice `amount_paid` and `amount_due`
- Potentially change invoice status (e.g., paid → partially_paid)

---

## Sending Invoices

### Generating Stripe Payment Links

**Endpoint**: `POST /api/invoices/{invoice_id}/stripe-link`

For Stripe payment method invoices, generate a secure payment link:

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/stripe-link \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "client@example.com",
    "description": "Invoice #INV-2025-00001",
    "metadata": {
      "client_name": "John Smith",
      "property": "123 Main St"
    }
  }'
```

This will:
1. Create a Stripe customer (if needed)
2. Create a Stripe invoice with all line items
3. Generate a secure payment link
4. Store the link in your invoice

**Response**:
```json
{
  "payment_link": "https://invoice.stripe.com/i/acct_xxx/live_xxx",
  "stripe_invoice_id": "in_xxx",
  "expires_at": "2025-12-16T00:00:00Z"
}
```

**Share this link** with your client via email, SMS, or any communication method.

### Sending Invoice via Email (Coming Soon)

**Endpoint**: `POST /api/invoices/{invoice_id}/send`

Once email integration is complete, send invoices directly:

```bash
curl -X POST https://your-domain.com/api/invoices/invoice-uuid/send \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

This will:
- Email the invoice to the client's email address
- Include payment link (for Stripe invoices)
- Update status to "sent"
- Record the send timestamp

### Batch Send Multiple Invoices

**Endpoint**: `POST /api/invoices/batch-send`

Send multiple invoices at once:

```bash
curl -X POST https://your-domain.com/api/invoices/batch-send \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_ids": [
      "invoice-uuid-1",
      "invoice-uuid-2",
      "invoice-uuid-3"
    ]
  }'
```

---

## Reports and Analytics

### Outstanding Invoices Report

**Endpoint**: `GET /api/reports/outstanding`

View all unpaid invoices:

```bash
curl "https://your-domain.com/api/reports/outstanding" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns:
- List of all invoices with outstanding balances
- Total outstanding amount
- Breakdown by client
- Days overdue for each invoice

### Aging Report

**Endpoint**: `GET /api/reports/aging`

See how old your outstanding invoices are:

```bash
curl "https://your-domain.com/api/reports/aging" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns invoices grouped by age:
- **Current**: Not yet due
- **1-30 Days**: 1-30 days overdue
- **31-60 Days**: 31-60 days overdue
- **61-90 Days**: 61-90 days overdue
- **90+ Days**: Over 90 days overdue

Example output:
```json
{
  "summary": {
    "total_outstanding": 15750.00,
    "current": 5000.00,
    "days_1_30": 4500.00,
    "days_31_60": 3250.00,
    "days_61_90": 2000.00,
    "days_90_plus": 1000.00
  },
  "invoices": [...]
}
```

### Revenue Report

**Endpoint**: `GET /api/reports/revenue`

Track your income over time:

```bash
# Revenue for specific date range
curl "https://your-domain.com/api/reports/revenue?start_date=2025-01-01&end_date=2025-11-16" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Revenue by client
curl "https://your-domain.com/api/reports/revenue?group_by=client" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Revenue by payment method
curl "https://your-domain.com/api/reports/revenue?group_by=payment_method" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns:
- Total revenue for period
- Number of invoices
- Average invoice amount
- Revenue by category (if grouped)
- Payment status breakdown

### Client Payment History

**Endpoint**: `GET /api/reports/client-history/{client_id}`

View complete payment history for a specific client:

```bash
curl "https://your-domain.com/api/reports/client-history/client-uuid" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Returns:
- All invoices for this client
- Total invoiced amount
- Total paid amount
- Outstanding balance
- Payment patterns
- Average days to pay

---

## Common Workflows

### Workflow 1: Bill Client for Completed Appraisal (Stripe)

1. **Create Invoice** with Stripe payment method
   ```bash
   POST /api/invoices
   {
     "client_id": "...",
     "payment_method": "stripe_link",
     "line_items": [
       {
         "order_id": "appraisal-order-uuid",
         "description": "Residential Appraisal - 123 Main St",
         "quantity": 1,
         "unit_price": 450.00
       }
     ]
   }
   ```

2. **Generate Payment Link**
   ```bash
   POST /api/invoices/{id}/stripe-link
   {
     "customer_email": "client@example.com"
   }
   ```

3. **Send Link to Client** (copy payment link from response)

4. **Wait for Payment** (automatic via Stripe webhook)
   - Client pays online
   - Stripe webhook notifies system
   - Payment recorded automatically
   - Invoice status → "paid"

### Workflow 2: Collect COD Payment

1. **Create COD Invoice**
   ```bash
   POST /api/invoices
   {
     "client_id": "...",
     "payment_method": "cod",
     "cod_collected_by": "Field Appraiser Name",
     "cod_collection_method": "cash",
     "line_items": [...]
   }
   ```

2. **Collect Payment in Person** at property

3. **Mark as Paid**
   ```bash
   POST /api/invoices/{id}/mark-paid
   {
     "payment_method": "cash",
     "reference_number": "Receipt #1234"
   }
   ```

### Workflow 3: Net Terms Invoice with Partial Payments

1. **Create Net Terms Invoice**
   ```bash
   POST /api/invoices
   {
     "client_id": "...",
     "payment_method": "net_terms",
     "line_items": [...]
   }
   ```

2. **Send Invoice to Client** (when email is available)

3. **Record First Partial Payment**
   ```bash
   POST /api/invoices/{id}/payments
   {
     "amount": 500.00,
     "payment_method": "check",
     "reference_number": "Check #5001"
   }
   ```
   Status → "partially_paid"

4. **Record Final Payment**
   ```bash
   POST /api/invoices/{id}/payments
   {
     "amount": 450.00,
     "payment_method": "check",
     "reference_number": "Check #5015"
   }
   ```
   Status → "paid"

### Workflow 4: Monthly Batch Billing

Perfect for clients with recurring services:

1. **Create Batch Invoices**
   ```bash
   POST /api/invoices/batch
   {
     "invoices": [
       {
         "client_id": "client1-uuid",
         "payment_method": "net_terms",
         "line_items": [
           {
             "description": "November Appraisal Services",
             "quantity": 8,
             "unit_price": 450.00
           }
         ]
       },
       {
         "client_id": "client2-uuid",
         "payment_method": "net_terms",
         "line_items": [...]
       }
       // ... more clients
     ]
   }
   ```

2. **Review Results** (check for any failures)

3. **Send All Invoices**
   ```bash
   POST /api/invoices/batch-send
   {
     "invoice_ids": ["uuid1", "uuid2", "uuid3", ...]
   }
   ```

4. **Monitor Payments** using Outstanding Invoices Report

### Workflow 5: Handle Overdue Invoices

1. **Check Aging Report**
   ```bash
   GET /api/reports/aging
   ```

2. **Identify Problem Invoices** (60+ days overdue)

3. **Contact Clients** with overdue balances

4. **Set Up Payment Plans** if needed:
   - Record partial payments as received
   - Update notes with payment agreement

5. **Void if Uncollectible** (last resort):
   ```bash
   POST /api/invoices/{id}/cancel
   {
     "reason": "Uncollectible - client out of business"
   }
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### "Client not found or access denied"

**Problem**: The client ID doesn't exist or belongs to another organization.

**Solutions**:
- Verify the client UUID is correct
- Ensure client exists: `GET /api/clients/{client_id}`
- Check that you're using the correct organization's auth token

#### "Invoice number generation failed"

**Problem**: Database sequence error or permission issue.

**Solutions**:
- Check database migration ran successfully
- Verify `invoice_number_sequences` table exists
- Check database logs for errors

#### "Cannot update invoice with status: paid"

**Problem**: Trying to modify a paid invoice.

**Solutions**:
- Cannot edit paid invoices
- To correct errors, void the invoice and create a new one
- For refunds, record a negative payment or void the invoice

#### "Payment amount exceeds invoice total"

**Problem**: Trying to record a payment larger than what's owed.

**Solutions**:
- Check current `amount_due` on the invoice
- Verify you're not recording the same payment twice
- Consider if this is a prepayment for future invoices (not currently supported)

#### "Stripe payment link generation failed"

**Problem**: Stripe API error or missing configuration.

**Solutions**:
- Verify `STRIPE_SECRET_KEY` environment variable is set
- Check Stripe account is active
- Ensure client has valid email address
- Review Stripe dashboard for API errors

#### "Invoice status not updating after payment"

**Problem**: Database trigger may not be firing or payment not recorded correctly.

**Solutions**:
- Check that payment was actually saved: `GET /api/invoices/{id}/payments`
- Verify payment amount is correct
- Check database logs for trigger errors
- Manually update if needed: `PATCH /api/invoices/{id}`

#### "Cannot send invoice - client has no email"

**Problem**: Client record missing email address.

**Solutions**:
- Update client record with email address
- For now, manually send payment link from Stripe response
- Generate payment link and share via other methods (SMS, phone)

### Getting Help

If you encounter issues not covered here:

1. **Check API Response**: Error messages usually indicate the problem
2. **Review Documentation**: See [API-ROUTES.md](./API-ROUTES.md) for detailed API specs
3. **Check Logs**: Application logs often show more detail
4. **Database State**: Query the database directly if you have access
5. **Contact Support**: Provide invoice ID, error message, and steps to reproduce

### Best Practices

1. **Always validate client exists** before creating invoices
2. **Use batch operations** for multiple invoices to save time
3. **Record payments promptly** to keep status current
4. **Review aging report weekly** to stay on top of collections
5. **Back up data regularly** especially before major operations
6. **Test in staging first** if available
7. **Keep notes updated** on invoices for future reference
8. **Reconcile regularly** with your accounting system

---

## Appendix: Quick Reference

### Invoice Statuses

| Status | Can Edit? | Can Delete? | Can Cancel? | Can Void? |
|--------|-----------|-------------|-------------|-----------|
| draft | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| sent | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes |
| viewed | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes |
| partially_paid | ❌ No | ❌ No | ❌ No | ✅ Yes |
| paid | ❌ No | ❌ No | ❌ No | ✅ Yes |
| overdue | ⚠️ Limited | ❌ No | ✅ Yes | ✅ Yes |
| cancelled | ❌ No | ❌ No | ❌ No | ❌ No |
| void | ❌ No | ❌ No | ❌ No | ❌ No |

### API Endpoints Quick List

| Action | Method | Endpoint |
|--------|--------|----------|
| List invoices | GET | `/api/invoices` |
| Create invoice | POST | `/api/invoices` |
| Get invoice | GET | `/api/invoices/{id}` |
| Update invoice | PATCH | `/api/invoices/{id}` |
| Delete invoice | DELETE | `/api/invoices/{id}` |
| Cancel invoice | POST | `/api/invoices/{id}/cancel` |
| Mark paid | POST | `/api/invoices/{id}/mark-paid` |
| Send invoice | POST | `/api/invoices/{id}/send` |
| Generate Stripe link | POST | `/api/invoices/{id}/stripe-link` |
| Record payment | POST | `/api/invoices/{id}/payments` |
| List payments | GET | `/api/invoices/{id}/payments` |
| Update payment | PATCH | `/api/payments/{id}` |
| Delete payment | DELETE | `/api/payments/{id}` |
| Batch create | POST | `/api/invoices/batch` |
| Batch send | POST | `/api/invoices/batch-send` |
| Outstanding report | GET | `/api/reports/outstanding` |
| Aging report | GET | `/api/reports/aging` |
| Revenue report | GET | `/api/reports/revenue` |
| Client history | GET | `/api/reports/client-history/{id}` |

### Payment Methods

| Code | Description | Use Case |
|------|-------------|----------|
| `cod` | Cash on Delivery | Field collection, in-person payments |
| `stripe_link` | Stripe Payment Link | Online credit card payments |
| `net_terms` | Net Terms (e.g., Net 30) | Traditional invoicing, corporate clients |

### Payment Types (for recording payments)

- `cash` - Cash payment
- `check` - Check payment
- `credit_card` - Credit card (not via Stripe)
- `stripe` - Stripe payment (automatic)
- `ach` - ACH/bank transfer
- `wire` - Wire transfer
- `money_order` - Money order
- `other` - Other payment method

---

## Need More Help?

- **Technical Documentation**: See [API-ROUTES.md](./API-ROUTES.md)
- **Deployment Guide**: See [DEPLOYMENT-INSTRUCTIONS.md](./DEPLOYMENT-INSTRUCTIONS.md)
- **Testing Guide**: See [TESTING-RESULTS.md](./TESTING-RESULTS.md)
- **System Design**: See [INVOICING_SYSTEM_DESIGN.md](./INVOICING_SYSTEM_DESIGN.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Module Version**: Invoicing v1.0
