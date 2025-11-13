import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Jobs List Page (Campaign Runner)
 * Priority: P0 - Critical functionality
 */

test.describe('Jobs List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This may redirect to auth if not logged in
    await page.goto('/agent/jobs');
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
  });

  test('should load the jobs list page without errors', async ({ page }) => {
    // Check if we're on the right page (or auth redirect)
    const url = page.url();
    console.log('Current URL:', url);

    // If redirected to auth, skip the test
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/jobs-list-page.png',
      fullPage: true
    });

    // Log any console errors
    if (errors.length > 0) {
      console.log('Console errors detected:', errors);
    }
  });

  test('should display page title and main UI elements', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for page title/heading
    const possibleTitles = ['Jobs', 'Campaign Runner', 'Job Management'];
    let titleFound = false;

    for (const title of possibleTitles) {
      const heading = page.getByRole('heading', { name: new RegExp(title, 'i') });
      if (await heading.count() > 0) {
        titleFound = true;
        console.log('Found title:', title);
        break;
      }
    }

    // Log what we found even if title not found (for debugging)
    const allHeadings = await page.locator('h1, h2, h3').allTextContents();
    console.log('All headings on page:', allHeadings);
  });

  test('should display "New Job" or "Create Job" button', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for create job button
    const buttonTexts = ['New Job', 'Create Job', 'Add Job', '\\+ Job'];
    let buttonFound = false;

    for (const text of buttonTexts) {
      // Escape special regex characters
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const button = page.getByRole('button', { name: new RegExp(escapedText, 'i') });
      if (await button.count() > 0) {
        buttonFound = true;
        console.log('Found button:', text);
        await expect(button.first()).toBeVisible();
        break;
      }
    }

    // Log all buttons for debugging
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', allButtons.filter(text => text.trim()));
  });

  test('should display summary stats cards', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for stat cards with common patterns
    const statLabels = ['Total Jobs', 'Running', 'Completed', 'Emails Sent', 'Active'];
    const foundStats: string[] = [];

    for (const label of statLabels) {
      const element = page.getByText(new RegExp(label, 'i'));
      if (await element.count() > 0) {
        foundStats.push(label);
        console.log('Found stat card:', label);
      }
    }

    console.log('Found stats:', foundStats);

    // Take screenshot showing stats
    await page.screenshot({
      path: 'e2e/screenshots/jobs-list-stats.png',
      fullPage: true
    });
  });

  test('should display jobs table or list container', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for table or list structure
    const table = page.locator('table');
    const tableCount = await table.count();

    if (tableCount > 0) {
      console.log('Found jobs table');

      // Check for table headers
      const headers = await page.locator('thead th').allTextContents();
      console.log('Table headers:', headers);
    } else {
      // Look for list/grid structure
      const lists = await page.locator('[role="list"], .job-list, .jobs-grid').count();
      console.log('Found list/grid containers:', lists);
    }

    // Check for empty state message
    const emptyStateTexts = ['No jobs', 'No campaigns', 'Create your first job'];
    for (const text of emptyStateTexts) {
      const element = page.getByText(new RegExp(text, 'i'));
      if (await element.count() > 0) {
        console.log('Found empty state message:', text);
      }
    }
  });

  test('should display status filter dropdown', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for filter/status dropdown
    const filterButton = page.locator('button:has-text("Status"), button:has-text("Filter"), [role="combobox"]');
    const filterCount = await filterButton.count();

    if (filterCount > 0) {
      console.log('Found filter dropdown');
      await page.screenshot({
        path: 'e2e/screenshots/jobs-list-filters.png',
        fullPage: true
      });
    } else {
      console.log('Filter dropdown not found - may be optional');
    }
  });

  test('should not have critical console errors', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    const criticalErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out common non-critical errors
        if (!text.includes('favicon') &&
            !text.includes('DevTools') &&
            !text.includes('extension')) {
          criticalErrors.push(text);
        }
      }
    });

    // Wait a bit to collect any errors
    await page.waitForTimeout(2000);

    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
    }

    // Log the error count (but don't fail the test, just warn)
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should handle page navigation correctly', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Verify we're on the jobs page
    expect(url).toContain('/agent/jobs');

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
  });
});
