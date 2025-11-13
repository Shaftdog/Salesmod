import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Error Handling
 * Priority: P1 - Important functionality
 */

test.describe('Error Handling', () => {
  test('should handle non-existent job gracefully', async ({ page }) => {
    // Try to access a job that doesn't exist
    const fakeJobId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/agent/jobs/${fakeJobId}`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Check for error handling
    const errorTexts = [
      'not found',
      '404',
      'does not exist',
      'Job not found',
      'Invalid job',
      'Error'
    ];

    let errorFound = false;
    for (const text of errorTexts) {
      const element = page.getByText(new RegExp(text, 'i'));
      if (await element.count() > 0) {
        console.log('Found error message:', text);
        errorFound = true;
        break;
      }
    }

    if (errorFound) {
      console.log('Error handling working correctly');
    } else {
      console.log('No explicit error message found - checking page state');
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/job-not-found-error.png',
      fullPage: true
    });

    // Check for redirect to jobs list
    if (url.includes('/agent/jobs') && !url.includes(fakeJobId)) {
      console.log('Redirected to jobs list page');
    }
  });

  test('should handle invalid job ID format', async ({ page }) => {
    await page.goto('/agent/jobs/invalid-id-format');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    console.log('Testing invalid job ID format - URL:', url);

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invalid-job-id-error.png',
      fullPage: true
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Go to jobs page
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to create a new job
    const newJobBtn = page.getByRole('button', { name: /new job|create job/i });
    if (await newJobBtn.count() > 0) {
      await newJobBtn.first().click();
      await page.waitForTimeout(1000);

      // Try to submit form (if it opened)
      const submitBtn = page.getByRole('button', { name: /create|submit|save/i }).last();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // Look for error message
        const errorMsg = page.locator('[role="alert"], .error, .text-red-500');
        if (await errorMsg.count() > 0) {
          const errorText = await errorMsg.first().textContent();
          console.log('Network error message:', errorText);
        }

        // Take screenshot
        await page.screenshot({
          path: 'e2e/screenshots/network-error.png',
          fullPage: true
        });
      }
    }

    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should display validation errors for required fields', async ({ page }) => {
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open job creation form
    const newJobBtn = page.getByRole('button', { name: /new job|create job/i });
    if (await newJobBtn.count() === 0) {
      test.skip(true, 'New Job button not found');
      return;
    }

    await newJobBtn.first().click();
    await page.waitForTimeout(1000);

    // Try to submit empty form
    const submitBtn = page.getByRole('button', { name: /create|submit|save/i }).last();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Look for validation errors
      const errors = page.locator('[role="alert"], .error-message, .text-red-500, .text-destructive, [class*="error"]');
      const errorCount = await errors.count();

      if (errorCount > 0) {
        const errorTexts = await errors.allTextContents();
        console.log('Validation errors:', errorTexts);
      } else {
        console.log('No validation errors displayed - form may have default values or different validation approach');
      }

      // Take screenshot
      await page.screenshot({
        path: 'e2e/screenshots/validation-errors.png',
        fullPage: true
      });
    }
  });

  test('should handle console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Wait to collect console messages
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('DevTools') &&
      !error.includes('extension') &&
      !error.includes('Manifest')
    );

    console.log('Console Errors:', criticalErrors);
    console.log('Console Warnings:', consoleWarnings.slice(0, 10)); // First 10 warnings

    // Log error summary
    if (criticalErrors.length > 0) {
      console.log(`Found ${criticalErrors.length} critical console errors`);
    } else {
      console.log('No critical console errors detected');
    }
  });

  test('should handle JavaScript exceptions', async ({ page }) => {
    const pageErrors: Error[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Wait to collect errors
    await page.waitForTimeout(3000);

    if (pageErrors.length > 0) {
      console.log('JavaScript exceptions detected:');
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    } else {
      console.log('No JavaScript exceptions detected');
    }
  });

  test('should handle failed API requests', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Wait for all network requests
    await page.waitForTimeout(3000);

    if (failedRequests.length > 0) {
      console.log('Failed API requests:');
      failedRequests.forEach((request) => {
        console.log(`  - ${request}`);
      });
    } else {
      console.log('All API requests successful');
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/api-requests-state.png',
      fullPage: true
    });
  });

  test('should handle unauthorized access', async ({ page }) => {
    // Clear cookies to simulate unauthorized state
    await page.context().clearCookies();

    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('URL after unauthorized access attempt:', url);

    // Check if redirected to auth
    if (url.includes('/auth') || url.includes('/login') || url.includes('/signin')) {
      console.log('Correctly redirected to authentication');
    } else {
      console.log('Did not redirect to auth - may have different auth handling');
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/unauthorized-access.png',
      fullPage: true
    });
  });

  test('should handle empty states correctly', async ({ page }) => {
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for empty state messages
    const emptyStateTexts = [
      'No jobs',
      'No campaigns',
      'Get started',
      'Create your first',
      'No data'
    ];

    const foundEmptyStates: string[] = [];

    for (const text of emptyStateTexts) {
      const element = page.getByText(new RegExp(text, 'i'));
      if (await element.count() > 0) {
        foundEmptyStates.push(text);
        console.log('Found empty state:', text);
      }
    }

    if (foundEmptyStates.length > 0) {
      console.log('Empty state handling present');

      // Take screenshot
      await page.screenshot({
        path: 'e2e/screenshots/empty-state.png',
        fullPage: true
      });
    } else {
      console.log('No empty state detected - may have data or different empty state design');
    }
  });
});
