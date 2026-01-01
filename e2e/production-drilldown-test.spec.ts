import { test, expect } from '@playwright/test';

test.describe('Production Dashboard - Cases In Progress Drill-down', () => {
  test('should display cases in progress drill-down data', async ({ page }) => {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:9002/login');
    await page.screenshot({ path: 'tests/screenshots/01-login-page.png' });

    // Step 2: Login with credentials
    console.log('Step 2: Logging in...');
    await page.fill('#email', 'rod@myroihome.com');
    await page.fill('#password', 'Latter!974');
    await page.screenshot({ path: 'tests/screenshots/02-credentials-filled.png' });

    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(dashboard|production|cases)/, { timeout: 15000 }).catch(() => {
      console.log('Did not redirect to expected page, checking current URL');
    });
    await page.screenshot({ path: 'tests/screenshots/03-after-login.png' });
    console.log('Current URL after login:', page.url());

    // Step 3: Navigate to production page
    console.log('Step 3: Navigating to /production...');
    await page.goto('http://localhost:9002/production');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/04-production-page.png' });

    // Step 4: Look for "CASES IN PROGRESS" metric card
    console.log('Step 4: Looking for CASES IN PROGRESS card...');

    // Wait for the dashboard to load
    await page.waitForTimeout(2000);

    // Take a full page screenshot
    await page.screenshot({ path: 'tests/screenshots/05-production-full.png', fullPage: true });

    // The metric cards have h3 elements with the title text
    // Find the specific card by locating the h3 with "Cases in Progress" text and clicking its parent div
    const casesInProgressCard = page.locator('h3:text-is("Cases in Progress")').locator('..');

    if (await casesInProgressCard.isVisible({ timeout: 3000 })) {
      console.log('Step 5: Found Cases in Progress card, clicking...');
      await casesInProgressCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/06-after-click-cases-progress.png' });
    } else {
      console.log('Could not find Cases in Progress card by h3 selector');
      // Fallback: try other selectors
      const fallbackLocator = page.locator('div').filter({ has: page.locator('h3', { hasText: /cases in progress/i }) }).first();
      if (await fallbackLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Step 5: Found via fallback selector, clicking...');
        await fallbackLocator.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'tests/screenshots/06-after-click-fallback.png' });
      } else {
        console.log('Could not find clickable element for cases in progress');
        await page.screenshot({ path: 'tests/screenshots/06-no-card-found.png', fullPage: true });
      }
    }

    // Step 6: Report what we see in the drill-down
    console.log('Step 6: Checking drill-down content...');

    // Look for dialog/modal/sheet that might have opened
    const dialogLocator = page.locator('[role="dialog"], [data-state="open"], .sheet, .modal, .drawer');
    const dialogVisible = await dialogLocator.isVisible({ timeout: 3000 }).catch(() => false);

    if (dialogVisible) {
      console.log('Dialog/modal is visible');
      await page.screenshot({ path: 'tests/screenshots/07-drilldown-dialog.png' });

      // Get dialog title to verify it's the correct one
      const dialogTitle = await page.locator('[role="dialog"] h2, [data-state="open"] h2, .sheet h2').textContent().catch(() => 'No title found');
      console.log('Dialog title:', dialogTitle);

      // Check if there's data or if it's empty
      const dialogContent = await dialogLocator.textContent();
      console.log('Dialog content preview:', dialogContent?.substring(0, 500));

      // Look for table rows or list items
      const tableRows = await page.locator('[role="dialog"] tr, [data-state="open"] tr').count();
      const listItems = await page.locator('[role="dialog"] li, [data-state="open"] li').count();

      console.log('Table rows found:', tableRows);
      console.log('List items found:', listItems);

      if (tableRows > 1 || listItems > 0) {
        console.log('SUCCESS: Drill-down contains data');
      } else {
        console.log('WARNING: Drill-down may be empty or has no list/table data');
      }
    } else {
      console.log('No dialog/modal found after clicking');
      // Check if perhaps the page navigated instead of opening a dialog
      console.log('Current URL:', page.url());
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/08-final-state.png', fullPage: true });
  });
});
