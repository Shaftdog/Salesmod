import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Send Login Link - Debug Version', () => {
  test('debug login and send login link flow', async ({ page }) => {
    const screenshotsDir = path.join(__dirname, 'screenshots', new Date().toISOString().replace(/:/g, '-'));
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      console.log('Browser console:', text);
      consoleMessages.push(text);
    });

    // Capture network errors
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      const error = `Failed: ${request.url()} - ${request.failure()?.errorText}`;
      console.log('Network error:', error);
      networkErrors.push(error);
    });

    // Capture responses
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        console.log(`Response ${response.status()}: ${response.url()}`);
      }
    });

    console.log('\n=== Step 1: Navigate to login page ===');
    await page.goto('http://localhost:9002/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });

    console.log('\n=== Step 2: Fill login form ===');
    await page.locator('#email').fill('rod@myroihome.com');
    await page.locator('#password').fill('test-password');
    await page.screenshot({ path: path.join(screenshotsDir, '02-credentials-filled.png'), fullPage: true });

    console.log('\n=== Step 3: Submit login ===');
    // Wait for navigation or error
    const submitPromise = page.locator('button[type="submit"]').click();

    // Race between navigation and staying on page
    await Promise.race([
      page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
      page.waitForTimeout(15000)
    ]);

    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login-attempt.png'), fullPage: true });

    if (currentUrl.includes('/login')) {
      // Still on login page - check for errors
      console.log('ERROR: Still on login page!');
      console.log('Console messages:', consoleMessages);
      console.log('Network errors:', networkErrors);

      // Check for toast/error messages
      const alerts = await page.locator('[role="alert"]').all();
      for (const alert of alerts) {
        const text = await alert.textContent();
        console.log('Alert found:', text);
      }

      throw new Error('Login failed - still on login page');
    }

    console.log('\n=== Step 4: Navigate to admin users ===');
    await page.goto('http://localhost:9002/admin/users', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '04-admin-users.png'), fullPage: true });

    console.log('\n=== Step 5: Find and click user ===');
    // Look for Joy Alvarez
    const userEmail = 'alvarezjoy46@gmail.com';

    // Find the row containing this email and click its View button
    const userRow = page.locator('tr', { has: page.locator(`text=${userEmail}`) });
    const viewLink = userRow.locator('a:has-text("View")').first();

    const rowExists = await userRow.count() > 0;
    console.log(`User ${userEmail} row found:`, rowExists);

    if (!rowExists) {
      console.log('User not found, looking for any user...');
      // Click the first View link
      const firstViewLink = page.locator('a:has-text("View")').first();
      await firstViewLink.click();
    } else {
      console.log('Clicking View link for Joy Alvarez...');
      await viewLink.click();
    }

    // Wait for navigation to user detail page
    console.log('Waiting for navigation to user detail page...');
    await page.waitForURL(/\/admin\/users\/[^\/]+$/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('Navigated to:', page.url());

    // Wait for the page content to fully load (user detail specific content)
    await page.waitForSelector('text=User Information, text=Account Information, text=User Actions', { timeout: 10000 }).catch(() => {
      console.log('Could not find user detail page markers, waiting for any content...');
    });

    // Give React time to fully render
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotsDir, '05-user-detail.png'), fullPage: true });

    console.log('\n=== Step 6: Find Send Login Link button ===');
    const sendButton = page.locator('button:has-text("Send Login Link")');
    const buttonVisible = await sendButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonVisible) {
      console.log('ERROR: Send Login Link button not found!');
      console.log('Page content:');
      console.log(await page.content());
      throw new Error('Send Login Link button not visible');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '06-before-click.png'), fullPage: true });

    console.log('\n=== Step 7: Click Send Login Link ===');
    // Set up API response listener
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/send-invite'),
      { timeout: 15000 }
    ).catch(() => null);

    await sendButton.click();
    await page.screenshot({ path: path.join(screenshotsDir, '07-button-clicked.png'), fullPage: true });

    // Wait a bit for the response and UI update
    await page.waitForTimeout(2000);

    const response = await responsePromise;
    if (response) {
      console.log('API Response status:', response.status());
      try {
        const body = await response.json();
        console.log('API Response body:', body);
      } catch (e) {
        console.log('Could not parse response body');
      }
    } else {
      console.log('No API response captured (might have timed out)');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '08-after-response.png'), fullPage: true });

    console.log('\n=== Step 8: Check for success/error messages ===');
    // Look for any alerts/toasts
    const alerts = await page.locator('[role="alert"], [role="status"], .toast, .alert').all();
    console.log(`Found ${alerts.length} alert/toast elements`);

    for (let i = 0; i < alerts.length; i++) {
      const text = await alerts[i].textContent();
      const isVisible = await alerts[i].isVisible();
      console.log(`Alert ${i + 1}: ${text} (visible: ${isVisible})`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '09-final-state.png'), fullPage: true });

    // Write summary
    const summary = {
      loginSuccessful: !currentUrl.includes('/login'),
      currentUrl,
      consoleMessages,
      networkErrors,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(screenshotsDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots directory:', screenshotsDir);
  });
});
