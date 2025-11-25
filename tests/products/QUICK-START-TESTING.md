# Product Module - Quick Start Testing Guide

**For**: QA Engineers, Testers, or Developers
**Time Required**: 5 minutes to start, 2-3 hours for full testing
**Prerequisites**: Application running, database migrated, user authenticated

---

## Step 1: Pre-Test Setup (5 minutes)

### A. Execute Database Migration

```bash
cd c:\Users\shaug\source\repos\Shaftdog\Salesmod

# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Manual execution
# 1. Open Supabase Dashboard > SQL Editor
# 2. Open file: supabase/migrations/20251116130000_create_products_system.sql
# 3. Copy all SQL and execute
```

### B. Verify Migration Success

```sql
-- In Supabase SQL Editor, run these checks:

-- 1. Check table exists
SELECT * FROM products LIMIT 1;
-- Expected: Table exists (may be empty)

-- 2. Check function exists
SELECT * FROM get_product_price_breakdown(
  '00000000-0000-0000-0000-000000000000'::uuid,
  3500
);
-- Expected: Error about product not found (function works)

-- 3. Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'products';
-- Expected: rowsecurity = true
```

### C. Verify Application Running

```bash
# Check if app is running on port 9002
curl http://localhost:9002

# If not running, start it:
npm run dev
```

### D. Login to Application

1. Navigate to: http://localhost:9002/login
2. Login with valid test credentials
3. Verify you're authenticated (can access dashboard)

---

## Step 2: Quick Smoke Test (5 minutes)

### Test the Happy Path

Open browser and manually execute these steps:

1. **Navigate to Products Page**
   - URL: http://localhost:9002/sales/products
   - Expected: Page loads, no console errors
   - Screenshot: Save as `01-page-load.png`

2. **Create a Product**
   - Click "New Product" button
   - Fill in:
     - Name: "Test Full Appraisal"
     - Category: "Core Appraisal"
     - Base Price: 450
   - Click "Create"
   - Expected: Product appears in list, success toast
   - Screenshot: Save as `02-product-created.png`

3. **Use Price Calculator**
   - Click "Price Calculator" tab
   - Select the product you just created
   - Expected: Shows "$450.00" as total price
   - Screenshot: Save as `03-calculator.png`

4. **Delete Test Product**
   - Return to "All Products" tab
   - Click three-dot menu on the test product
   - Click "Delete"
   - Click "Confirm"
   - Expected: Product removed, success toast
   - Screenshot: Save as `04-deleted.png`

### Result

- ✅ If all 4 steps work: **Basic functionality is working**
- ❌ If any step fails: **See troubleshooting section below**

---

## Step 3: Full Automated Testing (2-3 hours)

### Option A: Using Playwright (Recommended)

```bash
# Install Playwright (if not already installed)
npm install -D @playwright/test

# Create test file
# File: tests/products/products.spec.ts
# (Use test-plan.md as reference for test scenarios)

# Run tests
npx playwright test tests/products --headed

# Generate report
npx playwright show-report
```

### Option B: Manual Testing

Follow the comprehensive test plan:

1. Open `tests/products/test-plan.md`
2. Execute each test scenario manually
3. Take screenshots at each step
4. Document results in a spreadsheet or checklist
5. Report any bugs found

---

## Step 4: Common Test Scenarios

### Create Product with SF Pricing

1. Click "New Product"
2. Fill in:
   - Name: "Test SF Pricing Product"
   - Category: "Core Appraisal"
   - Base Price: 450
   - Enable "Square Footage Pricing" toggle
   - SF Threshold: 3000
   - Price per SF: 0.10
3. Expected: Price preview shows calculation for 3500 SF
4. Click "Create"
5. Expected: Product shows "$0.10/SF over 3,000 SF" in list

### Test Price Calculator with SF

1. Go to "Price Calculator" tab
2. Select the SF pricing product
3. Enter Square Footage: 3500
4. Expected Breakdown:
   - Base Price: $450.00
   - SF Above Threshold: 500
   - Additional Charge: $50.00
   - Total Price: $500.00

### Test Search

1. Go to "All Products" tab
2. Type product name in search box
3. Expected: List filters to matching products only

### Test Category Filter

1. Click category dropdown
2. Select "Core Appraisal"
3. Expected: Only core products shown

### Test Form Validation

1. Click "New Product"
2. Leave name empty
3. Try to submit
4. Expected: Error "Product name is required"

### Test Duplicate Name

1. Create a product named "Test Product"
2. Try to create another with same name
3. Expected: Error "Product with name 'Test Product' already exists"

### Test Edit Product

1. Click three-dot menu on a product
2. Click "Edit"
3. Change base price to 500
4. Click "Update"
5. Expected: Product list shows new price

### Test Delete Confirmation

1. Click three-dot menu
2. Click "Delete"
3. Click "Cancel" in dialog
4. Expected: Product still exists
5. Try again, click "Confirm"
6. Expected: Product removed

---

## Step 5: Verify Test Results

### Checklist

- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Search returns correct results
- [ ] Filters work (category, status)
- [ ] Price calculator shows accurate totals
- [ ] Form validation prevents invalid data
- [ ] Error messages are clear and helpful
- [ ] Success toasts appear on operations
- [ ] Delete confirmation prevents accidental deletion
- [ ] Page loads without console errors
- [ ] API calls return expected data

### Screenshot Evidence

Save all screenshots to:
```
c:\Users\shaug\source\repos\Shaftdog\Salesmod\tests\screenshots\products-20251116\
```

Name format: `{test-number}-{description}.png`
Example: `01-page-load.png`, `02-create-product.png`

---

## Troubleshooting

### Error: "Table products does not exist"

**Cause**: Database migration not executed

**Fix**:
```bash
supabase db push
```

### Error: "Function get_product_price_breakdown does not exist"

**Cause**: Database migration incomplete

**Fix**: Execute migration SQL manually in Supabase Dashboard

### Error: "Unauthorized" or "401"

**Cause**: User not authenticated

**Fix**: Login at http://localhost:9002/login

### Error: "Product not found" when editing

**Cause**: Product doesn't belong to your org (multi-tenant isolation working correctly)

**Fix**: Create products under your authenticated user's org

### Page doesn't load / 404 error

**Cause**: Application not running or wrong URL

**Fix**:
```bash
npm run dev
# Then navigate to http://localhost:9002/sales/products
```

### No products showing in list

**Cause**: No products created yet OR filter applied

**Fix**:
1. Check filters - set to "All Categories" and "All Status"
2. Create a test product
3. Verify you're logged in as the correct org

### Price calculator not calculating

**Cause**: Database function `get_product_price_breakdown` missing

**Fix**: Execute database migration

### Form submission does nothing

**Cause**: Validation errors or network error

**Fix**:
1. Open browser console (F12)
2. Check for validation errors
3. Check Network tab for API errors
4. Verify all required fields filled

---

## Bug Reporting Template

If you find a bug, report it using this format:

```markdown
## Bug: [Brief Description]

**Severity**: Critical | High | Medium | Low

**Test**: [Which test scenario]

**Steps to Reproduce**:
1. Navigate to...
2. Click...
3. Enter...
4. Expected: ...
5. Actual: ...

**Screenshots**:
- Attach relevant screenshots

**Console Errors**:
```
[Paste any console errors]
```

**Network Errors**:
- Request: [method] [url]
- Status: [status code]
- Response: [error message]

**Environment**:
- Browser: [Chrome/Firefox/Safari/Edge]
- Browser Version: [version]
- OS: [Windows/Mac/Linux]
- App Version: [commit hash or date]

**Impact**:
[How does this affect users?]

**Suggested Fix** (optional):
[If you know how to fix it]
```

---

## Success Criteria

### Must Pass (Blocking for Production)

- ✅ Can create products (both fixed and SF pricing)
- ✅ Can edit products
- ✅ Can delete products (with confirmation)
- ✅ Can search products by name/SKU
- ✅ Can filter by category
- ✅ Can filter by status
- ✅ Price calculator shows accurate calculations
- ✅ Form validation prevents invalid data
- ✅ Duplicate names are prevented
- ✅ No console errors during normal use
- ✅ All API calls succeed (200 or expected error codes)

### Should Pass (Important)

- ✅ Loading states display during API calls
- ✅ Empty state shows when no products
- ✅ Error messages are user-friendly
- ✅ Success toasts confirm operations
- ✅ Pagination works (if >20 products)
- ✅ SF pricing info displays correctly in list

### Nice to Have (Enhancement)

- ✅ Responsive design works on mobile
- ✅ Keyboard navigation works
- ✅ Animations are smooth
- ✅ Performance is fast (<2s page load)

---

## After Testing

### If All Tests Pass ✅

1. Document test results
2. Save all screenshots
3. Mark product module as "TESTED - READY FOR PRODUCTION"
4. Deploy to staging for final QA
5. After staging approval, deploy to production

### If Tests Fail ❌

1. Document all failing tests with screenshots
2. Report bugs using template above
3. Prioritize by severity
4. Fix bugs
5. Re-test until all pass

---

## Quick Reference

### Key URLs

- Products page: http://localhost:9002/sales/products
- Login: http://localhost:9002/login
- Supabase Dashboard: [Your Supabase project URL]

### Key Files

- Test Plan: `tests/products/test-plan.md`
- Code Analysis: `tests/products/code-analysis-report.md`
- Testing Status: `tests/products/TESTING-STATUS.md`
- Migration SQL: `supabase/migrations/20251116130000_create_products_system.sql`

### Key Commands

```bash
# Start app
npm run dev

# Push migration
supabase db push

# Run Playwright tests
npx playwright test tests/products --headed

# View test report
npx playwright show-report
```

---

## Time Estimates

| Task | Time Required |
|------|---------------|
| Database migration | 5 minutes |
| Quick smoke test | 5 minutes |
| Full manual testing | 2-3 hours |
| Automated test setup | 1 hour |
| Automated test execution | 30 minutes |
| Bug fixing (if any) | 2-4 hours per bug |

**Total**: 3-4 hours for comprehensive testing (assuming few bugs)

---

## Contact

**Questions about testing?**
- See detailed test plan: `tests/products/test-plan.md`
- See code analysis: `tests/products/code-analysis-report.md`

**Found a bug?**
- Use bug reporting template above
- Include screenshots and console errors
- Note severity and impact

**Need help with Playwright?**
- Playwright docs: https://playwright.dev
- Example tests in: `tests/` directory

---

**Ready to start testing?**

1. ✅ Execute database migration (Step 1)
2. ✅ Run quick smoke test (Step 2)
3. ✅ If smoke test passes, proceed to full testing (Step 3)
4. ✅ Document results and report bugs

Good luck! 🚀

---

Generated: 2025-11-16
Version: 1.0
