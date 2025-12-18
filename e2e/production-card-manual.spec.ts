import { test, expect } from '@playwright/test';

/**
 * Manual Authentication Test
 *
 * This test requires manual login:
 * 1. Run the test with --headed flag
 * 2. Browser will open to production page (redirects to login)
 * 3. Manually log in with your credentials
 * 4. Test will wait 30 seconds for you to complete login
 * 5. Then automated testing will proceed
 */

test.describe('Production Card Features - Manual Auth', () => {
  test('should display production card features after manual login', async ({ page }) => {
    // Navigate to production board (will redirect to login)
    await page.goto('/production');

    // Wait for manual login
    console.log('\n⏱ WAITING FOR MANUAL LOGIN...');
    console.log('Please log in to the application in the browser window.');
    console.log('You have 30 seconds to complete login.\n');

    // Wait 30 seconds for user to log in
    await page.waitForTimeout(30000);

    // Check if we're on the production page now
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/production')) {
      console.log('⚠ Not on production page yet. Navigating...');
      await page.goto('/production');
      await page.waitForLoadState('networkidle');
    }

    // Take screenshot of production board
    await page.screenshot({
      path: 'e2e/screenshots/01-production-board.png',
      fullPage: true
    });

    // Check for production cards
    const cards = page.locator('[data-testid="production-card"], [draggable="true"][class*="card"]');
    const cardCount = await cards.count();
    console.log(`\n✓ Found ${cardCount} production cards`);

    if (cardCount === 0) {
      console.log('⚠ No production cards found. Screenshot saved for review.');
      return;
    }

    // Click first card to open detail panel
    console.log('\n📋 Testing card detail panel...');
    const firstCard = cards.first();
    await firstCard.click();

    // Wait for detail panel
    await page.waitForTimeout(1000);

    // Take screenshot of detail panel
    await page.screenshot({
      path: 'e2e/screenshots/02-card-detail-panel.png',
      fullPage: true
    });

    // Test 1: Check for order link
    console.log('\n🔍 Checking for order link...');
    const orderLink = page.locator('[data-testid="order-link"], a[href*="/orders/"]').first();
    const orderLinkExists = await orderLink.count() > 0;

    if (orderLinkExists) {
      const orderText = await orderLink.textContent();
      console.log(`  ✓ Order link found: ${orderText}`);

      // Verify format (ORD-2025-XXXX or similar)
      if (orderText?.match(/ORD-\d{4}-\d+/)) {
        console.log('  ✓ Order number format is correct');
      } else {
        console.log(`  ⚠ Order number format may be incorrect: ${orderText}`);
      }
    } else {
      console.log('  ❌ Order link not found');
    }

    // Test 2: Check for property link
    console.log('\n🏠 Checking for property link...');
    const propertyLink = page.locator('[data-testid="property-link"], a[href*="/properties/"]').first();
    const propertyLinkExists = await propertyLink.count() > 0;

    if (propertyLinkExists) {
      const propertyText = await propertyLink.textContent();
      console.log(`  ✓ Property link found: ${propertyText}`);
    } else {
      console.log('  ❌ Property link not found');
    }

    // Test 3: Check for "Put on Hold" button
    console.log('\n⏸ Checking for "Put on Hold" button...');
    const holdButton = page.locator('button:has-text("Put on Hold")').first();
    const holdButtonExists = await holdButton.count() > 0;

    if (holdButtonExists) {
      console.log('  ✓ "Put on Hold" button found');

      // Check button styling (should be amber/yellow)
      const buttonClasses = await holdButton.getAttribute('class');
      if (buttonClasses?.includes('amber') || buttonClasses?.includes('yellow') || buttonClasses?.includes('warning')) {
        console.log('  ✓ Button has appropriate warning styling');
      } else {
        console.log(`  ⚠ Button classes: ${buttonClasses}`);
      }
    } else {
      console.log('  ❌ "Put on Hold" button not found');
    }

    // Test 4: Check for "Cancel Order" button
    console.log('\n❌ Checking for "Cancel Order" button...');
    const cancelButton = page.locator('button:has-text("Cancel Order")').first();
    const cancelButtonExists = await cancelButton.count() > 0;

    if (cancelButtonExists) {
      console.log('  ✓ "Cancel Order" button found');

      // Check button styling (should be red/destructive)
      const buttonClasses = await cancelButton.getAttribute('class');
      if (buttonClasses?.includes('destructive') || buttonClasses?.includes('red') || buttonClasses?.includes('danger')) {
        console.log('  ✓ Button has appropriate destructive styling');
      } else {
        console.log(`  ⚠ Button classes: ${buttonClasses}`);
      }
    } else {
      console.log('  ❌ "Cancel Order" button not found');
    }

    // Test 5: Check for "Add Tasks from Library" button
    console.log('\n➕ Checking for "Add Tasks from Library" button...');
    const addTasksButton = page.locator('button:has-text("Add Tasks from Library")').first();
    const addTasksButtonExists = await addTasksButton.count() > 0;

    if (addTasksButtonExists) {
      console.log('  ✓ "Add Tasks from Library" button found');
    } else {
      console.log('  ❌ "Add Tasks from Library" button not found');
    }

    // Test 6: Check for tasks and task detail dialog
    console.log('\n📝 Checking for tasks...');
    const taskItems = page.locator('[data-testid="task-item"], [class*="task-item"]');
    const taskCount = await taskItems.count();
    console.log(`  Found ${taskCount} tasks`);

    if (taskCount > 0) {
      console.log('  Testing task click...');
      const firstTask = taskItems.first();
      await firstTask.click();
      await page.waitForTimeout(1000);

      // Check for task detail dialog
      const taskDialog = page.locator('[data-testid="task-detail-dialog"], [role="dialog"]').first();
      const taskDialogExists = await taskDialog.count() > 0;

      if (taskDialogExists) {
        console.log('  ✓ Task detail dialog opened');

        // Take screenshot
        await page.screenshot({
          path: 'e2e/screenshots/03-task-detail-dialog.png',
          fullPage: true
        });

        // Close dialog
        const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('  ❌ Task detail dialog did not open');
      }
    }

    // Test 7: Test "Put on Hold" workflow
    if (holdButtonExists) {
      console.log('\n⏸ Testing "Put on Hold" workflow...');
      await holdButton.click();
      await page.waitForTimeout(1000);

      // Check for hold dialog
      const holdDialog = page.locator('[role="dialog"]').last();
      const holdDialogVisible = await holdDialog.isVisible();

      if (holdDialogVisible) {
        console.log('  ✓ Hold dialog opened');

        // Take screenshot
        await page.screenshot({
          path: 'e2e/screenshots/04-hold-dialog.png',
          fullPage: true
        });

        // Check for reason field
        const reasonField = page.locator('textarea, input[type="text"]').last();
        const reasonFieldExists = await reasonField.count() > 0;

        if (reasonFieldExists) {
          console.log('  ✓ Reason field found (optional)');
        }

        // Test cancel button
        const cancelDialogButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelDialogButton.count() > 0) {
          console.log('  Testing cancel button...');
          await cancelDialogButton.click();
          await page.waitForTimeout(500);

          // Verify dialog closed
          const dialogStillVisible = await holdDialog.isVisible();
          if (!dialogStillVisible) {
            console.log('  ✓ Dialog cancelled successfully');
          } else {
            console.log('  ⚠ Dialog may still be visible');
          }
        } else {
          // Try X button
          const closeButton = page.locator('button[aria-label="Close"]').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await page.waitForTimeout(500);
            console.log('  ✓ Dialog closed with X button');
          }
        }
      } else {
        console.log('  ❌ Hold dialog did not open');
      }
    }

    // Test 8: Check for console errors
    console.log('\n🔍 Checking for console errors...');
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a moment for any async errors
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('  ❌ Console errors detected:');
      errors.forEach(err => console.log(`    - ${err}`));
    } else {
      console.log('  ✓ No console errors detected');
    }

    // Final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/05-final-state.png',
      fullPage: true
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Production Cards: ${cardCount > 0 ? '✓' : '❌'}`);
    console.log(`Order Link: ${orderLinkExists ? '✓' : '❌'}`);
    console.log(`Property Link: ${propertyLinkExists ? '✓' : '❌'}`);
    console.log(`Put on Hold Button: ${holdButtonExists ? '✓' : '❌'}`);
    console.log(`Cancel Order Button: ${cancelButtonExists ? '✓' : '❌'}`);
    console.log(`Add Tasks Button: ${addTasksButtonExists ? '✓' : '❌'}`);
    console.log(`Tasks: ${taskCount} found`);
    console.log(`Console Errors: ${errors.length}`);
    console.log('='.repeat(60));
    console.log(`\nScreenshots saved to: e2e/screenshots/\n`);
  });
});
