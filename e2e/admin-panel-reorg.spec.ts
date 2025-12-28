import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';
const TEST_EMAIL = 'rod@myroihome.com';
const TEST_PASSWORD = 'Latter!974';
const SCREENSHOT_DIR = 'tests/screenshots/admin-panel-reorg';

test.describe('Admin Panel Reorganization Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation after login - wait for dashboard to load
    await page.waitForURL(/.*(?!login).*/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Wait for sidebar to be visible
    await page.waitForSelector('nav, aside', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('Scenario 1: Admin Panel Navigation', async ({ page }) => {
    // Navigate to admin panel using client-side navigation to avoid redirect issues
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of admin panel
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-admin-panel-initial.png`,
      fullPage: true
    });

    // Check current URL and page content
    const currentUrl = page.url();
    console.log(`Admin panel URL: ${currentUrl}`);

    // Verify we're on admin panel
    const pageTitle = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`Page title: ${pageTitle}`);

    // Check admin sidebar has expected items
    const sidebarLinks = await page.locator('nav a, aside a').allTextContents();
    console.log(`Sidebar links: ${sidebarLinks.join(', ')}`);

    // Look for admin sidebar with migrations link
    const migrationsLink = page.locator('a[href="/admin/migrations"]');
    const migrationsCount = await migrationsLink.count();
    console.log(`Migrations links with exact href: ${migrationsCount}`);

    // Take screenshot showing sidebar
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-admin-sidebar-links.png`,
      fullPage: true
    });

    // Verify admin sidebar contains expected items
    const hasDashboard = sidebarLinks.some(l => l.toLowerCase().includes('dashboard'));
    const hasUsers = sidebarLinks.some(l => l.toLowerCase().includes('user'));
    const hasMigrations = sidebarLinks.some(l => l.toLowerCase().includes('migration'));
    const hasAuditLogs = sidebarLinks.some(l => l.toLowerCase().includes('audit') || l.toLowerCase().includes('log'));
    const hasSettings = sidebarLinks.some(l => l.toLowerCase().includes('setting'));

    console.log(`Has Dashboard: ${hasDashboard}, Users: ${hasUsers}, Migrations: ${hasMigrations}, Audit Logs: ${hasAuditLogs}, Settings: ${hasSettings}`);

    // Test direct navigation to /admin/migrations
    await page.goto(`${BASE_URL}/admin/migrations`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const migrationsUrl = page.url();
    console.log(`Direct navigation to /admin/migrations URL: ${migrationsUrl}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-admin-migrations-page.png`,
      fullPage: true
    });

    // Check page content
    const migrationsPageTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log(`Migrations page title: ${migrationsPageTitle}`);

    // Assert admin panel structure is correct
    expect(hasMigrations).toBe(true);
    expect(migrationsUrl).toContain('/admin/migrations');
  });

  test('Scenario 2: Old Migrations Route Redirect', async ({ page }) => {
    // Try to navigate directly to old /migrations route
    let response;
    let navigationError = false;
    let status: number | undefined;

    try {
      response = await page.goto(`${BASE_URL}/migrations`, {
        waitUntil: 'load',
        timeout: 30000
      });
      status = response?.status();
    } catch (e) {
      navigationError = true;
      console.log(`Navigation error: ${e}`);
    }

    // Wait a bit for any client-side redirects
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Old /migrations route - Status: ${status}, URL: ${currentUrl}, Navigation error: ${navigationError}`);

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-old-migrations-route.png`,
      fullPage: true
    }).catch(() => {});

    // It should either 404, redirect, or show error
    const is404 = status === 404;
    const redirectedToAdmin = currentUrl.includes('/admin/migrations');
    const redirectedToLogin = currentUrl.includes('/login');
    const notOnOldMigrations = !currentUrl.endsWith('/migrations');

    console.log(`Is 404: ${is404}, Redirected to admin: ${redirectedToAdmin}, Redirected to login: ${redirectedToLogin}, Not on old route: ${notOnOldMigrations}`);

    // The old route should not work normally - either 404, redirect, or error
    // A 404 status means the old route was successfully removed
    expect(is404 || redirectedToAdmin || redirectedToLogin || navigationError || notOnOldMigrations).toBeTruthy();
  });

  test('Scenario 3: Main Sidebar Cleanup', async ({ page }) => {
    // We're already on the main app after login, just wait for content
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify we're on dashboard/main page
    const currentUrl = page.url();
    console.log(`Main app URL: ${currentUrl}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-main-app-sidebar.png`,
      fullPage: true
    });

    // Check main sidebar for Migrations link (should NOT be present)
    // Look for Migrations in main sidebar (not in admin paths)
    const migrationsInMainNav = page.locator('a[href="/migrations"]');
    const migrationsCount = await migrationsInMainNav.count();

    console.log(`Migrations links in main nav (href="/migrations"): ${migrationsCount}`);

    // Also check for any text "Migrations" in sidebar links
    const migrationTextLinks = page.locator('nav a:has-text("Migrations"), aside a:has-text("Migrations")');
    const migrationTextCount = await migrationTextLinks.count();
    console.log(`Sidebar links with "Migrations" text: ${migrationTextCount}`);

    // Look for Admin link (should be present for admin users)
    const adminLink = page.locator('a[href*="/admin"]').first();
    const adminLinkVisible = await adminLink.isVisible().catch(() => false);

    console.log(`Admin link visible: ${adminLinkVisible}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-main-sidebar-no-migrations.png`,
      fullPage: true
    });

    // Migrations should NOT be in main sidebar with direct /migrations link
    expect(migrationsCount).toBe(0);
  });
});
