import { test, expect } from '@playwright/test';
import type { Request, Response } from '@playwright/test';

test.describe('Invoice Line Item Edit Bug Investigation', () => {
  let allRequests: Request[] = [];
  let allResponses: Response[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture all network requests and responses
    page.on('request', request => {
      allRequests.push(request);
    });

    page.on('response', response => {
      allResponses.push(response);
    });

    // Capture console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]:', error.message);
    });
  });

  test('Debug invoice line item edit not saving', async ({ page }) => {
    const screenshotDir = '/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-edit-debug';

    console.log('\n=== STEP 1: Login ===');
    await page.goto('http://localhost:9002');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/01-login-page.png`, fullPage: true });

    // Login
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.clear();
    await emailInput.fill('rod@myroihome.com');

    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await passwordInput.clear();
    await passwordInput.fill('Latter!974');

    const loginButton = page.locator('button[type="submit"]').first();

    // Wait for navigation after login
    const navigationPromise = page.waitForURL(url => !url.pathname.includes('/login') && !url.pathname.includes('/auth'), { timeout: 15000 });
    await loginButton.click();

    try {
      await navigationPromise;
      console.log('Login successful, redirected to:', page.url());
    } catch (e) {
      console.log('Navigation timeout, current URL:', page.url());
      await page.screenshot({ path: `${screenshotDir}/02-login-failed.png`, fullPage: true });

      // Check if there's an error message
      const errorMessage = await page.locator('text=error, text=invalid, text=failed').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log('Error message on page:', errorMessage);
      }

      throw new Error('Login failed - did not redirect from login page');
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/02-after-login.png`, fullPage: true });

    console.log('\n=== STEP 2: Navigate to Invoicing ===');
    await page.goto('http://localhost:9002/finance/invoicing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/03-invoicing-page.png`, fullPage: true });

    console.log('\n=== STEP 3: Find and click invoice INV-00021 ===');
    // Wait for invoices to load
    await page.waitForTimeout(3000);

    // First, check what's on the page
    const pageContent = await page.content();
    console.log('Page contains INV-00021:', pageContent.includes('INV-00021'));

    // Try to find any invoice row (table or list)
    let clicked = false;

    // Strategy 1: Find INV-00021 specifically
    const inv21 = page.locator('text=INV-00021').first();
    if (await inv21.count() > 0) {
      console.log('Found INV-00021 with text selector');
      await inv21.click();
      clicked = true;
    }

    // Strategy 2: Find any invoice row/card and click it
    if (!clicked) {
      console.log('INV-00021 not found, looking for any invoice row...');

      const invoiceRows = page.locator('tr:has(td), [role="row"], .invoice-row, [data-invoice], div:has-text("INV-")').filter({ hasText: /INV-\d+/ });
      const rowCount = await invoiceRows.count();
      console.log(`Found ${rowCount} potential invoice rows`);

      if (rowCount > 0) {
        console.log('Clicking first invoice row');
        await invoiceRows.first().click();
        clicked = true;
      }
    }

    // Strategy 3: Find any clickable element with invoice number pattern
    if (!clicked) {
      console.log('No invoice rows found, looking for clickable elements with INV pattern...');
      const invoiceElements = page.locator('[role="button"]:has-text("INV-"), button:has-text("INV-"), a:has-text("INV-")');
      const elemCount = await invoiceElements.count();
      console.log(`Found ${elemCount} clickable invoice elements`);

      if (elemCount > 0) {
        await invoiceElements.first().click();
        clicked = true;
      }
    }

    if (!clicked) {
      await page.screenshot({ path: `${screenshotDir}/04-no-invoices-found.png`, fullPage: true });
      throw new Error('Could not find any invoices on the page. See screenshot.');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/04-invoice-clicked.png`, fullPage: true });

    console.log('\n=== STEP 4: Click Edit button ===');
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/05-before-edit-click.png`, fullPage: true });

    await editButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/06-edit-dialog-opened.png`, fullPage: true });

    console.log('\n=== STEP 5: Change line item description ===');
    // Find the line item description input
    const descriptionInputs = page.locator('input[name*="description"], input[placeholder*="description" i], textarea[name*="description"], textarea[placeholder*="description" i]');
    const descCount = await descriptionInputs.count();
    console.log(`Found ${descCount} description input(s)`);

    if (descCount === 0) {
      // If no inputs found, look for any editable fields
      await page.screenshot({ path: `${screenshotDir}/07-no-description-inputs.png`, fullPage: true });
      const allInputs = page.locator('input[type="text"], textarea');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} text inputs/textareas total`);

      if (inputCount > 0) {
        // Use first text input
        const firstInput = allInputs.first();
        const currentValue = await firstInput.inputValue();
        console.log(`Current value of first input: "${currentValue}"`);
        await firstInput.clear();
        await firstInput.fill('NEW DESCRIPTION TEST');
        await page.screenshot({ path: `${screenshotDir}/08-description-changed.png`, fullPage: true });
      }
    } else {
      const descriptionInput = descriptionInputs.first();
      const currentValue = await descriptionInput.inputValue();
      console.log(`Current description value: "${currentValue}"`);

      await descriptionInput.clear();
      await descriptionInput.fill('NEW DESCRIPTION TEST');
      await page.screenshot({ path: `${screenshotDir}/08-description-changed.png`, fullPage: true });
    }

    console.log('\n=== STEP 6: Clear network logs and click Save ===');
    // Clear previous requests/responses
    allRequests = [];
    allResponses = [];

    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').filter({ hasText: /save/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: `${screenshotDir}/09-before-save-click.png`, fullPage: true });

    console.log('Clicking Save button...');
    await saveButton.click();

    // Wait for network activity
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotDir}/10-after-save-click.png`, fullPage: true });

    console.log('\n=== STEP 7: Analyze Network Requests ===');
    // Filter for PATCH requests to invoices API
    const patchRequests = allRequests.filter(req =>
      req.method() === 'PATCH' && req.url().includes('/api/invoices')
    );

    console.log(`\nFound ${patchRequests.length} PATCH request(s) to /api/invoices`);

    for (const req of patchRequests) {
      console.log('\n--- PATCH REQUEST ---');
      console.log('URL:', req.url());
      console.log('Headers:', await req.allHeaders());

      const postData = req.postData();
      if (postData) {
        console.log('Request Body:', postData);
        try {
          const jsonData = JSON.parse(postData);
          console.log('Parsed Request Body:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Could not parse request body as JSON');
        }
      }

      // Find corresponding response
      const response = allResponses.find(res => res.url() === req.url() && res.request() === req);
      if (response) {
        console.log('\n--- PATCH RESPONSE ---');
        console.log('Status:', response.status());
        console.log('Status Text:', response.statusText());
        console.log('Headers:', await response.allHeaders());

        try {
          const responseBody = await response.text();
          console.log('Response Body:', responseBody);
          try {
            const jsonResponse = JSON.parse(responseBody);
            console.log('Parsed Response:', JSON.stringify(jsonResponse, null, 2));
          } catch (e) {
            console.log('Response is not JSON');
          }
        } catch (e) {
          console.log('Could not read response body:', e);
        }
      }
    }

    // Also check for any GET requests that might refresh the data
    const getRequests = allRequests.filter(req =>
      req.method() === 'GET' && req.url().includes('/api/invoices')
    );
    console.log(`\nFound ${getRequests.length} GET request(s) to /api/invoices after save`);

    console.log('\n=== STEP 8: Check if description changed ===');
    await page.waitForTimeout(2000);

    // Try to find the description field again
    const updatedDescInputs = page.locator('input[name*="description"], input[placeholder*="description" i], textarea[name*="description"], textarea[placeholder*="description" i]');
    const updatedCount = await updatedDescInputs.count();

    if (updatedCount > 0) {
      const updatedValue = await updatedDescInputs.first().inputValue();
      console.log(`Updated description value: "${updatedValue}"`);

      if (updatedValue === 'NEW DESCRIPTION TEST') {
        console.log('✅ SUCCESS: Description was saved!');
      } else {
        console.log('❌ FAILURE: Description reverted to:', updatedValue);
      }
    } else {
      console.log('Could not find description input after save');
    }

    await page.screenshot({ path: `${screenshotDir}/11-final-state.png`, fullPage: true });

    console.log('\n=== INVESTIGATION COMPLETE ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
  });
});
