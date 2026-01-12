import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'docs-site/public/screenshots';

// Ensure screenshot directory exists
mkdirSync(SCREENSHOT_DIR, { recursive: true });

test.describe('Generate Screenshots', () => {
  // All tests in this block use the authenticated state from auth.setup.ts
  
  test('capture auth page', async ({ browser }) => {
    // Create a new context without the stored auth state to see the login page
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    await page.goto('/');
    await expect(page.getByText(/Shipbox/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/auth.png` });
    await context.close();
  });

  test('capture dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Active Box/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/dashboard.png` });
  });

  test('capture settings', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /Settings/i }).first().click();
    // Wait for the Settings page content
    await expect(page.getByText(/Manage your credentials/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/settings.png` });
  });

  test('capture billing', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /Billing/i }).first().click();
    await expect(page.getByText('Balance', { exact: true })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/billing.png` });
  });

  test('capture boxes list', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /Boxes/i }).first().click();
    // Just wait for the list view to load, don't expect a specific box name
    await expect(page.getByText(/Active Box/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/boxes.png` });
  });

  test('capture create sandbox modal', async ({ page }) => {
    await page.goto('/');
    // Open the dropdown first
    await page.getByRole('button', { name: /Active Box/i }).click();
    // Click the "Create New Box" button in the dropdown
    await page.getByText('Create New Box').click();
    
    // Modal should appear with "New Sandbox Box" heading
    await expect(page.getByText('New Sandbox Box')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/create-sandbox.png` });
  });

  test('capture workspace view', async ({ page }) => {
    await page.goto('/');
    // If there's an "Open Box" button, click it
    const openBtn = page.locator('button').filter({ hasText: /Open Box/i }).first();
    if (await openBtn.isVisible()) {
      await openBtn.click();
      // Look for something specific to workspace, like "Box Details" or similar
      await expect(page.getByText(/Back to Dashboard/i).or(page.getByText(/Box Details/i))).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/workspace.png` });
    } else {
      console.log('Skipping workspace screenshot - no boxes found');
    }
  });
});
