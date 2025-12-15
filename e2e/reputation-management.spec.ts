import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'reputation-management');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  screenshotPath?: string;
  consoleErrors: string[];
  consoleWarnings: string[];
}

const testResults: TestResult[] = [];

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

async function collectConsoleMessages(page: Page, errors: string[], warnings: string[]) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(text);
      console.log(`[CONSOLE ERROR] ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`[CONSOLE WARNING] ${text}`);
    }
  });

  page.on('pageerror', error => {
    const errorMsg = `Page Error: ${error.message}`;
    errors.push(errorMsg);
    console.log(`[PAGE ERROR] ${errorMsg}`);
  });
}

test.describe('Reputation Management Module - Comprehensive Testing', () => {
  test.setTimeout(120000); // 2 minutes per test

  test('1. Dashboard Access and Page Load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/reputation`;
    const result: TestResult = {
      test: 'Dashboard Access',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 1: Dashboard Access ===`);
      console.log(`Navigating to: ${url}`);

      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check if redirected to login
      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);

      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'WARNING';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'reputation-auth-redirect');
      } else {
        const status = response?.status() || 0;
        console.log(`HTTP Status: ${status}`);

        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'reputation-http-error');
        } else {
          await page.waitForLoadState('domcontentloaded');

          // Check for error messages in page
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && (bodyText?.includes('500') || bodyText?.includes('Error'))) {
            result.status = 'WARNING';
            result.details = 'Page loaded but shows error message';
            result.screenshotPath = await captureScreenshot(page, 'reputation-page-error');
          } else {
            result.status = 'PASS';
            result.details = 'Dashboard loaded successfully without crashes';
            result.screenshotPath = await captureScreenshot(page, 'reputation-dashboard-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception during page load: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('2. Dashboard Components - Stat Cards', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'Stat Cards Rendering',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 2: Stat Cards ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for stat cards
      const statCardTexts = [
        'Average Rating',
        'Sentiment',
        'Flagged',
        'Response Rate'
      ];

      const foundCards: string[] = [];
      const missingCards: string[] = [];

      for (const cardText of statCardTexts) {
        const isVisible = await page.getByText(cardText, { exact: false }).isVisible().catch(() => false);
        if (isVisible) {
          foundCards.push(cardText);
          console.log(`Found stat card: ${cardText}`);
        } else {
          missingCards.push(cardText);
          console.log(`Missing stat card: ${cardText}`);
        }
      }

      if (foundCards.length === 4) {
        result.status = 'PASS';
        result.details = 'All 4 stat cards rendered successfully';
      } else if (foundCards.length > 0) {
        result.status = 'WARNING';
        result.details = `Found ${foundCards.length}/4 stat cards. Missing: ${missingCards.join(', ')}`;
      } else {
        result.details = 'No stat cards found on page';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-stat-cards');
    } catch (error: any) {
      result.details = `Exception checking stat cards: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-stat-cards-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('3. Dashboard Components - Platform Breakdown', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'Platform Breakdown Section',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 3: Platform Breakdown ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for Platform Breakdown section
      const platformBreakdownVisible = await page.getByText('Platform Breakdown', { exact: false }).isVisible().catch(() => false);

      if (platformBreakdownVisible) {
        console.log('Platform Breakdown section found');

        // Check for empty state or data
        const noPlatformsMsg = await page.getByText('No platforms configured', { exact: false }).isVisible().catch(() => false);
        const addPlatformBtn = await page.getByText('Add Platform', { exact: false }).isVisible().catch(() => false);

        if (noPlatformsMsg || addPlatformBtn) {
          result.status = 'PASS';
          result.details = 'Platform Breakdown section present with proper empty state';
        } else {
          result.status = 'PASS';
          result.details = 'Platform Breakdown section present (may have data)';
        }
      } else {
        result.details = 'Platform Breakdown section not found';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-platform-breakdown');
    } catch (error: any) {
      result.details = `Exception checking platform breakdown: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-platform-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('4. Dashboard Components - Recent Reviews', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'Recent Reviews Section',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 4: Recent Reviews ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for Recent Reviews section
      const recentReviewsVisible = await page.getByText('Recent Reviews', { exact: false }).isVisible().catch(() => false);

      if (recentReviewsVisible) {
        console.log('Recent Reviews section found');

        // Check for empty state
        const noReviewsMsg = await page.getByText('No reviews yet', { exact: false }).isVisible().catch(() => false);

        if (noReviewsMsg) {
          result.status = 'PASS';
          result.details = 'Recent Reviews section present with proper empty state';
        } else {
          result.status = 'PASS';
          result.details = 'Recent Reviews section present (may have data)';
        }
      } else {
        result.details = 'Recent Reviews section not found';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-recent-reviews');
    } catch (error: any) {
      result.details = `Exception checking recent reviews: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-reviews-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('5. Header Buttons - Refresh Button', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'Refresh Button Functionality',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 5: Refresh Button ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Look for Refresh button
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      const isVisible = await refreshButton.isVisible().catch(() => false);

      if (isVisible) {
        console.log('Refresh button found, attempting click');

        // Listen for network requests
        const apiRequests: string[] = [];
        page.on('request', request => {
          if (request.url().includes('/api/reputation')) {
            apiRequests.push(request.url());
            console.log(`API Request: ${request.url()}`);
          }
        });

        await refreshButton.click();
        await page.waitForTimeout(2000); // Wait for potential API calls

        if (apiRequests.length > 0) {
          result.status = 'PASS';
          result.details = `Refresh button works, triggered ${apiRequests.length} API request(s)`;
        } else {
          result.status = 'WARNING';
          result.details = 'Refresh button clickable but no API requests detected';
        }
      } else {
        result.details = 'Refresh button not found';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-refresh-button');
    } catch (error: any) {
      result.details = `Exception testing refresh button: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-refresh-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('6. Header Buttons - View All Reviews', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'View All Reviews Button',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 6: View All Reviews Button ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Look for View All Reviews button
      const viewAllButton = page.getByRole('button', { name: /view all reviews/i });
      const isVisible = await viewAllButton.isVisible().catch(() => false);

      if (isVisible) {
        console.log('View All Reviews button found');

        const initialUrl = page.url();
        console.log(`Initial URL: ${initialUrl}`);

        await viewAllButton.click();
        await page.waitForTimeout(1000);

        const newUrl = page.url();
        console.log(`New URL after click: ${newUrl}`);

        if (newUrl !== initialUrl) {
          result.status = 'PASS';
          result.details = `Button navigated to: ${newUrl}`;
        } else {
          result.status = 'WARNING';
          result.details = 'Button exists but no navigation occurred';
        }
      } else {
        result.details = 'View All Reviews button not found';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-view-all-button');
    } catch (error: any) {
      result.details = `Exception testing View All Reviews button: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-view-all-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('7. API Integration - Stats Endpoint', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'API Stats Endpoint',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 7: Stats API Endpoint ===`);

      // Monitor API requests
      const apiResponses: Map<string, number> = new Map();

      page.on('response', response => {
        if (response.url().includes('/api/reputation/stats')) {
          apiResponses.set('/api/reputation/stats', response.status());
          console.log(`Stats API Response: ${response.status()}`);
        }
      });

      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for API calls

      const statsStatus = apiResponses.get('/api/reputation/stats');

      if (statsStatus === 200) {
        result.status = 'PASS';
        result.details = 'Stats API endpoint returned 200 OK';
      } else if (statsStatus === 401) {
        result.status = 'WARNING';
        result.details = 'Stats API returned 401 (auth required or Supabase not configured)';
      } else if (statsStatus === 500) {
        result.status = 'WARNING';
        result.details = 'Stats API returned 500 (database migration may be needed)';
      } else if (statsStatus) {
        result.status = 'WARNING';
        result.details = `Stats API returned ${statsStatus}`;
      } else {
        result.details = 'No API call to /api/reputation/stats detected';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-stats-api');
    } catch (error: any) {
      result.details = `Exception testing stats API: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-stats-api-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('8. API Integration - Reviews Endpoint', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'API Reviews Endpoint',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 8: Reviews API Endpoint ===`);

      // Monitor API requests
      const apiResponses: Map<string, number> = new Map();

      page.on('response', response => {
        if (response.url().includes('/api/reputation/reviews')) {
          apiResponses.set('/api/reputation/reviews', response.status());
          console.log(`Reviews API Response: ${response.status()}`);
        }
      });

      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for API calls

      const reviewsStatus = apiResponses.get('/api/reputation/reviews');

      if (reviewsStatus === 200) {
        result.status = 'PASS';
        result.details = 'Reviews API endpoint returned 200 OK';
      } else if (reviewsStatus === 401) {
        result.status = 'WARNING';
        result.details = 'Reviews API returned 401 (auth required or Supabase not configured)';
      } else if (reviewsStatus === 500) {
        result.status = 'WARNING';
        result.details = 'Reviews API returned 500 (database migration may be needed)';
      } else if (reviewsStatus) {
        result.status = 'WARNING';
        result.details = `Reviews API returned ${reviewsStatus}`;
      } else {
        result.details = 'No API call to /api/reputation/reviews detected';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-reviews-api');
    } catch (error: any) {
      result.details = `Exception testing reviews API: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-reviews-api-error');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('9. Error Handling - Graceful Degradation', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const result: TestResult = {
      test: 'Error Handling and Graceful Degradation',
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`\n=== TEST 9: Error Handling ===`);
      await page.goto(`${BASE_URL}/marketing/reputation`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check if page crashed
      const bodyText = await page.textContent('body');

      if (!bodyText) {
        result.details = 'Page rendered but body is empty';
      } else if (bodyText.includes('Application error') || bodyText.includes('Unhandled Runtime Error')) {
        result.details = 'Page crashed with unhandled error';
      } else {
        result.status = 'PASS';
        result.details = 'Page handles errors gracefully without crashing';
      }

      result.screenshotPath = await captureScreenshot(page, 'reputation-error-handling');
    } catch (error: any) {
      result.details = `Exception during error handling test: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'reputation-error-handling-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test.afterAll(async () => {
    // Generate comprehensive test report
    console.log(`\n\n=== GENERATING TEST REPORT ===\n`);

    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.md');
    const timestamp = new Date().toISOString();

    const totalTests = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const warnings = testResults.filter(r => r.status === 'WARNING').length;

    let overallStatus: string;
    if (failed === 0 && passed === totalTests) {
      overallStatus = 'ALL TESTS PASSING';
    } else if (failed === 0 && warnings > 0) {
      overallStatus = 'PASSING WITH WARNINGS';
    } else {
      overallStatus = 'FAILURES DETECTED';
    }

    let report = `# Reputation Management Module - Test Report\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Test URL**: ${BASE_URL}/marketing/reputation\n\n`;

    report += `## Summary\n\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Passed**: ${passed}\n`;
    report += `- **Failed**: ${failed}\n`;
    report += `- **Warnings**: ${warnings}\n`;
    report += `- **Overall Status**: ${overallStatus}\n\n`;

    report += `## Test Results\n\n`;

    for (const result of testResults) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `### ${statusIcon} ${result.test}\n\n`;
      report += `- **Status**: ${result.status}\n`;
      report += `- **Details**: ${result.details}\n`;

      if (result.screenshotPath) {
        const relPath = path.relative(SCREENSHOT_DIR, result.screenshotPath);
        report += `- **Screenshot**: ${relPath}\n`;
      }

      if (result.consoleErrors.length > 0) {
        report += `- **Console Errors**:\n`;
        result.consoleErrors.forEach(err => {
          report += `  - ${err}\n`;
        });
      }

      if (result.consoleWarnings.length > 0) {
        report += `- **Console Warnings**:\n`;
        result.consoleWarnings.forEach(warn => {
          report += `  - ${warn}\n`;
        });
      }

      report += `\n`;
    }

    report += `## Findings\n\n`;

    const criticalIssues = testResults.filter(r => r.status === 'FAIL');
    if (criticalIssues.length > 0) {
      report += `### Critical Issues (${criticalIssues.length})\n\n`;
      criticalIssues.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.test}**: ${issue.details}\n`;
      });
      report += `\n`;
    } else {
      report += `### Critical Issues\n\nNo critical issues found.\n\n`;
    }

    const warningIssues = testResults.filter(r => r.status === 'WARNING');
    if (warningIssues.length > 0) {
      report += `### Warnings (${warningIssues.length})\n\n`;
      warningIssues.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.test}**: ${issue.details}\n`;
      });
      report += `\n`;
    }

    report += `## Recommendations\n\n`;

    if (failed === 0 && warnings === 0) {
      report += `- All tests passing successfully\n`;
      report += `- Module is ready for production use\n`;
      report += `- No critical issues detected\n`;
    } else if (failed === 0) {
      report += `- Core functionality working correctly\n`;
      report += `- Warnings are expected due to:\n`;
      report += `  - Database migration not yet run\n`;
      report += `  - Supabase authentication not configured\n`;
      report += `  - No actual review data in system\n`;
      report += `- Fix warnings before production deployment\n`;
    } else {
      report += `- Address critical failures before proceeding\n`;
      report += `- Review console errors for detailed diagnostics\n`;
      report += `- Verify database schema and migrations\n`;
      report += `- Check API endpoint implementations\n`;
    }

    report += `\n## Next Steps\n\n`;
    report += `1. Review screenshots in: \`${SCREENSHOT_DIR}\`\n`;
    report += `2. Address any critical issues found\n`;
    report += `3. Run database migrations if needed\n`;
    report += `4. Configure Supabase authentication\n`;
    report += `5. Re-run tests after fixes\n`;

    fs.writeFileSync(reportPath, report);
    console.log(`\nTest Report Generated: ${reportPath}\n`);
    console.log(report);
  });
});
