import { test, expect } from '@playwright/test';

/**
 * Production RBAC Testing for Campaigns Feature
 *
 * This test suite verifies that the campaigns feature works correctly
 * with production role-based access control enabled.
 *
 * Prerequisites:
 * - App running at http://localhost:9002
 * - Production role checking enabled in API
 * - All users have admin role in database
 */

const BASE_URL = 'http://localhost:9002';
const CAMPAIGNS_URL = `${BASE_URL}/sales/campaigns`;
const NEW_CAMPAIGN_URL = `${BASE_URL}/sales/campaigns/new`;

test.describe('Campaigns Production RBAC Tests', () => {
  test.beforeEach(async ({ page }) => {
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

  test('Test 1: Campaign List Page - Loads without errors', async ({ page }) => {
    console.log('\n=== TEST 1: CAMPAIGN LIST PAGE ===');

    // Navigate to campaigns list
    console.log('Navigating to campaigns list page...');
    const response = await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });

    // Verify page loaded successfully
    expect(response?.status()).toBeLessThan(400);
    console.log(`✓ Page loaded with status: ${response?.status()}`);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/campaigns-list-initial.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: campaigns-list-initial.png');

    // Check for page title or heading
    const heading = page.getByRole('heading', { level: 1 });
    const headingText = await heading.textContent();
    console.log(`✓ Page heading: "${headingText}"`);

    // Verify no error messages are displayed
    const errorMessage = page.locator('text=/error|failed|forbidden/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    console.log('✓ No error messages displayed on page');
  });

  test('Test 2: Campaign List - API Fetches Successfully', async ({ page }) => {
    console.log('\n=== TEST 2: CAMPAIGN API FETCH ===');

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

    // Verify API returned success status (200 OK, not 403 or 500)
    expect(apiStatus).toBe(200);
    console.log(`✓ API returned status: ${apiStatus} (200 OK)`);

    // Verify response contains campaigns array
    expect(apiData).toBeDefined();
    expect(Array.isArray(apiData)).toBe(true);
    console.log(`✓ API returned campaigns array with ${apiData?.length || 0} items`);

    // Take screenshot showing successful data load
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/campaigns-list-loaded.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: campaigns-list-loaded.png');
  });

  test('Test 3: Campaign Creation Wizard - Loads and Functions', async ({ page }) => {
    console.log('\n=== TEST 3: CAMPAIGN CREATION WIZARD ===');

    // Navigate to new campaign wizard
    console.log('Navigating to campaign creation wizard...');
    const response = await page.goto(NEW_CAMPAIGN_URL, { waitUntil: 'networkidle' });

    // Verify page loaded without errors
    expect(response?.status()).toBeLessThan(400);
    console.log(`✓ Wizard page loaded with status: ${response?.status()}`);

    // Take screenshot of wizard initial state
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/wizard-initial.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: wizard-initial.png');

    // Wait for wizard to be visible
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    console.log('✓ Wizard form is visible');

    // Fill in campaign name
    console.log('Filling in campaign name...');
    await page.fill('input[name="name"]', 'Production Test Campaign');
    console.log('✓ Campaign name entered: "Production Test Campaign"');

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // Take screenshot after filling form
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/wizard-filled.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: wizard-filled.png');

    // Look for Next button (could be a button or link)
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    const isNextEnabled = await nextButton.isEnabled().catch(() => false);

    if (isNextEnabled) {
      console.log('✓ Next button is enabled');
    } else {
      console.log('⚠ Next button state unclear - may need interaction');
    }

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.warn(`⚠ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.warn(`  - ${err}`));
    }
  });

  test('Test 4: API Authorization - Direct API Call', async ({ request }) => {
    console.log('\n=== TEST 4: API AUTHORIZATION ===');

    // Make direct API call to GET /api/campaigns
    console.log('Making direct API call to /api/campaigns...');

    const response = await request.get(`${BASE_URL}/api/campaigns`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    // Verify response status
    const status = response.status();
    console.log(`API Response Status: ${status}`);

    // Should return 200 OK (not 403 Forbidden or 500 Internal Server Error)
    expect(status).toBe(200);
    console.log('✓ API returned 200 OK (authorized)');

    // Verify response is valid JSON
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    console.log(`✓ API returned valid JSON array with ${data.length} items`);

    // Log response headers for debugging
    const headers = response.headers();
    console.log('Response Headers:');
    console.log(`  - content-type: ${headers['content-type']}`);
    console.log(`  - content-length: ${headers['content-length']}`);
  });

  test('Test 5: End-to-End Verification', async ({ page }) => {
    console.log('\n=== TEST 5: END-TO-END VERIFICATION ===');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Monitor console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
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
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/e2e-final.png',
      fullPage: true
    });

    // Report results
    console.log('\n=== FINAL VERIFICATION RESULTS ===');
    console.log(`Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log(`Console Warnings: ${warnings.length}`);
    if (warnings.length > 0 && warnings.length <= 5) {
      warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }

    console.log(`Failed HTTP Requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      failedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.status} - ${req.url}`);
      });
    }

    // Final assertions
    expect(failedRequests.filter(r => r.url.includes('/api/campaigns'))).toHaveLength(0);
    console.log('✓ No failed API requests to /api/campaigns');
  });
});
