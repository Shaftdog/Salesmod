import { test } from '@playwright/test';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'template-save');

test('Manual template save with slow-mo', async ({ page }) => {
  // Set up logging
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

  page.on('response', async response => {
    if (response.url().includes('production') || response.url().includes('template')) {
      console.log(`API: ${response.status()} ${response.method()} ${response.url()}`);
      if (!response.ok()) {
        try {
          const body = await response.text();
          console.log(`ERROR RESPONSE: ${body}`);
        } catch(e) {
          console.log(`Could not read error response`);
        }
      }
    }
  });

  console.log('Navigating to templates page...');
  await page.goto('http://localhost:9002/production/templates', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-01.png'), fullPage: true });

  console.log('Clicking New Template...');
  await page.locator('button:has-text("New Template")').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-02.png'), fullPage: true });

  console.log('Filling form...');
  await page.locator('input#name').fill('Manual Test Template');
  await page.locator('textarea#description').fill('Testing template save');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-03.png'), fullPage: true });

  console.log('Scrolling dialog...');
  await page.locator('[role="dialog"]').evaluate(el => el.scrollTop = el.scrollHeight);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-04.png'), fullPage: true });

  console.log('Attempting to click Create Template button...');
  const button = page.locator('button:has-text("Create Template")').last();

  // Check if visible
  const isVisible = await button.isVisible();
  console.log(`Button visible: ${isVisible}`);

  if (isVisible) {
    // Get button text to confirm it's the right one
    const buttonText = await button.textContent();
    console.log(`Button text: "${buttonText}"`);

    // Try to click
    console.log('Clicking button...');
    await button.click();
    console.log('Click executed!');

    // Wait and see what happens
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-05-after-click.png'), fullPage: true });

    // Check if dialog closed
    const dialogVisible = await page.locator('[role="dialog"]').isVisible();
    console.log(`Dialog still visible: ${dialogVisible}`);

    // Check for any error messages
    const errors = await page.locator('[role="alert"], .text-red-500').all();
    console.log(`Found ${errors.length} error elements`);
    for (const err of errors) {
      const text = await err.textContent();
      if (text?.trim()) {
        console.log(`ERROR: ${text.trim()}`);
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manual-06-final.png'), fullPage: true });
  } else {
    console.log('ERROR: Button not visible!');
  }

  console.log('Test complete - check screenshots');
});
