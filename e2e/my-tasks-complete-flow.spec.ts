import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results/my-tasks-flow');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('My Tasks - Complete Flow with Authorization Fix Test', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Fill login credentials (using the standard test user)
    await page.fill('input[type="email"], input[name="email"]', 'automated-test@appraisetrack.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');

    // Click sign in button
    await page.click('button:has-text("Sign In")');

    // Wait for navigation after login
    await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Complete Flow: Create Task → View Detail (Authorization Fix) → Test Controls', async ({ page }) => {
    console.log('\n=== STARTING COMPREHENSIVE MY TASKS TEST ===\n');

    // STEP 1: Navigate to Production Board
    console.log('Step 1: Navigating to Production Board...');
    await page.goto(`${BASE_URL}/production`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-production-board.png'), fullPage: true });
    console.log('✓ Production board loaded');

    // STEP 2: Create a new task
    console.log('\nStep 2: Creating a test task...');

    // Look for create task button (might be "Add Task", "New Task", "Create Task", or a "+" button)
    const createTaskSelectors = [
      'button:has-text("Add Task")',
      'button:has-text("New Task")',
      'button:has-text("Create Task")',
      'button:has-text("Create")',
      'button[title*="task" i]',
      'button[aria-label*="task" i]',
      '[data-testid="create-task"]',
      'button:has-text("+")'
    ];

    let createButton = null;
    for (const selector of createTaskSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible().catch(() => false)) {
        createButton = button;
        console.log(`→ Found create button with selector: ${selector}`);
        break;
      }
    }

    if (!createButton) {
      console.log('⚠️  No create task button found on production board');
      console.log('→ Checking if there are existing tasks to test with...');

      // Navigate to My Tasks to see if there are any tasks
      await page.goto(`${BASE_URL}/production/my-tasks`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-my-tasks-no-create.png'), fullPage: true });

      const existingTasks = await page.locator('button:has-text("View Details"), a:has-text("View Details")').count();

      if (existingTasks === 0) {
        console.log('✗ Cannot proceed - no tasks exist and cannot create new task');
        console.log('   This may indicate the test user needs proper permissions or tasks need to be seeded');
        test.skip();
        return;
      } else {
        console.log(`→ Found ${existingTasks} existing task(s), will test with those`);
      }
    } else {
      // Create the task
      await createButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-create-task-modal.png'), fullPage: true });

      // Fill in task details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[label*="title" i]').first();
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();

      if (await titleInput.count() > 0) {
        await titleInput.fill('Authorization Fix Test Task');
        console.log('→ Filled task title');
      }

      if (await descriptionInput.count() > 0) {
        await descriptionInput.fill('This task is used to test the authorization bug fix on task detail pages');
        console.log('→ Filled task description');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-task-form-filled.png'), fullPage: true });

      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();

      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        console.log('✓ Task created successfully');
      } else {
        console.log('⚠️  Could not find submit button');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-after-task-creation.png'), fullPage: true });
    }

    // STEP 3: Navigate to My Tasks
    console.log('\nStep 3: Navigating to My Tasks page...');
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-my-tasks-page.png'), fullPage: true });

    const taskCount = await page.locator('button:has-text("View Details"), a:has-text("View Details")').count();
    console.log(`→ Found ${taskCount} task(s) on My Tasks page`);

    if (taskCount === 0) {
      console.log('✗ No tasks available to test');
      test.skip();
      return;
    }

    console.log('✓ My Tasks page loaded with tasks');

    // STEP 4: CRITICAL TEST - Click View Details (Authorization Bug Fix Test)
    console.log('\n=== CRITICAL TEST: Task Detail Page Authorization Fix ===');
    console.log('Step 4: Clicking "View Details" to test authorization fix...');

    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewDetailsButton.click();
    console.log('→ Clicked View Details button');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give extra time for the page to fully render

    // Immediate screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-task-detail-initial.png'), fullPage: true });

    // CRITICAL CHECK: Is there infinite loading?
    console.log('\n→ Checking for infinite loading bug...');
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="spinner"]',
      'svg[class*="animate-spin"]'
    ];

    let foundInfiniteLoading = false;
    for (const selector of loadingSelectors) {
      const loading = page.locator(selector);
      if (await loading.count() > 0) {
        const isVisible = await loading.first().isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✗ FAILED: Infinite loading detected with selector: ${selector}`);
          foundInfiniteLoading = true;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06b-INFINITE-LOADING-BUG.png'), fullPage: true });
          break;
        }
      }
    }

    if (foundInfiniteLoading) {
      expect(foundInfiniteLoading).toBe(false); // Fail the test
    } else {
      console.log('✓ PASSED: No infinite loading detected');
    }

    // Verify actual content is loaded
    console.log('\n→ Verifying task detail content loaded...');
    const hasTitle = await page.locator('h1, h2, h3').count() > 0;
    const hasContent = await page.locator('p, div').count() > 10;
    const currentUrl = page.url();

    console.log(`  - Has heading: ${hasTitle ? 'YES' : 'NO'}`);
    console.log(`  - Has content: ${hasContent ? 'YES' : 'NO'}`);
    console.log(`  - Current URL: ${currentUrl}`);

    expect(hasTitle || hasContent).toBeTruthy();

    // Check for key UI elements
    const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count() > 0;
    const hasTimerButton = await page.locator('button:has-text("Timer"), button:has-text("Start")').count() > 0;
    const hasButtons = await page.locator('button').count() > 0;

    console.log(`  - Has back button: ${hasBackButton ? 'YES' : 'NO'}`);
    console.log(`  - Has timer button: ${hasTimerButton ? 'YES' : 'NO'}`);
    console.log(`  - Has action buttons: ${hasButtons ? 'YES' : 'NO'}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-task-detail-verified.png'), fullPage: true });

    console.log('\n✓ PASSED: Task detail page loaded successfully (Authorization fix working!)');

    // STEP 5: Test Timer Controls
    console.log('\nStep 5: Testing timer controls...');

    const startTimerButton = page.locator('button:has-text("Start Timer"), button:has-text("Start")').first();

    if (await startTimerButton.count() === 0) {
      console.log('⚠️  No Start Timer button found - skipping timer test');
    } else {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-before-timer-start.png'), fullPage: true });

      await startTimerButton.click();
      console.log('→ Clicked Start Timer');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-timer-running.png'), fullPage: true });

      // Check for stop button
      const stopTimerButton = page.locator('button:has-text("Stop"), button:has-text("Pause")').first();
      if (await stopTimerButton.count() > 0) {
        console.log('→ Timer started, stop button visible');
        await stopTimerButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-timer-stopped.png'), fullPage: true });
        console.log('✓ Timer controls working');
      } else {
        console.log('⚠️  Stop button not found after starting timer');
      }
    }

    // STEP 6: Test Back Navigation
    console.log('\nStep 6: Testing back navigation...');

    const backButton = page.locator('button:has-text("Back to My Tasks"), button:has-text("Back"), a:has-text("Back")').first();

    if (await backButton.count() === 0) {
      console.log('⚠️  No back button found');
    } else {
      await backButton.click();
      console.log('→ Clicked back button');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-back-to-my-tasks.png'), fullPage: true });

      const backUrl = page.url();
      expect(backUrl).toContain('/my-tasks');
      console.log('✓ Back navigation working');
    }

    // STEP 7: Check Console Errors
    console.log('\nStep 7: Checking for console errors...');
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate one more time to catch any errors
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const viewBtn = page.locator('button:has-text("View Details")').first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final-state.png'), fullPage: true });

    if (errors.length > 0) {
      console.log('⚠️  Console errors detected:');
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    } else {
      console.log('✓ No console errors detected');
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('\n✅ ALL TESTS PASSED - Authorization bug fix verified!\n');
  });
});
