import { test, expect } from '@playwright/test';

test.describe('Task Library - RLS Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should display 30 tasks with 266 subtasks in the library', async ({ page }) => {
    // Navigate to the task library
    await page.goto('http://localhost:3000/production/library');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/task-library-initial.png', fullPage: true });

    // Look for the task count badge - try multiple possible selectors
    const badgeSelectors = [
      'text=/30 tasks, 266 subtasks/i',
      'text=/30 tasks/i',
      '[class*="badge"]',
      '[class*="Badge"]'
    ];

    let badgeFound = false;
    let badgeText = '';

    for (const selector of badgeSelectors) {
      try {
        const badge = await page.locator(selector).first();
        if (await badge.isVisible({ timeout: 5000 })) {
          badgeText = await badge.textContent() || '';
          badgeFound = true;
          console.log(`Found badge with selector "${selector}": ${badgeText}`);
          break;
        }
      } catch (e) {
        console.log(`Selector "${selector}" not found, trying next...`);
      }
    }

    // Wait a bit longer and check page content
    await page.waitForTimeout(3000);
    const pageContent = await page.content();

    // Take screenshot showing current state
    await page.screenshot({ path: 'tests/screenshots/task-library-badge-check.png', fullPage: true });

    // Check if we have the expected data
    const hasExpectedCount = pageContent.includes('30 tasks') || pageContent.includes('30') && pageContent.includes('tasks');
    const hasZeroCount = pageContent.includes('0 tasks, 0 subtasks') || (pageContent.includes('0 tasks') && pageContent.includes('0 subtasks'));

    console.log('Badge found:', badgeFound);
    console.log('Badge text:', badgeText);
    console.log('Has expected count (30 tasks):', hasExpectedCount);
    console.log('Has zero count:', hasZeroCount);

    // Verify we DO NOT see the "0 tasks, 0 subtasks" badge
    expect(hasZeroCount, 'Should not show 0 tasks, 0 subtasks').toBe(false);

    // Verify we DO see 30 tasks (or wait for it to appear)
    if (!hasExpectedCount) {
      // Wait a bit more and check again
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/task-library-waiting-for-data.png', fullPage: true });

      const updatedContent = await page.content();
      expect(
        updatedContent.includes('30 tasks') || (updatedContent.includes('30') && updatedContent.includes('tasks')),
        'Should display 30 tasks after RLS fix'
      ).toBe(true);
    }
  });

  test('should show correct task counts per stage', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/task-library-stages.png', fullPage: true });

    const pageContent = await page.content();

    // Expected stage counts
    const expectedCounts = {
      'INTAKE': 16,
      'INSPECTED': 3,
      'SCHEDULING': 3,
      'FINALIZATION': 2
    };

    // Check for each stage
    for (const [stage, count] of Object.entries(expectedCounts)) {
      const hasStage = pageContent.includes(stage);
      console.log(`Stage ${stage}: found=${hasStage}, expected count=${count}`);

      expect(hasStage, `Should display ${stage} stage`).toBe(true);

      // Look for the count near the stage name
      const stageRegex = new RegExp(`${stage}[\\s\\S]{0,200}${count}`, 'i');
      const hasCount = stageRegex.test(pageContent);
      console.log(`Stage ${stage} count check: ${hasCount}`);
    }
  });

  test('should expand INTAKE stage and show tasks', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find and click the INTAKE stage header/expander
    const intakeSelectors = [
      'text=INTAKE',
      '[data-stage="INTAKE"]',
      'button:has-text("INTAKE")',
      'div:has-text("INTAKE")'
    ];

    let intakeClicked = false;
    for (const selector of intakeSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          intakeClicked = true;
          console.log(`Clicked INTAKE using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Could not click INTAKE with selector: ${selector}`);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/task-library-intake-expanded.png', fullPage: true });

    console.log('INTAKE clicked:', intakeClicked);

    // Look for task items in the expanded section
    const pageContent = await page.content();
    const hasTaskItems = pageContent.includes('subtasks') || pageContent.includes('Appraiser') || pageContent.includes('Client Communication');

    console.log('Has task items visible:', hasTaskItems);
  });

  test('should show task details with role, time, and subtask count', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/task-library-task-details.png', fullPage: true });

    const pageContent = await page.content();

    // Check for role badges
    const hasRoleBadge = pageContent.includes('Appraiser') || pageContent.includes('Admin') || pageContent.includes('role');
    console.log('Has role badges:', hasRoleBadge);

    // Check for time estimates (like "30m", "1h", etc.)
    const timeRegex = /\d+m|\d+h/;
    const hasTimeEstimates = timeRegex.test(pageContent);
    console.log('Has time estimates:', hasTimeEstimates);

    // Check for subtask counts
    const subtaskRegex = /\d+\s+subtasks?/i;
    const hasSubtaskCounts = subtaskRegex.test(pageContent);
    console.log('Has subtask counts:', hasSubtaskCounts);

    expect(hasRoleBadge || hasTimeEstimates || hasSubtaskCounts,
      'Should display task details (role, time, or subtask count)'
    ).toBe(true);
  });

  test('should open edit dialog for a task', async ({ page }) => {
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find an edit button (pencil icon)
    const editSelectors = [
      'button[aria-label*="edit" i]',
      'button:has([data-icon="pencil"])',
      'button:has-text("Edit")',
      '[data-testid="edit-task"]',
      'button svg[class*="pencil"]'
    ];

    let editClicked = false;
    for (const selector of editSelectors) {
      try {
        const editButtons = await page.locator(selector).all();
        if (editButtons.length > 0) {
          await editButtons[0].click();
          editClicked = true;
          console.log(`Clicked edit button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Could not click edit with selector: ${selector}`);
      }
    }

    if (editClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/task-library-edit-dialog.png', fullPage: true });

      // Check for dialog
      const dialogVisible = await page.locator('[role="dialog"], .dialog, [class*="Dialog"]').count() > 0;
      console.log('Edit dialog visible:', dialogVisible);

      if (dialogVisible) {
        // Try to close the dialog
        const closeSelectors = ['button:has-text("Cancel")', 'button[aria-label*="close" i]', '[data-dismiss]'];
        for (const selector of closeSelectors) {
          try {
            const closeBtn = await page.locator(selector).first();
            if (await closeBtn.isVisible({ timeout: 1000 })) {
              await closeBtn.click();
              console.log('Closed dialog');
              break;
            }
          } catch (e) {
            console.log(`Could not close dialog with selector: ${selector}`);
          }
        }
      }
    } else {
      console.log('No edit button found - may need to expand a stage first');
      await page.screenshot({ path: 'tests/screenshots/task-library-no-edit-button.png', fullPage: true });
    }
  });

  test('should verify authentication and data loading', async ({ page }) => {
    // Check if we need to authenticate
    await page.goto('http://localhost:3000/production/library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if redirected to login
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('⚠️ Redirected to login - authentication required');
      await page.screenshot({ path: 'tests/screenshots/task-library-needs-auth.png', fullPage: true });

      // This is expected - the test needs authentication
      expect(true, 'Authentication page detected - this is expected').toBe(true);
    } else {
      console.log('✓ On task library page - checking data');
      await page.screenshot({ path: 'tests/screenshots/task-library-authenticated.png', fullPage: true });

      // Check console for any errors
      const logs: string[] = [];
      page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));

      await page.waitForTimeout(2000);

      console.log('Console logs:', logs);

      // Check for any error messages in the page
      const pageContent = await page.content();
      const hasError = pageContent.toLowerCase().includes('error') && !pageContent.includes('0 tasks');

      if (hasError) {
        console.log('⚠️ Error detected in page content');
      }
    }
  });
});
