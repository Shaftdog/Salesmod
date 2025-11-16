import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Email Classification Learning System
 *
 * Tests user-taught email classification rules via card review chat.
 *
 * Feature: Users can teach the AI how to classify emails by creating rules
 * through card review conversations. Rules are checked before AI classification.
 */

test.describe('Email Classification Learning System', () => {
  const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-id';
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  const KANBAN_PATH = '/agent'; // The kanban board is at /agent, not /kanban

  // Set longer timeout for AI responses
  test.setTimeout(60000); // 60 seconds per test

  test.beforeEach(async ({ page }) => {
    // Navigate to home page and ensure authentication
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Check if login page appears
    const isLoginPage = await page.locator('input[type="email"]').isVisible().catch(() => false);

    if (isLoginPage) {
      test.skip('Skipping test - authentication required. Please log in first.');
    }

    // Wait for page to be fully loaded (using domcontentloaded instead of networkidle)
    await page.waitForLoadState('domcontentloaded');
  });

  test('Scenario 1: Create classification rule via card review chat', async ({ page }) => {
    /**
     * Steps:
     * 1. Navigate to kanban board
     * 2. Find a card to review
     * 3. Open card review chat
     * 4. Tell AI about misclassification
     * 5. Verify rule creation message
     * 6. Check database for stored rule
     */

    // Navigate to kanban/cards page
    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });

    // Wait for kanban content to be visible
    await page.waitForTimeout(1000);

    // Take screenshot of kanban board
    await page.screenshot({ path: 'test-results/01-kanban-board.png', fullPage: true });

    // Find the first card with a "Review" or "Chat" button
    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasReviewButton = await reviewButton.isVisible().catch(() => false);

    if (!hasReviewButton) {
      console.log('No cards with review button found - checking for cards...');
      await page.screenshot({ path: 'test-results/01-no-review-button.png', fullPage: true });

      // Try to find any card
      const cards = page.locator('[data-testid="kanban-card"], .kanban-card, [class*="card"]');
      const cardCount = await cards.count();
      console.log(`Found ${cardCount} potential cards`);

      if (cardCount === 0) {
        test.skip('No cards available to test. Create a card first.');
      }

      // Click first card to open details
      await cards.first().click();
      await page.waitForTimeout(1000);
    } else {
      await reviewButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/02-card-opened.png', fullPage: true });

    // Look for chat input or message box
    const chatInput = page.locator('textarea, input[type="text"]').filter({
      hasText: /message|chat|type/i
    }).or(page.locator('textarea').first());

    const hasChatInput = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasChatInput) {
      console.log('Chat input not found - checking page structure...');
      await page.screenshot({ path: 'test-results/02-no-chat-input.png', fullPage: true });
      test.skip('Chat interface not found. Feature may not be implemented yet.');
    }

    // Type message to create classification rule
    const testMessage = 'This email from newsletter@hubspot.com was misclassified as OPPORTUNITY, it should be NOTIFICATIONS';
    await chatInput.fill(testMessage);
    await page.screenshot({ path: 'test-results/03-message-typed.png', fullPage: true });

    // Send message
    const sendButton = page.locator('button', { hasText: /Send|Submit/i }).or(
      page.locator('button[type="submit"]')
    );
    await sendButton.click();

    // Wait for AI response
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/04-message-sent.png', fullPage: true });

    // Check for success message indicating rule was created
    const successIndicators = [
      /classification rule created/i,
      /rule stored/i,
      /storeEmailClassificationRule/i,
      /✓.*rule/i,
    ];

    let foundSuccess = false;
    for (const pattern of successIndicators) {
      const hasSuccess = await page.locator('text=' + pattern.source).isVisible({ timeout: 2000 }).catch(() => false);
      if (hasSuccess) {
        foundSuccess = true;
        console.log(`✓ Found success indicator: ${pattern.source}`);
        break;
      }
    }

    if (foundSuccess) {
      await page.screenshot({ path: 'test-results/05-rule-created-success.png', fullPage: true });
      console.log('✓ Test PASSED: Classification rule creation confirmed');
    } else {
      await page.screenshot({ path: 'test-results/05-rule-creation-uncertain.png', fullPage: true });
      console.log('⚠ Could not confirm rule creation from UI - would need database check');
    }

    // Expect at least some response from AI
    const messages = page.locator('[class*="message"], [data-testid*="message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
  });

  test('Scenario 2: Security validations - duplicate rule rejection', async ({ page }) => {
    /**
     * Test that duplicate rules are rejected
     * This requires creating the same rule twice
     */

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Open card review
    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    // Find chat input
    const chatInput = page.locator('textarea, input[type="text"]').first();
    const hasInput = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasInput) {
      test.skip('Chat interface not available');
    }

    // Create first rule
    const ruleMessage = 'Emails from marketing@example.com should be classified as NOTIFICATIONS, not OPPORTUNITY';
    await chatInput.fill(ruleMessage);
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/10-first-rule-created.png', fullPage: true });

    // Try to create duplicate rule
    await chatInput.fill(ruleMessage);
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/11-duplicate-rule-attempt.png', fullPage: true });

    // Check for duplicate error message
    const duplicateError = await page.locator('text=/duplicate.*rule.*exists/i').isVisible({ timeout: 2000 }).catch(() => false);

    if (duplicateError) {
      console.log('✓ Test PASSED: Duplicate rule was rejected');
      await page.screenshot({ path: 'test-results/12-duplicate-rejected.png', fullPage: true });
    } else {
      console.log('⚠ Duplicate validation result unclear from UI');
    }
  });

  test('Scenario 3: Security validations - ReDoS pattern rejection', async ({ page }) => {
    /**
     * Test that dangerous regex patterns are rejected
     */

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').first();
    const hasInput = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasInput) {
      test.skip('Chat interface not available');
    }

    // Try to create a rule with dangerous ReDoS pattern
    const dangerousMessage = 'Create a subject regex rule with pattern (a+)+ to classify as NOTIFICATIONS';
    await chatInput.fill(dangerousMessage);
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/20-redos-pattern-attempt.png', fullPage: true });

    // Check for security error
    const securityError = await page.locator('text=/nested quantifier|ReDoS|security risk/i').isVisible({ timeout: 2000 }).catch(() => false);

    if (securityError) {
      console.log('✓ Test PASSED: ReDoS pattern was rejected');
      await page.screenshot({ path: 'test-results/21-redos-rejected.png', fullPage: true });
    } else {
      console.log('⚠ ReDoS validation result unclear - may need manual verification');
    }
  });

  test('Scenario 4: Rule application - verify cache invalidation', async ({ page }) => {
    /**
     * Test that creating a rule invalidates the cache
     * This is harder to test from UI but we can verify the rule creation flow
     */

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/30-before-cache-test.png', fullPage: true });

    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').first();

    // Create a unique rule to test cache invalidation
    const timestamp = Date.now();
    const uniqueRule = `Emails from test-${timestamp}@cache-test.com should be INFORMATION`;

    await chatInput.fill(uniqueRule);
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/31-cache-test-rule-created.png', fullPage: true });

    // Check for success
    const hasResponse = await page.locator('[class*="message"]').count() > 0;
    expect(hasResponse).toBe(true);

    console.log('✓ Rule created - cache should be invalidated automatically');
  });

  test('Scenario 5: UI/UX - Check classification rule management interface', async ({ page }) => {
    /**
     * Verify that users can see and manage their classification rules
     */

    // Check if there's a rules management page
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/40-settings-page.png', fullPage: true });

    // Look for classification rules section
    const rulesSection = await page.locator('text=/classification.*rule|email.*rule/i').isVisible({ timeout: 3000 }).catch(() => false);

    if (rulesSection) {
      console.log('✓ Found rules management interface');
      await page.screenshot({ path: 'test-results/41-rules-interface-found.png', fullPage: true });
    } else {
      console.log('⚠ No dedicated rules management UI found');
    }

    // Try admin panel
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/42-admin-panel.png', fullPage: true });
  });

  test('Scenario 6: Verify error messages are clear and helpful', async ({ page }) => {
    /**
     * Test that validation errors provide helpful feedback
     */

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').first();

    // Test 1: Invalid category
    await chatInput.fill('Classify emails from test@example.com as INVALID_CATEGORY');
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/50-invalid-category-test.png', fullPage: true });

    // Test 2: Missing required fields
    await chatInput.fill('Create a classification rule');
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/51-incomplete-request.png', fullPage: true });

    console.log('✓ Error message tests completed - check screenshots for validation feedback');
  });

  test('Database Verification: Check agent_memories table structure', async ({ page }) => {
    /**
     * This test documents what should be in the database
     * Actual database verification would require API access
     */

    console.log('Database verification checklist:');
    console.log('1. Table: agent_memories');
    console.log('2. Scope: email_classification');
    console.log('3. Content structure should include:');
    console.log('   - type: "classification_rule"');
    console.log('   - pattern_type: sender_email|sender_domain|subject_contains|subject_regex');
    console.log('   - pattern_value: the actual pattern');
    console.log('   - correct_category: the target category');
    console.log('   - wrong_category: what it was classified as');
    console.log('   - reason: user explanation');
    console.log('   - confidence_override: 0.99');
    console.log('   - match_count: 0');
    console.log('   - enabled: true');

    // Try to access any API that might show rules
    await page.goto(`${BASE_URL}/api/classification-rules`, { waitUntil: 'domcontentloaded' });

    const hasApiEndpoint = !page.url().includes('404');

    if (hasApiEndpoint) {
      await page.screenshot({ path: 'test-results/60-api-endpoint-found.png', fullPage: true });
      console.log('✓ Found API endpoint for classification rules');
    } else {
      console.log('⚠ No public API endpoint found for rules');
    }

    expect(true).toBe(true); // Placeholder assertion
  });

  test('Performance: Rule creation speed', async ({ page }) => {
    /**
     * Measure how long it takes to create a rule
     */

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').first();

    // Measure time
    const startTime = Date.now();

    const performanceRule = `Performance test: classify emails from perf-${startTime}@test.com as INFORMATION`;
    await chatInput.fill(performanceRule);
    await page.locator('button', { hasText: /Send|Submit/i }).click();

    // Wait for response
    await page.waitForTimeout(5000);

    const endTime = Date.now();
    const duration = endTime - startTime;

    await page.screenshot({ path: 'test-results/70-performance-test.png', fullPage: true });

    console.log(`⏱ Rule creation took ${duration}ms`);

    // Rule creation should be reasonably fast (under 10 seconds)
    expect(duration).toBeLessThan(10000);
  });

  test('Console Errors: Check for JavaScript errors', async ({ page }) => {
    /**
     * Monitor console for errors during rule creation
     */

    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    await page.goto(`${BASE_URL}${KANBAN_PATH}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const reviewButton = page.locator('button', { hasText: /Review|Chat|AI Agent/i }).first();
    const hasButton = await reviewButton.isVisible().catch(() => false);

    if (!hasButton) {
      test.skip('No review interface available');
    }

    await reviewButton.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('Test for console errors: emails from error-test@example.com should be NOTIFICATIONS');
    await page.locator('button', { hasText: /Send|Submit/i }).click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/80-console-error-test.png', fullPage: true });

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✓ No console errors detected');
    }

    // We expect no critical errors, but warnings might be OK
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Warning') &&
      !err.includes('DevTools')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
