import { test, expect } from '@playwright/test';

/**
 * Test: Invoice Line Item Edit Cache Fix Verification
 *
 * Purpose: Verify that the setQueryData fix correctly updates the invoice cache
 * when editing line items, preventing the race condition where changes weren't
 * visible immediately after save.
 *
 * Fix tested: Lines 169-174 in edit-invoice-dialog.tsx
 * - queryClient.setQueryData(['invoice', invoice.id], result)
 *
 * Test scenario:
 * 1. Login as test user
 * 2. Navigate to invoicing page
 * 3. Open invoice INV-00021 (or first "Sent" invoice)
 * 4. Click Edit button
 * 5. Capture original line item description
 * 6. Change description to timestamped value
 * 7. Save changes
 * 8. Verify description updated immediately on detail page
 * 9. Refresh page and confirm change persisted
 */

test.describe('Invoice Edit Cache Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');

    // Fill login form using placeholder text
    await page.fill('input[placeholder*="example.com"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Edit invoice line item description and verify immediate cache update', async ({ page }) => {
    console.log('Step 1: Navigate to invoicing page');
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/01-invoicing-page.png', fullPage: true });

    console.log('Step 2: Find and click on invoice INV-00021 link or first editable invoice');

    // Try to find INV-00021 first, fallback to any Sent invoice
    let invoiceLink = page.locator('a[href*="/finance/invoicing/"]:has-text("INV-00021")').first();
    let invoiceFound = await invoiceLink.count() > 0;
    let invoiceNumber = 'INV-00021';

    if (!invoiceFound) {
      console.log('INV-00021 not found, looking for any Sent invoice link...');
      // Find a row with Sent badge and get its invoice number link
      const sentRow = page.locator('tr').filter({ has: page.locator('text=/Sent/i') }).first();
      if (await sentRow.count() > 0) {
        invoiceLink = sentRow.locator('a[href*="/finance/invoicing/"]').first();
        invoiceFound = await invoiceLink.count() > 0;
        if (invoiceFound) {
          invoiceNumber = await invoiceLink.innerText();
        }
      }
    }

    if (!invoiceFound) {
      console.log('No Sent invoices found, looking for any invoice link...');
      invoiceLink = page.locator('a[href*="/finance/invoicing/"]').first();
      invoiceNumber = await invoiceLink.innerText();
    }

    console.log(`Testing with invoice: ${invoiceNumber}`);

    // Click on the invoice link to open detail page
    await invoiceLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/02-invoice-detail-page.png', fullPage: true });

    console.log('Step 3: Verify invoice detail page loaded');

    // Wait for invoice detail page to load - should show invoice number in h1
    await expect(page.locator('h1:has-text("Invoice")')).toBeVisible({ timeout: 5000 });
    console.log('Invoice detail page loaded successfully');

    console.log('Step 4: Capture original line item description from detail page');

    // Find the line items table on the detail page
    const lineItemsCard = page.locator('text=Line Items').locator('..').locator('..');
    const lineItemRow = lineItemsCard.locator('table tbody tr').first();
    const descriptionCell = lineItemRow.locator('td').first();
    const originalDescription = await descriptionCell.innerText();

    console.log(`Original description: "${originalDescription}"`);
    expect(originalDescription).toBeTruthy();

    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/03-before-edit.png', fullPage: true });

    console.log('Step 5: Click Edit button');

    // Look for Edit button (could be in various locations)
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for edit dialog to appear
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/04-edit-dialog-opened.png', fullPage: true });

    console.log('Step 6: Verify edit dialog opened');

    const dialogTitle = page.locator('[role="dialog"] h2, .dialog-title, [class*="DialogTitle"]');
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });
    const dialogTitleText = await dialogTitle.innerText();
    console.log(`Dialog title: "${dialogTitleText}"`);
    expect(dialogTitleText.toLowerCase()).toContain('edit');

    console.log('Step 7: Change line item description');

    const timestamp = new Date().toISOString();
    const newDescription = `FIXED DESCRIPTION TEST ${timestamp}`;
    console.log(`New description: "${newDescription}"`);

    // Find the description input in the dialog - it's in a table
    const descriptionInput = page.locator('[role="dialog"] table tbody tr').first().locator('input[placeholder*="Description"], input').first();
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });

    // Clear and type new description
    await descriptionInput.click();
    await descriptionInput.fill('');
    await descriptionInput.fill(newDescription);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/05-description-changed.png', fullPage: true });

    console.log('Step 8: Save changes');

    const saveButton = page.locator('[role="dialog"] button:has-text("Save")').first();
    await expect(saveButton).toBeVisible();

    // Click save and wait for dialog to close
    await saveButton.click();
    console.log('Clicked Save button, waiting for dialog to close...');

    // Wait for dialog to disappear
    await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });
    console.log('Dialog closed');

    // Wait for any network activity to settle
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/06-after-save.png', fullPage: true });

    console.log('Step 9: CRITICAL - Verify description updated immediately (cache fix verification)');

    // This is the key test - the description should be updated immediately
    // without needing a page refresh, thanks to setQueryData
    // Find the line items table again (after dialog closes)
    const updatedLineItemsCard = page.locator('text=Line Items').locator('..').locator('..');
    const updatedLineItemRow = updatedLineItemsCard.locator('table tbody tr').first();
    const updatedDescriptionCell = updatedLineItemRow.locator('td').first();
    const currentDescription = await updatedDescriptionCell.innerText();

    console.log(`Current description after save: "${currentDescription}"`);
    console.log(`Expected description: "${newDescription}"`);

    // The fix should make this assertion pass without any refresh
    expect(currentDescription).toContain('FIXED DESCRIPTION TEST');
    expect(currentDescription).toContain(timestamp.substring(0, 10)); // At least the date part

    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/07-immediate-update-verified.png', fullPage: true });

    console.log('Step 10: Refresh page and verify persistence');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const persistedLineItemsCard = page.locator('text=Line Items').locator('..').locator('..');
    const persistedLineItemRow = persistedLineItemsCard.locator('table tbody tr').first();
    const persistedDescriptionCell = persistedLineItemRow.locator('td').first();
    const persistedDescription = await persistedDescriptionCell.innerText();

    console.log(`Description after refresh: "${persistedDescription}"`);

    // Verify the change persisted to database
    expect(persistedDescription).toContain('FIXED DESCRIPTION TEST');
    expect(persistedDescription).toContain(timestamp.substring(0, 10));

    await page.screenshot({ path: 'e2e/screenshots/invoice-cache-fix/08-persisted-after-refresh.png', fullPage: true });

    console.log('SUCCESS: Cache fix verified - description updated immediately and persisted');
  });

  test('Verify edit prevents race condition with rapid dialog close', async ({ page }) => {
    console.log('Additional test: Verify no race condition when dialog closes quickly');

    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');

    // Find any editable invoice and click to open detail page
    const invoiceLink = page.locator('a[href*="/finance/invoicing/"]').first();
    await invoiceLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Wait for detail page to load
    await expect(page.locator('h1:has-text("Invoice")')).toBeVisible({ timeout: 5000 });

    // Open edit dialog
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Make a change
    const timestamp = new Date().getTime().toString();
    const newDescription = `RACE CONDITION TEST ${timestamp}`;

    const descriptionInput = page.locator('[role="dialog"] table tbody tr').first().locator('input').first();
    await descriptionInput.fill(newDescription);

    // Save and immediately check (no artificial delays)
    const saveButton = page.locator('[role="dialog"] button:has-text("Save")').first();
    await saveButton.click();

    // Wait for dialog close
    await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10000 });

    // Immediate check - this would fail with invalidateQueries race condition
    const lineItemsCard = page.locator('text=Line Items').locator('..').locator('..');
    const lineItemRow = lineItemsCard.locator('table tbody tr').first();
    const updatedDescription = await lineItemRow.locator('td').first().innerText();

    console.log(`Description immediately after save: "${updatedDescription}"`);

    // With setQueryData fix, this should pass immediately
    expect(updatedDescription).toContain('RACE CONDITION TEST');

    console.log('SUCCESS: No race condition - cache updated immediately');
  });
});
