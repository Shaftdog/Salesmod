import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'template-input-debug');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Template Name Input Field Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the templates page
    await page.goto('http://localhost:9002/production/templates');
    await page.waitForLoadState('networkidle');
  });

  test('Investigate Template Name input field keyboard input issue', async ({ page }) => {
    // Step 1: Take screenshot of initial page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-initial-page.png'),
      fullPage: true
    });
    console.log('Screenshot 1: Initial page');

    // Step 2: Find and click the "New Template" button
    const newTemplateButton = page.getByRole('button', { name: /new template/i });
    await expect(newTemplateButton).toBeVisible({ timeout: 10000 });
    await newTemplateButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-dialog-opened.png'),
      fullPage: true
    });
    console.log('Screenshot 2: Dialog opened');

    // Step 3: Find the Template Name input field
    const templateNameInput = page.locator('input[name="name"]').or(
      page.locator('input[placeholder*="name" i]')
    ).first();

    // Check if input is visible
    const isVisible = await templateNameInput.isVisible();
    console.log('Template Name input visible:', isVisible);

    // Check if input is enabled
    const isEnabled = await templateNameInput.isEnabled();
    console.log('Template Name input enabled:', isEnabled);

    // Check if input is editable
    const isEditable = await templateNameInput.isEditable();
    console.log('Template Name input editable:', isEditable);

    // Get input attributes
    const inputAttributes = await templateNameInput.evaluate((el) => ({
      type: el.getAttribute('type'),
      disabled: el.hasAttribute('disabled'),
      readOnly: el.hasAttribute('readonly'),
      tabIndex: el.getAttribute('tabindex'),
      className: el.className,
      id: el.id,
      name: el.getAttribute('name'),
    }));
    console.log('Input attributes:', JSON.stringify(inputAttributes, null, 2));

    // Step 4: Click on the input to focus it
    await templateNameInput.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-input-clicked.png'),
      fullPage: true
    });
    console.log('Screenshot 3: Input clicked');

    // Check if input has focus
    const hasFocus = await templateNameInput.evaluate((el) => el === document.activeElement);
    console.log('Input has focus after click:', hasFocus);

    // Get the actual active element
    const activeElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName,
        id: active?.id,
        className: active?.className,
        name: active?.getAttribute('name'),
        type: active?.getAttribute('type'),
      };
    });
    console.log('Active element:', JSON.stringify(activeElement, null, 2));

    // Step 5: Try typing in the input
    console.log('Attempting to type "Test Template"...');
    await templateNameInput.fill('');
    await templateNameInput.type('Test Template', { delay: 100 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-after-typing.png'),
      fullPage: true
    });
    console.log('Screenshot 4: After typing attempt');

    // Check the value after typing
    const valueAfterTyping = await templateNameInput.inputValue();
    console.log('Value after typing:', valueAfterTyping);

    // Step 6: Check for overlaying elements
    const overlayingElements = await page.evaluate(() => {
      const input = document.querySelector('input[name="name"]') as HTMLElement;
      if (!input) return { error: 'Input not found' };

      const rect = input.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const elementAtPoint = document.elementFromPoint(centerX, centerY);

      return {
        inputRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        elementAtCenter: {
          tagName: elementAtPoint?.tagName,
          className: elementAtPoint?.className,
          id: elementAtPoint?.id,
          isInput: elementAtPoint === input,
        },
        zIndex: window.getComputedStyle(input).zIndex,
        position: window.getComputedStyle(input).position,
        pointerEvents: window.getComputedStyle(input).pointerEvents,
      };
    });
    console.log('Overlay check:', JSON.stringify(overlayingElements, null, 2));

    // Step 7: Check DOM structure around the input
    const domStructure = await page.evaluate(() => {
      const input = document.querySelector('input[name="name"]') as HTMLElement;
      if (!input) return { error: 'Input not found' };

      const getElementInfo = (el: Element | null) => {
        if (!el) return null;
        return {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          attributes: Array.from(el.attributes).map(attr => ({
            name: attr.name,
            value: attr.value,
          })),
        };
      };

      return {
        input: getElementInfo(input),
        parent: getElementInfo(input.parentElement),
        grandparent: getElementInfo(input.parentElement?.parentElement),
        siblings: Array.from(input.parentElement?.children || []).map(getElementInfo),
      };
    });
    console.log('DOM structure:', JSON.stringify(domStructure, null, 2));

    // Step 8: Check for console errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Step 9: Try other form fields
    console.log('Testing Description field...');
    const descriptionInput = page.locator('textarea[name="description"]').or(
      page.locator('textarea[placeholder*="description" i]')
    ).first();

    if (await descriptionInput.isVisible()) {
      await descriptionInput.click();
      await descriptionInput.fill('Test Description');
      const descValue = await descriptionInput.inputValue();
      console.log('Description field value:', descValue);
      console.log('Description field works:', descValue === 'Test Description');
    } else {
      console.log('Description field not found');
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-description-test.png'),
      fullPage: true
    });
    console.log('Screenshot 5: Description field test');

    // Step 10: Check for nested dialogs
    const dialogInfo = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      return {
        dialogCount: dialogs.length,
        dialogs: Array.from(dialogs).map(dialog => ({
          className: dialog.className,
          id: dialog.id,
          visible: window.getComputedStyle(dialog).display !== 'none',
          zIndex: window.getComputedStyle(dialog).zIndex,
        })),
      };
    });
    console.log('Dialog info:', JSON.stringify(dialogInfo, null, 2));

    // Step 11: Check for form element nesting issues
    const formNesting = await page.evaluate(() => {
      const input = document.querySelector('input[name="name"]') as HTMLElement;
      if (!input) return { error: 'Input not found' };

      const forms: any[] = [];
      let element: HTMLElement | null = input;

      while (element) {
        if (element.tagName === 'FORM') {
          forms.push({
            id: element.id,
            className: element.className,
            action: element.getAttribute('action'),
          });
        }
        element = element.parentElement;
      }

      return {
        formsFound: forms.length,
        forms,
      };
    });
    console.log('Form nesting:', JSON.stringify(formNesting, null, 2));

    // Step 12: Try using keyboard events directly
    console.log('Trying direct keyboard events...');
    await templateNameInput.focus();
    await page.keyboard.type('Direct Keyboard Test');
    await page.waitForTimeout(500);

    const valueAfterKeyboard = await templateNameInput.inputValue();
    console.log('Value after direct keyboard events:', valueAfterKeyboard);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-keyboard-events.png'),
      fullPage: true
    });
    console.log('Screenshot 6: After keyboard events');

    // Final summary
    console.log('\n=== INVESTIGATION SUMMARY ===');
    console.log('Input visible:', isVisible);
    console.log('Input enabled:', isEnabled);
    console.log('Input editable:', isEditable);
    console.log('Input has focus:', hasFocus);
    console.log('Value after .type():', valueAfterTyping);
    console.log('Value after keyboard events:', valueAfterKeyboard);
    console.log('Console messages:', consoleMessages);
    console.log('Screenshots saved to:', SCREENSHOT_DIR);
  });
});
