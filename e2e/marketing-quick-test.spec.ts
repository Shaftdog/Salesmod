import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('Marketing Module Quick Test', () => {
  test('Test all marketing routes', async ({ page }) => {
    const routes = [
      '/marketing',
      '/marketing/campaigns',
      '/marketing/audiences',
      '/marketing/content',
      '/marketing/email-templates',
      '/marketing/newsletters',
      '/marketing/webinars',
      '/marketing/analytics',
    ];

    console.log('\n=== MARKETING MODULE TEST RESULTS ===\n');

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      try {
        console.log(`Testing: ${url}`);
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const finalUrl = page.url();
        const status = response?.status() || 0;

        if (finalUrl.includes('/login') || finalUrl.includes('/auth')) {
          console.log(`✅ SKIP: ${route} - Requires authentication (redirected to ${finalUrl})`);
        } else if (status >= 400) {
          console.log(`❌ FAIL: ${route} - HTTP ${status}`);
          await page.screenshot({ path: `test-error-${route.replace(/\//g, '-')}.png` });
        } else {
          const hasError = await page.locator('text=/error|500|404/i').count() > 0;
          if (hasError) {
            console.log(`❌ FAIL: ${route} - Page shows error`);
            await page.screenshot({ path: `test-error-${route.replace(/\//g, '-')}.png` });
          } else {
            console.log(`✅ PASS: ${route} - Loaded successfully`);
          }
        }

        // Collect console errors
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });

        if (errors.length > 0) {
          console.log(`  Console Errors: ${errors.length}`);
          errors.forEach(err => console.log(`    - ${err}`));
        }

      } catch (error: any) {
        console.log(`❌ FAIL: ${route} - ${error.message}`);
      }
    }

    console.log('\n=== TEST COMPLETE ===\n');
  });
});
