# Product Module - Comprehensive Test Plan

**Feature**: Product Management for Appraisal Services
**URL**: http://localhost:9002/sales/products
**Date**: 2025-11-16
**Status**: Ready for Testing

## Test Environment

- **Application URL**: http://localhost:9002
- **Test Route**: /sales/products
- **Browser**: Chromium (headless: false)
- **Screenshot Directory**: c:\Users\shaug\source\repos\Shaftdog\Salesmod\tests\screenshots\products-20251116

## Pre-Test Checklist

- [ ] Verify application is running on http://localhost:9002
- [ ] Verify database migrations are applied (products table exists)
- [ ] Verify user is authenticated
- [ ] Clear any existing test data with "Test" prefix

## Test Scenarios

### 1. Navigation and Initial Page Load

**Test**: Navigate to Products Page
- Navigate to http://localhost:9002/sales/products
- Wait for page to load completely
- Verify page title contains "Products"
- Verify "New Product" button is visible
- Verify search input is present
- Verify category filter dropdown is present
- Verify status filter dropdown is present
- Take screenshot: `01-initial-page-load.png`
- **Expected**: Page loads without errors, all UI elements visible

**Console Check**:
- Verify no console errors
- Verify no 404 or API errors

### 2. Product List Display

**Test**: View Product List
- Check if table/list container is visible
- Count number of products displayed (if any)
- Verify column headers: Name, Category, Price, Status, Actions
- Take screenshot: `02-product-list.png`
- **Expected**: List displays correctly with proper headers

### 3. Create Product - Fixed Price

**Test**: Create Simple Product without SF Pricing
- Click "New Product" button
- Wait for form dialog to appear
- Fill form fields:
  - Name: "Test Desktop Review"
  - Description: "Automated test product for desktop reviews"
  - SKU: "TEST-DESK-001"
  - Category: Select "Specialized"
  - Base Price: "250.00"
  - Square Footage Pricing: Leave OFF/unchecked
  - Status: Active (default)
- Take screenshot: `03-create-fixed-price-form.png`
- Click "Create" or "Submit" button
- Wait for success toast notification
- Take screenshot: `04-create-fixed-price-success.png`
- **Expected**:
  - Product appears in list
  - Success message shown
  - No console errors

**Validation**:
- Verify product shows in list with correct details
- Verify category badge shows "Specialized"
- Verify base price shows as "$250.00"

### 4. Create Product - With SF Pricing

**Test**: Create Product with Square Footage Calculation
- Click "New Product" button
- Fill form fields:
  - Name: "Test Full Appraisal"
  - Description: "Automated test product with SF pricing"
  - SKU: "TEST-FULL-001"
  - Category: Select "Core Appraisal"
  - Base Price: "450.00"
  - Square Footage Pricing: Enable/check checkbox
  - SF Threshold: "3000"
  - Price per SF: "0.10"
  - Status: Active
- Take screenshot: `05-create-sf-pricing-form.png`
- Verify price preview/calculation shows (if visible in form)
- Click "Create" button
- Wait for success toast
- Take screenshot: `06-create-sf-pricing-success.png`
- **Expected**:
  - Product created successfully
  - SF pricing info visible in list
  - Shows "$0.10/SF over 3000 SF" or similar

### 5. Search Functionality

**Test**: Search Products by Name
- Locate search input field
- Type "Test Desktop" in search
- Wait for debounce/search to execute
- Take screenshot: `07-search-by-name.png`
- **Expected**: Only "Test Desktop Review" shows in results

**Test**: Search Products by SKU
- Clear search field
- Type "TEST-FULL" in search
- Wait for results
- Take screenshot: `08-search-by-sku.png`
- **Expected**: Only "Test Full Appraisal" shows in results

**Test**: Search with No Results
- Clear search field
- Type "NONEXISTENT123456"
- Wait for results
- Take screenshot: `09-search-no-results.png`
- **Expected**: Shows "No products found" or empty state

**Test**: Clear Search
- Clear search field (empty string)
- Wait for results
- **Expected**: All products show again

### 6. Filter by Category

**Test**: Filter Core Appraisal Products
- Click category filter dropdown
- Select "Core Appraisal"
- Wait for filter to apply
- Take screenshot: `10-filter-core-category.png`
- **Expected**: Only "Test Full Appraisal" visible (if it's the only core product)

**Test**: Filter Specialized Products
- Click category filter dropdown
- Select "Specialized"
- Wait for results
- Take screenshot: `11-filter-specialized-category.png`
- **Expected**: Only "Test Desktop Review" visible

**Test**: Show All Categories
- Click category filter dropdown
- Select "All Categories"
- Wait for results
- **Expected**: All products visible again

### 7. Filter by Status

**Test**: Filter Active Products Only
- Click status filter dropdown
- Select "Active Only"
- Wait for results
- Take screenshot: `12-filter-active-status.png`
- **Expected**: All active products show (both test products)

**Test**: Filter Inactive Products Only
- Click status filter dropdown
- Select "Inactive Only"
- Wait for results
- Take screenshot: `13-filter-inactive-status.png`
- **Expected**: No products shown (or only inactive ones if any exist)

### 8. Edit Product

**Test**: Edit Product Details
- Locate "Test Desktop Review" in list
- Click actions menu (three dots/kebab menu)
- Click "Edit" option
- Wait for form dialog to open
- Modify fields:
  - Base Price: Change to "275.00"
  - Description: Append " - UPDATED"
- Take screenshot: `14-edit-product-form.png`
- Click "Update" or "Save" button
- Wait for success toast
- Take screenshot: `15-edit-product-success.png`
- **Expected**:
  - Changes saved successfully
  - Price shows as "$275.00" in list
  - Description updated (if visible)

**Test**: Enable SF Pricing on Existing Product
- Click edit on "Test Desktop Review"
- Enable "Square Footage Pricing" checkbox
- Set SF Threshold: "2500"
- Set Price per SF: "0.15"
- Take screenshot: `16-edit-enable-sf-pricing.png`
- Click "Update"
- Wait for success
- **Expected**:
  - Product now shows SF pricing info
  - Base price + SF calculation enabled

### 9. Toggle Product Status

**Test**: Deactivate Product
- Locate "Test Desktop Review"
- Click actions menu
- Click "Deactivate" option (if available)
- Wait for confirmation or success
- Take screenshot: `17-deactivate-product.png`
- **Expected**:
  - Product status changes to "Inactive"
  - Badge/indicator shows inactive state

**Test**: Reactivate Product
- With status filter set to "All Status"
- Locate "Test Desktop Review" (now inactive)
- Click actions menu
- Click "Activate" option
- Wait for success
- Take screenshot: `18-reactivate-product.png`
- **Expected**:
  - Product status changes back to "Active"
  - Badge shows active state

### 10. Price Calculator Tab

**Test**: Navigate to Price Calculator
- Click "Price Calculator" tab
- Wait for calculator widget to appear
- Take screenshot: `19-price-calculator-tab.png`
- **Expected**: Calculator interface visible

**Test**: Calculate Price with SF Pricing
- Select product: "Test Full Appraisal" from dropdown
- Enter square footage: "3500"
- Trigger calculation (click Calculate button or auto-calculate)
- Take screenshot: `20-calculate-price-3500sf.png`
- **Expected**: Shows breakdown:
  - Base Price: $450.00
  - SF Above Threshold: 500 (3500 - 3000)
  - Additional Charge: $50.00 (500 × $0.10)
  - Total Price: $500.00

**Test**: Calculate Price Below Threshold
- Select same product
- Enter square footage: "2500"
- Calculate
- Take screenshot: `21-calculate-price-2500sf.png`
- **Expected**: Shows:
  - Base Price: $450.00
  - SF Above Threshold: 0
  - Additional Charge: $0.00
  - Total Price: $450.00

**Test**: Calculate Fixed Price Product
- Select product: "Test Desktop Review"
- Enter square footage: "5000"
- Calculate
- Take screenshot: `22-calculate-fixed-price.png`
- **Expected**: Shows:
  - Total Price: $275.00 (just base price)
  - No SF calculation applied

### 11. Form Validation Tests

**Test**: Create Product with Empty Name
- Click "New Product"
- Leave name field empty
- Fill other required fields
- Try to submit
- Take screenshot: `23-validation-empty-name.png`
- **Expected**: Shows error "Product name is required"

**Test**: Create Product with Negative Base Price
- Enter name: "Test Invalid Price"
- Enter base price: "-100"
- Try to submit
- Take screenshot: `24-validation-negative-price.png`
- **Expected**: Shows error "Base price must be non-negative"

**Test**: Create Product with Price > $999,999
- Enter base price: "1000000"
- Try to submit
- Take screenshot: `25-validation-price-too-high.png`
- **Expected**: Shows error about max price

**Test**: Create Product with Negative Price per SF
- Enable SF pricing
- Enter price per SF: "-0.50"
- Try to submit
- Take screenshot: `26-validation-negative-sf-price.png`
- **Expected**: Shows error "Price per square foot must be non-negative"

**Test**: Create Product with Too Long Name
- Enter name: 250+ character string
- Try to submit
- Take screenshot: `27-validation-name-too-long.png`
- **Expected**: Shows error about max 200 characters

### 12. Duplicate Product Name

**Test**: Create Product with Duplicate Name
- Click "New Product"
- Enter name: "Test Full Appraisal" (same as existing)
- Fill other fields with valid data
- Submit form
- Take screenshot: `28-duplicate-name-error.png`
- **Expected**:
  - Shows error: "Product with name 'Test Full Appraisal' already exists"
  - Status 409 Conflict
  - Product not created

### 13. Delete Product

**Test**: Cancel Delete Operation
- Locate "Test Desktop Review"
- Click actions menu
- Click "Delete"
- Wait for confirmation dialog
- Take screenshot: `29-delete-confirmation-dialog.png`
- Click "Cancel" button
- **Expected**:
  - Dialog closes
  - Product still exists in list

**Test**: Confirm Delete Operation
- Click actions menu on same product
- Click "Delete"
- Wait for confirmation dialog
- Take screenshot: `30-delete-confirm.png`
- Click "Confirm" or "Delete" button
- Wait for success toast
- Take screenshot: `31-delete-success.png`
- **Expected**:
  - Product removed from list
  - Success message shown
  - No console errors

### 14. Pagination Tests (if applicable)

**Test**: Next Page Navigation
- If more than 20 products exist
- Click "Next" button
- Take screenshot: `32-pagination-next.png`
- **Expected**: Shows next page of products

**Test**: Previous Page Navigation
- Click "Previous" button
- Take screenshot: `33-pagination-previous.png`
- **Expected**: Returns to previous page

**Test**: Pagination Info
- Verify text shows "Showing X of Y products"
- **Expected**: Accurate count displayed

### 15. Edge Cases

**Test**: Product with Very Long Description
- Create product with 900+ character description
- Verify it saves correctly
- Check if description is truncated or scrollable in UI

**Test**: Product with SF Threshold of 1
- Create product with SF threshold: 1
- Calculate price with 100 SF
- **Expected**: Calculation works correctly

**Test**: Product with Price per SF of 0
- Create product with SF pricing enabled but price per SF: 0
- **Expected**: Accepts zero (free overage)

**Test**: Create 25 Products (Pagination Test)
- If needed to test pagination
- Create multiple test products
- Verify pagination controls appear

### 16. Responsive Design (if scope permits)

**Test**: Mobile Viewport
- Resize browser to 375x667 (iPhone)
- Navigate through product list
- Test filters on mobile
- **Expected**: Responsive layout works

### 17. Console and Network

**Throughout All Tests**:
- Monitor browser console for errors
- Check network tab for failed API calls
- Verify API responses are 200 OK for successful operations
- Verify proper error codes (409, 400, 404) for failures

## Cleanup

**After All Tests**:
- Delete all products with "Test" prefix
- Return application to clean state
- Verify no orphaned data

## Success Criteria

- [ ] All navigation tests pass
- [ ] CRUD operations work correctly
- [ ] Search returns accurate results
- [ ] Filters work as expected
- [ ] Price calculator accurate
- [ ] Form validation prevents invalid data
- [ ] Error messages are clear and helpful
- [ ] No console errors during normal operations
- [ ] Responsive design works (if tested)
- [ ] All screenshots captured

## Bug Reporting Format

For any failures, report:
```
Bug #X: [Brief Description]
Severity: Critical | High | Medium | Low
Test: [Test Name]
Steps to Reproduce:
1. ...
2. ...
Expected: [Expected behavior]
Actual: [Actual behavior]
Screenshot: [filename]
Console Errors: [paste errors]
Stack Trace: [if available]
```

## Notes

- Test execution should be automated via Playwright
- Screenshots should be taken at each major step
- Console logs should be monitored continuously
- Any API errors should be captured and reported
- Test data should use "Test" prefix for easy identification
