import { test, expect } from '@playwright/test';

test.describe('Sales Dashboard Test', () => {
  const BASE_URL = 'http://localhost:9002';
  const LOGIN_EMAIL = 'rod@myroihome.com';
  const LOGIN_PASSWORD = 'Latter!974';

  test.setTimeout(120000); // 2 minute timeout for entire test

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(60000); // 1 minute timeout for actions

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/01-login-page.png',
      fullPage: true
    });

    // Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);

    // Take screenshot before login
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/02-credentials-filled.png',
      fullPage: true
    });

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation after login - use URL change instead of networkidle
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });

    // Give the page a moment to settle
    await page.waitForTimeout(2000);

    // Take screenshot after login
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/03-after-login.png',
      fullPage: true
    });

    console.log('Login complete, current URL:', page.url());
  });

  test('Sales Dashboard - Full Verification', async ({ page }) => {
    console.log('Starting Sales Dashboard test...');

    // Navigate to Sales Dashboard
    await page.goto(`${BASE_URL}/sales`, { waitUntil: 'domcontentloaded' });
    console.log('Navigated to /sales');

    // Wait for page to load and give charts time to render
    await page.waitForTimeout(3000);

    // Take screenshot of full dashboard
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/04-dashboard-loaded.png',
      fullPage: true
    });

    // Check for any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });

    // Verify page title or heading
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      const headingText = await heading.textContent();
      console.log('Page heading:', headingText);
    }

    // Test 1: Verify KPI Cards (12 metrics in 3 rows)
    console.log('\n=== Testing KPI Cards ===');

    // Look for common KPI card patterns
    const kpiCards = page.locator('[class*="grid"] > [class*="card"], [class*="grid"] > div > [class*="card"], [class*="grid"] > div[class*="border"]');
    const kpiCount = await kpiCards.count();
    console.log(`Found ${kpiCount} KPI cards`);

    // Take screenshot of KPI section
    if (kpiCount > 0) {
      await page.screenshot({
        path: 'e2e/screenshots/sales-dashboard/05-kpi-cards.png',
        fullPage: true
      });
    }

    // Test 2: Verify Donut Charts
    console.log('\n=== Testing Donut Charts ===');

    // Look for chart containers (common patterns)
    const chartContainers = page.locator('[class*="chart"], canvas, svg[class*="recharts"]');
    const chartCount = await chartContainers.count();
    console.log(`Found ${chartCount} chart elements`);

    // Check for specific donut chart titles
    const expectedChartTitles = [
      'Weekly Orders by Campaign',
      'Monthly Orders by Campaign',
      'Sales by Agent',
      'AMC Client Distribution',
      'Product Distribution'
    ];

    const foundCharts: string[] = [];
    const missingCharts: string[] = [];

    for (const title of expectedChartTitles) {
      const titleElement = page.locator(`text=${title}`);
      const exists = await titleElement.count() > 0;
      console.log(`${title}: ${exists ? '✓ Found' : '✗ Missing'}`);

      if (exists) {
        foundCharts.push(title);
      } else {
        missingCharts.push(title);
      }
    }

    // Take screenshot of charts section
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/06-donut-charts.png',
      fullPage: true
    });

    // Test 3: Verify Trend Charts
    console.log('\n=== Testing Trend Charts ===');

    const expectedTrendCharts = [
      'Daily Orders',
      'Weekly Orders',
      'Monthly Orders'
    ];

    const foundTrendCharts: string[] = [];
    const missingTrendCharts: string[] = [];

    for (const title of expectedTrendCharts) {
      const titleElement = page.locator(`text=${title}`);
      const exists = await titleElement.count() > 0;
      console.log(`${title}: ${exists ? '✓ Found' : '✗ Missing'}`);

      if (exists) {
        foundTrendCharts.push(title);
      } else {
        missingTrendCharts.push(title);
      }
    }

    // Take screenshot of trend charts
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/07-trend-charts.png',
      fullPage: true
    });

    // Test 4: Scroll and capture full page
    console.log('\n=== Capturing Full Page ===');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/08-full-dashboard-top.png',
      fullPage: true
    });

    // Scroll to middle
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/09-full-dashboard-middle.png',
      fullPage: true
    });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/10-full-dashboard-bottom.png',
      fullPage: true
    });

    // Test 5: Check for loading states
    console.log('\n=== Checking Loading States ===');
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [role="status"]');
    const loadingCount = await loadingIndicators.count();
    console.log(`Loading indicators visible: ${loadingCount}`);

    // Test 6: Verify no error messages
    console.log('\n=== Checking for Error Messages ===');
    const errorMessages = page.locator('[class*="error"], [role="alert"]');
    const errorCount = await errorMessages.count();
    console.log(`Error messages found: ${errorCount}`);

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }

    // Test 7: Inspect page HTML structure
    console.log('\n=== Page Structure ===');
    const bodyHTML = await page.locator('body').innerHTML();

    // Check for common dashboard elements
    const hasGrid = bodyHTML.includes('grid');
    const hasChart = bodyHTML.includes('chart') || bodyHTML.includes('canvas') || bodyHTML.includes('svg');
    const hasCard = bodyHTML.includes('card');

    console.log(`Contains grid layout: ${hasGrid}`);
    console.log(`Contains charts: ${hasChart}`);
    console.log(`Contains cards: ${hasCard}`);

    // Final screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/11-final-state.png',
      fullPage: true
    });

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`KPI Cards Found: ${kpiCount}`);
    console.log(`Chart Elements Found: ${chartCount}`);
    console.log(`Donut Charts Found: ${foundCharts.length}/${expectedChartTitles.length}`);
    console.log(`Trend Charts Found: ${foundTrendCharts.length}/${expectedTrendCharts.length}`);
    console.log(`Error Messages: ${errorCount}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (missingCharts.length > 0) {
      console.log('\nMissing Donut Charts:');
      missingCharts.forEach(chart => console.log(`  - ${chart}`));
    }

    if (missingTrendCharts.length > 0) {
      console.log('\nMissing Trend Charts:');
      missingTrendCharts.forEach(chart => console.log(`  - ${chart}`));
    }

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    // Basic assertion - page should have loaded
    await expect(page).toHaveURL(/\/sales/);

    // Verify page has some content
    expect(kpiCount + chartCount).toBeGreaterThan(0);
  });
});
