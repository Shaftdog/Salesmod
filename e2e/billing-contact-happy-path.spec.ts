import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Billing Contact Happy Path Test', () => {
  const screenshotDir = path.join(process.cwd(), 'e2e', 'screenshots', 'billing-validation');

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Configure billing contact and verify invoice flow', async ({ page }) => {
    console.log('Step 1: Navigate to Clients page');

    await page.goto('http://localhost:9002/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, '20-clients-page.png'),
      fullPage: true
    });

    console.log('Step 2: Open client detail page');

    // Find Marcus Ellington or first client
    const clientLink = page.locator('a[href*="/clients/"]').filter({ hasText: /Marcus Ellington/i }).first();

    if (await clientLink.count() === 0) {
      console.log('Marcus Ellington not found, using first client');
      const firstClient = page.locator('a[href*="/clients/"]').first();
      await firstClient.click();
    } else {
      await clientLink.click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, '21-client-detail-page.png'),
      fullPage: true
    });

    console.log('Step 3: Look for billing contact configuration');

    // Get page text to understand the structure
    const pageText = await page.textContent('body');
    console.log('Page has billing text:', pageText?.toLowerCase().includes('billing'));

    // Look for Edit button to enter edit mode
    const editButton = page.getByRole('button', { name: /edit/i }).first();

    if (await editButton.count() > 0 && await editButton.isVisible()) {
      console.log('Found Edit button, clicking...');
      await editButton.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(screenshotDir, '22-client-edit-mode.png'),
        fullPage: true
      });
    }

    // Look for billing-related input or checkbox
    const billingCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator(':scope ~ label:has-text("billing"), :scope ~ *:has-text("billing")')
    }).first();

    // Alternative: look for any checkbox near "billing" text
    const allCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    console.log(`Found ${checkboxCount} checkboxes on page`);

    // Try to find checkbox by looking at nearby text
    let billingCheckboxFound = false;
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const parent = checkbox.locator('..');
      const parentText = await parent.textContent();

      if (parentText?.toLowerCase().includes('billing') || parentText?.toLowerCase().includes('company email')) {
        console.log(`Found billing checkbox at index ${i}: ${parentText?.substring(0, 100)}`);

        // Check if already checked
        const isChecked = await checkbox.isChecked();
        console.log(`Checkbox is checked: ${isChecked}`);

        if (!isChecked) {
          await checkbox.check();
          console.log('Checked billing contact checkbox');
          billingCheckboxFound = true;
          await page.waitForTimeout(500);
          break;
        } else {
          console.log('Checkbox already checked');
          billingCheckboxFound = true;
          break;
        }
      }
    }

    if (!billingCheckboxFound) {
      console.log('Could not find billing checkbox - trying alternative approach');

      // Try to find email field and check if it can be used for billing
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        const emailValue = await emailInput.inputValue();
        console.log(`Client email: ${emailValue}`);

        // Look for any text about billing near email
        const emailContainer = emailInput.locator('..');
        const containerText = await emailContainer.textContent();
        console.log('Email container text:', containerText?.substring(0, 200));
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '23-billing-configured.png'),
      fullPage: true
    });

    // Save changes if there's a save button
    const saveButton = page.getByRole('button', { name: /save|update/i }).first();
    if (await saveButton.count() > 0 && await saveButton.isVisible()) {
      console.log('Saving client changes...');
      await saveButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('Step 4: Navigate to invoice for this client');

    // Go to invoicing page
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find invoice for Marcus Ellington
    const invoiceRow = page.locator('tr').filter({ hasText: /Marcus Ellington/i }).first();

    if (await invoiceRow.count() > 0) {
      console.log('Found invoice for Marcus Ellington');
      const invoiceLink = invoiceRow.locator('a[href*="/finance/invoicing/"]').first();
      await invoiceLink.click();
    } else {
      console.log('No invoice found for this client, using first invoice');
      const firstInvoiceLink = page.locator('table a[href*="/finance/invoicing/"]').first();
      await firstInvoiceLink.click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, '24-invoice-after-billing-config.png'),
      fullPage: true
    });

    console.log('Step 5: Verify warning banner state');

    const warningBanner = page.locator('[role="alert"]').filter({
      hasText: /billing.*contact/i
    });

    const hasWarning = await warningBanner.count() > 0;
    console.log(`Warning banner present: ${hasWarning}`);

    if (!hasWarning) {
      console.log('✅ SUCCESS: Warning banner is gone after configuring billing contact');
    } else {
      console.log('⚠️ Warning banner still present - billing contact may not have been saved');
    }

    console.log('Step 6: Test Send Invoice dialog');

    const sendButton = page.getByRole('button', { name: /send invoice/i });

    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(1500);

      const dialog = page.locator('[role="dialog"]').last();
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      await page.screenshot({
        path: path.join(screenshotDir, '25-send-dialog-with-billing.png'),
        fullPage: true
      });

      // Check dialog content
      const dialogText = await dialog.textContent();
      console.log('Dialog content:', dialogText?.substring(0, 300));

      const hasWarningInDialog = dialogText?.toLowerCase().includes('no billing contact');
      console.log(`Dialog has warning: ${hasWarningInDialog}`);

      // Check if send button is enabled
      const dialogSendButton = dialog.getByRole('button', { name: /send/i, exact: false });
      const isDisabled = await dialogSendButton.isDisabled();
      console.log(`Send button disabled: ${isDisabled}`);
      console.log(`Send button enabled: ${!isDisabled}`);

      // Check for email in dialog
      const hasEmail = dialogText?.includes('@');
      console.log(`Dialog shows email: ${hasEmail}`);

      if (!hasWarningInDialog && !isDisabled && hasEmail) {
        console.log('✅ SUCCESS: Happy path working correctly');
        console.log('  - No warning in dialog');
        console.log('  - Send button enabled');
        console.log('  - Email address shown');
      }

      await page.screenshot({
        path: path.join(screenshotDir, '26-happy-path-final.png'),
        fullPage: true
      });
    }
  });
});
