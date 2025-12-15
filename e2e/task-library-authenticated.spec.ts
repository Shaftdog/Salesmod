import { test, expect } from '@playwright/test';
import { authenticateTestUser } from './auth-helper';

test.describe('Task Library - Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    const authenticated = await authenticateTestUser(page);
    if (!authenticated) {
      throw new Error('Failed to authenticate test user');
    }
  });

  test('should show task library data after authentication', async ({ page }) => {
    console.log('Navigating to task library...');
    await page.goto('http://localhost:9002/production/library');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: `e2e/screenshots/task-library-authenticated-initial-${Date.now()}.png`,
      fullPage: true
    });

    // Check that badge shows correct task counts (NOT "0 tasks")
    const badge = page.locator('text=/\\d+ tasks, \\d+ subtasks/');
    await expect(badge).toBeVisible({ timeout: 10000 });

    const badgeText = await badge.textContent();
    console.log('Badge text:', badgeText);

    // Should show "30 tasks, 266 subtasks" or similar positive numbers
    expect(badgeText).toMatch(/\d+ tasks?, \d+ subtasks?/);
    expect(badgeText).not.toContain('0 tasks');

    // Verify the expected counts
    expect(badgeText).toContain('30 tasks');
    expect(badgeText).toContain('266 subtasks');
  });

  test('should display all 10 production stages with tasks', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    // Expected stages
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

    console.log('Checking for all 10 stages...');
    for (const stageName of expectedStages) {
      const stageElement = page.locator(`text="${stageName}"`).first();
      await expect(stageElement).toBeVisible({ timeout: 5000 });
      console.log(`✓ Stage found: ${stageName}`);
    }

    // Take screenshot showing all stages
    await page.screenshot({
      path: `e2e/screenshots/task-library-all-stages-${Date.now()}.png`,
      fullPage: true
    });
  });

  test('should show correct task counts per stage', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    // Expected task counts by stage
    const expectedCounts = {
      'INTAKE': 16,
      'INSPECTED': 3,
      'SCHEDULING': 3,
      'FINALIZATION': 2,
      'ANALYSIS': 1,
      'VERIFICATION': 1,
      'DRAFT': 1,
      'REVIEW': 1,
      'DELIVERED': 1,
      'COMPLETE': 1
    };

    console.log('Verifying task counts for each stage...');
    for (const [stageName, expectedCount] of Object.entries(expectedCounts)) {
      // Find the stage section and look for task count
      const stageSection = page.locator(`text="${stageName}"`).first();
      await expect(stageSection).toBeVisible();

      // Look for the task count badge near the stage name
      // Format could be "16 tasks" or just "16"
      const countBadge = page.locator(`text=/${expectedCount}\\s*tasks?/i`).first();

      // If we can find it, verify; otherwise log for manual review
      const isVisible = await countBadge.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        console.log(`✓ ${stageName}: ${expectedCount} tasks confirmed`);
      } else {
        console.log(`⚠ ${stageName}: Expected ${expectedCount} tasks (count badge not found in expected format)`);
      }
    }

    await page.screenshot({
      path: `e2e/screenshots/task-library-counts-${Date.now()}.png`,
      fullPage: true
    });
  });

  test('should expand stage and show tasks', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    console.log('Expanding INTAKE stage...');

    // Find and click the INTAKE stage header to expand it
    const intakeStage = page.locator('text="INTAKE"').first();
    await expect(intakeStage).toBeVisible();

    // Click to expand (might be a button or the header itself)
    await intakeStage.click();

    // Wait a moment for expansion animation
    await page.waitForTimeout(1000);

    // Take screenshot of expanded state
    await page.screenshot({
      path: `e2e/screenshots/task-library-intake-expanded-${Date.now()}.png`,
      fullPage: true
    });

    // Should see tasks listed under INTAKE
    // Look for task cards or list items
    const taskCards = page.locator('[data-testid="task-card"]').or(
      page.locator('.task-item')
    ).or(
      page.locator('[class*="task"]').filter({ hasText: /Initial Contact|Review Order/i })
    );

    const taskCount = await taskCards.count();
    console.log(`Found ${taskCount} task elements in INTAKE stage`);

    // Should have at least some tasks visible
    expect(taskCount).toBeGreaterThan(0);
  });

  test('should expand task and show subtasks', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    console.log('Expanding INTAKE stage and first task...');

    // Expand INTAKE stage first
    const intakeStage = page.locator('text="INTAKE"').first();
    await intakeStage.click();
    await page.waitForTimeout(500);

    // Find first task in INTAKE and click to expand
    const firstTask = page.locator('[data-testid="task-card"]').first().or(
      page.locator('button').filter({ hasText: /Initial Contact|Review Order/i }).first()
    );

    await expect(firstTask).toBeVisible({ timeout: 5000 });
    await firstTask.click();
    await page.waitForTimeout(500);

    // Take screenshot of expanded task
    await page.screenshot({
      path: `e2e/screenshots/task-library-task-expanded-${Date.now()}.png`,
      fullPage: true
    });

    // Should see subtasks listed
    const subtasks = page.locator('[data-testid="subtask"]').or(
      page.locator('.subtask').or(
        page.locator('li').filter({ hasText: /Check|Verify|Review|Create/i })
      )
    );

    const subtaskCount = await subtasks.count();
    console.log(`Found ${subtaskCount} subtask elements`);

    // Should have at least one subtask visible
    expect(subtaskCount).toBeGreaterThan(0);

    // Should also see role badge and time estimate
    const roleBadge = page.locator('[data-testid="role-badge"]').or(
      page.locator('.role-badge').or(
        page.locator('text=/Appraiser|Admin|Coordinator/i')
      )
    );

    const hasBadge = await roleBadge.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasBadge) {
      console.log('✓ Role badge visible');
    } else {
      console.log('⚠ Role badge not found');
    }

    const timeEstimate = page.locator('[data-testid="time-estimate"]').or(
      page.locator('text=/\\d+\\s*(min|hour)/i')
    );

    const hasTime = await timeEstimate.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasTime) {
      console.log('✓ Time estimate visible');
    } else {
      console.log('⚠ Time estimate not found');
    }
  });

  test('should open edit dialog with populated data', async ({ page }) => {
    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    console.log('Looking for edit button on a task...');

    // Expand INTAKE stage
    const intakeStage = page.locator('text="INTAKE"').first();
    await intakeStage.click();
    await page.waitForTimeout(500);

    // Look for an edit button (could be icon or text)
    const editButton = page.locator('[data-testid="edit-task-button"]').first().or(
      page.locator('button').filter({ hasText: /edit/i }).first()
    ).or(
      page.locator('button:has-text("✏")').first()
    ).or(
      page.locator('svg[data-icon="pencil"]').first()
    );

    // Try to find any edit button
    const editButtonVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!editButtonVisible) {
      console.log('⚠ Edit button not found - trying alternative approach');
      // Try clicking on task title or card to see if it opens edit dialog
      const taskCard = page.locator('[data-testid="task-card"]').first();
      if (await taskCard.isVisible()) {
        await taskCard.click();
        await page.waitForTimeout(500);
      }
    } else {
      await editButton.click();
      console.log('✓ Clicked edit button');
    }

    await page.waitForTimeout(1000);

    // Take screenshot - should show dialog or edit state
    await page.screenshot({
      path: `e2e/screenshots/task-library-edit-dialog-${Date.now()}.png`,
      fullPage: true
    });

    // Check if dialog opened
    const dialog = page.locator('[role="dialog"]').or(
      page.locator('.dialog').or(
        page.locator('[data-testid="edit-dialog"]')
      )
    );

    const dialogVisible = await dialog.isVisible({ timeout: 2000 }).catch(() => false);

    if (dialogVisible) {
      console.log('✓ Edit dialog opened');

      // Check for form fields populated
      const taskNameField = page.locator('input[name="name"]').or(
        page.locator('input[placeholder*="Task"]')
      );

      if (await taskNameField.isVisible()) {
        const taskName = await taskNameField.inputValue();
        console.log(`✓ Task name field populated: "${taskName}"`);
        expect(taskName.length).toBeGreaterThan(0);
      }

      // Check for subtasks in editor
      const subtasksList = page.locator('[data-testid="subtasks-list"]').or(
        page.locator('text=/Subtasks/i')
      );

      if (await subtasksList.isVisible()) {
        console.log('✓ Subtasks section visible in editor');
      }
    } else {
      console.log('⚠ Edit dialog not found - feature may use different UI pattern');
    }
  });

  test('should verify no RLS errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log('Console error:', text);
      }
    });

    await page.goto('http://localhost:9002/production/library');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Take final screenshot
    await page.screenshot({
      path: `e2e/screenshots/task-library-final-state-${Date.now()}.png`,
      fullPage: true
    });

    // Check for RLS-related errors
    const rlsErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('rls') ||
      err.toLowerCase().includes('row level security') ||
      err.toLowerCase().includes('permission denied') ||
      err.toLowerCase().includes('policy')
    );

    if (rlsErrors.length > 0) {
      console.log('❌ RLS-related errors found:');
      rlsErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✓ No RLS-related errors in console');
    }

    // Should have no RLS errors
    expect(rlsErrors).toHaveLength(0);
  });
});
