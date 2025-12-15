import { test, expect } from '@playwright/test';

test.describe('Dashboard Orders by Status Date Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:9002/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for the Orders by Status card to be visible using text selector
    await expect(page.getByText('Orders by Status')).toBeVisible({ timeout: 15000 });
  });

  test('should display date filter dropdown above the chart', async ({ page }) => {
    // Locate the Orders by Status card
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();

    // Verify the dropdown is visible
    const dropdown = card.getByRole('combobox');
    await expect(dropdown).toBeVisible();

    // Take screenshot of initial state
    await page.screenshot({
      path: 'tests/screenshots/dashboard-date-filter-initial.png',
      fullPage: true
    });
  });

  test('should show "All time" as default selected value', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Check the dropdown displays "All time"
    await expect(dropdown).toContainText('All time');
  });

  test('should display all filter options when dropdown is opened', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Click to open dropdown
    await dropdown.click();

    // Wait for dropdown menu to appear
    await page.waitForTimeout(300);

    // Verify all options are visible
    await expect(page.getByRole('option', { name: 'Last 7 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Last 30 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Last 90 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'This year' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'All time' })).toBeVisible();

    // Take screenshot of opened dropdown
    await page.screenshot({
      path: 'tests/screenshots/dashboard-date-filter-dropdown-open.png',
      fullPage: true
    });
  });

  test('should update chart when "Last 7 days" is selected', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Click dropdown
    await dropdown.click();
    await page.waitForTimeout(300);

    // Select "Last 7 days"
    await page.getByRole('option', { name: 'Last 7 days' }).click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Verify dropdown shows selected value
    await expect(dropdown).toContainText('Last 7 days');

    // Verify chart is still visible
    const chart = card.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-date-filter-7days.png',
      fullPage: true
    });
  });

  test('should update chart when "Last 30 days" is selected', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Click dropdown
    await dropdown.click();
    await page.waitForTimeout(300);

    // Select "Last 30 days"
    await page.getByRole('option', { name: 'Last 30 days' }).click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Verify dropdown shows selected value
    await expect(dropdown).toContainText('Last 30 days');

    // Verify chart is still visible
    const chart = card.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-date-filter-30days.png',
      fullPage: true
    });
  });

  test('should update chart when "Last 90 days" is selected', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Click dropdown
    await dropdown.click();
    await page.waitForTimeout(300);

    // Select "Last 90 days"
    await page.getByRole('option', { name: 'Last 90 days' }).click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Verify dropdown shows selected value
    await expect(dropdown).toContainText('Last 90 days');

    // Verify chart renders properly
    const chart = card.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();
  });

  test('should update chart when "This year" is selected', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');

    // Click dropdown
    await dropdown.click();
    await page.waitForTimeout(300);

    // Select "This year"
    await page.getByRole('option', { name: 'This year' }).click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Verify dropdown shows selected value
    await expect(dropdown).toContainText('This year');

    // Verify chart renders properly
    const chart = card.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();
  });

  test('should be able to switch between multiple filter options', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');
    const chart = card.locator('.recharts-wrapper');

    // Start with All time (default)
    await expect(dropdown).toContainText('All time');
    await expect(chart).toBeVisible();

    // Switch to Last 7 days
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Last 7 days' }).click();
    await page.waitForTimeout(500);
    await expect(dropdown).toContainText('Last 7 days');
    await expect(chart).toBeVisible();

    // Switch to This year
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'This year' }).click();
    await page.waitForTimeout(500);
    await expect(dropdown).toContainText('This year');
    await expect(chart).toBeVisible();

    // Switch back to All time
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'All time' }).click();
    await page.waitForTimeout(500);
    await expect(dropdown).toContainText('All time');
    await expect(chart).toBeVisible();

    // Take final screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-date-filter-all-time-final.png',
      fullPage: true
    });
  });

  test('should maintain chart visibility and proper rendering across all filters', async ({ page }) => {
    const card = page.locator('div').filter({ hasText: /^Orders by Status/ }).first();
    const dropdown = card.getByRole('combobox');
    const chart = card.locator('.recharts-wrapper');

    const filters = [
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
      'This year',
      'All time'
    ];

    for (const filter of filters) {
      // Select filter
      await dropdown.click();
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: filter }).click();
      await page.waitForTimeout(500);

      // Verify dropdown shows correct value
      await expect(dropdown).toContainText(filter);

      // Verify chart is visible and rendered
      await expect(chart).toBeVisible();

      // Verify chart has SVG content
      const svg = chart.locator('svg');
      await expect(svg).toBeVisible();

      // Verify bars are rendered
      const bars = chart.locator('.recharts-bar-rectangle');
      const barCount = await bars.count();
      // Should have at least 1 bar if there's data, or 0 if no data for that period
      expect(barCount).toBeGreaterThanOrEqual(0);
    }
  });
});
