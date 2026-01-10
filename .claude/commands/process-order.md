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

## Step 7: Convert Email to PDF Engagement Letter

Convert the original order email into a PDF document and store it as the engagement letter.

**1. Build HTML from email content:**
```javascript
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .meta { color: #666; margin-bottom: 10px; }
    .subject { font-size: 24px; font-weight: bold; margin: 20px 0; }
    .body { white-space: pre-wrap; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="meta"><strong>From:</strong> ${email.from_name} &lt;${email.from_email}&gt;</div>
    <div class="meta"><strong>Date:</strong> ${new Date(email.received_at).toLocaleString()}</div>
    <div class="meta"><strong>To:</strong> ${email.to_email?.join(', ') || 'N/A'}</div>
    ${email.cc_email?.length ? `<div class="meta"><strong>CC:</strong> ${email.cc_email.join(', ')}</div>` : ''}
    <div class="subject">${email.subject}</div>
  </div>
  <div class="body">${email.body_text || email.body_html || ''}</div>
  <div class="footer">
    <p>Order processed: ${new Date().toLocaleString()}</p>
    <p>Order ID: ${orderId}</p>
  </div>
</body>
</html>`;
```

**2. Convert HTML to PDF using Puppeteer:**
```javascript
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

const pdfBuffer = await page.pdf({
  format: 'Letter',
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  printBackground: true
});

await browser.close();
```

**3. Upload PDF to storage and create document record:**
```javascript
// Generate filename from order number or loan number
const fileName = `Engagement_Letter_${orderNumber}.pdf`;
const filePath = `${tenantId}/orders/${orderId}/${Date.now()}_${fileName}`;

// Upload to Supabase storage
await supabase.storage
  .from('order-documents')
  .upload(filePath, pdfBuffer, { contentType: 'application/pdf' });

// Get the public URL
const { data: urlData } = supabase.storage
  .from('order-documents')
  .getPublicUrl(filePath);

// Get a profile ID for the tenant (for uploaded_by fields)
const { data: profile } = await supabase
  .from('profiles')
  .select('id, org_id')
  .eq('tenant_id', tenantId)
  .limit(1)
  .single();

// Create order_documents record with ALL required fields
await supabase.from('order_documents').insert({
  order_id: orderId,
  tenant_id: tenantId,
  org_id: profile.org_id,
  document_type: 'engagement_letter',
  file_name: fileName,
  file_path: filePath,
  file_url: urlData.publicUrl,
  file_size: pdfBuffer.length,
  mime_type: 'application/pdf',
  uploaded_by: profile.id,
  uploaded_by_id: profile.id
});
```

## Step 8: Ingest Email Attachments

If the email has attachments (PDFs, documents), ingest them into the order's documents.

**Check for attachments:**
```sql
SELECT id, gmail_message_id, attachments, has_attachments
FROM gmail_messages
WHERE id = '<email_id>';
```

**If has_attachments = true and attachments array is not empty:**

1. **Filter for document attachments** (skip small images like signatures):
   ```javascript
   const validAttachments = attachments.filter(a => {
     // Skip small images (likely email signatures)
     if (a.mimeType.startsWith('image/') && a.size < 50000) return false;
     // Keep PDFs, Word docs, Excel, etc.
     return a.mimeType.includes('pdf') ||
            a.mimeType.includes('word') ||
            a.mimeType.includes('excel') ||
            a.mimeType.includes('spreadsheet') ||
            a.size > 100000; // Keep larger files
   });
   ```

2. **For each valid attachment, download from Gmail and upload to order:**
   ```javascript
   // Use the Gmail service to download attachment
   const { GmailService } = require('@/lib/gmail/gmail-service');
   const gmailService = await GmailService.create(orgId);

   // Get profile for uploaded_by fields
   const { data: profile } = await supabase
     .from('profiles')
     .select('id, org_id')
     .eq('tenant_id', tenantId)
     .limit(1)
     .single();

   for (const attachment of validAttachments) {
     // Download from Gmail
     const data = await gmailService.getAttachment(
       gmail_message_id,
       attachment.attachmentId
     );

     if (data) {
       // Upload to Supabase storage
       const filePath = `${tenantId}/orders/${orderId}/${Date.now()}_${attachment.filename}`;
       await supabase.storage
         .from('order-documents')
         .upload(filePath, data, { contentType: attachment.mimeType });

       // Get the public URL
       const { data: urlData } = supabase.storage
         .from('order-documents')
         .getPublicUrl(filePath);

       // Create order_documents record with ALL required fields
       await supabase.from('order_documents').insert({
         order_id: orderId,
         tenant_id: tenantId,
         org_id: profile.org_id,
         document_type: categorizeDocument(attachment.filename),
         file_name: attachment.filename,
         file_path: filePath,
         file_url: urlData.publicUrl,
         file_size: attachment.size,
         mime_type: attachment.mimeType,
         uploaded_by: profile.id,
         uploaded_by_id: profile.id
       });
     }
   }
   ```

3. **Document type categorization:**
   - "plans" / "blueprint" / "construction" → `construction_plans`
   - "budget" / "cost" / "estimate" → `construction_budget`
   - "contract" / "purchase" / "agreement" → `contract`
   - "survey" / "plat" → `survey`
   - Default → `other`

**Report attached documents:**
- List each document uploaded with filename and size
- Note if any attachments failed to download

## Step 9: Update Email as Processed

```sql
UPDATE gmail_messages
SET processed_at = NOW()
WHERE id = '<email_id>';
```

## Step 10: Report & Ask About Invoice

Report what was created:
- Order number and ID
- Property address
- Client name
- Borrower name and contact info
- Related contacts linked (with roles)
- Which contacts were enriched via Apollo
- Which contacts are still missing info
- **Engagement Letter PDF** (converted from original email)
- **Documents uploaded** (list filenames and types from attachments)

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
