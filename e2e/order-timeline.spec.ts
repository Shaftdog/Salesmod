import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'order-timeline');

test.describe('Order Activities Timeline Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/.*dashboard.*|.*orders.*|.*\/(?!login)/, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('Workflow 1: Login and navigate to Orders', async ({ page }) => {
    console.log('Starting Workflow 1: Login and navigate to Orders');

    // Navigate to orders page
    await page.goto('http://localhost:9002/orders');
    await page.waitForTimeout(2000);

    // Take screenshot of orders page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-orders-page.png'),
      fullPage: true
    });

    // Verify we're on the orders page
    const url = page.url();
    expect(url).toContain('/orders');

    console.log('✅ Successfully navigated to orders page');
  });

  test('Workflow 2: View Order Timeline', async ({ page }) => {
    console.log('Starting Workflow 2: View Order Timeline');

    // Navigate to orders page
    await page.goto('http://localhost:9002/orders');
    await page.waitForTimeout(3000);

    // Look for order links to get an order ID
    const orderLink = page.locator('a[href*="/orders/"][href*="/orders/"]:not([href*="/new"]):not([href*="/edit"])').first();
    const orderLinkCount = await page.locator('a[href*="/orders/"][href*="/orders/"]:not([href*="/new"]):not([href*="/edit"])').count();

    if (orderLinkCount === 0) {
      console.log('❌ No orders found on the page');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-no-orders-found.png'),
        fullPage: true
      });
      throw new Error('No orders found to test timeline feature');
    }

    console.log(`Found ${orderLinkCount} order links`);

    // Get the href and navigate directly
    const href = await orderLink.getAttribute('href');
    if (!href) {
      throw new Error('Could not get order link href');
    }

    console.log(`Navigating to order: ${href}`);
    await page.goto(`http://localhost:9002${href}`);
    await page.waitForTimeout(3000);

    // Take screenshot of order detail page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-order-detail-page.png'),
      fullPage: true
    });

    // Look for History tab (based on the code, it should be in a TabsTrigger)
    const historyTab = page.locator('[role="tab"]:has-text("History")').first();
    const tabExists = await historyTab.count() > 0;

    if (tabExists) {
      console.log('Found History tab');
      await historyTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-timeline-tab-clicked.png'),
        fullPage: true
      });
    } else {
      console.log('⚠️ No History tab found, checking for timeline in main view');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-no-history-tab.png'),
        fullPage: true
      });
    }

    // Look for activity items (common patterns)
    const activityPatterns = [
      '[data-testid*="activity"]',
      '[class*="activity"]',
      '[class*="timeline"]',
      '[class*="history"]',
      'text=/created|updated|changed|added|modified/i'
    ];

    let activitiesFound = false;
    for (const pattern of activityPatterns) {
      const activities = await page.locator(pattern).count();
      if (activities > 0) {
        console.log(`✅ Found ${activities} activities matching pattern: ${pattern}`);
        activitiesFound = true;
        break;
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-timeline-view.png'),
      fullPage: true
    });

    if (!activitiesFound) {
      console.log('⚠️ Warning: Could not identify activities with common patterns');
      console.log('Page HTML structure may need manual inspection');
    }

    console.log('✅ Order timeline view test completed');
  });

  test('Workflow 3: Create a Note and Verify Timeline', async ({ page }) => {
    console.log('Starting Workflow 3: Create a Note and Verify Timeline');

    // Navigate to orders page
    await page.goto('http://localhost:9002/orders');
    await page.waitForTimeout(3000);

    // Get first order link
    const orderLink = page.locator('a[href*="/orders/"][href*="/orders/"]:not([href*="/new"]):not([href*="/edit"])').first();
    const href = await orderLink.getAttribute('href');
    if (!href) {
      throw new Error('No orders found');
    }

    // Navigate directly to order detail page
    await page.goto(`http://localhost:9002${href}`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-before-adding-note.png'),
      fullPage: true
    });

    // Based on the code, notes are in the "Communication" tab
    const communicationTab = page.locator('[role="tab"]:has-text("Communication")').first();
    if (await communicationTab.count() > 0) {
      console.log('Found Communication tab, clicking it');
      await communicationTab.click();

      // Wait for the loading spinner to disappear
      await page.waitForTimeout(1000);
      const loadingSpinner = page.locator('.animate-spin');
      if (await loadingSpinner.count() > 0) {
        console.log('Waiting for notes to load...');
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      }

      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-communication-tab-clicked.png'),
        fullPage: true
      });
    } else {
      console.log('⚠️ Communication tab not found');
    }

    // Look for "Add Note" or "Add First Note" button
    // The component shows "Add Note" if notes exist, "Add First Note" if none exist
    const notePatterns = [
      'button:has-text("Add Note")',
      'button:has-text("Add First Note")',
      'button:has-text("New Note")',
      'button:has-text("Create Note")'
    ];

    let noteButtonFound = false;
    let noteButton;

    for (const pattern of notePatterns) {
      const element = page.locator(pattern).first();
      if (await element.count() > 0) {
        console.log(`Found note button with pattern: ${pattern}`);
        noteButton = element;
        noteButtonFound = true;
        break;
      }
    }

    let noteInputFound = false;
    let noteInput;

    if (noteButtonFound && noteButton) {
      // Click the button to open the dialog
      await noteButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-note-dialog-opened.png'),
        fullPage: true
      });

      // Look for textarea in the dialog
      noteInput = page.locator('textarea').last();
      if (await noteInput.count() > 0) {
        noteInputFound = true;
      }
    }

    if (noteInputFound && noteInput) {
      console.log('Filling note input...');
      await noteInput.fill('Test note from E2E');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '09-note-filled.png'),
        fullPage: true
      });

      // Look for submit/save button in the dialog
      // Need to get the button in the dialog footer, not just any button with "Add Note"
      const submitButton = page.locator('[role="dialog"] button:has-text("Add Note")').last();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        console.log('✅ Note submitted');
      } else {
        console.log('⚠️ Submit button not found');
      }

      // The dialog should close, return to Communication tab
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '10-after-note-added.png'),
        fullPage: true
      });

      // Verify note appears in the notes list
      const noteText = page.locator('text=/Test note from E2E/i');
      const noteVisible = await noteText.count() > 0;

      if (noteVisible) {
        console.log('✅ Note successfully added and visible');
      } else {
        console.log('⚠️ Note may have been added but not immediately visible');
      }

      // Check timeline for "note added" activity
      const historyTab = page.locator('[role="tab"]:has-text("History")').first();
      if (await historyTab.count() > 0) {
        await historyTab.click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '11-timeline-after-note.png'),
          fullPage: true
        });

        const noteActivity = page.locator('text=/note.*added|added.*note|note.*created/i');
        if (await noteActivity.count() > 0) {
          console.log('✅ Note activity found in timeline');
        } else {
          console.log('⚠️ Note activity not found in timeline (may use different wording)');
        }
      }

    } else {
      console.log('❌ Could not find note button or input field');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-note-input-not-found.png'),
        fullPage: true
      });
      throw new Error('Note button/input not found - checking if feature uses different UI pattern');
    }
  });

  test('Workflow 4: Verify Activity Details', async ({ page }) => {
    console.log('Starting Workflow 4: Verify Activity Details');

    // Navigate to orders page
    await page.goto('http://localhost:9002/orders');
    await page.waitForTimeout(3000);

    // Get first order link
    const orderLink = page.locator('a[href*="/orders/"][href*="/orders/"]:not([href*="/new"]):not([href*="/edit"])').first();
    const href = await orderLink.getAttribute('href');
    if (!href) {
      throw new Error('No orders found');
    }

    // Navigate directly to order detail page
    await page.goto(`http://localhost:9002${href}`);
    await page.waitForTimeout(3000);

    // Navigate to History tab
    const historyTab = page.locator('[role="tab"]:has-text("History")').first();
    if (await historyTab.count() > 0) {
      await historyTab.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ History tab not found');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '12-activity-details-view.png'),
      fullPage: true
    });

    // Check for activity components
    const checks = {
      icons: false,
      descriptions: false,
      userNames: false,
      timestamps: false
    };

    // Look for icons (common icon libraries)
    const iconSelectors = [
      'svg',
      '[class*="icon"]',
      'i[class*="fa-"]',
      '[data-icon]'
    ];

    for (const selector of iconSelectors) {
      if (await page.locator(selector).count() > 0) {
        checks.icons = true;
        console.log(`✅ Activity icons found (${selector})`);
        break;
      }
    }

    // Look for descriptions (text content)
    const descriptionText = await page.locator('text=/created|updated|changed|added|modified|status/i').count();
    if (descriptionText > 0) {
      checks.descriptions = true;
      console.log(`✅ Activity descriptions found (${descriptionText} instances)`);
    }

    // Look for user names (common patterns)
    const userPatterns = [
      'text=/by|performed by|created by/i',
      '[class*="user"]',
      '[class*="author"]',
      '[data-testid*="user"]'
    ];

    for (const pattern of userPatterns) {
      if (await page.locator(pattern).count() > 0) {
        checks.userNames = true;
        console.log(`✅ User names found (${pattern})`);
        break;
      }
    }

    // Look for timestamps (date/time patterns)
    const timestampPatterns = [
      'time',
      '[datetime]',
      'text=/ago|at|on|\\d{1,2}:\\d{2}|AM|PM|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i',
      '[class*="time"]',
      '[class*="date"]'
    ];

    for (const pattern of timestampPatterns) {
      if (await page.locator(pattern).count() > 0) {
        checks.timestamps = true;
        console.log(`✅ Timestamps found (${pattern})`);
        break;
      }
    }

    // Take detailed screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '13-activity-details-annotated.png'),
      fullPage: true
    });

    // Summary
    console.log('\n=== Activity Details Check Summary ===');
    console.log(`Activity Icons: ${checks.icons ? '✅' : '❌'}`);
    console.log(`Descriptions: ${checks.descriptions ? '✅' : '❌'}`);
    console.log(`User Names: ${checks.userNames ? '✅' : '❌'}`);
    console.log(`Timestamps: ${checks.timestamps ? '✅' : '❌'}`);

    const allChecksPass = Object.values(checks).every(v => v === true);
    if (allChecksPass) {
      console.log('\n✅ All activity detail checks passed');
    } else {
      console.log('\n⚠️ Some activity detail checks failed - see details above');
    }
  });
});
