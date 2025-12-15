import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Order Creation - Direct to Step 4 Analysis', () => {
  test.setTimeout(120000);

  test('navigate to step 4 and analyze production template dropdown', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      // Log important messages
      if (text.includes('org_id') || text.includes('Creating order') || text.includes('currentUser') || text.includes('production')) {
        console.log(`IMPORTANT [${msg.type()}]:`, text);
      }
    });

    console.log('\n=== Starting Order Form Test ===\n');

    // Navigate
    await page.goto('http://localhost:9002/orders/new', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Step 1: On order form page');

    // Take initial screenshot
    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-01-initial.png'),
      fullPage: true
    });

    // Check if user is logged in by looking for user indicator
    const userButton = await page.locator('button:has-text("AT")').isVisible().catch(() => false);
    console.log('User logged in:', userButton);

    // Fill Step 1 minimally
    await page.fill('input[name="propertyAddress"]', '123 Test St');
    await page.fill('input[name="propertyCity"]', 'Miami');
    await page.fill('input[name="propertyState"]', 'FL');
    await page.fill('input[name="propertyZip"]', '33101');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-02-step1-filled.png'),
      fullPage: true
    });

    // Try to click Next
    console.log('Step 2: Clicking Next from Step 1');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-03-after-step1-next.png'),
      fullPage: true
    });

    // We should now be on Step 2 - try clicking Next again (order type should be pre-selected)
    console.log('Step 3: Clicking Next from Step 2');
    const nextButton2 = page.locator('button:has-text("Next")').first();
    if (await nextButton2.isVisible().catch(() => false)) {
      await nextButton2.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-04-after-step2-next.png'),
      fullPage: true
    });

    // Now on Step 3 - need to select client and fill borrower
    console.log('Step 4: On Step 3, trying to fill contact info');

    // Try to find and handle client selector
    const clientButton = page.locator('button').filter({ hasText: /Select a client|Select/ }).first();
    if (await clientButton.isVisible().catch(() => false)) {
      await clientButton.click();
      await page.waitForTimeout(1000);

      // Select first option
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
        await page.waitForTimeout(500);
        console.log('  - Client selected');
      }
    }

    // Fill borrower name
    await page.fill('input[name="borrowerName"]', 'Test Borrower');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-05-step3-filled.png'),
      fullPage: true
    });

    // Click Next to Step 4
    console.log('Step 5: Clicking Next to Step 4 (THE CRITICAL STEP)');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // NOW WE'RE ON STEP 4 - THE KEY ANALYSIS
    console.log('\n=== STEP 4 ANALYSIS ===\n');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-06-STEP4-INITIAL.png'),
      fullPage: true
    });

    // Get all visible text
    const bodyText = await page.locator('body').textContent() || '';

    // Check for production template elements
    console.log('Looking for Production Template elements...');

    const checks = {
      'Label "Production Template"': await page.locator('text=Production Template').isVisible().catch(() => false),
      'FormLabel with production': await page.locator('label').filter({ hasText: /production/i }).isVisible().catch(() => false),
      'Select button for template': await page.locator('button').filter({ hasText: /Select a production template/i }).isVisible().catch(() => false),
      'Select element [name="productionTemplateId"]': await page.locator('select[name="productionTemplateId"]').isVisible().catch(() => false),
      'Any combobox with production': await page.locator('[role="combobox"]').filter({ hasText: /production/i }).isVisible().catch(() => false),
      'Body contains "Production Template"': bodyText.toLowerCase().includes('production template'),
      'Body contains "production"': bodyText.toLowerCase().includes('production'),
    };

    console.log('\nProduction Template Checks:');
    for (const [key, value] of Object.entries(checks)) {
      console.log(`  ${key}: ${value}`);
    }

    // Look for all form labels on this step
    const allLabels = await page.locator('label').allTextContents();
    console.log('\nAll form labels on Step 4:');
    allLabels.forEach((label, idx) => {
      if (label.trim()) {
        console.log(`  ${idx + 1}. "${label.trim()}"`);
      }
    });

    // Look for all select/combobox elements
    const allSelects = await page.locator('button[role="combobox"], select').allTextContents();
    console.log('\nAll select/combobox elements on Step 4:');
    allSelects.forEach((text, idx) => {
      if (text.trim()) {
        console.log(`  ${idx + 1}. "${text.trim()}"`);
      }
    });

    // Try to find production template by searching in form fields
    const formFields = await page.locator('[class*="FormField"], [class*="form-item"]').all();
    console.log(`\nTotal form fields found: ${formFields.length}`);

    for (let i = 0; i < formFields.length; i++) {
      const text = await formFields[i].textContent() || '';
      if (text.toLowerCase().includes('production') || text.toLowerCase().includes('template')) {
        console.log(`  Field ${i + 1} contains production/template:`, text.substring(0, 100));
      }
    }

    // Now fill the required fields
    console.log('\nStep 6: Filling Step 4 required fields');

    // Priority
    await page.locator('button').filter({ hasText: /Select priority level/ }).first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'Normal' }).first().click();
    await page.waitForTimeout(500);

    // Fee
    await page.fill('input[name="feeAmount"]', '500');

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-07-step4-filled.png'),
      fullPage: true
    });

    // Try to interact with production template if it exists
    const prodTemplateButton = page.locator('button').filter({ hasText: /Select a production template/i }).first();
    if (await prodTemplateButton.isVisible().catch(() => false)) {
      console.log('\n*** PRODUCTION TEMPLATE DROPDOWN FOUND! ***');
      await prodTemplateButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-08-TEMPLATE-DROPDOWN-OPEN.png'),
        fullPage: true
      });

      const options = await page.locator('[role="option"]').allTextContents();
      console.log('Template options:');
      options.forEach((opt, idx) => console.log(`  ${idx + 1}. ${opt}`));

      // Click escape to close
      await page.keyboard.press('Escape');
    } else {
      console.log('\n*** PRODUCTION TEMPLATE DROPDOWN NOT FOUND ***');
    }

    // Click Review Order
    console.log('\nStep 7: Clicking Review Order');
    await page.click('button:has-text("Review Order")');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-09-review.png'),
      fullPage: true
    });

    // Check console for currentUser log
    console.log('\nStep 8: Attempting to submit order');
    await page.click('button:has-text("Submit Order")');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(process.cwd(), 'tests', 'screenshots', 'step4-10-after-submit.png'),
      fullPage: true
    });

    // Analyze console logs
    console.log('\n=== CONSOLE LOG ANALYSIS ===');

    const createOrderLogs = consoleMessages.filter(m => m.includes('Creating order with currentUser'));
    console.log(`\nFound ${createOrderLogs.length} "Creating order with currentUser" logs:`);
    createOrderLogs.forEach(log => console.log('  ' + log));

    const orgIdLogs = consoleMessages.filter(m => m.toLowerCase().includes('org_id'));
    console.log(`\nFound ${orgIdLogs.length} "org_id" related logs:`);
    orgIdLogs.forEach(log => console.log('  ' + log));

    const errorLogs = consoleMessages.filter(m => m.includes('[error]'));
    console.log(`\nFound ${errorLogs.length} error logs:`);
    errorLogs.slice(0, 10).forEach(log => console.log('  ' + log));

    // Look for error toast
    const errorToast = page.locator('[role="alert"]').filter({ hasText: /error/i });
    if (await errorToast.isVisible().catch(() => false)) {
      const toastText = await errorToast.textContent();
      console.log('\n*** ERROR TOAST DETECTED ***');
      console.log('Toast message:', toastText);
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Check screenshots in tests/screenshots/step4-*.png');
  });
});
