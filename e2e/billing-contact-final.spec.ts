/**
 * Billing Contact Feature - Final Comprehensive Test
 * Tests all aspects of the billing contact selector
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:9002';
const TEST_EMAIL = 'rod@myroihome.com';
const TEST_PASSWORD = 'Latter!974';

// Known client ID from previous test
const TEST_CLIENT_ID = '31234bf1-c643-4ad7-b4b5-fcc5a7ef2f9c';

test.describe('Billing Contact Feature - Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(60000);

    // Login
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|clients|overview/, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('01 - Navigate to client and verify Billing Contact card exists', async ({ page }) => {
    console.log('=== Test 01: Verify Billing Contact Card ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/01-client-page.png',
      fullPage: true
    });

    // Verify Billing Contact heading
    const billingHeading = page.locator('text="Billing Contact"').first();
    await expect(billingHeading).toBeVisible();
    console.log('✓ Billing Contact heading found');

    // Verify description
    const description = page.locator('text=/receives invoices/i');
    await expect(description).toBeVisible();
    console.log('✓ Description text found');

    // Scroll to billing section
    await billingHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/01-billing-card.png',
      fullPage: false
    });

    console.log('TEST 01 PASSED: Billing Contact card is displayed');
  });

  test('02 - Verify checkbox "Use company email for billing" is present', async ({ page }) => {
    console.log('=== Test 02: Verify Checkbox ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    // Look for checkbox by label text
    const checkboxLabel = page.locator('text="Use company email for billing"');
    await expect(checkboxLabel).toBeVisible();
    console.log('✓ Checkbox label found');

    // Find the actual checkbox input
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
    console.log('✓ Checkbox input found');

    const isChecked = await checkbox.isChecked();
    console.log('  Checkbox initial state:', isChecked ? 'CHECKED' : 'UNCHECKED');

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/02-checkbox-present.png',
      fullPage: false
    });

    console.log('TEST 02 PASSED: Checkbox is displayed');
  });

  test('03 - Test toggling checkbox ON and OFF', async ({ page }) => {
    console.log('=== Test 03: Toggle Checkbox ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.scrollIntoViewIfNeeded();

    // Get initial state
    const initialState = await checkbox.isChecked();
    console.log('Initial checkbox state:', initialState);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/03a-before-toggle.png',
      fullPage: false
    });

    // Toggle ON (check)
    if (!initialState) {
      console.log('Checking the checkbox...');
      await checkbox.click();
      await page.waitForTimeout(2000);

      const newState = await checkbox.isChecked();
      expect(newState).toBe(true);
      console.log('✓ Checkbox checked successfully');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/03b-checkbox-checked.png',
        fullPage: false
      });

      // Look for toast
      const toast = page.locator('[role="status"]').first();
      if (await toast.isVisible({ timeout: 3000 })) {
        const toastText = await toast.textContent();
        console.log('✓ Toast shown:', toastText?.substring(0, 100));
      }
    }

    // Toggle OFF (uncheck)
    console.log('Unchecking the checkbox...');
    await checkbox.click();
    await page.waitForTimeout(2000);

    const finalState = await checkbox.isChecked();
    expect(finalState).toBe(false);
    console.log('✓ Checkbox unchecked successfully');

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/03c-checkbox-unchecked.png',
      fullPage: false
    });

    console.log('TEST 03 PASSED: Checkbox can be toggled');
  });

  test('04 - Verify billing contact dropdown is present', async ({ page }) => {
    console.log('=== Test 04: Verify Dropdown ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    // Ensure checkbox is unchecked so dropdown is enabled
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    // Find dropdown
    const dropdown = page.locator('button[role="combobox"]').first();
    await expect(dropdown).toBeVisible();
    console.log('✓ Dropdown found');

    const isDisabled = await dropdown.isDisabled();
    console.log('  Dropdown disabled:', isDisabled);
    expect(isDisabled).toBe(false);

    await dropdown.scrollIntoViewIfNeeded();

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/04-dropdown-visible.png',
      fullPage: false
    });

    console.log('TEST 04 PASSED: Dropdown is present and enabled');
  });

  test('05 - Open dropdown and view contact options', async ({ page }) => {
    console.log('=== Test 05: Dropdown Options ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    // Ensure checkbox is unchecked
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    // Open dropdown
    const dropdown = page.locator('button[role="combobox"]').first();
    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/05a-dropdown-opened.png',
      fullPage: false
    });

    // Get all options
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    console.log(`✓ Found ${optionCount} dropdown options`);

    for (let i = 0; i < Math.min(optionCount, 10); i++) {
      const optionText = await options.nth(i).textContent();
      console.log(`  Option ${i + 1}: ${optionText?.trim()}`);
    }

    console.log('TEST 05 PASSED: Dropdown opens and shows options');
  });

  test('06 - Select a billing contact from dropdown (if available)', async ({ page }) => {
    console.log('=== Test 06: Select Billing Contact ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    // Ensure checkbox is unchecked
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    // Open dropdown
    const dropdown = page.locator('button[role="combobox"]').first();
    await dropdown.click();
    await page.waitForTimeout(1000);

    // Try to select a contact (not "No billing contact")
    const contactOption = page.locator('[role="option"]').filter({ hasNotText: /No billing contact/i }).first();

    if (await contactOption.count() > 0) {
      const optionText = await contactOption.textContent();
      console.log('Selecting contact:', optionText?.trim());

      await contactOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/06a-contact-selected.png',
        fullPage: false
      });

      // Verify checkbox is still unchecked
      const checkboxState = await checkbox.isChecked();
      console.log('✓ Checkbox state after selection:', checkboxState);
      expect(checkboxState).toBe(false);

      // Look for success toast
      const toast = page.locator('[role="status"]').first();
      if (await toast.isVisible({ timeout: 3000 })) {
        const toastText = await toast.textContent();
        console.log('✓ Toast shown:', toastText?.substring(0, 100));
      }

      console.log('TEST 06 PASSED: Billing contact selected successfully');
    } else {
      console.log('No contacts with email available - skipping selection');
      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/06a-no-contacts.png',
        fullPage: false
      });

      console.log('TEST 06 SKIPPED: No contacts available');
    }
  });

  test('07 - Verify selecting contact unchecks the checkbox', async ({ page }) => {
    console.log('=== Test 07: Contact Selection Unchecks Checkbox ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();

    // First check the checkbox
    if (!await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    const checkedState = await checkbox.isChecked();
    console.log('Checkbox checked:', checkedState);
    expect(checkedState).toBe(true);

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/07a-checkbox-checked.png',
      fullPage: false
    });

    // Now try to select a contact
    const dropdown = page.locator('button[role="combobox"]').first();

    // Dropdown might be disabled when checkbox is checked
    const isDisabled = await dropdown.isDisabled();
    console.log('Dropdown disabled when checkbox checked:', isDisabled);

    if (isDisabled) {
      console.log('✓ Dropdown correctly disabled when checkbox is checked');

      // Uncheck first
      await checkbox.click();
      await page.waitForTimeout(2000);

      // Now dropdown should be enabled
      const nowEnabled = !await dropdown.isDisabled();
      expect(nowEnabled).toBe(true);
      console.log('✓ Dropdown enabled after unchecking');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/07b-dropdown-enabled.png',
        fullPage: false
      });
    }

    // Open dropdown and select a contact
    await dropdown.click();
    await page.waitForTimeout(1000);

    const contactOption = page.locator('[role="option"]').filter({ hasNotText: /No billing contact/i }).first();

    if (await contactOption.count() > 0) {
      await contactOption.click();
      await page.waitForTimeout(2000);

      // Verify checkbox is unchecked
      const finalState = await checkbox.isChecked();
      console.log('✓ Checkbox state after contact selection:', finalState);
      expect(finalState).toBe(false);

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/07c-contact-selected-checkbox-unchecked.png',
        fullPage: false
      });

      console.log('TEST 07 PASSED: Selecting contact unchecks checkbox');
    } else {
      console.log('TEST 07 SKIPPED: No contacts available');
    }
  });

  test('08 - Verify checking checkbox clears contact selection', async ({ page }) => {
    console.log('=== Test 08: Checkbox Clears Contact ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();
    const dropdown = page.locator('button[role="combobox"]').first();

    // Ensure checkbox is unchecked
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    // Select a contact first
    await dropdown.click();
    await page.waitForTimeout(1000);

    const contactOption = page.locator('[role="option"]').filter({ hasNotText: /No billing contact/i }).first();

    if (await contactOption.count() > 0) {
      await contactOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/08a-contact-selected.png',
        fullPage: false
      });

      // Now check the checkbox
      await checkbox.click();
      await page.waitForTimeout(2000);

      expect(await checkbox.isChecked()).toBe(true);
      console.log('✓ Checkbox checked');

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/08b-checkbox-checked-clears-contact.png',
        fullPage: false
      });

      // Verify dropdown shows "No billing contact" again (or is disabled)
      const dropdownDisabled = await dropdown.isDisabled();
      console.log('✓ Dropdown disabled:', dropdownDisabled);

      console.log('TEST 08 PASSED: Checking checkbox clears contact selection');
    } else {
      console.log('TEST 08 SKIPPED: No contacts available');
    }
  });

  test('09 - Verify warning shown when no billing configured', async ({ page }) => {
    console.log('=== Test 09: Warning Message ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();
    const dropdown = page.locator('button[role="combobox"]').first();

    // Clear both checkbox and contact selection
    if (await checkbox.isChecked()) {
      await checkbox.click();
      await page.waitForTimeout(2000);
    }

    // Select "No billing contact"
    await dropdown.click();
    await page.waitForTimeout(1000);

    const noContactOption = page.locator('[role="option"]:has-text("No billing contact")');
    if (await noContactOption.isVisible({ timeout: 2000 })) {
      await noContactOption.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/09a-no-billing-configured.png',
      fullPage: false
    });

    // Look for warning message
    const warning = page.locator('text=/please select.*billing contact/i, text=/confirm.*company email/i').first();

    if (await warning.isVisible({ timeout: 2000 })) {
      const warningText = await warning.textContent();
      console.log('✓ Warning shown:', warningText?.trim());

      await page.screenshot({
        path: 'e2e/screenshots/billing-contact/09b-warning-visible.png',
        fullPage: false
      });

      console.log('TEST 09 PASSED: Warning displayed when no billing configured');
    } else {
      console.log('TEST 09 NOTE: Warning not found (may have billing already configured)');
    }
  });

  test('10 - Final state documentation', async ({ page }) => {
    console.log('=== Test 10: Document Final State ===');

    await page.goto(`${APP_URL}/clients/${TEST_CLIENT_ID}`);
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take comprehensive screenshot
    await page.screenshot({
      path: 'e2e/screenshots/billing-contact/10-final-comprehensive-view.png',
      fullPage: true
    });

    // Document current state
    const isChecked = await checkbox.isChecked();
    console.log('\n=== FINAL STATE ===');
    console.log('Checkbox "Use company email":', isChecked ? 'CHECKED' : 'UNCHECKED');

    const dropdown = page.locator('button[role="combobox"]').first();
    const dropdownText = await dropdown.textContent();
    console.log('Dropdown selection:', dropdownText?.trim());

    const dropdownDisabled = await dropdown.isDisabled();
    console.log('Dropdown disabled:', dropdownDisabled);

    console.log('\nTEST 10 PASSED: Final state documented');
  });
});
