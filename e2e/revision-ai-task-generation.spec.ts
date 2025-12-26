import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('AI Task Generation for Revisions', () => {
  const screenshotDir = path.join(__dirname, 'screenshots', 'revision-ai-tasks', new Date().toISOString().replace(/:/g, '-'));

  test.beforeAll(() => {
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('should generate multiple tasks from AI when creating a revision', async ({ page }) => {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    // Step 2: Login with credentials
    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.screenshot({ path: path.join(screenshotDir, '02-credentials-entered.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for redirect
    await page.screenshot({ path: path.join(screenshotDir, '03-logged-in.png'), fullPage: true });

    // Step 3: Navigate to Cases page
    console.log('Step 3: Navigating to Cases page...');
    await page.goto('http://localhost:9002/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '04-cases-page.png'), fullPage: true });

    // Step 4: Find a case with an order linked and locate Create Revision button
    console.log('Step 4: Looking for a case with an order and Create Revision button...');

    // Wait for cases to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-cases-list.png'), fullPage: true });

    // Step 5: Look for "Create Revision" button on the cases page
    console.log('Step 5: Looking for Create Revision button...');

    const createRevisionButton = await page.locator('button:has-text("Create Revision")').first();

    await expect(createRevisionButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, '06-revision-button-found.png'), fullPage: true });

    // Step 6: Click "Create Revision" to open dialog
    console.log('Step 6: Clicking Create Revision button...');
    await createRevisionButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '07-revision-dialog-opened.png'), fullPage: true });

    // Step 7: Enter revision description with multiple issues
    console.log('Step 7: Entering revision description...');
    const revisionDescription = "The comparable at 123 Main Street has incorrect square footage. Also, the subject property's lot size is wrong. Additionally, the market conditions adjustment needs to be updated.";

    const descriptionInput = await page.locator('textarea[name="description"], textarea[placeholder*="description"], textarea').first();
    await descriptionInput.fill(revisionDescription);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '08-description-entered.png'), fullPage: true });

    // Step 8: Click "Generate Tasks with AI" button
    console.log('Step 8: Clicking Generate Tasks with AI button...');
    const generateAIButton = await page.locator('button:has-text("Generate Tasks with AI"), button:has-text("Generate with AI"), button:has-text("AI Generate"), [data-testid="generate-ai-tasks"]').first();

    await expect(generateAIButton).toBeVisible({ timeout: 5000 });
    await generateAIButton.click();

    // Wait for AI generation (this might take a few seconds)
    console.log('Waiting for AI to generate tasks...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotDir, '09-ai-generating.png'), fullPage: true });

    // Step 9: Verify AI generated multiple separate tasks
    console.log('Step 9: Verifying AI generated tasks...');

    // Wait for AI-Generated Tasks section to appear
    await page.waitForSelector('text=AI-Generated Tasks', { timeout: 10000 });

    // Look for all checkboxes in the dialog
    const taskCheckboxes = await page.locator('input[type="checkbox"]').all();
    console.log(`Found ${taskCheckboxes.length} task checkboxes`);

    expect(taskCheckboxes.length).toBeGreaterThanOrEqual(2); // Should have multiple tasks (at least 2)

    await page.screenshot({ path: path.join(screenshotDir, '10-ai-tasks-generated.png'), fullPage: true });

    // Step 10: Verify tasks have details and are selected
    console.log('Step 10: Verifying task details...');

    // Verify tasks have titles and descriptions
    const taskTitles = await page.locator('[role="dialog"] h3, [role="dialog"] .font-medium').allTextContents();
    console.log(`Task titles found: ${taskTitles.length}`);
    expect(taskTitles.length).toBeGreaterThanOrEqual(2);

    // Verify checkboxes are checked by default (all tasks selected)
    const checkedCount = (await Promise.all(
      taskCheckboxes.map(cb => cb.isChecked())
    )).filter(Boolean).length;
    console.log(`${checkedCount} tasks are selected`);
    expect(checkedCount).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: path.join(screenshotDir, '10-task-details-verified.png'), fullPage: true });

    // Step 11: Submit the revision with selected tasks
    console.log('Step 11: Submitting revision...');

    // Scroll the dialog to make sure submit button is visible
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        dialog.scrollTop = dialog.scrollHeight;
      }
    });
    await page.waitForTimeout(500);

    const submitButton = await page.locator('button:has-text("Create Revision")').last();
    await submitButton.click({ force: true });

    // Wait for submission to complete
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '12-revision-submitted.png'), fullPage: true });

    // Step 12: Navigate to Production Board and verify tasks
    console.log('Step 12: Navigating to Production Board...');
    await page.goto('http://localhost:9002/production/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '13-production-board.png'), fullPage: true });

    // Look for REVISION column
    console.log('Looking for REVISION column...');
    const revisionColumn = await page.locator('[data-column="REVISION"], [data-stage="REVISION"], :has-text("REVISION")').first();

    await expect(revisionColumn).toBeVisible({ timeout: 5000 });

    // Look for tasks in the revision column
    const revisionTasks = await page.locator('[data-column="REVISION"] .task-card, [data-stage="REVISION"] .card, [data-column="REVISION"] [draggable="true"]').all();
    console.log(`Found ${revisionTasks.length} tasks in REVISION column`);

    expect(revisionTasks.length).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(screenshotDir, '14-revision-tasks-on-board.png'), fullPage: true });

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
  });
});
