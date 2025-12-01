import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Order Creation Flow - Step by Step Debug', () => {
  test.setTimeout(180000); // 3 minutes timeout

  test('comprehensive order creation test', async ({ page }) => {
    // Console and error tracking
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error' || text.includes('org_id') || text.includes('Creating order')) {
        console.log(`IMPORTANT [${msg.type()}]:`, text);
      }
    });

    page.on('pageerror', error => {
      errorMessages.push(error.toString());
      console.error('PAGE ERROR:', error.toString());
    });

    try {
      // Navigate to order page
      console.log('\n=== STEP 1: Navigate to Order Page ===');
      await page.goto('http://localhost:9002/orders/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-01-initial.png'),
        fullPage: true
      });

      // Fill Step 1: Property Info
      console.log('\n=== STEP 2: Fill Property Info ===');
      await page.waitForSelector('input[name="propertyAddress"]', { state: 'visible', timeout: 10000 });

      await page.fill('input[name="propertyAddress"]', '123 Test Street');
      await page.fill('input[name="propertyCity"]', 'Miami');
      await page.fill('input[name="propertyState"]', 'FL');
      await page.fill('input[name="propertyZip"]', '33101');

      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-02-step1-fields.png'),
        fullPage: true
      });

      // Click Next
      console.log('\n=== STEP 3: Click Next to Step 2 ===');
      const nextButton = page.locator('button:has-text("Next")').first();
      await nextButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-03-step2.png'),
        fullPage: true
      });

      // Fill Step 2: Order Type
      console.log('\n=== STEP 4: Fill Order Type ===');
      const orderTypeButton = page.locator('button:has-text("Select an order type")').first();
      await orderTypeButton.waitFor({ state: 'visible', timeout: 5000 });
      await orderTypeButton.click();
      await page.waitForTimeout(500);

      await page.locator('[role="option"]:has-text("Purchase")').first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-04-step2-filled.png'),
        fullPage: true
      });

      // Click Next to Step 3
      console.log('\n=== STEP 5: Click Next to Step 3 ===');
      await page.locator('button:has-text("Next")').first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-05-step3.png'),
        fullPage: true
      });

      // Fill Step 3: Contact Info
      console.log('\n=== STEP 6: Fill Contact Info ===');

      // Try to select a client - look for the button/combobox
      const clientSelectors = [
        'button:has-text("Select a client")',
        'button:has-text("Select")',
        '[role="combobox"]',
        'input[name="clientId"]'
      ];

      let clientSelected = false;
      for (const selector of clientSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          console.log(`Found client selector: ${selector}`);
          await element.click();
          await page.waitForTimeout(1000);

          // Try to select first client
          const firstOption = page.locator('[role="option"]').first();
          if (await firstOption.isVisible().catch(() => false)) {
            await firstOption.click();
            clientSelected = true;
            console.log('Client selected successfully');
            break;
          }
        }
      }

      if (!clientSelected) {
        console.log('WARNING: Could not select a client - proceeding anyway');
      }

      await page.waitForTimeout(1000);

      // Fill borrower name
      await page.fill('input[name="borrowerName"]', 'John Test Borrower');

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-06-step3-filled.png'),
        fullPage: true
      });

      // Click Next to Step 4 - THE CRITICAL STEP
      console.log('\n=== STEP 7: Click Next to Step 4 (ORDER DETAILS - CRITICAL) ===');
      await page.locator('button:has-text("Next")').first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-07-step4-initial.png'),
        fullPage: true
      });

      // ANALYZE STEP 4 - Check for Production Template Dropdown
      console.log('\n=== STEP 8: ANALYZING STEP 4 FOR PRODUCTION TEMPLATE ===');

      // Check for production template elements
      const templateLabel = await page.locator('text=Production Template').isVisible().catch(() => false);
      const templateButton = await page.locator('button:has-text("Select a production template")').isVisible().catch(() => false);
      const templateSelect = await page.locator('select[name="productionTemplateId"]').isVisible().catch(() => false);

      console.log('PRODUCTION TEMPLATE ANALYSIS:');
      console.log('- Label "Production Template" visible:', templateLabel);
      console.log('- Button "Select a production template" visible:', templateButton);
      console.log('- Select element visible:', templateSelect);

      // Get all visible text on the page
      const pageText = await page.locator('body').textContent();
      const hasProductionText = pageText?.includes('Production Template') || pageText?.includes('production template');
      console.log('- Page contains "Production Template" text:', hasProductionText);

      // Fill Step 4 fields
      console.log('\n=== STEP 9: Filling Step 4 Fields ===');

      // Priority
      await page.locator('button:has-text("Select priority level")').first().click();
      await page.waitForTimeout(500);
      await page.locator('[role="option"]:has-text("Normal")').first().click();
      await page.waitForTimeout(500);

      // Fee amount
      await page.fill('input[name="feeAmount"]', '500');

      // Try to interact with production template if visible
      if (templateButton) {
        console.log('ATTEMPTING TO SELECT PRODUCTION TEMPLATE');
        await page.locator('button:has-text("Select a production template")').first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-08-template-dropdown-open.png'),
          fullPage: true
        });

        // Count options
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        console.log('Template options count:', optionCount);

        // Get option texts
        for (let i = 0; i < Math.min(optionCount, 5); i++) {
          const text = await options.nth(i).textContent();
          console.log(`  Option ${i}:`, text);
        }

        // Select first non-"none" option if available
        if (optionCount > 1) {
          await options.nth(1).click();
          console.log('Selected template option');
        } else if (optionCount > 0) {
          await options.first().click();
        }

        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-09-step4-filled.png'),
        fullPage: true
      });

      // Click Review Order
      console.log('\n=== STEP 10: Click Review Order ===');
      await page.locator('button:has-text("Review Order")').first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-10-review.png'),
        fullPage: true
      });

      // Check for currentUser log BEFORE submit
      const preSubmitLogs = consoleMessages.filter(msg => msg.includes('Creating order with currentUser'));
      console.log('\nPRE-SUBMIT: currentUser logs:', preSubmitLogs.length);

      // Submit order
      console.log('\n=== STEP 11: Submit Order ===');
      const submitButton = page.locator('button:has-text("Submit Order")');
      await submitButton.click();

      // Wait and capture submission results
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-11-after-submit.png'),
        fullPage: true
      });

      // Analyze results
      console.log('\n=== FINAL ANALYSIS ===');

      const postSubmitLogs = consoleMessages.filter(msg => msg.includes('Creating order with currentUser'));
      console.log('POST-SUBMIT: currentUser logs:', postSubmitLogs.length);
      if (postSubmitLogs.length > 0) {
        postSubmitLogs.forEach(log => console.log('  -', log));
      }

      const orgIdLogs = consoleMessages.filter(msg => msg.toLowerCase().includes('org_id'));
      console.log('org_id related logs:', orgIdLogs.length);
      if (orgIdLogs.length > 0) {
        orgIdLogs.forEach(log => console.log('  -', log));
      }

      const nullValueLogs = consoleMessages.filter(msg => msg.toLowerCase().includes('null value'));
      console.log('null value logs:', nullValueLogs.length);
      if (nullValueLogs.length > 0) {
        nullValueLogs.forEach(log => console.log('  -', log));
      }

      const errorLogs = consoleMessages.filter(msg => msg.includes('[error]'));
      console.log('Error console logs:', errorLogs.length);
      if (errorLogs.length > 0) {
        console.log('ERRORS:');
        errorLogs.forEach(log => console.log('  -', log));
      }

      // Check for error toasts
      const errorToast = page.locator('[role="alert"], .toast-error, [class*="destructive"]');
      if (await errorToast.isVisible().catch(() => false)) {
        const toastText = await errorToast.textContent();
        console.log('ERROR TOAST DETECTED:', toastText);

        await page.screenshot({
          path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-12-error-toast.png'),
          fullPage: true
        });
      }

      // Summary
      console.log('\n=== TEST SUMMARY ===');
      console.log('Production Template Dropdown Visible:', templateButton);
      console.log('Total Console Messages:', consoleMessages.length);
      console.log('Total Page Errors:', errorMessages.length);
      console.log('org_id mentions:', orgIdLogs.length);
      console.log('Test completed successfully');

    } catch (error) {
      console.error('\nTEST FAILED WITH ERROR:', error);
      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'order-v2-error.png'),
        fullPage: true
      });
      throw error;
    }
  });
});
