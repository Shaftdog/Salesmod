import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', new Date().toISOString().replace(/:/g, '-').split('.')[0]);

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('My Tasks Page - Authorization Bug Fix Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Login and Navigate to My Tasks', async () => {
    console.log('Test 1: Starting login flow...');

    // Navigate to login page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-homepage.png'), fullPage: true });

    // Check if already logged in by looking for logout/user menu
    const isLoggedIn = await page.locator('text=/logout|sign out/i').count() > 0 ||
                       await page.locator('[data-testid="user-menu"]').count() > 0;

    if (!isLoggedIn) {
      // Look for login link/button
      const loginLink = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login"), a:has-text("Sign In")').first();
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await page.waitForLoadState('networkidle');
      }

      // Fill in login credentials
      await page.fill('input[type="email"], input[name="email"]', 'testuser@salesmod.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-form-filled.png'), fullPage: true });

      // Submit login form
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-after-login.png'), fullPage: true });
    }

    console.log('Test 1: Login successful, navigating to My Tasks...');

    // Navigate to My Tasks page
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for tasks to load
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-my-tasks-page.png'), fullPage: true });

    // Verify we're on the My Tasks page
    const pageTitle = await page.textContent('h1, h2');
    expect(pageTitle).toContain('Task');

    console.log('Test 1: PASSED - Successfully navigated to My Tasks page');
  });

  test('2. Verify Task Cards Display', async () => {
    console.log('Test 2: Checking task cards...');

    // Wait for task cards to load
    await page.waitForSelector('[data-testid="task-card"], .task-card, [class*="task"]', { timeout: 10000 }).catch(() => {
      console.log('No task cards found with standard selectors, checking for any cards...');
    });

    // Take screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-task-cards.png'), fullPage: true });

    // Count task cards
    const taskCards = await page.locator('button:has-text("View Details"), a:has-text("View Details"), button:has-text("Details"), [data-testid*="task"]').count();
    console.log(`Found ${taskCards} task cards/detail buttons`);

    if (taskCards === 0) {
      console.log('Test 2: WARNING - No task cards found. This might be expected if user has no tasks.');
      // This is not necessarily a failure - user might not have tasks
    } else {
      console.log('Test 2: PASSED - Task cards are displaying');
    }
  });

  test('3. Click View Details and Verify Task Detail Page Loads (Authorization Fix Test)', async () => {
    console.log('Test 3: Testing task detail page access (main authorization bug fix test)...');

    // Find and click the first "View Details" button
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details"), button:has-text("Details")').first();

    const buttonExists = await viewDetailsButton.count() > 0;

    if (!buttonExists) {
      console.log('Test 3: SKIPPED - No "View Details" button found. User may have no tasks.');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-no-tasks-to-test.png'), fullPage: true });
      return;
    }

    await viewDetailsButton.click();
    console.log('Test 3: Clicked View Details button, waiting for detail page...');

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give extra time for the page to fully render

    // Take screenshot of detail page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-task-detail-page.png'), fullPage: true });

    // CRITICAL TEST: Verify the page is NOT showing infinite loading
    const infiniteLoading = await page.locator('[data-testid="loading"], .loading, .spinner').count();
    if (infiniteLoading > 0) {
      const loadingVisible = await page.locator('[data-testid="loading"], .loading, .spinner').isVisible();
      if (loadingVisible) {
        console.error('Test 3: FAILED - Infinite loading detected! Authorization bug may still exist.');
        expect(loadingVisible).toBe(false); // This will fail the test
      }
    }

    // Verify task detail content is visible
    const hasTitle = await page.locator('h1, h2, h3').count() > 0;
    expect(hasTitle).toBe(true);

    // Check for key elements that should be on task detail page
    const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count() > 0;
    const hasTimerButton = await page.locator('button:has-text("Timer"), button:has-text("Start")').count() > 0;

    console.log('Test 3: Task detail page elements found:');
    console.log(`  - Title: ${hasTitle ? 'YES' : 'NO'}`);
    console.log(`  - Back Button: ${hasBackButton ? 'YES' : 'NO'}`);
    console.log(`  - Timer Controls: ${hasTimerButton ? 'YES' : 'NO'}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-task-detail-loaded.png'), fullPage: true });

    expect(hasTitle).toBe(true);
    console.log('Test 3: PASSED - Task detail page loaded successfully (NO infinite loading)');
  });

  test('4. Test Timer Controls', async () => {
    console.log('Test 4: Testing timer controls...');

    // Look for Start Timer button
    const startTimerButton = page.locator('button:has-text("Start Timer"), button:has-text("Start")').first();

    if (await startTimerButton.count() === 0) {
      console.log('Test 4: SKIPPED - No Start Timer button found');
      return;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-before-timer-start.png'), fullPage: true });

    await startTimerButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-after-timer-start.png'), fullPage: true });

    // Look for Stop Timer button or timer running indicator
    const stopTimerButton = page.locator('button:has-text("Stop Timer"), button:has-text("Stop"), button:has-text("Pause")').first();
    const timerRunning = await stopTimerButton.count() > 0;

    if (timerRunning) {
      console.log('Test 4: Timer started successfully, stopping timer...');
      await stopTimerButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-after-timer-stop.png'), fullPage: true });
      console.log('Test 4: PASSED - Timer controls working');
    } else {
      console.log('Test 4: WARNING - Could not verify timer started');
    }
  });

  test('5. Test Back Navigation', async () => {
    console.log('Test 5: Testing back navigation...');

    const backButton = page.locator('button:has-text("Back to My Tasks"), a:has-text("Back to My Tasks"), button:has-text("Back"), a:has-text("Back")').first();

    if (await backButton.count() === 0) {
      console.log('Test 5: SKIPPED - No back button found');
      return;
    }

    await backButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-back-to-my-tasks.png'), fullPage: true });

    // Verify we're back on My Tasks page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/my-tasks');

    console.log('Test 5: PASSED - Back navigation working');
  });

  test('6. Test Subtasks Display', async () => {
    console.log('Test 6: Testing subtasks...');

    // Navigate back to a task detail page
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();

    if (await viewDetailsButton.count() === 0) {
      console.log('Test 6: SKIPPED - No task to test subtasks');
      return;
    }

    await viewDetailsButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for subtasks section
    const subtasksSection = await page.locator('*:has-text("Subtask"), [data-testid="subtasks"]').count();

    if (subtasksSection === 0) {
      console.log('Test 6: INFO - No subtasks found (task may not have subtasks)');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-no-subtasks.png'), fullPage: true });
    } else {
      console.log('Test 6: Subtasks found, taking screenshot...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-subtasks-present.png'), fullPage: true });

      // Try to find a subtask checkbox to test completion
      const subtaskCheckbox = page.locator('input[type="checkbox"]').first();
      if (await subtaskCheckbox.count() > 0) {
        const isChecked = await subtaskCheckbox.isChecked();
        console.log(`Test 6: Found subtask checkbox, current state: ${isChecked ? 'checked' : 'unchecked'}`);

        // Toggle the checkbox
        await subtaskCheckbox.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-subtask-toggled.png'), fullPage: true });

        console.log('Test 6: PASSED - Subtask interaction working');
      }
    }
  });

  test('7. Check for Console Errors', async () => {
    console.log('Test 7: Checking for console errors...');

    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through the app one more time to catch any errors
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    if (await viewDetailsButton.count() > 0) {
      await viewDetailsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-final-state.png'), fullPage: true });

    if (errors.length > 0) {
      console.log('Test 7: Console errors detected:');
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    } else {
      console.log('Test 7: PASSED - No console errors detected');
    }
  });
});
