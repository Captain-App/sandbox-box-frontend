import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Shipbox/);
});

test('shows login page when unauthenticated', async ({ page }) => {
  await page.goto('/');

  // Should see login heading
  await expect(page.getByText(/Shipbox/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Enter the Castle/i })).toBeVisible();
});
