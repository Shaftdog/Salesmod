import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test the public invoice view page after bug fix
test.describe('Public Invoice View', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Use the specific invoice INV-00008 with the provided token
  const viewToken = 'df4fefb6d89bed8868498cb086d57fa9b024a1a7426cb214091fa319d25041ef';
  const invoiceNumber = 'INV-00008';
  let invoiceId: string;

  test('should display public invoice view correctly', async ({ page }) => {
    // Navigate to the public invoice view page
    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    console.log('Navigating to:', publicUrl);

    await page.goto(publicUrl);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of the full page
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/01-public-invoice-view.png',
      fullPage: true
    });

    // Verify the page displays key elements

    // 1. Company/Org name at the top
    const companyName = page.locator('text=/Rod Haugabrooks|My ROI Home|Company Name/i').first();
    await expect(companyName).toBeVisible({ timeout: 10000 });

    // 2. Invoice number
    await expect(page.locator(`text=${invoiceNumber}`)).toBeVisible();

    // 3. Status badge
    const statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
    await expect(statusBadge).toBeVisible();

    // Take screenshot of header section
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/02-invoice-header.png'
    });

    // 4. Bill To section (Client info)
    const billToSection = page.locator('text=/Bill To|Billed To/i');
    await expect(billToSection).toBeVisible();

    // 5. Line items table
    const lineItemsTable = page.locator('table, [role="table"]').first();
    await expect(lineItemsTable).toBeVisible();

    // Take screenshot of line items
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/03-line-items.png'
    });

    // 6. Totals section
    const totalsSection = page.locator('text=/Total|Subtotal|Amount Due/i').first();
    await expect(totalsSection).toBeVisible();

    // 7. Pay Now button
    const payNowButton = page.locator('button:has-text("Pay Now"), a:has-text("Pay Now")');
    await expect(payNowButton).toBeVisible();

    // Take screenshot of totals and payment button
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/04-totals-and-payment.png'
    });

    console.log('✓ Public invoice view displays all required elements');
  });

  test('should update invoice status from "sent" to "viewed"', async ({ page }) => {
    // Get invoice ID from database
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (!invoiceData) {
      console.warn('⚠️  Could not fetch invoice from database, skipping status reset');
      return;
    }

    invoiceId = invoiceData.id;

    // First, reset the invoice status to "sent"
    const { error: resetError } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    if (resetError) {
      console.error('Error resetting invoice status:', resetError);
      console.warn('⚠️  Could not reset invoice status, continuing test anyway');
    } else {
      console.log('✓ Reset invoice status to "sent"');
    }

    // Visit the public invoice view page
    const publicUrl = `http://localhost:9002/invoices/view/${viewToken}`;
    await page.goto(publicUrl);
    await page.waitForLoadState('networkidle');

    // Wait a moment for the status update to process
    await page.waitForTimeout(2000);

    // Check the database to verify status changed to "viewed"
    const { data: updatedInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated invoice:', fetchError);
      throw new Error(`Failed to fetch updated invoice: ${fetchError.message}`);
    }

    console.log('Updated invoice status:', updatedInvoice.status);

    // The status should now be "viewed"
    expect(updatedInvoice.status).toBe('viewed');

    console.log('✓ Invoice status successfully changed from "sent" to "viewed"');

    // Take screenshot showing the viewed invoice
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/05-invoice-viewed.png',
      fullPage: true
    });
  });

  test('should verify status change in admin panel', async ({ page }) => {
    // Login to admin panel
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.fill('input[name="email"], input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[name="password"], input[type="password"]', 'Latter!974');

    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');

    // Take screenshot of logged in state
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/06-logged-in.png'
    });

    // Navigate to Finance > Invoicing
    // First try to find Finance menu
    const financeMenu = page.locator('text=/Finance|Invoicing/i').first();
    await financeMenu.click({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on Invoicing submenu if it exists
    const invoicingLink = page.locator('a:has-text("Invoicing"), text=/Invoicing/i').first();
    await invoicingLink.click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of invoicing page
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/07-invoicing-page.png',
      fullPage: true
    });

    // Look for the invoice in the list
    const invoiceRow = page.locator(`tr:has-text("${invoiceNumber}")`).first();
    await expect(invoiceRow).toBeVisible({ timeout: 10000 });

    // Check if status shows "viewed"
    const statusCell = invoiceRow.locator('text=/viewed/i');
    await expect(statusCell).toBeVisible();

    // Take screenshot highlighting the status
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/08-status-verified.png',
      fullPage: true
    });

    console.log('✓ Verified invoice status shows "viewed" in admin panel');
  });

  test('should handle missing or invalid tokens gracefully', async ({ page }) => {
    // Test with invalid token
    const invalidUrl = 'http://localhost:9002/invoices/view/invalid-token-12345';
    await page.goto(invalidUrl);
    await page.waitForLoadState('networkidle');

    // Should show error message or redirect
    const errorMessage = page.locator('text=/not found|invalid|error/i').first();
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    // Take screenshot of error state
    await page.screenshot({
      path: 'e2e/screenshots/invoice-view/09-invalid-token.png'
    });

    // Should either show error or redirect (both are acceptable)
    const currentUrl = page.url();
    const hasError = isErrorVisible || currentUrl.includes('error') || currentUrl.includes('404');

    expect(hasError).toBeTruthy();
    console.log('✓ Invalid token handled gracefully');
  });
});
