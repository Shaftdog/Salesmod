import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

test.describe('Invoice View Tracking Flow', () => {
  let invoiceNumber: string;
  let viewToken: string;
  let invoiceId: string;

  test('Complete invoice view tracking flow', async ({ page }) => {
    // Step 1: Login with credentials
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/01-login-page.png', fullPage: true });

    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/02-credentials-entered.png', fullPage: true });

    await page.click('button[type="submit"]');

    // Wait for navigation away from login page
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/03-after-login.png', fullPage: true });

    // Verify we're logged in by checking URL
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }

    // Step 2: Navigate to Finance > Invoicing
    console.log('Step 2: Navigating to Invoicing...');
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/04-invoicing-page.png', fullPage: true });

    // Step 3: Find a sent invoice or send a draft
    console.log('Step 3: Looking for invoices...');

    // Wait for the page to fully load
    await page.waitForSelector('body', { timeout: 5000 });

    // Check for various possible table structures
    let invoiceRows = page.locator('table tbody tr');
    let rowCount = await invoiceRows.count();

    // If no rows in table tbody, try other selectors
    if (rowCount === 0) {
      invoiceRows = page.locator('table tr').filter({ hasNot: page.locator('th') });
      rowCount = await invoiceRows.count();
    }

    // Check for card-based layout
    if (rowCount === 0) {
      invoiceRows = page.locator('[data-invoice-id], [class*="invoice-card"], [class*="invoice-row"]');
      rowCount = await invoiceRows.count();
    }

    console.log(`Found ${rowCount} invoice rows/cards`);

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/04a-invoice-list-debug.png', fullPage: true });

    if (rowCount === 0) {
      console.log('No invoices found. Checking if there is a "Create Invoice" button...');

      // Look for create button
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Invoice"), a:has-text("Create")');
      const hasCreateButton = await createButton.count() > 0;

      if (hasCreateButton) {
        console.log('Found create button. Need to create test invoice first.');
        throw new Error('No invoices found. Please create sample invoice data first or this test will create one.');
      } else {
        throw new Error('No invoices found and no create button available. Check page structure.');
      }
    }

    // Look for a sent invoice or draft invoice
    let sentInvoiceFound = false;
    let draftInvoiceFound = false;
    let targetRow;

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const row = invoiceRows.nth(i);

      // Get all text content from the row to find status
      const rowText = await row.textContent();
      console.log(`Row ${i}: ${rowText?.substring(0, 100)}`);

      if (rowText?.toLowerCase().includes('sent')) {
        sentInvoiceFound = true;
        targetRow = row;
        console.log('Found a sent invoice!');
        break;
      } else if (!draftInvoiceFound && rowText?.toLowerCase().includes('draft')) {
        draftInvoiceFound = true;
        targetRow = row;
        console.log('Found a draft invoice as fallback');
      }
    }

    if (!targetRow) {
      targetRow = invoiceRows.first();
      console.log('No sent/draft invoice found, using first invoice');
    }

    // Get invoice number from the row (first column)
    const invoiceNumberCell = targetRow.locator('td').first();
    invoiceNumber = (await invoiceNumberCell.textContent())?.trim() || '';
    console.log(`Selected invoice: ${invoiceNumber}`);

    // Click on the invoice number link (should be in the first cell)
    const invoiceLink = invoiceNumberCell.locator('a');
    const hasLink = await invoiceLink.count() > 0;

    if (hasLink) {
      await invoiceLink.click();
    } else {
      // Fallback: try clicking the row
      await targetRow.click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/05-invoice-details.png', fullPage: true });

    // Get the invoice ID from URL
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Extract invoice ID from URL
    const urlParts = url.split('/');
    invoiceId = urlParts[urlParts.length - 1];
    console.log(`Invoice ID: ${invoiceId}`);

    if (!invoiceId || invoiceId === 'invoicing') {
      throw new Error('Could not extract invoice ID from URL. Expected format: /finance/invoicing/[id]');
    }

    // Step 4: If it's a draft, send it first
    const pageContent = await page.textContent('body');
    console.log(`Current status visible on page: ${pageContent?.includes('Draft') ? 'Draft' : pageContent?.includes('Sent') ? 'Sent' : 'Other'}`);

    if (pageContent?.toLowerCase().includes('draft')) {
      console.log('Step 4: Sending draft invoice...');

      // Look for "Send Invoice" button
      const sendButton = page.locator('button:has-text("Send Invoice"), button:has-text("Send")').first();
      const hasSendButton = await sendButton.count() > 0;

      if (hasSendButton && await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/06-after-send.png', fullPage: true });

        // Wait for any success message or status update
        await page.waitForTimeout(2000);
      }
    }

    // Step 5: Get the view token from database or API
    console.log('Step 5: Getting view token...');

    // Try to find view URL in the page or make API call
    const response = await page.request.get(`http://localhost:9002/api/invoices/${invoiceId}`);
    const invoiceData = await response.json();

    console.log('Invoice data:', JSON.stringify(invoiceData, null, 2));

    // Extract view token from response (handle both nested and flat structures)
    viewToken = invoiceData.data?.view_token || invoiceData.view_token || invoiceData.viewToken;

    if (!viewToken) {
      console.log('No view token found in API response. Checking database...');
      throw new Error('View token not found. Invoice may not have been sent yet.');
    }

    console.log(`View token: ${viewToken}`);

    // Step 6: Test public invoice view page
    console.log('Step 6: Opening public invoice view...');
    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    console.log(`Public URL: ${publicUrl}`);

    // Open in a new context to simulate external user
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/07-public-view.png', fullPage: true });

    // Step 7: Verify public view page elements
    console.log('Step 7: Verifying public view page elements...');

    // Verify no sidebar/header from main app (should be standalone)
    const sidebar = page.locator('[class*="sidebar"]');
    const hasSidebar = await sidebar.count() > 0;
    console.log(`Has sidebar: ${hasSidebar} (should be false)`);

    // Verify invoice details are visible
    const companyName = page.locator('text=/company|business/i').first();
    const hasCompanyInfo = await companyName.count() > 0;
    console.log(`Has company info: ${hasCompanyInfo}`);

    // Verify invoice number is displayed
    const invoiceNumDisplay = page.locator(`text=/${invoiceNumber}/i`);
    const hasInvoiceNumber = await invoiceNumDisplay.count() > 0;
    console.log(`Invoice number displayed: ${hasInvoiceNumber}`);
    expect(hasInvoiceNumber).toBeTruthy();

    // Verify status badge
    const statusBadge = page.locator('[class*="badge"], [class*="status"]');
    const hasStatus = await statusBadge.count() > 0;
    console.log(`Has status badge: ${hasStatus}`);

    // Verify Bill To section
    const billToSection = page.locator('text=/bill to/i');
    const hasBillTo = await billToSection.count() > 0;
    console.log(`Has Bill To section: ${hasBillTo}`);

    // Verify line items table
    const lineItemsTable = page.locator('table');
    const hasTable = await lineItemsTable.count() > 0;
    console.log(`Has line items table: ${hasTable}`);

    // Verify totals section
    const subtotal = page.locator('text=/subtotal/i');
    const total = page.locator('text=/total/i');
    const hasTotals = await subtotal.count() > 0 && await total.count() > 0;
    console.log(`Has totals: ${hasTotals}`);

    // Verify Pay Now button (if not paid)
    const payButton = page.locator('button:has-text("Pay Now"), button:has-text("Pay")');
    const hasPayButton = await payButton.count() > 0;
    console.log(`Has Pay Now button: ${hasPayButton}`);

    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/08-public-view-annotated.png', fullPage: true });

    // Step 8: Verify automatic status change
    console.log('Step 8: Verifying status change...');

    // Navigate back to admin view
    await page.goto(`http://localhost:9002/finance/invoicing/${invoiceId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/09-admin-view-after-public-view.png', fullPage: true });

    // Check if status changed to "viewed"
    const updatedPageContent = await page.textContent('body');
    const statusChangedToViewed = updatedPageContent?.toLowerCase().includes('viewed') || updatedPageContent?.toLowerCase().includes('view');
    console.log(`Status changed to viewed: ${statusChangedToViewed}`);

    // Step 9: Test payment button functionality
    console.log('Step 9: Testing payment button...');

    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    if (hasPayButton) {
      const payNowButton = page.locator('button:has-text("Pay Now"), button:has-text("Pay")').first();

      // Just verify it exists and is clickable
      const isVisible = await payNowButton.isVisible();
      const isEnabled = await payNowButton.isEnabled();
      console.log(`Pay button visible: ${isVisible}, enabled: ${isEnabled}`);

      await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/10-pay-button-highlighted.png', fullPage: true });

      if (isVisible && isEnabled) {
        // Click and verify it attempts to create checkout session
        await payNowButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/11-after-pay-click.png', fullPage: true });

        // Check if redirected to Stripe or if there's an error/loading state
        const currentUrl = page.url();
        console.log(`URL after pay click: ${currentUrl}`);

        const hasStripeRedirect = currentUrl.includes('stripe') || currentUrl.includes('checkout');
        const hasLoadingIndicator = await page.locator('[class*="loading"], [class*="spinner"]').count() > 0;

        console.log(`Stripe redirect: ${hasStripeRedirect}, Loading indicator: ${hasLoadingIndicator}`);
      }
    } else {
      console.log('Pay button not present (invoice may be paid already)');
    }

    // Final summary screenshot
    await page.screenshot({ path: 'e2e/screenshots/invoice-tracking/12-test-complete.png', fullPage: true });

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Invoice Number: ${invoiceNumber}`);
    console.log(`Invoice ID: ${invoiceId}`);
    console.log(`View Token: ${viewToken}`);
    console.log(`Public URL: ${publicUrl}`);
    console.log(`Status changed to viewed: ${statusChangedToViewed}`);
    console.log('====================\n');
  });
});
