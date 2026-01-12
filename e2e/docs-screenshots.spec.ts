import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOT_DIR = 'docs-site/public/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Generate Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase Auth
    await page.route('**/auth/v1/**', async (route) => {
      if (route.request().method() === 'POST' && route.request().url().includes('token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: { id: 'test-user-123', email: 'test@example.com' }
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-user-123', email: 'test@example.com' }),
        });
      }
    });

    // Mock API responses for consistent testing
    await page.route('**/sessions', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'sb-dev-123',
            title: 'Development Sandbox',
            status: 'active',
            createdAt: new Date().toISOString(),
            region: 'us-east-1',
            tasksCompleted: 12,
            memoryUsage: '1.2 GB'
          },
          {
            id: 'sb-prod-456',
            title: 'Production Agent',
            status: 'hibernating',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            region: 'eu-west-1',
            tasksCompleted: 45,
            memoryUsage: '0.8 GB'
          }
        ]),
      });
    });

    await page.route('**/billing/balance', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ balanceCredits: 5000 }),
      });
    });

    await page.route('**/settings/api-keys', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ anthropicHint: '***1234' }),
      });
    });

    await page.route('**/github/status', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ 
          installationId: 123456, 
          accountLogin: 'shipbox-user', 
          accountType: 'User' 
        }),
      });
    });

    // Set a consistent viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('capture authentication page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByText(/Shipbox/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/auth.png` });
    await context.close();
  });

  async function ensureLoggedIn(page) {
    await page.goto('/');
    // If we see the login button, perform a mock login
    const loginButton = page.getByRole('button', { name: /Enter the Castle/i });
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await loginButton.click();
    }
    // Use first() to avoid strict mode violations if multiple match
    await expect(page.getByRole('heading', { name: 'Development Sandbox' }).first()).toBeVisible({ timeout: 20000 });
  }

  test('capture dashboard', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/dashboard.png` });
  });

  test('capture settings', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.locator('button').filter({ hasText: /Settings/i }).first().click();
    // Wait for the Settings page content
    await expect(page.getByText('Manage your credentials and integrations.')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/settings.png` });
  });

  test('capture billing', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.locator('button').filter({ hasText: /Billing/i }).first().click();
    await expect(page.getByText('Balance', { exact: true })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/billing.png` });
  });

  test('capture boxes list', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.locator('button').filter({ hasText: /Boxes/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Production Agent' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/boxes.png` });
  });

  test('capture create sandbox modal', async ({ page }) => {
    await ensureLoggedIn(page);
    // Find the create box button by its icon and text
    const createBtn = page.locator('button').filter({ hasText: /Box/i }).first();
    await createBtn.click();
    await expect(page.getByText(/Create New Sandbox/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/create-sandbox.png` });
  });

  test('capture workspace view', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.locator('button').filter({ hasText: /Open Box/i }).first().click();
    await expect(page.getByText(/Back to Dashboard/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/workspace.png` });
  });
});
