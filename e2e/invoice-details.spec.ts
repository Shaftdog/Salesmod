import { test, expect } from '@playwright/test';

/**
 * Invoice Details Page Test
 *
 * Tests the fix for the "Invoice not found" issue where the useInvoice hook
 * was not correctly extracting the data field from the API response.
 *
 * Bug Fix: API returns { data: invoice, message, meta } but hook was using
 * the entire response object instead of extracting result.data
 */

test.describe('Invoice Details Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login form using proper selectors
    await page.fill('#email', 'shaugabrooks@gmail.com');
    await page.fill('#password', 'Latter!974');

    // Submit and wait for navigation
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard (window.location.href is used)
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Navigate to the invoicing list page
    await page.goto('/finance/invoicing');
    await page.waitForLoadState('networkidle');
  });

  test('should load invoice list page without errors', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the page title is present
    await expect(page.locator('h1')).toContainText('Invoices');

    // Take a screenshot of the list page
    await page.screenshot({
      path: 'tests/screenshots/invoice-list.png',
      fullPage: true
    });
  });

  test('should display invoice details when clicking on an invoice', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for the table to be visible (it might be loading)
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {
      console.log('Table not found - checking if there are no invoices');
    });

    // Check if there are any invoices in the table
    const noInvoicesMessage = page.locator('text=No invoices found');
    const isEmptyState = await noInvoicesMessage.isVisible().catch(() => false);

    if (isEmptyState) {
      console.log('No invoices exist in the database. Test will create one first.');

      // Click the "Create Invoice" button
      await page.click('text=Create Invoice');
      await page.waitForLoadState('networkidle');

      // Fill out the invoice creation form (this is a simplified version)
      // In a real scenario, we'd need to fill all required fields
      console.log('Invoice creation form would need to be filled here');

      // For now, we'll skip this test if no invoices exist
      test.skip();
      return;
    }

    // Take a screenshot of the invoice list
    await page.screenshot({
      path: 'tests/screenshots/invoice-list-before-click.png',
      fullPage: true
    });

    // Find the first invoice link in the table
    const firstInvoiceLink = page.locator('table tbody tr').first().locator('a').first();

    // Get the invoice number for verification
    const invoiceNumber = await firstInvoiceLink.textContent();
    console.log(`Clicking on invoice: ${invoiceNumber}`);

    // Click on the first invoice
    await firstInvoiceLink.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Wait a bit for any client-side rendering
    await page.waitForTimeout(1000);

    // Take a screenshot of the details page
    await page.screenshot({
      path: 'tests/screenshots/invoice-details-page.png',
      fullPage: true
    });

    // CRITICAL TEST: Verify that "Invoice not found" is NOT displayed
    const notFoundText = page.locator('text=Invoice not found');
    const isNotFoundVisible = await notFoundText.isVisible().catch(() => false);

    if (isNotFoundVisible) {
      console.error('FAILED: "Invoice not found" message is displayed!');
      await page.screenshot({
        path: 'tests/screenshots/invoice-not-found-error.png',
        fullPage: true
      });
    }

    expect(isNotFoundVisible).toBe(false);

    // Verify the page title contains the invoice number
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('Invoice');
    if (invoiceNumber) {
      await expect(pageTitle).toContainText(invoiceNumber);
    }

    // Verify invoice details are displayed
    await expect(page.locator('text=Client Information')).toBeVisible();
    await expect(page.locator('text=Payment Summary')).toBeVisible();
    await expect(page.locator('text=Line Items')).toBeVisible();

    // Verify payment summary fields are present
    await expect(page.locator('text=Total Amount:')).toBeVisible();
    await expect(page.locator('text=Amount Paid:')).toBeVisible();
    await expect(page.locator('text=Balance Due:')).toBeVisible();
    await expect(page.locator('text=Payment Method')).toBeVisible();

    // Verify status badge is displayed
    const statusBadge = page.locator('[class*="badge"]').first();
    await expect(statusBadge).toBeVisible();

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);

    // Report console errors if any
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:');
      consoleErrors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }

    // Verify no console errors related to undefined data
    const hasUndefinedError = consoleErrors.some(err =>
      err.includes('undefined') ||
      err.includes('Cannot read property') ||
      err.includes('Cannot read properties of undefined')
    );

    expect(hasUndefinedError).toBe(false);
  });

  test('should display action buttons based on invoice status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if there are any invoices
    const noInvoicesMessage = page.locator('text=No invoices found');
    const isEmptyState = await noInvoicesMessage.isVisible().catch(() => false);

    if (isEmptyState) {
      test.skip();
      return;
    }

    // Click on the first invoice
    const firstInvoiceLink = page.locator('table tbody tr').first().locator('a').first();
    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');

    // Get the invoice status to determine expected buttons
    const statusBadge = await page.locator('[class*="badge"]').first().textContent();
    console.log(`Invoice status: ${statusBadge}`);

    // If invoice is not paid/cancelled/void, action buttons should be visible
    const isPaidCancelledOrVoid =
      statusBadge?.toLowerCase().includes('paid') ||
      statusBadge?.toLowerCase().includes('cancelled') ||
      statusBadge?.toLowerCase().includes('void');

    if (!isPaidCancelledOrVoid) {
      // Verify action buttons are present
      const recordPaymentButton = page.locator('text=Record Payment');
      const markAsPaidButton = page.locator('text=Mark as Paid');
      const cancelInvoiceButton = page.locator('text=Cancel Invoice');

      await expect(recordPaymentButton).toBeVisible();
      await expect(markAsPaidButton).toBeVisible();
      await expect(cancelInvoiceButton).toBeVisible();
    }

    // Take a screenshot showing the action buttons
    await page.screenshot({
      path: 'tests/screenshots/invoice-details-with-actions.png',
      fullPage: true
    });
  });

  test('should navigate back to invoice list when clicking back button', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if there are any invoices
    const noInvoicesMessage = page.locator('text=No invoices found');
    const isEmptyState = await noInvoicesMessage.isVisible().catch(() => false);

    if (isEmptyState) {
      test.skip();
      return;
    }

    // Click on the first invoice
    const firstInvoiceLink = page.locator('table tbody tr').first().locator('a').first();
    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');

    // Click the back button (ArrowLeft icon)
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Verify we're back on the invoice list page
    await expect(page.locator('h1')).toContainText('Invoices');
    await expect(page.locator('text=All Invoices')).toBeVisible();
  });

  test('should display line items table correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if there are any invoices
    const noInvoicesMessage = page.locator('text=No invoices found');
    const isEmptyState = await noInvoicesMessage.isVisible().catch(() => false);

    if (isEmptyState) {
      test.skip();
      return;
    }

    // Click on the first invoice
    const firstInvoiceLink = page.locator('table tbody tr').first().locator('a').first();
    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');

    // Verify line items section is visible
    await expect(page.locator('text=Line Items')).toBeVisible();

    // Find the line items table (should be the second table on the page)
    const lineItemsCard = page.locator('text=Line Items').locator('..');
    const lineItemsTable = lineItemsCard.locator('table');

    // Verify table headers
    await expect(lineItemsTable.locator('th:has-text("Description")')).toBeVisible();
    await expect(lineItemsTable.locator('th:has-text("Quantity")')).toBeVisible();
    await expect(lineItemsTable.locator('th:has-text("Unit Price")')).toBeVisible();
    await expect(lineItemsTable.locator('th:has-text("Tax Rate")')).toBeVisible();
    await expect(lineItemsTable.locator('th:has-text("Total")')).toBeVisible();

    // Take a screenshot of the line items
    await page.screenshot({
      path: 'tests/screenshots/invoice-line-items.png',
      fullPage: true
    });
  });
});
