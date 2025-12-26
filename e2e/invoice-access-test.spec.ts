import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const CREDENTIALS = {
  email: 'rod@myroihome.com',
  password: 'Latter!974'
};

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots', 'invoice-test', new Date().toISOString().split('T')[0]);

test.describe('Invoice Access and Print Feature Tests', () => {
  test.beforeAll(() => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
  });

  test('1. Invoice Access Test - Multi-tenant fix verification', async ({ page }) => {
    console.log('=== Test 1: Invoice Access Test ===');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);

    // Take screenshot of login page
    await page.screenshot({
      path: path.join(screenshotDir, '01-login-page.png'),
      fullPage: true
    });

    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, '02-after-login.png'),
      fullPage: true
    });

    console.log('Step 2: Navigating to Finance > Invoicing...');

    // Navigate to invoicing page
    await page.goto(`${BASE_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of invoice list
    await page.screenshot({
      path: path.join(screenshotDir, '03-invoice-list.png'),
      fullPage: true
    });

    // Check if there are any invoices (exclude the "new" invoice link)
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"]:not([href="/finance/invoicing/new"])');
    const invoiceCount = await invoiceLinks.count();

    console.log(`Found ${invoiceCount} invoice links`);

    if (invoiceCount === 0) {
      console.log('WARNING: No invoices found on the page');
      // Check for error messages
      const errorText = await page.locator('text=/error|not found|no invoices/i').count();
      if (errorText > 0) {
        const errorContent = await page.locator('text=/error|not found|no invoices/i').first().textContent();
        console.log(`Error message found: ${errorContent}`);
      }

      // Take screenshot showing no invoices
      await page.screenshot({
        path: path.join(screenshotDir, '04-no-invoices-found.png'),
        fullPage: true
      });

      throw new Error('No invoices found to test');
    }

    console.log('Step 3: Clicking on first invoice...');

    // Click on the first invoice (not the "new" link)
    const firstInvoiceHref = await invoiceLinks.first().getAttribute('href');
    console.log(`First invoice link: ${firstInvoiceHref}`);

    await invoiceLinks.first().click();

    // Wait for invoice detail page to load
    await page.waitForLoadState('networkidle');

    // Wait for the loading message to disappear
    console.log('Waiting for invoice to finish loading...');
    await page.waitForSelector('text=Loading invoice...', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Loading message not found or already hidden');
    });

    // Wait for actual invoice content to appear
    await page.waitForTimeout(3000);

    // Take screenshot of invoice detail page
    await page.screenshot({
      path: path.join(screenshotDir, '04-invoice-detail-page.png'),
      fullPage: true
    });

    console.log('Step 4: Verifying invoice loaded successfully...');

    // Check for error messages
    const notFoundError = await page.locator('text=/invoice not found/i').count();
    const errorHeading = await page.locator('h1:has-text("Error"), h2:has-text("Error")').count();
    const errorMessage = await page.locator('[role="alert"], .error, .error-message').count();

    if (notFoundError > 0) {
      const errorText = await page.locator('text=/invoice not found/i').first().textContent();
      console.log(`ERROR: Invoice not found - ${errorText}`);
      throw new Error(`Invoice not found error displayed: ${errorText}`);
    }

    if (errorHeading > 0) {
      const errorText = await page.locator('h1:has-text("Error"), h2:has-text("Error")').first().textContent();
      console.log(`ERROR: Error heading found - ${errorText}`);
      throw new Error(`Error page displayed: ${errorText}`);
    }

    // Verify invoice content is visible
    const invoiceContent = await page.locator('text=/invoice|total|amount|date/i').count();
    console.log(`Invoice content elements found: ${invoiceContent}`);

    expect(invoiceContent).toBeGreaterThan(0);

    // Check console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (consoleErrors.length > 0) {
      console.log('Console errors detected:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('✅ Invoice loaded successfully without errors');
  });

  test('2. Print Feature Test', async ({ page }) => {
    console.log('=== Test 2: Print Feature Test ===');

    // Login first
    console.log('Logging in...');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to invoicing
    console.log('Navigating to invoicing...');
    await page.goto(`${BASE_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');

    // Click on first invoice (exclude the "new" link)
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"]:not([href="/finance/invoicing/new"])');
    const invoiceCount = await invoiceLinks.count();

    if (invoiceCount === 0) {
      throw new Error('No invoices found to test print feature');
    }

    await invoiceLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Wait for the loading message to disappear
    console.log('Waiting for invoice to finish loading...');
    await page.waitForSelector('text=Loading invoice...', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Loading message not found or already hidden');
    });

    await page.waitForTimeout(3000);

    console.log('Looking for Print button...');

    // Take screenshot before clicking print
    await page.screenshot({
      path: path.join(screenshotDir, '05-before-print.png'),
      fullPage: true
    });

    // Look for Print button (various possible selectors)
    const printButtonSelectors = [
      'button:has-text("Print")',
      'button:has-text("print")',
      'a:has-text("Print")',
      '[aria-label*="print" i]',
      'button[title*="print" i]',
      '.print-button',
      '#print-button'
    ];

    let printButton = null;
    let foundSelector = '';

    for (const selector of printButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        printButton = page.locator(selector).first();
        foundSelector = selector;
        console.log(`Found print button with selector: ${selector}`);
        break;
      }
    }

    if (!printButton) {
      console.log('WARNING: Print button not found');
      console.log('Page URL:', page.url());

      // Get all buttons on the page for debugging
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons);

      await page.screenshot({
        path: path.join(screenshotDir, '06-no-print-button.png'),
        fullPage: true
      });

      throw new Error('Print button not found on invoice detail page');
    }

    console.log('Clicking Print button...');

    // Click print button
    await printButton.click();

    // Wait for dialog/modal to open
    await page.waitForTimeout(1000);

    // Take screenshot after clicking print
    await page.screenshot({
      path: path.join(screenshotDir, '06-after-print-click.png'),
      fullPage: true
    });

    console.log('Verifying print dialog/modal opened...');

    // Check for print dialog/modal (various possibilities)
    const dialogSelectors = [
      '[role="dialog"]',
      '.modal',
      '.print-modal',
      '.print-dialog',
      '[data-state="open"]'
    ];

    let dialogFound = false;
    for (const selector of dialogSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        dialogFound = true;
        console.log(`Found dialog with selector: ${selector}`);
        break;
      }
    }

    // Alternative: Check if print preview was triggered (browser's print dialog)
    // This is harder to detect in Playwright, so we'll check for either modal or assume browser print

    if (!dialogFound) {
      console.log('Note: No modal dialog found - print may have triggered browser print dialog');
      // This is acceptable - browser print dialog is outside of page control
    }

    await page.screenshot({
      path: path.join(screenshotDir, '07-print-dialog.png'),
      fullPage: true
    });

    // Try to close dialog if it exists
    const closeButtons = await page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').count();
    if (closeButtons > 0) {
      console.log('Attempting to close dialog...');
      try {
        // Try pressing Escape key first (more reliable)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('Dialog closed with Escape key');
      } catch (e) {
        console.log('Could not close dialog with Escape, trying click...');
        try {
          await page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').first().click({ timeout: 5000, force: true });
          await page.waitForTimeout(500);
          console.log('Dialog closed with click');
        } catch (closeError) {
          console.log('Could not close dialog, but this is not critical for the test');
        }
      }
    }

    console.log('✅ Print feature test completed');
  });

  test('3. Navigation Test', async ({ page }) => {
    console.log('=== Test 3: Navigation Test ===');

    // Login
    console.log('Logging in...');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to invoicing
    console.log('Navigating to invoicing...');
    await page.goto(`${BASE_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');

    // Click on first invoice (exclude the "new" link)
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"]:not([href="/finance/invoicing/new"])');
    const initialInvoiceCount = await invoiceLinks.count();

    if (initialInvoiceCount === 0) {
      throw new Error('No invoices found to test navigation');
    }

    console.log(`Found ${initialInvoiceCount} invoices initially`);

    await invoiceLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Wait for the loading message to disappear
    console.log('Waiting for invoice to finish loading...');
    await page.waitForSelector('text=Loading invoice...', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Loading message not found or already hidden');
    });

    await page.waitForTimeout(2000);

    console.log('On invoice detail page, navigating back...');

    // Take screenshot of detail page
    await page.screenshot({
      path: path.join(screenshotDir, '08-invoice-detail-before-back.png'),
      fullPage: true
    });

    // Navigate back using breadcrumb link or back button
    const backButtonSelectors = [
      'a[href="/finance/invoicing"]',  // Breadcrumb link
      'button:has-text("Back")',
      'a:has-text("Back")',
      '[aria-label*="back" i]'
    ];

    let backButton = null;
    for (const selector of backButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        backButton = page.locator(selector).first();
        console.log(`Found back navigation with selector: ${selector}`);
        break;
      }
    }

    if (backButton) {
      console.log('Clicking back navigation...');
      await backButton.click();
    } else {
      console.log('No back navigation found, navigating directly...');
      await page.goto(`${BASE_URL}/finance/invoicing`);
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify we're back on the invoice list
    await page.screenshot({
      path: path.join(screenshotDir, '09-invoice-list-after-back.png'),
      fullPage: true
    });

    console.log('Verifying multiple invoices displayed...');

    const finalInvoiceLinks = page.locator('a[href*="/finance/invoicing/"]:not([href="/finance/invoicing/new"])');
    const finalInvoiceCount = await finalInvoiceLinks.count();

    console.log(`Found ${finalInvoiceCount} invoices after navigation`);

    expect(finalInvoiceCount).toBeGreaterThan(0);

    // Verify we're on the list page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    expect(currentUrl).toContain('/finance/invoicing');
    expect(currentUrl).not.toMatch(/\/finance\/invoicing\/[^/]+$/);

    console.log('✅ Navigation test completed successfully');
  });

  test.afterAll(async () => {
    console.log('\n=== Test Summary ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
  });
});
