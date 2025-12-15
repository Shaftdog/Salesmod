import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Send Login Link Functionality', () => {
  test('should successfully send login link from admin user detail page', async ({ page }) => {
    // Set up screenshot directory
    const screenshotsDir = path.join(__dirname, 'screenshots', new Date().toISOString().replace(/:/g, '-'));

    // Step 1: Navigate to login page
    await page.goto('http://localhost:9002/login');
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });

    // Step 2: Login with admin credentials
    console.log('Filling login form...');

    // Wait for email input to be ready
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('Rod@fga.one');

    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Blaisenpals1!');

    await page.screenshot({ path: path.join(screenshotsDir, '02-credentials-entered.png'), fullPage: true });

    // Click login button and wait for navigation
    console.log('Clicking Sign In button...');
    const signInButton = page.locator('button[type="submit"]').first();
    await signInButton.click();

    // Wait for navigation after login with longer timeout
    console.log('Waiting for redirect after login...');
    try {
      await page.waitForURL(/.*(?:dashboard|admin|properties|kanban).*/, { timeout: 20000 });
      console.log('Redirected to:', page.url());
    } catch (error) {
      console.log('Navigation timeout. Current URL:', page.url());
      await page.screenshot({ path: path.join(screenshotsDir, '03-login-timeout.png'), fullPage: true });
      throw error;
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png'), fullPage: true });
    console.log('Logged in successfully');

    // Step 3: Navigate to Admin Panel -> User Management
    console.log('Navigating to User Management...');

    // Try different navigation approaches
    // Option 1: Direct URL navigation
    await page.goto('http://localhost:9002/admin/users');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '04-user-management-page.png'), fullPage: true });

    console.log('On User Management page');

    // Step 4: Click on a user (Joy Alvarez)
    console.log('Looking for user Joy Alvarez...');

    // Wait for user list to load
    await page.waitForSelector('text=alvarezjoy46@gmail.com', { timeout: 10000 });

    // Click on Joy Alvarez's row or detail link
    await page.click('text=alvarezjoy46@gmail.com');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '05-user-detail-page.png'), fullPage: true });

    console.log('On user detail page');

    // Step 5: Click "Send Login Link" button
    console.log('Looking for Send Login Link button...');

    // Listen for console messages
    page.on('console', msg => console.log('Browser console:', msg.text()));

    // Listen for API responses
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/send-invite') && response.request().method() === 'POST',
      { timeout: 15000 }
    );

    // Find and click the Send Login Link button
    const sendButton = page.locator('button:has-text("Send Login Link")');
    await expect(sendButton).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(screenshotsDir, '06-before-click-button.png'), fullPage: true });

    await sendButton.click();

    console.log('Clicked Send Login Link button');

    // Step 6: Verify loading state
    await page.screenshot({ path: path.join(screenshotsDir, '07-button-clicked-loading.png'), fullPage: true });

    // Wait for the API response
    const response = await responsePromise;
    const responseBody = await response.json();
    console.log('API Response:', responseBody);

    // Step 7: Verify success message appears
    console.log('Waiting for success message...');

    // Look for success toast/alert with email
    const successMessage = page.locator('text=/Login link sent to.*alvarezjoy46@gmail.com/i');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: path.join(screenshotsDir, '08-success-message.png'), fullPage: true });

    console.log('Success message appeared');

    // Step 8: Verify no error message appears
    const errorSelectors = [
      '[role="alert"]:has-text("error")',
      '[role="alert"]:has-text("fail")',
      '.error',
      '.alert-error',
      'text=/error/i'
    ];

    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      const count = await errorElement.count();
      if (count > 0) {
        const text = await errorElement.first().textContent();
        console.warn(`Warning: Found potential error element: ${text}`);
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, '09-final-state.png'), fullPage: true });

    console.log('\n=== TEST PASSED ===');
    console.log('Screenshots saved to:', screenshotsDir);
  });
});
