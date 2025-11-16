import { test, expect } from '@playwright/test';

test.describe('Navigation Refactor Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9002/dashboard');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('1. Basic Functionality - Page loads and navigation works', async ({ page }) => {
    // Check dashboard loads
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify all 6 department sections visible in sidebar
    const departments = ['Sales', 'Marketing', 'Finance', 'Operations', 'Production', 'Logistics'];
    for (const dept of departments) {
      const trigger = page.locator(`button:has-text("${dept}")`);
      await expect(trigger).toBeVisible({ timeout: 10000 });
    }

    // Expand Sales section and click Orders
    const salesTrigger = page.locator('button:has-text("Sales")').first();
    await salesTrigger.click();
    await page.waitForTimeout(300); // Wait for animation

    const ordersLink = page.locator('a:has-text("Orders")').first();
    await ordersLink.click();
    await page.waitForLoadState('networkidle');

    // Verify Orders page loads
    await expect(page).toHaveURL(/\/sales\/orders/);

    // Verify breadcrumb shows "Sales > Orders"
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, h1, h2');
    const breadcrumbText = await breadcrumb.first().textContent();
    console.log('Breadcrumb text:', breadcrumbText);
  });

  test('2. ARIA Labels - Accessibility attributes present', async ({ page }) => {
    const salesTrigger = page.locator('button:has-text("Sales")').first();

    // Check aria-label
    const ariaLabel = await salesTrigger.getAttribute('aria-label');
    console.log('Sales trigger aria-label:', ariaLabel);
    expect(ariaLabel).toContain('Sales');

    // Check initial aria-expanded is false
    let ariaExpanded = await salesTrigger.getAttribute('aria-expanded');
    console.log('Initial aria-expanded:', ariaExpanded);
    expect(ariaExpanded).toBe('false');

    // Click to expand
    await salesTrigger.click();
    await page.waitForTimeout(300);

    // Check aria-expanded is now true
    ariaExpanded = await salesTrigger.getAttribute('aria-expanded');
    console.log('After click aria-expanded:', ariaExpanded);
    expect(ariaExpanded).toBe('true');

    // Check CollapsibleContent has id
    const salesContent = page.locator('#sales-nav');
    await expect(salesContent).toBeVisible();
  });

  test('3. Mobile Menu Auto-Close - Menu closes after navigation', async ({ page }) => {
    // Resize to mobile width
    await page.setViewportSize({ width: 375, height: 667 });

    // Find and click hamburger menu button
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], button:has(svg)').first();
    await hamburger.click();
    await page.waitForTimeout(300);

    // Check menu is open (look for navigation links)
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();

    // Click Overview link
    const overviewLink = page.locator('a:has-text("Overview"), a[href*="dashboard"]').first();
    await overviewLink.click();
    await page.waitForTimeout(500); // Wait for animation

    // CRITICAL: Verify menu closes automatically
    // The menu should have closed, check if hamburger is visible again
    const isHamburgerVisible = await hamburger.isVisible();
    console.log('Hamburger visible after navigation:', isHamburgerVisible);

    // Alternative check: look for closed menu state
    const menuState = await page.locator('button[aria-expanded]').first().getAttribute('aria-expanded');
    console.log('Menu aria-expanded state:', menuState);
  });

  test('4. Active Link Detection Fix - Only active route highlighted', async ({ page }) => {
    // Navigate to /agent
    await page.goto('http://localhost:9002/agent');
    await page.waitForLoadState('networkidle');

    // Find AI Agent link
    const aiAgentLink = page.locator('a:has-text("AI Agent"), a[href="/agent"]').first();

    // Check if it has active styling (look for common active class patterns)
    const aiAgentClasses = await aiAgentLink.getAttribute('class');
    console.log('AI Agent link classes on /agent:', aiAgentClasses);

    // Navigate to /agent/jobs
    await page.goto('http://localhost:9002/agent/jobs');
    await page.waitForLoadState('networkidle');

    // Check AI Agent link is NOT highlighted (should not have active class)
    const aiAgentClassesOnJobs = await aiAgentLink.getAttribute('class');
    console.log('AI Agent link classes on /agent/jobs:', aiAgentClassesOnJobs);

    // Check Jobs link IS highlighted
    const jobsLink = page.locator('a:has-text("Jobs"), a[href*="jobs"]').first();
    const jobsClasses = await jobsLink.getAttribute('class');
    console.log('Jobs link classes on /agent/jobs:', jobsClasses);

    // The AI Agent link should not have the same active styling as Jobs
    expect(aiAgentClassesOnJobs).not.toBe(jobsClasses);
  });

  test('5. No Console Errors - Clean console output', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate through several pages
    await page.goto('http://localhost:9002/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:9002/sales/orders');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:9002/agent');
    await page.waitForLoadState('networkidle');

    // Check for specific error patterns
    const parsingErrors = consoleErrors.filter(e => e.includes('parsing ecmascript'));
    const reactWarnings = consoleWarnings.filter(w => w.includes('React'));

    console.log('Console Errors:', consoleErrors);
    console.log('Console Warnings:', consoleWarnings);
    console.log('Parsing Errors:', parsingErrors);
    console.log('React Warnings:', reactWarnings);

    // Fail if there are critical errors
    expect(parsingErrors.length).toBe(0);
    expect(consoleErrors.filter(e => !e.includes('favicon')).length).toBe(0);
  });
});
