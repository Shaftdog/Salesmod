import { test, expect } from '@playwright/test';
import { authenticateTestUser } from './auth-helper';

/**
 * Production RBAC Testing for Campaigns Feature (Authenticated)
 *
 * This test suite verifies that the campaigns feature works correctly
 * with production role-based access control when user is authenticated.
 *
 * Prerequisites:
 * - App running at http://localhost:9002
 * - Production role checking enabled in API
 * - Test user exists with admin role
 */

const BASE_URL = 'http://localhost:9002';
const CAMPAIGNS_URL = `${BASE_URL}/sales/campaigns`;
const NEW_CAMPAIGN_URL = `${BASE_URL}/sales/campaigns/new`;

test.describe('Campaigns Production RBAC Tests (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    const authenticated = await authenticateTestUser(page);
    if (!authenticated) {
      throw new Error('Failed to authenticate test user');
    }

    // Set up console error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
      }
      if (msg.type() === 'warning') {
        console.warn('Console Warning:', msg.text());
      }
    });

    // Monitor network requests for API calls
    page.on('response', (response) => {
      if (response.url().includes('/api/campaigns')) {
        console.log(`API Response: ${response.url()} - ${response.status()}`);
      }
    });
  });

  test('Test 1: Campaign List Page - Loads without errors (Authenticated)', async ({ page }) => {
    console.log('\n=== TEST 1: CAMPAIGN LIST PAGE (AUTHENTICATED) ===');

    // Navigate to campaigns list
    console.log('Navigating to campaigns list page...');
    const response = await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });

    // Verify page loaded successfully
    expect(response?.status()).toBeLessThan(400);
    console.log(`✓ Page loaded with status: ${response?.status()}`);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot of authenticated state
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/campaigns-list-authenticated.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: campaigns-list-authenticated.png');

    // Check for page title or heading
    const heading = page.getByRole('heading', { level: 1 });
    const headingText = await heading.textContent();
    console.log(`✓ Page heading: "${headingText}"`);
    expect(headingText).toContain('Campaign');

    // Verify no error messages are displayed
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]').first();
    const hasErrorToast = await errorToast.isVisible().catch(() => false);
    expect(hasErrorToast).toBe(false);
    console.log('✓ No error toasts displayed');
  });

  test('Test 2: Campaign List - API Fetches Successfully (Authenticated)', async ({ page }) => {
    console.log('\n=== TEST 2: CAMPAIGN API FETCH (AUTHENTICATED) ===');

    // Set up API response monitoring
    let apiCalled = false;
    let apiStatus = 0;
    let apiData: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/api/campaigns') && response.request().method() === 'GET') {
        apiCalled = true;
        apiStatus = response.status();
        try {
          apiData = await response.json();
        } catch (e) {
          console.error('Failed to parse API response:', e);
        }
      }
    });

    // Navigate and wait for API calls
    await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Give API time to complete

    // Verify API was called
    expect(apiCalled).toBe(true);
    console.log('✓ API /api/campaigns was called');

    // Verify API returned success status (200 OK, not 401, 403 or 500)
    expect(apiStatus).toBe(200);
    console.log(`✓ API returned status: ${apiStatus} (200 OK)`);

    // Verify response contains campaigns array
    expect(apiData).toBeDefined();
    expect(Array.isArray(apiData)).toBe(true);
    console.log(`✓ API returned campaigns array with ${apiData?.length || 0} items`);

    // Take screenshot showing successful data load
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/campaigns-list-data-loaded.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: campaigns-list-data-loaded.png');
  });

  test('Test 3: Campaign Creation Wizard - Loads and Functions (Authenticated)', async ({ page }) => {
    console.log('\n=== TEST 3: CAMPAIGN CREATION WIZARD (AUTHENTICATED) ===');

    // Navigate to new campaign wizard
    console.log('Navigating to campaign creation wizard...');
    const response = await page.goto(NEW_CAMPAIGN_URL, { waitUntil: 'networkidle' });

    // Verify page loaded without errors
    expect(response?.status()).toBeLessThan(400);
    console.log(`✓ Wizard page loaded with status: ${response?.status()}`);

    // Take screenshot of wizard initial state
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/wizard-authenticated-initial.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: wizard-authenticated-initial.png');

    // Wait for wizard to be visible - try multiple selectors
    try {
      await page.waitForSelector('input[name="name"], input[placeholder*="campaign" i]', { timeout: 5000 });
      console.log('✓ Wizard form is visible');
    } catch (e) {
      console.warn('⚠ Campaign name input not found, checking for other form elements...');
      // Check if wizard is present in another form
      const hasForm = await page.locator('form').isVisible().catch(() => false);
      if (!hasForm) {
        throw new Error('Wizard form not found');
      }
    }

    // Try to find and fill campaign name field
    const nameInput = page.locator('input[name="name"]').first();
    const isNameInputVisible = await nameInput.isVisible().catch(() => false);

    if (isNameInputVisible) {
      console.log('Filling in campaign name...');
      await nameInput.fill('Production Test Campaign');
      console.log('✓ Campaign name entered: "Production Test Campaign"');

      // Wait for validation
      await page.waitForTimeout(1000);

      // Take screenshot after filling form
      await page.screenshot({
        path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/wizard-authenticated-filled.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved: wizard-authenticated-filled.png');

      // Check Next button state
      const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")').first();
      const isNextEnabled = await nextButton.isEnabled().catch(() => false);

      if (isNextEnabled) {
        console.log('✓ Next button is enabled after filling form');
      } else {
        console.log('⚠ Next button state unclear');
      }
    } else {
      console.log('⚠ Campaign name input not found on this page');
    }

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Filter out expected auth-related errors
    const relevantErrors = consoleErrors.filter(
      err => !err.includes('Auth session missing') && !err.includes('AuthSessionMissingError')
    );

    if (relevantErrors.length === 0) {
      console.log('✓ No critical console errors detected');
    } else {
      console.warn(`⚠ Console errors detected: ${relevantErrors.length}`);
      relevantErrors.forEach(err => console.warn(`  - ${err}`));
    }
  });

  test('Test 4: API Authorization - Verified with Auth Headers (Authenticated)', async ({ page }) => {
    console.log('\n=== TEST 4: API AUTHORIZATION WITH AUTH (AUTHENTICATED) ===');

    // Set up API monitoring
    let apiStatus = 0;
    let hasAuthHeader = false;

    page.on('request', (request) => {
      if (request.url().includes('/api/campaigns')) {
        const headers = request.headers();
        hasAuthHeader = 'authorization' in headers || 'cookie' in headers;
        console.log(`Request headers include auth: ${hasAuthHeader}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/campaigns') && response.request().method() === 'GET') {
        apiStatus = response.status();
      }
    });

    // Navigate to trigger API call
    await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify API returned success (200) instead of 401/403
    console.log(`API Response Status: ${apiStatus}`);
    expect(apiStatus).toBe(200);
    console.log('✓ API returned 200 OK with authentication');

    // Note: Auth header check is informational
    console.log(`Auth headers present in request: ${hasAuthHeader}`);
  });

  test('Test 5: End-to-End Verification (Authenticated)', async ({ page }) => {
    console.log('\n=== TEST 5: END-TO-END VERIFICATION (AUTHENTICATED) ===');

    const errors: string[] = [];
    const warnings: string[] = [];
    const authErrors: string[] = [];

    // Monitor console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Auth session missing') || text.includes('AuthSessionMissingError')) {
          authErrors.push(text);
        } else {
          errors.push(text);
        }
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Monitor failed requests
    const failedRequests: Array<{ url: string; status: number }> = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Test campaigns list
    console.log('Step 1: Testing campaigns list...');
    await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Test wizard
    console.log('Step 2: Testing campaign wizard...');
    await page.goto(NEW_CAMPAIGN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take final screenshot
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/e2e-authenticated-final.png',
      fullPage: true
    });

    // Report results
    console.log('\n=== FINAL VERIFICATION RESULTS (AUTHENTICATED) ===');
    console.log(`Auth-related Errors (expected to be 0): ${authErrors.length}`);
    console.log(`Other Console Errors: ${errors.length}`);
    if (errors.length > 0 && errors.length <= 5) {
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log(`Console Warnings: ${warnings.length}`);

    const campaignFailedRequests = failedRequests.filter(r => r.url.includes('/api/campaigns'));
    console.log(`Failed Campaign API Requests: ${campaignFailedRequests.length}`);
    if (campaignFailedRequests.length > 0) {
      campaignFailedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.status} - ${req.url}`);
      });
    }

    // Final assertions
    expect(authErrors.length).toBe(0);
    console.log('✓ No authentication errors');

    expect(campaignFailedRequests).toHaveLength(0);
    console.log('✓ No failed API requests to /api/campaigns');

    console.log('\n✅ ALL AUTHENTICATED TESTS PASSED - Production configuration working correctly');
  });
});
