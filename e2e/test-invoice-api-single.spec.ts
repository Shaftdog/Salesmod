import { test } from '@playwright/test';

test('Direct API test with hardcoded token', async ({ request, page }) => {
  // Hardcoded token from previous test
  const viewToken = 'b5806bcbaec93c1c71ecebd0dddfeb1b51df1b0bfef158ceb7003a651f8a7a32';

  console.log('\n=== Testing Public Invoice API ===');
  console.log('Token:', viewToken);
  console.log('URL: /api/invoices/view/' + viewToken);

  const response = await request.get(`http://localhost:9002/api/invoices/view/${viewToken}`);
  const status = response.status();

  console.log('\nResponse status:', status);

  let data;
  try {
    data = await response.json();
    console.log('\nResponse body:');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    const text = await response.text();
    console.log('\nResponse (non-JSON):');
    console.log(text);
  }

  if (status !== 200) {
    console.log('\n❌ API returned error status:', status);
    console.log('Error:', data?.error || 'Unknown error');
  } else {
    console.log('\n✓ API returned success!');
    console.log('Invoice number:', data?.invoice?.invoice_number);
  }

  // Also test in browser
  console.log('\n=== Testing in Browser ===');

  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });

  page.on('requestfailed', req => {
    console.log(`[Request failed]:`, req.url(), req.failure()?.errorText);
  });

  page.on('response', async res => {
    if (res.url().includes('/api/invoices/view/')) {
      console.log(`[API Response]:`, res.status(), res.url());
      try {
        const json = await res.json();
        console.log('[API Response Body]:', JSON.stringify(json, null, 2).substring(0, 500));
      } catch (e) {
        // Not JSON
      }
    }
  });

  await page.goto(`http://localhost:9002/invoices/view/${viewToken}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const pageContent = await page.textContent('body');
  console.log('\nPage content:', pageContent?.substring(0, 300));

  await page.screenshot({
    path: 'e2e/screenshots/invoice-view/api-test-result.png',
    fullPage: true
  });
});
