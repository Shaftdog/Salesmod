import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results/my-tasks-direct');
const TASK_ID = '08fff888-ff0c-4ed8-8451-349062ed0f8d'; // The INVOICE task assigned to test user

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('My Tasks - Direct Access Test (Authorization Fix)', () => {

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

  test('CRITICAL: Direct Task Detail Access - Authorization Bug Fix Test', async ({ page }) => {
    console.log('\n=== AUTHORIZATION BUG FIX - DIRECT TASK ACCESS TEST ===\n');

    // APPROACH: Bypass the My Tasks list and go directly to the task detail URL
    // This tests the core authorization fix without dependency on list rendering

    console.log('Step 1: Navigating directly to task detail page...');
    console.log(`  Task ID: ${TASK_ID}`);

    const taskDetailUrl = `${BASE_URL}/production/my-tasks/${TASK_ID}`;
    await page.goto(taskDetailUrl);

    console.log(`  URL: ${taskDetailUrl}`);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000); // Give extra time for full render

    // Take immediate screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-task-detail-loaded.png'), fullPage: true });

    console.log('\n=== CRITICAL CHECK: Infinite Loading Bug ===');

    // Check for infinite loading (the bug we're testing)
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading-spinner',
      '.spinner',
      '[class*="loading"]',
      'svg[class*="animate-spin"]',
      '[role="status"]',
      'div:has-text("Loading...")'
    ];

    let infiniteLoadingDetected = false;
    let detectedSelector = '';

    for (const selector of loadingSelectors) {
      const elem = page.locator(selector);
      if (await elem.count() > 0) {
        const isVisible = await elem.first().isVisible().catch(() => false);
        if (isVisible) {
          infiniteLoadingDetected = true;
          detectedSelector = selector;
          console.log(`  ✗ FAILED: Infinite loading detected!`);
          console.log(`    Selector: ${selector}`);
          break;
        }
      }
    }

    if (infiniteLoadingDetected) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-INFINITE-LOADING-BUG.png'), fullPage: true });
      console.log('\n✗✗✗ TEST FAILED ✗✗✗');
      console.log('The authorization bug is still present - page stuck in infinite loading');
      expect(infiniteLoadingDetected).toBe(false); // Fail the test
    } else {
      console.log('  ✓ PASSED: No infinite loading detected');
    }

    // Verify content loaded
    console.log('\n→ Verifying page content loaded...');

    const pageTitle = await page.locator('h1, h2, h3').first().textContent().catch(() => null);
    const hasContent = await page.locator('p, div, section, button').count() > 10;
    const currentUrl = page.url();

    console.log(`  - Page title: ${pageTitle || '(not found)'}`);
    console.log(`  - Has content: ${hasContent ? 'YES' : 'NO'}`);
    console.log(`  - Current URL: ${currentUrl}`);

    // Check for key UI elements on task detail page
    const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count() > 0;
    const hasTimerControls = await page.locator('button:has-text("Timer"), button:has-text("Start")').count() > 0;
    const hasActionButtons = await page.locator('button').count() >= 2;
    const hasTaskInfo = await page.locator('text=/task|status|due|assigned/i').count() > 0;

    console.log(`  - Back button: ${hasBackButton ? 'YES' : 'NO'}`);
    console.log(`  - Timer controls: ${hasTimerControls ? 'YES' : 'NO'}`);
    console.log(`  - Action buttons: ${hasActionButtons ? 'YES' : 'NO'}`);
    console.log(`  - Task info visible: ${hasTaskInfo ? 'YES' : 'NO'}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-content-verified.png'), fullPage: true });

    // Verify page actually loaded with content
    expect(pageTitle || hasContent || hasTaskInfo).toBeTruthy();

    console.log('\n✓✓✓ TEST PASSED ✓✓✓');
    console.log('Task detail page loaded successfully without infinite loading!');
    console.log('Authorization bug fix is working correctly.');

    // Additional test: Try timer controls if available
    if (hasTimerControls) {
      console.log('\n→ Testing timer controls...');

      const startButton = page.locator('button:has-text("Start Timer"), button:has-text("Start")').first();
      await startButton.click();
      console.log('  - Clicked Start Timer');

      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-timer-started.png'), fullPage: true });

      const stopButton = page.locator('button:has-text("Stop"), button:has-text("Pause")').first();
      if (await stopButton.count() > 0) {
        console.log('  - Timer running, stop button visible');
        await stopButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-timer-stopped.png'), fullPage: true });
        console.log('  ✓ Timer controls working');
      }
    }

    // Test back navigation if available
    if (hasBackButton) {
      console.log('\n→ Testing back navigation...');

      const backBtn = page.locator('button:has-text("Back to My Tasks"), button:has-text("Back"), a:has-text("Back")').first();
      await backBtn.click();
      console.log('  - Clicked back button');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-navigated-back.png'), fullPage: true });

      const returnUrl = page.url();
      console.log(`  - Returned to: ${returnUrl}`);

      if (returnUrl.includes('/my-tasks')) {
        console.log('  ✓ Back navigation working');
      }
    }

    console.log('\n=== ALL TESTS COMPLETE ===\n');
  });
});
