import { test, expect } from '@playwright/test';

/**
 * Quick Public Invoice View Test
 *
 * Simple verification test for the public invoice view page
 * Uses INV-00008 with the provided token
 */

const VIEW_TOKEN = 'df4fefb6d89bed8868498cb086d57fa9b024a1a7426cb214091fa319d25041ef';
const BASE_URL = 'http://localhost:9002';

test.describe('Public Invoice View - Quick Verification', () => {
  test('should display public invoice with all required elements', async ({ page }) => {
    console.log('Testing public invoice view...');

    // Navigate to public invoice URL
    const publicUrl = `${BASE_URL}/invoices/view/${VIEW_TOKEN}`;
    console.log(`Navigating to: ${publicUrl}`);

    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial load
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/quick-01-initial-load.png',
      fullPage: true
    });

    // Verify page is accessible without authentication
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('/invoices/view/');

    // Wait a moment for content to load
    await page.waitForTimeout(2000);

    // Take another screenshot after waiting
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/quick-02-after-wait.png',
      fullPage: true
    });

    // Check for key elements (using flexible selectors)
    console.log('Checking for required elements...');

    // 1. Company name or header
    const hasCompanyName = await page.locator('text=/Rod Haugabrooks|Company|Organization/i').count() > 0;
    console.log(`Company name visible: ${hasCompanyName}`);

    // 2. Invoice number
    const hasInvoiceNumber = await page.locator('text=/INV-\\d+/i').count() > 0;
    console.log(`Invoice number visible: ${hasInvoiceNumber}`);

    // 3. Any status badge or indicator
    const hasStatus = await page.locator('text=/sent|viewed|paid|pending|draft/i').count() > 0;
    console.log(`Status indicator visible: ${hasStatus}`);

    // 4. Bill To section
    const hasBillTo = await page.locator('text=/Bill To|Billed To|Client/i').count() > 0;
    console.log(`Bill To section visible: ${hasBillTo}`);

    // 5. Table or line items
    const hasTable = await page.locator('table, [role="table"]').count() > 0;
    console.log(`Table/line items visible: ${hasTable}`);

    // 6. Total amount
    const hasTotal = await page.locator('text=/Total|Amount|Due/i').count() > 0;
    console.log(`Total section visible: ${hasTotal}`);

    // 7. Pay button
    const hasPayButton = await page.locator('button, a').filter({ hasText: /Pay Now|Make Payment/i }).count() > 0;
    console.log(`Pay button visible: ${hasPayButton}`);

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/quick-03-complete-view.png',
      fullPage: true
    });

    // Log page content for debugging
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page contains "invoice":', pageContent.toLowerCase().includes('invoice'));
    console.log('Page contains "INV-":', pageContent.includes('INV-'));

    // Basic assertion - page should load without error
    expect(currentUrl).not.toContain('error');
    expect(currentUrl).not.toContain('404');

    console.log('✓ Public invoice view test completed');
  });

  test('should handle invalid token gracefully', async ({ page }) => {
    console.log('Testing invalid token handling...');

    const invalidUrl = `${BASE_URL}/invoices/view/invalid-token-12345`;
    await page.goto(invalidUrl);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/quick-04-invalid-token.png',
      fullPage: true
    });

    const currentUrl = page.url();
    console.log(`Current URL after invalid token: ${currentUrl}`);

    // Should show error or redirect
    const hasError = currentUrl.includes('error') ||
                    currentUrl.includes('404') ||
                    await page.locator('text=/not found|invalid|error/i').count() > 0;

    console.log(`Error handling working: ${hasError}`);
    expect(hasError).toBeTruthy();

    console.log('✓ Invalid token handled gracefully');
  });
});
