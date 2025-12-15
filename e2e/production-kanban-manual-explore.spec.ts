import { test } from '@playwright/test';

/**
 * Manual exploration test - runs with visible browser (headed mode)
 * to see what's actually happening
 */
test('Manual exploration of production pages', async ({ page }) => {
  // Use a very long timeout
  test.setTimeout(300000); // 5 minutes

  console.log('\n=== MANUAL EXPLORATION TEST ===');
  console.log('Browser will stay open for manual testing');
  console.log('Navigate to pages manually and observe behavior\n');

  // Start at home page
  console.log('1. Loading home page...');
  try {
    await page.goto('http://localhost:3000/', { timeout: 15000 });
    console.log(`   Current URL: ${page.url()}`);
  } catch (error) {
    console.log(`   ERROR: ${error}`);
  }

  await page.waitForTimeout(3000);
  await page.screenshot({
    path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/manual-01-home.png',
    fullPage: true
  });

  // Try login page
  console.log('\n2. Navigating to /login...');
  try {
    await page.goto('http://localhost:3000/login', { timeout: 15000 });
    console.log(`   Current URL: ${page.url()}`);
  } catch (error) {
    console.log(`   ERROR: ${error}`);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/manual-02-login.png',
    fullPage: true
  });

  // Try to navigate to production WITHOUT logging in
  console.log('\n3. Attempting /production without auth...');
  try {
    const response = await page.goto('http://localhost:3000/production', {
      timeout: 15000,
      waitUntil: 'domcontentloaded'
    });
    console.log(`   Response status: ${response?.status()}`);
    console.log(`   Current URL: ${page.url()}`);
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
    console.log(`   Current URL: ${page.url()}`);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/manual-03-production-no-auth.png',
    fullPage: true
  });

  // Check if we're on login page
  if (page.url().includes('/login')) {
    console.log('\n4. Redirected to login - attempting to log in...');

    // Look for email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();

    if (await emailField.count() > 0) {
      console.log('   Found email field');
      await emailField.fill('test@appraisetrack.com');

      if (await passwordField.count() > 0) {
        console.log('   Found password field');
        await passwordField.fill('TestPassword123!');

        await page.screenshot({
          path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/manual-04-login-filled.png',
          fullPage: true
        });

        if (await submitButton.count() > 0) {
          console.log('   Found submit button, clicking...');
          await submitButton.click();
          await page.waitForTimeout(3000);

          console.log(`   After login URL: ${page.url()}`);

          await page.screenshot({
            path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/tests/screenshots/production-kanban/manual-05-after-login.png',
            fullPage: true
          });

          // Now try production again
          if (!page.url().includes('/login')) {
            console.log('\n5. Login successful, trying /production again...');
            try {
              await page.goto('http://localhost:3000/production', { timeout: 15000 });
              console.log(`   Current URL: ${page.url()}`);

              await page.waitForTimeout(2000);
              await page.screenshot({
                path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--production-dashboard.png',
                fullPage: true
              });

              // Try other pages
              console.log('\n6. Testing /production/templates...');
              await page.goto('http://localhost:3000/production/templates', { timeout: 15000 });
              await page.waitForTimeout(2000);
              await page.screenshot({
                path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--production-templates.png',
                fullPage: true
              });

              console.log('\n7. Testing /production/board...');
              await page.goto('http://localhost:3000/production/board', { timeout: 15000 });
              await page.waitForTimeout(2000);
              await page.screenshot({
                path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--production-board.png',
                fullPage: true
              });

              console.log('\n8. Testing /production/my-tasks...');
              await page.goto('http://localhost:3000/production/my-tasks', { timeout: 15000 });
              await page.waitForTimeout(2000);
              await page.screenshot({
                path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--production-my-tasks.png',
                fullPage: true
              });

              console.log('\n9. Testing /orders/new...');
              await page.goto('http://localhost:3000/orders/new', { timeout: 15000 });
              await page.waitForTimeout(2000);
              await page.screenshot({
                path: 'C:/Users/shaug/source/repos/Shaftdog/Salesmod/success--order-form-template.png',
                fullPage: true
              });

              console.log('\n✓ All pages tested successfully!');
            } catch (error: any) {
              console.log(`   ERROR: ${error.message}`);
            }
          } else {
            console.log('   Login failed - still on login page');
          }
        }
      }
    }
  }

  // Keep browser open for a bit to see final state
  console.log('\n=== Test complete, browser will close in 10 seconds ===');
  await page.waitForTimeout(10000);
});
