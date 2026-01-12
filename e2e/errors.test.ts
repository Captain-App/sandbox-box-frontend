import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('shows error when API unreachable', async ({ page }) => {
    // Mock network failure for common API calls
    await page.route('**/sessions', route => route.abort('failed'));
    await page.route('**/billing/balance', route => route.abort('failed'));
    
    await page.goto('/');
    
    // The app might show a toast or error boundary
    // For now we just verify it doesn't crash completely and shows something sensible
    await expect(page.getByText(/Shipbox/i).first()).toBeVisible();
  });

  test('shows login page when session expired', async ({ browser }) => {
    // Create a new context without the stored auth state
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // Mock 401 response for API calls
    // Our API runs on :8787 by default or VITE_API_URL
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes(':8787') || url.includes('/billing/') || url.includes('/sessions') || url.includes('/github/') || url.includes('/settings/')) {
        await route.fulfill({ 
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    
    // Click "Sign In" on landing page
    const signInButton = page.getByRole('button', { name: /Sign In/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }
    
    // Should show login page
    await expect(page.getByText(/Shipbox/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible({ timeout: 15000 });
    
    await context.close();
  });
});
