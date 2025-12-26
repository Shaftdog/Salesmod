import { test, expect } from '@playwright/test';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const LOGIN_EMAIL = 'rod@myroihome.com';
const LOGIN_PASSWORD = 'Latter!974';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'my-tasks', new Date().toISOString().split('T')[0]);

test.describe('My Tasks Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Login
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation after login (avoid login page)
    await page.waitForURL(/.*\/(?!login).*/, { timeout: 15000 });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('1. Navigation - Navigate to My Tasks page and verify it loads', async ({ page }) => {
    // Navigate to My Tasks
    await page.goto(`${BASE_URL}/production/my-tasks`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of the page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-my-tasks-page-loaded.png'),
      fullPage: true
    });

    // Verify page title or heading
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log('Page Title:', pageTitle);

    // Verify task cards are present
    const taskCards = page.locator('[data-testid*="task"], .task-card, article, [class*="card"]');
    const count = await taskCards.count();
    console.log(`Found ${count} potential task cards`);

    expect(count).toBeGreaterThan(0);
  });

  test('2. Collapsible Subtasks - Expand and verify subtasks display', async ({ page }) => {
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');

    // Take screenshot before interaction
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-before-expand-subtasks.png'),
      fullPage: true
    });

    // Look for subtasks section or expand button
    // Try multiple selectors to find subtasks UI
    const possibleSubtaskSelectors = [
      'text=/.*Subtasks.*/i',
      '[data-testid*="subtask"]',
      'button:has-text("Subtasks")',
      '[class*="subtask"]',
      'text=/.*\\d+\\/\\d+.*/i' // Progress indicators like "2/5"
    ];

    let subtaskElement = null;
    for (const selector of possibleSubtaskSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          subtaskElement = element;
          console.log(`Found subtasks UI with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (subtaskElement) {
      // Click to expand if it's a button or clickable element
      try {
        await subtaskElement.click();
        await page.waitForTimeout(1000); // Wait for animation
      } catch (e) {
        console.log('Element not clickable, might already be expanded');
      }

      // Take screenshot after expansion
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-after-expand-subtasks.png'),
        fullPage: true
      });

      // Look for checkboxes, role badges
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      console.log(`Found ${checkboxCount} checkboxes (potential subtasks)`);

      // Look for role badges
      const badges = page.locator('[class*="badge"], .badge, [class*="tag"]');
      const badgeCount = await badges.count();
      console.log(`Found ${badgeCount} badges`);

      expect(checkboxCount).toBeGreaterThan(0);
    } else {
      console.log('No subtasks found on current tasks. Taking screenshot of current state.');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-no-subtasks-found.png'),
        fullPage: true
      });
    }
  });

  test('3. View Details Link - Navigate to task detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of task list
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-task-list-before-details.png'),
      fullPage: true
    });

    // Look for "View Details" button or link
    const possibleDetailSelectors = [
      'text=/.*View Details.*/i',
      'a:has-text("Details")',
      'button:has-text("Details")',
      '[data-testid*="view-details"]',
      '[href*="/my-tasks/"]'
    ];

    let detailsLink = null;
    for (const selector of possibleDetailSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          detailsLink = element;
          console.log(`Found details link with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (detailsLink) {
      // Get the current URL before clicking
      const currentUrl = page.url();

      // Click the details link
      await detailsLink.click();

      // Wait for navigation
      await page.waitForURL(/.*\/my-tasks\/.*/, { timeout: 10000 });

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Take screenshot of detail page
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03-task-detail-page.png'),
        fullPage: true
      });

      const newUrl = page.url();
      console.log('Navigated from:', currentUrl);
      console.log('Navigated to:', newUrl);

      // Verify detail page elements
      const elements = {
        title: page.locator('h1, h2').first(),
        badges: page.locator('[class*="badge"], .badge'),
        timerControls: page.locator('button:has-text("Timer"), button:has-text("Start"), button:has-text("Complete")'),
        notes: page.locator('text=/.*Notes.*/i'),
        timeEntries: page.locator('text=/.*Time.*/i')
      };

      console.log('\nDetail Page Elements Found:');
      for (const [key, locator] of Object.entries(elements)) {
        const count = await locator.count();
        console.log(`- ${key}: ${count}`);
      }

      expect(newUrl).toContain('/my-tasks/');
    } else {
      console.log('No "View Details" link found. Taking screenshot.');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03-no-details-link-found.png'),
        fullPage: true
      });
      throw new Error('Could not find "View Details" link on task cards');
    }
  });

  test('4. Back Navigation - Return from detail page to task list', async ({ page }) => {
    await page.goto(`${BASE_URL}/production/my-tasks`);
    await page.waitForLoadState('networkidle');

    // Navigate to a task detail page first - try multiple selectors
    let detailsLink = null;
    const selectors = [
      'text=/.*View Details.*/i',
      'a[href*="/my-tasks/"]',
      'button:has-text("Details")'
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          detailsLink = element;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (await detailsLink.isVisible({ timeout: 5000 })) {
      await detailsLink.click();
      await page.waitForURL(/.*\/my-tasks\/.*/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Take screenshot of detail page
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-detail-page-before-back.png'),
        fullPage: true
      });

      const detailUrl = page.url();
      console.log('On detail page:', detailUrl);

      // Look for back button
      const possibleBackSelectors = [
        'text=/.*Back to My Tasks.*/i',
        'button:has-text("Back")',
        'a:has-text("Back")',
        '[data-testid*="back"]',
        '[aria-label*="back" i]'
      ];

      let backButton = null;
      for (const selector of possibleBackSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            backButton = element;
            console.log(`Found back button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (backButton) {
        await backButton.click();
        await page.waitForURL(/.*\/my-tasks(?:\/)?$/, { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // Take screenshot after navigation back
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '04-back-to-task-list.png'),
          fullPage: true
        });

        const finalUrl = page.url();
        console.log('Returned to:', finalUrl);

        expect(finalUrl).toMatch(/\/my-tasks(?:\/)?$/);
      } else {
        console.log('No back button found. Taking screenshot.');
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '04-no-back-button-found.png'),
          fullPage: true
        });
        throw new Error('Could not find "Back to My Tasks" button');
      }
    } else {
      throw new Error('Could not navigate to detail page for back navigation test');
    }
  });
});
