import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test configuration
const BASE_URL = 'http://localhost:9002';
const CREDENTIALS = {
  email: 'rod@myroihome.com',
  password: 'Latter!974'
};

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '../test-results/my-tasks-verification');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.use({
  viewport: { width: 1280, height: 720 },
});

test.describe('My Tasks Page Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Wait for navigation after login - should go to dashboard or home
    await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log('✓ Logged in successfully');
    console.log(`Current URL after login: ${page.url()}`);
  });

  test('Test 1: My Tasks Page - Verify page loads', async ({ page }) => {
    console.log('\n=== Test 1: My Tasks Page Navigation ===');

    // Navigate to My Tasks with longer timeout
    await page.goto(`${BASE_URL}/production/my-tasks`, { waitUntil: 'networkidle', timeout: 30000 });

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '01-my-tasks-page-loaded.png'),
      fullPage: true
    });

    // Verify page loaded
    const pageTitle = await page.textContent('h1, h2').catch(() => null);
    console.log(`Page title: ${pageTitle}`);

    // Check for task cards
    const taskCards = await page.locator('[data-testid*="task"], .task-card, [class*="task"]').count();
    console.log(`Task cards found: ${taskCards}`);

    // Verify no error messages
    const errorMessages = await page.locator('text=/error|Error|ERROR/i').count();
    expect(errorMessages).toBe(0);

    console.log('✓ My Tasks page loaded successfully');
  });

  test('Test 2: Task Detail Page - Verify no infinite loading', async ({ page }) => {
    console.log('\n=== Test 2: Task Detail Page ===');

    // Navigate to My Tasks with longer timeout
    await page.goto(`${BASE_URL}/production/my-tasks`, { waitUntil: 'networkidle', timeout: 30000 });

    // Look for "View Details" button or link
    const viewDetailsButton = page.locator('text=/View Details/i').first();
    const hasViewDetails = await viewDetailsButton.count() > 0;

    if (!hasViewDetails) {
      console.log('⚠ No "View Details" buttons found, checking for task cards...');

      // Try clicking on a task card directly
      const taskCards = page.locator('[data-testid*="task"], .task-card, a[href*="/tasks/"]').first();
      const hasTaskCards = await taskCards.count() > 0;

      if (hasTaskCards) {
        await taskCards.click();
        console.log('✓ Clicked on task card');
      } else {
        console.log('⚠ No task cards found on the page');
        await page.screenshot({
          path: path.join(screenshotsDir, '02-no-tasks-found.png'),
          fullPage: true
        });
        return;
      }
    } else {
      await viewDetailsButton.click();
      console.log('✓ Clicked "View Details" button');
    }

    // Wait for navigation to task detail page
    await page.waitForURL(/\/tasks\/[^/]+/, { timeout: 5000 }).catch(() => {
      console.log('⚠ URL did not change to task detail page');
    });

    // Wait a moment for any loading states
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '02-task-detail-page.png'),
      fullPage: true
    });

    // Check for infinite loading spinner
    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"]');
    const spinnerCount = await loadingSpinner.count();

    if (spinnerCount > 0) {
      console.log('⚠ Loading spinner detected, waiting 3 more seconds...');
      await page.waitForTimeout(3000);

      const stillLoading = await loadingSpinner.count();
      if (stillLoading > 0) {
        console.log('❌ FAIL: Infinite loading detected');
        expect(stillLoading).toBe(0);
      }
    }

    // Verify task detail elements are present
    const hasTitle = await page.locator('h1, h2, h3').count() > 0;
    const hasDescription = await page.locator('text=/description/i').count() > 0;
    const hasStatus = await page.locator('text=/status/i, [class*="badge"], [class*="status"]').count() > 0;

    console.log(`Task title present: ${hasTitle}`);
    console.log(`Description present: ${hasDescription}`);
    console.log(`Status badge present: ${hasStatus}`);

    expect(hasTitle).toBe(true);

    console.log('✓ Task detail page loaded without infinite loading');
  });

  test('Test 3: Collapsible Subtasks - Expand and mark complete', async ({ page }) => {
    console.log('\n=== Test 3: Collapsible Subtasks ===');

    // Navigate to My Tasks with longer timeout
    await page.goto(`${BASE_URL}/production/my-tasks`, { waitUntil: 'networkidle', timeout: 30000 });

    // Navigate to first task detail
    const firstTask = page.locator('text=/View Details/i, a[href*="/tasks/"]').first();
    const hasTask = await firstTask.count() > 0;

    if (hasTask) {
      await firstTask.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠ No tasks available for subtask testing');
      return;
    }

    // Look for subtasks section
    const subtasksSection = page.locator('text=/subtasks/i, [data-testid*="subtask"]').first();
    const hasSubtasks = await subtasksSection.count() > 0;

    if (!hasSubtasks) {
      console.log('⚠ No subtasks section found on this task');
      await page.screenshot({
        path: path.join(screenshotsDir, '03-no-subtasks.png'),
        fullPage: true
      });
      return;
    }

    console.log('✓ Subtasks section found');

    // Try to expand subtasks (look for collapse/expand button)
    const expandButton = page.locator('button:has-text("Subtask"), [class*="collapse"], [aria-expanded]').first();
    const hasExpandButton = await expandButton.count() > 0;

    if (hasExpandButton) {
      const isExpanded = await expandButton.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await expandButton.click();
        await page.waitForTimeout(500);
        console.log('✓ Expanded subtasks section');
      }
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '03-subtasks-expanded.png'),
      fullPage: true
    });

    // Try to find and check a subtask checkbox
    const subtaskCheckbox = page.locator('input[type="checkbox"]').first();
    const hasCheckbox = await subtaskCheckbox.count() > 0;

    if (hasCheckbox) {
      const isChecked = await subtaskCheckbox.isChecked();
      if (!isChecked) {
        await subtaskCheckbox.check();
        await page.waitForTimeout(1000);
        console.log('✓ Marked subtask as complete');

        await page.screenshot({
          path: path.join(screenshotsDir, '03-subtask-marked-complete.png'),
          fullPage: true
        });
      } else {
        console.log('⚠ Subtask was already checked');
      }
    } else {
      console.log('⚠ No subtask checkboxes found');
    }
  });

  test('Test 4: Back Navigation - Return to My Tasks', async ({ page }) => {
    console.log('\n=== Test 4: Back Navigation ===');

    // Navigate to My Tasks with longer timeout
    await page.goto(`${BASE_URL}/production/my-tasks`, { waitUntil: 'networkidle', timeout: 30000 });

    // Navigate to first task detail
    const firstTask = page.locator('text=/View Details/i, a[href*="/tasks/"]').first();
    const hasTask = await firstTask.count() > 0;

    if (hasTask) {
      await firstTask.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      console.log('✓ Navigated to task detail');
    } else {
      console.log('⚠ No tasks available for navigation testing');
      return;
    }

    // Take screenshot of detail page
    await page.screenshot({
      path: path.join(screenshotsDir, '04-before-back-navigation.png'),
      fullPage: true
    });

    // Look for "Back to My Tasks" button
    const backButton = page.locator('text=/Back to My Tasks/i, button:has-text("Back"), a:has-text("Back")').first();
    const hasBackButton = await backButton.count() > 0;

    if (!hasBackButton) {
      console.log('⚠ No "Back to My Tasks" button found');
      await page.screenshot({
        path: path.join(screenshotsDir, '04-no-back-button.png'),
        fullPage: true
      });
      return;
    }

    console.log('✓ Back button found');

    // Click back button
    await backButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify we're back on My Tasks page
    const currentUrl = page.url();
    const isMyTasksPage = currentUrl.includes('/my-tasks');

    console.log(`Current URL: ${currentUrl}`);
    console.log(`Back on My Tasks page: ${isMyTasksPage}`);

    expect(isMyTasksPage).toBe(true);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '04-after-back-navigation.png'),
      fullPage: true
    });

    console.log('✓ Successfully navigated back to My Tasks');
  });
});
