---
description: Process an email from Processed Emails into an order with borrower info
---

Process an appraisal order from the Processed Emails kanban board.

**Arguments:** $ARGUMENTS (email ID, or "latest" to find the most recent unprocessed email)

## Step 1: Find the Email

Query the `cards` table for emails in the "Processed Emails" board (category = 'processed_emails' or similar).
- If argument is "latest", find the most recent card not in 'done' state
- If argument is an ID, find that specific card
- Read the card content/props to get the email details

## Step 2: Extract Order Details

From the email, extract:
- **Property:** address, city, state, zip
- **Client/AMC:** company name, contact name, email, phone
- **Borrower:** name, email, phone, company/entity name (THIS IS CRITICAL for invoicing)
- **Loan Info:** loan number, loan type, loan purpose, loan amount
- **Order Details:** product type, due date, fee amount, special instructions
- **Contacts:** property contact, realtor, loan officer if available
- **CC'd Contacts:** Extract all email addresses from To, CC, and From fields for linking to order

## Step 3: Match or Create Client

Query `clients` table by company name or domain:
- If found with placeholder data (email ending in @imported.local, phone 000-000-0000), UPDATE with real info
- If not found, create new client
- Ensure billing_email_confirmed = true if we have a real email

## Step 4: Create the Order

Insert into `orders` table with proper values. IMPORTANT - respect CHECK constraints:
- `status`: Use 'pending' (NOT 'new')
- `order_type`: Use 'purchase', 'refinance', 'cash_out_refinance', 'construction', 'land', 'other'
- `scope_of_work`: Use 'desktop', 'exterior_only', 'interior', 'land', 'rent_survey', 'commercial', 'review'
- `billing_method`: Use 'online', 'bill', 'cod'
- `new_construction_type`: Use 'community_builder', 'spec_custom', 'refinance_newly_constructed' or NULL

Include ALL borrower fields:
- `borrower_name` - Full name of borrower
- `borrower_email` - Borrower's email
- `borrower_phone` - Borrower's phone
- `property_contact_name`, `property_contact_email`, `property_contact_phone` - Usually same as borrower

Set `fee_amount`, `due_date`, `created_by` (use Rod's profile ID).

## Step 5: Link Related Contacts

For each contact extracted from the email, add them to the order's related contacts:

**Using the API** (POST to `/api/orders/[orderId]/contacts`):
```json
{
  "contacts": [
    { "fullName": "Milan Au", "email": "millan.au@ifundcities.com", "role": "orderer" },
    { "fullName": "Jane Doe", "email": "jane@example.com", "role": "cc" },
    { "fullName": "John Smith", "email": "john@lender.com", "phone": "555-1234", "role": "loan_officer" }
  ]
}
```

**Role assignments:**
- `orderer` - The person who placed the order (usually main client contact)
- `cc` - Anyone CC'd on the email
- `loan_officer` - If identified as loan officer in email
- `processor` - If identified as processor
- `borrower` - The borrower (also captured in order fields)
- `realtor` - If a realtor is mentioned
- `property_contact` - Contact for property access

The API will:
- Match existing contacts by email or create new ones
- Link them to the order with the specified role
- Handle deduplication automatically

## Step 6: Update Kanban Card

Move the email card to 'done' state:
- Set `state = 'done'`
- Set `executed_at = NOW()`

## Step 7: Report & Ask About Invoice

Report what was created:
- Order number and ID
- Property address
- Client name
- Borrower name and contact info
- Related contacts linked (with roles)

Then ask: "Would you like me to generate an invoice for this order? The borrower info will be used as the payer (Bill To) on the invoice."

If yes, invoke `/generate-invoice [order-id]`

## Database Connection

Read credentials from `.env.local`:
```
DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

Use the `pg` npm package for direct database queries when needed.

## Important Notes

- NEVER make up fake data - only use what's in the email
- If borrower info is missing, note it but still create the order
- Always update clients with real info if they have placeholder data
- The borrower info is critical for invoicing - capture it accurately
- Capture ALL email addresses from To, CC, From fields to link as related contacts
- Related contacts can be viewed/managed in the "Related Contacts" section on the order detail page
