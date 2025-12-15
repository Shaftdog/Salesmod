import { test, expect } from '@playwright/test'

test('Check Admin Panel visibility for super_admin user', async ({ page }) => {
  // Go to login page
  await page.goto('https://salesmod.vercel.app/login')
  await page.waitForLoadState('networkidle')

  // Take screenshot of login page
  await page.screenshot({ path: 'tests/screenshots/admin-check-01-login.png' })

  // Fill login form
  await page.fill('input[type="email"]', 'rod@myroihome.com')
  await page.fill('input[type="password"]', 'Latter!974')

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  // Take screenshot of dashboard
  await page.screenshot({ path: 'tests/screenshots/admin-check-02-dashboard.png' })

  // Check sidebar for Admin Panel link
  const sidebar = page.locator('aside, nav, [data-testid="sidebar"]').first()
  await page.screenshot({ path: 'tests/screenshots/admin-check-03-sidebar.png', fullPage: true })

  // Look for Admin Panel link
  const adminLink = page.locator('a:has-text("Admin Panel"), a:has-text("Admin"), [href*="/admin"]').first()
  const adminLinkVisible = await adminLink.isVisible().catch(() => false)

  console.log('Admin Panel link visible:', adminLinkVisible)

  // Check for Role Management link (super_admin only)
  const roleLink = page.locator('a:has-text("Role"), a:has-text("Roles"), [href*="/roles"]').first()
  const roleLinkVisible = await roleLink.isVisible().catch(() => false)

  console.log('Role Management link visible:', roleLinkVisible)

  // Get all navigation links for debugging
  const navLinks = await page.locator('aside a, nav a').allTextContents()
  console.log('All nav links:', navLinks)

  // Take final screenshot
  await page.screenshot({ path: 'tests/screenshots/admin-check-04-final.png', fullPage: true })

  // Navigate directly to /admin to see what happens
  await page.goto('https://salesmod.vercel.app/admin')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/screenshots/admin-check-05-admin-page.png', fullPage: true })

  const currentUrl = page.url()
  console.log('After navigating to /admin, current URL:', currentUrl)

  // Check page content
  const pageContent = await page.textContent('body')
  if (currentUrl.includes('unauthorized')) {
    console.log('ISSUE: Redirected to unauthorized page!')
  } else if (currentUrl.includes('admin')) {
    console.log('SUCCESS: Admin page loaded!')
  }
})
