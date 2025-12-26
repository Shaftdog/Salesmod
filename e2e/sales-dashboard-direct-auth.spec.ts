import { test, expect } from '@playwright/test';

test('Sales Dashboard - Direct Auth Workaround', async ({ page }) => {
  const BASE_URL = 'http://localhost:9002';
  const LOGIN_EMAIL = 'sherrard@appraisearch.net';
  const LOGIN_PASSWORD = 'Blaisenpals1!';

  test.setTimeout(180000);

  console.log('\n=== Attempting Login with Validation Workaround ===');

  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);

  console.log('Step 1: Fill form using JavaScript evaluation...');

  // Fill form using JavaScript to bypass React state issues
  await page.evaluate(
    ({ email, password }) => {
      const emailInput = document.querySelector('#email') as HTMLInputElement;
      const passwordInput = document.querySelector('#password') as HTMLInputElement;

      if (emailInput && passwordInput) {
        // Set values directly
        emailInput.value = email;
        passwordInput.value = password;

        // Trigger React onChange events
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });

        emailInput.dispatchEvent(inputEvent);
        emailInput.dispatchEvent(changeEvent);

        passwordInput.dispatchEvent(inputEvent);
        passwordInput.dispatchEvent(changeEvent);
      }
    },
    { email: LOGIN_EMAIL, password: LOGIN_PASSWORD }
  );

  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/auth-workaround-1-filled.png',
    fullPage: true
  });

  console.log('Step 2: Submit form using JavaScript...');

  // Submit the form programmatically
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) {
      // Call the submit button's click handler directly
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
      }
    }
  });

  console.log('Step 3: Wait for authentication...');
  await page.waitForTimeout(5000); // Wait longer for auth to complete

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/auth-workaround-2-after-submit.png',
    fullPage: true
  });

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  if (currentUrl.includes('/login')) {
    console.log('⚠ Still on login page');

    // Check for error toast or message
    const toastText = await page.locator('[role="status"], [data-sonner-toast]').textContent().catch(() => null);
    if (toastText) {
      console.log('Error message:', toastText);
    }

    console.log('\n=== Attempting to access /sales directly ===');
  } else {
    console.log('✓ Successfully authenticated!');
    console.log('Redirected to:', currentUrl);
  }

  // Try to access sales page anyway
  await page.goto(`${BASE_URL}/sales`);
  await page.waitForTimeout(3000);

  const salesUrl = page.url();
  console.log('Sales page URL:', salesUrl);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/auth-workaround-3-sales-attempt.png',
    fullPage: true
  });

  if (salesUrl.includes('/login')) {
    console.log('\n⚠ TEST BLOCKED: Authentication required');
    console.log('The credentials provided do not work.');
    console.log('Please verify the user exists and the password is correct.');

    // Try to get more information about why login failed
    console.log('\n=== Debugging Info ===');

    // Check if we can see any network errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Make one more login attempt with detailed logging
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);

    // Enable request logging
    page.on('response', response => {
      const url = response.url();
      if (url.includes('auth') || url.includes('sign')) {
        console.log(`Response: ${response.status()} ${url}`);
      }
    });

    await page.fill('#email', LOGIN_EMAIL);
    await page.fill('#password', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: 'e2e/screenshots/sales-dashboard/auth-workaround-4-debug.png',
      fullPage: true
    });

    throw new Error('Cannot test Sales Dashboard - authentication failed');
  }

  console.log('✓ Sales page accessible!');

  // If we get here, we're authenticated and on the sales page
  console.log('\n=== Testing Sales Dashboard ===');

  await page.waitForTimeout(3000); // Wait for charts to load

  const pageContent = await page.textContent('body');

  // Check for dashboard elements
  const hasContent = {
    sales: pageContent?.includes('Sales'),
    campaigns: pageContent?.includes('Campaign'),
    orders: pageContent?.includes('Orders'),
    agent: pageContent?.includes('Agent'),
  };

  console.log('\nDashboard Content:');
  Object.entries(hasContent).forEach(([key, found]) => {
    console.log(`${found ? '✓' : '✗'} ${key}`);
  });

  // Count visual elements
  const gridCount = await page.locator('[class*="grid"]').count();
  const cardCount = await page.locator('[class*="card"]').count();
  const chartCount = await page.locator('canvas, svg[class*="chart"]').count();

  console.log(`\nGrid elements: ${gridCount}`);
  console.log(`Card elements: ${cardCount}`);
  console.log(`Chart elements: ${chartCount}`);

  // Take comprehensive screenshots
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/success-full-dashboard.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/success-dashboard-middle.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/success-dashboard-bottom.png',
    fullPage: true
  });

  console.log('\n✓ Test completed successfully');
  expect(page.url()).toContain('/sales');
});
