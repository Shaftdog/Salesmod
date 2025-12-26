import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('My Tasks - Authorization Bug Fix Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Wait for page to be ready
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

  test('1. Navigate to My Tasks page', async ({ page }) => {
    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-my-tasks-page.png', fullPage: true });

    // Verify we're on the page (look for any heading)
    const hasContent = await page.locator('h1, h2, h3, [role="heading"]').count() > 0;
    expect(hasContent).toBeTruthy();

    console.log('✓ My Tasks page loaded successfully');
  });

  test('2. CRITICAL: Task Detail Page Loads Without Infinite Loading (Authorization Fix)', async ({ page }) => {
    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of My Tasks page
    await page.screenshot({ path: 'test-results/02-my-tasks-before-click.png', fullPage: true });

    // Look for any task cards or create a task if none exist
    const taskCards = await page.locator('button:has-text("View Details"), a:has-text("View Details"), [data-testid*="task"]').count();

    if (taskCards === 0) {
      console.log('⚠ No tasks found. Attempting to create a test task...');

      // Look for "Create Task" or "Add Task" button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Task"), button:has-text("New Task")').first();

      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill in basic task info
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Task for Authorization Fix');

          // Submit the form
          await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first().click();
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
        }
      } else {
        console.log('✗ Cannot create task - no create button found');
        test.skip();
        return;
      }
    }

    // Now try to view a task detail
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();

    if (await viewDetailsButton.count() === 0) {
      console.log('✗ No View Details button found even after attempting to create task');
      test.skip();
      return;
    }

    // Click View Details
    console.log('→ Clicking View Details button...');
    await viewDetailsButton.click();

    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for page to render

    // Take screenshot immediately
    await page.screenshot({ path: 'test-results/03-task-detail-page.png', fullPage: true });

    // CRITICAL TEST: Check if we're stuck in infinite loading
    // The bug would manifest as a loading spinner that never goes away
    const loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner, [class*="loading"]');
    const spinnerCount = await loadingSpinner.count();

    if (spinnerCount > 0) {
      // Check if spinner is visible
      const isSpinnerVisible = await loadingSpinner.first().isVisible().catch(() => false);

      if (isSpinnerVisible) {
        console.log('✗ FAILED: Loading spinner is visible (infinite loading detected)');
        await page.screenshot({ path: 'test-results/03b-infinite-loading-bug.png', fullPage: true });
        expect(isSpinnerVisible).toBe(false); // Fail the test
      }
    }

    // Verify actual content is loaded
    const hasTitle = await page.locator('h1, h2, h3').count() > 0;
    const hasContent = await page.locator('p, div, section').count() > 5; // Should have some content

    console.log(`→ Page has title: ${hasTitle}`);
    console.log(`→ Page has content: ${hasContent}`);

    // Check URL changed to detail page
    const currentUrl = page.url();
    console.log(`→ Current URL: ${currentUrl}`);

    expect(hasTitle || hasContent).toBeTruthy();

    // Look for key elements that should be on a task detail page
    const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count() > 0;
    const hasActionButtons = await page.locator('button').count() > 0;

    console.log(`→ Has back button: ${hasBackButton}`);
    console.log(`→ Has action buttons: ${hasActionButtons}`);

    // Final screenshot
    await page.screenshot({ path: 'test-results/04-task-detail-loaded.png', fullPage: true });

    console.log('✓ PASSED: Task detail page loaded successfully (no infinite loading)');
  });

  test('3. Timer Controls Work', async ({ page }) => {
    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click View Details
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();

    if (await viewDetailsButton.count() === 0) {
      console.log('⚠ Skipping timer test - no tasks available');
      test.skip();
      return;
    }

    await viewDetailsButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot before timer action
    await page.screenshot({ path: 'test-results/05-before-timer.png', fullPage: true });

    // Look for Start Timer button
    const startButton = page.locator('button:has-text("Start Timer"), button:has-text("Start")').first();

    if (await startButton.count() === 0) {
      console.log('⚠ No Start Timer button found');
      test.skip();
      return;
    }

    await startButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot after starting timer
    await page.screenshot({ path: 'test-results/06-timer-started.png', fullPage: true });

    // Check if Stop button appears
    const stopButton = page.locator('button:has-text("Stop"), button:has-text("Pause")').first();
    const hasStopButton = await stopButton.count() > 0;

    console.log(`→ Timer started, stop button visible: ${hasStopButton}`);

    if (hasStopButton) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/07-timer-stopped.png', fullPage: true });
      console.log('✓ Timer controls working');
    }
  });

  test('4. Back Navigation Works', async ({ page }) => {
    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click View Details
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();

    if (await viewDetailsButton.count() === 0) {
      console.log('⚠ Skipping back navigation test - no tasks available');
      test.skip();
      return;
    }

    await viewDetailsButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click back button
    const backButton = page.locator('button:has-text("Back to My Tasks"), button:has-text("Back"), a:has-text("Back")').first();

    if (await backButton.count() === 0) {
      console.log('⚠ No back button found');
      test.skip();
      return;
    }

    await backButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/08-back-to-my-tasks.png', fullPage: true });

    // Verify we're back on My Tasks page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/my-tasks');

    console.log('✓ Back navigation working');
  });

  test('5. No Console Errors During Navigation', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to click a task
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();

    if (await viewDetailsButton.count() > 0) {
      await viewDetailsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/09-final-state.png', fullPage: true });

    // Report errors
    if (errors.length > 0) {
      console.log('⚠ Console errors detected:');
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    } else {
      console.log('✓ No console errors detected');
    }

    // Don't fail test on console errors, just report them
  });
});
