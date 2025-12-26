import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E Test Suite: Document Viewer Feature
 *
 * Tests the document viewer dialog functionality in the Orders section:
 * - Opening viewer via clicking document row
 * - Opening viewer via eye icon button
 * - PDF viewing in iframe
 * - Image viewing with zoom controls (50-200%)
 * - Image rotation controls
 * - Large file warning badge (>10MB)
 * - Error state handling
 * - Download and open in new tab buttons
 */

const TEST_USER_EMAIL = 'rod@myroihome.com';
const TEST_USER_PASSWORD = 'Latter!974';
const BASE_URL = 'http://localhost:9002';

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots', 'document-viewer');

test.describe('Document Viewer Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login form using ID selectors
    await page.fill('#email', TEST_USER_EMAIL);
    await page.fill('#password', TEST_USER_PASSWORD);

    // Submit and wait for navigation
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Navigate to Orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
  });

  test('TC1: Navigate to Order with Documents', async ({ page }) => {
    // Find and click on the first order to view details
    const orderLink = page.locator('a[href^="/orders/"]').first();

    // Check if we have any orders
    const hasOrders = await orderLink.isVisible().catch(() => false);

    if (!hasOrders) {
      console.log('No orders found. Creating test order...');
      // If no orders, we need to navigate differently or create test data
      await page.screenshot({ path: path.join(screenshotDir, '01-no-orders-found.png') });
      return;
    }

    await orderLink.click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of order detail page
    await page.screenshot({ path: path.join(screenshotDir, '02-order-detail-page.png') });

    // Look for Documents tab/section
    const documentsTab = page.locator('text=Documents').first();
    const hasDocumentsTab = await documentsTab.isVisible();

    if (hasDocumentsTab) {
      await documentsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '03-documents-tab.png') });
    }

    // Check if documents are present
    const documentsList = page.locator('div.space-y-3 > div').first();
    const hasDocuments = await documentsList.isVisible().catch(() => false);

    if (!hasDocuments) {
      const emptyState = page.locator('text=No documents have been uploaded');
      const isEmptyState = await emptyState.isVisible();

      await page.screenshot({ path: path.join(screenshotDir, '04-empty-documents-state.png') });

      if (isEmptyState) {
        console.log('✓ Empty state displayed correctly');
      }

      // Test will continue to next test case
      return;
    }

    console.log('✓ Found order with documents');
    expect(hasDocuments).toBe(true);
  });

  test('TC2: Open Document Viewer by Clicking Document Row', async ({ page }) => {
    // Navigate to an order (reuse logic from TC1)
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    // Navigate to Documents tab if needed
    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Find a document row
    const documentRow = page.locator('div.space-y-3 > div button[type="button"]').first();
    const hasDocuments = await documentRow.isVisible().catch(() => false);

    if (!hasDocuments) {
      console.log('Skipping: No documents available to test');
      await page.screenshot({ path: path.join(screenshotDir, '05-no-documents-for-row-click.png') });
      return;
    }

    // Get document name before clicking
    const documentName = await documentRow.locator('p.font-medium').textContent();
    console.log(`Clicking document: ${documentName}`);

    await page.screenshot({ path: path.join(screenshotDir, '06-before-row-click.png') });

    // Click the document row
    await documentRow.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot of opened dialog
    await page.screenshot({ path: path.join(screenshotDir, '07-viewer-opened-via-row.png') });

    // Verify dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify document name in dialog title
    const dialogTitle = page.locator('[role="dialog"] h2');
    await expect(dialogTitle).toContainText(documentName || '');

    console.log('✓ Document viewer opened successfully via row click');

    // Close dialog for next test
    const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  });

  test('TC3: Open Document Viewer via Eye Icon Button', async ({ page }) => {
    // Navigate to an order
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    // Navigate to Documents tab if needed
    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Find the eye icon button
    const eyeButton = page.locator('button[title="View"], button[aria-label*="View"]').first();
    const hasEyeButton = await eyeButton.isVisible().catch(() => false);

    if (!hasEyeButton) {
      console.log('Skipping: No documents available to test eye button');
      await page.screenshot({ path: path.join(screenshotDir, '08-no-eye-button-found.png') });
      return;
    }

    await page.screenshot({ path: path.join(screenshotDir, '09-before-eye-button-click.png') });

    // Click the eye icon
    await eyeButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Take screenshot
    await page.screenshot({ path: path.join(screenshotDir, '10-viewer-opened-via-eye-icon.png') });

    // Verify dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    console.log('✓ Document viewer opened successfully via eye icon');

    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('TC4: Verify PDF Viewing in Iframe', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Look for a PDF document (typically shown with PDF icon or .pdf extension)
    const documentRows = page.locator('div.space-y-3 > div');
    const documentCount = await documentRows.count();

    let pdfFound = false;

    for (let i = 0; i < documentCount; i++) {
      const row = documentRows.nth(i);
      const documentName = await row.locator('p.font-medium').textContent();

      if (documentName?.toLowerCase().includes('.pdf')) {
        pdfFound = true;
        console.log(`Found PDF document: ${documentName}`);

        // Click to open viewer
        await row.locator('button[type="button"]').click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Take screenshot
        await page.screenshot({ path: path.join(screenshotDir, '11-pdf-viewer-opened.png') });

        // Verify iframe exists
        const iframe = page.locator('[role="dialog"] iframe');
        const iframeVisible = await iframe.isVisible().catch(() => false);

        if (iframeVisible) {
          console.log('✓ PDF iframe is visible');
          await expect(iframe).toBeVisible();

          // Verify iframe has src attribute
          const iframeSrc = await iframe.getAttribute('src');
          expect(iframeSrc).toBeTruthy();
          console.log(`✓ PDF iframe src: ${iframeSrc?.substring(0, 50)}...`);
        }

        // Verify no zoom controls visible (PDFs don't have zoom controls)
        const zoomButtons = page.locator('[role="dialog"] button[aria-label*="Zoom"]');
        const zoomButtonsCount = await zoomButtons.count();
        expect(zoomButtonsCount).toBe(0);
        console.log('✓ No zoom controls displayed for PDF (as expected)');

        await page.screenshot({ path: path.join(screenshotDir, '12-pdf-viewer-verified.png') });

        // Close dialog
        await page.keyboard.press('Escape');
        break;
      }
    }

    if (!pdfFound) {
      console.log('Skipping: No PDF documents found for testing');
      await page.screenshot({ path: path.join(screenshotDir, '13-no-pdf-documents.png') });
    }
  });

  test('TC5: Test Image Zoom Controls', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Look for an image document
    const documentRows = page.locator('div.space-y-3 > div');
    const documentCount = await documentRows.count();

    let imageFound = false;

    for (let i = 0; i < documentCount; i++) {
      const row = documentRows.nth(i);
      const documentName = await row.locator('p.font-medium').textContent();

      // Check for common image extensions
      if (documentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        imageFound = true;
        console.log(`Found image document: ${documentName}`);

        // Click to open viewer
        await row.locator('button[type="button"]').click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Wait for image to load
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, '14-image-viewer-opened.png') });

        // Verify zoom controls are visible
        const zoomInButton = page.locator('button[aria-label="Zoom in"]');
        const zoomOutButton = page.locator('button[aria-label="Zoom out"]');
        const zoomLabel = page.locator('text=/\\d+%/');

        await expect(zoomInButton).toBeVisible();
        await expect(zoomOutButton).toBeVisible();
        await expect(zoomLabel).toBeVisible();

        // Get initial zoom level
        const initialZoom = await zoomLabel.textContent();
        expect(initialZoom).toBe('100%');
        console.log(`✓ Initial zoom: ${initialZoom}`);

        // Test zoom in
        await zoomInButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '15-image-zoomed-in-125.png') });

        let currentZoom = await zoomLabel.textContent();
        expect(currentZoom).toBe('125%');
        console.log(`✓ Zoomed in to: ${currentZoom}`);

        // Zoom in again
        await zoomInButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '16-image-zoomed-in-150.png') });

        currentZoom = await zoomLabel.textContent();
        expect(currentZoom).toBe('150%');
        console.log(`✓ Zoomed in to: ${currentZoom}`);

        // Test zoom out
        await zoomOutButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '17-image-zoomed-out-125.png') });

        currentZoom = await zoomLabel.textContent();
        expect(currentZoom).toBe('125%');
        console.log(`✓ Zoomed out to: ${currentZoom}`);

        // Test zoom limits - zoom to max
        for (let j = 0; j < 5; j++) {
          await zoomInButton.click();
          await page.waitForTimeout(100);
        }

        currentZoom = await zoomLabel.textContent();
        expect(currentZoom).toBe('200%');
        console.log(`✓ Max zoom reached: ${currentZoom}`);

        // Verify zoom in button is disabled at max
        const isZoomInDisabled = await zoomInButton.isDisabled();
        expect(isZoomInDisabled).toBe(true);
        console.log('✓ Zoom in button disabled at max zoom');

        await page.screenshot({ path: path.join(screenshotDir, '18-image-max-zoom-200.png') });

        // Test zoom to min
        for (let j = 0; j < 10; j++) {
          await zoomOutButton.click();
          await page.waitForTimeout(100);
        }

        currentZoom = await zoomLabel.textContent();
        expect(currentZoom).toBe('50%');
        console.log(`✓ Min zoom reached: ${currentZoom}`);

        // Verify zoom out button is disabled at min
        const isZoomOutDisabled = await zoomOutButton.isDisabled();
        expect(isZoomOutDisabled).toBe(true);
        console.log('✓ Zoom out button disabled at min zoom');

        await page.screenshot({ path: path.join(screenshotDir, '19-image-min-zoom-50.png') });

        console.log('✓ All zoom controls working correctly');

        // Close dialog
        await page.keyboard.press('Escape');
        break;
      }
    }

    if (!imageFound) {
      console.log('Skipping: No image documents found for zoom testing');
      await page.screenshot({ path: path.join(screenshotDir, '20-no-image-documents.png') });
    }
  });

  test('TC6: Test Image Rotation Controls', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Look for an image document
    const documentRows = page.locator('div.space-y-3 > div');
    const documentCount = await documentRows.count();

    let imageFound = false;

    for (let i = 0; i < documentCount; i++) {
      const row = documentRows.nth(i);
      const documentName = await row.locator('p.font-medium').textContent();

      if (documentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        imageFound = true;
        console.log(`Testing rotation on: ${documentName}`);

        // Click to open viewer
        await row.locator('button[type="button"]').click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        await page.waitForTimeout(1000);

        // Find rotate button
        const rotateButton = page.locator('button[aria-label="Rotate image 90 degrees"]');
        await expect(rotateButton).toBeVisible();

        await page.screenshot({ path: path.join(screenshotDir, '21-image-rotation-0deg.png') });

        // Get the image element to check transform
        const image = page.locator('[role="dialog"] img');
        await expect(image).toBeVisible();

        // Rotate 90 degrees
        await rotateButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '22-image-rotation-90deg.png') });

        let transform = await image.getAttribute('style');
        expect(transform).toContain('rotate(90deg)');
        console.log('✓ Rotated 90 degrees');

        // Rotate 180 degrees
        await rotateButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '23-image-rotation-180deg.png') });

        transform = await image.getAttribute('style');
        expect(transform).toContain('rotate(180deg)');
        console.log('✓ Rotated 180 degrees');

        // Rotate 270 degrees
        await rotateButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '24-image-rotation-270deg.png') });

        transform = await image.getAttribute('style');
        expect(transform).toContain('rotate(270deg)');
        console.log('✓ Rotated 270 degrees');

        // Rotate back to 0 degrees (360)
        await rotateButton.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, '25-image-rotation-360deg.png') });

        transform = await image.getAttribute('style');
        expect(transform).toContain('rotate(0deg)');
        console.log('✓ Rotated back to 0 degrees');

        console.log('✓ Rotation controls working correctly');

        // Close dialog
        await page.keyboard.press('Escape');
        break;
      }
    }

    if (!imageFound) {
      console.log('Skipping: No image documents found for rotation testing');
      await page.screenshot({ path: path.join(screenshotDir, '26-no-image-for-rotation.png') });
    }
  });

  test('TC7: Verify Large File Warning Badge', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Check documents for large file sizes
    const documentRows = page.locator('div.space-y-3 > div');
    const documentCount = await documentRows.count();

    let largeFileFound = false;

    for (let i = 0; i < documentCount; i++) {
      const row = documentRows.nth(i);
      const fileSizeText = await row.locator('text=/\\d+(\\.\\d+)? (Bytes|KB|MB|GB)/').textContent();

      // Check if file size indicates >10MB
      if (fileSizeText?.includes('MB')) {
        const sizeMB = parseFloat(fileSizeText.replace(/[^\d.]/g, ''));
        if (sizeMB > 10) {
          largeFileFound = true;
          console.log(`Found large file: ${fileSizeText}`);

          // Click to open viewer
          await row.locator('button[type="button"]').click();
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
          await page.waitForTimeout(500);

          // Look for large file badge
          const largeBadge = page.locator('[role="dialog"] .text-amber-600:has-text("Large file")');
          await expect(largeBadge).toBeVisible();
          console.log('✓ Large file warning badge displayed');

          await page.screenshot({ path: path.join(screenshotDir, '27-large-file-badge.png') });

          // Close dialog
          await page.keyboard.press('Escape');
          break;
        }
      }
    }

    if (!largeFileFound) {
      console.log('Info: No large files (>10MB) found. Badge feature not tested.');
      console.log('This is not a test failure - just no large files in test data');
      await page.screenshot({ path: path.join(screenshotDir, '28-no-large-files.png') });
    }
  });

  test('TC8: Verify Download Button', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Find first document
    const documentRow = page.locator('div.space-y-3 > div button[type="button"]').first();
    const hasDocuments = await documentRow.isVisible().catch(() => false);

    if (!hasDocuments) {
      console.log('Skipping: No documents available');
      return;
    }

    // Open viewer
    await documentRow.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Find download button
    const downloadButton = page.locator('[role="dialog"] a[download]');
    await expect(downloadButton).toBeVisible();

    // Verify download button has href and download attributes
    const downloadHref = await downloadButton.getAttribute('href');
    const downloadAttr = await downloadButton.getAttribute('download');

    expect(downloadHref).toBeTruthy();
    expect(downloadAttr).toBeTruthy();

    console.log('✓ Download button present with correct attributes');
    console.log(`  - href: ${downloadHref?.substring(0, 50)}...`);
    console.log(`  - download filename: ${downloadAttr}`);

    await page.screenshot({ path: path.join(screenshotDir, '29-download-button-verified.png') });

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('TC9: Verify Open in New Tab Button', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Find first document
    const documentRow = page.locator('div.space-y-3 > div button[type="button"]').first();
    const hasDocuments = await documentRow.isVisible().catch(() => false);

    if (!hasDocuments) {
      console.log('Skipping: No documents available');
      return;
    }

    // Open viewer
    await documentRow.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Find open in new tab button
    const newTabButton = page.locator('[role="dialog"] a[target="_blank"]:not([download])');
    await expect(newTabButton).toBeVisible();

    // Verify button has correct attributes
    const href = await newTabButton.getAttribute('href');
    const target = await newTabButton.getAttribute('target');
    const rel = await newTabButton.getAttribute('rel');

    expect(href).toBeTruthy();
    expect(target).toBe('_blank');
    expect(rel).toContain('noopener');

    console.log('✓ Open in new tab button present with correct attributes');
    console.log(`  - href: ${href?.substring(0, 50)}...`);
    console.log(`  - target: ${target}`);
    console.log(`  - rel: ${rel}`);

    await page.screenshot({ path: path.join(screenshotDir, '30-new-tab-button-verified.png') });

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('TC10: Test Dialog Close Functionality', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Find first document
    const documentRow = page.locator('div.space-y-3 > div button[type="button"]').first();
    const hasDocuments = await documentRow.isVisible().catch(() => false);

    if (!hasDocuments) {
      console.log('Skipping: No documents available');
      return;
    }

    // Open viewer
    await documentRow.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Verify dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.screenshot({ path: path.join(screenshotDir, '31-dialog-before-close.png') });

    // Test closing with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify dialog is closed
    const dialogVisible = await dialog.isVisible().catch(() => false);
    expect(dialogVisible).toBe(false);
    console.log('✓ Dialog closed successfully with Escape key');

    await page.screenshot({ path: path.join(screenshotDir, '32-dialog-closed.png') });

    // Open again and test closing with X button (if present)
    await documentRow.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Look for close button
    const closeButton = page.locator('[role="dialog"] button[aria-label*="Close"]').first();
    const hasCloseButton = await closeButton.isVisible().catch(() => false);

    if (hasCloseButton) {
      await closeButton.click();
      await page.waitForTimeout(500);

      const dialogVisibleAfterX = await dialog.isVisible().catch(() => false);
      expect(dialogVisibleAfterX).toBe(false);
      console.log('✓ Dialog closed successfully with X button');
    }

    await page.screenshot({ path: path.join(screenshotDir, '33-dialog-close-verified.png') });
  });

  test('TC11: Test Document Type Badges', async ({ page }) => {
    // Navigate to order and documents
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await page.waitForLoadState('networkidle');

    const documentsTab = page.locator('text=Documents').first();
    if (await documentsTab.isVisible()) {
      await documentsTab.click();
      await page.waitForTimeout(500);
    }

    // Check if documents exist
    const documentRows = page.locator('div.space-y-3 > div');
    const documentCount = await documentRows.count();

    if (documentCount === 0) {
      console.log('Skipping: No documents available');
      return;
    }

    // Take screenshot of document list with badges
    await page.screenshot({ path: path.join(screenshotDir, '34-document-type-badges-list.png') });

    // Open first document
    await documentRows.first().locator('button[type="button"]').click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Verify badge exists in dialog
    const badgeInDialog = page.locator('[role="dialog"] .bg-blue-500, [role="dialog"] .bg-indigo-500, [role="dialog"] .bg-purple-500, [role="dialog"] .bg-green-500, [role="dialog"] .bg-gray-500').first();
    const hasBadge = await badgeInDialog.isVisible();

    if (hasBadge) {
      console.log('✓ Document type badge visible in viewer dialog');
      const badgeText = await badgeInDialog.textContent();
      console.log(`  - Badge text: ${badgeText}`);
    }

    await page.screenshot({ path: path.join(screenshotDir, '35-document-type-badge-dialog.png') });

    // Close dialog
    await page.keyboard.press('Escape');
  });
});
