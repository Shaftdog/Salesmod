import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Order Creation Flow Debug', () => {
  test.setTimeout(120000); // 2 minutes timeout

  test('should test order creation with production template dropdown', async ({ page }) => {
    // Setup console log capturing
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`Browser Console [${msg.type()}]:`, text);
    });

    page.on('pageerror', error => {
      const errorText = error.toString();
      errorMessages.push(errorText);
      console.error('Browser Error:', errorText);
    });

    // Navigate to the order creation page
    console.log('Step 1: Navigating to http://localhost:9002/orders/new');
    await page.goto('http://localhost:9002/orders/new', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-01-initial.png'),
      fullPage: true
    });

    // Check if we're on a login page
    const isLoginPage = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);

    if (isLoginPage) {
      console.log('Login page detected - attempting to login');
      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-02-login-page.png'),
        fullPage: true
      });

      // Try to find and fill login credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      if (await emailInput.isVisible()) {
        console.log('Filling login form...');
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');

        const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
        await loginButton.click();

        await page.waitForURL(/.*\/orders\/new.*|.*\/dashboard.*|.*\/orders.*/, { timeout: 10000 }).catch(() => {
          console.log('Did not redirect after login attempt');
        });

        await page.screenshot({
          path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-03-after-login.png'),
          fullPage: true
        });
      }
    }

    // Verify we're on the order form
    console.log('Step 2: Verifying order form loaded');
    await page.waitForSelector('input[name="propertyAddress"], input[placeholder*="123 Main"]', { timeout: 10000 });

    // Fill Step 1: Property Info
    console.log('Step 3: Filling Property Info (Step 1)');
    await page.fill('input[name="propertyAddress"]', '123 Test Street');
    await page.fill('input[name="propertyCity"]', 'Miami');
    await page.fill('input[name="propertyState"]', 'FL');
    await page.fill('input[name="propertyZip"]', '33101');

    // Select property type
    await page.click('button:has-text("Select a property type")');
    await page.click('text=Single Family');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-04-step1-filled.png'),
      fullPage: true
    });

    // Click Next
    console.log('Step 4: Clicking Next to Step 2');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-05-step2.png'),
      fullPage: true
    });

    // Fill Step 2: Loan Info (Order Type)
    console.log('Step 5: Filling Loan Info (Step 2)');
    await page.click('button:has-text("Select an order type")');
    await page.click('text=Purchase').first();

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-06-step2-filled.png'),
      fullPage: true
    });

    // Click Next
    console.log('Step 6: Clicking Next to Step 3');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-07-step3.png'),
      fullPage: true
    });

    // Fill Step 3: Contact Info
    console.log('Step 7: Filling Contact Info (Step 3)');

    // Try to select a client
    const clientSelector = page.locator('button:has-text("Select a client"), button:has-text("Select")').first();
    if (await clientSelector.isVisible()) {
      await clientSelector.click();
      await page.waitForTimeout(500);

      // Select first client option
      const firstClient = page.locator('[role="option"]').first();
      if (await firstClient.isVisible()) {
        await firstClient.click();
      }
    }

    // Fill borrower name
    await page.fill('input[name="borrowerName"]', 'John Test Borrower');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-08-step3-filled.png'),
      fullPage: true
    });

    // Click Next
    console.log('Step 8: Clicking Next to Step 4');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // THIS IS STEP 4 - WHERE THE BUG IS
    console.log('Step 9: On Step 4 - Order Details (CHECKING FOR PRODUCTION TEMPLATE DROPDOWN)');
    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-09-step4-initial.png'),
      fullPage: true
    });

    // Check for production template dropdown
    const productionTemplateLabel = page.locator('text=Production Template');
    const productionTemplateDropdown = page.locator('button:has-text("Select a production template"), select[name="productionTemplateId"]');

    const hasTemplateLabel = await productionTemplateLabel.isVisible();
    const hasTemplateDropdown = await productionTemplateDropdown.isVisible();

    console.log('PRODUCTION TEMPLATE FINDINGS:');
    console.log('- Label visible:', hasTemplateLabel);
    console.log('- Dropdown visible:', hasTemplateDropdown);

    if (hasTemplateLabel) {
      console.log('- Label text:', await productionTemplateLabel.textContent());
    }

    // Fill required fields on Step 4
    console.log('Step 10: Filling Order Details (Step 4)');

    // Select priority
    await page.click('button:has-text("Select priority level")');
    await page.click('text=Normal').first();

    // Due date should already be set, but click it to verify it works
    const dueDateButton = page.locator('button:has-text("Pick a date")').first();
    if (await dueDateButton.isVisible()) {
      await dueDateButton.click();
      await page.waitForTimeout(500);
      // Click today's date or any future date
      await page.keyboard.press('Escape');
    }

    // Fill fee amount
    await page.fill('input[name="feeAmount"]', '500');

    // Try to select production template if visible
    if (hasTemplateDropdown) {
      console.log('Step 11: Attempting to select production template');
      await productionTemplateDropdown.first().click();
      await page.waitForTimeout(500);

      // Look for template options
      const templateOptions = page.locator('[role="option"]');
      const optionCount = await templateOptions.count();
      console.log('- Template options found:', optionCount);

      if (optionCount > 0) {
        // Select the first non-"none" option if available
        if (optionCount > 1) {
          await templateOptions.nth(1).click();
          console.log('- Selected template option');
        } else {
          await templateOptions.first().click();
          console.log('- Selected first (possibly "none") option');
        }
      }
    }

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-10-step4-filled.png'),
      fullPage: true
    });

    // Click Review Order
    console.log('Step 12: Clicking Review Order');
    await page.click('button:has-text("Review Order")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-11-review-step.png'),
      fullPage: true
    });

    // Look for the "Creating order with currentUser:" console log
    const createOrderLogs = consoleMessages.filter(msg => msg.includes('Creating order with currentUser'));
    console.log('Found currentUser logs before submit:', createOrderLogs);

    // Try to submit
    console.log('Step 13: Attempting to submit order');
    const submitButton = page.locator('button:has-text("Submit Order")');

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Wait for either success or error
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-12-after-submit.png'),
        fullPage: true
      });
    }

    // Check console logs after submit
    const createOrderLogsAfter = consoleMessages.filter(msg => msg.includes('Creating order with currentUser'));
    console.log('Found currentUser logs after submit:', createOrderLogsAfter);

    // Look for org_id error
    const orgIdErrors = consoleMessages.filter(msg => msg.toLowerCase().includes('org_id'));
    console.log('Found org_id related messages:', orgIdErrors);

    const nullValueErrors = consoleMessages.filter(msg => msg.toLowerCase().includes('null value'));
    console.log('Found null value errors:', nullValueErrors);

    // Check for any toast errors
    const toastError = page.locator('[role="alert"], .toast, [class*="toast"]');
    if (await toastError.isVisible()) {
      const errorText = await toastError.textContent();
      console.log('Toast error message:', errorText);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-debug-13-error-toast.png'),
        fullPage: true
      });
    }

    // Final report
    console.log('\n=== FINAL REPORT ===');
    console.log('Production Template Dropdown Visible:', hasTemplateDropdown);
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Total Errors:', errorMessages.length);
    console.log('org_id related messages:', orgIdErrors.length);

    console.log('\nAll Console Messages:');
    consoleMessages.forEach(msg => console.log(msg));

    if (errorMessages.length > 0) {
      console.log('\nAll Error Messages:');
      errorMessages.forEach(err => console.log(err));
    }

    // Don't fail the test, just report findings
    expect(true).toBe(true);
  });
});
