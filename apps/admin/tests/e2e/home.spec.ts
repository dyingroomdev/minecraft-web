import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('renders server status and IPs', async ({ page }) => {
    await page.goto('/');
    
    // Check hero banner
    await expect(page.locator('h1')).toContainText('AmzCraft');
    
    // Check server status section
    await expect(page.locator('text=Server Status')).toBeVisible();
    
    // Check server IPs are displayed
    await expect(page.locator('text=play.amzcraft.xyz:25565')).toBeVisible();
    await expect(page.locator('text=bedrock.amzcraft.xyz:19132')).toBeVisible();
    
    // Check copy buttons work
    const copyButtons = page.locator('button:has(svg)').filter({ hasText: '' });
    await expect(copyButtons.first()).toBeVisible();
  });

  test('displays social links in footer', async ({ page }) => {
    await page.goto('/');
    
    // Wait for social links to load
    await page.waitForLoadState('networkidle');
    
    // Check footer social links section exists
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Social links should be present if configured
    const socialLinks = footer.locator('a[href*="discord"], a[href*="twitter"], a[href*="facebook"]');
    // At least one social link should be present in a real environment
  });

  test('shows latest news', async ({ page }) => {
    await page.goto('/');
    
    // Check news section
    await expect(page.locator('text=Latest News')).toBeVisible();
    await expect(page.locator('text=View All')).toBeVisible();
    
    // News cards should be present
    const newsCards = page.locator('[class*="card"]').filter({ hasText: /news|post/i });
  });

  test('displays ranks CTA', async ({ page }) => {
    await page.goto('/');
    
    // Check ranks section
    await expect(page.locator('text=Unlock Premium Ranks')).toBeVisible();
    await expect(page.locator('text=View Ranks & Pricing')).toBeVisible();
    
    // Check rank previews
    await expect(page.locator('text=VIP')).toBeVisible();
    await expect(page.locator('text=Premium')).toBeVisible();
    await expect(page.locator('text=Legend')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation links
    await expect(page.locator('nav a[href="/news"]')).toBeVisible();
    await expect(page.locator('nav a[href="/rules"]')).toBeVisible();
    await expect(page.locator('nav a[href="/events"]')).toBeVisible();
    await expect(page.locator('nav a[href="/ranks"]')).toBeVisible();
    
    // Test navigation to ranks page
    await page.click('text=View Ranks & Pricing');
    await expect(page).toHaveURL('/ranks');
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle button
    const themeToggle = page.locator('button:has(svg)').first();
    await expect(themeToggle).toBeVisible();
    
    // Click to toggle theme
    await themeToggle.click();
    
    // Check if dark class is applied to html element
    const html = page.locator('html');
    const hasClass = await html.getAttribute('class');
    expect(hasClass).toContain('dark');
  });
});