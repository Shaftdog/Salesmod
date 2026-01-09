---
description: Process an email from Processed Emails into an order with borrower info
---

Process an appraisal order from the Processed Emails kanban board.

**Arguments:** $ARGUMENTS (email ID, or "latest" to find the most recent unprocessed email)

## Step 1: Find the Email

Query the `gmail_messages` table to find the email:
- If argument is "latest", find the most recent unprocessed email
- If argument is an ID, find that specific email

```sql
SELECT id, subject, from_email, from_name, to_email, cc_email, body_text, received_at
FROM gmail_messages
WHERE id = '<email_id>' OR (argument = 'latest' AND processed_at IS NULL)
ORDER BY received_at DESC
LIMIT 1
```

## Step 2: Extract Order Details

From the email body, extract:
- **Property:** address, city, state, zip
- **Client/AMC:** company name, contact name, email, phone
- **Borrower:** name, email, phone, company/entity name (CRITICAL for invoicing)
- **Loan Info:** loan number, loan type, loan purpose, loan amount
- **Order Details:** product type, due date, fee amount, special instructions
- **Named Contacts:** property contact, realtor, loan officer, processor if mentioned

## Step 3: Extract Email Recipients

**From the email headers, extract ALL recipients:**

1. **From (Sender)** → Role: `orderer`
   - `from_email`: The sender's email
   - `from_name`: The sender's name

2. **To (Recipients)** → Role: `cc` (unless it's your email)
   - `to_email`: Array of recipient emails
   - Skip internal emails (rod@myroihome.com, admin@roiappraise.com)

3. **CC (Carbon Copy)** → Role: `cc`
   - `cc_email`: Array of CC'd emails
   - Skip internal emails

**Build a contacts list:**
```javascript
const contactsFromEmail = [];

// Add sender as orderer
if (from_name && from_email) {
  contactsFromEmail.push({
    fullName: from_name,
    email: from_email,
    role: 'orderer',
    companyName: extractDomainCompany(from_email) // e.g., "ifundcities.com" → "iFund Cities"
  });
}

// Add CC recipients
for (const ccEmail of cc_email || []) {
  if (!isInternalEmail(ccEmail)) {
    contactsFromEmail.push({
      email: ccEmail,
      fullName: null, // Will need enrichment
      role: 'cc',
      companyName: extractDomainCompany(ccEmail)
    });
  }
}
```

## Step 4: Match or Create Client

Query `clients` table by company name or domain:
- If found with placeholder data (email ending in @imported.local), UPDATE with real info
- If not found, create new client
- Ensure billing_email_confirmed = true if we have a real email

## Step 5: Create the Order

Insert into `orders` table with proper values. IMPORTANT - respect CHECK constraints:
- `status`: Use 'pending' (NOT 'new')
- `order_type`: Use 'purchase', 'refinance', 'cash_out_refinance', 'construction', 'land', 'other'
- `scope_of_work`: Use 'desktop', 'exterior_only', 'interior', 'land', 'rent_survey', 'commercial', 'review'
- `billing_method`: Use 'online', 'bill', 'cod'

Include ALL borrower fields:
- `borrower_name` - Full name of borrower
- `borrower_email` - Borrower's email
- `borrower_phone` - Borrower's phone

## Step 6: Link Related Contacts with Apollo Enrichment

For each contact, check if we have complete information. If not, use Apollo to enrich.

**Process:**
1. For each contact from email (sender + CCs):
   - Check if contact exists in `contacts` table by email
   - If exists but missing info (no phone, no name), try Apollo enrichment
   - If doesn't exist, try Apollo enrichment before creating

2. **Apollo Enrichment** (for contacts missing name or phone):
   ```javascript
   // Use the order-contacts service which has built-in Apollo support
   const { createOrderContacts } = require('@/lib/services/order-contacts');

   await createOrderContacts({
     orderId: orderId,
     clientId: clientId,
     tenantId: tenantId,
     contacts: [
       {
         fullName: "Dan Timmins", // or parsed from email
         email: "dan.timmins@ifundcities.com",
         phone: null, // Apollo will try to find this
         role: "cc",
         companyName: "iFund Cities" // Helps Apollo match
       }
     ]
   });
   ```

3. **Manual Apollo lookup** (if service doesn't have contact):
   ```sql
   -- Check if contact needs enrichment
   SELECT id, first_name, last_name, email, phone
   FROM contacts
   WHERE email = 'dan.timmins@ifundcities.com'
   AND (phone IS NULL OR first_name IS NULL);
   ```

   If found with missing data, call Apollo API:
   ```javascript
   const { enrichContactWithApollo } = require('@/lib/research/apollo-enrichment');

   const result = await enrichContactWithApollo({
     first_name: "Dan",
     last_name: "Timmins",
     organization_name: "iFund Cities",
     domain: "ifundcities.com"
   });

   if (result.person) {
     // Update contact with enriched data
     const phone = result.person.phone_numbers?.[0]?.sanitized_number;
     const title = result.person.title;

     await updateContact(contactId, { phone, title });
   }
   ```

4. **Link to order** via `order_contacts` table:
   ```sql
   INSERT INTO order_contacts (order_id, contact_id, tenant_id, role_code, is_primary)
   VALUES ($1, $2, $3, $4, false)
   ON CONFLICT (order_id, contact_id) DO NOTHING;
   ```

**Role assignments:**
- `orderer` - The person who sent the email (From field)
- `cc` - Anyone in To or CC fields (except internal emails)
- `loan_officer` - If identified as loan officer in email signature/body
- `processor` - If identified as processor
- `borrower` - The borrower mentioned in order details
- `realtor` - If a realtor is mentioned
- `property_contact` - Contact for property access

## Step 7: Update Email as Processed

```sql
UPDATE gmail_messages
SET processed_at = NOW()
WHERE id = '<email_id>';
```

## Step 8: Report & Ask About Invoice

Report what was created:
- Order number and ID
- Property address
- Client name
- Borrower name and contact info
- Related contacts linked (with roles)
- Which contacts were enriched via Apollo
- Which contacts are still missing info

Then ask: "Would you like me to generate an invoice for this order? The borrower info will be used as the payer (Bill To) on the invoice."

If yes, invoke `/generate-invoice [order-id]`

## Database Connection

Read credentials from `.env.local`:
```
DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres
APOLLO_API_KEY=<from .env.local>
```

## Internal Email Filter

Skip these when adding contacts:
- rod@myroihome.com
- admin@roiappraise.com
- Any @myroihome.com or @roiappraise.com domain

## Apollo Enrichment Priority

Enrich contacts in this order:
1. **Loan Officers** - High value, often missing direct phone
2. **Processors** - Frequently need to contact them
3. **CC'd contacts** - May only have email from the CC field
4. **Orderer** - Usually already have full info from client record

## Important Notes

- NEVER make up fake data - only use what's in the email or from Apollo
- If borrower info is missing, note it but still create the order
- Always update clients with real info if they have placeholder data
- The borrower info is critical for invoicing - capture it accurately
- Capture ALL email addresses from From, To, CC fields to link as related contacts
- Use Apollo enrichment for contacts missing phone numbers or full names
- Related contacts can be viewed/managed in the "Related Contacts" section on the order detail page
- Report which contacts were successfully enriched and which still need manual entry
