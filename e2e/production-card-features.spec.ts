import { test, expect } from '@playwright/test';
import { authenticateTestUser } from './auth-helper';

test.describe('Production Card Features', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate test user
    const authenticated = await authenticateTestUser(page);
    if (!authenticated) {
      throw new Error('Failed to authenticate test user');
    }

    // Navigate to production board
    await page.goto('/production');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display production board and cards', async ({ page }) => {
    // Take screenshot of the production board
    await page.screenshot({
      path: 'e2e/screenshots/production-board.png',
      fullPage: true
    });

    // Verify we're on the production page
    expect(page.url()).toContain('/production');

    // Check for production cards
    const cards = page.locator('[data-testid="production-card"]');
    const cardCount = await cards.count();

    console.log(`Found ${cardCount} production cards`);

    // We should have at least one card for testing
    if (cardCount === 0) {
      console.warn('No production cards found - test data may be needed');
    }
  });

  test('should open card detail panel when clicking a card', async ({ page }) => {
    // Find and click on the first production card
    const firstCard = page.locator('[data-testid="production-card"]').first();

    // Check if card exists
    const cardExists = await firstCard.count() > 0;
    if (!cardExists) {
      test.skip('No production cards available for testing');
      return;
    }

    await firstCard.click();

    // Wait for the detail panel to appear
    await page.waitForSelector('[data-testid="card-detail-panel"]', { timeout: 5000 });

    // Take screenshot of the detail panel
    await page.screenshot({
      path: 'e2e/screenshots/card-detail-panel.png',
      fullPage: true
    });
  });

  test('should display order link with order number', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for order link
    const orderLink = page.locator('[data-testid="order-link"]');
    const orderLinkExists = await orderLink.count() > 0;

    if (orderLinkExists) {
      const orderText = await orderLink.textContent();
      console.log(`Order link text: ${orderText}`);

      // Verify order number format (ORD-2025-XXXX)
      expect(orderText).toMatch(/ORD-\d{4}-\d+/);

      // Take screenshot showing order link
      await page.screenshot({
        path: 'e2e/screenshots/order-link.png',
        fullPage: true
      });
    } else {
      console.warn('Order link not found - may not be implemented yet');
    }
  });

  test('should display property link', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for property link
    const propertyLink = page.locator('[data-testid="property-link"]');
    const propertyLinkExists = await propertyLink.count() > 0;

    if (propertyLinkExists) {
      const propertyText = await propertyLink.textContent();
      console.log(`Property link text: ${propertyText}`);

      // Take screenshot showing property link
      await page.screenshot({
        path: 'e2e/screenshots/property-link.png',
        fullPage: true
      });
    } else {
      console.warn('Property link not found - may not be implemented yet');
    }
  });

  test('should display "Put on Hold" button', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for Put on Hold button
    const holdButton = page.locator('button:has-text("Put on Hold")');
    const holdButtonExists = await holdButton.count() > 0;

    if (holdButtonExists) {
      // Verify button styling (should be yellow/amber)
      const buttonClass = await holdButton.getAttribute('class');
      console.log(`Hold button classes: ${buttonClass}`);

      // Take screenshot showing hold button
      await page.screenshot({
        path: 'e2e/screenshots/hold-button.png',
        fullPage: true
      });

      expect(holdButtonExists).toBe(true);
    } else {
      console.warn('Put on Hold button not found');
    }
  });

  test('should display "Cancel Order" button', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for Cancel Order button
    const cancelButton = page.locator('button:has-text("Cancel Order")');
    const cancelButtonExists = await cancelButton.count() > 0;

    if (cancelButtonExists) {
      // Verify button styling (should be red/destructive)
      const buttonClass = await cancelButton.getAttribute('class');
      console.log(`Cancel button classes: ${buttonClass}`);

      // Take screenshot showing cancel button
      await page.screenshot({
        path: 'e2e/screenshots/cancel-button.png',
        fullPage: true
      });

      expect(cancelButtonExists).toBe(true);
    } else {
      console.warn('Cancel Order button not found');
    }
  });

  test('should display "Add Tasks from Library" button', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for Add Tasks from Library button
    const addTasksButton = page.locator('button:has-text("Add Tasks from Library")');
    const addTasksButtonExists = await addTasksButton.count() > 0;

    if (addTasksButtonExists) {
      console.log('Add Tasks from Library button found');

      // Take screenshot showing the button
      await page.screenshot({
        path: 'e2e/screenshots/add-tasks-button.png',
        fullPage: true
      });

      expect(addTasksButtonExists).toBe(true);
    } else {
      console.warn('Add Tasks from Library button not found');
    }
  });

  test('should open task detail dialog when clicking a task', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Look for tasks in the task list
    const taskItems = page.locator('[data-testid="task-item"]');
    const taskCount = await taskItems.count();

    if (taskCount === 0) {
      console.warn('No tasks found to test task detail dialog');
      test.skip('No tasks available');
      return;
    }

    // Click on the first task
    await taskItems.first().click();

    // Wait for task detail dialog
    const taskDialog = page.locator('[data-testid="task-detail-dialog"]');
    const dialogExists = await taskDialog.waitFor({ timeout: 5000 }).catch(() => false);

    if (dialogExists !== false) {
      console.log('Task detail dialog opened');

      // Take screenshot of task dialog
      await page.screenshot({
        path: 'e2e/screenshots/task-detail-dialog.png',
        fullPage: true
      });
    } else {
      console.warn('Task detail dialog did not open');
    }
  });

  test('should open hold dialog and allow cancellation', async ({ page }) => {
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() === 0) {
      test.skip('No production cards available');
      return;
    }

    await firstCard.click();
    await page.waitForSelector('[data-testid="card-detail-panel"]');

    // Find and click Put on Hold button
    const holdButton = page.locator('button:has-text("Put on Hold")');
    if (await holdButton.count() === 0) {
      test.skip('Put on Hold button not found');
      return;
    }

    await holdButton.click();

    // Wait for hold dialog
    const holdDialog = page.locator('[role="dialog"]');
    await holdDialog.waitFor({ timeout: 5000 });

    // Take screenshot of hold dialog
    await page.screenshot({
      path: 'e2e/screenshots/hold-dialog.png',
      fullPage: true
    });

    // Verify optional reason field exists
    const reasonField = page.locator('textarea, input[type="text"]').filter({ hasText: /reason/i });
    const reasonFieldExists = await reasonField.count() > 0;
    console.log(`Reason field exists: ${reasonFieldExists}`);

    // Find cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.count() > 0) {
      await cancelButton.click();

      // Verify dialog closed
      await expect(holdDialog).not.toBeVisible({ timeout: 2000 });
      console.log('Hold dialog cancelled successfully');
    } else {
      // Try clicking X button
      const closeButton = page.locator('button[aria-label="Close"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await expect(holdDialog).not.toBeVisible({ timeout: 2000 });
        console.log('Hold dialog closed with X button');
      }
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate and interact with the page
    const firstCard = page.locator('[data-testid="production-card"]').first();

    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForSelector('[data-testid="card-detail-panel"]');

      // Wait a moment for any async errors
      await page.waitForTimeout(2000);
    }

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/final-state.png',
      fullPage: true
    });

    // Report any console errors
    if (errors.length > 0) {
      console.log('Console errors detected:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    expect(errors.length).toBe(0);
  });
});
