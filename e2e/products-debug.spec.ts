import { test, expect } from '@playwright/test';

/**
 * Debug test to understand why products page is failing
 */

test('debug - check if server is responding', async ({ page }) => {
  console.log('Navigating to homepage...');

  // Enable verbose logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('request', request => console.log('Request:', request.url()));
  page.on('response', response => console.log('Response:', response.url(), response.status()));
  page.on('pageerror', error => console.log('Page error:', error.message));

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('Homepage loaded');

    await page.screenshot({ path: 'test-results/debug-homepage.png', fullPage: true });

    const url = page.url();
    console.log('Current URL after navigation:', url);

    const title = await page.title();
    console.log('Page title:', title);
  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'test-results/debug-error.png', fullPage: true });
  }
});

test('debug - check products page', async ({ page }) => {
  console.log('Navigating to products page...');

  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('request', request => console.log('Request:', request.url()));
  page.on('response', response => console.log('Response:', response.url(), response.status()));
  page.on('pageerror', error => console.log('Page error:', error.message));

  try {
    await page.goto('/sales/products', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Products page loaded');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/debug-products-page.png', fullPage: true });

    const url = page.url();
    console.log('Current URL after navigation:', url);

    const title = await page.title();
    console.log('Page title:', title);

    // Check for any visible text
    const bodyText = await page.locator('body').textContent();
    console.log('First 500 chars of body:', bodyText?.substring(0, 500));
  } catch (error) {
    console.error('Error during products navigation:', error);
    await page.screenshot({ path: 'test-results/debug-products-error.png', fullPage: true });

    // Try to get current URL even on error
    try {
      const url = page.url();
      console.log('Current URL on error:', url);
    } catch (e) {
      console.log('Could not get URL');
    }
  }
});
