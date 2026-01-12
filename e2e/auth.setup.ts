import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// This setup project authenticates once and saves the session
// All other tests reuse this session via storageState
setup('authenticate', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

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
            refresh_token: 'mock-refresh-token',
            user: { 
              id: 'test-user-123', 
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
              app_metadata: { provider: 'email' },
              user_metadata: { email: 'test@example.com' }
            },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: 'bearer'
          }),
        }],
      }],
    }));
    return;
  }

  await page.goto('/');
  
  // If we're on the landing page, click "Sign In"
  const landingHeading = page.getByText(/Infrastructure for AI Agents/i);
  if (await landingHeading.isVisible({ timeout: 10000 })) {
    await page.getByRole('button', { name: /Sign In|Get Started/i }).first().click();
  }
  
  // Wait for auth page to load - check for "Enter the Castle" button which is unique to Auth
  await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible({ timeout: 30000 });
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button:has-text("Enter the Castle")');
  
  // Wait for redirect to authenticated app
  await page.waitForURL('/');
  
  // Check for Sidebar content which is always visible after login
  await expect(page.getByText(/Dashboard/i).first()).toBeVisible({ timeout: 15000 });
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
