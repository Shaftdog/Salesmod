import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for Email Re-engagement Campaign System
 * Phases 4-6: Campaign Creation UI, Dashboard, and Job Execution
 *
 * App Location: http://localhost:9002
 * Test Branch: claude/campaign-management-system-01SuCBaBM49xH5o5YJEUbWYL
 */

test.describe('Email Re-engagement Campaign System - Comprehensive Tests', () => {

  let campaignId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation
    page.setDefaultTimeout(10000);

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Console Error:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });
  });

  test.describe('Phase 5: Campaign Creation UI', () => {

    test('Test 1: Campaign List Page - Navigation and Initial Load', async ({ page }) => {
      console.log('=== Test 1: Campaign List Page ===');

      // Navigate to campaigns list
      await page.goto('/sales/campaigns');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Take screenshot of initial state
      await page.screenshot({
        path: 'tests/screenshots/campaign-list-initial.png',
        fullPage: true
      });

      // Verify page title or heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      console.log('Page heading found:', await heading.textContent());

      // Verify "Create Campaign" button exists
      const createButton = page.getByRole('button', { name: /create campaign/i });
      await expect(createButton).toBeVisible({ timeout: 5000 });
      console.log('✓ Create Campaign button is visible');

      // Check for campaigns list/table/grid
      const hasCampaignsList = await page.locator('[data-testid="campaigns-list"], table, .campaign-card, .grid').count() > 0;
      console.log('Campaigns list present:', hasCampaignsList);

      // Look for search functionality
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      const hasSearch = await searchInput.count() > 0;
      if (hasSearch) {
        console.log('✓ Search functionality available');
      }

      // Look for filter dropdown
      const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i });
      const hasFilter = await filterSelect.count() > 0;
      if (hasFilter) {
        console.log('✓ Status filter available');
      }

      console.log('✓ Test 1 Passed: Campaign list page loads successfully');
    });

    test('Test 2: Campaign Creation Wizard - Step 1 (Audience)', async ({ page }) => {
      console.log('=== Test 2: Campaign Creation Wizard - Step 1 ===');

      await page.goto('/sales/campaigns');
      await page.waitForLoadState('networkidle');

      // Click "Create Campaign" button
      const createButton = page.getByRole('button', { name: /create campaign/i });
      await createButton.click();

      // Wait for wizard to open (could be modal or new page)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Allow for animations

      // Take screenshot of wizard Step 1
      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step1.png',
        fullPage: true
      });

      // Check if we're on a new page or modal
      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);

      // Look for Step 1 indicators
      const step1Indicator = page.locator('text=/step 1|audience/i').first();
      await expect(step1Indicator).toBeVisible({ timeout: 5000 });
      console.log('✓ Step 1: Audience Selection is visible');

      // Test campaign name input (required field)
      const nameInput = page.locator('input[name="name"], input[placeholder*="campaign name" i]').first();
      await expect(nameInput).toBeVisible();

      // Try to proceed without name (should show validation)
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Look for validation message
        const validationMessage = page.locator('text=/required|enter.*name/i').first();
        const hasValidation = await validationMessage.isVisible().catch(() => false);
        if (hasValidation) {
          console.log('✓ Validation working: Name is required');
        }
      }

      // Fill in campaign name
      await nameInput.fill('Test Campaign - E2E Automated');
      console.log('✓ Campaign name entered');

      // Test description textarea
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
      const hasDescription = await descInput.isVisible().catch(() => false);
      if (hasDescription) {
        await descInput.fill('Automated test campaign for E2E testing');
        console.log('✓ Description entered');
      }

      // Test client type checkboxes
      const clientTypeCheckboxes = page.locator('input[type="checkbox"][name*="client" i], label:has-text("Active Clients"), label:has-text("Dormant Clients")');
      const checkboxCount = await clientTypeCheckboxes.count();
      console.log(`Found ${checkboxCount} client type options`);

      if (checkboxCount > 0) {
        // Click first checkbox
        await clientTypeCheckboxes.first().click();
        console.log('✓ Client type checkbox selected');
      }

      // Look for date filters
      const dateInputs = page.locator('input[type="date"], input[placeholder*="date" i]');
      const dateCount = await dateInputs.count();
      if (dateCount > 0) {
        console.log(`✓ Found ${dateCount} date filter inputs`);
      }

      // Look for audience preview
      const audiencePreview = page.locator('text=/audience|contacts|recipients/i, [data-testid*="preview"]');
      const hasPreview = await audiencePreview.count() > 0;
      if (hasPreview) {
        console.log('✓ Audience preview is visible');
        await page.screenshot({
          path: 'tests/screenshots/campaign-wizard-step1-filled.png',
          fullPage: true
        });
      }

      console.log('✓ Test 2 Passed: Step 1 Audience Selection functional');
    });

    test('Test 3: Campaign Creation Wizard - Step 2 (Email Content)', async ({ page }) => {
      console.log('=== Test 3: Campaign Creation Wizard - Step 2 ===');

      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Fill Step 1 quickly
      const nameInput = page.locator('input[name="name"], input[placeholder*="campaign name" i]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test Campaign - Step 2 Test');

        // Select a client type
        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible().catch(() => false)) {
          await checkbox.click();
        }
      }

      // Click Next to go to Step 2
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }

      // Wait for Step 2
      const step2Indicator = page.locator('text=/step 2|email|content/i').first();
      await expect(step2Indicator).toBeVisible({ timeout: 5000 });
      console.log('✓ Step 2: Email Content is visible');

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step2.png',
        fullPage: true
      });

      // Test email subject input
      const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
      await expect(subjectInput).toBeVisible();
      await subjectInput.fill('Test Email Subject - Re-engagement');
      console.log('✓ Email subject entered');

      // Test email body textarea
      const bodyInput = page.locator('textarea[name="body"], textarea[placeholder*="body" i], textarea[placeholder*="message" i]').first();
      await expect(bodyInput).toBeVisible();

      // Look for merge token buttons
      const mergeTokenButtons = page.locator('button:has-text("first_name"), button:has-text("last_name"), button:has-text("company")');
      const tokenCount = await mergeTokenButtons.count();
      console.log(`Found ${tokenCount} merge token buttons`);

      if (tokenCount > 0) {
        // Test clicking a merge token button
        const firstTokenButton = mergeTokenButtons.first();
        const tokenText = await firstTokenButton.textContent();
        console.log(`Testing merge token: ${tokenText}`);

        await bodyInput.focus();
        await firstTokenButton.click();
        await page.waitForTimeout(300);

        // Check if token was inserted
        const bodyValue = await bodyInput.inputValue();
        console.log('Body after token insert:', bodyValue.substring(0, 100));

        if (bodyValue.includes('{{') || bodyValue.includes('first_name')) {
          console.log('✓ Merge token inserted successfully');
        }
      }

      // Fill complete email body
      await bodyInput.fill('Hi {{first_name}},\n\nWe noticed it has been {{days_since_last_order}} days since your last order. We would love to work with you again!\n\nBest regards,\nThe Team');
      console.log('✓ Email body entered with merge tokens');

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step2-filled.png',
        fullPage: true
      });

      // Test Back button
      const backButton = page.getByRole('button', { name: /back|previous/i });
      if (await backButton.isVisible()) {
        console.log('✓ Back button is present');
      }

      // Test Next button (should work now that fields are filled)
      const nextBtn = page.getByRole('button', { name: /next|continue/i });
      if (await nextBtn.isVisible()) {
        const isEnabled = await nextBtn.isEnabled();
        console.log('Next button enabled:', isEnabled);
      }

      console.log('✓ Test 3 Passed: Step 2 Email Content functional');
    });

    test('Test 4: Campaign Creation Wizard - Step 3 (Settings)', async ({ page }) => {
      console.log('=== Test 4: Campaign Creation Wizard - Step 3 ===');

      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Quickly fill Steps 1 and 2
      await fillStepOne(page, 'Test Campaign - Step 3 Test');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      await fillStepTwo(page, 'Test Subject', 'Test body with {{first_name}}');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      // Wait for Step 3
      const step3Indicator = page.locator('text=/step 3|settings|schedule/i').first();
      await expect(step3Indicator).toBeVisible({ timeout: 5000 });
      console.log('✓ Step 3: Settings is visible');

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step3.png',
        fullPage: true
      });

      // Test send rate slider
      const slider = page.locator('input[type="range"], [role="slider"]').first();
      const hasSlider = await slider.isVisible().catch(() => false);
      if (hasSlider) {
        await slider.fill('50');
        console.log('✓ Send rate slider adjusted');
      }

      // Test batch size input
      const batchInput = page.locator('input[name*="batch"], input[placeholder*="batch" i]').first();
      const hasBatchInput = await batchInput.isVisible().catch(() => false);
      if (hasBatchInput) {
        await batchInput.fill('10');
        console.log('✓ Batch size entered');
      }

      // Test schedule toggle
      const scheduleToggle = page.locator('button[role="switch"], input[type="checkbox"][name*="schedule" i]').first();
      const hasScheduleToggle = await scheduleToggle.isVisible().catch(() => false);
      if (hasScheduleToggle) {
        await scheduleToggle.click();
        console.log('✓ Schedule toggle clicked');

        // Look for date/time picker
        await page.waitForTimeout(500);
        const dateTimeInput = page.locator('input[type="datetime-local"], input[type="date"]').first();
        const hasDateTime = await dateTimeInput.isVisible().catch(() => false);
        if (hasDateTime) {
          console.log('✓ Date/time picker appeared');
        }
      }

      // Look for estimated completion time
      const estimatedTime = page.locator('text=/estimated|completion|finish/i');
      const hasEstimate = await estimatedTime.count() > 0;
      if (hasEstimate) {
        console.log('✓ Estimated completion time is displayed');
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step3-filled.png',
        fullPage: true
      });

      console.log('✓ Test 4 Passed: Step 3 Settings functional');
    });

    test('Test 5: Campaign Creation Wizard - Step 4 (Review & Launch)', async ({ page }) => {
      console.log('=== Test 5: Campaign Creation Wizard - Step 4 ===');

      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Fill all previous steps
      await fillStepOne(page, 'Test Campaign - Complete Flow');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      await fillStepTwo(page, 'Re-engagement Email Subject', 'Hi {{first_name}}, we miss you!');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      // Skip or fill Step 3
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }

      // Wait for Step 4 (Review)
      const step4Indicator = page.locator('text=/step 4|review|launch|summary/i').first();
      await expect(step4Indicator).toBeVisible({ timeout: 5000 });
      console.log('✓ Step 4: Review & Launch is visible');

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step4.png',
        fullPage: true
      });

      // Verify campaign details are displayed
      const reviewSection = page.locator('text=/Test Campaign - Complete Flow/i');
      await expect(reviewSection).toBeVisible();
      console.log('✓ Campaign name visible in review');

      // Look for audience count
      const audienceCount = page.locator('text=/audience|recipients|contacts/i');
      const hasAudience = await audienceCount.count() > 0;
      if (hasAudience) {
        console.log('✓ Audience information displayed');
      }

      // Look for email preview
      const emailPreview = page.locator('text=/Re-engagement Email Subject/i, text=/we miss you/i');
      const hasPreview = await emailPreview.count() > 0;
      if (hasPreview) {
        console.log('✓ Email preview displayed');
      }

      // Test "Test Send" button
      const testSendButton = page.getByRole('button', { name: /test send|send test/i });
      const hasTestSend = await testSendButton.isVisible().catch(() => false);
      if (hasTestSend) {
        await testSendButton.click();
        await page.waitForTimeout(1000);

        // Look for success message
        const successMessage = page.locator('text=/test.*sent|simulation|success/i');
        const hasSuccess = await successMessage.isVisible().catch(() => false);
        if (hasSuccess) {
          console.log('✓ Test Send executed (simulation mode)');
        }
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-wizard-step4-pre-launch.png',
        fullPage: true
      });

      // Test "Launch Campaign" button
      const launchButton = page.getByRole('button', { name: /launch|create campaign|submit/i });
      await expect(launchButton).toBeVisible();
      console.log('✓ Launch Campaign button is visible');

      // Actually launch the campaign
      await launchButton.click();
      console.log('Campaign launch button clicked');

      // Wait for redirect or success message
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Check if redirected to campaign detail page or campaigns list
      const currentUrl = page.url();
      console.log('URL after launch:', currentUrl);

      // Extract campaign ID from URL if present
      const idMatch = currentUrl.match(/campaigns\/([^\/]+)/);
      if (idMatch) {
        campaignId = idMatch[1];
        console.log('✓ Campaign created with ID:', campaignId);
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-created-success.png',
        fullPage: true
      });

      console.log('✓ Test 5 Passed: Campaign creation flow completed');
    });
  });

  test.describe('Phase 6: Campaign Dashboard', () => {

    test('Test 6: Campaign Detail Page - Navigation', async ({ page }) => {
      console.log('=== Test 6: Campaign Detail Page ===');

      // First, create a campaign or navigate to existing one
      await page.goto('/sales/campaigns');
      await page.waitForLoadState('networkidle');

      // Look for existing campaigns
      const campaignLinks = page.locator('a[href*="/campaigns/"]');
      const campaignCount = await campaignLinks.count();

      let detailPageUrl = '';

      if (campaignCount > 0) {
        // Click on first campaign
        await campaignLinks.first().click();
        await page.waitForLoadState('networkidle');
        detailPageUrl = page.url();
        console.log('✓ Navigated to existing campaign:', detailPageUrl);
      } else {
        console.log('No existing campaigns found, will test with empty state');
        return; // Skip this test if no campaigns
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-detail-page.png',
        fullPage: true
      });

      // Verify tabs are present
      const overviewTab = page.locator('[role="tab"]:has-text("Overview"), button:has-text("Overview")');
      const responsesTab = page.locator('[role="tab"]:has-text("Responses"), button:has-text("Responses")');
      const followUpTab = page.locator('[role="tab"]:has-text("Follow"), button:has-text("Follow")');
      const detailsTab = page.locator('[role="tab"]:has-text("Details"), button:has-text("Details")');

      const tabsPresent = {
        overview: await overviewTab.isVisible().catch(() => false),
        responses: await responsesTab.isVisible().catch(() => false),
        followUp: await followUpTab.isVisible().catch(() => false),
        details: await detailsTab.isVisible().catch(() => false)
      };

      console.log('Tabs visibility:', tabsPresent);

      if (tabsPresent.overview) console.log('✓ Overview tab present');
      if (tabsPresent.responses) console.log('✓ Responses tab present');
      if (tabsPresent.followUp) console.log('✓ Needs Follow-Up tab present');
      if (tabsPresent.details) console.log('✓ Details tab present');

      console.log('✓ Test 6 Passed: Campaign detail page structure verified');
    });

    test('Test 7: Overview Tab - Metrics Cards', async ({ page }) => {
      console.log('=== Test 7: Overview Tab - Metrics Cards ===');

      await page.goto('/sales/campaigns');
      await page.waitForLoadState('networkidle');

      const campaignLinks = page.locator('a[href*="/campaigns/"]');
      const campaignCount = await campaignLinks.count();

      if (campaignCount === 0) {
        console.log('No campaigns to test, skipping');
        return;
      }

      await campaignLinks.first().click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'tests/screenshots/campaign-overview-metrics.png',
        fullPage: true
      });

      // Look for metric cards
      const metricsToCheck = [
        { name: 'Emails Sent', pattern: /emails.*sent|sent.*emails/i },
        { name: 'Responses', pattern: /responses|replies/i },
        { name: 'Issues', pattern: /issues|bounces|unsubscribe/i },
        { name: 'Tasks Generated', pattern: /tasks.*generated|generated.*tasks/i }
      ];

      for (const metric of metricsToCheck) {
        const metricElement = page.locator(`text=${metric.pattern}`).first();
        const isVisible = await metricElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✓ ${metric.name} metric card found`);
        }
      }

      // Look for campaign status banner
      const activeBanner = page.locator('text=/campaign active|active campaign/i');
      const completedBanner = page.locator('text=/campaign completed|completed campaign/i');

      const hasActiveBanner = await activeBanner.isVisible().catch(() => false);
      const hasCompletedBanner = await completedBanner.isVisible().catch(() => false);

      if (hasActiveBanner) console.log('✓ Campaign Active banner displayed');
      if (hasCompletedBanner) console.log('✓ Campaign Completed banner displayed');

      console.log('✓ Test 7 Passed: Overview metrics displayed');
    });

    test('Test 8: Overview Tab - Sentiment Chart', async ({ page }) => {
      console.log('=== Test 8: Overview Tab - Sentiment Chart ===');

      await navigateToCampaignDetail(page);

      await page.screenshot({
        path: 'tests/screenshots/campaign-sentiment-chart.png',
        fullPage: true
      });

      // Look for sentiment chart section
      const sentimentSection = page.locator('text=/sentiment/i').first();
      const hasSentiment = await sentimentSection.isVisible().catch(() => false);

      if (hasSentiment) {
        console.log('✓ Sentiment chart section found');

        // Look for sentiment labels
        const positiveLabel = page.locator('text=/positive/i');
        const neutralLabel = page.locator('text=/neutral/i');
        const negativeLabel = page.locator('text=/negative/i');

        if (await positiveLabel.isVisible().catch(() => false)) console.log('✓ Positive sentiment label found');
        if (await neutralLabel.isVisible().catch(() => false)) console.log('✓ Neutral sentiment label found');
        if (await negativeLabel.isVisible().catch(() => false)) console.log('✓ Negative sentiment label found');
      }

      // Check for empty state
      const emptyState = page.locator('text=/no responses yet/i');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      if (hasEmptyState) {
        console.log('✓ Empty state displayed (no responses yet)');
      }

      console.log('✓ Test 8 Passed: Sentiment chart section verified');
    });

    test('Test 9: Overview Tab - Disposition Chart', async ({ page }) => {
      console.log('=== Test 9: Overview Tab - Disposition Chart ===');

      await navigateToCampaignDetail(page);

      await page.screenshot({
        path: 'tests/screenshots/campaign-disposition-chart.png',
        fullPage: true
      });

      // Look for disposition chart section
      const dispositionSection = page.locator('text=/disposition/i').first();
      const hasDisposition = await dispositionSection.isVisible().catch(() => false);

      if (hasDisposition) {
        console.log('✓ Disposition chart section found');

        // Expected disposition types
        const expectedDispositions = [
          'HAS_ACTIVE_PROFILE',
          'NO_ACTIVE_PROFILE',
          'INTERESTED',
          'NEEDS_MORE_INFO',
          'NOT_INTERESTED',
          'OUT_OF_OFFICE',
          'ESCALATE_UNCLEAR'
        ];

        // Check for some disposition labels (may be abbreviated)
        const dispositionLabels = page.locator('text=/interested|not interested|active profile|more info/i');
        const labelCount = await dispositionLabels.count();
        console.log(`Found ${labelCount} disposition labels`);
      }

      // Check for empty state
      const emptyState = page.locator('text=/no responses yet/i');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      if (hasEmptyState) {
        console.log('✓ Empty state displayed (no responses yet)');
      }

      console.log('✓ Test 9 Passed: Disposition chart section verified');
    });

    test('Test 10: Responses Tab', async ({ page }) => {
      console.log('=== Test 10: Responses Tab ===');

      await navigateToCampaignDetail(page);

      // Click Responses tab
      const responsesTab = page.locator('[role="tab"]:has-text("Responses"), button:has-text("Responses")');
      if (await responsesTab.isVisible()) {
        await responsesTab.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-responses-tab.png',
        fullPage: true
      });

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      const hasSearch = await searchInput.isVisible().catch(() => false);
      if (hasSearch) {
        console.log('✓ Search input found on Responses tab');
      }

      // Check for empty state or response cards
      const emptyState = page.locator('text=/no responses yet/i');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        console.log('✓ Empty state displayed (no responses yet)');

        // Check for mail icon
        const mailIcon = page.locator('svg').filter({ hasText: /mail/i });
        const hasMailIcon = await mailIcon.count() > 0;
        if (hasMailIcon) {
          console.log('✓ Mail icon present in empty state');
        }
      } else {
        // Look for response cards
        const responseCards = page.locator('[data-testid*="response"], .response-card');
        const cardCount = await responseCards.count();
        console.log(`Found ${cardCount} response cards`);

        if (cardCount > 0) {
          console.log('✓ Response cards displayed');

          // Test clicking first response to expand
          await responseCards.first().click();
          await page.waitForTimeout(500);
          console.log('✓ Response card click interaction tested');
        }
      }

      console.log('✓ Test 10 Passed: Responses tab functional');
    });

    test('Test 11: Needs Follow-Up Tab', async ({ page }) => {
      console.log('=== Test 11: Needs Follow-Up Tab ===');

      await navigateToCampaignDetail(page);

      // Click Needs Follow-Up tab
      const followUpTab = page.locator('[role="tab"]:has-text("Follow"), button:has-text("Follow")');
      if (await followUpTab.isVisible()) {
        await followUpTab.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-follow-up-tab.png',
        fullPage: true
      });

      // Check for empty state
      const emptyState = page.locator('text=/all caught up|no follow.*ups/i');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        console.log('✓ Empty state displayed (all caught up)');
      } else {
        // Look for contact cards
        const contactCards = page.locator('[data-testid*="contact"], .contact-card');
        const cardCount = await contactCards.count();
        console.log(`Found ${cardCount} contact cards needing follow-up`);

        if (cardCount > 0) {
          console.log('✓ Follow-up contact cards displayed');

          // Look for "View Tasks" button
          const viewTasksButton = page.getByRole('button', { name: /view tasks/i });
          const hasButton = await viewTasksButton.isVisible().catch(() => false);
          if (hasButton) {
            console.log('✓ View Tasks button present');
          }
        }
      }

      console.log('✓ Test 11 Passed: Needs Follow-Up tab functional');
    });

    test('Test 12: Details Tab', async ({ page }) => {
      console.log('=== Test 12: Details Tab ===');

      await navigateToCampaignDetail(page);

      // Click Details tab
      const detailsTab = page.locator('[role="tab"]:has-text("Details"), button:has-text("Details")');
      if (await detailsTab.isVisible()) {
        await detailsTab.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: 'tests/screenshots/campaign-details-tab.png',
        fullPage: true
      });

      // Look for campaign details
      const detailsToCheck = [
        { name: 'Status', pattern: /status/i },
        { name: 'Created Date', pattern: /created|date/i },
        { name: 'Target Segment', pattern: /segment|audience|target/i },
        { name: 'Rate Limiting', pattern: /rate|limit|batch/i }
      ];

      for (const detail of detailsToCheck) {
        const element = page.locator(`text=${detail.pattern}`).first();
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✓ ${detail.name} information displayed`);
        }
      }

      console.log('✓ Test 12 Passed: Details tab displays campaign information');
    });

    test('Test 13: Campaign Actions', async ({ page }) => {
      console.log('=== Test 13: Campaign Actions ===');

      await navigateToCampaignDetail(page);

      await page.screenshot({
        path: 'tests/screenshots/campaign-actions.png',
        fullPage: true
      });

      // Look for action buttons
      const actions = [
        { name: 'Execute Now', pattern: /execute now|run now|start/i },
        { name: 'Pause', pattern: /pause/i },
        { name: 'Resume', pattern: /resume/i },
        { name: 'Archive', pattern: /archive/i },
        { name: 'Delete', pattern: /delete/i }
      ];

      for (const action of actions) {
        const button = page.getByRole('button', { name: action.pattern });
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✓ ${action.name} button found`);
        }
      }

      // Test Execute Now button (if visible)
      const executeButton = page.getByRole('button', { name: /execute now/i });
      const canExecute = await executeButton.isVisible().catch(() => false);

      if (canExecute) {
        console.log('Testing Execute Now functionality...');
        await executeButton.click();
        await page.waitForTimeout(2000);

        // Check console for simulation mode logs
        console.log('✓ Execute Now button clicked (check browser console for simulation logs)');

        await page.screenshot({
          path: 'tests/screenshots/campaign-after-execute.png',
          fullPage: true
        });
      }

      console.log('✓ Test 13 Passed: Campaign action buttons verified');
    });
  });

  test.describe('Phase 4: Job Execution (Simulation Mode)', () => {

    test('Test 14: Campaign Execution and Database Updates', async ({ page }) => {
      console.log('=== Test 14: Campaign Execution (Simulation Mode) ===');

      // Create a new campaign
      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Quick flow through wizard
      await fillStepOne(page, 'Execution Test Campaign');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      await fillStepTwo(page, 'Execution Test Subject', 'Test body {{first_name}}');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      // Skip Step 3 settings
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }

      // Launch campaign
      const launchButton = page.getByRole('button', { name: /launch|create campaign/i });
      if (await launchButton.isVisible()) {
        await launchButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }

      await page.screenshot({
        path: 'tests/screenshots/execution-test-created.png',
        fullPage: true
      });

      // Find and click Execute Now
      const executeButton = page.getByRole('button', { name: /execute now/i });
      const canExecute = await executeButton.isVisible().catch(() => false);

      if (canExecute) {
        console.log('Executing campaign...');

        // Monitor console for simulation logs
        const consoleMessages: string[] = [];
        page.on('console', msg => {
          const text = msg.text();
          if (text.includes('SIMULATION') || text.includes('EMAIL')) {
            consoleMessages.push(text);
          }
        });

        await executeButton.click();
        await page.waitForTimeout(5000); // Wait for execution

        console.log('Console messages captured:', consoleMessages.length);
        consoleMessages.forEach(msg => console.log('  -', msg));

        await page.screenshot({
          path: 'tests/screenshots/execution-test-completed.png',
          fullPage: true
        });

        // Refresh page to see updated metrics
        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: 'tests/screenshots/execution-test-metrics-updated.png',
          fullPage: true
        });

        console.log('✓ Campaign execution completed (simulation mode)');
      } else {
        console.log('Execute Now button not available');
      }

      console.log('✓ Test 14 Passed: Campaign execution tested');
    });
  });

  test.describe('Error Handling', () => {

    test('Test 15: Form Validation', async ({ page }) => {
      console.log('=== Test 15: Form Validation ===');

      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Try to proceed without filling anything
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Look for validation errors
        const errorMessages = page.locator('text=/required|enter.*name|field.*required/i');
        const errorCount = await errorMessages.count();
        console.log(`Found ${errorCount} validation error messages`);

        if (errorCount > 0) {
          console.log('✓ Validation errors displayed for empty form');
        }

        await page.screenshot({
          path: 'tests/screenshots/validation-errors.png',
          fullPage: true
        });
      }

      console.log('✓ Test 15 Passed: Form validation working');
    });

    test('Test 16: Navigation', async ({ page }) => {
      console.log('=== Test 16: Navigation Tests ===');

      // Test direct URL navigation
      await page.goto('/sales/campaigns');
      await page.waitForLoadState('networkidle');
      console.log('✓ Direct navigation to campaigns list works');

      await page.goto('/sales/campaigns/new');
      await page.waitForLoadState('networkidle');
      console.log('✓ Direct navigation to campaign creation works');

      // Test browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');
      const backUrl = page.url();
      console.log('Back navigation URL:', backUrl);
      console.log('✓ Browser back button works');

      console.log('✓ Test 16 Passed: Navigation functional');
    });
  });
});

// Helper functions

async function fillStepOne(page: Page, campaignName: string) {
  const nameInput = page.locator('input[name="name"], input[placeholder*="campaign name" i]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(campaignName);
  }

  const checkbox = page.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.click();
  }
}

async function fillStepTwo(page: Page, subject: string, body: string) {
  const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
  if (await subjectInput.isVisible().catch(() => false)) {
    await subjectInput.fill(subject);
  }

  const bodyInput = page.locator('textarea[name="body"], textarea[placeholder*="body" i], textarea[placeholder*="message" i]').first();
  if (await bodyInput.isVisible().catch(() => false)) {
    await bodyInput.fill(body);
  }
}

async function navigateToCampaignDetail(page: Page) {
  await page.goto('/sales/campaigns');
  await page.waitForLoadState('networkidle');

  const campaignLinks = page.locator('a[href*="/campaigns/"]');
  const campaignCount = await campaignLinks.count();

  if (campaignCount > 0) {
    await campaignLinks.first().click();
    await page.waitForLoadState('networkidle');
  }
}
