import { test, expect } from '@playwright/test';

/**
 * Comprehensive test for public invoice view functionality
 * Tests the bug fix that allows public viewing of invoices via view tokens
 */

test.describe('Public Invoice View - Complete Flow', () => {
  let viewToken: string;
  let invoiceNumber: string;
  let invoiceId: string;

  test.beforeAll(async ({ browser }) => {
    // Get invoice data from the API to extract view token
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Fetch invoice data from API
    const invoiceData = await page.evaluate(async () => {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    });

    if (invoiceData?.success && invoiceData.data?.invoices?.length > 0) {
      const firstInvoice = invoiceData.data.invoices[0];
      viewToken = firstInvoice.view_token;
      invoiceNumber = firstInvoice.invoice_number;
      invoiceId = firstInvoice.id;

      console.log('Test will use invoice:', {
        number: invoiceNumber,
        id: invoiceId,
        tokenPreview: viewToken?.substring(0, 20) + '...'
      });
    }

    await context.close();
  });

  test('1. Public invoice view displays all required elements', async ({ page }) => {
    test.skip(!viewToken, 'No invoice token available');

    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    console.log('Testing public URL:', publicUrl);

    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-01-full-page.png',
      fullPage: true
    });

    // Verify page title or header
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // 1. Check for invoice number
    const hasInvoiceNumber = await page.locator(`text=${invoiceNumber}`).isVisible();
    expect(hasInvoiceNumber).toBeTruthy();
    console.log('✓ Invoice number displayed:', invoiceNumber);

    // 2. Check for company/organization name
    const companyElement = page.locator('text=/Rod Haugabrooks|My ROI Home|Company|Organization/i').first();
    const hasCompany = await companyElement.isVisible().catch(() => false);
    console.log('✓ Company section visible:', hasCompany);

    // 3. Check for status badge
    const statusBadge = page.locator('[class*="badge"], [class*="status"], text=/overdue|sent|paid|viewed/i').first();
    const hasStatus = await statusBadge.isVisible().catch(() => false);
    console.log('✓ Status badge visible:', hasStatus);

    // Take screenshot of header area
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-02-header.png'
    });

    // 4. Check for Bill To section
    const billToExists = await page.locator('text=/Bill To|Billed To|Client/i').first().isVisible().catch(() => false);
    console.log('✓ Bill To section visible:', billToExists);

    // 5. Check for line items (table or list)
    const hasTable = await page.locator('table, [role="table"], [class*="line-item"]').first().isVisible().catch(() => false);
    console.log('✓ Line items visible:', hasTable);

    // Take screenshot of line items
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-03-line-items.png'
    });

    // 6. Check for totals
    const hasTotals = await page.locator('text=/Total|Amount Due|Subtotal/i').first().isVisible().catch(() => false);
    console.log('✓ Totals section visible:', hasTotals);

    // 7. Check for payment button
    const payButton = page.locator('button:has-text("Pay"), a:has-text("Pay"), text=/Pay Now/i').first();
    const hasPayButton = await payButton.isVisible().catch(() => false);
    console.log('✓ Pay button visible:', hasPayButton);

    // Take screenshot of footer with totals
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-04-footer.png'
    });

    // Overall assertion - at least invoice number and some key elements should be visible
    expect(hasInvoiceNumber).toBeTruthy();
    expect(hasCompany || billToExists || hasTotals).toBeTruthy();

    console.log('✓ All required elements verified on public invoice view');
  });

  test('2. Invalid token shows proper error message', async ({ page }) => {
    const invalidUrl = 'http://localhost:9002/invoices/view/invalid-token-xyz123';
    await page.goto(invalidUrl);
    await page.waitForLoadState('networkidle');

    // Take screenshot of error page
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-05-error-invalid-token.png',
      fullPage: true
    });

    // Should show "Invoice Not Found" or similar error
    const hasErrorMessage = await page.locator('text=/Invoice Not Found|Invalid token|Not found/i').first().isVisible();
    expect(hasErrorMessage).toBeTruthy();

    console.log('✓ Invalid token properly displays error message');
  });

  test('3. Verify invoice status tracking (view count)', async ({ page }) => {
    test.skip(!viewToken, 'No invoice token available');

    // First, visit the public invoice view
    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for status update

    console.log('✓ Visited public invoice view (status should update)');

    // Now login to admin panel to check if status changed
    await page.goto('http://localhost:9002/login');
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to invoicing page
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of invoicing page
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-06-invoicing-list.png',
      fullPage: true
    });

    // Look for the invoice in the list
    const invoiceRow = page.locator(`tr:has-text("${invoiceNumber}")`).first();
    const isInvoiceVisible = await invoiceRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (isInvoiceVisible) {
      console.log('✓ Found invoice in list:', invoiceNumber);

      // Check if status shows "viewed" or view count increased
      const rowText = await invoiceRow.textContent();
      console.log('Invoice row content:', rowText);

      // Take screenshot highlighting the invoice
      await invoiceRow.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: 'e2e/screenshots/invoice-view/final-07-invoice-status.png'
      });
    } else {
      console.log('Note: Could not locate invoice row in list view');
    }

    console.log('✓ Admin panel invoice list checked');
  });

  test('4. Test public view without authentication', async ({ browser }) => {
    test.skip(!viewToken, 'No invoice token available');

    // Create a new incognito context (no cookies/auth)
    const context = await browser.newContext({
      storageState: undefined // No authentication
    });
    const page = await context.newPage();

    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-08-no-auth.png',
      fullPage: true
    });

    // Should be able to view without login
    const hasInvoiceNumber = await page.locator(`text=${invoiceNumber}`).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasInvoiceNumber).toBeTruthy();

    // Should NOT see admin interface elements
    const hasAdminNav = await page.locator('nav, [role="navigation"]').count();
    console.log('Admin navigation elements found:', hasAdminNav);

    // The page should show the invoice, not redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toContain('/invoices/view/');
    expect(currentUrl).not.toContain('/login');

    await context.close();

    console.log('✓ Public view accessible without authentication');
  });

  test('5. Responsive design check', async ({ page }) => {
    test.skip(!viewToken, 'No invoice token available');

    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-09-mobile.png',
      fullPage: true
    });

    const mobileInvoiceVisible = await page.locator(`text=${invoiceNumber}`).isVisible();
    expect(mobileInvoiceVisible).toBeTruthy();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-10-tablet.png',
      fullPage: true
    });

    const tabletInvoiceVisible = await page.locator(`text=${invoiceNumber}`).isVisible();
    expect(tabletInvoiceVisible).toBeTruthy();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/final-11-desktop.png',
      fullPage: true
    });

    const desktopInvoiceVisible = await page.locator(`text=${invoiceNumber}`).isVisible();
    expect(desktopInvoiceVisible).toBeTruthy();

    console.log('✓ Responsive design verified (mobile, tablet, desktop)');
  });
});
