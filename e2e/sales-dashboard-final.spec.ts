import { test, expect } from '@playwright/test';

test('Sales Dashboard - Complete Test', async ({ page }) => {
  const BASE_URL = 'http://localhost:9002';
  const LOGIN_EMAIL = 'sherrard@appraisearch.net';
  const LOGIN_PASSWORD = 'Blaisenpals1!';

  test.setTimeout(180000); // 3 minute timeout
  page.setDefaultTimeout(60000); // 60 second timeout for actions

  const consoleMessages: Array<{ type: string; text: string }> = [];

  // Capture all console messages
  page.on('console', msg => {
    const message = { type: msg.type(), text: msg.text() };
    consoleMessages.push(message);
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });

  console.log('\n=== STEP 1: Navigate to Login ===');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/step1-login-page.png',
    fullPage: true
  });
  console.log('✓ Login page loaded');

  console.log('\n=== STEP 2: Fill Login Credentials ===');

  // Wait for email input and fill
  await page.waitForSelector('#email', { state: 'visible' });
  await page.fill('#email', LOGIN_EMAIL);
  console.log('✓ Email filled');

  // Wait for password input and fill
  await page.waitForSelector('#password', { state: 'visible' });
  await page.fill('#password', LOGIN_PASSWORD);
  console.log('✓ Password filled');

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/step2-credentials-filled.png',
    fullPage: true
  });

  console.log('\n=== STEP 3: Submit Login Form ===');

  // Click sign in button
  await page.click('button[type="submit"]:has-text("Sign In")');
  console.log('✓ Login button clicked');

  // Wait for either:
  // 1. Navigation away from login page (success)
  // 2. Error message appears (failure)
  // 3. Timeout
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/step3-after-login-click.png',
    fullPage: true
  });

  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);

  // Check if login was successful by checking if we left the login page
  if (currentUrl.includes('/login')) {
    console.log('⚠ Still on login page - login may have failed');

    // Check for error messages
    const errorElements = await page.locator('[role="status"], .text-destructive, [class*="error"]').all();
    if (errorElements.length > 0) {
      for (const elem of errorElements) {
        const text = await elem.textContent();
        console.log('Error message found:', text);
      }
    }

    // Check console for auth errors
    const authErrors = consoleMessages.filter(msg =>
      msg.type === 'error' && (msg.text.includes('auth') || msg.text.includes('login'))
    );
    if (authErrors.length > 0) {
      console.log('Auth-related console errors:', authErrors);
    }
  } else {
    console.log('✓ Successfully navigated away from login page');
  }

  console.log('\n=== STEP 4: Navigate to Sales Dashboard ===');

  // Navigate to sales page regardless of login state to see what happens
  await page.goto(`${BASE_URL}/sales`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for any redirects or data loading

  const salesUrl = page.url();
  console.log('Sales page URL:', salesUrl);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/step4-sales-page.png',
    fullPage: true
  });

  // Check if we're redirected back to login
  if (salesUrl.includes('/login')) {
    console.log('⚠ Redirected back to login - authentication required');
    console.log('⚠ Cannot test sales dashboard without valid credentials');

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/final-auth-required.png',
      fullPage: true
    });

    // Report the issue
    console.log('\n=== TEST BLOCKED ===');
    console.log('The Sales Dashboard requires authentication.');
    console.log('The provided credentials did not work:');
    console.log(`Email: ${LOGIN_EMAIL}`);
    console.log('Please verify:');
    console.log('1. The user exists in the database');
    console.log('2. The password is correct');
    console.log('3. The user has proper permissions');

    throw new Error('Authentication failed - cannot access /sales page');
  }

  console.log('✓ Sales page loaded successfully');

  console.log('\n=== STEP 5: Analyze Sales Dashboard ===');

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Get page content
  const pageText = await page.textContent('body');
  const pageHTML = await page.locator('body').innerHTML();

  // Check for dashboard components
  const checks = {
    'Contains "Sales"': pageText?.includes('Sales') || false,
    'Contains "Dashboard"': pageText?.includes('Dashboard') || false,
    'Has grid layout': pageHTML.includes('grid'),
    'Has cards': pageHTML.includes('card'),
    'Has charts': pageHTML.includes('chart') || pageHTML.includes('canvas') || pageHTML.includes('svg'),
  };

  console.log('\nPage Content Checks:');
  Object.entries(checks).forEach(([check, result]) => {
    console.log(`${result ? '✓' : '✗'} ${check}`);
  });

  // Look for KPI cards
  const gridItems = await page.locator('[class*="grid"] > div, [class*="grid"] > [class*="card"]').count();
  console.log(`\nGrid items found: ${gridItems}`);

  // Look for charts
  const canvasCount = await page.locator('canvas').count();
  const svgCount = await page.locator('svg').count();
  console.log(`Canvas elements: ${canvasCount}`);
  console.log(`SVG elements: ${svgCount}`);

  // Check for expected dashboard text
  const expectedTexts = [
    'Weekly Orders by Campaign',
    'Monthly Orders by Campaign',
    'Sales by Agent',
    'AMC Client Distribution',
    'Product Distribution',
    'Daily Orders',
    'Weekly Orders',
    'Monthly Orders'
  ];

  console.log('\nExpected Dashboard Components:');
  for (const text of expectedTexts) {
    const found = pageText?.includes(text);
    console.log(`${found ? '✓' : '✗'} "${text}"`);
  }

  // Take full page screenshots
  console.log('\n=== STEP 6: Capture Full Dashboard ===');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/dashboard-top.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/dashboard-middle.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 2 / 3));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/dashboard-lower.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/dashboard-bottom.png',
    fullPage: true
  });

  // Return to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/dashboard-final.png',
    fullPage: true
  });

  console.log('\n=== STEP 7: Test Summary ===');
  console.log(`Total console messages: ${consoleMessages.length}`);
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  console.log(`Console errors: ${errors.length}`);
  console.log(`Console warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nConsole Errors:');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.text}`);
    });
  }

  console.log('\n✓ Test completed successfully');
  console.log('Screenshots saved to: e2e/screenshots/sales-dashboard/');

  // Verify we're on the sales page
  expect(page.url()).toContain('/sales');
});
