import { test, expect } from '@playwright/test';

test('Sales Dashboard - Simple Test', async ({ page }) => {
  const BASE_URL = 'http://localhost:9002';
  const LOGIN_EMAIL = 'sherrard@appraisearch.net';
  const LOGIN_PASSWORD = 'Blaisenpals1!';

  test.setTimeout(180000); // 3 minute timeout
  page.setDefaultTimeout(90000); // 90 second timeout for actions

  console.log('Step 1: Navigating to home page...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Home page loaded');
  } catch (error) {
    console.error('✗ Failed to load home page:', error);
    throw error;
  }

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/00-home-page.png',
    fullPage: true
  });

  console.log('Step 2: Navigating to login page...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Login page loaded');
  } catch (error) {
    console.error('✗ Failed to load login page:', error);
    throw error;
  }

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/01-login-page.png',
    fullPage: true
  });

  console.log('Step 3: Waiting for email input...');
  await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', { timeout: 30000 });
  console.log('✓ Email input found');

  console.log('Step 4: Filling credentials...');
  await page.fill('input[type="email"], input[name="email"], input[id="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"], input[id="password"]', LOGIN_PASSWORD);
  console.log('✓ Credentials filled');

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/02-credentials-filled.png',
    fullPage: true
  });

  console.log('Step 5: Clicking login button...');
  await page.click('button[type="submit"]');
  console.log('✓ Login button clicked');

  console.log('Step 6: Waiting for navigation after login...');
  try {
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 30000 });
    console.log('✓ Navigated away from login page');
  } catch (error) {
    console.log('Still on signin page, checking for errors...');
  }

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/03-after-login.png',
    fullPage: true
  });

  const currentURL = page.url();
  console.log('Current URL:', currentURL);

  console.log('Step 7: Navigating to Sales Dashboard...');
  try {
    await page.goto(`${BASE_URL}/sales`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ Sales page loaded');
  } catch (error) {
    console.error('✗ Failed to load sales page:', error);
    throw error;
  }

  await page.waitForTimeout(3000); // Wait for charts to render

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/04-sales-dashboard-initial.png',
    fullPage: true
  });

  console.log('\n=== Checking Dashboard Components ===');

  // Check for heading
  const pageText = await page.textContent('body');
  console.log('Page contains "Sales":', pageText?.includes('Sales') ? '✓' : '✗');
  console.log('Page contains "Dashboard":', pageText?.includes('Dashboard') ? '✓' : '✗');

  // Check for KPI cards
  const kpiCards = await page.locator('[class*="grid"] > div').count();
  console.log(`Grid items found: ${kpiCards}`);

  // Check for charts
  const canvasElements = await page.locator('canvas').count();
  const svgElements = await page.locator('svg').count();
  console.log(`Canvas elements: ${canvasElements}`);
  console.log(`SVG elements: ${svgElements}`);

  // Check for specific text content
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

  console.log('\n=== Checking for Expected Text ===');
  for (const text of expectedTexts) {
    const found = pageText?.includes(text);
    console.log(`"${text}": ${found ? '✓' : '✗'}`);
  }

  // Capture console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Scroll through page
  console.log('\n=== Capturing Full Dashboard ===');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/05-dashboard-top.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/06-dashboard-middle.png',
    fullPage: true
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/07-dashboard-bottom.png',
    fullPage: true
  });

  // Get page HTML for inspection
  const bodyHTML = await page.locator('body').innerHTML();
  const hasCards = bodyHTML.includes('card');
  const hasCharts = bodyHTML.includes('chart') || bodyHTML.includes('canvas') || bodyHTML.includes('svg');
  const hasGrid = bodyHTML.includes('grid');

  console.log('\n=== Page Structure ===');
  console.log(`Has card elements: ${hasCards ? '✓' : '✗'}`);
  console.log(`Has chart elements: ${hasCharts ? '✓' : '✗'}`);
  console.log(`Has grid layout: ${hasGrid ? '✓' : '✗'}`);

  // Final screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'e2e/screenshots/sales-dashboard/08-final-state.png',
    fullPage: true
  });

  console.log('\n=== Test Complete ===');
  console.log('All screenshots saved to: e2e/screenshots/sales-dashboard/');

  // Verify we're on the sales page
  expect(page.url()).toContain('/sales');
});
