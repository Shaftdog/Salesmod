---
description: Generate an invoice from an order with borrower as payer (Bill To)
---

Generate an invoice for an appraisal order, using the borrower info as the payer.

**Arguments:** $ARGUMENTS (order ID or order number)

## Step 1: Find the Order

Query the `orders` table to find the order by ID or order_number.

Retrieve:
- Order details: id, order_number, property_address, fee_amount, client_id
- Borrower info: borrower_name, borrower_email, borrower_phone
- Property contact: property_contact_name, property_contact_email, property_contact_phone
- Client info via join

## Step 2: Get Client Details

Query the `clients` table for the client associated with the order:
- company_name, email, phone, address
- Verify billing_email_confirmed = true or billing_contact_id is set

If client has placeholder email (@imported.local) or phone (000-000-0000), warn the user.

## Step 3: Create the Invoice

Insert into `invoices` table:

```sql
INSERT INTO invoices (
  org_id,
  tenant_id,
  client_id,
  order_id,
  payment_method,
  invoice_date,
  due_date,
  notes,
  -- Payer fields (borrower = Bill To)
  payer_company,
  payer_name,
  payer_email,
  payer_phone,
  created_by,
  updated_by
) VALUES (
  '<org_id>',
  '<tenant_id>',
  '<client_id>',
  '<order_id>',
  'stripe_link',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  'Appraisal fee for <property_address>. Payment required prior to inspection.',
  -- Use borrower info or entity name for payer
  '<borrower_company_or_entity>',
  '<borrower_name>',
  '<borrower_email>',
  '<borrower_phone>',
  '<org_id>',
  '<org_id>'
)
```

## Step 4: Create Line Items

Insert into `invoice_line_items`:

```sql
INSERT INTO invoice_line_items (
  tenant_id,
  invoice_id,
  order_id,
  description,
  quantity,
  unit_price,
  amount,
  line_order
) VALUES (
  '<tenant_id>',
  '<invoice_id>',
  '<order_id>',
  'Full Interior Appraisal - 1004 with 1007 & Market Conditions (ARV/ASIS/Rent Analysis) - <property_address>',
  1,
  <fee_amount>,
  <fee_amount>,
  0
)
```

## Step 5: Calculate Totals

Update the invoice with calculated totals:
- subtotal = sum of line item amounts
- total_amount = subtotal (no tax)
- amount_due = total_amount

## Step 6: Report & Ask About Sending

Report the created invoice:
- Invoice number
- Client (Ordered By): company name, email, phone, address
- Payer (Bill To): borrower company/name, email, phone
- Amount: $X.XX
- Due date

Then ask: "Send this invoice to:
1. Client email (millan@ifundcities.com) - they forward to borrower
2. Borrower email (team@oxondevelopment.com) - direct to payer
3. Custom email address
4. Don't send yet"

## Step 7: Send Invoice (if requested)

If sending, use the Resend API to send the invoice email:
- Include both "Ordered By" and "Bill To" sections in email
- Use the view_token link for the invoice
- Subject: "Invoice <INV-NUMBER> from ROI Home Services"

## Database Connection

Read credentials from `.env.local`:
```
DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres
RESEND_API_KEY=re_DHW5JkqA_LQMqCfpjvdxWippyG3UT7MP4
```

## Important Notes

- NEVER make up fake borrower data - only use what's on the order
- If borrower info is missing, create invoice without payer fields (traditional Bill To = client)
- The payer_company should be the borrower's entity/company if available, otherwise use borrower_name
- Always include property address in the line item description and notes
- Default payment terms: 7 days (payment required prior to inspection)
