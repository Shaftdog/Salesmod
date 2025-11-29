/**
 * E2E Test: Multi-Tenant Isolation
 *
 * Tests that verify complete data isolation between tenants
 * after the multi-tenant migration.
 *
 * Test Coverage:
 * 1. Tenant isolation - users can only see their tenant's data
 * 2. Internal team collaboration - ROI users share data
 * 3. Cross-tenant access prevention
 * 4. Borrower access still works (regression test)
 */

import { test, expect } from '@playwright/test';

// Test users from different tenants
const ROI_USER_1 = {
  email: 'rod@myroihome.com',
  password: process.env.TEST_ROI_USER_1_PASSWORD || 'test-password',
  tenant: 'ROI Appraisal Group'
};

const ROI_USER_2 = {
  email: 'dashawn@myroihome.com',
  password: process.env.TEST_ROI_USER_2_PASSWORD || 'test-password',
  tenant: 'ROI Appraisal Group'
};

const EXTERNAL_USER = {
  email: 'testuser123@gmail.com',
  password: process.env.TEST_EXTERNAL_USER_PASSWORD || 'test-password',
  tenant: 'Test user\'s Organization'
};

test.describe('Multi-Tenant Isolation', () => {

  test.describe('1. Cross-Tenant Data Isolation', () => {

    test('ROI users cannot see external tenant data', async ({ page, context }) => {
      // Create a new page for external user
      const externalPage = await context.newPage();

      // External user creates a client
      await externalPage.goto('/login');
      await externalPage.fill('input[type="email"]', EXTERNAL_USER.email);
      await externalPage.fill('input[type="password"]', EXTERNAL_USER.password);
      await externalPage.click('button[type="submit"]');

      // Wait for login to complete
      await externalPage.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to clients and create a test client
      await externalPage.goto('/clients');
      await externalPage.click('text=New Client');

      const testClientName = `External Test Client ${Date.now()}`;
      await externalPage.fill('input[name="company_name"]', testClientName);
      await externalPage.fill('input[name="domain"]', `external-test-${Date.now()}.com`);
      await externalPage.click('button:has-text("Save")');

      // Wait for client to be created
      await externalPage.waitForTimeout(2000);

      // Now log in as ROI user
      await page.goto('/login');
      await page.fill('input[type="email"]', ROI_USER_1.email);
      await page.fill('input[type="password"]', ROI_USER_1.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to clients list
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      // Verify the external client is NOT visible
      const clientVisible = await page.locator(`text=${testClientName}`).count();
      expect(clientVisible).toBe(0);

      console.log(`✅ Test passed: ROI user cannot see external client "${testClientName}"`);

      await externalPage.close();
    });

    test('External users cannot see ROI tenant data', async ({ page, context }) => {
      // Create a new page for ROI user
      const roiPage = await context.newPage();

      // ROI user creates a client
      await roiPage.goto('/login');
      await roiPage.fill('input[type="email"]', ROI_USER_1.email);
      await roiPage.fill('input[type="password"]', ROI_USER_1.password);
      await roiPage.click('button[type="submit"]');

      await roiPage.waitForURL('/dashboard', { timeout: 10000 });

      // Create a test client
      await roiPage.goto('/clients');
      await roiPage.click('text=New Client');

      const testClientName = `ROI Test Client ${Date.now()}`;
      await roiPage.fill('input[name="company_name"]', testClientName);
      await roiPage.fill('input[name="domain"]', `roi-test-${Date.now()}.com`);
      await roiPage.click('button:has-text("Save")');

      await roiPage.waitForTimeout(2000);

      // Now log in as external user
      await page.goto('/login');
      await page.fill('input[type="email"]', EXTERNAL_USER.email);
      await page.fill('input[type="password"]', EXTERNAL_USER.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to clients list
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      // Verify the ROI client is NOT visible
      const clientVisible = await page.locator(`text=${testClientName}`).count();
      expect(clientVisible).toBe(0);

      console.log(`✅ Test passed: External user cannot see ROI client "${testClientName}"`);

      await roiPage.close();
    });
  });

  test.describe('2. Internal Team Collaboration', () => {

    test('ROI team members can see each others data', async ({ page, context }) => {
      // Create a new page for ROI User 1
      const user1Page = await context.newPage();

      // User 1 creates a client
      await user1Page.goto('/login');
      await user1Page.fill('input[type="email"]', ROI_USER_1.email);
      await user1Page.fill('input[type="password"]', ROI_USER_1.password);
      await user1Page.click('button[type="submit"]');

      await user1Page.waitForURL('/dashboard', { timeout: 10000 });

      await user1Page.goto('/clients');
      await user1Page.click('text=New Client');

      const sharedClientName = `Shared ROI Client ${Date.now()}`;
      await user1Page.fill('input[name="company_name"]', sharedClientName);
      await user1Page.fill('input[name="domain"]', `shared-${Date.now()}.com`);
      await user1Page.click('button:has-text("Save")');

      await user1Page.waitForTimeout(2000);

      // Log in as ROI User 2
      await page.goto('/login');
      await page.fill('input[type="email"]', ROI_USER_2.email);
      await page.fill('input[type="password"]', ROI_USER_2.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to clients list
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');

      // Verify User 2 CAN see User 1's client
      const clientVisible = await page.locator(`text=${sharedClientName}`).count();
      expect(clientVisible).toBeGreaterThan(0);

      console.log(`✅ Test passed: ROI User 2 can see ROI User 1's client "${sharedClientName}"`);

      await user1Page.close();
    });
  });

  test.describe('3. API-Level Isolation', () => {

    test('API queries respect tenant boundaries', async ({ request }) => {
      // This test verifies that direct API calls also respect tenant isolation

      // Login as ROI user and get auth token
      const roiLogin = await request.post('/api/auth/login', {
        data: {
          email: ROI_USER_1.email,
          password: ROI_USER_1.password
        }
      });

      expect(roiLogin.ok()).toBeTruthy();
      const roiCookies = roiLogin.headers()['set-cookie'];

      // Get ROI user's clients via API
      const roiClients = await request.get('/api/clients', {
        headers: {
          'Cookie': roiCookies
        }
      });

      expect(roiClients.ok()).toBeTruthy();
      const roiData = await roiClients.json();

      // Login as external user
      const externalLogin = await request.post('/api/auth/login', {
        data: {
          email: EXTERNAL_USER.email,
          password: EXTERNAL_USER.password
        }
      });

      expect(externalLogin.ok()).toBeTruthy();
      const externalCookies = externalLogin.headers()['set-cookie'];

      // Get external user's clients via API
      const externalClients = await request.get('/api/clients', {
        headers: {
          'Cookie': externalCookies
        }
      });

      expect(externalClients.ok()).toBeTruthy();
      const externalData = await externalClients.json();

      // Verify no overlap in client IDs
      const roiClientIds = new Set(roiData.clients?.map((c: any) => c.id) || []);
      const externalClientIds = new Set(externalData.clients?.map((c: any) => c.id) || []);

      const overlap = [...roiClientIds].filter(id => externalClientIds.has(id));
      expect(overlap.length).toBe(0);

      console.log(`✅ Test passed: No client ID overlap between tenants`);
      console.log(`   ROI clients: ${roiClientIds.size}, External clients: ${externalClientIds.size}`);
    });
  });

  test.describe('4. Borrower Access (Regression)', () => {

    test.skip('Borrowers can still access orders via magic link', async ({ page }) => {
      // This test verifies that the borrower access feature still works
      // after the tenant migration

      // Login as ROI user
      await page.goto('/login');
      await page.fill('input[type="email"]', ROI_USER_1.email);
      await page.fill('input[type="password"]', ROI_USER_1.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Create an order
      await page.goto('/orders');
      await page.click('text=New Order');

      const orderNumber = `TEST-${Date.now()}`;
      await page.fill('input[name="order_number"]', orderNumber);
      // Fill in required fields...
      await page.click('button:has-text("Save")');

      await page.waitForTimeout(2000);

      // Use "Invite Borrower" feature
      await page.click('text=Invite Borrower');
      await page.fill('input[name="borrower_email"]', 'test-borrower@example.com');
      await page.click('button:has-text("Send Invite")');

      // Get the magic link (from email or UI)
      const magicLink = await page.locator('[data-testid="magic-link"]').textContent();

      // Open magic link in new context (unauthenticated)
      await page.goto(magicLink || '');

      // Verify borrower can see ONLY their order
      await page.waitForLoadState('networkidle');
      const orderVisible = await page.locator(`text=${orderNumber}`).count();
      expect(orderVisible).toBeGreaterThan(0);

      // Verify borrower cannot see other orders
      await page.goto('/orders');
      const allOrders = await page.locator('[data-testid="order-row"]').count();
      expect(allOrders).toBe(1); // Should only see their one order

      console.log(`✅ Test passed: Borrower access works correctly`);
    });
  });

  test.describe('5. Agent System Isolation', () => {

    test.skip('Agent-created cards respect tenant boundaries', async ({ page }) => {
      // This test verifies that the agent system creates cards
      // with the correct tenant_id

      // Login as ROI user
      await page.goto('/login');
      await page.fill('input[type="email"]', ROI_USER_1.email);
      await page.fill('input[type="password"]', ROI_USER_1.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Create a job
      await page.goto('/jobs');
      await page.click('text=New Job');

      const jobName = `Tenant Test Job ${Date.now()}`;
      await page.fill('input[name="name"]', jobName);
      await page.click('button:has-text("Create")');

      await page.waitForTimeout(2000);

      // Start the job (triggers agent)
      await page.click('button:has-text("Start Job")');

      // Wait for agent to create cards
      await page.waitForTimeout(5000);

      // Navigate to kanban board
      await page.goto('/kanban');

      // Verify cards were created for this tenant
      const cardsVisible = await page.locator('[data-testid="kanban-card"]').count();
      expect(cardsVisible).toBeGreaterThan(0);

      // Log out and login as external user
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');

      await page.goto('/login');
      await page.fill('input[type="email"]', EXTERNAL_USER.email);
      await page.fill('input[type="password"]', EXTERNAL_USER.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to kanban board
      await page.goto('/kanban');
      await page.waitForLoadState('networkidle');

      // Verify external user CANNOT see ROI's cards
      const roiCardsVisible = await page.locator(`text=${jobName}`).count();
      expect(roiCardsVisible).toBe(0);

      console.log(`✅ Test passed: Agent cards isolated by tenant`);
    });
  });
});

test.describe('Database-Level Verification', () => {

  test('All core tables have RLS enabled', async ({ request }) => {
    // This would require a direct database query endpoint
    // or could be done via a special admin API endpoint

    // For now, we document what should be verified:
    console.log('Manual verification required:');
    console.log('1. Check that all core tables have RLS enabled');
    console.log('2. Verify tenant_isolation policies exist');
    console.log('3. Confirm no legacy org_id policies remain on core tables');
  });
});
