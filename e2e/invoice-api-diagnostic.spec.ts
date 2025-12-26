import { test, expect } from '@playwright/test';

/**
 * Diagnostic test to debug why the public invoice view isn't working
 */

test.describe('Invoice API Diagnostics', () => {
  let viewToken: string;
  let invoiceNumber: string;

  test('1. Get invoice token from API', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Fetch invoice data
    const invoiceData = await page.evaluate(async () => {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    });

    console.log('Invoices count:', invoiceData?.data?.invoices?.length || 0);

    if (invoiceData?.success && invoiceData.data?.invoices?.length > 0) {
      const firstInvoice = invoiceData.data.invoices[0];
      viewToken = firstInvoice.view_token;
      invoiceNumber = firstInvoice.invoice_number;

      console.log('Invoice details:');
      console.log('  Number:', invoiceNumber);
      console.log('  ID:', firstInvoice.id);
      console.log('  Token:', viewToken);
      console.log('  Status:', firstInvoice.status);
    } else {
      throw new Error('No invoices found');
    }
  });

  test('2. Test public API endpoint directly', async ({ request }) => {
    test.skip(!viewToken, 'No token available');

    console.log('\nTesting API endpoint: /api/invoices/view/' + viewToken);

    const response = await request.get(`http://localhost:9002/api/invoices/view/${viewToken}`);
    const status = response.status();
    const data = await response.json().catch(() => ({}));

    console.log('Response status:', status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!response.ok()) {
      console.error('API Error:', data.error || 'Unknown error');
      console.log('\nThis indicates the API is returning an error.');
      console.log('Possible causes:');
      console.log('  1. Database connection issue');
      console.log('  2. Environment variables not set');
      console.log('  3. Row Level Security (RLS) policy blocking access');
      console.log('  4. Invoice not found in database');
    } else {
      console.log('\n✓ API endpoint working correctly!');
      console.log('Invoice number:', data.invoice?.invoice_number);
      console.log('Client:', data.invoice?.client?.company_name);
    }

    // Don't assert - just log for diagnostics
  });

  test('3. Check browser console for errors', async ({ page }) => {
    test.skip(!viewToken, 'No token available');

    const consoleMessages: string[] = [];
    const networkErrors: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`Browser console [${msg.type()}]:`, text);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      const failure = `${request.url()} - ${request.failure()?.errorText}`;
      networkErrors.push(failure);
      console.log('Network failure:', failure);
    });

    // Navigate to public invoice view
    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    console.log('\nNavigating to:', publicUrl);

    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/diagnostic-page.png',
      fullPage: true
    });

    // Check for error messages on page
    const pageText = await page.textContent('body');
    console.log('\nPage content preview:', pageText?.substring(0, 500));

    if (pageText?.includes('Invoice Not Found')) {
      console.log('\n❌ Page showing "Invoice Not Found"');
      console.log('This means the API returned an error or no data');
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ Network errors detected:');
      networkErrors.forEach(err => console.log('  -', err));
    }

    console.log('\nTotal console messages:', consoleMessages.length);
    console.log('Total network errors:', networkErrors.length);
  });

  test('4. Check environment variables', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check public env vars available in browser
    const envCheck = await page.evaluate(() => {
      return {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      };
    });

    console.log('\nClient-side environment check:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL:', envCheck.hasSupabaseUrl ? 'Set' : 'Missing');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', envCheck.hasSupabaseKey ? 'Set' : 'Missing');
    console.log('  NODE_ENV:', envCheck.nodeEnv);
  });

  test('5. Verify invoice exists in database', async ({ page }) => {
    test.skip(!viewToken, 'No token available');

    // Login
    await page.goto('http://localhost:9002/login');
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Query the invoice to verify it has a view_token
    const result = await page.evaluate(async (token) => {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        const invoice = data.data?.invoices?.find((inv: any) => inv.view_token === token);
        return {
          found: !!invoice,
          hasToken: !!invoice?.view_token,
          tokenLength: invoice?.view_token?.length || 0,
          invoiceNumber: invoice?.invoice_number,
          status: invoice?.status,
        };
      }
      return { found: false };
    }, viewToken);

    console.log('\nDatabase verification:');
    console.log('  Invoice found:', result.found);
    console.log('  Has view_token:', result.hasToken);
    console.log('  Token length:', result.tokenLength);
    console.log('  Invoice number:', result.invoiceNumber);
    console.log('  Status:', result.status);

    if (!result.found) {
      console.log('\n❌ Invoice not found in database with this token!');
    } else if (result.tokenLength !== 64) {
      console.log('\n⚠️  Token length is not 64 characters (expected for SHA-256 hex)');
    }
  });
});
