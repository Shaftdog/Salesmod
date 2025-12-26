import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Billing Contact Validation on Invoice Page', () => {
  const screenshotDir = path.join(process.cwd(), 'e2e', 'screenshots', 'billing-validation');
  let testInvoiceId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Complete billing contact validation flow', async ({ page }) => {
    console.log('Step 1: Navigate to Finance > Invoicing');

    // Navigate to Invoicing page
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of invoicing page
    await page.screenshot({
      path: path.join(screenshotDir, '01-invoicing-page.png'),
      fullPage: true
    });

    console.log('Step 2: Find a draft invoice');

    // Try to filter by draft
    const statusSelect = page.locator('[role="combobox"]').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.waitForTimeout(500);

      const draftOption = page.locator('[role="option"]').filter({ hasText: /^Draft$/i });
      if (await draftOption.count() > 0) {
        await draftOption.click();
        await page.waitForTimeout(1500);
      }
    }

    // Take screenshot showing filtered list
    await page.screenshot({
      path: path.join(screenshotDir, '02-invoice-list-filtered.png'),
      fullPage: true
    });

    // Find an invoice link
    const invoiceLink = page.locator('table a[href*="/finance/invoicing/"]').first();

    // Check if we found any invoices
    const hasInvoices = await invoiceLink.count() > 0;
    console.log(`Found invoices: ${hasInvoices}`);

    if (!hasInvoices) {
      // Try without filter
      console.log('No draft invoices, trying all statuses');
      await page.goto('http://localhost:9002/finance/invoicing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    console.log('Step 3: Open invoice detail page');

    // Get the href to extract invoice ID
    const firstInvoiceLink = page.locator('table a[href*="/finance/invoicing/"]').first();
    const href = await firstInvoiceLink.getAttribute('href');
    console.log(`Invoice URL: ${href}`);

    // Navigate to the invoice
    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Step 4: Verify warning banner (if client has no billing contact)');

    // Take screenshot of invoice detail page
    await page.screenshot({
      path: path.join(screenshotDir, '03-invoice-detail-page.png'),
      fullPage: true
    });

    // Look for warning banner about billing contact
    const warningBanner = page.locator('[role="alert"]').filter({
      hasText: /billing.*contact.*required/i
    });

    const bannerExists = await warningBanner.count() > 0;
    console.log(`Warning banner visible: ${bannerExists}`);

    if (bannerExists) {
      console.log('SUCCESS: Found billing contact warning banner');

      // Highlight banner for screenshot
      await warningBanner.first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(screenshotDir, '04-warning-banner-visible.png'),
        fullPage: true
      });

      // Look for configure button in banner
      const configureButton = page.getByRole('link', { name: /configure.*billing/i })
        .or(page.getByRole('button', { name: /configure.*billing/i }));

      if (await configureButton.count() > 0) {
        console.log('Found Configure Billing Contact button');
      }
    } else {
      console.log('No warning banner - client may already have billing contact configured');
      console.log('Will test the send dialog validation instead');
    }

    console.log('Step 5: Click Send Invoice button');

    // Find Send Invoice button
    const sendInvoiceButton = page.getByRole('button', { name: /send invoice/i });

    // Wait for it to be visible
    await sendInvoiceButton.waitFor({ state: 'visible', timeout: 5000 });

    // Take screenshot before clicking
    await sendInvoiceButton.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(screenshotDir, '05-before-send-invoice-click.png'),
      fullPage: true
    });

    await sendInvoiceButton.click();
    await page.waitForTimeout(1500);

    console.log('Step 6: Verify send invoice dialog');

    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]').last();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Take screenshot of dialog
    await page.screenshot({
      path: path.join(screenshotDir, '06-send-invoice-dialog.png'),
      fullPage: true
    });

    // Get dialog text content
    const dialogText = await dialog.textContent();
    console.log('Dialog content preview:', dialogText?.substring(0, 300));

    // Check for warning about missing billing contact
    const hasWarning = dialogText?.toLowerCase().includes('billing contact') ||
                      dialogText?.toLowerCase().includes('configure') ||
                      dialogText?.toLowerCase().includes('no contact');

    console.log(`Dialog shows billing contact warning: ${hasWarning}`);

    // Check if Send button in dialog is disabled
    const dialogSendButton = dialog.getByRole('button', { name: /send/i, exact: false });

    if (await dialogSendButton.count() > 0) {
      const isDisabled = await dialogSendButton.isDisabled();
      console.log(`Send button in dialog is disabled: ${isDisabled}`);

      if (hasWarning && !isDisabled) {
        console.log('BUG: Send button should be disabled when billing contact is missing');
      } else if (hasWarning && isDisabled) {
        console.log('SUCCESS: Send button is correctly disabled');
      }

      // Take closeup of send button state
      await dialogSendButton.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(screenshotDir, '07-send-button-state.png'),
        fullPage: true
      });
    }

    // Look for link to configure billing contact
    const configureLink = dialog.getByRole('link', { name: /configure/i })
      .or(dialog.locator('a').filter({ hasText: /billing/i }));

    const hasConfigureLink = await configureLink.count() > 0;
    console.log(`Dialog has configure billing contact link: ${hasConfigureLink}`);

    // Close dialog
    const cancelButton = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('Step 7: Testing complete - captured all validation states');

    // Take final screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '08-test-complete.png'),
      fullPage: true
    });

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Warning banner present: ${bannerExists}`);
    console.log(`Dialog shows warning: ${hasWarning}`);
    console.log(`Configure link available: ${hasConfigureLink}`);
    console.log('Screenshots saved to:', screenshotDir);
  });

  test('Happy path: Invoice with billing contact configured', async ({ page }) => {
    console.log('Testing invoice with billing contact configured');

    // Navigate to invoicing page
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open first invoice
    const firstInvoiceLink = page.locator('table a[href*="/finance/invoicing/"]').first();

    if (await firstInvoiceLink.count() === 0) {
      console.log('No invoices found to test');
      return;
    }

    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '09-invoice-for-happy-path.png'),
      fullPage: true
    });

    // Check if warning banner is absent (good case)
    const warningBanner = page.locator('[role="alert"]').filter({
      hasText: /billing.*contact/i
    });

    const hasWarning = await warningBanner.count() > 0;
    console.log(`Has billing contact warning: ${hasWarning}`);

    if (!hasWarning) {
      console.log('No warning - this client has billing contact configured');

      // Click Send Invoice
      const sendButton = page.getByRole('button', { name: /send invoice/i });
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Check dialog
      const dialog = page.locator('[role="dialog"]').last();
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      await page.screenshot({
        path: path.join(screenshotDir, '10-send-dialog-with-billing.png'),
        fullPage: true
      });

      // Check if send button is enabled
      const dialogSendButton = dialog.getByRole('button', { name: /send/i, exact: false });
      const isDisabled = await dialogSendButton.isDisabled();

      console.log(`Send button enabled (not disabled): ${!isDisabled}`);

      if (!isDisabled) {
        console.log('SUCCESS: Send button is enabled for invoice with billing contact');
      }

      // Check if email is shown
      const dialogText = await dialog.textContent();
      const hasEmail = dialogText?.includes('@');
      console.log(`Dialog shows email address: ${hasEmail}`);

      await page.screenshot({
        path: path.join(screenshotDir, '11-happy-path-complete.png'),
        fullPage: true
      });
    }
  });
});
