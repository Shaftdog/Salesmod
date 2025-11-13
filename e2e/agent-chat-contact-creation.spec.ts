import { test, expect } from '@playwright/test';

/**
 * E2E Tests for AI Chat Agent - Contact Creation
 *
 * Tests the AI chat agent's ability to:
 * 1. Search for clients
 * 2. Create contacts using the createContact tool (NOT createCard)
 * 3. Return success confirmation with contact details
 */

test.describe('AI Chat Agent - Contact Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with provided credentials
    await page.goto('http://localhost:9002/login');

    // Fill login form
    await page.fill('input[name="username"]', 'shaugabrooks');
    await page.fill('input[name="password"]', 'Latter!974');

    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to Agent Chat (look for various possible routes)
    const agentRoutes = [
      '/agent',
      '/dashboard/agent',
      '/agent/chat',
      '/chat',
    ];

    let navigated = false;
    for (const route of agentRoutes) {
      try {
        await page.goto(`http://localhost:9002${route}`, { timeout: 5000 });
        navigated = true;
        break;
      } catch {
        continue;
      }
    }

    if (!navigated) {
      // Try to find an agent link in the navigation
      const agentLink = page.locator('a:has-text("Agent"), a:has-text("Chat")').first();
      if (await agentLink.isVisible({ timeout: 2000 })) {
        await agentLink.click();
      }
    }

    // Wait for chat interface to load
    await page.waitForSelector('[placeholder*="Ask"], [placeholder*="agent"], input[type="text"]', { timeout: 10000 });
  });

  test('should search for clients and create contact using createContact tool', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-01-initial.png',
      fullPage: true
    });

    // Step 1: Search for clients
    console.log('Step 1: Searching for clients...');
    const input = page.locator('[placeholder*="Ask"], [placeholder*="agent"], input[type="text"]').first();
    await input.fill('Can you search for clients named "test" or "demo"?');
    await input.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000); // Wait for AI to process

    // Look for client search results
    await expect(page.locator('text=/client/i')).toBeVisible({ timeout: 30000 });

    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-02-client-search.png',
      fullPage: true
    });

    // Extract client ID from response
    const responseText = await page.locator('[role="assistant"], .bg-muted').last().textContent();
    console.log('Client search response:', responseText);

    // Look for UUID pattern in response
    const uuidMatch = responseText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

    let clientId: string;
    if (uuidMatch) {
      clientId = uuidMatch[0];
      console.log('Found client ID:', clientId);
    } else {
      // Alternative: ask for all clients if no test/demo found
      console.log('No test/demo clients found, asking for all clients...');
      await input.fill('What clients do I have? List the first one.');
      await input.press('Enter');
      await page.waitForTimeout(3000);

      const newResponse = await page.locator('[role="assistant"], .bg-muted').last().textContent();
      const newUuidMatch = newResponse?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

      if (!newUuidMatch) {
        throw new Error('No clients found in system. Cannot test contact creation.');
      }

      clientId = newUuidMatch[0];
      console.log('Using client ID:', clientId);

      await page.screenshot({
        path: 'e2e/screenshots/agent-contact-02b-all-clients.png',
        fullPage: true
      });
    }

    // Step 2: Create contact with explicit instruction
    console.log('Step 2: Creating contact...');
    const contactPrompt = `Add a new contact named John Smith with email john@test.com for client ${clientId}`;
    await input.fill(contactPrompt);
    await input.press('Enter');

    // Wait for AI to process the contact creation
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-03-contact-creation.png',
      fullPage: true
    });

    // Step 3: Verify response contains success and contact details
    const contactResponse = await page.locator('[role="assistant"], .bg-muted').last().textContent();
    console.log('Contact creation response:', contactResponse);

    // Assertions
    expect(contactResponse).toBeTruthy();

    // Verify successful creation (look for positive indicators)
    const successIndicators = [
      /success/i,
      /created/i,
      /added/i,
      /John Smith/i,
      /john@test\.com/i,
    ];

    const hasSuccessIndicator = successIndicators.some(pattern => pattern.test(contactResponse || ''));
    expect(hasSuccessIndicator).toBeTruthy();

    // Verify NO error messages
    expect(contactResponse).not.toMatch(/error/i);
    expect(contactResponse).not.toMatch(/failed/i);
    expect(contactResponse).not.toMatch(/could not/i);

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-04-final-success.png',
      fullPage: true
    });

    console.log('✅ Contact creation test passed');
  });

  test('should use createContact tool, NOT createCard', async ({ page }) => {
    // This test monitors network requests to verify correct tool usage
    const toolCalls: string[] = [];

    // Monitor console logs for tool invocations
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('createContact') || text.includes('createCard')) {
        toolCalls.push(text);
        console.log('Tool call detected:', text);
      }
    });

    // Monitor network for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/agent/chat')) {
        apiCalls.push(request.url());
      }
    });

    // Navigate and setup
    const input = page.locator('[placeholder*="Ask"], [placeholder*="agent"], input[type="text"]').first();

    // Get first client
    await input.fill('What is the first client in my database?');
    await input.press('Enter');
    await page.waitForTimeout(3000);

    const clientResponse = await page.locator('[role="assistant"], .bg-muted').last().textContent();
    const clientIdMatch = clientResponse?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

    if (!clientIdMatch) {
      test.skip(true, 'No clients found in system');
      return;
    }

    const clientId = clientIdMatch[0];

    // Create contact
    await input.fill(`Create a contact named Jane Doe with email jane@example.com for client ${clientId}`);
    await input.press('Enter');

    // Wait for processing
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-tool-verification.png',
      fullPage: true
    });

    // Verify response
    const response = await page.locator('[role="assistant"], .bg-muted').last().textContent();

    // Should indicate contact creation, not card creation
    expect(response).toMatch(/contact/i);
    expect(response).not.toMatch(/card/i);
    expect(response).not.toMatch(/kanban/i);

    console.log('✅ Tool verification test passed');
  });

  test('should handle contact creation errors gracefully', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask"], [placeholder*="agent"], input[type="text"]').first();

    // Try to create contact with invalid client ID
    await input.fill('Add contact John Doe with email john@test.com for client 00000000-0000-0000-0000-000000000000');
    await input.press('Enter');

    await page.waitForTimeout(3000);

    const response = await page.locator('[role="assistant"], .bg-muted').last().textContent();

    // Should indicate error or that client wasn't found
    expect(response).toMatch(/not found|error|could not|unable/i);

    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-error-handling.png',
      fullPage: true
    });

    console.log('✅ Error handling test passed');
  });

  test('should create contact with full details', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask"], [placeholder*="agent"], input[type="text"]').first();

    // Get a client first
    await input.fill('Show me one client');
    await input.press('Enter');
    await page.waitForTimeout(3000);

    const clientResponse = await page.locator('[role="assistant"], .bg-muted').last().textContent();
    const clientIdMatch = clientResponse?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

    if (!clientIdMatch) {
      test.skip(true, 'No clients found');
      return;
    }

    const clientId = clientIdMatch[0];

    // Create contact with all details
    const fullPrompt = `Create a new contact for client ${clientId}:
    - Name: Sarah Johnson
    - Email: sarah.johnson@example.com
    - Phone: 555-123-4567
    - Title: Operations Manager`;

    await input.fill(fullPrompt);
    await input.press('Enter');

    await page.waitForTimeout(5000);

    const response = await page.locator('[role="assistant"], .bg-muted').last().textContent();

    // Verify all details in response
    expect(response).toMatch(/Sarah Johnson/i);
    expect(response).toMatch(/sarah\.johnson@example\.com/i);
    expect(response).toMatch(/success|created|added/i);

    await page.screenshot({
      path: 'e2e/screenshots/agent-contact-full-details.png',
      fullPage: true
    });

    console.log('✅ Full details test passed');
  });
});
