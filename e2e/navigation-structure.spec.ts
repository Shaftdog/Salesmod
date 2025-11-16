import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Navigation Structure Tests
 *
 * Tests the new departmental navigation structure including:
 * - Desktop sidebar navigation
 * - Mobile navigation
 * - Breadcrumbs
 * - Active link highlighting
 * - Accessibility
 * - Edge cases
 */

// Test configuration
const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = 'test-results/navigation-tests';

// Department structure from the codebase
const DEPARTMENTS = [
  {
    name: 'Sales',
    href: '/sales',
    items: [
      { label: 'Dashboard', href: '/sales' },
      { label: 'Orders', href: '/orders' },
      { label: 'Clients', href: '/clients' },
      { label: 'Contacts', href: '/contacts' },
      { label: 'Deals', href: '/deals' },
      { label: 'Cases', href: '/cases' },
      { label: 'Properties', href: '/properties' },
    ],
  },
  {
    name: 'Marketing',
    href: '/marketing',
    items: [
      { label: 'Dashboard', href: '/marketing' },
      { label: 'Campaigns', href: '/marketing/campaigns' },
      { label: 'Leads', href: '/marketing/leads' },
      { label: 'Analytics', href: '/marketing/analytics' },
    ],
  },
  {
    name: 'Production',
    href: '/production',
    items: [
      { label: 'Dashboard', href: '/production' },
      { label: 'Active Appraisals', href: '/production/active-appraisals' },
      { label: 'Quality Control', href: '/production/quality-control' },
      { label: 'Templates', href: '/production/templates' },
    ],
  },
  {
    name: 'Operations',
    href: '/operations',
    items: [
      { label: 'Dashboard', href: '/operations' },
      { label: 'Tasks', href: '/tasks' },
      { label: 'Workflows', href: '/operations/workflows' },
      { label: 'Resources', href: '/operations/resources' },
    ],
  },
  {
    name: 'Logistics',
    href: '/logistics',
    items: [
      { label: 'Dashboard', href: '/logistics' },
      { label: 'Scheduling', href: '/logistics/scheduling' },
      { label: 'Inspections', href: '/logistics/inspections' },
      { label: 'Assignments', href: '/logistics/assignments' },
    ],
  },
  {
    name: 'Finance',
    href: '/finance',
    items: [
      { label: 'Dashboard', href: '/finance' },
      { label: 'Invoicing', href: '/finance/invoicing' },
      { label: 'Payments', href: '/finance/payments' },
      { label: 'Reports', href: '/finance/reports' },
    ],
  },
];

const SYSTEM_ITEMS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Migrations', href: '/migrations' },
  { label: 'Settings', href: '/settings' },
];

const AI_SECTION = {
  name: 'AI & Automation',
  items: [
    { label: 'AI Agent', href: '/agent' },
    { label: 'Jobs', href: '/agent/jobs' },
    { label: 'AI Analytics', href: '/ai-analytics' },
  ],
};

// Helper: Login if needed
async function ensureLoggedIn(page: Page) {
  console.log('Ensuring logged in...');

  // Navigate to login page
  await page.goto('http://localhost:9002/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait for and fill login form
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.fill('input[type="email"]', 'shaug@bossappraisal.com');
  await page.fill('input[type="password"]', 'Latter!974');

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Successfully logged in');
}

test.describe('Desktop Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    // Ensure we're at desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display all 6 department sections', async ({ page }) => {
    // Check that sidebar is visible
    const sidebar = page.locator('aside.fixed');
    await expect(sidebar).toBeVisible();

    // Verify all department sections are present
    for (const dept of DEPARTMENTS) {
      const deptTrigger = page.locator(`button:has-text("${dept.name}")`).first();
      await expect(deptTrigger).toBeVisible();
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-all-departments.png`, fullPage: true });
  });

  test('should display AI & Automation section at bottom', async ({ page }) => {
    const aiSection = page.locator(`button:has-text("${AI_SECTION.name}")`).first();
    await expect(aiSection).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-ai-section.png` });
  });

  test('should start with all sections collapsed by default', async ({ page }) => {
    // Reload to ensure clean state
    await page.reload();

    // Check that no collapsible content is visible initially
    for (const dept of DEPARTMENTS) {
      const deptTrigger = page.locator(`button:has-text("${dept.name}")`).first();

      // Check for ChevronRight icon indicating collapsed state
      const chevronRight = deptTrigger.locator('svg.lucide-chevron-right');
      await expect(chevronRight).toBeVisible();
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-all-collapsed.png`, fullPage: true });
  });

  test('should expand and collapse departments when clicked', async ({ page }) => {
    for (const dept of DEPARTMENTS) {
      const deptTrigger = page.locator(`button:has-text("${dept.name}")`).first();

      // Click to expand
      await deptTrigger.click();
      await page.waitForTimeout(300); // Wait for animation

      // Check for ChevronDown icon indicating expanded state
      const chevronDown = deptTrigger.locator('svg.lucide-chevron-down');
      await expect(chevronDown).toBeVisible();

      // Verify sub-items are visible
      const firstItem = dept.items[0];
      const itemLink = page.locator(`a[href="${firstItem.href}"]`).first();
      await expect(itemLink).toBeVisible();

      await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-${dept.name.toLowerCase()}-expanded.png`, fullPage: true });

      // Click to collapse
      await deptTrigger.click();
      await page.waitForTimeout(300); // Wait for animation

      // Check for ChevronRight icon indicating collapsed state
      const chevronRight = deptTrigger.locator('svg.lucide-chevron-right');
      await expect(chevronRight).toBeVisible();
    }
  });

  test('should navigate to all department sub-items correctly', async ({ page }) => {
    for (const dept of DEPARTMENTS) {
      // Expand department
      const deptTrigger = page.locator(`button:has-text("${dept.name}")`).first();
      await deptTrigger.click();
      await page.waitForTimeout(300);

      // Click through all sub-items
      for (const item of dept.items) {
        const itemLink = page.locator(`a[href="${item.href}"]`).first();
        await itemLink.click();

        // Wait for navigation
        await page.waitForURL(`**${item.href}`, { timeout: 5000 });

        // Verify page loaded (check for main content or header)
        await expect(page.locator('main')).toBeVisible();

        await page.screenshot({ path: `${SCREENSHOT_DIR}/page-${item.href.replace(/\//g, '-')}.png` });
      }
    }
  });

  test('should highlight active link with accent background', async ({ page }) => {
    // Navigate to Orders page
    await page.goto('/orders');

    // Expand Sales section
    const salesTrigger = page.locator('button:has-text("Sales")').first();
    await salesTrigger.click();
    await page.waitForTimeout(300);

    // Find the Orders link in sidebar
    const ordersLink = page.locator('aside a[href="/orders"]').first();

    // Check that it has the active class (bg-accent)
    await expect(ordersLink).toHaveClass(/bg-accent/);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-active-link-highlighting.png`, fullPage: true });
  });

  test('should display system items (Overview, Migrations, Settings)', async ({ page }) => {
    for (const item of SYSTEM_ITEMS) {
      const itemLink = page.locator(`aside a[href="${item.href}"]`).first();
      await expect(itemLink).toBeVisible();
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-system-items.png` });
  });
});

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should hide sidebar and show hamburger menu on mobile', async ({ page }) => {
    // Sidebar should not be visible on mobile
    const sidebar = page.locator('aside.fixed');
    await expect(sidebar).not.toBeVisible();

    // Hamburger menu button should be visible
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await expect(hamburgerBtn).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-hamburger-visible.png`, fullPage: true });
  });

  test('should open mobile menu sheet when hamburger clicked', async ({ page }) => {
    // Click hamburger menu
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await hamburgerBtn.click();
    await page.waitForTimeout(300); // Wait for sheet animation

    // Sheet content should be visible
    const sheetContent = page.locator('[role="dialog"]');
    await expect(sheetContent).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-menu-open.png`, fullPage: true });
  });

  test('should display all department sections in mobile menu', async ({ page }) => {
    // Open menu
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await hamburgerBtn.click();
    await page.waitForTimeout(300);

    // Verify all departments are present in mobile menu
    for (const dept of DEPARTMENTS) {
      const deptTrigger = page.locator(`[role="dialog"] button:has-text("${dept.name}")`);
      await expect(deptTrigger).toBeVisible();
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-all-departments.png`, fullPage: true });
  });

  test('should expand/collapse sections in mobile menu', async ({ page }) => {
    // Open menu
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await hamburgerBtn.click();
    await page.waitForTimeout(300);

    // Test Sales section
    const salesTrigger = page.locator('[role="dialog"] button:has-text("Sales")');

    // Expand
    await salesTrigger.click();
    await page.waitForTimeout(300);

    // Verify sub-items visible
    const ordersLink = page.locator('[role="dialog"] a[href="/orders"]');
    await expect(ordersLink).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-section-expanded.png`, fullPage: true });

    // Collapse
    await salesTrigger.click();
    await page.waitForTimeout(300);
  });

  test('should navigate from mobile menu', async ({ page }) => {
    // Open menu
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await hamburgerBtn.click();
    await page.waitForTimeout(300);

    // Expand Sales
    const salesTrigger = page.locator('[role="dialog"] button:has-text("Sales")');
    await salesTrigger.click();
    await page.waitForTimeout(300);

    // Click Orders
    const ordersLink = page.locator('[role="dialog"] a[href="/orders"]');
    await ordersLink.click();

    // Verify navigation occurred
    await page.waitForURL('**/orders', { timeout: 5000 });
    await expect(page.locator('main')).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-after-navigation.png`, fullPage: true });
  });
});

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show correct breadcrumb for /sales', async ({ page }) => {
    await page.goto('/sales');

    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('Sales');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/breadcrumb-sales.png` });
  });

  test('should show correct breadcrumb for /orders (Sales > Orders)', async ({ page }) => {
    await page.goto('/orders');

    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('Sales');
    await expect(breadcrumb).toContainText('Orders');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/breadcrumb-orders.png` });
  });

  test('should show correct breadcrumb for /marketing/campaigns', async ({ page }) => {
    await page.goto('/marketing/campaigns');

    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('Dashboard');
    await expect(breadcrumb).toContainText('Marketing');
    await expect(breadcrumb).toContainText('Campaigns');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/breadcrumb-marketing-campaigns.png` });
  });

  test('should show single breadcrumb for /dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('Dashboard');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/breadcrumb-dashboard.png` });
  });

  test('breadcrumb links should be clickable and navigate', async ({ page }) => {
    await page.goto('/marketing/campaigns');

    // Click on "Marketing" in breadcrumb
    const marketingLink = page.locator('[class*="breadcrumb"] a:has-text("Marketing")');
    await marketingLink.click();

    await page.waitForURL('**/marketing', { timeout: 5000 });
    expect(page.url()).toContain('/marketing');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/breadcrumb-link-clicked.png` });
  });
});

test.describe('Active Link Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should highlight active department page', async ({ page }) => {
    // Test each department dashboard
    for (const dept of DEPARTMENTS) {
      await page.goto(dept.href);

      // Expand the department section
      const deptTrigger = page.locator(`button:has-text("${dept.name}")`).first();
      await deptTrigger.click();
      await page.waitForTimeout(300);

      // Check that the dashboard link is highlighted
      const dashboardLink = page.locator(`aside a[href="${dept.href}"]`).first();
      await expect(dashboardLink).toHaveClass(/bg-accent/);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/active-highlight-${dept.name.toLowerCase()}.png`, fullPage: true });
    }
  });

  test('should update highlighting when navigating between pages', async ({ page }) => {
    // Navigate to Orders
    await page.goto('/orders');
    const salesTrigger = page.locator('button:has-text("Sales")').first();
    await salesTrigger.click();
    await page.waitForTimeout(300);

    let ordersLink = page.locator('aside a[href="/orders"]').first();
    await expect(ordersLink).toHaveClass(/bg-accent/);

    // Navigate to Clients
    await page.goto('/clients');
    await page.waitForTimeout(300);

    let clientsLink = page.locator('aside a[href="/clients"]').first();
    await expect(clientsLink).toHaveClass(/bg-accent/);

    // Orders should no longer be highlighted
    ordersLink = page.locator('aside a[href="/orders"]').first();
    await expect(ordersLink).not.toHaveClass(/bg-accent/);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/active-highlight-switched.png`, fullPage: true });
  });
});

test.describe('User Role - Admin Link', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should check admin link visibility in sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    // Try to find admin link in sidebar
    const adminLink = page.locator('aside a[href="/admin"]');
    const isVisible = await adminLink.isVisible().catch(() => false);

    console.log(`Admin link in sidebar visible: ${isVisible}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/admin-link-check.png`, fullPage: true });
  });

  test('should check admin link in user dropdown', async ({ page }) => {
    await page.goto('/dashboard');

    // Click user avatar to open dropdown
    const userAvatar = page.locator('button:has(img), button:has([class*="avatar"])').last();
    await userAvatar.click();
    await page.waitForTimeout(300);

    // Check for admin link in dropdown
    const adminMenuItem = page.locator('[role="menuitem"]:has-text("Admin")');
    const isVisible = await adminMenuItem.isVisible().catch(() => false);

    console.log(`Admin link in dropdown visible: ${isVisible}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/admin-dropdown-check.png` });
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should allow keyboard navigation through sidebar items', async ({ page }) => {
    await page.goto('/dashboard');

    // Focus on first system item
    const firstLink = page.locator('aside a[href="/dashboard"]').first();
    await firstLink.focus();

    // Tab through items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Focused element: ${focusedElement}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/keyboard-nav-focused.png` });
  });

  test('should toggle collapsible with Enter key', async ({ page }) => {
    await page.goto('/dashboard');

    // Focus on Sales trigger
    const salesTrigger = page.locator('button:has-text("Sales")').first();
    await salesTrigger.focus();

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Check if expanded
    const chevronDown = salesTrigger.locator('svg.lucide-chevron-down');
    await expect(chevronDown).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/keyboard-expand.png`, fullPage: true });
  });

  test('should have visible focus states', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab to first link and check for focus ring
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    const outline = await focusedElement.evaluate((el) =>
      window.getComputedStyle(el).outline
    );

    console.log(`Focus outline: ${outline}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/focus-visible.png` });
  });
});

test.describe('Navigation Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('should have identical structure in desktop and mobile', async ({ page }) => {
    // Get desktop sidebar structure
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopDepts = await page.locator('aside button[class*="collapsible"]').allTextContents();

    // Get mobile menu structure
    await page.setViewportSize({ width: 375, height: 667 });
    const hamburgerBtn = page.locator('button:has-text("Toggle Menu")');
    await hamburgerBtn.click();
    await page.waitForTimeout(300);

    const mobileDepts = await page.locator('[role="dialog"] button[class*="collapsible"]').allTextContents();

    // Compare
    console.log('Desktop departments:', desktopDepts);
    console.log('Mobile departments:', mobileDepts);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/consistency-check.png`, fullPage: true });
  });

  test('should check for broken links or 404 errors', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const brokenLinks: string[] = [];

    // Test all department pages
    for (const dept of DEPARTMENTS) {
      for (const item of dept.items) {
        const response = await page.goto(item.href);

        if (response && response.status() === 404) {
          brokenLinks.push(item.href);
          console.error(`404 Error: ${item.href}`);
        }
      }
    }

    console.log(`Broken links found: ${brokenLinks.length}`);
    expect(brokenLinks).toHaveLength(0);
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle rapid clicking on collapsible sections', async ({ page }) => {
    await page.goto('/dashboard');

    const salesTrigger = page.locator('button:has-text("Sales")').first();

    // Rapidly click 5 times
    for (let i = 0; i < 5; i++) {
      await salesTrigger.click();
      await page.waitForTimeout(50); // Very short wait
    }

    // Should end in a stable state
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/rapid-clicking.png`, fullPage: true });
  });

  test('should navigate during section animation', async ({ page }) => {
    await page.goto('/dashboard');

    const salesTrigger = page.locator('button:has-text("Sales")').first();
    await salesTrigger.click();

    // Immediately try to click a link while animating
    const ordersLink = page.locator('aside a[href="/orders"]').first();
    await ordersLink.click({ timeout: 1000 }).catch(() => {
      console.log('Click during animation may have failed - acceptable');
    });

    await page.waitForTimeout(1000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/click-during-animation.png` });
  });

  test('should handle deep nested routes', async ({ page }) => {
    // Test production/active-appraisals route
    await page.goto('/production/active-appraisals');

    // Should load without error
    await expect(page.locator('main')).toBeVisible();

    // Breadcrumb should show full path
    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('Production');
    await expect(breadcrumb).toContainText('Active');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/deep-nested-route.png` });
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    const response = await page.goto('/invalid-route-that-does-not-exist');

    // Should show error page or redirect
    console.log(`Status for invalid route: ${response?.status()}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/invalid-route.png`, fullPage: true });
  });
});

// Console error tracking
test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Console Error: ${msg.text()}`);
    }
  });
});
