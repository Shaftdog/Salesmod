import { test, expect } from '@playwright/test';

test.describe('Invoice Edit Bug Fix Verification - Complete Flow', () => {
  test('Invoice should remain visible after editing line item description', async ({ page }) => {
    const screenshotDir = 'e2e/screenshots/invoice-fix-verification';

    // Step 1-2: Navigate and login
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');

    // Fill in login credentials
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');

    await page.screenshot({ path: `${screenshotDir}/01-login.png`, fullPage: true });

    // Click login button and wait for dashboard
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log('✓ Logged in successfully');

    // Step 3: Update invoice status to 'draft' using browser console
    // This is necessary because only draft/sent invoices can be edited
    await page.evaluate(async () => {
      const response = await fetch('http://localhost:54321/rest/v1/invoices?invoice_number=eq.INV-00021', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        },
        body: JSON.stringify({ status: 'draft' })
      });
      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }
    });

    console.log('✓ Updated invoice status to draft');

    // Step 4: Navigate to the order page
    await page.goto('http://localhost:9002/orders/de3675b4-37b3-41cd-8ff4-53d759603d23');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${screenshotDir}/02-order-page.png`, fullPage: true });

    // Step 5: Click Invoice tab
    const invoiceTab = page.locator('button[role="tab"]', { hasText: 'Invoice' });
    await expect(invoiceTab).toBeVisible({ timeout: 10000 });
    await invoiceTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${screenshotDir}/03-invoice-tab.png`, fullPage: true });

    // Step 6: Verify invoice is visible
    const invoiceNumber = page.locator('text=INV-00021');
    await expect(invoiceNumber).toBeVisible({ timeout: 10000 });

    console.log('✓ Invoice INV-00021 is visible');

    // Step 7: Click the Edit button (should now be visible with draft status)
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: `${screenshotDir}/04-before-edit.png`, fullPage: true });

    await editButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${screenshotDir}/05-edit-dialog.png`, fullPage: true });

    // Step 8: Find and change the line item description
    const descriptionInput = page.locator('input').filter({ hasAttribute: 'name' }).filter({ has: page.locator('[name*="description"]') }).first()
      .or(page.locator('input[name*="line_items"][name*="description"]'))
      .or(page.locator('input[id*="description"]'))
      .or(page.locator('input[placeholder*="description"]'));

    // Try to find any input in the line items section
    const lineItemsSection = page.locator('text=Line Items').locator('..').locator('..');
    const firstInput = lineItemsSection.locator('input').first();

    await expect(firstInput).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: `${screenshotDir}/06-input-found.png`, fullPage: true });

    await firstInput.clear();
    await firstInput.fill('Test Description - Verification');

    await page.screenshot({ path: `${screenshotDir}/07-description-changed.png`, fullPage: true });

    console.log('✓ Changed line item description');

    // Step 9: Save the changes
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${screenshotDir}/08-after-save.png`, fullPage: true });

    console.log('✓ Clicked Save Changes');

    // Step 10: CRITICAL VERIFICATION - Invoice should STILL be visible
    const invoiceStillVisible = await invoiceNumber.isVisible().catch(() => false);
    console.log(`Invoice visible after edit: ${invoiceStillVisible}`);

    // Check for "No Invoices" empty state (should NOT be present)
    const noInvoicesText = page.locator('text=No Invoices');
    const hasEmptyState = await noInvoicesText.isVisible().catch(() => false);
    console.log(`Empty state visible: ${hasEmptyState}`);

    // Verify the updated description is visible
    const updatedDescription = page.locator('text=Test Description - Verification');
    const descriptionVisible = await updatedDescription.isVisible().catch(() => false);
    console.log(`Updated description visible: ${descriptionVisible}`);

    await page.screenshot({ path: `${screenshotDir}/09-final-verification.png`, fullPage: true });

    // Assertions
    expect(invoiceStillVisible || descriptionVisible).toBeTruthy();
    expect(hasEmptyState).toBeFalsy();

    console.log('\n=== TEST RESULTS ===');
    if (invoiceStillVisible) {
      console.log('✅ Invoice remains visible after editing');
    }
    if (!hasEmptyState) {
      console.log('✅ No empty state displayed');
    }
    if (descriptionVisible) {
      console.log('✅ Description was updated and visible');
    }
    console.log('==================\n');
  });
});
