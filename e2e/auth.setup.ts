import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// This setup project authenticates once and saves the session
// All other tests reuse this session via storageState
setup('authenticate', async ({ page }) => {
  // Skip if E2E credentials not provided
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  
  if (!email || !password) {
    console.log('E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set. Using mock auth.');
    // Create a mock storage state for tests that don't require real auth
    const { writeFileSync, mkdirSync } = await import('fs');
    mkdirSync('playwright/.auth', { recursive: true });
    writeFileSync(authFile, JSON.stringify({
      cookies: [],
      origins: [{
        origin: 'http://localhost:5173',
        localStorage: [{
          name: 'sb-kjbcjkihxskuwwfdqklt-auth-token',
          value: JSON.stringify({
            access_token: 'mock-token',
            user: { id: 'test-user-123', email: 'test@example.com' },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }),
        }],
      }],
    }));
    return;
  }

  await page.goto('/');
  
  // Wait for auth page to load
  await expect(page.getByText(/Shipbox/i)).toBeVisible();
  
  // Click login button (assuming it triggers Supabase auth)
  await page.click('button:has-text("Enter the Castle")');
  
  // Fill in credentials (Supabase magic link or password flow)
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to authenticated app
  await page.waitForURL('/');
  await expect(page.getByText(/Sandboxes/i)).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
