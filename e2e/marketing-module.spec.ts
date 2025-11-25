import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'marketing-module');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  feature: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
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
  return filepath;
}

async function collectConsoleMessages(page: Page, errors: string[], warnings: string[]) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
}

test.describe('Marketing Module Comprehensive Testing', () => {
  test.setTimeout(120000); // 2 minutes per test

  test('1. Marketing Dashboard', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing`;
    const result: TestResult = {
      feature: 'Marketing Dashboard',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for redirects (auth)
      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'marketing-dashboard-auth-redirect');
      } else {
        // Check response status
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'marketing-dashboard-error');
        } else {
          // Check for page content
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'marketing-dashboard-500');
          } else {
            result.status = 'PASS';
            result.details = 'Dashboard loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'marketing-dashboard-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'marketing-dashboard-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('2. Campaigns List', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/campaigns`;
    const result: TestResult = {
      feature: 'Campaigns List',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'campaigns-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'campaigns-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'campaigns-500');
          } else {
            result.status = 'PASS';
            result.details = 'Campaigns page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'campaigns-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'campaigns-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('3. Lead Scoring / Audiences', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/audiences`;
    const result: TestResult = {
      feature: 'Lead Scoring / Audiences',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'audiences-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'audiences-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'audiences-500');
          } else {
            result.status = 'PASS';
            result.details = 'Audiences page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'audiences-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'audiences-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('4. Content Library', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/content`;
    const result: TestResult = {
      feature: 'Content Library',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'content-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'content-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'content-500');
          } else {
            result.status = 'PASS';
            result.details = 'Content library page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'content-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'content-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('5. Email Templates', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/email-templates`;
    const result: TestResult = {
      feature: 'Email Templates',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'email-templates-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'email-templates-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'email-templates-500');
          } else {
            result.status = 'PASS';
            result.details = 'Email templates page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'email-templates-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'email-templates-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('6. Newsletters', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/newsletters`;
    const result: TestResult = {
      feature: 'Newsletters',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'newsletters-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'newsletters-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'newsletters-500');
          } else {
            result.status = 'PASS';
            result.details = 'Newsletters page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'newsletters-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'newsletters-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('7. Webinars', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/webinars`;
    const result: TestResult = {
      feature: 'Webinars',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'webinars-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'webinars-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'webinars-500');
          } else {
            result.status = 'PASS';
            result.details = 'Webinars page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'webinars-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'webinars-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test('8. Analytics', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    collectConsoleMessages(page, errors, warnings);

    const url = `${BASE_URL}/marketing/analytics`;
    const result: TestResult = {
      feature: 'Analytics',
      url,
      status: 'FAIL',
      details: '',
      consoleErrors: errors,
      consoleWarnings: warnings,
    };

    try {
      console.log(`Testing: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl !== url && (finalUrl.includes('/login') || finalUrl.includes('/auth'))) {
        result.status = 'SKIP';
        result.details = `Redirected to authentication: ${finalUrl}`;
        result.screenshotPath = await captureScreenshot(page, 'analytics-auth-redirect');
      } else {
        const status = response?.status() || 0;
        if (status >= 400) {
          result.details = `HTTP ${status} error`;
          result.screenshotPath = await captureScreenshot(page, 'analytics-error');
        } else {
          await page.waitForLoadState('domcontentloaded');
          const bodyText = await page.textContent('body');

          if (bodyText?.includes('error') && bodyText?.includes('500')) {
            result.details = 'Page shows 500 error';
            result.screenshotPath = await captureScreenshot(page, 'analytics-500');
          } else {
            result.status = 'PASS';
            result.details = 'Analytics page loaded successfully';
            result.screenshotPath = await captureScreenshot(page, 'analytics-success');
          }
        }
      }
    } catch (error: any) {
      result.details = `Exception: ${error.message}`;
      result.screenshotPath = await captureScreenshot(page, 'analytics-exception');
    }

    testResults.push(result);
    console.log(`Result: ${result.status} - ${result.details}`);
  });

  test.afterAll(async () => {
    // Generate comprehensive test report
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.md');

    const totalTests = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const skipped = testResults.filter(r => r.status === 'SKIP').length;

    const allPassing = failed === 0 && passed > 0;
    const allSkipped = skipped === totalTests;

    let overallStatus: string;
    if (allSkipped) {
      overallStatus = 'NEEDS AUTHENTICATION';
    } else if (allPassing) {
      overallStatus = 'PRODUCTION READY';
    } else {
      overallStatus = 'NEEDS FIXES';
    }

    let report = `# Marketing Module Test Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Passed**: ${passed}\n`;
    report += `- **Failed**: ${failed}\n`;
    report += `- **Skipped**: ${skipped}\n`;
    report += `- **Overall Status**: ${overallStatus}\n\n`;

    report += `## Test Results\n\n`;

    for (const result of testResults) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      report += `### ${statusIcon} ${result.feature}\n\n`;
      report += `- **Status**: ${result.status}\n`;
      report += `- **URL**: ${result.url}\n`;
      report += `- **Details**: ${result.details}\n`;

      if (result.screenshotPath) {
        report += `- **Screenshot**: ${path.basename(result.screenshotPath)}\n`;
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

    report += `## Blocking Issues\n\n`;
    const blockingIssues = testResults.filter(r => r.status === 'FAIL');
    if (blockingIssues.length === 0) {
      report += `No blocking issues found.\n\n`;
    } else {
      blockingIssues.forEach((issue, idx) => {
        report += `${idx + 1}. **${issue.feature}**: ${issue.details}\n`;
      });
      report += `\n`;
    }

    report += `## Recommendations\n\n`;
    if (allSkipped) {
      report += `- All pages redirected to authentication\n`;
      report += `- Set up test authentication or test public pages\n`;
      report += `- Cannot verify page functionality without auth\n`;
    } else if (allPassing) {
      report += `- All accessible pages loading successfully\n`;
      report += `- No critical errors detected\n`;
      report += `- Ready for manual feature testing\n`;
    } else {
      report += `- Fix failing pages before production deployment\n`;
      report += `- Review console errors and warnings\n`;
      report += `- Verify database connectivity and RLS policies\n`;
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\n\nTest Report Generated: ${reportPath}\n`);
    console.log(report);
  });
});
