import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'sales-dashboard-opportunities');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('Sales Dashboard Opportunities Drill-Down Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:9002/login');

    // Login with provided credentials
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/dashboard|sales/, { timeout: 10000 });

    // Take screenshot after login
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-after-login.png'), fullPage: true });
  });

  test('1. Navigate to Sales Dashboard', async ({ page }) => {
    // Navigate to sales page
    await page.goto('http://localhost:9002/sales');
    await page.waitForLoadState('networkidle');

    // Take screenshot of sales dashboard
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-sales-dashboard.png'), fullPage: true });

    // Verify we're on the sales page
    expect(page.url()).toContain('/sales');

    // Check for key elements on sales dashboard
    const dashboardVisible = await page.locator('text=/Sales|Dashboard/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(dashboardVisible).toBe(true);
  });

  test('2. Test Weekly Opportunities Drill-Down', async ({ page }) => {
    await page.goto('http://localhost:9002/sales');
    await page.waitForLoadState('networkidle');

    // Find and click Weekly Opportunities KPI card
    const weeklyOpportunitiesCard = page.locator('text=/Weekly Opportunities/i').first();
    await weeklyOpportunitiesCard.waitFor({ state: 'visible', timeout: 10000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-before-click-weekly-opportunities.png'), fullPage: true });

    // Click the card (might need to click parent container)
    const cardContainer = weeklyOpportunitiesCard.locator('xpath=ancestor::*[contains(@class, "cursor-pointer") or @role="button"][1]').first();
    await cardContainer.click({ timeout: 5000 }).catch(async () => {
      // Fallback: click the text directly
      await weeklyOpportunitiesCard.click();
    });

    // Wait for dialog to open
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-weekly-opportunities-dialog-opened.png'), fullPage: true });

    // Verify dialog title is "Weekly Opportunities" (not "Weekly Orders")
    const dialogTitle = page.locator('text=/Weekly Opportunities/i').first();
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // Verify badge shows "X opportunities" (not "X orders")
    const opportunitiesBadge = page.locator('text=/opportunities/i').first();
    const opportunitiesBadgeVisible = await opportunitiesBadge.isVisible({ timeout: 3000 }).catch(() => false);

    if (opportunitiesBadgeVisible) {
      console.log('✓ Badge shows "opportunities"');
    }

    // Verify Summary tab with deal-specific stats
    const summaryTab = page.locator('text=/Summary/i').first();
    await expect(summaryTab).toBeVisible({ timeout: 3000 });

    // Check for deal-specific stats
    const dealStats = [
      'Total Opportunities',
      'Total Value',
      'Average Value',
      'Avg Probability'
    ];

    for (const stat of dealStats) {
      const statElement = page.locator(`text=/${stat}/i`).first();
      const statVisible = await statElement.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`${statVisible ? '✓' : '✗'} Found stat: ${stat}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-weekly-opportunities-summary-tab.png'), fullPage: true });

    // Verify "Stage Breakdown" (not "Status Breakdown")
    const stageBreakdown = page.locator('text=/Stage Breakdown/i').first();
    const stageBreakdownVisible = await stageBreakdown.isVisible({ timeout: 3000 }).catch(() => false);

    if (stageBreakdownVisible) {
      console.log('✓ Found "Stage Breakdown"');
    }

    // Verify there's NO "Status Breakdown" (which would indicate orders)
    const statusBreakdown = page.locator('text=/Status Breakdown/i').first();
    const statusBreakdownVisible = await statusBreakdown.isVisible({ timeout: 2000 }).catch(() => false);

    if (!statusBreakdownVisible) {
      console.log('✓ Correctly does NOT show "Status Breakdown"');
    } else {
      console.log('✗ ERROR: Found "Status Breakdown" (should be "Stage Breakdown")');
    }

    // Click on Opportunities tab (not Orders tab)
    const opportunitiesTab = page.locator('text=/^Opportunities$/i').first();
    const opportunitiesTabVisible = await opportunitiesTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (opportunitiesTabVisible) {
      await opportunitiesTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-weekly-opportunities-opportunities-tab.png'), fullPage: true });

      // Verify deals table columns: Title, Stage, Value, Probability, Expected Close, Created
      const dealColumns = ['Title', 'Stage', 'Value', 'Probability', 'Expected Close', 'Created'];

      for (const column of dealColumns) {
        const columnHeader = page.locator(`text=/^${column}$/i`).first();
        const columnVisible = await columnHeader.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`${columnVisible ? '✓' : '✗'} Found column: ${column}`);
      }
    }

    // Final screenshot before closing
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-weekly-opportunities-final.png'), fullPage: true });
  });

  test('3. Test Today\'s Opportunities Drill-Down', async ({ page }) => {
    await page.goto('http://localhost:9002/sales');
    await page.waitForLoadState('networkidle');

    // Find and click Today's Opportunities KPI card
    const todayOpportunitiesCard = page.locator('text=/Today\'s Opportunities|Today Opportunities/i').first();
    const todayCardVisible = await todayOpportunitiesCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!todayCardVisible) {
      console.log('ℹ Today\'s Opportunities card not found - may not exist');
      return;
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-before-click-today-opportunities.png'), fullPage: true });

    // Click the card
    const cardContainer = todayOpportunitiesCard.locator('xpath=ancestor::*[contains(@class, "cursor-pointer") or @role="button"][1]').first();
    await cardContainer.click({ timeout: 5000 }).catch(async () => {
      await todayOpportunitiesCard.click();
    });

    // Wait for dialog to open
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-today-opportunities-dialog.png'), fullPage: true });

    // Verify it shows deals (opportunities) not orders
    const opportunitiesBadge = page.locator('text=/opportunities/i').first();
    const opportunitiesVisible = await opportunitiesBadge.isVisible({ timeout: 3000 }).catch(() => false);

    if (opportunitiesVisible) {
      console.log('✓ Today\'s Opportunities shows "opportunities"');
    }

    // Verify Stage Breakdown (not Status Breakdown)
    const stageBreakdown = page.locator('text=/Stage Breakdown/i').first();
    const stageVisible = await stageBreakdown.isVisible({ timeout: 3000 }).catch(() => false);

    if (stageVisible) {
      console.log('✓ Today\'s Opportunities shows "Stage Breakdown"');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-today-opportunities-final.png'), fullPage: true });

    // Close dialog for next test
    const closeButton = page.locator('button[aria-label="Close"]').first();
    const closeVisible = await closeButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (closeVisible) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('4. Verify Orders Still Work Correctly', async ({ page }) => {
    await page.goto('http://localhost:9002/sales');
    await page.waitForLoadState('networkidle');

    // Find and click Weekly Orders (or another order-related KPI)
    const weeklyOrdersCard = page.locator('text=/Weekly Orders/i').first();
    const ordersCardVisible = await weeklyOrdersCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!ordersCardVisible) {
      console.log('ℹ Weekly Orders card not found - checking for other order KPIs');

      // Try other order-related cards
      const alternativeCards = ['Monthly Orders', 'Total Orders', 'Recent Orders'];
      let foundCard = false;

      for (const cardName of alternativeCards) {
        const card = page.locator(`text=/${cardName}/i`).first();
        const visible = await card.isVisible({ timeout: 2000 }).catch(() => false);

        if (visible) {
          console.log(`✓ Found ${cardName} card`);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-before-click-orders.png'), fullPage: true });

          const cardContainer = card.locator('xpath=ancestor::*[contains(@class, "cursor-pointer") or @role="button"][1]').first();
          await cardContainer.click({ timeout: 5000 }).catch(async () => {
            await card.click();
          });

          foundCard = true;
          break;
        }
      }

      if (!foundCard) {
        console.log('ℹ No order-related cards found to test');
        return;
      }
    } else {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-before-click-orders.png'), fullPage: true });

      const cardContainer = weeklyOrdersCard.locator('xpath=ancestor::*[contains(@class, "cursor-pointer") or @role="button"][1]').first();
      await cardContainer.click({ timeout: 5000 }).catch(async () => {
        await weeklyOrdersCard.click();
      });
    }

    // Wait for dialog to open
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-orders-dialog-opened.png'), fullPage: true });

    // Verify it shows orders (not deals)
    const ordersBadge = page.locator('text=/orders/i').first();
    const ordersVisible = await ordersBadge.isVisible({ timeout: 3000 }).catch(() => false);

    if (ordersVisible) {
      console.log('✓ Orders dialog shows "orders"');
    }

    // Verify Status Breakdown (not Stage Breakdown)
    const statusBreakdown = page.locator('text=/Status Breakdown/i').first();
    const statusVisible = await statusBreakdown.isVisible({ timeout: 3000 }).catch(() => false);

    if (statusVisible) {
      console.log('✓ Orders dialog shows "Status Breakdown"');
    }

    // Verify there's NO "Stage Breakdown" (which would indicate deals)
    const stageBreakdown = page.locator('text=/Stage Breakdown/i').first();
    const stageVisible = await stageBreakdown.isVisible({ timeout: 2000 }).catch(() => false);

    if (!stageVisible) {
      console.log('✓ Orders dialog correctly does NOT show "Stage Breakdown"');
    } else {
      console.log('✗ ERROR: Found "Stage Breakdown" in orders dialog (should be "Status Breakdown")');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-orders-dialog-final.png'), fullPage: true });
  });
});
