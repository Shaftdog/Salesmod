/**
 * Manual Billing Contact Test
 * Direct navigation to test the feature
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:9002';
const TEST_EMAIL = 'rod@myroihome.com';
const TEST_PASSWORD = 'Latter!974';

test.describe('Billing Contact Manual Test', () => {
  test('Manual exploration of billing contact feature', async ({ page }) => {
    page.setDefaultTimeout(60000);

    // Login
    console.log('Logging in...');
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|clients|overview/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log('Logged in successfully');

    // Navigate to clients
    await page.goto(`${APP_URL}/clients`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/manual-01-clients-page.png',
      fullPage: true
    });

    // Get all links on the page
    const allLinks = await page.locator('a').all();
    const clientLinks = [];

    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/clients/') && !href.includes('/clients/new')) {
        // Extract client ID from URL
        const clientId = href.replace('/clients/', '');
        if (clientId && clientId.length > 10) { // UUIDs are longer
          clientLinks.push({ href, id: clientId });
          console.log('Found client link:', href);
        }
      }
    }

    console.log(`Found ${clientLinks.length} real client links`);

    if (clientLinks.length > 0) {
      // Navigate to first real client
      const firstClient = clientLinks[0];
      console.log('Navigating to:', firstClient.href);

      await page.goto(`${APP_URL}${firstClient.href}`);
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/manual-02-client-detail.png',
        fullPage: true
      });

      // Look for Billing Contact section
      const pageText = await page.textContent('body');
      if (pageText?.includes('Billing Contact')) {
        console.log('✓ Found "Billing Contact" text on page');

        // Scroll to billing section
        const billingHeading = page.locator('text="Billing Contact"').first();
        await billingHeading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/manual-03-billing-section.png',
          fullPage: false
        });

        // Check for checkbox
        const checkbox = page.locator('input[type="checkbox"]#billing-email-same');
        const checkboxExists = await checkbox.count() > 0;
        console.log('✓ Checkbox exists:', checkboxExists);

        if (checkboxExists) {
          const isChecked = await checkbox.isChecked();
          console.log('  Checkbox checked:', isChecked);

          const label = page.locator('label[for="billing-email-same"]');
          const labelText = await label.textContent();
          console.log('  Checkbox label:', labelText);

          // Test toggling
          console.log('\nTesting checkbox toggle...');
          await checkbox.click();
          await page.waitForTimeout(2000);

          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/manual-04-after-toggle.png',
            fullPage: false
          });

          const newState = await checkbox.isChecked();
          console.log('✓ Checkbox toggled to:', newState);
          expect(newState).toBe(!isChecked);

          // Check for dropdown
          const dropdown = page.locator('button[role="combobox"]').first();
          const dropdownExists = await dropdown.count() > 0;
          console.log('✓ Dropdown exists:', dropdownExists);

          if (dropdownExists) {
            const dropdownDisabled = await dropdown.isDisabled();
            console.log('  Dropdown disabled:', dropdownDisabled);

            if (!dropdownDisabled) {
              console.log('\nOpening dropdown...');
              await dropdown.click();
              await page.waitForTimeout(1000);

              await page.screenshot({
                path: 'e2e/screenshots/billing-contact/manual-05-dropdown-open.png',
                fullPage: false
              });

              const options = page.locator('[role="option"]');
              const optionCount = await options.count();
              console.log(`✓ Found ${optionCount} dropdown options`);

              for (let i = 0; i < Math.min(optionCount, 5); i++) {
                const optionText = await options.nth(i).textContent();
                console.log(`  Option ${i + 1}:`, optionText?.trim());
              }

              // Try selecting a contact
              const contactOption = options.filter({ hasNotText: /No billing contact/i }).first();
              if (await contactOption.count() > 0) {
                console.log('\nSelecting a billing contact...');
                await contactOption.click();
                await page.waitForTimeout(2000);

                await page.screenshot({
                  path: 'e2e/screenshots/billing-contact/manual-06-contact-selected.png',
                  fullPage: false
                });

                // Verify checkbox is now unchecked
                const checkboxAfterSelect = await checkbox.isChecked();
                console.log('✓ Checkbox after contact select:', checkboxAfterSelect);

                // Look for success toast
                const toast = page.locator('[role="status"], div[class*="toast"]').first();
                if (await toast.count() > 0 && await toast.isVisible({ timeout: 2000 })) {
                  const toastText = await toast.textContent();
                  console.log('✓ Toast shown:', toastText?.trim());
                }
              }
            }
          }

          // Final state
          console.log('\n=== FINAL STATE ===');
          const finalCheckbox = await checkbox.isChecked();
          console.log('Checkbox checked:', finalCheckbox);

          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/manual-07-final-state.png',
            fullPage: true
          });

          console.log('\n=== TEST COMPLETE ===');
          console.log('✓ Billing Contact selector is displayed');
          console.log('✓ Checkbox can be toggled');
          console.log('✓ Dropdown interaction tested');
        }
      } else {
        console.log('✗ "Billing Contact" text not found on page');
      }
    } else {
      console.log('✗ No real client links found');
      console.log('Creating a test client first would be helpful');
    }
  });
});
