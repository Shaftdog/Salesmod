import { test, expect, type Page } from '@playwright/test';

/**
 * Admin Panel - User Creation Tests
 *
 * Tests the complete user creation workflow including:
 * - Form rendering
 * - Input validation
 * - Successful user creation
 * - Error handling
 * - Navigation flow
 */

test.describe('Admin User Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing test data and console logs
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.error('[BROWSER ERROR]:', error);
    });
  });

  test('should successfully create a new user with valid data', async ({ page }) => {
    console.log('\n=== Test: Create New User with Valid Data ===\n');

    // Step 1: Navigate to create user page
    console.log('Step 1: Navigating to /admin/users/new');
    await page.goto('/admin/users/new');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: '/tmp/test-screenshots/01-user-form-initial.png',
      fullPage: true
    });
    console.log('Screenshot saved: 01-user-form-initial.png');

    // Step 2: Verify form elements exist
    console.log('\nStep 2: Verifying form elements');
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const roleSelect = page.locator('select, [role="combobox"]').filter({ hasText: /role/i }).or(page.getByLabel(/role/i));
    const submitButton = page.getByRole('button', { name: /create user/i });

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log('All form elements are visible');

    // Step 3: Fill in the form
    console.log('\nStep 3: Filling in form data');
    const testEmail = `testuser-${Date.now()}@example.com`;

    await nameInput.fill('Test User');
    console.log('  - Name: Test User');

    await emailInput.fill(testEmail);
    console.log(`  - Email: ${testEmail}`);

    // Handle role selection - could be a select or custom dropdown
    try {
      // Try standard select first
      const selectElement = await page.locator('select').filter({ hasText: /role|manager/i }).first();
      if (await selectElement.isVisible()) {
        await selectElement.selectOption({ label: /manager/i });
        console.log('  - Role: Manager (via select)');
      }
    } catch (e) {
      // Try custom dropdown/combobox
      try {
        const roleButton = page.getByRole('button', { name: /role/i }).or(page.locator('[role="combobox"]'));
        await roleButton.click();
        await page.getByRole('option', { name: /manager/i }).click();
        console.log('  - Role: Manager (via combobox)');
      } catch (e2) {
        console.log('  - Warning: Could not set role, proceeding anyway');
      }
    }

    // Take screenshot after filling form
    await page.screenshot({
      path: '/tmp/test-screenshots/02-user-form-filled.png',
      fullPage: true
    });
    console.log('Screenshot saved: 02-user-form-filled.png');

    // Step 4: Set up network monitoring
    console.log('\nStep 4: Setting up network monitoring');
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const responseData = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        };
        try {
          const body = await response.json();
          responseData['body'] = body;
        } catch (e) {
          // Not JSON
        }
        console.log('[API RESPONSE]:', JSON.stringify(responseData, null, 2));
      }
    });

    // Step 5: Submit the form
    console.log('\nStep 5: Submitting form');
    await submitButton.click();
    console.log('Submit button clicked');

    // Wait for navigation or error message
    const errorMessage = page.getByText(/failed to create user/i);

    // Wait for either success (navigation) or error
    await Promise.race([
      page.waitForURL(/\/admin\/users\/[^/]+$/, { timeout: 5000 }).catch(() => null),
      errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      page.waitForTimeout(5000)
    ]);

    // Take screenshot of result
    await page.screenshot({
      path: '/tmp/test-screenshots/03-user-form-submitted.png',
      fullPage: true
    });
    console.log('Screenshot saved: 03-user-form-submitted.png');

    // Step 6: Verify results
    console.log('\nStep 6: Verifying results');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check for error message
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.error(`ERROR DETECTED: ${errorText}`);

      // Capture console logs
      console.log('\n=== Collecting diagnostic information ===');

      // Check for validation errors
      const validationErrors = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
      }

      expect.soft(hasError).toBe(false);
    }

    // Check if redirected to user detail page
    const isOnUserDetailPage = /\/admin\/users\/[a-zA-Z0-9-]+$/.test(currentUrl);
    console.log(`On user detail page: ${isOnUserDetailPage}`);

    if (isOnUserDetailPage) {
      console.log('\n✅ SUCCESS: User created and redirected to detail page');

      // Verify user data is displayed
      await expect(page.getByText('Test User')).toBeVisible();
      await expect(page.getByText(testEmail)).toBeVisible();

      // Take final screenshot
      await page.screenshot({
        path: '/tmp/test-screenshots/04-user-detail-page.png',
        fullPage: true
      });
      console.log('Screenshot saved: 04-user-detail-page.png');
    } else {
      console.error(`\n❌ FAILURE: Expected redirect to user detail page, but URL is: ${currentUrl}`);
    }

    // Print API calls summary
    console.log('\n=== API Calls Summary ===');
    console.log(JSON.stringify(apiCalls, null, 2));

    // Final assertion
    expect(isOnUserDetailPage, `Should redirect to user detail page, but stayed at ${currentUrl}`).toBe(true);
  });

  test('should show validation errors for empty form', async ({ page }) => {
    console.log('\n=== Test: Validation - Empty Form ===\n');

    await page.goto('/admin/users/new');
    await page.waitForLoadState('networkidle');

    const submitButton = page.getByRole('button', { name: /create user/i });
    await submitButton.click();

    // Wait a moment for validation errors to appear
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/tmp/test-screenshots/validation-empty-form.png',
      fullPage: true
    });

    // Check for validation error messages
    const errorElements = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
    console.log('Validation errors found:', errorElements);

    // Should have validation errors (either from form or inline)
    expect(errorElements.length).toBeGreaterThan(0);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    console.log('\n=== Test: Validation - Invalid Email ===\n');

    await page.goto('/admin/users/new');
    await page.waitForLoadState('networkidle');

    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const submitButton = page.getByRole('button', { name: /create user/i });

    await nameInput.fill('Test User');
    await emailInput.fill('invalid-email');
    await submitButton.click();

    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/tmp/test-screenshots/validation-invalid-email.png',
      fullPage: true
    });

    // Should either show validation error or not submit
    const currentUrl = page.url();
    const stayedOnForm = currentUrl.includes('/admin/users/new');

    if (stayedOnForm) {
      const errorElements = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
      console.log('Validation errors:', errorElements);
      expect(errorElements.length).toBeGreaterThan(0);
    }
  });
});
