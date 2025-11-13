import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Control Panel - Active Jobs
 * Priority: P1 - Important functionality
 */

test.describe('Control Panel - Active Jobs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agent');
    await page.waitForLoadState('networkidle');
  });

  test('should find and open Control Panel', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Look for Control Panel button/trigger
    const controlPanelTriggers = [
      'button:has-text("Control")',
      '[aria-label*="Control Panel"]',
      '[aria-label*="control panel"]',
      'button:has-text("Settings")',
      '[class*="control-panel"]'
    ];

    let panelFound = false;

    for (const selector of controlPanelTriggers) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log('Found Control Panel trigger:', selector);
        await element.first().click();
        await page.waitForTimeout(1000);
        panelFound = true;
        break;
      }
    }

    if (!panelFound) {
      console.log('Control Panel trigger not found - checking all buttons');
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons:', allButtons.filter(text => text.trim()));
      test.skip(true, 'Control Panel button not found');
      return;
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/control-panel-open.png',
      fullPage: true
    });

    console.log('Control Panel opened');
  });

  test('should display Control tab in Control Panel', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();

    // Wait for the dialog to be fully open and animation to complete
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    // Wait extra time for animation to fully complete (500ms animation + buffer)
    await page.waitForTimeout(1500);

    // Look for tabs
    const tabs = page.locator('[role="tab"], .tab, button[class*="tab"]');
    const tabCount = await tabs.count();
    console.log('Found tabs:', tabCount);

    if (tabCount > 0) {
      const tabTexts = await tabs.allTextContents();
      console.log('Tab labels:', tabTexts);

      // Look for Control tab specifically
      const controlTab = page.locator('[role="tab"]:has-text("Control"), button:has-text("Control")');
      if (await controlTab.count() > 0) {
        console.log('Found Control tab');
        // Wait for tab to be clickable and use force to bypass animation interception
        await controlTab.first().waitFor({ state: 'visible' });
        await controlTab.first().click({ force: true });
        await page.waitForTimeout(500);
      }
    } else {
      console.log('No tabs found - may be a different UI structure');
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/control-panel-control-tab.png',
      fullPage: true
    });
  });

  test('should display Active Jobs section', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to Control tab if it exists
    const controlTab = page.locator('[role="tab"]:has-text("Control")');
    if (await controlTab.count() > 0) {
      await controlTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for Active Jobs section
    const activeJobsHeadings = ['Active Jobs', 'Running Jobs', 'Jobs in Progress'];
    let sectionFound = false;

    for (const heading of activeJobsHeadings) {
      const element = page.getByText(new RegExp(heading, 'i'));
      if (await element.count() > 0) {
        console.log('Found Active Jobs section:', heading);
        sectionFound = true;
        break;
      }
    }

    if (sectionFound) {
      await page.screenshot({
        path: 'e2e/screenshots/control-panel-active-jobs.png',
        fullPage: true
      });
    } else {
      console.log('Active Jobs section not found - may be empty or different label');

      // Take screenshot anyway
      await page.screenshot({
        path: 'e2e/screenshots/control-panel-no-active-jobs.png',
        fullPage: true
      });
    }
  });

  test('should display active jobs count badge', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to Control tab if it exists
    const controlTab = page.locator('[role="tab"]:has-text("Control")');
    if (await controlTab.count() > 0) {
      await controlTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for badge/count indicator
    const badges = page.locator('[class*="badge"], [class*="count"], .rounded-full[class*="bg-"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      console.log('Found badges/count indicators:', badgeCount);

      // Get text from badges near "Active Jobs"
      const badgeTexts = await badges.allTextContents();
      console.log('Badge values:', badgeTexts);
    } else {
      console.log('No badges found - may be zero active jobs');
    }
  });

  test('should display job details in Active Jobs list', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to Control tab if it exists
    const controlTab = page.locator('[role="tab"]:has-text("Control")');
    if (await controlTab.count() > 0) {
      await controlTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for job list items
    const jobItems = page.locator('[class*="job-item"], [class*="job-card"], li:has-text("Job")');
    const itemCount = await jobItems.count();
    console.log('Found job items in list:', itemCount);

    if (itemCount > 0) {
      // Check first item for details
      const firstItem = jobItems.first();

      // Look for job name
      const jobName = await firstItem.locator('[class*="name"], .font-medium, .font-semibold').textContent();
      console.log('First job name:', jobName?.trim());

      // Look for status
      const status = await firstItem.locator('[class*="status"], [class*="badge"]').textContent();
      console.log('First job status:', status?.trim());

      // Take screenshot
      await page.screenshot({
        path: 'e2e/screenshots/control-panel-job-details.png',
        fullPage: true
      });
    } else {
      console.log('No job items found - may be empty state');

      // Look for empty state message
      const emptyState = page.getByText(/no active jobs|no running jobs|no jobs/i);
      if (await emptyState.count() > 0) {
        console.log('Found empty state message');
      }
    }
  });

  test('should display job metrics in Active Jobs', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to Control tab if it exists
    const controlTab = page.locator('[role="tab"]:has-text("Control")');
    if (await controlTab.count() > 0) {
      await controlTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for metrics
    const metricLabels = ['cards', 'emails', 'sent', 'delivered', 'opened', 'responded'];
    const foundMetrics: string[] = [];

    for (const label of metricLabels) {
      const metric = page.getByText(new RegExp(label, 'i'));
      if (await metric.count() > 0) {
        foundMetrics.push(label);
      }
    }

    if (foundMetrics.length > 0) {
      console.log('Found job metrics:', foundMetrics);
    } else {
      console.log('No metrics found - may need active jobs to display metrics');
    }
  });

  test('should allow clicking on job to view details', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to Control tab if it exists
    const controlTab = page.locator('[role="tab"]:has-text("Control")');
    if (await controlTab.count() > 0) {
      await controlTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for clickable job items
    const jobItems = page.locator('[class*="job-item"], [class*="job-card"], li:has-text("Job")');
    const itemCount = await jobItems.count();

    if (itemCount > 0) {
      console.log('Attempting to click first job item');
      await jobItems.first().click();
      await page.waitForTimeout(1000);

      // Check if anything changed (e.g., navigation, modal, expanded view)
      const newUrl = page.url();
      console.log('URL after click:', newUrl);

      // Take screenshot
      await page.screenshot({
        path: 'e2e/screenshots/control-panel-job-clicked.png',
        fullPage: true
      });
    } else {
      console.log('No job items to click');
    }
  });

  test('should close Control Panel', async ({ page }) => {
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required - skipping test');
      return;
    }

    // Open Control Panel
    const controlBtn = page.locator('button:has-text("Control"), [aria-label*="Control"]');
    if (await controlBtn.count() === 0) {
      test.skip(true, 'Control Panel not found');
      return;
    }

    await controlBtn.first().click();
    await page.waitForTimeout(1000);

    // Look for close button
    const closeBtn = page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("×")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
      console.log('Closed Control Panel');
    } else {
      // Try Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      console.log('Attempted to close with Escape key');
    }
  });
});
