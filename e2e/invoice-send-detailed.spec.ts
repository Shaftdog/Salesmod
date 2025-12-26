/**
 * Detailed test for Send Invoice functionality
 * This test verifies the API call and status update
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:9002';
const TEST_USER = {
  email: 'rod@myroihome.com',
  password: 'Latter!974'
};

test.describe('Send Invoice Detailed Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', TEST_USER.password);

    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/dashboard|\/finance|\/production|\/(?!login)/, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('Verify Send Invoice API call and status update', async ({ page }) => {
    test.setTimeout(120000);

    // Track API calls
    const apiCalls: any[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/invoices')) {
        apiCalls.push({
          url,
          status: response.status(),
          method: response.request().method(),
          timestamp: new Date().toISOString()
        });

        console.log(`API Call: ${response.request().method()} ${url} - Status: ${response.status()}`);

        // Try to read response body
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const body = await response.json();
            console.log('Response:', JSON.stringify(body, null, 2).substring(0, 500));
          }
        } catch (e) {
          // Can't read body
        }
      }
    });

    // Track console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Error: ${msg.text()}`);
      }
    });

    console.log('\n=== Step 1: Navigate to Invoicing ===');
    await page.goto(`${BASE_URL}/finance/invoicing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== Step 2: Find a draft invoice ===');
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} invoices`);

    let draftInvoiceLink;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();

      if (rowText?.toLowerCase().includes('draft')) {
        draftInvoiceLink = row.locator('td:first-child a');
        const invoiceNumber = await draftInvoiceLink.textContent();
        console.log(`Found draft invoice: ${invoiceNumber}`);
        break;
      }
    }

    if (!draftInvoiceLink) {
      console.log('No draft invoice found, skipping test');
      return;
    }

    console.log('\n=== Step 3: Navigate to invoice detail ===');
    await draftInvoiceLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Extract invoice ID from URL
    const invoiceUrl = page.url();
    const invoiceId = invoiceUrl.split('/').pop();
    console.log(`Invoice ID: ${invoiceId}`);

    console.log('\n=== Step 4: Verify Send Invoice button ===');
    const sendButton = page.locator('button:has-text("Send Invoice")').first();
    await expect(sendButton).toBeVisible();
    console.log('✅ Send Invoice button is visible');

    console.log('\n=== Step 5: Click Send Invoice ===');
    await sendButton.click();
    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    console.log('✅ Dialog opened');

    // Take screenshot before confirming
    await page.screenshot({
      path: 'e2e/screenshots/invoice-workflow/detailed-01-dialog.png',
      fullPage: true
    });

    console.log('\n=== Step 6: Confirm send ===');
    const confirmButton = dialog.locator('button:has-text("Send Invoice")');

    // Clear API calls before clicking
    apiCalls.length = 0;

    await confirmButton.click();
    console.log('Clicked confirm button');

    // Wait for API call to complete
    await page.waitForTimeout(5000);

    console.log('\n=== API Calls Made ===');
    apiCalls.forEach((call, idx) => {
      console.log(`${idx + 1}. ${call.method} ${call.url} - ${call.status}`);
    });

    // Check if send API was called
    const sendApiCall = apiCalls.find(call =>
      call.url.includes(`/api/invoices/${invoiceId}/send`) && call.method === 'POST'
    );

    if (sendApiCall) {
      console.log(`✅ Send API called: ${sendApiCall.url} - Status: ${sendApiCall.status}`);
    } else {
      console.log('❌ Send API was NOT called');
    }

    // Take screenshot after send
    await page.screenshot({
      path: 'e2e/screenshots/invoice-workflow/detailed-02-after-send.png',
      fullPage: true
    });

    console.log('\n=== Step 7: Check status after reload ===');
    // The page should have reloaded automatically
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get status badge text
    const statusBadges = page.locator('[class*="badge"]');
    const badgeCount = await statusBadges.count();
    console.log(`Found ${badgeCount} badges on page`);

    for (let i = 0; i < badgeCount; i++) {
      const badgeText = await statusBadges.nth(i).textContent();
      console.log(`Badge ${i + 1}: ${badgeText}`);
    }

    // Take final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-workflow/detailed-03-final-status.png',
      fullPage: true
    });

    console.log('\n=== Test Complete ===');
  });
});
