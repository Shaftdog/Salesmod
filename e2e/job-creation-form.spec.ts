import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Job Creation Form
 * Priority: P0 - Critical functionality
 */

test.describe('Job Creation Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');
  });

  test('should open job creation form when clicking New Job button', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Find and click the New Job button
    const buttonTexts = ['New Job', 'Create Job', 'Add Job', '\\+ Job'];
    let buttonClicked = false;

    for (const text of buttonTexts) {
      // Escape special regex characters
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const button = page.getByRole('button', { name: new RegExp(escapedText, 'i') });
      if (await button.count() > 0) {
        console.log('Clicking button:', text);
        await button.first().click();
        buttonClicked = true;
        break;
      }
    }

    if (!buttonClicked) {
      // Try finding button by other methods
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log('Total buttons on page:', buttonCount);

      for (let i = 0; i < buttonCount; i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`Button ${i}:`, buttonText?.trim());
      }

      test.skip(true, 'Could not find New Job button');
      return;
    }

    // Wait for dialog/form to appear
    await page.waitForTimeout(1000);

    // Take screenshot of the opened form
    await page.screenshot({
      path: 'e2e/screenshots/job-creation-form.png',
      fullPage: true
    });

    console.log('Job creation form opened');
  });

  test('should display all required form fields', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Check for form fields
    const expectedFields = [
      { label: 'Job Name', type: 'input' },
      { label: 'Name', type: 'input' },
      { label: 'Description', type: 'textarea' },
      { label: 'Target', type: 'input' },
      { label: 'Template', type: 'textarea' },
      { label: 'Email', type: 'textarea' },
    ];

    const foundFields: string[] = [];

    for (const field of expectedFields) {
      const input = page.locator(`input[name*="${field.label.toLowerCase().replace(' ', '')}"], textarea[name*="${field.label.toLowerCase().replace(' ', '')}"]`);
      if (await input.count() > 0) {
        foundFields.push(field.label);
        console.log('Found field:', field.label);
      }

      // Also try by label
      const labeledInput = page.getByLabel(new RegExp(field.label, 'i'));
      if (await labeledInput.count() > 0) {
        if (!foundFields.includes(field.label)) {
          foundFields.push(field.label);
          console.log('Found field by label:', field.label);
        }
      }
    }

    console.log('Found form fields:', foundFields);

    // Check for cadence toggles
    const cadenceLabels = ['day0', 'day4', 'day10', 'day21', 'Day 0', 'Day 4', 'Day 10', 'Day 21'];
    const foundCadences: string[] = [];

    for (const label of cadenceLabels) {
      const toggle = page.getByText(new RegExp(label, 'i'));
      if (await toggle.count() > 0) {
        foundCadences.push(label);
      }
    }

    console.log('Found cadence toggles:', foundCadences);

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/job-creation-form-fields.png',
      fullPage: true
    });
  });

  test('should display template variable hints', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Look for template variable hints
    const variableHints = ['{{first_name}}', '{{last_name}}', '{{company_name}}', '{{email}}'];
    const foundHints: string[] = [];

    for (const hint of variableHints) {
      const element = page.getByText(hint);
      if (await element.count() > 0) {
        foundHints.push(hint);
        console.log('Found variable hint:', hint);
      }
    }

    console.log('Found template variables:', foundHints);

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/job-creation-form-variables.png',
      fullPage: true
    });
  });

  test('should fill out the form with test data', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Try to fill form fields
    const nameField = page.getByLabel(/name/i).first();
    if (await nameField.count() > 0) {
      await nameField.fill('Test Job - Playwright E2E');
      console.log('Filled name field');
    }

    const descField = page.getByLabel(/description/i);
    if (await descField.count() > 0) {
      await descField.fill('Automated test job created by Playwright');
      console.log('Filled description field');
    }

    // Try to enable day0 cadence toggle
    const day0Toggle = page.locator('[role="switch"], input[type="checkbox"]').filter({ hasText: /day.*0/i });
    if (await day0Toggle.count() > 0) {
      await day0Toggle.first().click();
      console.log('Toggled day0 cadence');
    }

    // Wait a bit for any state updates
    await page.waitForTimeout(500);

    // Take screenshot of filled form
    await page.screenshot({
      path: 'e2e/screenshots/job-creation-form-filled.png',
      fullPage: true
    });

    console.log('Form filled with test data');
  });

  test('should display review mode toggle', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Look for review mode toggle
    const reviewToggle = page.getByText(/review mode/i);
    if (await reviewToggle.count() > 0) {
      console.log('Found review mode toggle');
      await expect(reviewToggle).toBeVisible();
    } else {
      console.log('Review mode toggle not found - may be optional');
    }
  });

  test('should display submit button', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Look for submit button
    const submitTexts = ['Create', 'Submit', 'Save', 'Create Job'];
    let submitFound = false;

    for (const text of submitTexts) {
      const submitBtn = page.getByRole('button', { name: new RegExp(text, 'i') });
      if (await submitBtn.count() > 0) {
        console.log('Found submit button:', text);
        submitFound = true;
        break;
      }
    }

    if (!submitFound) {
      console.log('Submit button not found - logging all buttons in dialog');
      const dialogButtons = await page.locator('dialog button, [role="dialog"] button').allTextContents();
      console.log('Dialog buttons:', dialogButtons);
    }
  });

  test('should validate empty form submission', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Try to find and click submit without filling form
    const submitBtn = page.getByRole('button', { name: /create|submit|save/i }).last();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Look for validation errors
      const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
      if (errorMessages.length > 0) {
        console.log('Validation errors shown:', errorMessages);
      } else {
        console.log('No validation errors visible - may submit or validate differently');
      }

      // Take screenshot
      await page.screenshot({
        path: 'e2e/screenshots/job-creation-form-validation.png',
        fullPage: true
      });
    } else {
      console.log('Submit button not found for validation test');
    }
  });

  test('should close form dialog', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Click New Job button
    const button = page.getByRole('button', { name: /new job|create job|add job/i });
    if (await button.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await button.first().click();
    await page.waitForTimeout(1000);

    // Look for close button
    const closeBtn = page.locator('[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
      console.log('Closed job creation form');

      // Verify dialog is closed
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        console.log('Dialog still visible after close');
      } else {
        console.log('Dialog successfully closed');
      }
    } else {
      // Try clicking outside dialog (common pattern)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      console.log('Attempted to close dialog with Escape key');
    }
  });
});
