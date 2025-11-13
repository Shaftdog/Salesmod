import { test, expect } from '@playwright/test';

/**
 * Quick smoke test for AI Chat Agent accessibility
 */

test.describe('AI Chat Agent - Quick Test', () => {
  test('should be able to access agent chat and send a message', async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(120000);

    // Navigate to login
    console.log('Navigating to login...');
    await page.goto('http://localhost:9002/login');
    await page.screenshot({ path: 'test-results/01-login-page.png' });

    // Login
    console.log('Filling login form...');
    await page.fill('input[name="username"]', 'shaugabrooks');
    await page.fill('input[name="password"]', 'Latter!974');
    await page.screenshot({ path: 'test-results/02-login-filled.png' });

    // Submit
    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.screenshot({ path: 'test-results/03-dashboard.png' });
    console.log('Successfully logged in and redirected to dashboard');

    // Look for agent/chat navigation
    console.log('Looking for agent chat link...');

    // Try different possible locations
    const possibleSelectors = [
      'a[href*="agent"]',
      'text=Agent',
      'text=Chat',
      '[role="navigation"] a:has-text("Agent")',
    ];

    let found = false;
    for (const selector of possibleSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found agent link with selector: ${selector}`);
        await element.click();
        found = true;
        break;
      }
    }

    if (!found) {
      // Try direct navigation
      console.log('No link found, trying direct navigation...');
      await page.goto('http://localhost:9002/agent');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/04-agent-page.png' });

    // Look for chat input
    console.log('Looking for chat input...');
    const chatInput = page.locator('input[type="text"], textarea').filter({ hasText: '' }).first();

    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('Chat input found!');

    await page.screenshot({ path: 'test-results/05-chat-interface.png' });

    // Send a simple message
    console.log('Sending test message...');
    await chatInput.fill('Hello, can you hear me?');
    await page.screenshot({ path: 'test-results/06-message-typed.png' });

    // Find and click send button or press Enter
    const sendButton = page.locator('button[type="submit"]').last();
    if (await sendButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sendButton.click();
    } else {
      await chatInput.press('Enter');
    }

    console.log('Message sent, waiting for response...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/07-response-received.png' });

    // Check for any response
    const messages = page.locator('[role="assistant"], .bg-muted, .prose').count();
    console.log(`Found ${await messages} message elements`);

    console.log('✅ Quick test completed');
  });
});
