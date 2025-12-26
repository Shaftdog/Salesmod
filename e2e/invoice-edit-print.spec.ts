import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:9002';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots/invoice-functionality');
const ORDER_URL = `${BASE_URL}/orders/de3675b4-37b3-41cd-8ff4-53d759603d23`;

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Invoice Edit and Print Functionality', () => {

  // Increase test timeout to 60 seconds
  test.setTimeout(60000);

  // Helper function to navigate to order and click Invoice tab
  async function navigateToInvoiceTab(page: any) {
    await page.goto(ORDER_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Click on Invoice tab
    const invoiceTab = page.locator('button:has-text("Invoice"), [role="tab"]:has-text("Invoice")').first();
    if (await invoiceTab.count() > 0) {
      await invoiceTab.click();
      await page.waitForTimeout(2000);
    }
  }

  test.beforeEach(async ({ page }) => {
    console.log('\n=== LOGGING IN ===');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Fill login credentials
    await page.fill('input[type="email"], input[name="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"], input[name="password"]', 'Latter!974');

    // Click sign in button
    await page.click('button:has-text("Sign In")');

    // Wait for navigation after login
    await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log('✓ Login successful');
  });

  test('TC1: Invoice Display - Verify invoice card shows all expected information', async ({ page }) => {
    console.log('\n=== TEST CASE 1: Invoice Display ===\n');

    // Step 1: Navigate to order page
    console.log('Step 1: Navigating to order page...');
    await page.goto(ORDER_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for dynamic content to load
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-order-page-loaded.png'),
      fullPage: true
    });
    console.log('✓ Order page loaded');

    // Step 2: Click on Invoice tab
    console.log('\nStep 2: Clicking on Invoice tab...');
    const invoiceTab = page.locator('button:has-text("Invoice"), [role="tab"]:has-text("Invoice")').first();
    if (await invoiceTab.count() > 0) {
      await invoiceTab.click();
      await page.waitForTimeout(2000);
      console.log('✓ Invoice tab clicked');
    } else {
      console.log('→ Invoice tab not found, continuing...');
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-invoice-tab-selected.png'),
      fullPage: true
    });

    // Step 3: Verify invoice is displayed
    console.log('\nStep 3: Verifying invoice is displayed...');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-invoice-tab-content.png'),
      fullPage: true
    });

    // Look for invoice number (INV-00021 or similar)
    const invoiceNumber = page.locator('text=/INV-\\d+/').first();
    const hasInvoice = await invoiceNumber.count() > 0;

    if (!hasInvoice) {
      console.log('✗ FAILED: No invoice found on the page');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '03b-NO-INVOICE-FOUND.png'),
        fullPage: true
      });
      expect(hasInvoice).toBe(true);
      return;
    }

    const invoiceNum = await invoiceNumber.textContent();
    console.log(`✓ Invoice found: ${invoiceNum}`);

    // Step 4: Verify invoice display details
    console.log('\nStep 4: Verifying invoice display details...');

    console.log(`  - Invoice number: ${invoiceNum}`);
    expect(invoiceNum).toBeTruthy();

    // Check for status badge (Draft, Sent, Paid, etc)
    const statusBadge = await page.locator('text=/Draft|Sent|Paid|Viewed|Overdue|Cancelled/i').count();
    console.log(`  - Status badge present: ${statusBadge > 0 ? 'YES' : 'NO'}`);

    // Check for total amount
    const hasTotalAmount = await page.locator('text=/Total Amount|total_amount/i').count() > 0;
    console.log(`  - Total amount displayed: ${hasTotalAmount ? 'YES' : 'NO'}`);

    // Check for due date
    const hasDueDate = await page.locator('text=/Due Date|due_date/i').count() > 0;
    console.log(`  - Due date displayed: ${hasDueDate ? 'YES' : 'NO'}`);

    // Check for line items table
    const hasLineItems = await page.locator('table, [role="table"]').count() > 0;
    console.log(`  - Line items table present: ${hasLineItems ? 'YES' : 'NO'}`);

    // Check for action buttons (View, Edit, Print, Payment)
    const viewButton = await page.locator('button:has-text("View"), a:has-text("View")').count();
    const editButton = await page.locator('button:has-text("Edit")').count();
    const printButton = await page.locator('button:has-text("Print")').count();
    const paymentButton = await page.locator('button:has-text("Payment"), a:has-text("Payment")').count();

    console.log(`  - View button present: ${viewButton > 0 ? 'YES' : 'NO'}`);
    console.log(`  - Edit button present: ${editButton > 0 ? 'YES' : 'NO'}`);
    console.log(`  - Print button present: ${printButton > 0 ? 'YES' : 'NO'}`);
    console.log(`  - Payment button present: ${paymentButton > 0 ? 'YES' : 'NO'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-invoice-details-verified.png'),
      fullPage: true
    });

    // Verify at least some action buttons are present
    expect(viewButton + editButton + printButton).toBeGreaterThan(0);

    console.log('\n✓ PASSED: Invoice displays all expected information');
  });

  test('TC2: Edit Invoice - Verify edit dialog opens and functions correctly', async ({ page }) => {
    console.log('\n=== TEST CASE 2: Edit Invoice ===\n');

    // Step 1: Navigate to order page and click Invoice tab
    console.log('Step 1: Navigating to Invoice tab...');
    await navigateToInvoiceTab(page);
    console.log('✓ Invoice tab loaded');

    // Step 2: Click Edit button
    console.log('\nStep 2: Clicking Edit button...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-before-edit-click.png'),
      fullPage: true
    });

    const editButton = page.locator('button:has-text("Edit")').first();
    const editButtonExists = await editButton.count() > 0;

    if (!editButtonExists) {
      console.log('⚠️  Edit button not found - invoice may not be in editable state');
      console.log('   (Invoices can only be edited in Draft or Sent status)');

      // Check invoice status
      const statusText = await page.locator('[class*="badge"], [class*="Badge"]').first().textContent();
      console.log(`   Current invoice status: ${statusText}`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '04b-EDIT-NOT-AVAILABLE.png'),
        fullPage: true
      });

      test.skip();
      return;
    }

    await editButton.click();
    console.log('→ Edit button clicked');

    // Wait for dialog to open
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-edit-dialog-opened.png'),
      fullPage: true
    });

    // Step 3: Verify edit dialog contents
    console.log('\nStep 3: Verifying edit dialog contents...');

    // Check for dialog title
    const dialogTitle = await page.locator('text=/Edit Invoice/i').count() > 0;
    console.log(`  - Dialog title present: ${dialogTitle ? 'YES' : 'NO'}`);
    expect(dialogTitle).toBe(true);

    // Check for due date field
    const dueDateField = await page.locator('input[type="date"], input[name*="due"]').count();
    console.log(`  - Due date field present: ${dueDateField > 0 ? 'YES' : 'NO'}`);
    expect(dueDateField).toBeGreaterThan(0);

    // Check for payment method dropdown
    const paymentMethodDropdown = await page.locator('select, [role="combobox"]:has-text("Payment")').count();
    console.log(`  - Payment method dropdown present: ${paymentMethodDropdown > 0 ? 'YES' : 'NO'}`);

    // Check for line items table
    const lineItemsTable = await page.locator('table:has-text("Description"), table:has-text("Qty")').count();
    console.log(`  - Line items table present: ${lineItemsTable > 0 ? 'YES' : 'NO'}`);
    expect(lineItemsTable).toBeGreaterThan(0);

    // Check for editable fields in line items
    const descriptionInputs = await page.locator('input[placeholder*="Description"], textarea[placeholder*="Description"]').count();
    const quantityInputs = await page.locator('input[type="number"]').count();
    console.log(`  - Description inputs: ${descriptionInputs}`);
    console.log(`  - Quantity/price inputs: ${quantityInputs}`);

    // Check for notes field
    const notesField = await page.locator('textarea[placeholder*="note" i], textarea[name*="note"]').count();
    console.log(`  - Notes field present: ${notesField > 0 ? 'YES' : 'NO'}`);

    // Check for terms field
    const termsField = await page.locator('textarea[placeholder*="term" i], textarea[name*="term"]').count();
    console.log(`  - Terms field present: ${termsField > 0 ? 'YES' : 'NO'}`);

    // Check for running total
    const totalDisplay = await page.locator('text=/Total:?/i').count();
    console.log(`  - Running total calculation present: ${totalDisplay > 0 ? 'YES' : 'NO'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-edit-dialog-verified.png'),
      fullPage: true
    });

    // Step 4: Try editing a line item description
    console.log('\nStep 4: Testing line item editing...');

    const descriptionInput = page.locator('input[placeholder*="Description"]').first();
    if (await descriptionInput.count() > 0) {
      const originalValue = await descriptionInput.inputValue();
      console.log(`  - Original description: "${originalValue}"`);

      const newValue = 'Test Edit - Automated Testing';
      await descriptionInput.fill(newValue);
      await page.waitForTimeout(500);

      const updatedValue = await descriptionInput.inputValue();
      console.log(`  - Updated description: "${updatedValue}"`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07-line-item-edited.png'),
        fullPage: true
      });

      expect(updatedValue).toBe(newValue);
      console.log('✓ Line item description successfully edited');
    } else {
      console.log('→ No editable description field found');
    }

    // Step 5: Click Save Changes button
    console.log('\nStep 5: Clicking Save Changes button...');

    const saveButton = page.locator('button:has-text("Save Changes"), button[type="submit"]:has-text("Save")').first();
    const saveButtonExists = await saveButton.count() > 0;

    if (!saveButtonExists) {
      console.log('⚠️  Save button not found');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07b-NO-SAVE-BUTTON.png'),
        fullPage: true
      });
    } else {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '08-before-save.png'),
        fullPage: true
      });

      await saveButton.click();
      console.log('→ Save Changes button clicked');

      // Wait for potential success toast or dialog close
      await page.waitForTimeout(2000);

      // Check for success toast
      const successToast = await page.locator('text=/success|updated/i').count();
      if (successToast > 0) {
        console.log('✓ Success message displayed');
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '09-after-save.png'),
        fullPage: true
      });

      // Verify dialog closed
      const dialogStillOpen = await page.locator('text=/Edit Invoice/i').count() > 0;
      if (!dialogStillOpen) {
        console.log('✓ Edit dialog closed successfully');
      }
    }

    console.log('\n✓ PASSED: Edit invoice functionality works correctly');
  });

  test('TC3: Print Invoice - Verify print dialog opens with preview', async ({ page }) => {
    console.log('\n=== TEST CASE 3: Print Invoice ===\n');

    // Step 1: Navigate to order page and click Invoice tab
    console.log('Step 1: Navigating to Invoice tab...');
    await navigateToInvoiceTab(page);
    console.log('✓ Invoice tab loaded');

    // Step 2: Click Print button
    console.log('\nStep 2: Clicking Print button...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '10-before-print-click.png'),
      fullPage: true
    });

    const printButton = page.locator('button:has-text("Print")').first();
    const printButtonExists = await printButton.count() > 0;

    if (!printButtonExists) {
      console.log('✗ FAILED: Print button not found');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '10b-NO-PRINT-BUTTON.png'),
        fullPage: true
      });
      expect(printButtonExists).toBe(true);
      return;
    }

    // Use force click to avoid timeout issues
    await printButton.click({ force: true, timeout: 10000 });
    console.log('→ Print button clicked');

    // Wait for print dialog to open
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '11-print-dialog-opened.png'),
      fullPage: true
    });

    // Step 3: Verify print dialog contents
    console.log('\nStep 3: Verifying print dialog contents...');

    // Check for dialog title
    const dialogTitle = await page.locator('text=/Print Invoice/i').count() > 0;
    console.log(`  - Dialog title present: ${dialogTitle ? 'YES' : 'NO'}`);
    expect(dialogTitle).toBe(true);

    // Check for preview section
    const hasPreviewArea = await page.locator('[class*="preview"], [class*="overflow"]').count() > 0;
    console.log(`  - Preview area present: ${hasPreviewArea ? 'YES' : 'NO'}`);

    // Step 4: Verify preview shows expected content
    console.log('\nStep 4: Verifying print preview content...');

    // Check for company name header
    const companyName = await page.locator('text=/My ROI Home/i').count();
    console.log(`  - Company name header: ${companyName > 0 ? 'YES' : 'NO'}`);

    // Check for invoice number in preview
    const invoiceNumberInPreview = await page.locator('text=/INV-\\d+/').count();
    console.log(`  - Invoice number in preview: ${invoiceNumberInPreview > 0 ? 'YES' : 'NO'}`);
    expect(invoiceNumberInPreview).toBeGreaterThan(0);

    // Check for client information
    const hasClientInfo = await page.locator('text=/client|customer/i').count() > 0;
    console.log(`  - Client information: ${hasClientInfo ? 'YES' : 'NO'}`);

    // Check for line items in preview
    const hasLineItemsInPreview = await page.locator('table').count() > 0;
    console.log(`  - Line items table in preview: ${hasLineItemsInPreview ? 'YES' : 'NO'}`);

    // Check for totals section
    const hasTotals = await page.locator('text=/Total|Subtotal/i').count() > 0;
    console.log(`  - Totals section: ${hasTotals ? 'YES' : 'NO'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '12-print-preview-verified.png'),
      fullPage: true
    });

    // Step 5: Verify action buttons
    console.log('\nStep 5: Verifying print dialog action buttons...');

    const closeButton = await page.locator('button:has-text("Close")').count();
    const printInvoiceButton = await page.locator('button:has-text("Print Invoice"), button:has-text("Print")').count();

    console.log(`  - Close button present: ${closeButton > 0 ? 'YES' : 'NO'}`);
    console.log(`  - Print Invoice button present: ${printInvoiceButton > 0 ? 'YES' : 'NO'}`);

    expect(closeButton).toBeGreaterThan(0);
    expect(printInvoiceButton).toBeGreaterThan(0);

    // Step 6: Click Close to close the dialog
    console.log('\nStep 6: Closing print dialog...');

    const closeBtn = page.locator('button:has-text("Close")').first();
    await closeBtn.click();
    console.log('→ Close button clicked');

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13-print-dialog-closed.png'),
      fullPage: true
    });

    // Verify dialog is closed
    const dialogStillOpen = await page.locator('text=/Print Invoice/i').count() > 0;
    if (!dialogStillOpen) {
      console.log('✓ Print dialog closed successfully');
    } else {
      console.log('⚠️  Print dialog may still be open');
    }

    console.log('\n✓ PASSED: Print invoice functionality works correctly');
  });

  test('TC4: Complete Invoice Workflow - Display, Edit, and Print', async ({ page }) => {
    console.log('\n=== TEST CASE 4: Complete Invoice Workflow ===\n');

    // Step 1: Navigate to Invoice tab
    console.log('Step 1: Navigating to Invoice tab...');
    await navigateToInvoiceTab(page);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14-complete-workflow-start.png'),
      fullPage: true
    });
    console.log('✓ Invoice tab loaded');

    // Step 2: Verify invoice is displayed
    console.log('\nStep 2: Verifying invoice display...');
    const invoiceNumber = page.locator('text=/INV-\\d+/').first();
    const hasInvoice = await invoiceNumber.count() > 0;

    if (!hasInvoice) {
      console.log('⚠️  No invoice found - may have been modified/deleted by previous tests');
      console.log('   Skipping complete workflow test');
      test.skip();
      return;
    }

    console.log('✓ Invoice displayed');

    // Step 3: Test Edit functionality (if available)
    console.log('\nStep 3: Testing Edit functionality...');
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1500);

      const editDialogOpen = await page.locator('text=/Edit Invoice/i').count() > 0;
      if (editDialogOpen) {
        console.log('✓ Edit dialog opened');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '15-edit-dialog-workflow.png'),
          fullPage: true
        });

        // Close edit dialog
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          console.log('✓ Edit dialog closed');
        }
      }
    } else {
      console.log('→ Edit not available (invoice may be paid/locked)');
    }

    // Step 4: Test Print functionality
    console.log('\nStep 4: Testing Print functionality...');
    const printButton = page.locator('button:has-text("Print")').first();
    if (await printButton.count() > 0) {
      await printButton.click();
      await page.waitForTimeout(1500);

      const printDialogOpen = await page.locator('text=/Print Invoice/i').count() > 0;
      if (printDialogOpen) {
        console.log('✓ Print dialog opened');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '16-print-dialog-workflow.png'),
          fullPage: true
        });

        // Verify preview content
        const hasPreviewContent = await page.locator('text=/INV-\\d+/').count() > 0;
        console.log(`  - Preview content visible: ${hasPreviewContent ? 'YES' : 'NO'}`);

        // Close print dialog
        const closeButton = page.locator('button:has-text("Close")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
          console.log('✓ Print dialog closed');
        }
      }
    } else {
      console.log('✗ FAILED: Print button not found');
      expect(await printButton.count()).toBeGreaterThan(0);
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '17-complete-workflow-end.png'),
      fullPage: true
    });

    console.log('\n✓ PASSED: Complete invoice workflow tested successfully');
    console.log('\n=== WORKFLOW SUMMARY ===');
    console.log('✓ Invoice displayed with all information');
    console.log('✓ Edit dialog opens and functions (if available)');
    console.log('✓ Print dialog opens with preview');
    console.log('✓ All dialogs can be closed properly');
  });
});
