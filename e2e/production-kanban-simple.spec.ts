import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Simple test to check if production pages exist and load
 * WITHOUT authentication requirement
 */
test.describe('Production Kanban System - Simple Check', () => {
  test('Check all production pages load', async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultTimeout(30000);

    // Track console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Track navigation responses
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (status >= 400) {
        console.log(`⚠ HTTP ${status}: ${url}`);
      }
    });

    const pages = [
      { path: '/production', name: 'Production Dashboard', screenshot: 'production-dashboard' },
      { path: '/production/templates', name: 'Production Templates', screenshot: 'production-templates' },
      { path: '/production/board', name: 'Production Board', screenshot: 'production-board' },
      { path: '/production/my-tasks', name: 'My Tasks', screenshot: 'production-my-tasks' },
      { path: '/orders/new', name: 'New Order Form', screenshot: 'order-form-template' },
    ];

    for (const pageInfo of pages) {
      console.log(`\n=== Testing ${pageInfo.name} (${pageInfo.path}) ===`);

      try {
        // Navigate with explicit wait strategy
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded', // Don't wait for full load
          timeout: 30000
        });

        console.log(`Response status: ${response?.status()}`);
        console.log(`Final URL: ${page.url()}`);

        // Wait a bit for any dynamic content
        await page.waitForTimeout(2000);

        // Check if we got redirected to login
        const currentUrl = page.url();
        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
          console.log(`⚠ REDIRECTED TO LOGIN - Page requires authentication`);

          // Take screenshot of login redirect
          await page.screenshot({
            path: `C:/Users/shaug/source/repos/Shaftdog/Salesmod/error--${pageInfo.screenshot}.png`,
            fullPage: true
          });
        } else {
          console.log(`✓ Page loaded successfully`);

          // Take screenshot
          await page.screenshot({
            path: `C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/${pageInfo.screenshot}.png`,
            fullPage: true
          });

          // Also save success screenshot to root
          await page.screenshot({
            path: `C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--${pageInfo.screenshot}.png`,
            fullPage: true
          });

          // Try to find main content
          const body = await page.locator('body').textContent();
          console.log(`Page has ${body?.length || 0} characters of content`);

          // Look for common headings
          const h1 = page.locator('h1').first();
          const h1Count = await h1.count();
          if (h1Count > 0) {
            const h1Text = await h1.textContent();
            console.log(`Main heading: "${h1Text}"`);
          }
        }
      } catch (error) {
        console.log(`❌ ERROR loading page:`, error);

        // Take screenshot of error state
        await page.screenshot({
          path: `C:/Users/shaug/source/repos/Shaftdog/Salesmod/error--${pageInfo.screenshot}.png`,
          fullPage: true
        });
      }
    }

    // Report console errors
    console.log('\n=== CONSOLE ERRORS SUMMARY ===');
    if (consoleErrors.length > 0) {
      console.log(`Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.substring(0, 200)}`);
      });
    } else {
      console.log('✓ No console errors found');
    }

    if (consoleWarnings.length > 0) {
      console.log(`\nFound ${consoleWarnings.length} console warnings`);
    }
  });
});
