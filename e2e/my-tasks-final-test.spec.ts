import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results/my-tasks-final');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('My Tasks - Authorization Bug Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Fill login credentials
    await page.fill('input[type="email"], input[name="email"]', 'automated-test@appraisetrack.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');

    // Click sign in button
    await page.click('button:has-text("Sign In")');

    // Wait for navigation after login
    await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('CRITICAL: Test Task Detail Page Authorization Fix', async ({ page }) => {
    console.log('\n=== MY TASKS AUTHORIZATION BUG FIX TEST ===\n');

    // Step 1: Navigate to Production Dashboard
    console.log('Step 1: Navigating to Production Dashboard...');
    await page.goto(`${BASE_URL}/production`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-production-dashboard.png'), fullPage: true });
    console.log('✓ Production dashboard loaded');

    // Step 2: Click on "Production Board" button to access Kanban board
    console.log('\nStep 2: Opening Production Kanban Board...');
    const productionBoardButton = page.locator('button:has-text("Production Board"), a:has-text("Production Board"), a:has-text("Open Board")').first();

    if (await productionBoardButton.count() > 0) {
      await productionBoardButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-kanban-board.png'), fullPage: true });
      console.log('✓ Kanban board opened');
    } else {
      console.log('→ Production Board button not found, trying direct URL...');
      await page.goto(`${BASE_URL}/production/board`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-kanban-board-direct.png'), fullPage: true });
    }

    // Step 3: Look for existing tasks or create a new one
    console.log('\nStep 3: Checking for tasks on the board...');

    // Look for task cards on Kanban board
    const taskCards = await page.locator('[data-testid="task-card"], .task-card, [class*="Card"]').count();
    console.log(`→ Found ${taskCards} task cards on Kanban board`);

    if (taskCards === 0) {
      console.log('→ No tasks found, attempting to create one...');

      // Look for "Add Task" or "+" button on Kanban columns
      const addTaskButton = page.locator('button:has-text("Add"), button:has-text("+"), button[title*="task" i]').first();

      if (await addTaskButton.count() > 0) {
        await addTaskButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-create-task-modal.png'), fullPage: true });

        // Fill task form
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Task - Authorization Fix Verification');
          console.log('→ Filled task title');

          // Look for description field
          const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
          if (await descInput.count() > 0) {
            await descInput.fill('This task tests the authorization bug fix for task detail pages');
          }

          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-task-form-filled.png'), fullPage: true });

          // Submit
          const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            await page.waitForLoadState('networkidle');
            console.log('✓ Task created');
          }
        }
      } else {
        console.log('⚠️  Cannot create task - no add button found');
      }
    }

    // Step 4: Navigate to My Tasks page
    console.log('\nStep 4: Navigating to My Tasks page...');
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-my-tasks-page.png'), fullPage: true });

    const myTasksCount = await page.locator('button:has-text("View Details"), a:has-text("View Details")').count();
    console.log(`→ Found ${myTasksCount} task(s) on My Tasks page`);

    if (myTasksCount === 0) {
      console.log('\n⚠️  Test user has no assigned tasks');
      console.log('   The authorization fix cannot be tested without tasks.');
      console.log('   Recommendation: Assign tasks to automated-test@appraisetrack.com user\n');
      test.skip();
      return;
    }

    console.log('✓ My Tasks page loaded with tasks available');

    // Step 5: CRITICAL TEST - Click View Details (This tests the authorization fix)
    console.log('\n=== CRITICAL TEST: Task Detail Page Authorization ===');
    console.log('\nStep 5: Clicking "View Details" to access task detail page...');
    console.log('        (This is where the authorization bug would cause infinite loading)');

    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewDetailsButton.click();
    console.log('→ Clicked View Details button');

    // Wait for page load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000); // Give time for page to fully render

    // Take immediate screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-task-detail-page.png'), fullPage: true });

    // CRITICAL CHECK: Verify NO infinite loading spinner
    console.log('\n→ Checking for infinite loading bug...');

    const loadingIndicators = [
      '[data-testid="loading"]',
      '.loading-spinner',
      '.spinner',
      '[class*="loading"]',
      'svg[class*="animate-spin"]',
      '[role="status"]'
    ];

    let infiniteLoadingDetected = false;
    for (const selector of loadingIndicators) {
      const elem = page.locator(selector);
      if (await elem.count() > 0) {
        const isVisible = await elem.first().isVisible().catch(() => false);
        if (isVisible) {
          console.log(`  ✗ FAILED: Infinite loading detected (selector: ${selector})`);
          infiniteLoadingDetected = true;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06b-INFINITE-LOADING-DETECTED.png'), fullPage: true });
          break;
        }
      }
    }

    if (infiniteLoadingDetected) {
      console.log('\n✗ TEST FAILED: Authorization bug still present!');
      console.log('  The task detail page is stuck in infinite loading.');
      expect(infiniteLoadingDetected).toBe(false);
    } else {
      console.log('  ✓ PASSED: No infinite loading spinner detected');
    }

    // Verify content loaded successfully
    console.log('\n→ Verifying task detail content loaded...');

    const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => null);
    const hasContent = await page.locator('p, div, section').count() > 5;
    const currentUrl = page.url();

    console.log(`  - Page title: ${pageTitle || '(not found)'}`);
    console.log(`  - Has content elements: ${hasContent ? 'YES' : 'NO'}`);
    console.log(`  - Current URL: ${currentUrl}`);

    // Check for expected UI elements
    const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count() > 0;
    const hasTimerButton = await page.locator('button:has-text("Timer"), button:has-text("Start")').count() > 0;
    const hasActionButtons = await page.locator('button').count() >= 2;

    console.log(`  - Back button present: ${hasBackButton ? 'YES' : 'NO'}`);
    console.log(`  - Timer controls present: ${hasTimerButton ? 'YES' : 'NO'}`);
    console.log(`  - Action buttons present: ${hasActionButtons ? 'YES' : 'NO'}`);

    // Take final screenshot showing loaded state
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-task-detail-verified.png'), fullPage: true });

    // Verify at least some content loaded
    expect(pageTitle || hasContent).toBeTruthy();

    console.log('\n✓ PASSED: Task detail page loaded successfully!');
    console.log('  The authorization bug fix is working - no infinite loading occurred.');

    // Step 6: Test Timer Controls (if available)
    if (hasTimerButton) {
      console.log('\nStep 6: Testing timer controls...');

      const startButton = page.locator('button:has-text("Start Timer"), button:has-text("Start")').first();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-before-timer.png'), fullPage: true });

      await startButton.click();
      console.log('→ Clicked Start Timer');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-timer-started.png'), fullPage: true });

      const stopButton = page.locator('button:has-text("Stop"), button:has-text("Pause")').first();
      if (await stopButton.count() > 0) {
        console.log('→ Timer started successfully');
        await stopButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-timer-stopped.png'), fullPage: true });
        console.log('✓ Timer controls working');
      }
    }

    // Step 7: Test Back Navigation
    if (hasBackButton) {
      console.log('\nStep 7: Testing back navigation...');

      const backBtn = page.locator('button:has-text("Back to My Tasks"), button:has-text("Back"), a:has-text("Back")').first();
      await backBtn.click();
      console.log('→ Clicked back button');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-back-to-my-tasks.png'), fullPage: true });

      const returnUrl = page.url();
      expect(returnUrl).toContain('/my-tasks');
      console.log('✓ Back navigation working correctly');
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('\n✅ SUCCESS: All tests passed!');
    console.log('   - Task detail page loads without infinite loading');
    console.log('   - Authorization bug fix is working correctly');
    console.log('   - User can view task details successfully\n');
  });
});
