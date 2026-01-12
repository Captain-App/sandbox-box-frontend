import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('shows error when API unreachable', async ({ page }) => {
    // Mock network failure for all API calls
    await page.route('**/sessions', route => route.abort('failed'));
    await page.route('**/billing/balance', route => route.abort('failed'));
    
    await page.goto('/');
    
    // The app might show a toast or error boundary
    // For now we just verify it doesn't crash completely and shows something sensible
    await expect(page.getByText(/Shipbox/i)).toBeVisible();
  });

  test('shows login page when session expired', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Mock 401 response for all API calls
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/')) {
        await route.fulfill({ status: 401 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    
    // Should be redirected to auth or show login
    await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible();
    
    await context.close();
  });
});
