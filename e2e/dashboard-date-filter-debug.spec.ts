import { test, expect } from '@playwright/test';

test.describe('Dashboard Debug', () => {
  test('check home page and navigation', async ({ page }) => {
    // Try the home page first
    await page.goto('http://localhost:9002/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of home page
    await page.screenshot({
      path: 'tests/screenshots/debug-homepage.png',
      fullPage: true
    });

    console.log('Home page URL:', page.url());
    console.log('Home page title:', await page.title());

    // Try dashboard
    await page.goto('http://localhost:9002/dashboard');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/debug-dashboard.png',
      fullPage: true
    });

    console.log('Dashboard URL:', page.url());
    console.log('Dashboard title:', await page.title());

    // Check for any error messages
    const body = await page.textContent('body');
    console.log('Page content:', body?.substring(0, 500));
  });
});
