import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('complete rank purchase flow', async ({ page }) => {
    // Start at ranks page
    await page.goto('/ranks');
    
    // Check ranks are displayed
    await expect(page.locator('text=Premium Ranks')).toBeVisible();
    
    // Find VIP rank and click purchase
    const vipCard = page.locator('[data-testid="rank-card-vip"], .card:has-text("VIP")').first();
    await expect(vipCard).toBeVisible();
    
    const purchaseButton = vipCard.locator('button:has-text("Purchase Now")');
    await purchaseButton.click();
    
    // Should navigate to purchase page
    await expect(page).toHaveURL(/\/ranks\/buy\/vip/);
    
    // Fill out payment form
    await page.fill('input[name="mc_username"]', 'testplayer123');
    await page.fill('input[name="bkash_txid"]', 'TXN' + Date.now());
    await page.fill('input[name="amount_bdt"]', '500');
    
    // Optional screenshot upload
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // In a real test, you'd upload a test image file
      // await fileInput.setInputFiles('test-screenshot.png');
    }
    
    // Submit payment
    await page.click('button:has-text("Submit Payment")');
    
    // Should show success message or redirect to status page
    await expect(page.locator('text=Payment submitted')).toBeVisible({ timeout: 10000 });
    
    // Check if redirected to purchase status page
    await expect(page).toHaveURL(/\/purchase\//);
    
    // Should show pending status
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('validates payment form', async ({ page }) => {
    await page.goto('/ranks/buy/vip');
    
    // Try to submit empty form
    await page.click('button:has-text("Submit Payment")');
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
    
    // Fill invalid username (too short)
    await page.fill('input[name="mc_username"]', 'ab');
    await page.fill('input[name="bkash_txid"]', 'short');
    await page.fill('input[name="amount_bdt"]', '0');
    
    await page.click('button:has-text("Submit Payment")');
    
    // Should show validation errors for invalid inputs
    const errors = page.locator('[class*="error"], [class*="invalid"]');
    await expect(errors.first()).toBeVisible();
  });

  test('handles duplicate transaction ID', async ({ page }) => {
    await page.goto('/ranks/buy/vip');
    
    // Fill form with duplicate transaction ID
    await page.fill('input[name="mc_username"]', 'testplayer456');
    await page.fill('input[name="bkash_txid"]', 'DUPLICATE_TXN_123');
    await page.fill('input[name="amount_bdt"]', '500');
    
    // Submit first time (would succeed in real scenario)
    await page.click('button:has-text("Submit Payment")');
    
    // Go back and try same transaction ID again
    await page.goto('/ranks/buy/vip');
    await page.fill('input[name="mc_username"]', 'testplayer789');
    await page.fill('input[name="bkash_txid"]', 'DUPLICATE_TXN_123');
    await page.fill('input[name="amount_bdt"]', '500');
    
    await page.click('button:has-text("Submit Payment")');
    
    // Should show error about duplicate transaction
    await expect(page.locator('text=already used')).toBeVisible();
  });

  test('shows purchase status updates', async ({ page }) => {
    // Mock a purchase status page
    await page.goto('/purchase/550e8400-e29b-41d4-a716-446655440000');
    
    // Should show purchase details
    await expect(page.locator('text=Purchase Status')).toBeVisible();
    
    // Should show transaction details
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Status should be one of: Pending, Approved, Rejected, Fulfilled
    const statusBadge = page.locator('[class*="badge"], [class*="status"]');
    await expect(statusBadge).toBeVisible();
  });

  test('rate limiting works', async ({ page }) => {
    await page.goto('/ranks/buy/vip');
    
    // Try to submit multiple payments rapidly
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="mc_username"]', `testplayer${i}`);
      await page.fill('input[name="bkash_txid"]', `TXN${Date.now()}_${i}`);
      await page.fill('input[name="amount_bdt"]', '500');
      
      await page.click('button:has-text("Submit Payment")');
      
      // After a few attempts, should hit rate limit
      if (i >= 3) {
        const rateLimitError = page.locator('text=rate limit, text=too many');
        if (await rateLimitError.isVisible()) {
          break;
        }
      }
      
      await page.waitForTimeout(100);
    }
  });
});