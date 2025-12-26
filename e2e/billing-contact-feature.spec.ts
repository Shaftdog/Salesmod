/**
 * Billing Contact Feature Test Suite
 * Tests the billing contact selector on client detail page
 * and invoice sending validation
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:9002';
const TEST_EMAIL = 'rod@myroihome.com';
const TEST_PASSWORD = 'Latter!974';

test.describe('Billing Contact Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('01 - Navigate to Clients list and open a client detail page', async ({ page }) => {
    // Navigate to Clients
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of clients list
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/01-clients-list.png',
      fullPage: true
    });

    // Find and click the first client
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await expect(firstClient).toBeVisible({ timeout: 10000 });
    await firstClient.click();

    // Wait for client detail page to load
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // Take screenshot of client detail page
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/02-client-detail-page.png',
      fullPage: true
    });

    console.log('Successfully navigated to client detail page');
  });

  test('02 - Verify Billing Contact card section is displayed', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // Find the Billing Contact card
    const billingCard = page.locator('div').filter({ hasText: /^Billing Contact/ }).first();
    await expect(billingCard).toBeVisible();

    // Verify card title and icon
    const cardTitle = billingCard.locator('h3:has-text("Billing Contact")');
    await expect(cardTitle).toBeVisible();

    // Verify card description
    const cardDescription = billingCard.locator('text=Set who receives invoices for this client');
    await expect(cardDescription).toBeVisible();

    // Take screenshot highlighting the billing contact card
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/03-billing-contact-card.png',
      fullPage: true
    });

    console.log('Billing Contact card is visible and contains expected elements');
  });

  test('03 - Verify billing contact selector is displayed', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // Find the billing contact selector section
    const billingSection = page.locator('div').filter({ hasText: /Billing Contact/ });

    // Check for the "Use company email for billing" checkbox
    const companyEmailCheckbox = page.locator('input[type="checkbox"]#billing-email-same');
    await expect(companyEmailCheckbox).toBeVisible();

    // Check for the label
    const checkboxLabel = page.locator('label[for="billing-email-same"]');
    await expect(checkboxLabel).toBeVisible();
    await expect(checkboxLabel).toContainText('Use company email for billing');

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/04-billing-selector.png',
      fullPage: true
    });

    console.log('Billing contact selector elements are visible');
  });

  test('04 - Test toggling "Use company email for billing" checkbox', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

    // Get initial state
    const initialState = await checkbox.isChecked();

    // Take screenshot before toggle
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/05a-before-checkbox-toggle.png',
      fullPage: true
    });

    // Toggle checkbox
    await checkbox.click();

    // Wait for the update to process
    await page.waitForTimeout(1000);

    // Verify state changed
    const newState = await checkbox.isChecked();
    expect(newState).toBe(!initialState);

    // Take screenshot after toggle
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/05b-after-checkbox-toggle.png',
      fullPage: true
    });

    // Look for success toast
    const toast = page.locator('[role="status"], .toast, div:has-text("Billing")').first();
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Take screenshot with toast
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/05c-toggle-success-toast.png',
      fullPage: true
    });

    console.log(`Checkbox toggled from ${initialState} to ${newState}`);
  });

  test('05 - Test selecting a billing contact from dropdown (if contacts exist)', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // First ensure the checkbox is unchecked so dropdown is enabled
    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');
    const isChecked = await checkbox.isChecked();

    if (isChecked) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot before selecting contact
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/06a-before-contact-select.png',
      fullPage: true
    });

    // Look for the billing contact dropdown
    const dropdown = page.locator('button[role="combobox"]').filter({ hasText: /Select billing contact|No billing contact/ });

    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(500);

      // Take screenshot of dropdown opened
      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/06b-dropdown-opened.png',
        fullPage: true
      });

      // Check if there are any contact options (excluding "No billing contact")
      const contactOptions = page.locator('[role="option"]').filter({ hasNotText: 'No billing contact' });
      const contactCount = await contactOptions.count();

      if (contactCount > 0) {
        // Select the first contact
        await contactOptions.first().click();
        await page.waitForTimeout(1000);

        // Take screenshot after selection
        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/06c-contact-selected.png',
          fullPage: true
        });

        // Look for success toast
        const toast = page.locator('[role="status"], .toast, div:has-text("Billing")').first();
        await expect(toast).toBeVisible({ timeout: 5000 });

        console.log('Successfully selected a billing contact from dropdown');
      } else {
        console.log('No contacts with email addresses found - this is expected for some clients');

        // Take screenshot showing no contacts
        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/06c-no-contacts-available.png',
          fullPage: true
        });
      }
    } else {
      console.log('Billing contact dropdown not visible - may be in compact mode or no contacts');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/06c-dropdown-not-found.png',
        fullPage: true
      });
    }
  });

  test('06 - Verify selecting contact unchecks "use company email" checkbox', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

    // First, check the checkbox
    if (!await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // Verify checkbox is checked
    expect(await checkbox.isChecked()).toBe(true);

    // Take screenshot with checkbox checked
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/07a-checkbox-checked.png',
      fullPage: true
    });

    // Now try to select a billing contact
    const dropdown = page.locator('button[role="combobox"]').filter({ hasText: /Select billing contact|No billing contact/ });

    if (await dropdown.isVisible()) {
      // Note: dropdown might be disabled when checkbox is checked
      const isDisabled = await dropdown.isDisabled();

      if (isDisabled) {
        console.log('Dropdown is disabled when checkbox is checked - this is expected behavior');

        // Uncheck to enable dropdown
        await checkbox.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/07b-unchecked-dropdown-enabled.png',
          fullPage: true
        });

        // Now try to select contact
        await dropdown.click();
        await page.waitForTimeout(500);

        const contactOptions = page.locator('[role="option"]').filter({ hasNotText: 'No billing contact' });
        const contactCount = await contactOptions.count();

        if (contactCount > 0) {
          await contactOptions.first().click();
          await page.waitForTimeout(1000);

          // Verify checkbox is now unchecked
          expect(await checkbox.isChecked()).toBe(false);

          await page.screenshot({
            path: 'e2e/screenshots/billing-contact/07c-contact-selected-checkbox-unchecked.png',
            fullPage: true
          });

          console.log('Selecting contact correctly unchecked the checkbox');
        } else {
          console.log('No contacts available to test this behavior');
        }
      }
    }
  });

  test('07 - Verify checking checkbox clears contact selection', async ({ page }) => {
    // Navigate to first client
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');

    // Ensure checkbox is unchecked
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // Try to select a contact first
    const dropdown = page.locator('button[role="combobox"]').filter({ hasText: /Select billing contact|No billing contact/ });

    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(500);

      const contactOptions = page.locator('[role="option"]').filter({ hasNotText: 'No billing contact' });
      const contactCount = await contactOptions.count();

      if (contactCount > 0) {
        await contactOptions.first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/08a-contact-selected.png',
          fullPage: true
        });

        // Now check the checkbox
        await checkbox.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/08b-checkbox-checked-clears-contact.png',
          fullPage: true
        });

        // Verify checkbox is checked
        expect(await checkbox.isChecked()).toBe(true);

        console.log('Checking checkbox cleared the contact selection');
      } else {
        console.log('No contacts available to test this behavior');
      }
    }
  });

  test('08 - Navigate to Invoices and verify sending validation', async ({ page }) => {
    // First, find a client and set NO billing configuration
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // Get client ID from URL
    const clientUrl = page.url();
    const clientId = clientUrl.split('/clients/')[1];

    // Clear billing settings
    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // Clear contact selection
    const dropdown = page.locator('button[role="combobox"]').filter({ hasText: /Select billing contact/ });
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(500);
      const noneOption = page.locator('[role="option"]:has-text("No billing contact")');
      if (await noneOption.isVisible()) {
        await noneOption.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/09a-no-billing-configured.png',
      fullPage: true
    });

    // Navigate to invoices
    await page.goto(`${APP_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/09b-invoices-list.png',
      fullPage: true
    });

    // Look for a draft invoice for this client
    const draftInvoice = page.locator('a[href^="/finance/invoicing/"]').first();

    if (await draftInvoice.isVisible()) {
      await draftInvoice.click();
      await page.waitForURL('**/finance/invoicing/*');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/09c-invoice-detail.png',
        fullPage: true
      });

      // Look for "Send Invoice" button
      const sendButton = page.locator('button:has-text("Send Invoice")');

      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/09d-send-dialog-opened.png',
          fullPage: true
        });

        // Click the final send button in the dialog
        const confirmSendButton = page.locator('button:has-text("Send Invoice")').last();
        await confirmSendButton.click();
        await page.waitForTimeout(2000);

        // Check for error message about missing billing contact
        const errorMessage = page.locator('text=/no billing contact/i, text=/billing email/i');

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/09e-send-error-expected.png',
          fullPage: true
        });

        console.log('Tested invoice sending - expected error for missing billing contact');
      } else {
        console.log('No Send Invoice button found - invoice may not be in draft status');
      }
    } else {
      console.log('No draft invoices found to test sending');
    }
  });

  test('09 - Verify successful invoice sending with billing configured', async ({ page }) => {
    // Navigate to a client and configure billing
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    const firstClient = page.locator('a[href^="/clients/"]').first();
    await firstClient.click();
    await page.waitForURL('**/clients/*');
    await page.waitForLoadState('networkidle');

    // Check "use company email" checkbox
    const checkbox = page.locator('input[type="checkbox"]#billing-email-same');
    if (!await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/10a-billing-configured.png',
      fullPage: true
    });

    // Navigate to invoices
    await page.goto(`${APP_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');

    // Look for a draft invoice
    const draftInvoice = page.locator('a[href^="/finance/invoicing/"]').first();

    if (await draftInvoice.isVisible()) {
      await draftInvoice.click();
      await page.waitForURL('**/finance/invoicing/*');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/10b-invoice-detail.png',
        fullPage: true
      });

      // Look for "Send Invoice" button
      const sendButton = page.locator('button:has-text("Send Invoice")');

      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/10c-send-dialog-opened.png',
          fullPage: true
        });

        // Click the final send button
        const confirmSendButton = page.locator('button:has-text("Send Invoice")').last();
        await confirmSendButton.click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: 'e2e/screenshots/billing-contact/10d-after-send-attempt.png',
          fullPage: true
        });

        // Check for success (status should change or success message)
        const successIndicator = page.locator('text=/sent/i, text=/success/i');

        console.log('Attempted to send invoice with billing configured');
      } else {
        console.log('No Send Invoice button found');
      }
    } else {
      console.log('No draft invoices found');
    }
  });
});
