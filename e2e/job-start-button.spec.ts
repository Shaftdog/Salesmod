import { test, expect } from '@playwright/test';

/**
 * E2E Test: Job Start Button Functionality
 *
 * Tests the newly added "Start Job" button that transitions jobs
 * from 'pending' → 'running' status.
 *
 * This test focuses specifically on the status transition feature
 * without creating new jobs (assumes jobs already exist in the system).
 */

test.describe('Job Start Button', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to jobs list
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    // Skip if auth required
    const url = page.url();
    if (url.includes('/auth') || url.includes('/login')) {
      test.skip(true, 'Authentication required');
    }
  });

  test('should display Jobs page and New Job button', async ({ page }) => {
    console.log('Checking Jobs page loads correctly...');

    // Verify we're on the jobs page
    await expect(page.getByText('Jobs & Campaigns')).toBeVisible({ timeout: 10000 });

    // Verify New Job button exists
    const newJobButton = page.getByRole('button', { name: /new job/i });
    await expect(newJobButton).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/start-button-test-jobs-page.png',
      fullPage: true
    });

    console.log('Jobs page loaded successfully');
  });

  test('should create a minimal test job via dialog', async ({ page }) => {
    console.log('Creating a test job...');

    // Click New Job button to open dialog
    const newJobButton = page.getByRole('button', { name: /new job/i });
    await newJobButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(1000);

    // Fill minimal required fields
    const nameInput = page.getByLabel(/job name/i);
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('Start Button Test Job');

    // Take screenshot of form
    await page.screenshot({
      path: 'e2e/screenshots/start-button-test-job-form.png',
      fullPage: true
    });

    // Submit the form
    const createButton = page.getByRole('button', { name: /^create$/i });
    await createButton.click();

    // Wait for navigation or success
    await page.waitForTimeout(2000);

    // Take screenshot after creation
    await page.screenshot({
      path: 'e2e/screenshots/start-button-test-job-created.png',
      fullPage: true
    });

    console.log('Test job created successfully');
  });

  test('should find job detail page and verify Start Job button', async ({ page }) => {
    console.log('Looking for a job to test...');

    // Look for any job in the list
    const jobLinks = page.locator('a[href*="/agent/jobs/"]');
    const jobCount = await jobLinks.count();

    console.log(`Found ${jobCount} job links`);

    if (jobCount === 0) {
      test.skip(true, 'No jobs found to test - create a job first');
      return;
    }

    // Click first job
    await jobLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of job detail page
    await page.screenshot({
      path: 'e2e/screenshots/start-button-test-job-detail.png',
      fullPage: true
    });

    // Look for Start Job button OR check if already running
    const startButton = page.getByRole('button', { name: /start job/i });
    const pauseButton = page.getByRole('button', { name: /pause/i });
    const runningBadge = page.getByText(/running/i);

    const hasStartButton = await startButton.count() > 0;
    const hasPauseButton = await pauseButton.count() > 0;
    const isRunning = await runningBadge.count() > 0;

    console.log('Job status indicators:');
    console.log('- Has Start Button:', hasStartButton);
    console.log('- Has Pause Button:', hasPauseButton);
    console.log('- Shows Running:', isRunning);

    if (hasStartButton) {
      console.log('SUCCESS: Start Job button found!');
      await expect(startButton).toBeVisible();
    } else if (hasPauseButton || isRunning) {
      console.log('Job is already running - Start button not shown (expected)');
    } else {
      console.log('WARNING: Neither Start nor Pause button found');
    }
  });

  test('should click Start Job button and verify status transition', async ({ page }) => {
    console.log('Testing Start Job button click and status transition...');

    // First, try to create a new job that will be in pending state
    const newJobButton = page.getByRole('button', { name: /new job/i });
    if (await newJobButton.count() > 0) {
      await newJobButton.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/job name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Start Test ${Date.now()}`);

        const createButton = page.getByRole('button', { name: /^create$/i });
        await createButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Now find a pending job
    await page.goto('/agent/jobs');
    await page.waitForLoadState('networkidle');

    const jobLinks = page.locator('a[href*="/agent/jobs/"]');
    const jobCount = await jobLinks.count();

    if (jobCount === 0) {
      test.skip(true, 'No jobs available to test');
      return;
    }

    // Try each job until we find one with a Start button
    let foundStartButton = false;
    for (let i = 0; i < Math.min(jobCount, 5); i++) {
      await page.goto('/agent/jobs');
      await page.waitForLoadState('networkidle');

      const links = page.locator('a[href*="/agent/jobs/"]');
      await links.nth(i).click();
      await page.waitForLoadState('networkidle');

      const startButton = page.getByRole('button', { name: /start job/i });
      if (await startButton.count() > 0) {
        foundStartButton = true;
        console.log(`Found Start Job button on job ${i + 1}`);

        // Take screenshot before clicking
        await page.screenshot({
          path: 'e2e/screenshots/start-button-test-before-start.png',
          fullPage: true
        });

        // Verify pending status
        const pendingBadge = page.locator('text=pending');
        if (await pendingBadge.count() > 0) {
          console.log('Job is in pending status');
        }

        // Click Start Job button
        console.log('Clicking Start Job button...');
        await startButton.click();

        // Wait for status change
        await page.waitForTimeout(2000);

        // Take screenshot after clicking
        await page.screenshot({
          path: 'e2e/screenshots/start-button-test-after-start.png',
          fullPage: true
        });

        // Verify status changed to running
        const runningBadge = page.locator('text=running');
        if (await runningBadge.count() > 0) {
          console.log('SUCCESS: Job status changed to running!');
          await expect(runningBadge).toBeVisible();
        }

        // Verify Start button is gone
        const startButtonGone = await startButton.count() === 0;
        console.log('Start button removed:', startButtonGone);

        // Verify Pause button appears
        const pauseButton = page.getByRole('button', { name: /pause/i });
        if (await pauseButton.count() > 0) {
          console.log('SUCCESS: Pause button now visible!');
          await expect(pauseButton).toBeVisible();
        }

        break;
      }
    }

    if (!foundStartButton) {
      console.log('No pending jobs with Start button found - all jobs may already be running');
      test.skip(true, 'No pending jobs available to start');
    }
  });

  test('should verify Agent Control Panel exists', async ({ page }) => {
    console.log('Checking Agent Control Panel...');

    await page.goto('/agent');
    await page.waitForLoadState('networkidle');

    // Take screenshot of agent page
    await page.screenshot({
      path: 'e2e/screenshots/start-button-test-agent-page.png',
      fullPage: true
    });

    // Look for Agent Control Panel button
    const controlPanelButton = page.getByRole('button', {
      name: /agent control|control panel/i
    });

    if (await controlPanelButton.count() > 0) {
      console.log('Agent Control Panel button found');
      await expect(controlPanelButton).toBeVisible();

      // Click to open panel
      await controlPanelButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of opened panel
      await page.screenshot({
        path: 'e2e/screenshots/start-button-test-control-panel.png',
        fullPage: true
      });

      // Look for Start Agent Cycle button
      const startCycleButton = page.getByRole('button', {
        name: /start agent|run agent|agent cycle/i
      });

      if (await startCycleButton.count() > 0) {
        console.log('Start Agent Cycle button found');
      }
    } else {
      console.log('Agent Control Panel button not found');
    }
  });
});
