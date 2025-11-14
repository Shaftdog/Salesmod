/**
 * Automated Playwright tests for Contact Merge feature
 *
 * Prerequisites:
 * - Supabase configured with valid credentials
 * - Test database with sample contacts
 * - User authenticated
 *
 * Run with: npx playwright test tests/merge-feature/merge-contacts.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('Contact Merge Feature', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // TODO: Add authentication logic here
    // await page.goto(`${BASE_URL}/login`);
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    // await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test.describe('1. Navigation and UI Elements', () => {
    test('should display Find Duplicates button on contacts page', async () => {
      await page.goto(`${BASE_URL}/contacts`);

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('Contacts');

      // Find the "Find Duplicates" button
      const findDuplicatesButton = page.locator('button', { hasText: 'Find Duplicates' });
      await expect(findDuplicatesButton).toBeVisible();

      // Verify button has Combine icon
      await expect(findDuplicatesButton.locator('svg')).toBeVisible();
    });

    test('should open merge dialog when clicking Find Duplicates', async () => {
      await page.goto(`${BASE_URL}/contacts`);

      // Click Find Duplicates button
      await page.click('button:has-text("Find Duplicates")');

      // Dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Verify dialog title
      await expect(dialog.locator('h2')).toContainText('Merge Duplicate Contacts');

      // Verify dialog description
      await expect(dialog).toContainText('Review and merge duplicate contacts');
    });
  });

  test.describe('2. Empty State', () => {
    test('should show "no duplicates" message when no duplicates exist', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      // Wait for dialog to open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should show loading spinner briefly
      const spinner = dialog.locator('[class*="animate-spin"]');

      // Wait for loading to complete (either spinner disappears or content loads)
      await page.waitForTimeout(1000);

      // Check if we see "no duplicates" message OR a list of duplicates
      const noDuplicatesAlert = dialog.locator('text="No duplicate contacts found"');
      const duplicatesList = dialog.locator('[class*="space-y-3"]');

      // One of these should be visible
      const hasNoDuplicates = await noDuplicatesAlert.isVisible().catch(() => false);
      const hasDuplicates = await duplicatesList.isVisible().catch(() => false);

      expect(hasNoDuplicates || hasDuplicates).toBeTruthy();

      // If no duplicates, verify message content
      if (hasNoDuplicates) {
        await expect(noDuplicatesAlert).toContainText('clean');
      }
    });

    test('should close dialog with Close button', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Click Close button
      await page.click('button:has-text("Close")');

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('3. Duplicate List Display', () => {
    test.skip('should display duplicate pairs with details', async () => {
      // This test requires test data setup
      // TODO: Create test contacts with duplicates via API

      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await page.waitForTimeout(1500);

      // Find duplicate pair elements
      const duplicatePairs = dialog.locator('[class*="border rounded-lg p-4"]');

      // Should have at least one pair
      await expect(duplicatePairs.first()).toBeVisible();

      // Each pair should show:
      // - Contact names
      const firstPair = duplicatePairs.first();
      await expect(firstPair.locator('[class*="font-medium"]')).toHaveCount(2);

      // - Match type badge
      await expect(firstPair.locator('[class*="Badge"]')).toBeVisible();

      // - Similarity score
      await expect(firstPair).toContainText('%');
    });

    test.skip('should make duplicate pairs clickable', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await page.waitForTimeout(1500);

      const firstPair = dialog.locator('[class*="border rounded-lg p-4"]').first();

      // Should be clickable
      await expect(firstPair).toHaveClass(/cursor-pointer/);

      // Click should work
      await firstPair.click();

      // Should switch to winner selection view
      await expect(dialog.locator('text="Select which contact to keep"')).toBeVisible();
    });
  });

  test.describe('4. Winner Selection', () => {
    test.skip('should display radio buttons for winner selection', async () => {
      // Requires test data
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Click first duplicate pair
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Should show radio group
      const radioGroup = dialog.locator('[role="radiogroup"]');
      await expect(radioGroup).toBeVisible();

      // Should have 2 radio buttons
      const radioButtons = radioGroup.locator('[role="radio"]');
      await expect(radioButtons).toHaveCount(2);

      // First should be auto-selected
      await expect(radioButtons.first()).toHaveAttribute('aria-checked', 'true');
    });

    test.skip('should allow changing winner selection', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Select pair
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const radioButtons = dialog.locator('[role="radio"]');

      // Click second radio button
      await radioButtons.nth(1).click();

      // Second should now be selected
      await expect(radioButtons.nth(1)).toHaveAttribute('aria-checked', 'true');

      // First should be unselected
      await expect(radioButtons.first()).toHaveAttribute('aria-checked', 'false');
    });

    test.skip('should show warning alert about data transfer', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Should show warning
      await expect(dialog.locator('[role="alert"]')).toBeVisible();
      await expect(dialog).toContainText('All related records will be transferred');
    });

    test.skip('should allow going back to list', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Go to winner selection
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Click Back to List
      await page.click('button:has-text("Back to List")');

      // Should return to list view
      await expect(dialog.locator('text="Found"')).toBeVisible();
      await expect(dialog.locator('text="potential duplicate"')).toBeVisible();
    });
  });

  test.describe('5. Merge Execution', () => {
    test.skip('should show loading state during merge', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Select pair and winner
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const mergeButton = page.locator('button:has-text("Merge Contacts")');

      // Click merge
      await mergeButton.click();

      // Should show loading spinner
      await expect(mergeButton.locator('[class*="animate-spin"]')).toBeVisible();

      // Button should be disabled
      await expect(mergeButton).toBeDisabled();
    });

    test.skip('should show success toast after merge', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Perform merge
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Contacts")');

      // Wait for merge to complete
      await page.waitForTimeout(2000);

      // Dialog should close
      await expect(dialog).not.toBeVisible();

      // Success toast should appear
      const toast = page.locator('[role="status"]', { hasText: 'Contacts merged successfully' });
      await expect(toast).toBeVisible();

      // Toast should show record count
      await expect(toast).toContainText('related records');
    });

    test.skip('should refresh contacts list after merge', async () => {
      await page.goto(`${BASE_URL}/contacts`);

      // Get initial contact count
      const initialContacts = await page.locator('[data-testid="contact-card"]').count();

      // Perform merge
      await page.click('button:has-text("Find Duplicates")');
      await page.waitForTimeout(1500);

      const dialog = page.locator('[role="dialog"]');
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Contacts")');

      // Wait for merge
      await page.waitForTimeout(2000);

      // Contact count should decrease by 1
      const finalContacts = await page.locator('[data-testid="contact-card"]').count();
      expect(finalContacts).toBe(initialContacts - 1);
    });
  });

  test.describe('6. Error Handling', () => {
    test.skip('should handle merge failure gracefully', async () => {
      // This test requires mocking API failure
      await page.route('**/api/contacts/merge', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Database error' })
        });
      });

      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Attempt merge
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Contacts")');

      // Wait for error
      await page.waitForTimeout(1000);

      // Should show error toast
      const errorToast = page.locator('[role="status"]', { hasText: 'Merge failed' });
      await expect(errorToast).toBeVisible();

      // Dialog should remain open
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('7. Keyboard Navigation', () => {
    test('should close dialog with Escape key', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });

    test.skip('should navigate with Tab key', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Go to winner selection
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach merge button
      const mergeButton = page.locator('button:has-text("Merge Contacts")');
      await expect(mergeButton).toBeFocused();
    });
  });

  test.describe('8. Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      await page.goto(`${BASE_URL}/contacts`);

      const findDuplicatesButton = page.locator('button:has-text("Find Duplicates")');

      // Button should have accessible name
      const buttonText = await findDuplicatesButton.textContent();
      expect(buttonText).toBeTruthy();
    });

    test('should have focusable elements in dialog', async () => {
      await page.goto(`${BASE_URL}/contacts`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1000);
      const dialog = page.locator('[role="dialog"]');

      // Dialog should have role
      await expect(dialog).toHaveAttribute('role', 'dialog');

      // Close button should be focusable
      const closeButton = dialog.locator('button:has-text("Close")');
      await closeButton.focus();
      await expect(closeButton).toBeFocused();
    });
  });
});
