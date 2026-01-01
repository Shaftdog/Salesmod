import { test, expect } from '@playwright/test';

test.describe('Production Templates Task Count Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');

    // Use placeholder text to find fields
    await page.locator('input[placeholder="you@example.com"]').fill('rod@myroihome.com');
    await page.locator('input[type="password"]').fill('Latter!974');
    await page.locator('button:has-text("Sign In")').click();

    // Wait for login to complete
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  });

  test('templates show correct task counts (not 0)', async ({ page }) => {
    // Navigate to Production Templates
    await page.goto('/production/templates');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'tests/screenshots/production-templates-task-counts.png',
      fullPage: true
    });

    // Wait for templates to load
    await page.waitForTimeout(2000);

    // Get all template cards
    const templateCards = await page.locator('[data-testid="template-card"], .bg-white.rounded-lg.shadow, .template-card').all();

    console.log(`Found ${templateCards.length} template cards`);

    // Check for task count text in the page
    const pageContent = await page.textContent('body');
    console.log('Checking for task counts in page...');

    // Look for specific templates and their task counts
    const conventionalTemplate = page.locator('text=Conventional Appraisal').first();
    const longTermTemplate = page.locator('text=Long Term Rental Lender Appraisal').first();
    const testTemplate = page.locator('text=Test 123').first();

    // Check if templates are visible
    if (await conventionalTemplate.isVisible({ timeout: 5000 }).catch(() => false)) {
      const conventionalCard = conventionalTemplate.locator('xpath=ancestor::div[contains(@class, "rounded")]').first();
      const conventionalText = await conventionalCard.textContent().catch(() => '');
      console.log('Conventional Appraisal card text:', conventionalText);

      // Check for task count - should NOT show "0 tasks"
      expect(conventionalText).not.toContain('0 tasks');
    }

    if (await longTermTemplate.isVisible({ timeout: 5000 }).catch(() => false)) {
      const longTermCard = longTermTemplate.locator('xpath=ancestor::div[contains(@class, "rounded")]').first();
      const longTermText = await longTermCard.textContent().catch(() => '');
      console.log('Long Term Rental Lender Appraisal card text:', longTermText);

      // Check for task count - should NOT show "0 tasks"
      expect(longTermText).not.toContain('0 tasks');
    }

    if (await testTemplate.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testCard = testTemplate.locator('xpath=ancestor::div[contains(@class, "rounded")]').first();
      const testText = await testCard.textContent().catch(() => '');
      console.log('Test 123 card text:', testText);

      // Check for task count - should NOT show "0 tasks"
      expect(testText).not.toContain('0 tasks');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'tests/screenshots/production-templates-final.png',
      fullPage: true
    });

    // Log all text on the page containing "task"
    const allTaskTexts = await page.locator(':has-text("task")').allTextContents();
    console.log('All task-related text found:', allTaskTexts.filter(t => t.includes('task')).slice(0, 10));
  });
});
