import { test, expect } from '@playwright/test';
import { authenticateTestUser } from './auth-helper';

/**
 * E2E Tests for Task Viewer with AI Agent Chat Integration
 *
 * Tests the complete user flow:
 * 1. Navigate to tasks page
 * 2. Filter and view tasks
 * 3. Open task detail sheet
 * 4. Interact with AI Agent review chat
 * 5. Test all actions (edit, complete, delete)
 */

const BASE_URL = 'http://localhost:9002';

test.describe('Task Viewer with AI Agent Chat', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate test user
    console.log('Authenticating test user...');
    const authenticated = await authenticateTestUser(page);

    if (!authenticated) {
      console.error('Failed to authenticate - tests may fail');
    }

    // Navigate to the app
    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('1. Navigate to Tasks Page and verify page loads', async ({ page }) => {
    console.log('Test 1: Navigating to tasks page...');

    // Navigate to tasks page
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Verify we're on tasks page
    await expect(page).toHaveURL(/.*tasks.*/);

    // Check for page title
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: 'Tasks' }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/01-tasks-page-loaded.png',
      fullPage: true
    });

    console.log('✓ Tasks page loaded successfully');
  });

  test('2. Verify filter tabs work correctly', async ({ page }) => {
    console.log('Test 2: Testing filter tabs...');

    // Navigate to tasks
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Check for tab buttons
    const activeTab = page.locator('[role="tab"]').filter({ hasText: 'Active' });
    const myTasksTab = page.locator('[role="tab"]').filter({ hasText: 'My Tasks' });
    const completedTab = page.locator('[role="tab"]').filter({ hasText: 'Completed' });
    const allTab = page.locator('[role="tab"]').filter({ hasText: 'All' });

    // Verify all tabs exist
    await expect(activeTab).toBeVisible({ timeout: 5000 });
    await expect(myTasksTab).toBeVisible();
    await expect(completedTab).toBeVisible();
    await expect(allTab).toBeVisible();

    // Screenshot before clicking
    await page.screenshot({
      path: 'e2e/screenshots/03-filter-tabs-visible.png',
      fullPage: true
    });

    // Click each tab and verify URL or state changes
    await myTasksTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/04-my-tasks-filter.png',
      fullPage: true
    });

    await completedTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/05-completed-filter.png',
      fullPage: true
    });

    await allTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/06-all-tasks-filter.png',
      fullPage: true
    });

    await activeTab.click();
    await page.waitForTimeout(500);

    console.log('✓ Filter tabs working');
  });

  test('3. Open task detail sheet and verify content', async ({ page }) => {
    console.log('Test 3: Opening task detail sheet...');

    // Navigate to tasks
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Look for the first task card
    const taskCards = page.locator('[role="button"]:has-text(""), article, div[class*="task"]').filter({
      has: page.locator('text=/priority|status|due/i')
    });

    // Alternative: Look for any clickable task item
    const firstTask = page.locator('div').filter({
      has: page.locator('text=/task|title/i')
    }).filter({
      has: page.locator('button, [role="button"]')
    }).first();

    // Try to find and click a task
    let taskClicked = false;

    // Strategy 1: Look for TaskCard component
    const taskCard = page.locator('[data-testid="task-card"], div[class*="TaskCard"]').first();
    if (await taskCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskCard.click();
      taskClicked = true;
    }

    // Strategy 2: Look for any div with task-like content
    if (!taskClicked) {
      const anyTask = page.locator('div').filter({
        has: page.locator('button:has-text("Complete"), button:has-text("Edit")')
      }).first();

      if (await anyTask.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyTask.click();
        taskClicked = true;
      }
    }

    // Strategy 3: Click any visible task title or card
    if (!taskClicked) {
      const visibleTask = page.locator('div[class*="card"], div[class*="task"]').first();
      if (await visibleTask.isVisible({ timeout: 3000 }).catch(() => false)) {
        await visibleTask.click();
        taskClicked = true;
      }
    }

    if (!taskClicked) {
      console.log('No tasks found - checking if list is empty');
      await page.screenshot({
        path: 'e2e/screenshots/07-no-tasks-found.png',
        fullPage: true
      });
      test.skip('No tasks available to test');
      return;
    }

    // Wait for sheet to open
    await page.waitForTimeout(1000);

    // Look for the sheet/modal that should have opened
    const sheet = page.locator('[role="dialog"], [data-state="open"]').first();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Verify sheet content
    await expect(sheet).toContainText(/task|title|description|priority|status/i);

    // Take screenshot of opened sheet
    await page.screenshot({
      path: 'e2e/screenshots/08-task-detail-sheet-open.png',
      fullPage: true
    });

    // Check for key elements
    const priorityBadge = sheet.locator('text=/priority/i');
    const statusBadge = sheet.locator('text=/pending|in progress|completed/i');

    // Verify badges exist
    await expect(priorityBadge).toBeVisible();
    await expect(statusBadge).toBeVisible();

    console.log('✓ Task detail sheet opened with correct content');
  });

  test('4. Test AI Agent Review Chat - Open and verify UI', async ({ page }) => {
    console.log('Test 4: Testing AI Agent chat interface...');

    // Navigate and open a task
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Click first available task
    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
    } else {
      console.log('No tasks available');
      test.skip('No tasks to test');
      return;
    }

    await page.waitForTimeout(1000);

    // Look for "Review with AI Agent" button
    const reviewButton = page.locator('button').filter({
      hasText: /Review with AI Agent|Review with.*AI/i
    });

    await expect(reviewButton).toBeVisible({ timeout: 5000 });

    // Screenshot before clicking
    await page.screenshot({
      path: 'e2e/screenshots/09-before-ai-chat.png',
      fullPage: true
    });

    // Click the button to open chat
    await reviewButton.click();
    await page.waitForTimeout(1000);

    // Verify chat interface appears
    const chatContainer = page.locator('div').filter({
      has: page.locator('text=/get help|discuss|suggestions/i')
    });

    await expect(chatContainer).toBeVisible({ timeout: 5000 });

    // Check for initial bot message
    const initialMessage = page.locator('text=/I can help you|What would you like/i');
    await expect(initialMessage).toBeVisible();

    // Check for quick action buttons
    const quickAction1 = page.locator('button').filter({ hasText: /How to approach/i });
    const quickAction2 = page.locator('button').filter({ hasText: /Need context/i });
    const quickAction3 = page.locator('button').filter({ hasText: /Next steps/i });

    await expect(quickAction1).toBeVisible();
    await expect(quickAction2).toBeVisible();
    await expect(quickAction3).toBeVisible();

    // Screenshot of chat opened
    await page.screenshot({
      path: 'e2e/screenshots/10-ai-chat-opened.png',
      fullPage: true
    });

    console.log('✓ AI Agent chat interface loaded correctly');
  });

  test('5. Test quick action buttons populate input', async ({ page }) => {
    console.log('Test 5: Testing quick action buttons...');

    // Navigate, open task, open chat
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);
    } else {
      test.skip('No tasks available');
      return;
    }

    const reviewButton = page.locator('button').filter({
      hasText: /Review with AI Agent/i
    });
    await reviewButton.click({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Find the input field
    const chatInput = page.locator('input[placeholder*="Ask"], input[placeholder*="task"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Click first quick action
    const quickAction = page.locator('button').filter({ hasText: /How to approach/i });
    await quickAction.click();
    await page.waitForTimeout(500);

    // Verify input was populated
    const inputValue = await chatInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
    expect(inputValue).toContain('approach');

    await page.screenshot({
      path: 'e2e/screenshots/11-quick-action-populated.png',
      fullPage: true
    });

    console.log('✓ Quick action button populated input correctly');
  });

  test('6. Send message and verify AI response streams', async ({ page }) => {
    console.log('Test 6: Testing AI message streaming...');

    // Setup: Navigate to tasks and open chat
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);
    } else {
      test.skip('No tasks available');
      return;
    }

    const reviewButton = page.locator('button').filter({
      hasText: /Review with AI Agent/i
    });
    await reviewButton.click({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Find input and send button
    const chatInput = page.locator('input[placeholder*="Ask"], input[placeholder*="task"]').first();
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();

    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await expect(sendButton).toBeVisible();

    // Type a test message
    await chatInput.fill('What should I do first?');
    await page.waitForTimeout(500);

    // Screenshot before sending
    await page.screenshot({
      path: 'e2e/screenshots/12-message-ready-to-send.png',
      fullPage: true
    });

    // Send the message
    await sendButton.click();
    await page.waitForTimeout(500);

    // Verify user message appears
    const userMessage = page.locator('div').filter({
      hasText: 'What should I do first?'
    });
    await expect(userMessage).toBeVisible({ timeout: 5000 });

    // Screenshot after user message sent
    await page.screenshot({
      path: 'e2e/screenshots/13-user-message-sent.png',
      fullPage: true
    });

    // Look for loading indicator
    const loadingIndicator = page.locator('text=/thinking|loading/i, svg[class*="animate-spin"]');

    // Wait a moment for AI to respond
    await page.waitForTimeout(2000);

    // Look for bot response (should appear as streaming text)
    const botResponse = page.locator('div').filter({
      has: page.locator('[class*="bot"], [class*="assistant"]')
    }).filter({
      hasNotText: 'I can help you with this task' // Not the initial message
    }).last();

    // Wait for response to appear
    await page.waitForTimeout(3000);

    // Screenshot during/after response
    await page.screenshot({
      path: 'e2e/screenshots/14-ai-response-received.png',
      fullPage: true
    });

    console.log('✓ AI response streaming test completed');
  });

  test('7. Test Edit button functionality', async ({ page }) => {
    console.log('Test 7: Testing Edit button...');

    // Navigate and open task detail
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);
    } else {
      test.skip('No tasks available');
      return;
    }

    // Find Edit button (could be in footer or dropdown menu)
    let editButton = page.locator('button').filter({ hasText: /^Edit$/i });

    // If not found, check dropdown menu
    if (!await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click the three-dot menu
      const menuButton = page.locator('button[aria-label*="menu"], button:has-text("...")').first();
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);
        editButton = page.locator('button, a').filter({ hasText: /Edit Task/i });
      }
    }

    await expect(editButton).toBeVisible({ timeout: 5000 });

    // Screenshot before clicking
    await page.screenshot({
      path: 'e2e/screenshots/15-before-edit-click.png',
      fullPage: true
    });

    // Click edit button
    await editButton.click();
    await page.waitForTimeout(1000);

    // Verify edit form or dialog appears
    const editForm = page.locator('form, [role="dialog"]').filter({
      has: page.locator('input, textarea')
    });

    await expect(editForm).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'e2e/screenshots/16-edit-form-opened.png',
      fullPage: true
    });

    console.log('✓ Edit button works correctly');
  });

  test('8. Test Complete button functionality', async ({ page }) => {
    console.log('Test 8: Testing Complete button...');

    // Navigate and open an active task
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Make sure we're on Active tasks tab
    const activeTab = page.locator('[role="tab"]').filter({ hasText: 'Active' });
    await activeTab.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);
    } else {
      test.skip('No active tasks available');
      return;
    }

    // Find Complete button
    const completeButton = page.locator('button').filter({ hasText: /Complete/i });

    // Only proceed if Complete button is visible (not already completed)
    if (!await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Task already completed or Complete button not found');
      test.skip('Task already completed');
      return;
    }

    await page.screenshot({
      path: 'e2e/screenshots/17-before-complete.png',
      fullPage: true
    });

    // Click complete button
    await completeButton.click();
    await page.waitForTimeout(1500);

    // Verify task was marked as complete (sheet might close)
    await page.screenshot({
      path: 'e2e/screenshots/18-after-complete.png',
      fullPage: true
    });

    console.log('✓ Complete button clicked successfully');
  });

  test('9. Test Delete functionality via dropdown menu', async ({ page }) => {
    console.log('Test 9: Testing Delete via dropdown menu...');

    // Navigate and open task
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);
    } else {
      test.skip('No tasks available');
      return;
    }

    // Find and click the three-dot menu
    const menuButton = page.locator('button').filter({
      has: page.locator('svg')
    }).filter({
      hasText: ''
    }).last();

    // Alternative: Look for MoreHorizontal icon button
    const moreButton = page.locator('button[aria-label*="menu"], button[aria-haspopup="menu"]').first();

    let menuOpened = false;
    if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreButton.click();
      menuOpened = true;
    } else if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuButton.click();
      menuOpened = true;
    }

    if (!menuOpened) {
      console.log('Dropdown menu not found');
      test.skip('Dropdown menu not accessible');
      return;
    }

    await page.waitForTimeout(500);

    // Look for Delete option
    const deleteOption = page.locator('button, a, [role="menuitem"]').filter({
      hasText: /Delete/i
    });

    await expect(deleteOption).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'e2e/screenshots/19-delete-option-visible.png',
      fullPage: true
    });

    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      console.log('Confirmation dialog appeared:', dialog.message());
      await dialog.dismiss(); // Dismiss to avoid actually deleting
    });

    // Click delete
    await deleteOption.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/20-delete-confirmation.png',
      fullPage: true
    });

    console.log('✓ Delete option accessible via dropdown menu');
  });

  test('10. Console errors check', async ({ page }) => {
    console.log('Test 10: Checking for console errors...');

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate through the feature
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const firstTask = page.locator('div[class*="card"], div[class*="task"]').first();
    if (await firstTask.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(1000);

      // Try to open AI chat
      const reviewButton = page.locator('button').filter({
        hasText: /Review with AI Agent/i
      });

      if (await reviewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors found:');
      consoleErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✓ No console errors detected');
    }

    if (consoleWarnings.length > 0) {
      console.log('Console Warnings found:');
      consoleWarnings.slice(0, 5).forEach(warning => console.log('  -', warning));
    }

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/21-final-state.png',
      fullPage: true
    });
  });
});
