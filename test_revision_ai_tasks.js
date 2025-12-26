const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Set up console listener
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('Step 1: Navigate to login page...');
    await page.goto('http://localhost:9002/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/screenshots/01-login-page.png' });

    console.log('Step 2: Login with credentials...');
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.screenshot({ path: '/tmp/screenshots/02-credentials-entered.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/screenshots/03-logged-in.png' });

    console.log('Step 3: Navigate to Cases page...');
    await page.goto('http://localhost:9002/cases');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/screenshots/04-cases-page.png' });

    console.log('Step 4: Wait for cases to load...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/screenshots/05-cases-loaded.png' });

    console.log('Step 5: Click Create Revision button...');
    const createRevisionButton = page.locator('button:has-text("Create Revision")').first();
    await createRevisionButton.click();
    console.log('Clicked Create Revision button');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/screenshots/06-revision-dialog-opened.png' });

    console.log('Step 6: Enter revision description...');
    const description = "The comparable at 123 Main Street has incorrect square footage. Also, the subject property's lot size is wrong. Additionally, the market conditions adjustment needs to be updated.";
    
    const descriptionField = page.locator('textarea[name="description"], textarea').first();
    await descriptionField.fill(description);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/screenshots/07-description-entered.png' });

    console.log('Step 7: Click Generate Tasks with AI button (in the dialog)...');
    // Use a more specific selector that targets the button within the dialog
    const dialogGenerateButton = page.locator('div[role="dialog"] button:has-text("Generate Tasks with AI"), button:has-text("Generate Tasks with AI"):near(textarea)').first();
    
    const buttonCount = await dialogGenerateButton.count();
    console.log(`Found ${buttonCount} Generate Tasks button(s)`);
    
    if (buttonCount === 0) {
      console.log('ERROR: Generate Tasks with AI button not found in dialog');
      await page.screenshot({ path: '/tmp/screenshots/08-no-generate-button.png' });
      
      const allButtons = await page.locator('button').allTextContents();
      console.log('Available buttons:', allButtons);
      
      throw new Error('Generate Tasks with AI button not found');
    }
    
    // Force click to avoid interception issues
    await dialogGenerateButton.click({ force: true });
    console.log('Clicked Generate Tasks with AI button');
    await page.waitForTimeout(6000); // Wait for AI to generate tasks
    await page.screenshot({ path: '/tmp/screenshots/08-ai-generating.png' });

    console.log('Step 8: Wait for AI task generation to complete...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/screenshots/09-ai-tasks-generated.png' });

    console.log('Step 9: Verify AI generated tasks...');
    const pageContent = await page.textContent('body');
    const hasSquareFootage = pageContent.toLowerCase().includes('square footage');
    const hasLotSize = pageContent.toLowerCase().includes('lot size');
    const hasMarketConditions = pageContent.toLowerCase().includes('market conditions') || pageContent.toLowerCase().includes('market adjustment');
    
    console.log(`Task detection: Square Footage=${hasSquareFootage}, Lot Size=${hasLotSize}, Market Conditions=${hasMarketConditions}`);
    
    // Count checkboxes which might represent tasks
    const taskCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await taskCheckboxes.count();
    console.log(`Found ${checkboxCount} checkboxes (potential tasks)`);

    console.log('Step 10: Submit the revision...');
    const submitButton = page.locator('button:has-text("Create Revision"):not(:has-text("Request"))').last();
    
    if (await submitButton.count() === 0) {
      console.log('ERROR: Submit button not found, trying alternative selectors...');
      const altSubmit = page.locator('div[role="dialog"] button[type="submit"], div[role="dialog"] button:has-text("Submit")').last();
      if (await altSubmit.count() > 0) {
        await altSubmit.click();
      } else {
        const allButtons = await page.locator('div[role="dialog"] button').allTextContents();
        console.log('Available dialog buttons:', allButtons);
        await page.screenshot({ path: '/tmp/screenshots/10-no-submit-button.png' });
        throw new Error('Submit button not found');
      }
    } else {
      await submitButton.click();
    }
    
    console.log('Clicked Submit button');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/screenshots/10-revision-submitted.png' });

    console.log('Step 11: Check for success or error messages...');
    const bodyText = await page.textContent('body');
    const hasError = bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('failed');
    const hasSuccess = bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('created');
    console.log(`Success: ${hasSuccess}, Error: ${hasError}`);
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/screenshots/11-after-submission.png' });

    console.log('Step 12: Navigate to Production Board...');
    await page.goto('http://localhost:9002/production/board');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/screenshots/12-production-board.png' });

    console.log('Step 13: Looking for REVISION column and card...');
    // Scroll to find REVISION column if needed
    await page.evaluate(() => {
      const revisionText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.includes('REVISION') || el.textContent.includes('Revision')
      );
      if (revisionText) {
        revisionText.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({ path: '/tmp/screenshots/13-production-board-full.png', fullPage: true });
    
    // Look for the REVISION column header
    const revisionHeader = page.locator('text=REVISION, text=/revision/i').first();
    if (await revisionHeader.count() > 0) {
      console.log('Found REVISION column header');
      await revisionHeader.screenshot({ path: '/tmp/screenshots/14-revision-column-header.png' });
    }
    
    // Look for cards - try multiple selectors
    const cards = page.locator('[data-card], .production-card, div:has-text("APR-2025-1001")');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} cards on production board`);
    
    if (cardCount > 0) {
      // Click the first card to see tasks
      await cards.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/screenshots/15-card-clicked.png' });
      
      // Check for tasks in the card details
      const cardContent = await page.textContent('body');
      console.log('Checking for tasks in card...');
      console.log('Has square footage task:', cardContent.toLowerCase().includes('square footage'));
      console.log('Has lot size task:', cardContent.toLowerCase().includes('lot size'));
      console.log('Has market conditions task:', cardContent.toLowerCase().includes('market conditions') || cardContent.toLowerCase().includes('market adjustment'));
    } else {
      console.log('WARNING: No cards found on production board');
    }

    console.log('\n=== TEST COMPLETED ===\n');
    console.log('Screenshots saved to /tmp/screenshots/');
    
    // Keep browser open for inspection
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: '/tmp/screenshots/error.png' });
  } finally {
    await browser.close();
  }
})();
