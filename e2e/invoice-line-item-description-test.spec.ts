import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'line-item-description');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Invoice Line Item Description Edit', () => {
  test.setTimeout(120000); // 2 minute timeout

  test('should successfully edit and save invoice line item description', async ({ page }) => {
    const timestamp = new Date().toISOString();
    const testDescription = `DESCRIPTION TEST - ${timestamp}`;

    // Step 1: Navigate to the application
    console.log('Step 1: Navigating to http://localhost:9002');
    await page.goto('http://localhost:9002', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-homepage.png'), fullPage: true });

    // Step 2: Log in
    console.log('Step 2: Logging in');

    // Check if already logged in
    const isLoggedIn = await page.locator('text=Finance').isVisible().catch(() => false);

    if (!isLoggedIn) {
      // Try to find and click sign in button
      const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Login")').first();
      if (await signInButton.isVisible().catch(() => false)) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Fill in credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('rod@myroihome.com');

      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill('Latter!974');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-form.png'), fullPage: true });

      // Submit login
      const submitButton = page.locator('button[type="submit"]:has-text("Sign"), button:has-text("Log in"), button:has-text("Sign In")').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-logged-in.png'), fullPage: true });

    // Step 3: Navigate to Finance > Invoicing
    console.log('Step 3: Navigating to Finance > Invoicing');

    // Try to find Finance menu/link
    const financeLink = page.locator('a:has-text("Finance"), button:has-text("Finance")').first();
    await financeLink.waitFor({ state: 'visible', timeout: 10000 });
    await financeLink.click();
    await page.waitForTimeout(1000);

    // Look for Invoicing link
    const invoicingLink = page.locator('a:has-text("Invoicing")').first();
    if (await invoicingLink.isVisible().catch(() => false)) {
      await invoicingLink.click();
    } else {
      // Maybe we're already on invoicing page or need to navigate directly
      await page.goto('http://localhost:9002/finance/invoicing');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-invoicing-page.png'), fullPage: true });

    // Step 4: Find invoice INV-00021 or any available invoice
    console.log('Step 4: Finding invoice INV-00021');

    let invoiceFound = false;
    let invoiceSelector = '';

    // Try to find INV-00021
    const targetInvoice = page.locator('text=INV-00021').first();
    if (await targetInvoice.isVisible().catch(() => false)) {
      invoiceSelector = 'text=INV-00021';
      invoiceFound = true;
    } else {
      // Find any invoice number (INV-XXXXX format)
      const anyInvoice = page.locator('text=/INV-\\d{5}/').first();
      if (await anyInvoice.isVisible().catch(() => false)) {
        const invoiceText = await anyInvoice.textContent();
        console.log(`Using invoice: ${invoiceText}`);
        invoiceSelector = `text=${invoiceText}`;
        invoiceFound = true;
      }
    }

    if (!invoiceFound) {
      throw new Error('No invoice found on the page');
    }

    // Click on the invoice to view details
    await page.locator(invoiceSelector).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-invoice-detail.png'), fullPage: true });

    // Step 5: Click Edit button
    console.log('Step 5: Clicking Edit button');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-edit-dialog-opened.png'), fullPage: true });

    // Step 6: Change the description of a line item
    console.log('Step 6: Changing line item description');

    // Find the first line item description input/textarea
    const descriptionInput = page.locator('input[name*="description"], textarea[name*="description"], input[placeholder*="Description"], textarea[placeholder*="Description"]').first();
    await descriptionInput.waitFor({ state: 'visible', timeout: 10000 });

    // Get the original description
    const originalDescription = await descriptionInput.inputValue();
    console.log(`Original description: ${originalDescription}`);

    // Clear and enter new description
    await descriptionInput.clear();
    await descriptionInput.fill(testDescription);
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-description-changed.png'), fullPage: true });

    // Verify the input shows our new description
    const currentValue = await descriptionInput.inputValue();
    console.log(`New description in input: ${currentValue}`);
    expect(currentValue).toBe(testDescription);

    // Step 7: Save the invoice
    console.log('Step 7: Saving the invoice');

    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    // Wait for save operation to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-after-save.png'), fullPage: true });

    // Step 8: Verify the description change persists
    console.log('Step 8: Verifying description persists');

    // The page should show the updated description
    const descriptionOnPage = page.locator(`text="${testDescription}"`).first();

    // Wait for the description to appear on the page
    try {
      await descriptionOnPage.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ SUCCESS: Description found on page after save');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-verification-success.png'), fullPage: true });

      // Additional verification: reload the page and check again
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const descriptionAfterReload = page.locator(`text="${testDescription}"`).first();
      await descriptionAfterReload.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ SUCCESS: Description still present after page reload');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-verification-after-reload.png'), fullPage: true });

    } catch (error) {
      console.log('❌ FAILURE: Description not found on page');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-verification-failed.png'), fullPage: true });
      throw error;
    }
  });
});
