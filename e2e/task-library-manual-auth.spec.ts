import { test, expect } from '@playwright/test';

/**
 * Task Library Manual Authentication Test
 *
 * This test assumes you have manually logged in to the application
 * and the session is preserved.
 *
 * Steps to run this test:
 * 1. Start the app: npm run dev (port 9002)
 * 2. Manually login through the browser at http://localhost:9002
 * 3. Run this test: npx playwright test e2e/task-library-manual-auth.spec.ts --headed
 *
 * The test will use your existing browser session.
 */

test.describe('Task Library - Manual Auth Test', () => {
  test.use({
    // Use persistent context to maintain login session
    storageState: '.auth/user.json'
  });

  test.beforeAll(async () => {
    console.log('='.repeat(60));
    console.log('MANUAL LOGIN REQUIRED');
    console.log('='.repeat(60));
    console.log('Please ensure you are logged in at http://localhost:9002');
    console.log('Test credentials:');
    console.log('  Email: test@appraisetrack.com');
    console.log('  Password: TestPassword123!');
    console.log('='.repeat(60));
  });

  test('should show task library data when logged in', async ({ page }) => {
    console.log('\n=== Navigating to Task Library ===');
    await page.goto('http://localhost:9002/production/library', { waitUntil: 'networkidle' });

    // Take screenshot of initial page load
    await page.screenshot({
      path: `e2e/screenshots/task-library-manual-auth-initial-${Date.now()}.png`,
      fullPage: true
    });

    console.log('Checking for task count badge...');

    // Check for the summary badge
    const badge = page.locator('text=/\\d+ tasks?, \\d+ subtasks?/').first();

    try {
      await badge.waitFor({ state: 'visible', timeout: 5000 });
      const badgeText = await badge.textContent();
      console.log(`✓ Badge found: "${badgeText}"`);

      // Check if showing actual data (not 0)
      if (badgeText && badgeText.includes('30 tasks')) {
        console.log('✅ SUCCESS: Task library shows correct data (30 tasks, 266 subtasks)');
        expect(badgeText).toContain('30 tasks');
        expect(badgeText).toContain('266 subtasks');
      } else if (badgeText && badgeText.includes('0 tasks')) {
        console.log('❌ FAILURE: Badge shows "0 tasks" - RLS issue still present');
        expect(badgeText).not.toContain('0 tasks');
      } else {
        console.log(`⚠️  Badge shows: ${badgeText}`);
      }
    } catch (e) {
      console.log('❌ Badge not found - checking page content');

      // Take another screenshot
      await page.screenshot({
        path: `e2e/screenshots/task-library-no-badge-${Date.now()}.png`,
        fullPage: true
      });

      // Check if we're on login page
      const loginForm = page.locator('form').filter({ hasText: /sign in|log in|email|password/i });
      const isLoginPage = await loginForm.isVisible().catch(() => false);

      if (isLoginPage) {
        console.log('❌ Redirected to login page - not authenticated');
        throw new Error('Not authenticated - please log in first');
      }

      throw new Error('Task library badge not found on page');
    }
  });

  test('should display all 10 stages', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library', { waitUntil: 'networkidle' });

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

    console.log('\n=== Checking for all 10 production stages ===');
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

    console.log(`\nFound ${foundStages}/10 stages`);

    await page.screenshot({
      path: `e2e/screenshots/task-library-stages-${Date.now()}.png`,
      fullPage: true
    });

    expect(foundStages).toBe(10);
  });

  test('should show task details when expanding', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library', { waitUntil: 'networkidle' });

    console.log('\n=== Testing task expansion ===');

    // Find INTAKE stage
    const intakeStage = page.locator('text="INTAKE"').first();
    await expect(intakeStage).toBeVisible();

    // Click to expand
    console.log('Expanding INTAKE stage...');
    await intakeStage.click();
    await page.waitForTimeout(1000);

    // Take screenshot of expanded state
    await page.screenshot({
      path: `e2e/screenshots/task-library-expanded-${Date.now()}.png`,
      fullPage: true
    });

    // Check for task cards
    const taskCards = page.locator('[data-testid*="task"]').or(
      page.locator('.task').or(
        page.locator('button,div').filter({ hasText: /Initial|Review|Contact/i })
      )
    );

    const taskCount = await taskCards.count();
    console.log(`Found ${taskCount} task elements`);

    // Should see at least some tasks
    expect(taskCount).toBeGreaterThan(0);
  });

  test('should check console for RLS errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('http://localhost:9002/production/library', { waitUntil: 'networkidle' });

    // Wait for any async operations
    await page.waitForTimeout(3000);

    // Take final screenshot
    await page.screenshot({
      path: `e2e/screenshots/task-library-final-${Date.now()}.png`,
      fullPage: true
    });

    console.log('\n=== Console Messages ===');
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);

    // Filter for RLS-related errors
    const rlsErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('rls') ||
      err.toLowerCase().includes('row level security') ||
      err.toLowerCase().includes('permission denied') ||
      err.toLowerCase().includes('policy') ||
      err.toLowerCase().includes('new row violates')
    );

    if (rlsErrors.length > 0) {
      console.log('\n❌ RLS-related errors detected:');
      rlsErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
      expect(rlsErrors).toHaveLength(0);
    } else {
      console.log('\n✅ No RLS-related errors found');
    }

    // Log all errors for reference
    if (consoleErrors.length > 0) {
      console.log('\nAll console errors:');
      consoleErrors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 150)}`);
      });
    }
  });
});
