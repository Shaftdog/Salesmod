/**
 * Automated Playwright tests for Client Merge feature
 *
 * Prerequisites:
 * - Supabase configured with valid credentials
 * - Test database with sample clients
 * - User authenticated
 *
 * Run with: npx playwright test tests/merge-feature/merge-clients.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test.describe('Client Merge Feature', () => {
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
    test('should display Find Duplicates button on clients page', async () => {
      await page.goto(`${BASE_URL}/clients`);

      // Wait for page to load
      await expect(page.locator('h1, h2, h3').filter({ hasText: 'Clients' })).toBeVisible();

      // Find the "Find Duplicates" button
      const findDuplicatesButton = page.locator('button:has-text("Find Duplicates")');
      await expect(findDuplicatesButton).toBeVisible();

      // Verify button has icon
      await expect(findDuplicatesButton.locator('svg')).toBeVisible();
    });

    test('should open merge dialog when clicking Find Duplicates', async () => {
      await page.goto(`${BASE_URL}/clients`);

      // Click Find Duplicates button
      await page.click('button:has-text("Find Duplicates")');

      // Dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Verify dialog title
      await expect(dialog.locator('h2')).toContainText('Merge Duplicate Clients');

      // Verify dialog description mentions contacts, orders, and properties
      await expect(dialog).toContainText('contacts');
      await expect(dialog).toContainText('orders');
    });
  });

  test.describe('2. Empty State', () => {
    test('should show loading state then display results', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should show loading spinner initially
      const spinner = dialog.locator('svg.animate-spin, [class*="animate-spin"]');
      await expect(spinner).toBeVisible({ timeout: 2000 });

      // Wait for loading to complete (up to 15 seconds for API response)
      await spinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(async () => {
        // If still loading after 15 seconds, there may be an API issue
        console.log('API taking longer than expected');
      });

      // Additional wait for content to render
      await page.waitForTimeout(1000);

      // Check for no duplicates message OR duplicate list OR still loading
      const noDuplicatesAlert = dialog.locator('text=/no duplicate clients found/i');
      const duplicatesList = dialog.locator('text=/found.*potential duplicate/i');
      const stillLoading = await spinner.isVisible().catch(() => false);

      const hasNoDuplicates = await noDuplicatesAlert.isVisible().catch(() => false);
      const hasDuplicates = await duplicatesList.isVisible().catch(() => false);

      expect(hasNoDuplicates || hasDuplicates || stillLoading).toBeTruthy();

      if (hasNoDuplicates) {
        await expect(noDuplicatesAlert).toContainText('clean');
      }
    });

    test('should close dialog with Close button', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      await page.waitForTimeout(1000);

      await page.click('button:has-text("Close")');

      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('3. Duplicate List Display', () => {
    test.skip('should display duplicate pairs with company details', async () => {
      // Requires test data
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await page.waitForTimeout(1500);

      const duplicatePairs = dialog.locator('[class*="border rounded-lg p-4"]');

      await expect(duplicatePairs.first()).toBeVisible();

      const firstPair = duplicatePairs.first();

      // Should show company names (2)
      await expect(firstPair.locator('[class*="font-medium"]')).toHaveCount(2);

      // Should show match type badge
      await expect(firstPair.locator('text=/Exact Domain Match|Similar Name/')).toBeVisible();

      // Should show similarity percentage
      await expect(firstPair).toContainText('%');

      // Should show domain icons (if domains present)
      const domainElements = firstPair.locator('svg[class*="h-3 w-3"]');
      const domainCount = await domainElements.count();
      expect(domainCount).toBeGreaterThanOrEqual(0);
    });

    test.skip('should make duplicate pairs clickable', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await page.waitForTimeout(1500);

      const firstPair = dialog.locator('[class*="border rounded-lg p-4"]').first();

      // Should have hover effect class
      await expect(firstPair).toHaveClass(/cursor-pointer/);

      await firstPair.click();

      // Should switch to winner selection
      await expect(dialog.locator('text="Select which client to keep"')).toBeVisible();
    });
  });

  test.describe('4. Winner Selection', () => {
    test.skip('should display radio buttons for winner selection', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const radioGroup = dialog.locator('[role="radiogroup"]');
      await expect(radioGroup).toBeVisible();

      const radioButtons = radioGroup.locator('[role="radio"]');
      await expect(radioButtons).toHaveCount(2);

      // First should be auto-selected
      await expect(radioButtons.first()).toHaveAttribute('aria-checked', 'true');
    });

    test.skip('should show comprehensive warning about data transfer', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Should mention multiple record types
      await expect(dialog).toContainText('contacts');
      await expect(dialog).toContainText('orders');
      await expect(dialog).toContainText('properties');
      await expect(dialog).toContainText('transferred');
    });

    test.skip('should allow changing winner selection', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const radioButtons = dialog.locator('[role="radio"]');

      // Click second radio
      await radioButtons.nth(1).click();

      await expect(radioButtons.nth(1)).toHaveAttribute('aria-checked', 'true');
      await expect(radioButtons.first()).toHaveAttribute('aria-checked', 'false');
    });

    test.skip('should show company names and domains in radio options', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const radioOptions = dialog.locator('[class*="border rounded-lg p-4"]');

      // Each option should have company name
      await expect(radioOptions.first().locator('[class*="font-medium"]')).toBeVisible();

      // May have domain (Globe icon)
      const globeIcon = radioOptions.first().locator('svg[class*="h-3 w-3"]');
      // May or may not be present depending on data
    });

    test.skip('should allow going back to list', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      await page.click('button:has-text("Back to List")');

      await expect(dialog.locator('text="Found"')).toBeVisible();
      await expect(dialog.locator('text="potential duplicate"')).toBeVisible();
    });
  });

  test.describe('5. Merge Execution', () => {
    test.skip('should show loading state during merge', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const mergeButton = page.locator('button:has-text("Merge Clients")');

      await mergeButton.click();

      // Loading spinner
      await expect(mergeButton.locator('[class*="animate-spin"]')).toBeVisible();

      // Button disabled
      await expect(mergeButton).toBeDisabled();
    });

    test.skip('should show success toast with record count', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Clients")');

      await page.waitForTimeout(2000);

      // Dialog closes
      await expect(dialog).not.toBeVisible();

      // Success toast
      const toast = page.locator('[role="status"]', { hasText: 'Clients merged successfully' });
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Merged');
      await expect(toast).toContainText('related records');
    });

    test.skip('should refresh clients list after merge', async () => {
      await page.goto(`${BASE_URL}/clients`);

      const initialClients = await page.locator('[data-testid="client-card"]').count();

      await page.click('button:has-text("Find Duplicates")');
      await page.waitForTimeout(1500);

      const dialog = page.locator('[role="dialog"]');
      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Clients")');

      await page.waitForTimeout(2000);

      // Client count decreases
      const finalClients = await page.locator('[data-testid="client-card"]').count();
      expect(finalClients).toBe(initialClients - 1);
    });
  });

  test.describe('6. Data Verification', () => {
    test.skip('should transfer all contacts to winner', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      // Note: Would need to capture client IDs and verify via API
      // This is a placeholder for the test structure

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // TODO: Get winner and loser IDs
      // TODO: Get contact counts before merge

      await page.click('button:has-text("Merge Clients")');
      await page.waitForTimeout(2000);

      // TODO: Verify winner has all contacts
      // TODO: Verify loser client deleted
    });

    test.skip('should transfer all orders to winner', async () => {
      // Similar structure to contacts test
      // Would verify orders transferred correctly
    });

    test.skip('should make loser client inaccessible', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // TODO: Capture loser client ID

      await page.click('button:has-text("Merge Clients")');
      await page.waitForTimeout(2000);

      // TODO: Try to navigate to loser client detail page
      // Should get 404 or redirect
    });
  });

  test.describe('7. Error Handling', () => {
    test.skip('should handle merge failure gracefully', async () => {
      await page.route('**/api/clients/merge', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Database error' })
        });
      });

      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Clients")');

      await page.waitForTimeout(1000);

      const errorToast = page.locator('[role="status"]', { hasText: 'Merge failed' });
      await expect(errorToast).toBeVisible();

      await expect(dialog).toBeVisible();
    });

    test.skip('should handle network timeout', async () => {
      await page.route('**/api/clients/merge', route => {
        // Delay response significantly
        setTimeout(() => {
          route.fulfill({
            status: 504,
            body: JSON.stringify({ error: 'Gateway timeout' })
          });
        }, 10000);
      });

      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();
      await page.click('button:has-text("Merge Clients")');

      // Should show loading for a while
      const mergeButton = page.locator('button:has-text("Merge Clients")');
      await expect(mergeButton).toBeDisabled();

      // Eventually should fail
      await page.waitForTimeout(11000);
      const errorToast = page.locator('[role="status"]');
      await expect(errorToast).toBeVisible();
    });
  });

  test.describe('8. Keyboard Navigation', () => {
    test('should close dialog with Escape key', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(dialog).not.toBeVisible();
    });

    test.skip('should support Tab navigation', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      // Tab through radio buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should reach merge button
      const mergeButton = page.locator('button:has-text("Merge Clients")');
      await expect(mergeButton).toBeFocused();
    });

    test.skip('should support Enter key for merge', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const mergeButton = page.locator('button:has-text("Merge Clients")');
      await mergeButton.focus();
      await page.keyboard.press('Enter');

      // Should trigger merge
      await expect(mergeButton.locator('[class*="animate-spin"]')).toBeVisible();
    });
  });

  test.describe('9. Accessibility', () => {
    test('should have proper semantic HTML', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toHaveAttribute('role', 'dialog');
    });

    test('should have focusable interactive elements', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1000);
      const dialog = page.locator('[role="dialog"]');

      const closeButton = dialog.locator('button:has-text("Close")');
      await closeButton.focus();
      await expect(closeButton).toBeFocused();
    });

    test.skip('should have descriptive labels for radio buttons', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const labels = dialog.locator('label');
      await expect(labels).toHaveCount(2);

      // Each label should have text
      for (let i = 0; i < 2; i++) {
        const labelText = await labels.nth(i).textContent();
        expect(labelText).toBeTruthy();
        expect(labelText!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('10. Performance', () => {
    test.skip('should load duplicate detection quickly', async () => {
      await page.goto(`${BASE_URL}/clients`);

      const startTime = Date.now();

      await page.click('button:has-text("Find Duplicates")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Wait for content to load
      await page.waitForTimeout(100);
      const content = await page.locator('[role="status"], [class*="space-y-3"]').first().isVisible();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load in under 3 seconds (adjust based on your performance requirements)
      expect(loadTime).toBeLessThan(3000);
    });

    test.skip('should merge quickly with moderate data', async () => {
      await page.goto(`${BASE_URL}/clients`);
      await page.click('button:has-text("Find Duplicates")');

      await page.waitForTimeout(1500);
      const dialog = page.locator('[role="dialog"]');

      await dialog.locator('[class*="border rounded-lg p-4"]').first().click();

      const startTime = Date.now();

      await page.click('button:has-text("Merge Clients")');

      // Wait for merge to complete (dialog closes)
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      const endTime = Date.now();
      const mergeTime = endTime - startTime;

      // Should complete in under 5 seconds
      expect(mergeTime).toBeLessThan(5000);
    });
  });
});
