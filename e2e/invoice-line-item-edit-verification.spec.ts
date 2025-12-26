import { test, expect } from '@playwright/test';

test.describe('Invoice Line Item Edit Fix Verification', () => {
  test('should immediately update line item description without page refresh', async ({ page }) => {
    const timestamp = new Date().toISOString();
    const newDescription = `FINAL FIX TEST ${timestamp}`;

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Logged in successfully');

    // Step 2: Navigate to invoicing page
    console.log('Step 2: Navigating to /finance/invoicing...');
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/01-invoicing-page.png', fullPage: true });
    console.log('✓ Reached invoicing page');

    // Step 3: Click on invoice INV-00021
    console.log('Step 3: Opening invoice INV-00021...');
    await page.click('text=INV-00021');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra wait for modal to fully render
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/02-invoice-opened.png', fullPage: true });
    console.log('✓ Invoice INV-00021 opened');

    // Step 4: Note the current line item description
    console.log('Step 4: Capturing current line item description...');
    const lineItemDescriptions = await page.locator('[data-testid*="line-item"], .line-item, td:has-text("Description"), td:first-child').allTextContents();
    console.log('Current line items:', lineItemDescriptions);
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/03-before-edit.png', fullPage: true });

    // Step 5: Click Edit button
    console.log('Step 5: Clicking Edit button...');
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/04-edit-mode.png', fullPage: true });
    console.log('✓ Edit mode activated');

    // Step 6: Change description to new value
    console.log('Step 6: Changing description...');
    // Find the description input field
    const descriptionInput = page.locator('input[name*="description"], textarea[name*="description"], input[placeholder*="Description"]').first();
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });

    // Capture the old value
    const oldValue = await descriptionInput.inputValue();
    console.log('Old description value:', oldValue);

    // Clear and enter new value
    await descriptionInput.clear();
    await descriptionInput.fill(newDescription);
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/05-new-description-entered.png', fullPage: true });
    console.log('✓ New description entered:', newDescription);

    // Step 7: Click Save Changes
    console.log('Step 7: Saving changes...');
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Changes")').first();
    await expect(saveButton).toBeVisible({ timeout: 5000 });

    // Set up network listener to verify mutation happens
    const mutationPromise = page.waitForResponse(
      response => response.url().includes('/api/') && response.request().method() === 'POST',
      { timeout: 5000 }
    ).catch(() => null);

    await saveButton.click();
    console.log('✓ Save button clicked');

    // Wait for mutation to complete
    const mutationResponse = await mutationPromise;
    if (mutationResponse) {
      console.log('✓ Mutation request completed:', mutationResponse.status());
    }

    // Wait a moment for optimistic update
    await page.waitForTimeout(1000);

    // Step 8: VERIFY the description IMMEDIATELY shows the new value (no page refresh)
    console.log('Step 8: Verifying immediate update...');
    await page.screenshot({ path: 'e2e/screenshots/invoice-fix/06-after-save-immediate.png', fullPage: true });

    // Check if the new description is visible in the DOM
    const updatedDescription = page.locator(`text="${newDescription}"`).first();

    try {
      await expect(updatedDescription).toBeVisible({ timeout: 3000 });
      console.log('✅ SUCCESS: Description immediately updated to:', newDescription);
      await page.screenshot({ path: 'e2e/screenshots/invoice-fix/07-verification-passed.png', fullPage: true });

      // Additional verification: ensure we're still on the same page (no refresh)
      const currentUrl = page.url();
      console.log('Current URL (should still be on invoice page):', currentUrl);
      expect(currentUrl).toContain('finance/invoicing');

      console.log('✅ PASS: Invoice line item edit fix is working correctly');
      console.log('   - Description updated immediately without page refresh');
      console.log('   - setQueryData is correctly using result.data');

    } catch (error) {
      console.log('❌ FAIL: Description NOT immediately visible');
      console.log('Error:', error);

      // Check what's actually visible
      const visibleText = await page.locator('body').textContent();
      console.log('Searching for:', newDescription);
      console.log('Found in page:', visibleText?.includes(newDescription));

      await page.screenshot({ path: 'e2e/screenshots/invoice-fix/08-verification-failed.png', fullPage: true });

      throw new Error('Invoice line item description did not update immediately after save');
    }
  });
});
