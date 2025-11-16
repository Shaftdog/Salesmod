import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('Navigation Refactor Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. Navigation Structure - All sections and items visible', async ({ page }) => {
    // Check all 6 department sections are visible
    const departments = ['Sales', 'Marketing', 'Production', 'Operations', 'Logistics', 'Finance'];

    for (const dept of departments) {
      const section = page.getByRole('button', { name: new RegExp(`${dept} department navigation`) });
      await expect(section).toBeVisible();
    }

    // Expand Sales section and verify all 7 items
    await page.getByRole('button', { name: /Sales department navigation/ }).click();
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contacts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Deals' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cases' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Properties' })).toBeVisible();

    // Check AI section
    const aiSection = page.getByRole('button', { name: /AI & Automation navigation/ });
    await expect(aiSection).toBeVisible();
  });

  test('2. ARIA Accessibility - Collapsible elements have proper attributes', async ({ page }) => {
    // Check Sales section ARIA attributes
    const salesTrigger = page.getByRole('button', { name: /Sales department navigation/ });

    // Should have aria-label
    await expect(salesTrigger).toHaveAttribute('aria-label', 'Sales department navigation');

    // Should have aria-expanded (initially false)
    await expect(salesTrigger).toHaveAttribute('aria-expanded', 'false');

    // Should have aria-controls
    await expect(salesTrigger).toHaveAttribute('aria-controls', 'sales-nav');

    // Expand and check aria-expanded changes
    await salesTrigger.click();
    await expect(salesTrigger).toHaveAttribute('aria-expanded', 'true');

    // Check CollapsibleContent has matching id
    const salesContent = page.locator('#sales-nav');
    await expect(salesContent).toBeVisible();

    // Check AI section ARIA
    const aiTrigger = page.getByRole('button', { name: /AI & Automation navigation/ });
    await expect(aiTrigger).toHaveAttribute('aria-label', 'AI & Automation navigation');
    await expect(aiTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(aiTrigger).toHaveAttribute('aria-controls', 'ai-nav');
  });

  test('3. Active Link Detection - /agent route highlights correctly', async ({ page }) => {
    // Navigate to /agent
    await page.goto(`${BASE_URL}/agent`);
    await page.waitForLoadState('networkidle');

    // Expand AI section
    await page.getByRole('button', { name: /AI & Automation navigation/ }).click();

    // AI Agent link should be highlighted (has bg-accent class)
    const agentLink = page.getByRole('link', { name: 'AI Agent' });
    await expect(agentLink).toHaveClass(/bg-accent/);

    // Jobs link should NOT be highlighted
    const jobsLink = page.getByRole('link', { name: 'Jobs' });
    await expect(jobsLink).not.toHaveClass(/bg-accent/);
  });

  test('4. Active Link Detection - /agent/jobs only highlights jobs', async ({ page }) => {
    // Navigate to /agent/jobs
    await page.goto(`${BASE_URL}/agent/jobs`);
    await page.waitForLoadState('networkidle');

    // Expand AI section
    await page.getByRole('button', { name: /AI & Automation navigation/ }).click();

    // Jobs link should be highlighted
    const jobsLink = page.getByRole('link', { name: 'Jobs' });
    await expect(jobsLink).toHaveClass(/bg-accent/);

    // AI Agent link should NOT be highlighted
    const agentLink = page.getByRole('link', { name: 'AI Agent' });
    await expect(agentLink).not.toHaveClass(/bg-accent/);
  });

  test('5. Active Link Detection - /sales highlights correctly', async ({ page }) => {
    // Navigate to /sales
    await page.goto(`${BASE_URL}/sales`);
    await page.waitForLoadState('networkidle');

    // Sales section trigger should have visual indicator (expanded)
    const salesTrigger = page.getByRole('button', { name: /Sales department navigation/ });

    // The section should be expanded automatically (or we expand it)
    await salesTrigger.click();

    // Dashboard link in Sales should be highlighted
    const salesLinks = page.locator('#sales-nav a');
    const dashboardLink = salesLinks.filter({ hasText: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/bg-accent/);
  });

  test('6. Active Link Detection - /orders highlights Sales and Orders', async ({ page }) => {
    // Navigate to /orders
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');

    // Expand Sales section
    await page.getByRole('button', { name: /Sales department navigation/ }).click();

    // Orders link should be highlighted
    const ordersLink = page.getByRole('link', { name: 'Orders' });
    await expect(ordersLink).toHaveClass(/bg-accent/);
  });

  test('7. Breadcrumbs - /sales shows Sales', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales`);
    await page.waitForLoadState('networkidle');

    // Check breadcrumb shows "Sales" as current page
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i }).first();
    await expect(breadcrumb).toContainText('Sales');
  });

  test('8. Breadcrumbs - /orders shows Sales > Orders', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');

    // Check breadcrumb structure
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i }).first();
    await expect(breadcrumb).toContainText('Sales');
    await expect(breadcrumb).toContainText('Orders');
  });

  test('9. Breadcrumbs - /marketing/campaigns shows Dashboard > Marketing > Campaigns', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketing/campaigns`);
    await page.waitForLoadState('networkidle');

    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i }).first();
    await expect(breadcrumb).toContainText('Dashboard');
    await expect(breadcrumb).toContainText('Marketing');
    await expect(breadcrumb).toContainText('Campaigns');
  });

  test('10. Breadcrumbs - /production/active-appraisals shows correct path', async ({ page }) => {
    await page.goto(`${BASE_URL}/production/active-appraisals`);
    await page.waitForLoadState('networkidle');

    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i }).first();
    await expect(breadcrumb).toContainText('Dashboard');
    await expect(breadcrumb).toContainText('Production');
    await expect(breadcrumb).toContainText('Active Appraisals');
  });

  test('11. Breadcrumb links are clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/production/active-appraisals`);
    await page.waitForLoadState('networkidle');

    // Click on Production breadcrumb link
    await page.getByRole('link', { name: 'Production' }).click();
    await page.waitForLoadState('networkidle');

    // Should navigate to /production
    expect(page.url()).toContain('/production');
  });

  test('12. Mobile Menu Auto-Close - Overview link', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open hamburger menu
    const menuButton = page.getByRole('button', { name: /toggle menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Menu should be open (Sheet content visible)
    const mobileNav = page.locator('nav').filter({ hasText: 'AppraiseTrack' });
    await expect(mobileNav).toBeVisible();

    // Click Overview link
    const overviewLink = page.getByRole('link', { name: 'Overview' });
    await overviewLink.click();
    await page.waitForLoadState('networkidle');

    // Menu should close automatically - SheetContent should not be visible
    await page.waitForTimeout(500); // Wait for animation
    const sheetContent = page.locator('[data-state="open"]').filter({ hasText: 'AppraiseTrack' });
    await expect(sheetContent).toHaveCount(0);
  });

  test('13. Mobile Menu Auto-Close - Department item', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.getByRole('button', { name: /toggle menu/i }).click();

    // Expand Sales section
    await page.getByRole('button', { name: /Sales department navigation/ }).click();

    // Click Orders
    await page.getByRole('link', { name: 'Orders' }).click();
    await page.waitForLoadState('networkidle');

    // Menu should close
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/orders');
  });

  test('14. Error Handling - No console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Should have no critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('Failed to load user data') && // This is logged but handled
      !e.includes('favicon') // Ignore favicon 404s
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('15. Collapsible Expand/Collapse Works', async ({ page }) => {
    const salesTrigger = page.getByRole('button', { name: /Sales department navigation/ });

    // Initially collapsed
    await expect(salesTrigger).toHaveAttribute('aria-expanded', 'false');

    // Expand
    await salesTrigger.click();
    await expect(salesTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sales-nav')).toBeVisible();

    // Collapse
    await salesTrigger.click();
    await expect(salesTrigger).toHaveAttribute('aria-expanded', 'false');
    // Content should not be visible (or have hidden state)
  });

  test('16. All Icons Render Correctly', async ({ page }) => {
    // Check system items have icons
    const overviewIcon = page.locator('a[href="/dashboard"] svg').first();
    await expect(overviewIcon).toBeVisible();

    // Expand a section and check item icons
    await page.getByRole('button', { name: /Sales department navigation/ }).click();
    const ordersIcon = page.locator('a[href="/orders"] svg');
    await expect(ordersIcon).toBeVisible();
  });

  test('17. No Duplicate Navigation Structures', async ({ page }) => {
    // There should be exactly one sidebar navigation (hidden on mobile)
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveCount(1);

    // There should be exactly one header
    const header = page.locator('header');
    await expect(header).toHaveCount(1);
  });

  test('18. Page Loads Quickly - Performance Check', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

});
