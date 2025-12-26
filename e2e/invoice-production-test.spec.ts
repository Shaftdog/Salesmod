import { test, expect } from '@playwright/test';
import * as path from 'path';

const PRODUCTION_URL = 'https://salesmod-j6cc0hmrh-rods-projects-0780b34c.vercel.app';
const EMAIL = 'rod@myroihome.com';
const PASSWORD = 'Latter!974';

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots', 'invoice-production-test');

test.describe('Invoice Production Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for production testing
    test.setTimeout(90000);

    // Navigate directly to production login page with retries
    let loginSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!loginSuccess && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`Attempt ${attempts}/${maxAttempts}: Navigating to ${PRODUCTION_URL}/login`);
        await page.goto(`${PRODUCTION_URL}/login`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        loginSuccess = true;
      } catch (error) {
        console.log(`Attempt ${attempts} failed:`, error.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to access production URL after ${maxAttempts} attempts. Please verify the URL is accessible.`);
        }
        await page.waitForTimeout(2000);
      }
    }

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Take screenshot of initial login page
    await page.screenshot({
      path: path.join(screenshotDir, '01-login-page-initial.png'),
      fullPage: true
    });

    // Check if this is Vercel auth page (Continue with Email button)
    const continueWithEmailButton = page.locator('button:has-text("Continue with Email")');
    const isVercelAuth = await continueWithEmailButton.count() > 0;

    if (isVercelAuth) {
      console.log('Detected Vercel auth page, filling email and clicking Continue...');
      // Fill email first
      await page.fill('input[type="email"], input[name="email"]', EMAIL);
      await page.screenshot({
        path: path.join(screenshotDir, '02-email-filled.png'),
        fullPage: true
      });

      // Click Continue with Email
      await continueWithEmailButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot after clicking continue
      await page.screenshot({
        path: path.join(screenshotDir, '03-after-continue.png'),
        fullPage: true
      });

      // Now fill password on the next screen
      await page.fill('input[type="password"], input[name="password"]', PASSWORD);
      await page.screenshot({
        path: path.join(screenshotDir, '04-password-filled.png'),
        fullPage: true
      });

      // Click the continue/login button
      await page.click('button[type="submit"], button:has-text("Continue")');
    } else {
      console.log('Standard login form detected');
      // Standard login flow
      await page.fill('input[type="email"], input[name="email"]', EMAIL);
      await page.fill('input[type="password"], input[name="password"]', PASSWORD);

      await page.screenshot({
        path: path.join(screenshotDir, '02-login-form-filled.png'),
        fullPage: true
      });

      await page.click('button[type="submit"]');
    }

    // Wait for navigation after login (more flexible URL matching)
    try {
      await page.waitForURL(/\/(dashboard|finance|properties|cases|contacts)/, { timeout: 20000 });
    } catch (error) {
      // Take screenshot if navigation fails
      await page.screenshot({
        path: path.join(screenshotDir, '05-login-failed.png'),
        fullPage: true
      });
      console.log('Current URL after login attempt:', page.url());
      throw error;
    }

    // Take screenshot after login
    await page.screenshot({
      path: path.join(screenshotDir, '02-after-login.png'),
      fullPage: true
    });
  });

  test('Test 1: Invoice Access - Multi-tenant fix verification', async ({ page }) => {
    console.log('Starting Test 1: Invoice Access');

    // Navigate to Finance > Invoicing
    await page.goto(`${PRODUCTION_URL}/finance/invoicing`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot of invoice list
    await page.screenshot({
      path: path.join(screenshotDir, '03-invoice-list.png'),
      fullPage: true
    });

    // Look for invoices on the page
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"], button:has-text("View"), [data-testid*="invoice"]');
    const invoiceCount = await invoiceLinks.count();

    console.log(`Found ${invoiceCount} potential invoice links`);

    if (invoiceCount === 0) {
      console.log('No invoices found on the page. Taking screenshot of current state...');
      await page.screenshot({
        path: path.join(screenshotDir, '04-no-invoices-found.png'),
        fullPage: true
      });

      // Check for any error messages
      const bodyText = await page.textContent('body');
      console.log('Page content preview:', bodyText?.substring(0, 500));

      throw new Error('No invoices found to test. Please verify invoices exist in the system.');
    }

    // Click on the first invoice
    await invoiceLinks.first().click();

    // Wait for navigation or modal to appear
    await page.waitForTimeout(2000);

    // Check for "Invoice not found" error
    const notFoundError = await page.locator('text=/invoice not found/i').count();
    const errorMessage = await page.locator('[role="alert"], .error, .alert-error').count();

    if (notFoundError > 0 || errorMessage > 0) {
      await page.screenshot({
        path: path.join(screenshotDir, '05-invoice-error.png'),
        fullPage: true
      });
      throw new Error('Invoice not found error detected - Multi-tenant fix may not be working');
    }

    // Take screenshot of invoice detail page
    await page.screenshot({
      path: path.join(screenshotDir, '06-invoice-detail-success.png'),
      fullPage: true
    });

    // Verify invoice content is displayed
    const hasInvoiceContent = await page.locator('text=/invoice|total|amount|date/i').count() > 0;
    expect(hasInvoiceContent).toBeTruthy();

    console.log('✅ Test 1 PASSED: Invoice loaded successfully without "not found" error');
  });

  test('Test 2: Print Feature Test', async ({ page }) => {
    console.log('Starting Test 2: Print Feature');

    // Navigate to invoicing page
    await page.goto(`${PRODUCTION_URL}/finance/invoicing`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(2000);

    // Find and click an invoice
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"], button:has-text("View")');
    const invoiceCount = await invoiceLinks.count();

    if (invoiceCount === 0) {
      throw new Error('No invoices found to test print feature');
    }

    await invoiceLinks.first().click();
    await page.waitForTimeout(2000);

    // Take screenshot before looking for print button
    await page.screenshot({
      path: path.join(screenshotDir, '07-before-print-click.png'),
      fullPage: true
    });

    // Look for print button with various selectors
    const printButton = page.locator('button:has-text("Print"), [data-testid="print-button"], button[aria-label*="print" i]').first();
    const printButtonExists = await printButton.count() > 0;

    if (!printButtonExists) {
      console.log('Print button not found. Checking page content...');
      await page.screenshot({
        path: path.join(screenshotDir, '08-print-button-not-found.png'),
        fullPage: true
      });
      throw new Error('Print button not found on invoice detail page');
    }

    // Click the print button
    await printButton.click();
    await page.waitForTimeout(1000);

    // Check if print dialog/modal appeared
    const printDialog = await page.locator('[role="dialog"], .modal, [data-testid*="print"]').count();

    // Take screenshot showing print dialog
    await page.screenshot({
      path: path.join(screenshotDir, '09-print-dialog.png'),
      fullPage: true
    });

    if (printDialog > 0) {
      console.log('✅ Print dialog/modal opened successfully');

      // Try to close the dialog
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);
        console.log('Dialog closed successfully');
      }
    } else {
      console.log('⚠️ Print button clicked but no visible dialog detected. May have triggered browser print or PDF download.');
    }

    console.log('✅ Test 2 COMPLETED: Print feature tested');
  });

  test('Test 3: Navigation and Invoice List Test', async ({ page }) => {
    console.log('Starting Test 3: Navigation Test');

    // Navigate to Finance > Invoicing
    await page.goto(`${PRODUCTION_URL}/finance/invoicing`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(2000);

    // Take screenshot of invoice list
    await page.screenshot({
      path: path.join(screenshotDir, '10-invoice-list-navigation.png'),
      fullPage: true
    });

    // Count invoices displayed
    const invoiceItems = await page.locator('tr:has(td), [data-testid*="invoice-item"], .invoice-row').count();

    console.log(`Found ${invoiceItems} invoice items displayed`);

    // Verify multiple invoices are shown
    expect(invoiceItems).toBeGreaterThan(0);

    // Check for navigation elements
    const navigationExists = await page.locator('nav, [role="navigation"], .sidebar').count() > 0;
    expect(navigationExists).toBeTruthy();

    console.log('✅ Test 3 PASSED: Invoice list displays correctly with navigation');
  });

  test('Test 4: End-to-End Invoice Flow', async ({ page }) => {
    console.log('Starting Test 4: End-to-End Flow');

    // 1. Navigate to invoice list
    await page.goto(`${PRODUCTION_URL}/finance/invoicing`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, '11-e2e-invoice-list.png'),
      fullPage: true
    });

    // 2. Click on an invoice
    const invoiceLinks = page.locator('a[href*="/finance/invoicing/"], button:has-text("View")');
    const invoiceCount = await invoiceLinks.count();

    if (invoiceCount === 0) {
      throw new Error('No invoices found for E2E test');
    }

    await invoiceLinks.first().click();
    await page.waitForTimeout(2000);

    // 3. Verify invoice detail loaded
    await page.screenshot({
      path: path.join(screenshotDir, '12-e2e-invoice-detail.png'),
      fullPage: true
    });

    const notFoundError = await page.locator('text=/invoice not found/i').count();
    expect(notFoundError).toBe(0);

    // 4. Navigate back to list
    await page.goBack();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, '13-e2e-back-to-list.png'),
      fullPage: true
    });

    // 5. Verify we're back on the list page
    const backOnList = await page.locator('a[href*="/finance/invoicing/"]').count() > 0;
    expect(backOnList).toBeTruthy();

    console.log('✅ Test 4 PASSED: Complete E2E invoice flow works correctly');
  });
});
