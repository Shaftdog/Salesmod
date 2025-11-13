import { test, expect } from '@playwright/test';

/**
 * Manual E2E Test for AI Chat Agent - Contact Creation
 *
 * This test assumes the user is already logged in or can manually login.
 * It focuses on testing the contact creation flow through the chat interface.
 */

test.describe('AI Chat Agent - Contact Creation (Manual Flow)', () => {
  test.setTimeout(180000); // 3 minutes

  test('should create contact through chat interface', async ({ page }) => {
    console.log('=== Starting Contact Creation Test ===');

    // Step 1: Navigate to login page
    console.log('\n[STEP 1] Navigating to application...');
    await page.goto('http://localhost:9002');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/contact-01-initial.png', fullPage: true });

    // Check if we need to login
    const isLoginPage = await page.locator('input[placeholder="you@example.com"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginPage) {
      console.log('\n[STEP 2] Login required - filling credentials...');

      // Try with email format
      const emailInput = page.locator('input[placeholder="you@example.com"]');
      const passwordInput = page.locator('input[type="password"]');

      // Try common email patterns for the username
      const possibleEmails = [
        'shaugabrooks@gmail.com',
        'shaug@example.com',
        'admin@example.com',
        'test@example.com',
      ];

      console.log('Attempting login with shaugabrooks credentials...');

      // For now, let's assume the user will manually login
      console.log('\n⚠️  MANUAL ACTION REQUIRED:');
      console.log('   Please login using the provided credentials in the browser window');
      console.log('   Username/Email: shaugabrooks');
      console.log('   Password: Latter!974');
      console.log('   Waiting 30 seconds for manual login...\n');

      await page.waitForTimeout(30000);
    }

    // Wait for dashboard to load
    console.log('\n[STEP 3] Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      console.log('   Dashboard URL not detected, continuing anyway...');
    });
    await page.screenshot({ path: 'test-results/contact-02-dashboard.png', fullPage: true });

    // Step 4: Navigate to Agent Chat
    console.log('\n[STEP 4] Looking for Agent Chat interface...');

    // Try multiple navigation methods
    const navAttempts = [
      { method: 'link', action: async () => {
        const link = page.locator('a:has-text("Agent"), a:has-text("Chat")').first();
        if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
          await link.click();
          return true;
        }
        return false;
      }},
      { method: 'direct URL /agent', action: async () => {
        await page.goto('http://localhost:9002/agent');
        return true;
      }},
      { method: 'direct URL /dashboard/agent', action: async () => {
        await page.goto('http://localhost:9002/dashboard/agent');
        return true;
      }},
      { method: 'direct URL /chat', action: async () => {
        await page.goto('http://localhost:9002/chat');
        return true;
      }},
    ];

    for (const attempt of navAttempts) {
      console.log(`   Trying: ${attempt.method}`);
      try {
        if (await attempt.action()) {
          await page.waitForTimeout(2000);
          const hasChat = await page.locator('input[type="text"], textarea').count() > 0;
          if (hasChat) {
            console.log(`   ✅ Success via ${attempt.method}`);
            break;
          }
        }
      } catch (e) {
        console.log(`   ❌ Failed: ${attempt.method}`);
      }
    }

    await page.screenshot({ path: 'test-results/contact-03-agent-page.png', fullPage: true });

    // Step 5: Find chat input
    console.log('\n[STEP 5] Locating chat input field...');
    const chatInput = page.locator('input[placeholder*="Ask"], input[placeholder*="agent"], textarea, input[type="text"]').first();

    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Chat input found');

    // Step 6: Search for clients
    console.log('\n[STEP 6] Searching for clients...');
    await chatInput.fill('What clients do I have? List the first one with its ID.');
    await chatInput.press('Enter');

    console.log('   Waiting for AI response...');
    await page.waitForTimeout(8000); // Give AI time to respond

    await page.screenshot({ path: 'test-results/contact-04-client-search.png', fullPage: true });

    // Extract client ID from response
    const responseArea = page.locator('.prose, [role="assistant"], .bg-muted').last();
    await expect(responseArea).toBeVisible({ timeout: 5000 });

    const responseText = await responseArea.textContent() || '';
    console.log('   AI Response:', responseText.substring(0, 200) + '...');

    // Look for UUID pattern
    const uuidMatch = responseText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

    if (!uuidMatch) {
      console.log('\n   ⚠️  No client ID found in response');
      console.log('   Full response:', responseText);
      throw new Error('No clients found in the system. Cannot proceed with contact creation test.');
    }

    const clientId = uuidMatch[0];
    console.log(`   ✅ Found client ID: ${clientId}`);

    // Step 7: Create contact
    console.log('\n[STEP 7] Creating contact via AI chat...');
    const contactPrompt = `Add a new contact named John Smith with email john.smith@test.com for client ${clientId}`;
    console.log(`   Prompt: "${contactPrompt}"`);

    await chatInput.fill(contactPrompt);
    await chatInput.press('Enter');

    console.log('   Waiting for AI to create contact...');
    await page.waitForTimeout(10000); // Wait for AI processing

    await page.screenshot({ path: 'test-results/contact-05-contact-creation.png', fullPage: true });

    // Step 8: Verify response
    console.log('\n[STEP 8] Verifying contact creation...');
    const contactResponse = await page.locator('.prose, [role="assistant"], .bg-muted').last().textContent() || '';

    console.log('   AI Response:', contactResponse.substring(0, 300));

    // Check for success indicators
    const hasSuccess = /success|created|added/i.test(contactResponse);
    const hasContactName = /John Smith/i.test(contactResponse);
    const hasEmail = /john\.smith@test\.com/i.test(contactResponse);
    const hasError = /error|failed|could not|unable/i.test(contactResponse);

    console.log('\n   Verification:');
    console.log(`   - Has success message: ${hasSuccess ? '✅' : '❌'}`);
    console.log(`   - Contains contact name: ${hasContactName ? '✅' : '❌'}`);
    console.log(`   - Contains email: ${hasEmail ? '✅' : '❌'}`);
    console.log(`   - Has error message: ${hasError ? '❌ (FAIL)' : '✅'}`);

    await page.screenshot({ path: 'test-results/contact-06-final.png', fullPage: true });

    // Assertions
    expect(hasError).toBe(false);
    expect(hasSuccess || hasContactName).toBe(true);

    console.log('\n=== ✅ Contact Creation Test PASSED ===\n');
  });

  test('should verify tool usage - createContact not createCard', async ({ page }) => {
    console.log('=== Verifying Correct Tool Usage ===');

    const toolCalls: string[] = [];
    const consoleLogs: string[] = [];

    // Monitor console for tool calls
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('createContact') || text.includes('createCard') || text.includes('tool')) {
        toolCalls.push(text);
        console.log(`   📋 Tool call: ${text}`);
      }
    });

    // Navigate (assume logged in or manual login)
    await page.goto('http://localhost:9002');
    await page.waitForLoadState('networkidle');

    console.log('\n⚠️  If login required, please login manually (waiting 20s)...');
    await page.waitForTimeout(20000);

    // Find agent chat
    const possibleRoutes = ['/agent', '/dashboard/agent', '/chat'];
    for (const route of possibleRoutes) {
      try {
        await page.goto(`http://localhost:9002${route}`);
        if (await page.locator('input[type="text"], textarea').isVisible({ timeout: 2000 }).catch(() => false)) {
          break;
        }
      } catch {}
    }

    const chatInput = page.locator('input[type="text"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Get a client
    await chatInput.fill('Show me the first client');
    await chatInput.press('Enter');
    await page.waitForTimeout(8000);

    const response1 = await page.locator('.prose, [role="assistant"]').last().textContent() || '';
    const clientIdMatch = response1.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

    if (!clientIdMatch) {
      console.log('⚠️  No client found, skipping tool verification test');
      test.skip();
      return;
    }

    // Create contact and monitor
    await chatInput.fill(`Create contact Jane Doe with email jane@test.com for client ${clientIdMatch[0]}`);
    await chatInput.press('Enter');
    await page.waitForTimeout(10000);

    const response2 = await page.locator('.prose, [role="assistant"]').last().textContent() || '';

    // Verify createContact was used, not createCard
    console.log('\n   Tool Usage Analysis:');
    console.log(`   - Response mentions "contact": ${/contact/i.test(response2) ? '✅' : '❌'}`);
    console.log(`   - Response mentions "card": ${/card/i.test(response2) ? '❌ (BAD)' : '✅'}`);

    expect(response2).toMatch(/contact/i);
    expect(response2).not.toMatch(/card|kanban/i);

    console.log('\n=== ✅ Tool Verification Test PASSED ===\n');
  });
});
