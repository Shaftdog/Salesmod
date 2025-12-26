# CRITICAL BUG: Invoice View Tracking Feature Broken

**Test Date**: 2025-12-15
**Tested By**: Claude Code (Automated Testing Agent)
**Application URL**: http://localhost:9002
**Test Spec**: `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/invoice-view-tracking.spec.ts`

## Summary

**Status**: ❌ CRITICAL FAILURE
**Severity**: HIGH - Public invoice viewing feature is completely non-functional
**Impact**: Clients cannot view invoices sent to them

## Test Flow Executed

### ✅ Step 1: Login - PASSED
- Successfully logged in with rod@myroihome.com
- Redirected to dashboard at http://localhost:9002/dashboard

### ✅ Step 2: Navigate to Invoicing - PASSED
- Successfully navigated to http://localhost:9002/finance/invoicing
- Invoice list loaded correctly with 20 invoices visible

### ✅ Step 3: Find Sent Invoice - PASSED
- Found invoice INV-00021 with status "Sent"
- Client: Plains Commerce Bank
- Amount: $300.00

### ✅ Step 4: Navigate to Invoice Detail - PASSED
- Clicked on invoice number link
- Successfully navigated to http://localhost:9002/finance/invoicing/9050b103-26ed-4ec4-8aa0-b2dcda0efdb8
- Invoice detail page loaded

### ✅ Step 5: Extract View Token - PASSED
- Successfully called API: `/api/invoices/9050b103-26ed-4ec4-8aa0-b2dcda0efdb8`
- Received view token: `eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0`
- Generated public URL: http://localhost:9002/invoices/view/eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0

### ❌ Step 6: Public Invoice View - FAILED
**This is where the critical bug occurs**

**Expected Behavior**:
- Public invoice page should display invoice details
- Should show invoice number, client info, line items, totals
- Should have professional layout without app sidebar/header
- Should display "Pay Now" button for unpaid invoices

**Actual Behavior**:
- Page shows "Invoice Not Found" error message
- Red alert icon displayed
- Error text: "Invoice not found"
- No invoice details rendered

**Screenshot Evidence**: `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-tracking/07-public-view.png`

## Root Cause Analysis

### Bug Location
**File**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/api/invoices/view/[token]/route.ts`
**API Endpoint**: `GET /api/invoices/view/[token]`
**Lines**: 34-79

### Root Cause CONFIRMED

Diagnostic testing revealed TWO issues with the Supabase query:

#### Issue 1: Ambiguous Foreign Key Reference
**Error Code**: `PGRST201`
**Error Message**: "Could not embed because more than one relationship was found for 'invoices' and 'profiles'"

The invoices table has **three** foreign keys referencing profiles:
- `invoices.org_id` → `profiles.id` (invoices_org_id_fkey)
- `invoices.created_by` → `profiles.id` (invoices_created_by_fkey)
- `invoices.updated_by` → `profiles.id` (invoices_updated_by_fkey)

When using `org:profiles(...)` in the query, Supabase doesn't know which relationship to use.

**Supabase's hint**: Use `profiles!invoices_org_id_fkey` instead of `profiles` to specify the exact relationship.

#### Issue 2: Missing Column in profiles Table
**Error Code**: `42703`
**Error Message**: "column profiles.company_name does not exist"

The query requests `company_name` from the profiles table, but this column doesn't exist in the schema.

**Available columns in profiles**: id, email, phone (and likely others, but NOT company_name)

### Evidence

**API Test Result**:
```bash
$ curl http://localhost:9002/api/invoices/view/eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0
{"error": "Invoice not found"}
```

**Known Working Data**:
- Invoice ID: `9050b103-26ed-4ec4-8aa0-b2dcda0efdb8`
- View Token: `eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0`
- Status: `sent`
- The invoice EXISTS and has a valid view_token (confirmed via `/api/invoices/[id]` endpoint)

**Direct Invoice API** (this works):
```json
{
  "data": {
    "id": "9050b103-26ed-4ec4-8aa0-b2dcda0efdb8",
    "view_token": "eed62e86198cdf03643215a403d94bf164bac16078efb489da2c4b8a1a7ab6e0",
    "invoice_number": "INV-00021",
    "status": "sent",
    // ...works fine
  }
}
```

## Recommended Fixes

### EXACT FIX REQUIRED

**File**: `src/app/api/invoices/view/[token]/route.ts`
**Lines**: 71-76

#### Fix #1: Specify the Foreign Key Relationship
Change line 71 from:
```typescript
org:profiles(
```

To:
```typescript
org:profiles!invoices_org_id_fkey(
```

This tells Supabase to use the `org_id` foreign key relationship specifically, instead of being ambiguous.

#### Fix #2: Remove company_name from profiles query
The profiles table doesn't have a `company_name` column. Either:

**Option A**: Remove company_name from the query
```typescript
org:profiles!invoices_org_id_fkey(
  id,
  email,
  phone
)
```

**Option B**: Get company_name from a different source
If company name is stored in another table (tenants, organizations), join to that table instead.

### Complete Fixed Query

Replace lines 34-79 with:

```typescript
// Find the invoice by view token
const { data: invoice, error: fetchError } = await supabase
  .from('invoices')
  .select(`
    id,
    invoice_number,
    invoice_date,
    due_date,
    status,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    amount_paid,
    amount_due,
    payment_method,
    notes,
    terms_and_conditions,
    view_count,
    first_viewed_at,
    stripe_payment_link,
    client:clients(
      id,
      company_name,
      email,
      contact_name,
      phone,
      address
    ),
    line_items:invoice_line_items(
      id,
      description,
      quantity,
      unit_price,
      amount,
      tax_rate,
      tax_amount
    ),
    org:profiles!invoices_org_id_fkey(
      id,
      email,
      phone
    )
  `)
  .eq('view_token', token)
  .single();
```

### Alternative: Get org info from tenant
If the organization name should come from the tenant, modify the query to:

```typescript
org:tenants!invoices_tenant_id_fkey(
  id,
  company_name,
  email,
  phone
)
```

(Assuming there's a tenant_id FK and tenants table with company_name)

## Impact Assessment

### User Impact: HIGH
- **Functionality**: Public invoice viewing is completely broken
- **User Journey**: Clients who receive invoice emails cannot view their invoices
- **Business Impact**: Payment collection workflow is blocked
- **Workaround**: None available for end users

### Affected Features
1. ❌ Public invoice view page (`/invoices/view/[token]`)
2. ❌ Email invoice links (clients can't access)
3. ❌ Invoice view tracking (can't increment view_count or update viewed_at)
4. ❌ Automatic status change from "sent" to "viewed"
5. ❌ Stripe payment link generation from public view

### Working Features
- ✅ Admin invoice list
- ✅ Admin invoice detail view
- ✅ Invoice creation
- ✅ Invoice API (authenticated endpoints)

## Test Steps to Reproduce

1. Login to admin panel
2. Navigate to Finance > Invoicing
3. Find any invoice with status "Sent"
4. Get the invoice ID from the detail page
5. Query `/api/invoices/[id]` to get the view_token
6. Visit `/invoices/view/[view_token]`
7. **Result**: "Invoice Not Found" error appears

## Screenshots

All screenshots saved to: `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-tracking/`

- `01-login-page.png` - Login screen
- `02-credentials-entered.png` - Credentials filled
- `03-after-login.png` - Post-login dashboard
- `04-invoicing-page.png` - Invoice list page
- `04a-invoice-list-debug.png` - Invoice list with data
- `05-invoice-details.png` - Invoice detail view
- `07-public-view.png` - **CRITICAL: Shows "Invoice Not Found" error**

## Next Steps

### Immediate Action Required
1. **Debug the Supabase query** to identify which part is failing
2. **Check database schema** for profiles/organizations table structure
3. **Add server-side logging** to see the actual Supabase error
4. **Implement recommended fix** (Option 1 as quick fix)
5. **Re-run automated tests** to verify fix

### Testing After Fix
Once the bug is fixed, re-run the test to verify:
- ✅ Public invoice page loads successfully
- ✅ Invoice number and details display
- ✅ Company information shows
- ✅ Bill To section renders
- ✅ Line items table appears
- ✅ Totals calculate correctly
- ✅ Pay Now button shows (for unpaid invoices)
- ✅ Status changes from "sent" to "viewed" after first view
- ✅ View count increments

## Related Files

**Test File**: `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/invoice-view-tracking.spec.ts`
**API Route**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/api/invoices/view/[token]/route.ts`
**Public View Page**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/invoices/view/[token]/page.tsx`
**Invoice List Page**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/(app)/finance/invoicing/page.tsx`

## Conclusion

This is a **blocking bug** that prevents the core invoice viewing workflow from functioning. The public invoice view feature is essential for client invoice delivery and payment collection.

**Priority**: URGENT - Fix immediately before any production deployment.

---

**Test Status**: ❌ FAILED
**Requires**: Developer investigation and bug fix
**Blocker**: Yes - prevents invoice viewing feature from working
