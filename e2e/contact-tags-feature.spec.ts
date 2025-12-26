import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:9002';
const LOGIN_EMAIL = 'rod@myroihome.com';
const LOGIN_PASSWORD = 'Latter!974';

// Helper function to login
async function login(page: Page) {
  await page.goto(`${APP_URL}/login`);
  await page.fill('input[type="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*\/(dashboard|contacts|clients)/);
}

test.describe('Contact Tags Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Test 1: Navigate to contact detail page and verify Tags section', async ({ page }) => {
    // Navigate to contacts page
    await page.goto(`${APP_URL}/contacts`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/01-contacts-list.png', fullPage: true });

    // Find and click on the first contact card
    const firstContactCard = page.locator('.cursor-pointer').first();
    await expect(firstContactCard).toBeVisible({ timeout: 10000 });
    await firstContactCard.click();

    // Wait for contact detail page to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/02-contact-detail-page.png', fullPage: true });

    // Verify we're on a contact detail page (check for Contact Information card)
    const contactInfoCard = page.locator('text=Contact Information').first();
    await expect(contactInfoCard).toBeVisible();

    // Verify the Tags section exists within the Contact Information card
    const tagsSection = page.locator('p:has-text("Tags")').first();
    await expect(tagsSection).toBeVisible();

    // Verify Add Tag button exists
    const addTagButton = page.locator('button:has-text("Add Tag")');
    await expect(addTagButton).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/contact-tags/03-tags-section-visible.png', fullPage: true });
  });

  test('Test 2: Add existing tag to contact', async ({ page }) => {
    // Navigate to contacts page and open first contact
    await page.goto(`${APP_URL}/contacts`);
    await page.waitForLoadState('networkidle');

    const firstContactCard = page.locator('.cursor-pointer').first();
    await firstContactCard.click();
    await page.waitForLoadState('networkidle');

    // Click Add Tag button
    const addTagButton = page.locator('button:has-text("Add Tag")');
    await addTagButton.click();

    // Wait for popover to appear
    await page.waitForSelector('[role="dialog"], [cmdk-root]', { state: 'visible' });
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/04-add-tag-popover.png', fullPage: true });

    // Check if there are any existing tags in the list
    const tagItems = page.locator('[cmdk-item]').filter({ hasNotText: 'Create New Tag' });
    const tagCount = await tagItems.count();

    if (tagCount > 0) {
      // Click the first available tag
      const firstTag = tagItems.first();
      const tagName = await firstTag.textContent();
      await firstTag.click();

      // Wait for tag to be added
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/05-tag-added.png', fullPage: true });

      // Verify the tag appears in the contact's tags (just check if we can see any tag with that text)
      const addedTagText = page.getByText(tagName || '', { exact: false });
      await expect(addedTagText).toBeVisible({ timeout: 10000 });
    } else {
      console.log('No existing tags found, will create new tag in next test');
      // Close the popover
      await page.keyboard.press('Escape');
    }
  });

  test('Test 3: Create new tag and add to contact', async ({ page }) => {
    // Navigate to contacts page and open first contact
    await page.goto(`${APP_URL}/contacts`);
    await page.waitForLoadState('networkidle');

    const firstContactCard = page.locator('.cursor-pointer').first();
    await firstContactCard.click();
    await page.waitForLoadState('networkidle');

    // Click Add Tag button
    const addTagButton = page.locator('button:has-text("Add Tag")');
    await addTagButton.click();

    // Wait for popover
    await page.waitForSelector('[cmdk-root]', { state: 'visible' });
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/06-popover-for-create.png', fullPage: true });

    // Click "Create New Tag" option
    const createNewTagButton = page.locator('[cmdk-item]:has-text("Create New Tag")');
    await createNewTagButton.click();

    // Wait for create tag dialog to appear
    await page.waitForSelector('text=Create New Tag', { state: 'visible' });
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/07-create-tag-dialog.png', fullPage: true });

    // Generate a unique tag name with timestamp
    const timestamp = Date.now();
    const tagName = `Test Tag ${timestamp}`;

    // Fill in tag name
    const tagNameInput = page.locator('input#tag-name');
    await tagNameInput.fill(tagName);

    // Select a color (click the second color button - green)
    const colorButtons = page.locator('.rounded-full.border-2').filter({ hasText: '' });
    const secondColor = colorButtons.nth(1);
    await secondColor.click();

    await page.screenshot({ path: 'e2e/screenshots/contact-tags/08-tag-form-filled.png', fullPage: true });

    // Click Create Tag button
    const createButton = page.locator('button:has-text("Create Tag")');
    await createButton.click();

    // Wait for tag to be created and added
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/09-new-tag-created.png', fullPage: true });

    // Verify the tag appears in the contact's tags
    const newTag = page.locator(`text=${tagName}`).first();
    await expect(newTag).toBeVisible();
  });

  test('Test 4: Remove tag from contact', async ({ page }) => {
    // Navigate to contacts page and open first contact
    await page.goto(`${APP_URL}/contacts`);
    await page.waitForLoadState('networkidle');

    const firstContactCard = page.locator('.cursor-pointer').first();
    await firstContactCard.click();
    await page.waitForLoadState('networkidle');

    // Check if there are any tags on the contact
    const tagBadges = page.locator('div[class*="badge"]').filter({ has: page.locator('button') });
    const tagCount = await tagBadges.count();

    if (tagCount > 0) {
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/10-before-remove-tag.png', fullPage: true });

      // Get the text of the first tag before removing
      const firstTag = tagBadges.first();
      const tagText = await firstTag.textContent();

      // Click the X button on the first tag
      const removeButton = firstTag.locator('button').first();
      await removeButton.click();

      // Wait for tag to be removed
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/11-after-remove-tag.png', fullPage: true });

      // Verify the tag count decreased (better than checking visibility which can be flaky)
      const newTagBadges = page.locator('div[class*="badge"]').filter({ has: page.locator('button') });
      const newTagCount = await newTagBadges.count();
      expect(newTagCount).toBe(tagCount - 1);
    } else {
      console.log('No tags to remove, adding one first');

      // Add a tag first
      const addTagButton = page.locator('button:has-text("Add Tag")');
      await addTagButton.click();
      await page.waitForTimeout(500);

      // Click create new tag
      const createNewTagButton = page.locator('[cmdk-item]:has-text("Create New Tag")');
      await createNewTagButton.click();
      await page.waitForTimeout(500);

      const tagName = `RemoveTest ${Date.now()}`;
      await page.locator('input#tag-name').fill(tagName);
      await page.locator('button:has-text("Create Tag")').click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'e2e/screenshots/contact-tags/10-tag-added-for-removal.png', fullPage: true });

      // Now remove it
      const newTag = page.locator(`text=${tagName}`).first().locator('..');
      const removeBtn = newTag.locator('button').first();
      await removeBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'e2e/screenshots/contact-tags/11-tag-removed.png', fullPage: true });

      // Verify removal by checking tag count is back to 0 or less
      const finalTagBadges = page.locator('div[class*="badge"]').filter({ has: page.locator('button') });
      const finalTagCount = await finalTagBadges.count();
      expect(finalTagCount).toBeLessThan(1);
    }
  });

  test('Test 5: Verify client tags still work', async ({ page }) => {
    // Navigate to clients page
    await page.goto(`${APP_URL}/clients`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/12-clients-list.png', fullPage: true });

    // Find and click on the first client card (look for cards in the grid)
    const firstClientCard = page.locator('.grid > div').first();
    await expect(firstClientCard).toBeVisible({ timeout: 10000 });
    await firstClientCard.click();

    // Wait for client detail page to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/13-client-detail-page.png', fullPage: true });

    // Verify Tags section exists
    const tagsSection = page.locator('text=Tags').first();
    await expect(tagsSection).toBeVisible();

    // Verify Add Tag button exists
    const addTagButton = page.locator('button:has-text("Add Tag")');
    await expect(addTagButton).toBeVisible();

    // Try adding a tag
    await addTagButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/contact-tags/14-client-add-tag-popover.png', fullPage: true });

    // Check if there are existing tags to add
    const tagItems = page.locator('[cmdk-item]').filter({ hasNotText: 'Create New Tag' });
    const tagCount = await tagItems.count();

    if (tagCount > 0) {
      // Add an existing tag
      const firstTag = tagItems.first();
      await firstTag.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/15-client-tag-added.png', fullPage: true });
    } else {
      // Create a new tag for the client
      const createNewTagButton = page.locator('[cmdk-item]:has-text("Create New Tag")');
      await createNewTagButton.click();
      await page.waitForTimeout(500);

      const tagName = `Client Test ${Date.now()}`;
      await page.locator('input#tag-name').fill(tagName);
      await page.locator('button:has-text("Create Tag")').click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/15-client-tag-created.png', fullPage: true });
    }

    // Test removing a tag from client
    const clientTagBadges = page.locator('div[class*="badge"]').filter({ has: page.locator('button') });
    const clientTagCount = await clientTagBadges.count();

    if (clientTagCount > 0) {
      const firstClientTag = clientTagBadges.first();
      const removeButton = firstClientTag.locator('button').first();
      await removeButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/contact-tags/16-client-tag-removed.png', fullPage: true });
    }
  });

  test('Test 6: Search for tags in popover', async ({ page }) => {
    // Navigate to contacts page and open first contact
    await page.goto(`${APP_URL}/contacts`);
    await page.waitForLoadState('networkidle');

    const firstContactCard = page.locator('.cursor-pointer').first();
    await firstContactCard.click();
    await page.waitForLoadState('networkidle');

    // Click Add Tag button
    const addTagButton = page.locator('button:has-text("Add Tag")');
    await addTagButton.click();

    // Wait for popover
    await page.waitForSelector('[cmdk-root]', { state: 'visible' });

    // Type in search box
    const searchInput = page.locator('[cmdk-input]');
    await searchInput.fill('Test');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/contact-tags/17-tag-search.png', fullPage: true });

    // Close popover
    await page.keyboard.press('Escape');
  });
});
