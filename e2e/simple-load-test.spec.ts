import { test, expect } from '@playwright/test';

test('Simple page load to capture error', async ({ page }) => {
  // Listen for console messages
  const messages: string[] = [];
  page.on('console', msg => {
    messages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  const errors: string[] = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Try to load the page
  await page.goto('http://localhost:9002/dashboard');

  // Wait a bit to capture all messages
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/current-state.png', fullPage: true });

  // Print all captured info
  console.log('\n=== CONSOLE MESSAGES ===');
  messages.forEach(msg => console.log(msg));

  console.log('\n=== PAGE ERRORS ===');
  errors.forEach(err => console.log(err));

  console.log('\n=== PAGE TITLE ===');
  console.log(await page.title());

  console.log('\n=== PAGE URL ===');
  console.log(page.url());
});
