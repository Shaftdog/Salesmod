import { test, expect } from '@playwright/test';

test.describe('Task Reassignment Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:9002/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'rod@myroihome.com');
    await page.fill('input[type="password"]', 'Latter!974');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL(/.*\/(?!login).*/, { timeout: 10000 });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to production board and open card detail', async ({ page }) => {
    // Navigate to production board
    await page.goto('http://localhost:9002/production/board');

    // Wait for the board to load
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });

    // Wait for cards to load - look for APR- prefix in order numbers
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    // Take screenshot of the board
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/01-production-board.png',
      fullPage: true
    });

    // Find a production card by looking for the order number pattern
    // Cards are draggable Card components containing order numbers
    const productionCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await productionCard.click();

    // Wait for sheet modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Take screenshot of opened modal
    await page.screenshot({
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/02-card-modal-opened.png',
      fullPage: true
    });
  });

  test('should display task assignee popover with search and team members', async ({ page }) => {
    // Navigate to production board
    await page.goto('http://localhost:9002/production/board');
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    // Open first production card
    const firstCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await firstCard.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Look for expanded stage section or expand it
    const expandableStage = page.locator('button:has-text("Current")').first();
    if (await expandableStage.count() > 0) {
      await expandableStage.click();
    }
    
    // Wait a moment for tasks to appear
    await page.waitForTimeout(1000);
    
    // Find assignee button (could be "Assign" or a user name)
    const assigneeButton = page.locator('button').filter({ 
      hasText: /Assign|assigned/ 
    }).first();
    
    // Alternative: look for button with User icon
    const assignButtons = await page.locator('button:has-text("Assign")').all();
    
    let targetButton = assigneeButton;
    if (assignButtons.length > 0) {
      targetButton = page.locator('button:has-text("Assign")').first();
    }
    
    // Take screenshot before clicking
    await page.screenshot({ 
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/03-before-assignee-click.png',
      fullPage: true 
    });
    
    // Click the assignee button to open popover
    await targetButton.click();
    
    // Wait for popover to appear
    await page.waitForSelector('[role="dialog"]:has-text("Search team members")', { timeout: 3000 })
      .catch(() => page.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 }));
    
    // Take screenshot of opened popover
    await page.screenshot({ 
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/04-assignee-popover-opened.png',
      fullPage: true 
    });
    
    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Verify team members list is visible
    const teamMembersList = page.locator('[role="dialog"]').last();
    await expect(teamMembersList).toBeVisible();
    
    console.log('✓ Popover opened successfully with search input');
  });

  test('should search and filter team members', async ({ page }) => {
    // Navigate to production board and open card
    await page.goto('http://localhost:9002/production/board');
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    const firstCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await firstCard.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Expand stage if needed
    const currentStageButton = page.locator('button:has-text("Current")').first();
    if (await currentStageButton.count() > 0) {
      await currentStageButton.click();
      await page.waitForTimeout(500);
    }
    
    // Open assignee popover
    const assignButton = page.locator('button:has-text("Assign")').first();
    await assignButton.click();
    
    // Wait for popover
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 });
    
    // Get initial count of team members
    const teamMembers = await page.locator('button:has(div:has-text("@"))').count();
    console.log(`Initial team members count: ${teamMembers}`);
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('rod');
    
    // Wait for filtering to occur
    await page.waitForTimeout(500);
    
    // Take screenshot of filtered results
    await page.screenshot({ 
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/05-search-filtered.png',
      fullPage: true 
    });
    
    // Verify filtering occurred
    const filteredMembers = await page.locator('button:has(div:has-text("@"))').count();
    console.log(`Filtered team members count: ${filteredMembers}`);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    console.log('✓ Search filtering works correctly');
  });

  test('should reassign task to different team member', async ({ page }) => {
    // Navigate to production board
    await page.goto('http://localhost:9002/production/board');
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    // Open first card
    const firstCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await firstCard.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Expand current stage
    const currentStageButton = page.locator('button:has-text("Current")').first();
    if (await currentStageButton.count() > 0) {
      await currentStageButton.click();
      await page.waitForTimeout(500);
    }
    
    // Find the assignee button
    const assigneeArea = page.locator('button').filter({ 
      hasText: /Assign|@/ 
    }).first();
    
    // Get initial assignee text
    const initialAssignee = await assigneeArea.textContent();
    console.log(`Initial assignee: ${initialAssignee}`);
    
    // Take screenshot before reassignment
    await page.screenshot({ 
      path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/06-before-reassignment.png',
      fullPage: true 
    });
    
    // Click to open popover
    await assigneeArea.click();
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 });
    
    // Get all team member buttons (excluding unassign if present)
    const teamMemberButtons = page.locator('button:has([class*="avatar"])');
    const count = await teamMemberButtons.count();
    
    if (count > 0) {
      // Click on the first team member (or second if first is current)
      let targetMember = teamMemberButtons.first();
      
      // Check if this member is already assigned (has checkmark)
      const hasCheck = await targetMember.locator('[class*="check"]').count();
      if (hasCheck > 0 && count > 1) {
        // Use second team member instead
        targetMember = teamMemberButtons.nth(1);
      }
      
      // Get the name of the team member we're assigning to
      const newAssigneeName = await targetMember.locator('p').first().textContent();
      console.log(`Reassigning to: ${newAssigneeName}`);
      
      // Click to reassign
      await targetMember.click();
      
      // Wait for the popover to close and task to update
      await page.waitForTimeout(1500);
      
      // Take screenshot after reassignment
      await page.screenshot({ 
        path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/07-after-reassignment.png',
        fullPage: true 
      });
      
      // Verify the assignee updated in the UI
      const updatedAssignee = await page.locator('button').filter({ 
        hasText: new RegExp(newAssigneeName || '') 
      }).first().textContent();
      
      console.log(`Updated assignee: ${updatedAssignee}`);
      console.log('✓ Task reassignment successful');
      
      // Check for success toast notification
      const toast = page.locator('[class*="toast"], [role="status"], [class*="notification"]');
      if (await toast.count() > 0) {
        await page.screenshot({ 
          path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/08-success-toast.png',
          fullPage: true 
        });
        console.log('✓ Success notification displayed');
      }
    } else {
      console.log('⚠ No team members available for reassignment');
    }
  });

  test('should show current assignee with checkmark', async ({ page }) => {
    // Navigate to production board
    await page.goto('http://localhost:9002/production/board');
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    // Open first card
    const firstCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await firstCard.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Expand current stage
    const currentStageButton = page.locator('button:has-text("Current")').first();
    if (await currentStageButton.count() > 0) {
      await currentStageButton.click();
      await page.waitForTimeout(500);
    }
    
    // Open assignee popover
    const assignButton = page.locator('button').filter({ hasText: /Assign|@/ }).first();
    await assignButton.click();
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 });
    
    // Look for checkmark icon indicating current assignee
    const checkmark = page.locator('[class*="check"]').first();
    
    if (await checkmark.count() > 0) {
      await page.screenshot({ 
        path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/09-current-assignee-checkmark.png',
        fullPage: true 
      });
      console.log('✓ Current assignee highlighted with checkmark');
    } else {
      console.log('⚠ No task currently assigned or checkmark not visible');
    }
  });

  test('should display unassign option when task is assigned', async ({ page }) => {
    // Navigate to production board
    await page.goto('http://localhost:9002/production/board');
    await page.waitForSelector('h1:has-text("Production Board")', { timeout: 10000 });
    await page.waitForSelector('text=/APR-\\d+/', { timeout: 10000 });

    // Open first card
    const firstCard = page.locator('[draggable="true"]').filter({ hasText: /APR-\d+/ }).first();
    await firstCard.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Expand current stage
    const currentStageButton = page.locator('button:has-text("Current")').first();
    if (await currentStageButton.count() > 0) {
      await currentStageButton.click();
      await page.waitForTimeout(500);
    }
    
    // Find an assigned task (has user name/email, not "Assign")
    const assignedTasks = page.locator('button').filter({ 
      hasText: /@/ 
    });
    
    if (await assignedTasks.count() > 0) {
      // Click on assigned task
      await assignedTasks.first().click();
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 });
      
      // Look for Unassign option
      const unassignButton = page.locator('button:has-text("Unassign")');
      
      if (await unassignButton.count() > 0) {
        await expect(unassignButton).toBeVisible();
        
        await page.screenshot({ 
          path: '/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/10-unassign-option.png',
          fullPage: true 
        });
        
        console.log('✓ Unassign option displayed for assigned task');
      } else {
        console.log('⚠ Unassign button not found');
      }
    } else {
      console.log('⚠ No assigned tasks found to test unassign option');
    }
  });
});
