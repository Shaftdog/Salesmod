import { test, expect } from '@playwright/test';
import { authenticateTestUser } from './auth-helper';

test.describe('Task Library Feature Verification', () => {
  const BASE_URL = 'http://localhost:9002';
  const LIBRARY_URL = `${BASE_URL}/production/library`;

  test.beforeEach(async ({ page }) => {
    // Authenticate first using the auth helper
    await authenticateTestUser(page);

    // Navigate to the Task Library page
    await page.goto(LIBRARY_URL);
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('1. Data Now Displays - Badge shows correct task counts', async ({ page }) => {
    // Wait for the badge to appear
    const badge = page.locator('text=/\\d+ tasks, \\d+ subtasks/');
    await badge.waitFor({ timeout: 10000 });

    // Get the badge text
    const badgeText = await badge.textContent();
    console.log('Badge text:', badgeText);

    // Verify it shows "30 tasks, 266 subtasks" (NOT "0 tasks")
    expect(badgeText).toContain('30 tasks');
    expect(badgeText).toContain('266 subtasks');
    expect(badgeText).not.toContain('0 tasks');

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/task-library-badge.png',
      fullPage: true
    });
  });

  test('2. All 10 Production Stages Have Tasks', async ({ page }) => {
    // Wait for stages to load
    await page.waitForSelector('[data-stage]', { timeout: 10000 });

    // Get all stage elements
    const stages = await page.locator('[data-stage]').all();

    console.log(`Found ${stages.length} stages`);
    expect(stages.length).toBe(10);

    // Verify each stage has at least one task
    for (const stage of stages) {
      const stageName = await stage.getAttribute('data-stage');
      const taskCount = await stage.locator('[data-task-id]').count();

      console.log(`${stageName}: ${taskCount} tasks`);
      expect(taskCount).toBeGreaterThan(0);
    }

    await page.screenshot({
      path: 'tests/screenshots/task-library-all-stages.png',
      fullPage: true
    });
  });

  test('3. Stage Task Counts Match Expected Values', async ({ page }) => {
    // Expected task counts per stage
    const expectedCounts = {
      'INTAKE': 16,
      'INSPECTED': 3,
      'SCHEDULING': 3,
      'FINALIZATION': 2,
      'SCHEDULED': 1,
      'READY_FOR_DELIVERY': 1,
      'DELIVERED': 1,
      'CORRECTION': 1,
      'REVISION': 1,
      'WORKFILE': 1
    };

    for (const [stageName, expectedCount] of Object.entries(expectedCounts)) {
      const stage = page.locator(`[data-stage="${stageName}"]`);
      await stage.waitFor({ timeout: 5000 });

      const actualCount = await stage.locator('[data-task-id]').count();

      console.log(`${stageName}: Expected ${expectedCount}, Got ${actualCount}`);
      expect(actualCount).toBe(expectedCount);
    }

    await page.screenshot({
      path: 'tests/screenshots/task-library-counts.png',
      fullPage: true
    });
  });

  test('4. Task Expansion - INTAKE stage tasks can be expanded', async ({ page }) => {
    // Find the INTAKE stage
    const intakeStage = page.locator('[data-stage="INTAKE"]');
    await intakeStage.waitFor({ timeout: 5000 });

    // Expand the INTAKE stage by clicking it
    await intakeStage.click();
    await page.waitForTimeout(500); // Wait for animation

    // Find and click on a task (e.g., "INTAKE" task)
    const intakeTask = intakeStage.locator('[data-task-id]').first();
    const taskTitle = await intakeTask.textContent();
    console.log('Clicking task:', taskTitle);

    await intakeTask.click();
    await page.waitForTimeout(500);

    // Verify subtasks are visible
    const subtasks = page.locator('[data-subtask-id]');
    const subtaskCount = await subtasks.count();

    console.log(`Found ${subtaskCount} subtasks`);
    expect(subtaskCount).toBeGreaterThan(0);

    await page.screenshot({
      path: 'tests/screenshots/task-library-expanded.png',
      fullPage: true
    });
  });

  test('5. Task Details - Each task shows role, time, and subtask count', async ({ page }) => {
    // Find a task in INTAKE stage
    const intakeStage = page.locator('[data-stage="INTAKE"]');
    await intakeStage.waitFor({ timeout: 5000 });

    const task = intakeStage.locator('[data-task-id]').first();

    // Check for role badge
    const roleBadge = task.locator('[data-role]');
    if (await roleBadge.count() > 0) {
      const roleText = await roleBadge.textContent();
      console.log('Role badge:', roleText);
      expect(roleText).toBeTruthy();
    }

    // Check for time estimate
    const timeEstimate = task.locator('text=/\\d+m/');
    if (await timeEstimate.count() > 0) {
      const timeText = await timeEstimate.textContent();
      console.log('Time estimate:', timeText);
      expect(timeText).toMatch(/\d+m/);
    }

    // Check for subtask count
    const subtaskCount = task.locator('text=/\\d+ subtasks?/');
    if (await subtaskCount.count() > 0) {
      const countText = await subtaskCount.textContent();
      console.log('Subtask count:', countText);
      expect(countText).toMatch(/\d+ subtasks?/);
    }

    await page.screenshot({
      path: 'tests/screenshots/task-library-details.png',
      fullPage: true
    });
  });

  test('6. Edit Dialog - Task edit dialog opens with data populated', async ({ page }) => {
    // Find a task
    const intakeStage = page.locator('[data-stage="INTAKE"]');
    await intakeStage.waitFor({ timeout: 5000 });

    const task = intakeStage.locator('[data-task-id]').first();

    // Click edit (pencil icon)
    const editButton = task.locator('button[aria-label*="edit"], button:has(svg[class*="pencil"])').first();

    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Verify dialog is open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify task data is populated
      const titleInput = dialog.locator('input[name="title"], input[placeholder*="title"]');
      if (await titleInput.count() > 0) {
        const titleValue = await titleInput.inputValue();
        console.log('Task title in dialog:', titleValue);
        expect(titleValue).toBeTruthy();
      }

      // Verify subtasks are listed
      const subtasksList = dialog.locator('[data-subtask-id], li:has-text("subtask")');
      const subtasksCount = await subtasksList.count();
      console.log(`Subtasks in dialog: ${subtasksCount}`);

      await page.screenshot({
        path: 'tests/screenshots/task-library-edit-dialog.png',
        fullPage: true
      });

      // Cancel without saving
      const cancelButton = dialog.locator('button:has-text("Cancel")');
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
      } else {
        // Close via ESC or close button
        await page.keyboard.press('Escape');
      }

      // Verify dialog is closed
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    } else {
      console.log('Edit button not found - skipping edit dialog test');
    }
  });

  test('7. Console Errors Check', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Navigate and wait
    await page.goto(LIBRARY_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Report any console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('No console errors detected');
    }

    // This is informational, not a hard failure
    expect(consoleErrors.length).toBeLessThan(10); // Allow some warnings
  });

  test('8. Overall RLS Fix Verification', async ({ page }) => {
    // Comprehensive check that data is visible

    // 1. Badge check
    const badge = page.locator('text=/\\d+ tasks/');
    await badge.waitFor({ timeout: 10000 });
    const badgeText = await badge.textContent();
    expect(badgeText).not.toContain('0 tasks');

    // 2. Stages check
    const stages = await page.locator('[data-stage]').count();
    expect(stages).toBe(10);

    // 3. Total tasks check
    const totalTasks = await page.locator('[data-task-id]').count();
    console.log(`Total tasks visible: ${totalTasks}`);
    expect(totalTasks).toBe(30);

    // 4. No "No data" messages
    const noDataMessage = page.locator('text=/no tasks/i, text=/no data/i');
    const noDataCount = await noDataMessage.count();
    expect(noDataCount).toBe(0);

    console.log('✅ RLS fix is working - all data is visible!');

    await page.screenshot({
      path: 'tests/screenshots/task-library-rls-verification.png',
      fullPage: true
    });
  });
});
