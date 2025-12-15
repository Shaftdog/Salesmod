/**
 * Manual RBAC Debugging Test
 * Step-by-step verification with screenshots at each stage
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('RBAC Manual Debug', () => {
  test('Step-by-step RBAC verification', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('\n=== STEP 1: Clear cookies and visit /sales unauthenticated ===');
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/sales`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const url1 = page.url();
    console.log(`Current URL: ${url1}`);
    console.log(`Contains /login: ${url1.includes('/login')}`);
    console.log(`Contains /sales: ${url1.includes('/sales')}`);

    await page.screenshot({ path: 'tests/screenshots/rbac-debug/01-sales-unauthenticated.png', fullPage: true });

    console.log('\n=== STEP 2: Visit /unauthorized directly ===');
    await page.goto(`${BASE_URL}/unauthorized`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const url2 = page.url();
    console.log(`Current URL: ${url2}`);

    await page.screenshot({ path: 'tests/screenshots/rbac-debug/02-unauthorized-page.png', fullPage: true });

    console.log('\n=== STEP 3: Visit /admin unauthenticated ===');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const url3 = page.url();
    console.log(`Current URL: ${url3}`);
    console.log(`Contains /login: ${url3.includes('/login')}`);

    await page.screenshot({ path: 'tests/screenshots/rbac-debug/03-admin-unauthenticated.png', fullPage: true });

    console.log('\n=== STEP 4: Login ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/screenshots/rbac-debug/04-login-page.png', fullPage: true });

    // Try to find and fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const emailVisible = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Email input visible: ${emailVisible}`);

    if (emailVisible) {
      await emailInput.fill('rod@myroihome.com');
      await passwordInput.fill('SalesmodPassword2024!');

      await page.screenshot({ path: 'tests/screenshots/rbac-debug/05-login-filled.png', fullPage: true });

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(3000);

      const url4 = page.url();
      console.log(`After login URL: ${url4}`);

      await page.screenshot({ path: 'tests/screenshots/rbac-debug/06-after-login.png', fullPage: true });

      console.log('\n=== STEP 5: Visit /sales authenticated ===');
      await page.goto(`${BASE_URL}/sales`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const url5 = page.url();
      console.log(`Current URL: ${url5}`);
      console.log(`Contains /unauthorized: ${url5.includes('/unauthorized')}`);

      await page.screenshot({ path: 'tests/screenshots/rbac-debug/07-sales-authenticated.png', fullPage: true });

      console.log('\n=== STEP 6: Visit /admin/roles authenticated ===');
      await page.goto(`${BASE_URL}/admin/roles`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const url6 = page.url();
      console.log(`Current URL: ${url6}`);
      console.log(`Contains /unauthorized: ${url6.includes('/unauthorized')}`);
      console.log(`Contains /admin/roles: ${url6.includes('/admin/roles')}`);

      await page.screenshot({ path: 'tests/screenshots/rbac-debug/08-admin-roles-authenticated.png', fullPage: true });
    }

    console.log('\n=== COMPLETE ===');
    console.log('Check tests/screenshots/rbac-debug/ for results');
  });
});
