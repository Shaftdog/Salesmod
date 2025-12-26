import { test, expect } from '@playwright/test';

/**
 * FINAL TEST: AI Task Generation for Revisions
 *
 * This test verifies the complete flow of creating a revision request
 * with AI-generated tasks from the Cases page.
 *
 * Test Scenario:
 * 1. Login to the application
 * 2. Navigate to Cases page
 * 3. Find a case with a linked order
 * 4. Click "Create Revision" button
 * 5. Enter revision description
 * 6. Click "Generate Tasks with AI" button
 * 7. Verify AI generates multiple tasks
 * 8. Submit revision with selected tasks
 * 9. Verify submission succeeds without errors
 * 10. Navigate to Production Board
 * 11. Verify tasks appear on the REVISION card
 */

test('Complete revision flow with AI task generation', async ({ page }) => {
  const BASE_URL = 'http://localhost:9002';

    // ============================================================
    // STEP 1: Login
    // ============================================================
    console.log('\n=== STEP 1: Login ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({
      path: '/tmp/revision-test-01-login-page.png',
      fullPage: true
    });

    // Fill in credentials
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');

    // Click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(dashboard|cases|orders|production)/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log('✓ Login successful');
    await page.screenshot({
      path: '/tmp/revision-test-02-logged-in.png',
      fullPage: true
    });

    // ============================================================
    // STEP 2: Navigate to Cases page
    // ============================================================
    console.log('\n=== STEP 2: Navigate to Cases ===');
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow data to load

    await page.screenshot({
      path: '/tmp/revision-test-03-cases-page.png',
      fullPage: true
    });

    console.log('✓ Cases page loaded');

    // ============================================================
    // STEP 3: Find a case with a linked order
    // ============================================================
    console.log('\n=== STEP 3: Find case with linked order ===');

    // Look for case cards that show an order number
    const caseCards = page.locator('[class*="Card"], .card, [data-testid="case-card"]');
    const caseCount = await caseCards.count();
    console.log(`Found ${caseCount} case cards`);

    let targetCaseCard = null;
    let targetCaseData = {
      subject: '',
      caseNumber: '',
      orderNumber: ''
    };

    // Find first case with order link
    for (let i = 0; i < caseCount; i++) {
      const card = caseCards.nth(i);
      const cardText = await card.textContent() || '';

      // Check if this card has an order reference
      if (cardText.includes('Order #') || cardText.includes('Order:')) {
        targetCaseCard = card;

        // Extract case details
        const subjectElem = card.locator('h1, h2, h3, [class*="CardTitle"]').first();
        targetCaseData.subject = await subjectElem.textContent() || '';

        // Find order number
        const orderMatch = cardText.match(/Order #?(\w+-?\d+)/);
        if (orderMatch) {
          targetCaseData.orderNumber = orderMatch[1];
        }

        console.log('✓ Found case with order:', targetCaseData);
        break;
      }
    }

    if (!targetCaseCard) {
      throw new Error('No cases with linked orders found. Cannot proceed with test.');
    }

    // Highlight the target case
    await targetCaseCard.screenshot({
      path: '/tmp/revision-test-04-target-case.png'
    });

    // ============================================================
    // STEP 4: Click "Create Revision" button
    // ============================================================
    console.log('\n=== STEP 4: Open Create Revision modal ===');

    // Look for "Create Revision" button within the card
    const revisionButton = targetCaseCard.locator('button:has-text("Create Revision")').first();

    // Scroll button into view and click
    await revisionButton.scrollIntoViewIfNeeded();
    await revisionButton.click();

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"], .modal, [class*="Dialog"]', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log('✓ Revision modal opened');
    await page.screenshot({
      path: '/tmp/revision-test-05-modal-opened.png',
      fullPage: true
    });

    // ============================================================
    // STEP 5: Enter revision description
    // ============================================================
    console.log('\n=== STEP 5: Enter revision description ===');

    const revisionDescription = `Need to verify the square footage on comparable 1. The adjustment for condition needs review. Market conditions section needs updating.`;

    // Find the description textarea
    const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="describe"], textarea[placeholder*="revision"]').first();
    await descriptionField.fill(revisionDescription);

    console.log('✓ Description entered:', revisionDescription);
    await page.screenshot({
      path: '/tmp/revision-test-06-description-entered.png',
      fullPage: true
    });

    // ============================================================
    // STEP 6: Click "Generate Tasks with AI" button
    // ============================================================
    console.log('\n=== STEP 6: Generate tasks with AI ===');

    const aiButton = page.locator('button:has-text("Generate Tasks with AI")').first();
    await aiButton.click();

    // Wait for AI processing
    await page.waitForSelector('button:has-text("Analyzing")', { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Wait for tasks to appear (look for task list or checkboxes)
    await page.waitForSelector('[type="checkbox"], .task-item, [data-testid="task-item"]', { timeout: 10000 });
    await page.waitForTimeout(1500);

    console.log('✓ AI task generation triggered');
    await page.screenshot({
      path: '/tmp/revision-test-07-ai-processing.png',
      fullPage: true
    });

    // ============================================================
    // STEP 7: Verify AI generated multiple tasks
    // ============================================================
    console.log('\n=== STEP 7: Verify AI-generated tasks ===');

    // Count checkboxes (each task has a checkbox)
    const taskCheckboxes = page.locator('[type="checkbox"]');
    const taskCount = await taskCheckboxes.count();

    console.log(`✓ AI generated ${taskCount} tasks`);

    // Verify at least 2 tasks were created (should be ~3 for the given description)
    expect(taskCount).toBeGreaterThanOrEqual(2);
    expect(taskCount).toBeLessThanOrEqual(5);

    // Get task details
    const taskItems = page.locator('[class*="task"], .task-item, [data-testid="task-item"]');
    const taskItemCount = await taskItems.count();

    console.log('\nGenerated Tasks:');
    for (let i = 0; i < Math.min(taskItemCount, 5); i++) {
      const taskText = await taskItems.nth(i).textContent();
      console.log(`  ${i + 1}. ${taskText?.trim().slice(0, 100)}`);
    }

    await page.screenshot({
      path: '/tmp/revision-test-08-tasks-generated.png',
      fullPage: true
    });

    // ============================================================
    // STEP 8: Verify all tasks are selected by default
    // ============================================================
    console.log('\n=== STEP 8: Verify task selection ===');

    // Check that tasks are selected
    const checkedBoxes = page.locator('[type="checkbox"]:checked');
    const checkedCount = await checkedBoxes.count();

    console.log(`✓ ${checkedCount} tasks selected (out of ${taskCount})`);

    // All tasks should be selected by default
    expect(checkedCount).toBe(taskCount);

    // ============================================================
    // STEP 9: Submit the revision
    // ============================================================
    console.log('\n=== STEP 9: Submit revision ===');

    // Find the submit button (should say "Create Revision" with task count badge)
    const submitButton = page.locator('button[type="submit"]:has-text("Create Revision")').first();

    // Take screenshot before submission
    await page.screenshot({
      path: '/tmp/revision-test-09-before-submit.png',
      fullPage: true
    });

    // Click submit
    await submitButton.click();

    // Wait for modal to close (indicates success)
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✓ Revision submitted successfully');

    // Check for success toast/notification
    const toast = page.locator('[class*="toast"], [role="status"], [class*="notification"]');
    const toastVisible = await toast.count() > 0;

    if (toastVisible) {
      const toastText = await toast.first().textContent();
      console.log('✓ Success notification:', toastText);
    }

    await page.screenshot({
      path: '/tmp/revision-test-10-submitted.png',
      fullPage: true
    });

    // ============================================================
    // STEP 10: Verify NO errors appeared
    // ============================================================
    console.log('\n=== STEP 10: Verify no errors ===');

    // Check for error messages
    const errorElements = page.locator('[class*="error"], [role="alert"][class*="destructive"], .error-message');
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      console.error('ERROR DETECTED:', errorText);
      await page.screenshot({
        path: '/tmp/revision-test-ERROR.png',
        fullPage: true
      });
      throw new Error(`Submission failed with error: ${errorText}`);
    }

    console.log('✓ No errors detected - submission successful');

    // ============================================================
    // STEP 11: Navigate to Production Board
    // ============================================================
    console.log('\n=== STEP 11: Navigate to Production Board ===');

    await page.goto(`${BASE_URL}/production/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow board to load

    await page.screenshot({
      path: '/tmp/revision-test-11-production-board.png',
      fullPage: true
    });

    console.log('✓ Production board loaded');

    // ============================================================
    // STEP 12: Find the REVISION column
    // ============================================================
    console.log('\n=== STEP 12: Locate REVISION column ===');

    // Look for REVISION column
    const revisionColumn = page.locator('[data-stage="REVISION"], [class*="column"]:has-text("REVISION"), .kanban-column:has-text("REVISION")').first();

    // Highlight the revision column
    await revisionColumn.screenshot({
      path: '/tmp/revision-test-12-revision-column.png'
    });

    // ============================================================
    // STEP 13: Find the card in REVISION column
    // ============================================================
    console.log('\n=== STEP 13: Find revision card ===');

    // Look for cards in the REVISION column
    const revisionCards = revisionColumn.locator('[class*="card"], .production-card, [data-testid="production-card"]');
    const revisionCardCount = await revisionCards.count();

    console.log(`Found ${revisionCardCount} cards in REVISION column`);

    // Get the first/most recent card (should be our newly created revision)
    const targetCard = revisionCards.first();

    if (revisionCardCount === 0) {
      throw new Error('No cards found in REVISION column');
    }

    await targetCard.screenshot({
      path: '/tmp/revision-test-13-revision-card.png'
    });

    // ============================================================
    // STEP 14: Verify tasks appear on the card
    // ============================================================
    console.log('\n=== STEP 14: Verify tasks on production card ===');

    // Get card text to verify tasks
    const cardText = await targetCard.textContent() || '';

    // Look for task indicators (checkboxes, task items, etc.)
    const cardTasks = targetCard.locator('[type="checkbox"], .task-item, [class*="task"]');
    const cardTaskCount = await cardTasks.count();

    console.log(`✓ Found ${cardTaskCount} tasks on the production card`);

    // Verify at least some tasks are present
    expect(cardTaskCount).toBeGreaterThan(0);

    // Check for "REVISION" label in tasks
    const revisionTasksExist = cardText.includes('REVISION') || cardText.includes('verify') || cardText.includes('review');
    expect(revisionTasksExist).toBe(true);

    console.log('\nTasks visible on production card:');
    for (let i = 0; i < Math.min(cardTaskCount, 5); i++) {
      const taskText = await cardTasks.nth(i).textContent();
      console.log(`  • ${taskText?.trim().slice(0, 100)}`);
    }

    // Final screenshot showing tasks on card
    await page.screenshot({
      path: '/tmp/revision-test-14-final-success.png',
      fullPage: true
    });

    // ============================================================
    // TEST COMPLETE
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✓✓✓ ALL TESTS PASSED ✓✓✓');
    console.log('='.repeat(60));
    console.log('\nTest Summary:');
    console.log(`  • Login: SUCCESS`);
    console.log(`  • Found case with order: SUCCESS`);
    console.log(`  • Opened revision modal: SUCCESS`);
    console.log(`  • AI generated ${taskCount} tasks: SUCCESS`);
    console.log(`  • Submitted without errors: SUCCESS`);
    console.log(`  • Found card in REVISION column: SUCCESS`);
    console.log(`  • Verified ${cardTaskCount} tasks on card: SUCCESS`);
    console.log('\nScreenshots saved to /tmp/revision-test-*.png');
    console.log('='.repeat(60) + '\n');
});
