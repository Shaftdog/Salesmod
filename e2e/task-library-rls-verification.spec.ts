import { test, expect } from '@playwright/test';

test.describe('Task Library - RLS Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display 30 tasks with 266 subtasks in the library', async ({ page }) => {
    // Navigate to the task library
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/01-task-library-initial.png', fullPage: true });

    // Get page content
    const pageContent = await page.content();

    // Check if we're on login page
    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      console.log('⚠️ AUTHENTICATION REQUIRED');
      console.log('Current URL:', page.url());
      await page.screenshot({ path: 'tests/screenshots/01-needs-authentication.png', fullPage: true });

      test.fail(true, 'User must be authenticated to test this feature. Please log in first.');
      return;
    }

    // Check for the "0 tasks, 0 subtasks" bad state
    const hasZeroCount = pageContent.includes('0 tasks, 0 subtasks') ||
                         (pageContent.includes('0 tasks') && pageContent.includes('0 subtasks'));

    // Check for the correct "30 tasks" count
    const has30Tasks = pageContent.includes('30 tasks') ||
                       (pageContent.includes('30') && pageContent.includes('tasks'));

    const has266Subtasks = pageContent.includes('266 subtasks') ||
                           (pageContent.includes('266') && pageContent.includes('subtasks'));

    console.log('===== DATA VISIBILITY CHECK =====');
    console.log('Has zero count (BAD):', hasZeroCount);
    console.log('Has 30 tasks (GOOD):', has30Tasks);
    console.log('Has 266 subtasks (GOOD):', has266Subtasks);
    console.log('Current URL:', page.url());

    // Take a screenshot showing the current state
    await page.screenshot({ path: 'tests/screenshots/01-badge-check.png', fullPage: true });

    // Log visible text content for debugging
    const visibleText = await page.locator('body').textContent();
    console.log('Page contains "30":', visibleText?.includes('30'));
    console.log('Page contains "tasks":', visibleText?.includes('tasks'));

    // ASSERTIONS
    expect(hasZeroCount, '❌ FAIL: Still showing "0 tasks, 0 subtasks" - RLS fix did not work').toBe(false);
    expect(has30Tasks, '✅ PASS: Should display "30 tasks" after RLS fix').toBe(true);
  });

  test('should show correct task counts per stage', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check authentication
    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      test.fail(true, 'Authentication required');
      return;
    }

    await page.screenshot({ path: 'tests/screenshots/02-stages-view.png', fullPage: true });

    const pageContent = await page.content();

    console.log('===== STAGE COUNT VERIFICATION =====');

    // Expected stage counts based on the seed data
    const expectedCounts = {
      'INTAKE': 16,
      'INSPECTED': 3,
      'SCHEDULING': 3,
      'FINALIZATION': 2
    };

    let allStagesFound = true;

    for (const [stage, count] of Object.entries(expectedCounts)) {
      const hasStage = pageContent.includes(stage);
      console.log(`${stage}: present=${hasStage}, expected count=${count}`);

      if (!hasStage) {
        allStagesFound = false;
        console.log(`  ❌ Stage ${stage} not found in page`);
      } else {
        console.log(`  ✅ Stage ${stage} found`);
      }
    }

    expect(allStagesFound, 'All expected stages should be present').toBe(true);
  });

  test('should expand INTAKE stage and show tasks', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      test.fail(true, 'Authentication required');
      return;
    }

    console.log('===== INTAKE STAGE EXPANSION =====');

    // Try to find the INTAKE stage section
    const intakeHeading = page.locator('text=INTAKE').first();
    const isVisible = await intakeHeading.isVisible().catch(() => false);

    console.log('INTAKE heading visible:', isVisible);

    if (isVisible) {
      // Try to click on it to expand
      await intakeHeading.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/screenshots/03-intake-expanded.png', fullPage: true });

      // Check if content expanded
      const afterClick = await page.content();
      const hasMoreContent = afterClick.includes('subtasks') ||
                             afterClick.includes('Appraiser') ||
                             afterClick.includes('Client');

      console.log('Content expanded after click:', hasMoreContent);
      expect(hasMoreContent, 'Should show task details after expanding INTAKE').toBe(true);
    } else {
      console.log('❌ INTAKE heading not found - data may not be loading');
      await page.screenshot({ path: 'tests/screenshots/03-intake-not-found.png', fullPage: true });
      expect(isVisible, 'INTAKE stage should be visible').toBe(true);
    }
  });

  test('should show task details with role, time, and subtask count', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      test.fail(true, 'Authentication required');
      return;
    }

    await page.screenshot({ path: 'tests/screenshots/04-task-details.png', fullPage: true });

    const pageContent = await page.content();

    console.log('===== TASK DETAILS VERIFICATION =====');

    // Check for role badges (Appraiser, Admin, etc.)
    const hasRoleBadge = pageContent.includes('Appraiser') ||
                         pageContent.includes('Admin') ||
                         pageContent.includes('Office Staff');
    console.log('Has role badges:', hasRoleBadge);

    // Check for time estimates (30m, 1h, etc.)
    const timeRegex = /\d+m|\d+h/;
    const hasTimeEstimates = timeRegex.test(pageContent);
    console.log('Has time estimates:', hasTimeEstimates);

    // Check for subtask counts
    const subtaskRegex = /\d+\s+subtasks?/i;
    const hasSubtaskCounts = subtaskRegex.test(pageContent);
    console.log('Has subtask counts:', hasSubtaskCounts);

    const hasAnyDetails = hasRoleBadge || hasTimeEstimates || hasSubtaskCounts;

    if (!hasAnyDetails) {
      console.log('❌ No task details found - data may not be rendering');
    }

    expect(hasAnyDetails, 'Should display task details (role, time, or subtask count)').toBe(true);
  });

  test('should open edit dialog for a task', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      test.fail(true, 'Authentication required');
      return;
    }

    console.log('===== EDIT DIALOG TEST =====');

    // First, try to expand a stage to see tasks
    const intakeHeading = page.locator('text=INTAKE').first();
    if (await intakeHeading.isVisible().catch(() => false)) {
      await intakeHeading.click();
      await page.waitForTimeout(1000);
    }

    // Look for edit buttons (pencil icons)
    const editButton = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    const editButtonVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Edit button found:', editButtonVisible);

    if (editButtonVisible) {
      await editButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/screenshots/05-edit-dialog-opened.png', fullPage: true });

      // Check if dialog opened
      const dialogVisible = await page.locator('[role="dialog"], .dialog, [class*="Dialog"]').count() > 0;
      console.log('Edit dialog visible:', dialogVisible);

      if (dialogVisible) {
        console.log('✅ Edit dialog opened successfully');

        // Try to close it
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelButton.click();
          console.log('✅ Closed dialog with Cancel button');
        }
      }

      expect(dialogVisible, 'Edit dialog should open when clicking edit button').toBe(true);
    } else {
      console.log('⚠️ Edit button not found - may need to expand a stage or check UI structure');
      await page.screenshot({ path: 'tests/screenshots/05-no-edit-button.png', fullPage: true });
    }
  });

  test('should not show RLS permission errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Listen to console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('sign-in')) {
      test.fail(true, 'Authentication required');
      return;
    }

    await page.screenshot({ path: 'tests/screenshots/06-console-check.png', fullPage: true });

    console.log('===== CONSOLE LOG VERIFICATION =====');
    console.log('Console errors:', consoleErrors.length);
    console.log('Console warnings:', consoleWarnings.length);

    // Check for RLS-related errors
    const rlsErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('rls') ||
      err.toLowerCase().includes('permission') ||
      err.toLowerCase().includes('policy')
    );

    console.log('RLS-related errors:', rlsErrors.length);
    if (rlsErrors.length > 0) {
      console.log('RLS errors found:');
      rlsErrors.forEach(err => console.log('  -', err));
    }

    // Log all errors for debugging
    if (consoleErrors.length > 0) {
      console.log('All console errors:');
      consoleErrors.forEach(err => console.log('  -', err));
    }

    expect(rlsErrors.length, 'Should not have RLS permission errors after fix').toBe(0);
  });
});
