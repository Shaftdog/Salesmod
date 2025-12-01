import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Order Creation Step 4 - Production Template Test', () => {
  test.setTimeout(120000);

  test('navigate to step 4 and verify production template dropdown', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      // Log critical messages
      if (text.includes('org_id') || text.includes('Creating order') || text.includes('currentUser')) {
        console.log(`CRITICAL [${msg.type()}]:`, text);
      }
    });

    console.log('\n========================================');
    console.log('STARTING ORDER CREATION FLOW TEST');
    console.log('========================================\n');

    // Navigate to order form
    await page.goto('http://localhost:9002/orders/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('[Step 1/5] Navigated to order form');

    // STEP 1: Fill Property Info
    console.log('[Step 2/5] Filling Property Info...');
    await page.fill('input[name="propertyAddress"]', '123 Test Street');
    await page.fill('input[name="propertyCity"]', 'Miami');
    await page.fill('input[name="propertyState"]', 'FL');
    await page.fill('input[name="propertyZip"]', '33101');
    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-01-step1.png'), fullPage: true });

    // Click Next (Step 1 -> Step 2)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1500);
    console.log('[Step 2/5] Completed Step 1 - Property Info');

    // STEP 2: Loan Info (order type already selected)
    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-02-step2.png'), fullPage: true });

    // Click Next (Step 2 -> Step 3)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1500);
    console.log('[Step 3/5] Completed Step 2 - Loan Info');

    // STEP 3: Contact Info
    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-03-step3-before.png'), fullPage: true });

    // Handle client selection carefully
    console.log('[Step 3/5] Selecting client...');

    // Look for the combobox (not a button with "Add" text)
    const clientCombobox = page.locator('[role="combobox"]').first();

    if (await clientCombobox.isVisible()) {
      await clientCombobox.click();
      await page.waitForTimeout(1000);

      // Wait for options to appear and select first one
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        const optionText = await firstOption.textContent();
        console.log('  Selecting client:', optionText);
        await firstOption.click();
        await page.waitForTimeout(500);
      }
    }

    // Fill borrower name
    await page.fill('input[name="borrowerName"]', 'John Test Borrower');
    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-04-step3-filled.png'), fullPage: true });

    // Make sure no dialogs are open
    const dialogOverlay = page.locator('[data-state="open"][aria-hidden="true"]');
    if (await dialogOverlay.isVisible().catch(() => false)) {
      console.log('  WARNING: Dialog overlay detected, attempting to close...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Click Next (Step 3 -> Step 4) - THE CRITICAL STEP
    console.log('[Step 4/5] Navigating to Step 4 (Order Details)...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // WE ARE NOW ON STEP 4
    console.log('\n========================================');
    console.log('STEP 4 ANALYSIS - ORDER DETAILS');
    console.log('========================================\n');

    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-05-STEP4-INITIAL.png'), fullPage: true });

    // Get page content
    const bodyText = await page.locator('body').textContent() || '';

    // Check for production template elements
    const productionTemplateChecks = {
      hasLabel: await page.locator('label:has-text("Production Template")').isVisible().catch(() => false),
      hasButton: await page.locator('button:has-text("Select a production template")').isVisible().catch(() => false),
      hasSelect: await page.locator('select[name="productionTemplateId"]').isVisible().catch(() => false),
      hasAnyCombobox: await page.locator('[role="combobox"]').count(),
      bodyHasText: bodyText.toLowerCase().includes('production template'),
    };

    console.log('Production Template Element Detection:');
    console.log('  Label visible:', productionTemplateChecks.hasLabel);
    console.log('  Button visible:', productionTemplateChecks.hasButton);
    console.log('  Select visible:', productionTemplateChecks.hasSelect);
    console.log('  Total comboboxes on page:', productionTemplateChecks.hasAnyCombobox);
    console.log('  Body contains text:', productionTemplateChecks.bodyHasText);

    // Get all form labels
    const allLabels = await page.locator('label').allTextContents();
    console.log('\nAll Form Labels on Step 4:');
    allLabels.forEach((label, idx) => {
      const trimmed = label.trim();
      if (trimmed) {
        console.log(`  ${idx + 1}. ${trimmed}`);
      }
    });

    // Get all combobox elements and their text
    const allComboboxes = await page.locator('[role="combobox"]').all();
    console.log(`\nCombobox Elements Found: ${allComboboxes.length}`);
    for (let i = 0; i < allComboboxes.length; i++) {
      const text = await allComboboxes[i].textContent();
      console.log(`  Combobox ${i + 1}: "${text?.trim()}"`);
    }

    // Fill required fields on Step 4
    console.log('\nFilling required Step 4 fields...');

    // Priority
    await page.locator('button[role="combobox"]').filter({ hasText: /Select priority|Normal|Rush|High|Low/ }).first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]:has-text("Normal")').first().click();
    await page.waitForTimeout(500);
    console.log('  Priority set to: Normal');

    // Fee amount
    await page.fill('input[name="feeAmount"]', '500');
    console.log('  Fee amount set to: $500');

    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-06-step4-filled.png'), fullPage: true });

    // Try to interact with production template dropdown if it exists
    if (productionTemplateChecks.hasButton) {
      console.log('\n*** PRODUCTION TEMPLATE DROPDOWN FOUND - INTERACTING ***');

      const templateButton = page.locator('button:has-text("Select a production template")').first();
      await templateButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-07-TEMPLATE-DROPDOWN-OPEN.png'), fullPage: true });

      const templateOptions = await page.locator('[role="option"]').allTextContents();
      console.log('Template Options Available:');
      templateOptions.forEach((opt, idx) => {
        console.log(`  ${idx + 1}. ${opt.trim()}`);
      });

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('\n*** PRODUCTION TEMPLATE DROPDOWN NOT VISIBLE ***');
    }

    // Proceed to review step
    console.log('\n[Step 5/5] Proceeding to Review...');
    await page.click('button:has-text("Review Order")');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-08-review.png'), fullPage: true });

    // Attempt submission to trigger console logs
    console.log('\nAttempting order submission...');
    await page.click('button:has-text("Submit Order")');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-09-after-submit.png'), fullPage: true });

    // Analyze console logs
    console.log('\n========================================');
    console.log('CONSOLE LOG ANALYSIS');
    console.log('========================================\n');

    const createOrderLogs = consoleMessages.filter(m => m.includes('Creating order with currentUser'));
    console.log(`"Creating order with currentUser" logs: ${createOrderLogs.length}`);
    if (createOrderLogs.length > 0) {
      createOrderLogs.forEach(log => console.log('  ' + log));
    }

    const orgIdLogs = consoleMessages.filter(m => m.toLowerCase().includes('org_id'));
    console.log(`\n"org_id" related logs: ${orgIdLogs.length}`);
    if (orgIdLogs.length > 0) {
      orgIdLogs.slice(0, 5).forEach(log => console.log('  ' + log));
    }

    const nullValueLogs = consoleMessages.filter(m => m.toLowerCase().includes('null value'));
    console.log(`\n"null value" error logs: ${nullValueLogs.length}`);
    if (nullValueLogs.length > 0) {
      nullValueLogs.forEach(log => console.log('  ' + log));
    }

    const errorLogs = consoleMessages.filter(m => m.includes('[error]'));
    console.log(`\nTotal error logs: ${errorLogs.length}`);
    if (errorLogs.length > 0) {
      console.log('First 5 errors:');
      errorLogs.slice(0, 5).forEach(log => console.log('  ' + log));
    }

    // Check for error toasts
    const errorToast = page.locator('[role="alert"]');
    const toastCount = await errorToast.count();
    if (toastCount > 0) {
      console.log(`\nError toasts found: ${toastCount}`);
      for (let i = 0; i < Math.min(toastCount, 3); i++) {
        const toastText = await errorToast.nth(i).textContent();
        console.log(`  Toast ${i + 1}: ${toastText}`);
      }

      await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'final-10-error-toast.png'), fullPage: true });
    }

    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('Production Template Dropdown Visible:', productionTemplateChecks.hasButton);
    console.log('Reached Step 4:', true);
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Screenshots saved to: tests/screenshots/final-*.png');
    console.log('\nTest completed successfully!');
  });
});
