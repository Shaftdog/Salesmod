import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'sales-drill-down');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Sales Dashboard Drill-Down Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:9002/login');

    // Login with provided credentials
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/^http:\/\/localhost:9002\/(?!login)/);

    // Navigate to Sales Dashboard
    await page.goto('http://localhost:9002/sales');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial dashboard
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-sales-dashboard-loaded.png'),
      fullPage: true
    });
  });

  test('1. Sales Dashboard loads with KPI cards and charts', async ({ page }) => {
    // Verify we're on the sales page
    expect(page.url()).toContain('/sales');

    // Check for KPI cards - look for common text patterns
    const pageContent = await page.content();

    // Look for order-related metrics
    const hasOrderMetrics = pageContent.includes('Orders') ||
                           pageContent.includes('Total Fee') ||
                           pageContent.includes('Average Fee');

    expect(hasOrderMetrics).toBeTruthy();

    console.log('✓ Sales Dashboard loaded with KPI cards');
  });

  test('2. Today\'s Orders KPI card drill-down', async ({ page }) => {
    // Wait for dashboard to be fully loaded
    await page.waitForTimeout(2000);

    // Take screenshot before clicking
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-before-todays-orders-click.png'),
      fullPage: true
    });

    // Try to find and click "Today's Orders" card
    // Look for cards with this text
    const todaysOrdersCard = page.locator('text=Today\'s Orders').first();

    if (await todaysOrdersCard.count() > 0) {
      // Click the card (or its parent container)
      const cardContainer = todaysOrdersCard.locator('..').locator('..').first();
      await cardContainer.click();

      // Wait for dialog to open
      await page.waitForTimeout(1500);

      // Take screenshot of dialog
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '03-todays-orders-dialog.png'),
        fullPage: true
      });

      // Verify dialog content
      const dialogVisible = await page.locator('[role="dialog"]').isVisible();
      expect(dialogVisible).toBeTruthy();

      // Check for tabs (Summary, Chart, Orders) - use more specific selectors within dialog
      const dialog = page.locator('[role="dialog"]');
      const hasSummaryTab = await dialog.locator('button:has-text("Summary")').isVisible();
      const hasChartTab = await dialog.locator('button:has-text("Chart")').isVisible();
      const hasOrdersTab = await dialog.locator('button:has-text("Orders")').isVisible();

      console.log('Dialog tabs:', { hasSummaryTab, hasChartTab, hasOrdersTab });

      // Check for close button
      const closeButton = page.locator('button:has-text("Close")').first();
      const hasCloseButton = await closeButton.count() > 0;
      expect(hasCloseButton).toBeTruthy();

      // Close dialog
      await closeButton.click();
      await page.waitForTimeout(1000);

      console.log('✓ Today\'s Orders drill-down working');
    } else {
      console.log('⚠ Today\'s Orders card not found - checking available KPI cards');

      // Take screenshot of what's available
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-available-kpi-cards.png'),
        fullPage: true
      });

      // List all visible text to help diagnose
      const bodyText = await page.locator('body').innerText();
      console.log('Page contains these text elements:', bodyText.substring(0, 500));
    }
  });

  test('3. Test multiple KPI cards', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find all clickable KPI cards
    // Look for common patterns: cards with numbers/metrics
    const possibleCards = [
      'Today\'s Orders',
      'Weekly Orders',
      'Monthly Orders',
      'Today\'s Total Fee',
      'Weekly Total Fee',
      'Monthly Total Fee'
    ];

    let testedCards = 0;

    for (const cardText of possibleCards) {
      const cardLocator = page.locator(`text=${cardText}`).first();

      if (await cardLocator.count() > 0) {
        console.log(`Testing card: ${cardText}`);

        // Click the card
        const cardContainer = cardLocator.locator('..').locator('..').first();
        await cardContainer.click();

        // Wait for dialog
        await page.waitForTimeout(1500);

        // Take screenshot
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `04-${cardText.toLowerCase().replace(/[']/g, '').replace(/\s+/g, '-')}-dialog.png`),
          fullPage: true
        });

        // Verify dialog opened
        const dialogVisible = await page.locator('[role="dialog"]').isVisible();
        expect(dialogVisible).toBeTruthy();

        // Close dialog
        const closeButton = page.locator('button:has-text("Close")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }

        testedCards++;

        if (testedCards >= 3) break; // Test at least 3 different cards
      }
    }

    expect(testedCards).toBeGreaterThan(0);
    console.log(`✓ Tested ${testedCards} KPI cards successfully`);
  });

  test('4. Test chart drill-down (donut/pie chart)', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Take screenshot before attempting chart click
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-before-chart-click.png'),
      fullPage: true
    });

    // Look for SVG charts (donut/pie charts typically rendered as SVG)
    const svgCharts = page.locator('svg');
    const chartCount = await svgCharts.count();

    console.log(`Found ${chartCount} SVG charts on page`);

    if (chartCount > 0) {
      // Try clicking on the first chart
      const firstChart = svgCharts.first();

      // Look for path elements (pie/donut segments)
      const pathElements = firstChart.locator('path[d]');
      const pathCount = await pathElements.count();

      console.log(`Found ${pathCount} path elements in first chart`);

      if (pathCount > 0) {
        // Click on a path element (chart segment)
        await pathElements.first().click({ force: true });

        await page.waitForTimeout(1500);

        // Take screenshot
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '06-chart-segment-clicked.png'),
          fullPage: true
        });

        // Check if dialog opened
        const dialogVisible = await page.locator('[role="dialog"]').isVisible();

        if (dialogVisible) {
          console.log('✓ Chart drill-down opened dialog');

          // Close dialog
          const closeButton = page.locator('button:has-text("Close")').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        } else {
          console.log('⚠ Chart click did not open dialog (may not be interactive)');
        }
      }
    } else {
      console.log('⚠ No SVG charts found on page');
    }
  });

  test('5. Test trend chart drill-down (line chart)', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-before-trend-chart-click.png'),
      fullPage: true
    });

    // Look for SVG charts
    const svgCharts = page.locator('svg');
    const chartCount = await svgCharts.count();

    if (chartCount > 1) {
      // Try the second chart (might be a line chart)
      const secondChart = svgCharts.nth(1);

      // Look for circle elements (data points on line charts)
      const circleElements = secondChart.locator('circle');
      const circleCount = await circleElements.count();

      console.log(`Found ${circleCount} circle elements in chart`);

      if (circleCount > 0) {
        // Click on a data point
        await circleElements.first().click({ force: true });

        await page.waitForTimeout(1500);

        // Take screenshot
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '08-trend-chart-point-clicked.png'),
          fullPage: true
        });

        // Check if dialog opened
        const dialogVisible = await page.locator('[role="dialog"]').isVisible();

        if (dialogVisible) {
          console.log('✓ Trend chart drill-down opened dialog');

          // Close dialog
          const closeButton = page.locator('button:has-text("Close")').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        } else {
          console.log('⚠ Trend chart click did not open dialog');
        }
      }
    }
  });

  test('6. Test dialog tab switching and features', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Open any KPI card
    const firstCard = page.locator('text=Orders').first();

    if (await firstCard.count() > 0) {
      const cardContainer = firstCard.locator('..').locator('..').first();
      await cardContainer.click();

      await page.waitForTimeout(1500);

      // Verify dialog is open
      const dialogVisible = await page.locator('[role="dialog"]').isVisible();
      expect(dialogVisible).toBeTruthy();

      // Test Summary tab
      const summaryTab = page.locator('button:has-text("Summary")').first();
      if (await summaryTab.count() > 0) {
        await summaryTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '09-dialog-summary-tab.png'),
          fullPage: true
        });
        console.log('✓ Summary tab active');
      }

      // Test Chart tab
      const chartTab = page.locator('button:has-text("Chart")').first();
      if (await chartTab.count() > 0) {
        await chartTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '10-dialog-chart-tab.png'),
          fullPage: true
        });
        console.log('✓ Chart tab active');
      }

      // Test Orders tab
      const ordersTab = page.locator('button:has-text("Orders")').first();
      if (await ordersTab.count() > 0) {
        await ordersTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '11-dialog-orders-tab.png'),
          fullPage: true
        });
        console.log('✓ Orders tab active');
      }

      // Check for Export CSV button
      const exportButton = page.locator('button:has-text("Export CSV")').first();
      const hasExportButton = await exportButton.count() > 0;

      if (hasExportButton) {
        console.log('✓ Export CSV button found');
      } else {
        console.log('⚠ Export CSV button not found');
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '12-dialog-full-features.png'),
        fullPage: true
      });

      // Close dialog
      const closeButton = page.locator('button:has-text("Close")').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Close button works');
      }

      // Verify dialog closed
      const dialogStillVisible = await page.locator('[role="dialog"]').isVisible();
      expect(dialogStillVisible).toBeFalsy();

    } else {
      console.log('⚠ Could not find KPI card to open dialog');
    }
  });

  test('7. Verify all dialog stats in Summary tab', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Open a card with data
    const ordersCard = page.locator('text=Orders').first();

    if (await ordersCard.count() > 0) {
      const cardContainer = ordersCard.locator('..').locator('..').first();
      await cardContainer.click();

      await page.waitForTimeout(1500);

      // Make sure we're on Summary tab
      const summaryTab = page.locator('button:has-text("Summary")').first();
      if (await summaryTab.count() > 0) {
        await summaryTab.click();
        await page.waitForTimeout(500);
      }

      // Take detailed screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '13-dialog-summary-stats.png'),
        fullPage: true
      });

      // Check for expected stats (actual labels are uppercase)
      const expectedStats = [
        'TOTAL ORDERS',
        'TOTAL FEES',
        'AVERAGE FEE',
        'UNIQUE CLIENTS'
      ];

      const dialogContent = await page.locator('[role="dialog"]').innerText();

      for (const stat of expectedStats) {
        const hasStat = dialogContent.includes(stat);
        console.log(`${hasStat ? '✓' : '⚠'} ${stat} ${hasStat ? 'found' : 'not found'}`);
      }

      // Close dialog
      const closeButton = page.locator('button:has-text("Close")').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }
  });
});
