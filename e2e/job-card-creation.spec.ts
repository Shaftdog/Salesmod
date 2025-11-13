import { test, expect } from '@playwright/test';

test.describe('Job Card Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to agent page
    await page.goto('/agent');
    await page.waitForLoadState('networkidle');
  });

  test('should create cards when agent runs with active job', async ({ page }) => {
    console.log('Starting job card creation test...');

    // Check if there are any active jobs
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    console.log('On jobs page, checking for running jobs...');

    // Look for running jobs
    const runningJobBadge = page.locator('text=running').first();
    const hasRunningJob = await runningJobBadge.isVisible().catch(() => false);

    if (!hasRunningJob) {
      console.log('No running jobs found, test will skip agent run');
      test.skip();
      return;
    }

    console.log('Found running job!');

    // Get the current card count
    await page.goto('/agent');
    await page.waitForLoadState('networkidle');

    // Wait a moment for any data to load
    await page.waitForTimeout(2000);

    // Get initial card count by looking at kanban columns
    const getCardCount = async () => {
      const cardElements = await page.locator('[role="article"], .kanban-card, [data-card-id]').count();
      console.log(`Current card count: ${cardElements}`);
      return cardElements;
    };

    const initialCardCount = await getCardCount();
    console.log(`Initial card count: ${initialCardCount}`);

    // Trigger agent run
    console.log('Looking for "Run Agent" button...');

    const runButton = page.locator('button:has-text("Run Agent"), button:has-text("Start Agent")').first();
    const isRunButtonVisible = await runButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isRunButtonVisible) {
      console.log('Run Agent button not found or not visible');
      // Take screenshot for debugging
      await page.screenshot({ path: 'e2e/screenshots/no-run-button.png', fullPage: true });
      throw new Error('Run Agent button not found');
    }

    console.log('Clicking Run Agent button...');
    await runButton.click();

    // Wait for the agent to process (give it up to 3 minutes)
    console.log('Waiting for agent to process jobs...');

    // Poll for card creation
    let newCardsCreated = false;
    let attempts = 0;
    const maxAttempts = 36; // 36 * 5 seconds = 3 minutes

    while (!newCardsCreated && attempts < maxAttempts) {
      await page.waitForTimeout(5000); // Wait 5 seconds between checks

      // Refresh the page to see new cards
      await page.reload();
      await page.waitForLoadState('networkidle');

      const currentCardCount = await getCardCount();
      console.log(`Attempt ${attempts + 1}/${maxAttempts}: Card count = ${currentCardCount}`);

      if (currentCardCount > initialCardCount) {
        newCardsCreated = true;
        console.log(`✓ New cards created! Initial: ${initialCardCount}, Current: ${currentCardCount}`);
      }

      attempts++;
    }

    // Take a screenshot of final state
    await page.screenshot({ path: 'e2e/screenshots/job-card-creation-final.png', fullPage: true });

    // Assert that cards were created
    expect(newCardsCreated).toBe(true);

    // Get final count for reporting
    const finalCardCount = await getCardCount();
    console.log(`Test completed. Cards created: ${finalCardCount - initialCardCount}`);
  });

  test('should show job details and card creation logs', async ({ page }) => {
    console.log('Checking job details...');

    // Navigate to jobs page
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    // Find the first job (should be the Rod AMC Profile Check job)
    const firstJobLink = page.locator('a[href*="/agent/jobs/"]').first();
    const hasJob = await firstJobLink.isVisible().catch(() => false);

    if (!hasJob) {
      console.log('No jobs found');
      test.skip();
      return;
    }

    // Click on the job to see details
    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of job details
    await page.screenshot({ path: 'e2e/screenshots/job-details.png', fullPage: true });

    // Check for job status and metrics
    const jobStatus = await page.locator('text=/status|running|succeeded|failed/i').first().textContent();
    console.log(`Job status: ${jobStatus}`);

    // Check for cards count
    const cardsText = await page.locator('text=/cards/i').first().textContent().catch(() => '0');
    console.log(`Cards information: ${cardsText}`);
  });
});
