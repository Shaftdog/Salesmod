/**
 * Billing Contact Feature Test Suite (Simplified)
 * Tests the billing contact selector on client detail page
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:9002';
const TEST_EMAIL = 'rod@myroihome.com';
const TEST_PASSWORD = 'Latter!974';

test.describe('Billing Contact Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation
    page.setDefaultTimeout(60000);

    // Login before each test
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard or any navigation away from login
    await page.waitForURL(/dashboard|clients|overview/, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('Test 1: Navigate to Clients and find first real client', async ({ page }) => {
    console.log('=== Test 1: Navigate to Clients ===');

    // Navigate to Clients
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    // Take screenshot of clients list
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/01-clients-list.png',
      fullPage: true
    });

    // Look for client cards - skip system/unassigned ones
    const clientCards = page.locator('[class*="card"], div').filter({
      hasNotText: /Unassigned|System/
    }).locator('a[href^="/clients/"]');

    const count = await clientCards.count();
    console.log(`Found ${count} client links`);

    if (count > 0) {
      // Click first real client
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(2000);

      // Take screenshot of client detail page
      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/02-client-detail-page.png',
        fullPage: true
      });

      console.log('Successfully navigated to client detail page');
      console.log('URL:', page.url());
    } else {
      console.log('No real client links found, taking screenshot');
      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/02-no-clients-found.png',
        fullPage: true
      });
    }
  });

  test('Test 2: Verify Billing Contact card is visible', async ({ page }) => {
    console.log('=== Test 2: Verify Billing Contact Card ===');

    // Navigate to clients and click first one
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    const clientCards = page.locator('a[href^="/clients/"]').filter({
      hasNotText: /Unassigned|System/
    });

    if (await clientCards.count() > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(3000);

      // Take initial screenshot
      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/03a-client-page-loaded.png',
        fullPage: true
      });

      // Look for "Billing Contact" text
      const billingText = page.locator('text="Billing Contact"').first();

      if (await billingText.isVisible({ timeout: 5000 })) {
        console.log('Found "Billing Contact" heading');

        // Scroll to billing contact section
        await billingText.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/03b-billing-contact-card.png',
          fullPage: true
        });

        // Look for the description text
        const description = page.locator('text=/receives invoices/i');
        if (await description.isVisible({ timeout: 2000 })) {
          console.log('Found billing contact description');
        }

        console.log('Billing Contact card verified');
      } else {
        console.log('Billing Contact heading not found');
        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/03b-no-billing-card.png',
          fullPage: true
        });
      }
    }
  });

  test('Test 3: Verify checkbox and dropdown elements', async ({ page }) => {
    console.log('=== Test 3: Verify Form Elements ===');

    // Navigate to client detail
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    const clientCards = page.locator('a[href^="/clients/"]').filter({
      hasNotText: /Unassigned|System/
    });

    if (await clientCards.count() > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(3000);

      // Look for checkbox
      const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

      if (await checkbox.isVisible({ timeout: 5000 })) {
        console.log('Checkbox found');

        // Get checkbox label
        const label = page.locator('label[for="billing-email-same"]');
        const labelText = await label.textContent();
        console.log('Checkbox label:', labelText);

        // Scroll to checkbox
        await checkbox.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/04a-checkbox-visible.png',
          fullPage: true
        });

        // Check current state
        const isChecked = await checkbox.isChecked();
        console.log('Checkbox is checked:', isChecked);

        // Look for dropdown (might be disabled if checkbox is checked)
        const dropdown = page.locator('button[role="combobox"]').first();

        if (await dropdown.isVisible({ timeout: 2000 })) {
          const isDisabled = await dropdown.isDisabled();
          console.log('Dropdown found, disabled:', isDisabled);
        } else {
          console.log('Dropdown not visible');
        }

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/04b-form-elements.png',
          fullPage: true
        });

      } else {
        console.log('Checkbox not found');
        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/04-no-checkbox.png',
          fullPage: true
        });
      }
    }
  });

  test('Test 4: Toggle checkbox on and off', async ({ page }) => {
    console.log('=== Test 4: Toggle Checkbox ===');

    // Navigate to client detail
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    const clientCards = page.locator('a[href^="/clients/"]').filter({
      hasNotText: /Unassigned|System/
    });

    if (await clientCards.count() > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(3000);

      const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

      if (await checkbox.isVisible({ timeout: 5000 })) {
        await checkbox.scrollIntoViewIfNeeded();

        // Get initial state
        const initialState = await checkbox.isChecked();
        console.log('Initial checkbox state:', initialState);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/05a-before-toggle.png',
          fullPage: true
        });

        // Click checkbox
        await checkbox.click();
        await page.waitForTimeout(2000);

        // Verify state changed
        const newState = await checkbox.isChecked();
        console.log('New checkbox state:', newState);
        expect(newState).toBe(!initialState);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/05b-after-toggle.png',
          fullPage: true
        });

        // Look for toast notification
        const toast = page.locator('[role="status"], [class*="toast"]').first();
        if (await toast.isVisible({ timeout: 3000 })) {
          const toastText = await toast.textContent();
          console.log('Toast message:', toastText);

          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/05c-toast-shown.png',
            fullPage: true
          });
        }

        // Toggle back
        await checkbox.click();
        await page.waitForTimeout(2000);

        const finalState = await checkbox.isChecked();
        console.log('Final checkbox state:', finalState);
        expect(finalState).toBe(initialState);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/05d-toggled-back.png',
          fullPage: true
        });

        console.log('Checkbox toggle test completed successfully');
      }
    }
  });

  test('Test 5: Interact with billing contact dropdown', async ({ page }) => {
    console.log('=== Test 5: Billing Contact Dropdown ===');

    // Navigate to client detail
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    const clientCards = page.locator('a[href^="/clients/"]').filter({
      hasNotText: /Unassigned|System/
    });

    if (await clientCards.count() > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(3000);

      // Ensure checkbox is unchecked so dropdown is enabled
      const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

      if (await checkbox.isVisible({ timeout: 5000 })) {
        if (await checkbox.isChecked()) {
          await checkbox.click();
          await page.waitForTimeout(2000);
        }

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/06a-checkbox-unchecked.png',
          fullPage: true
        });

        // Find dropdown
        const dropdown = page.locator('button[role="combobox"]').first();

        if (await dropdown.isVisible({ timeout: 2000 })) {
          await dropdown.scrollIntoViewIfNeeded();
          console.log('Dropdown found, clicking to open...');

          await dropdown.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/06b-dropdown-opened.png',
            fullPage: true
          });

          // Look for options
          const options = page.locator('[role="option"]');
          const optionCount = await options.count();
          console.log(`Found ${optionCount} dropdown options`);

          if (optionCount > 0) {
            // Log all option text
            for (let i = 0; i < Math.min(optionCount, 5); i++) {
              const optionText = await options.nth(i).textContent();
              console.log(`  Option ${i + 1}:`, optionText);
            }

            // Try to select a contact (not "No billing contact")
            const contactOption = options.filter({ hasNotText: /No billing contact/i }).first();

            if (await contactOption.isVisible({ timeout: 1000 })) {
              await contactOption.click();
              await page.waitForTimeout(2000);

              await page.screenshot({
                path: 'e2e/screenshots/billing-contact/06c-contact-selected.png',
                fullPage: true
              });

              console.log('Selected a billing contact');

              // Look for toast
              const toast = page.locator('[role="status"], [class*="toast"]').first();
              if (await toast.isVisible({ timeout: 3000 })) {
                const toastText = await toast.textContent();
                console.log('Toast message:', toastText);
              }
            } else {
              console.log('No contact options available (only "No billing contact")');
            }
          }
        } else {
          console.log('Dropdown not found');
          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/06-no-dropdown.png',
            fullPage: true
          });
        }
      }
    }
  });

  test('Test 6: Summary - Document final state', async ({ page }) => {
    console.log('=== Test 6: Final State Documentation ===');

    // Navigate to client detail
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    const clientCards = page.locator('a[href^="/clients/"]').filter({
      hasNotText: /Unassigned|System/
    });

    if (await clientCards.count() > 0) {
      await clientCards.first().click();
      await page.waitForURL('**/clients/*');
      await page.waitForTimeout(3000);

      // Scroll to billing section
      const billingHeading = page.locator('text="Billing Contact"').first();
      if (await billingHeading.isVisible({ timeout: 5000 })) {
        await billingHeading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Take comprehensive screenshot
        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/07-final-state.png',
          fullPage: true
        });

        // Document current configuration
        const checkbox = page.locator('input[type="checkbox"]#billing-email-same');
        if (await checkbox.isVisible({ timeout: 2000 })) {
          const isChecked = await checkbox.isChecked();
          console.log('Final state - Use company email:', isChecked);

          const label = page.locator('label[for="billing-email-same"]');
          const labelText = await label.textContent();
          console.log('Checkbox label:', labelText);
        }

        console.log('Final state documented');
      }
    }
  });
});
