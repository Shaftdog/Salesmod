# Invoice View Tracking Test Results

**Test Date**: December 15, 2025
**Test Duration**: Comprehensive automated browser testing
**Status**: ❌ CRITICAL BUG FOUND

## Executive Summary

Automated testing of the invoice view tracking flow has **discovered a critical bug** that completely breaks the public invoice viewing feature. Clients cannot view invoices sent to them via email links.

### Test Status: FAILED
- **Passing Steps**: 5/9 (Login, Navigation, Invoice Selection, API calls)
- **Failing Steps**: 4/9 (Public view page, status tracking, payment button)
- **Severity**: CRITICAL - Core feature non-functional
- **User Impact**: HIGH - Blocks invoice delivery and payment collection

## What Was Tested

### Complete User Flow
1. ✅ Admin login to dashboard
2. ✅ Navigate to Finance > Invoicing
3. ✅ Find invoice with "Sent" status
4. ✅ Open invoice detail page
5. ✅ Extract public view token
6. ❌ **FAILED**: Open public invoice view URL
7. ❌ **BLOCKED**: Verify invoice details display
8. ❌ **BLOCKED**: Confirm status change to "viewed"
9. ❌ **BLOCKED**: Test "Pay Now" button

### Test Invoice Used
- **Invoice Number**: INV-00021
- **Client**: Plains Commerce Bank
- **Amount**: $300.00
- **Status**: Sent
- **View Token**: `eed62e86...` (64 characters)
- **Public URL**: http://localhost:9002/invoices/view/[token]

## Bug Details

### What Should Happen
When a client clicks the invoice link in their email:
1. Public invoice page loads with professional layout
2. Invoice details display (number, date, amounts, line items)
3. "Pay Now" button appears for unpaid invoices
4. Invoice status automatically changes from "sent" to "viewed"
5. View count increments

### What Actually Happens
1. Page loads but shows error: **"Invoice Not Found"**
2. No invoice details render
3. No payment button
4. No status tracking occurs

### Screenshot Evidence
![Invoice Not Found Error](/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-tracking/07-public-view.png)

## Root Cause (Confirmed via Diagnostic Testing)

### Problem Location
**File**: `src/app/api/invoices/view/[token]/route.ts`
**API Endpoint**: `GET /api/invoices/view/[token]`
**Lines**: 71-76

### Two Specific Bugs Found

#### Bug #1: Ambiguous Foreign Key Reference
**Supabase Error**: `PGRST201 - Could not embed because more than one relationship was found`

The query uses `org:profiles(...)` but the invoices table has THREE foreign keys to profiles:
- `org_id` → profiles
- `created_by` → profiles
- `updated_by` → profiles

Supabase doesn't know which one to use for the join.

**Fix**: Change `org:profiles(` to `org:profiles!invoices_org_id_fkey(` to specify the exact relationship.

#### Bug #2: Non-existent Column
**Postgres Error**: `42703 - column profiles.company_name does not exist`

The query requests `company_name` from profiles table, but this column doesn't exist in the schema.

**Fix**: Either remove `company_name` from the query, or get it from a different table (likely `tenants` table).

## Exact Fix Required

### Change Required in: `src/app/api/invoices/view/[token]/route.ts`

**Line 71-76 - Current (Broken)**:
```typescript
org:profiles(
  id,
  company_name,  // ← Doesn't exist
  email,
  phone
)
```

**Fixed Version**:
```typescript
org:profiles!invoices_org_id_fkey(  // ← Specify FK relationship
  id,
  // company_name removed
  email,
  phone
)
```

### Full Fixed Query
See detailed fix in: `/Users/sherrardhaugabrooks/Documents/Salesmod/tests/reports/CRITICAL-BUG-invoice-view-tracking.md`

## Impact on Users

### Broken Features
- ❌ Clients cannot view invoices from email links
- ❌ Public invoice viewing completely non-functional
- ❌ Invoice view tracking not working
- ❌ Payment collection workflow blocked
- ❌ Automatic status updates (sent → viewed) not happening

### Still Working
- ✅ Admin can view invoices in dashboard
- ✅ Invoice creation and editing
- ✅ Invoice list and filters
- ✅ Authenticated API endpoints

## Test Artifacts

### Automated Test File
`/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/invoice-view-tracking.spec.ts`

### Screenshots (12 captured)
`/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-tracking/`
- 01-login-page.png
- 02-credentials-entered.png
- 03-after-login.png
- 04-invoicing-page.png
- 04a-invoice-list-debug.png
- 05-invoice-details.png
- 07-public-view.png ← **Shows the error**

### Diagnostic Script
`/Users/sherrardhaugabrooks/Documents/Salesmod/scripts/test-invoice-view-query.ts`

Runs 6 test queries to isolate the exact failure point. Confirmed:
- ✅ Simple invoice query works
- ✅ Client join works
- ✅ Line items join works
- ❌ Profiles join fails (ambiguous FK)
- ❌ Full query fails (both issues)

### Detailed Bug Report
`/Users/sherrardhaugabrooks/Documents/Salesmod/tests/reports/CRITICAL-BUG-invoice-view-tracking.md`

Complete analysis with:
- Step-by-step test results
- Root cause analysis
- Exact code fixes needed
- Impact assessment
- Reproduction steps

## Diagnostic Test Results

```
Test 1: Simple query without joins
✅ Simple query succeeded

Test 2: Query with client join
✅ Client join succeeded

Test 3: Query with line_items join
✅ Line items join succeeded

Test 4: Query with profiles join
❌ Profiles join failed
Error: "Could not embed because more than one relationship was found"
Hint: "Try changing 'profiles' to 'profiles!invoices_org_id_fkey'"

Test 5: Full query (all joins)
❌ Full query failed (same as Test 4)

Test 6: Direct profile lookup
❌ Profile lookup failed
Error: "column profiles.company_name does not exist"
```

## Next Steps

### Immediate Action Required
1. **Apply the fix** to `src/app/api/invoices/view/[token]/route.ts`
2. **Determine org name source** - Check if company_name should come from tenants table instead
3. **Re-run tests** using: `npx playwright test e2e/invoice-view-tracking.spec.ts`
4. **Verify fix** with diagnostic script: `npx tsx scripts/test-invoice-view-query.ts`

### After Fix is Applied
The automated test will verify:
- ✅ Public invoice page loads successfully
- ✅ Invoice details render correctly
- ✅ Company info displays
- ✅ Bill To section shows client data
- ✅ Line items table appears
- ✅ Totals calculate correctly
- ✅ "Pay Now" button visible (for unpaid)
- ✅ Status changes from "sent" to "viewed"
- ✅ View count increments

### Testing Commands
```bash
# Run full automated test
npx playwright test e2e/invoice-view-tracking.spec.ts --headed

# Run diagnostic query tests
npx tsx scripts/test-invoice-view-query.ts

# Test API directly
curl http://localhost:9002/api/invoices/view/[token]
```

## Conclusion

This automated testing discovered a **blocking production bug** that would prevent clients from viewing or paying invoices. The bug is well-isolated with exact fixes identified.

**Priority**: URGENT
**Complexity**: Low (simple query syntax fix)
**Risk**: High if not fixed before production
**Testing**: Fully automated re-test available

The test suite is ready to verify the fix once applied.

---

**Tested by**: Claude Code Automated Testing Agent
**Test Framework**: Playwright
**Browser**: Chromium
**Application**: http://localhost:9002
**Test Mode**: Headed (browser visible)
