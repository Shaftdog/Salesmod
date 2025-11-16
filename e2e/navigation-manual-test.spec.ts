import { test, expect } from '@playwright/test';

/**
 * Manual Navigation Test - Simplified
 *
 * This test will run in headed mode so we can see what's happening
 */

test('Manual navigation inspection', async ({ page }) => {
  // Try to navigate to the app
  console.log('Attempting to navigate to http://localhost:9002...');

  try {
    await page.goto('http://localhost:9002', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Successfully loaded page');
    console.log('Current URL:', page.url());

    // Take a screenshot of what loaded
    await page.screenshot({ path: 'test-results/initial-load.png', fullPage: true });

    // Check if we're on login
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    // Try to find sidebar
    const sidebar = await page.locator('aside.fixed').isVisible().catch(() => false);
    console.log('Sidebar visible:', sidebar);

    // Try to find header
    const header = await page.locator('header').isVisible().catch(() => false);
    console.log('Header visible:', header);

    // Check console for errors
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.waitForTimeout(5000); // Wait to observe

  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'test-results/error-state.png', fullPage: true });
  }
});
