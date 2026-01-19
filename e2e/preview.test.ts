import { test, expect } from "@playwright/test";

test.describe("Preview Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("**/sessions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "abc12345",
            sessionId: "abc12345",
            title: "Preview Test Box",
            status: "active",
            createdAt: Date.now(),
            lastActivity: Date.now(),
            workspacePath: "/workspace",
            webUiUrl: "https://engine.shipbox.dev/session/abc12345/",
          },
        ]),
      });
    });

    await page.route("**/billing/balance", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balanceCredits: 5000 }),
      });
    });
  });

  test("should load preview iframe in BoxWorkspace", async ({ page }) => {
    await page.goto("/");

    // If we're on the landing page, click "Sign In"
    const landingHeading = page.getByText(/Your Agents/i).first();
    if (await landingHeading.isVisible({ timeout: 5000 })) {
      await page.getByRole("button", { name: /Sign In|Get Started/i }).first().click();
    }

    // Navigate to Boxes
    await page.getByRole("link", { name: /Boxes/i }).first().click();

    // Open the box
    await page.getByRole("button", { name: /Open/i }).first().click();

    // Check if Preview tab exists and click it
    const previewTab = page.getByRole("button", { name: /Preview/i });
    await expect(previewTab).toBeVisible();
    await previewTab.click();

    // Check for iframe
    const iframe = page.locator('iframe[title*="Preview"]');
    await expect(iframe).toBeVisible();

    // Verify iframe src matches Workers for Platforms URL pattern
    const src = await iframe.getAttribute("src");
    expect(src).toBe("https://engine.shipbox.dev/site/abc12345/");
  });

  test("Open in New Tab button should open the correct URL", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    // If we're on the landing page, click "Sign In"
    const landingHeading = page.getByText(/Your Agents/i).first();
    if (await landingHeading.isVisible({ timeout: 5000 })) {
      await page.getByRole("button", { name: /Sign In|Get Started/i }).first().click();
    }

    await page.getByRole("link", { name: /Boxes/i }).first().click();
    await page.getByRole("button", { name: /Open/i }).first().click();

    // Get the popup/new tab promise before clicking
    const pagePromise = context.waitForEvent("page");

    const openNewTabButton = page.getByRole("button", {
      name: /Open Tab/i,
    });
    await expect(openNewTabButton).toBeVisible();
    await openNewTabButton.click();

    const newPage = await pagePromise;
    expect(newPage.url()).toBe("https://engine.shipbox.dev/site/abc12345/");
  });
});
