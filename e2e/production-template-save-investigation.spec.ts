import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'template-save');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('Production Template Save Investigation', () => {
  let consoleMessages: string[] = [];
  let consoleErrors: string[] = [];
  let networkRequests: Array<{ url: string; method: string; status?: number; response?: any }> = [];

  test.beforeEach(async ({ page }) => {
    // Reset arrays
    consoleMessages = [];
    consoleErrors = [];
    networkRequests = [];

    // Capture console messages
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });

    page.on('response', async response => {
      const request = networkRequests.find(r => r.url === response.url() && !r.status);
      if (request) {
        request.status = response.status();
        try {
          const contentType = response.headers()['content-type'];
          if (contentType?.includes('application/json')) {
            request.response = await response.json();
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });
  });

  test('Investigate template creation save issue', async ({ page }) => {
    console.log('\n=== Starting Template Save Investigation ===\n');

    // Step 1: Navigate to templates page
    console.log('Step 1: Navigating to production templates page...');
    await page.goto('http://localhost:9002/production/templates');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-templates-page-initial.png'), fullPage: true });
    console.log('Screenshot saved: 01-templates-page-initial.png');

    // Step 2: Click "New Template" button
    console.log('\nStep 2: Looking for "New Template" button...');

    // Try different selectors for the button
    const possibleSelectors = [
      'button:has-text("New Template")',
      'a:has-text("New Template")',
      '[data-testid="new-template"]',
      'button:has-text("Create Template")',
      'button:has-text("Add Template")'
    ];

    let newTemplateButton = null;
    for (const selector of possibleSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        newTemplateButton = element;
        console.log(`Found button with selector: ${selector}`);
        break;
      }
    }

    if (!newTemplateButton) {
      console.log('Could not find "New Template" button. Available buttons:');
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log(`  - Button: "${text}"`);
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-no-button-found.png'), fullPage: true });
      throw new Error('New Template button not found');
    }

    await newTemplateButton.click();
    await page.waitForTimeout(1000); // Wait for any animations/modals
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-after-new-template-click.png'), fullPage: true });
    console.log('Screenshot saved: 03-after-new-template-click.png');

    // Step 3: Fill in the form
    console.log('\nStep 3: Filling in template form...');

    // Look for Template Name input
    const nameInputSelectors = [
      'input[name="name"]',
      'input[placeholder*="name" i]',
      'input[type="text"]',
      '#templateName',
      '[data-testid="template-name"]'
    ];

    let nameInput = null;
    for (const selector of nameInputSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        nameInput = element;
        console.log(`Found name input with selector: ${selector}`);
        break;
      }
    }

    if (!nameInput) {
      console.log('Could not find name input. Available inputs:');
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`  - Input: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-no-name-input-found.png'), fullPage: true });
      throw new Error('Template name input not found');
    }

    // Fill the name field
    await nameInput.fill('Test Template Investigation');
    await page.waitForTimeout(500);
    console.log('Filled template name: "Test Template Investigation"');

    // Look for Description field
    const descriptionSelectors = [
      'textarea[name="description"]',
      'textarea[placeholder*="description" i]',
      'textarea',
      '#templateDescription',
      'input[name="description"]'
    ];

    let descriptionInput = null;
    for (const selector of descriptionSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        descriptionInput = element;
        console.log(`Found description input with selector: ${selector}`);
        break;
      }
    }

    if (descriptionInput) {
      await descriptionInput.fill('Test description for investigation purposes');
      console.log('Filled description field');
    } else {
      console.log('Description field not found (may be optional)');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-form-filled.png'), fullPage: true });
    console.log('Screenshot saved: 05-form-filled.png');

    // Step 4: Scroll down in the dialog to find the save button
    console.log('\nStep 4: Scrolling dialog to find Save/Create button...');

    // Find the dialog content area and scroll it
    const dialogContent = page.locator('[role="dialog"]').first();
    await dialogContent.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-after-scroll.png'), fullPage: true });
    console.log('Screenshot saved: 06-after-scroll.png');

    // Now look for the save button
    const saveButtonSelectors = [
      'button:has-text("Create Template")',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button[type="submit"]',
      '[data-testid="create-template"]',
      '[data-testid="save-template"]'
    ];

    let saveButton = null;
    for (const selector of saveButtonSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        saveButton = element;
        console.log(`Found save button with selector: ${selector}`);
        break;
      }
    }

    if (!saveButton) {
      console.log('Could not find save/create button even after scrolling. Available buttons in dialog:');
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        const disabled = await btn.isDisabled();
        const type = await btn.getAttribute('type');
        const isVisible = await btn.isVisible();
        console.log(`  - Button: "${text}", disabled=${disabled}, type="${type}", visible=${isVisible}`);
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06b-no-save-button-found.png'), fullPage: true });
      throw new Error('Save/Create button not found');
    }

    // Check button state before clicking
    const isDisabled = await saveButton.isDisabled();
    const buttonText = await saveButton.textContent();
    console.log(`Save button found: text="${buttonText}", disabled=${isDisabled}`);

    // Step 5: Click the save button and observe
    console.log('\nStep 5: Clicking save/create button...');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-before-save-click.png'), fullPage: true });

    // Clear previous network requests to focus on the save operation
    const requestCountBefore = networkRequests.length;

    await saveButton.click();

    // Wait for any potential response
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-after-save-click.png'), fullPage: true });
    console.log('Screenshot saved: 08-after-save-click.png');

    // Step 6: Analyze what happened
    console.log('\n=== INVESTIGATION RESULTS ===\n');

    // Check for console errors
    console.log('Console Errors:');
    if (consoleErrors.length === 0) {
      console.log('  No console errors detected');
    } else {
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Check for network requests related to template creation
    console.log('\nNetwork Requests (after button click):');
    const relevantRequests = networkRequests.slice(requestCountBefore);
    if (relevantRequests.length === 0) {
      console.log('  No network requests detected after button click!');
    } else {
      relevantRequests.forEach((req, i) => {
        if (req.url.includes('api') || req.url.includes('template')) {
          console.log(`  ${i + 1}. ${req.method} ${req.url}`);
          console.log(`     Status: ${req.status || 'pending'}`);
          if (req.response) {
            console.log(`     Response: ${JSON.stringify(req.response, null, 2)}`);
          }
        }
      });
    }

    // Check if still on same page or redirected
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);

    // Check for any error messages on the page
    console.log('\nChecking for error messages on page...');
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-red-500',
      '.text-destructive',
      '[data-testid="error"]'
    ];

    let foundErrors = false;
    for (const selector of errorSelectors) {
      const errors = await page.locator(selector).all();
      for (const error of errors) {
        if (await error.isVisible()) {
          const text = await error.textContent();
          console.log(`  Error message: "${text}"`);
          foundErrors = true;
        }
      }
    }

    if (!foundErrors) {
      console.log('  No error messages found on page');
    }

    // Check if form is still visible or closed
    const formStillVisible = await nameInput.isVisible().catch(() => false);
    console.log(`\nForm still visible: ${formStillVisible}`);

    // Wait a bit longer to see if anything happens
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-final-state.png'), fullPage: true });
    console.log('\nFinal screenshot saved: 09-final-state.png');

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      consoleErrors,
      consoleMessages,
      networkRequests: relevantRequests,
      currentUrl,
      formStillVisible,
      buttonState: {
        text: buttonText,
        wasDisabled: isDisabled
      }
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'investigation-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('\nDetailed report saved: investigation-report.json');

    console.log('\n=== Investigation Complete ===\n');
  });
});
