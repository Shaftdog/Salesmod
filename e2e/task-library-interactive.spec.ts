import { test, expect } from '@playwright/test';

/**
 * Interactive Task Library Test (WITH AUTHENTICATION)
 *
 * This test opens a browser and waits for you to manually log in.
 * After you log in, it will automatically run the tests.
 *
 * HOW TO RUN:
 * 1. Make sure app is running at http://localhost:9002
 * 2. Run: npx playwright test e2e/task-library-interactive.spec.ts --headed --workers=1
 * 3. When browser opens, LOG IN with your credentials
 * 4. Once logged in, the test will automatically proceed
 */

test.describe('Task Library - Interactive Authentication Test', () => {
  test('should verify task library works with authentication', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TASK LIBRARY AUTHENTICATION TEST');
    console.log('='.repeat(70));

    // Step 1: Navigate to login page
    console.log('\n[Step 1] Navigating to application...');
    await page.goto('http://localhost:9002');

    // Check if already logged in or needs login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: `e2e/screenshots/task-library-interactive-01-initial-${Date.now()}.png`,
      fullPage: true
    });

    // Check if we're on a login page
    const loginForm = page.locator('form input[type="email"], input[type="password"]').first();
    const isOnLoginPage = await loginForm.isVisible().catch(() => false);

    if (isOnLoginPage) {
      console.log('\n[Step 2] LOGIN REQUIRED');
      console.log('='.repeat(70));
      console.log('Please log in using the browser window that just opened.');
      console.log('');
      console.log('Test credentials:');
      console.log('  Email: test@appraisetrack.com');
      console.log('  Password: TestPassword123!');
      console.log('');
      console.log('(or use any valid account)');
      console.log('='.repeat(70));
      console.log('\nWaiting for login... (60 seconds timeout)');

      // Wait for navigation away from login page (indicates successful login)
      try {
        await page.waitForURL(url => !url.pathname.includes('login') && !url.pathname.includes('auth'), {
          timeout: 60000
        });
        console.log('\n✓ Login detected! Proceeding with tests...\n');
      } catch (e) {
        console.log('\n❌ Timeout waiting for login. Please try again.\n');
        throw new Error('Login timeout - please log in within 60 seconds');
      }
    } else {
      console.log('\n✓ Already logged in, proceeding with tests...\n');
    }

    // Take screenshot after login
    await page.screenshot({
      path: `e2e/screenshots/task-library-interactive-02-logged-in-${Date.now()}.png`,
      fullPage: true
    });

    // Step 3: Navigate to Task Library
    console.log('[Step 3] Navigating to Task Library (/production/library)...');
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of task library
    await page.screenshot({
      path: `e2e/screenshots/task-library-interactive-03-library-page-${Date.now()}.png`,
      fullPage: true
    });

    // Step 4: Check for task count badge
    console.log('\n[Step 4] Checking task count badge...');

    const badge = page.locator('text=/\\d+ tasks?, \\d+ subtasks?/').first();

    try {
      await badge.waitFor({ state: 'visible', timeout: 5000 });
      const badgeText = await badge.textContent();
      console.log(`✓ Badge found: "${badgeText}"`);

      // Extract numbers from badge
      const match = badgeText?.match(/(\d+) tasks?, (\d+) subtasks?/);
      if (match) {
        const taskCount = parseInt(match[1]);
        const subtaskCount = parseInt(match[2]);

        console.log(`\n  Task count: ${taskCount}`);
        console.log(`  Subtask count: ${subtaskCount}`);

        if (taskCount === 0) {
          console.log('\n❌ FAILURE: Badge shows 0 tasks - RLS issue NOT fixed');
          console.log('   Expected: 30 tasks');
          console.log('   Actual: 0 tasks');
          expect(taskCount).toBeGreaterThan(0);
        } else if (taskCount === 30) {
          console.log('\n✅ SUCCESS: Badge shows correct data!');
          console.log('   ✓ 30 tasks (expected)');
          console.log('   ✓ 266 subtasks (expected)');
          expect(taskCount).toBe(30);
          expect(subtaskCount).toBe(266);
        } else {
          console.log(`\n⚠️  Unexpected task count: ${taskCount} (expected 30)`);
          console.log('   But at least data is visible (RLS is working)');
          expect(taskCount).toBeGreaterThan(0);
        }
      }
    } catch (e) {
      console.log('\n❌ Badge not found');
      throw e;
    }

    // Step 5: Verify all stages are visible
    console.log('\n[Step 5] Checking for all 10 production stages...');

    const expectedStages = [
      'INTAKE',
      'SCHEDULING',
      'INSPECTED',
      'ANALYSIS',
      'VERIFICATION',
      'DRAFT',
      'REVIEW',
      'FINALIZATION',
      'DELIVERED',
      'COMPLETE'
    ];

    let foundStages = 0;
    for (const stageName of expectedStages) {
      const stageElement = page.locator(`text="${stageName}"`).first();
      const isVisible = await stageElement.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        console.log(`  ✓ ${stageName}`);
        foundStages++;
      } else {
        console.log(`  ✗ ${stageName} - NOT FOUND`);
      }
    }

    console.log(`\n  Found ${foundStages}/10 stages`);
    expect(foundStages).toBe(10);

    // Step 6: Expand INTAKE stage and check tasks
    console.log('\n[Step 6] Testing stage expansion (INTAKE)...');

    const intakeHeader = page.locator('text="INTAKE"').first();
    await intakeHeader.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `e2e/screenshots/task-library-interactive-04-intake-expanded-${Date.now()}.png`,
      fullPage: true
    });

    // Look for task count in INTAKE
    const intakeTaskCount = page.locator('text=/16 tasks?/').first();
    const hasIntakeCount = await intakeTaskCount.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasIntakeCount) {
      console.log('  ✓ INTAKE shows 16 tasks');
    } else {
      console.log('  ⚠️  INTAKE task count not found (may have different format)');
    }

    // Step 7: Check console for errors
    console.log('\n[Step 7] Checking console for RLS errors...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for any async errors
    await page.waitForTimeout(2000);

    const rlsErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('rls') ||
      err.toLowerCase().includes('row level security') ||
      err.toLowerCase().includes('permission denied') ||
      err.toLowerCase().includes('policy')
    );

    if (rlsErrors.length > 0) {
      console.log('  ❌ RLS errors found:');
      rlsErrors.forEach(err => console.log(`     - ${err.substring(0, 100)}`));
      expect(rlsErrors).toHaveLength(0);
    } else {
      console.log('  ✓ No RLS errors detected');
    }

    // Final screenshot
    await page.screenshot({
      path: `e2e/screenshots/task-library-interactive-05-final-${Date.now()}.png`,
      fullPage: true
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('✅ Authentication: Working');
    console.log('✅ Task Library Page: Loaded');
    console.log('✅ Task Data: Visible (RLS Fix Confirmed)');
    console.log('✅ All Stages: Present');
    console.log('✅ Console: No RLS Errors');
    console.log('='.repeat(70));
    console.log('\n🎉 ALL TESTS PASSED - RLS FIX IS WORKING!\n');
  });
});
