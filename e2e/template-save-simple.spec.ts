import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'template-save');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('Production Template Save - Simplified Test', () => {
  test('Complete template creation flow with detailed logging', async ({ page }) => {
    const consoleMessages: string[] = [];
    const networkErrors: string[] = [];
    const apiRequests: Array<{ url: string; method: string; status?: number; responseBody?: any }> = [];

    // Capture console
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Capture network requests - especially API calls
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('supabase')) {
        const req = {
          url: request.url(),
          method: request.method(),
          status: undefined as number | undefined,
          responseBody: undefined as any
        };
        apiRequests.push(req);
        console.log(`>>> REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('api') || response.url().includes('supabase')) {
        console.log(`<<< RESPONSE: ${response.status()} ${response.url()}`);

        const req = apiRequests.find(r => r.url === response.url() && r.status === undefined);
        if (req) {
          req.status = response.status();
          try {
            const contentType = response.headers()['content-type'];
            if (contentType?.includes('application/json')) {
              req.responseBody = await response.json();
              console.log(`    Body: ${JSON.stringify(req.responseBody, null, 2)}`);
            }
          } catch (e) {
            // Ignore
          }
        }

        if (!response.ok()) {
          networkErrors.push(`${response.status()} ${response.url()}`);
        }
      }
    });

    console.log('\n=== Starting Template Save Test ===\n');

    // Navigate
    console.log('Step 1: Navigate to templates page');
    await page.goto('http://localhost:9002/production/templates');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simple-01-initial.png'), fullPage: true });

    // Click New Template
    console.log('\nStep 2: Click New Template button');
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simple-02-dialog-open.png'), fullPage: true });

    // Fill template name
    console.log('\nStep 3: Fill template name');
    await page.fill('input#name', 'Simple Test Template');
    await page.waitForTimeout(300);

    // Fill description
    console.log('\nStep 4: Fill description');
    await page.fill('textarea#description', 'This is a test template description');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simple-03-form-filled.png'), fullPage: true });

    // Scroll to bottom of dialog to reveal button
    console.log('\nStep 5: Scroll to see Create Template button');
    await page.locator('[role="dialog"]').evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simple-04-scrolled.png'), fullPage: true });

    // Check if button is visible and enabled
    const createButton = page.locator('button:has-text("Create Template")');
    const isVisible = await createButton.isVisible();
    const isDisabled = await createButton.isDisabled();
    console.log(`\nCreate Template button: visible=${isVisible}, disabled=${isDisabled}`);

    if (!isVisible) {
      console.log('ERROR: Create Template button is not visible!');
      throw new Error('Create Template button not found');
    }

    // Click the Create Template button
    console.log('\nStep 6: Click Create Template button');
    console.log('API requests before click:', apiRequests.length);

    const requestCountBefore = apiRequests.length;

    await createButton.click();
    console.log('Button clicked!');

    // Wait for potential API call
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'simple-05-after-click.png'), fullPage: true });

    const requestCountAfter = apiRequests.length;
    console.log(`API requests after click: ${requestCountAfter} (new: ${requestCountAfter - requestCountBefore})`);

    // Check if dialog is still open
    const dialogStillOpen = await page.locator('[role="dialog"]').isVisible();
    console.log(`Dialog still open: ${dialogStillOpen}`);

    // Log all API requests made after button click
    console.log('\n=== API Requests After Button Click ===');
    const newRequests = apiRequests.slice(requestCountBefore);
    if (newRequests.length === 0) {
      console.log('NO API REQUESTS WERE MADE!');
    } else {
      newRequests.forEach((req, i) => {
        console.log(`\n${i + 1}. ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status || 'pending'}`);
        if (req.responseBody) {
          console.log(`   Response: ${JSON.stringify(req.responseBody, null, 2)}`);
        }
      });
    }

    // Check for errors on page
    const errorElements = await page.locator('[role="alert"], .text-red-500, .text-destructive').all();
    if (errorElements.length > 0) {
      console.log('\n=== Error Messages on Page ===');
      for (const el of errorElements) {
        const text = await el.textContent();
        if (text && text.trim()) {
          console.log(`  - ${text.trim()}`);
        }
      }
    }

    // Final state
    console.log('\n=== Final State ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total network errors: ${networkErrors.length}`);
    console.log(`Current URL: ${page.url()}`);

    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach(err => console.log(`  - ${err}`));
    }

    // Console errors
    const errors = consoleMessages.filter(m => m.startsWith('[error]'));
    if (errors.length > 0) {
      console.log('\nConsole Errors:');
      errors.forEach(err => console.log(`  ${err}`));
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      dialogStillOpen,
      apiRequestsAfterClick: newRequests,
      networkErrors,
      consoleErrors: errors,
      allApiRequests: apiRequests,
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'simple-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== Test Complete ===');
    console.log('Report saved to: simple-test-report.json');
  });
});
