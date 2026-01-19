import { Page, expect } from "@playwright/test";

/**
 * Page object for dashboard/main layout navigation
 */
export class DashboardPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  async expectDashboardVisible(): Promise<void> {
    await expect(this.page.getByText(/Dashboard/i).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async navigateToBoxes(): Promise<void> {
    await this.page
      .getByRole("link", { name: /Boxes/i })
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async navigateToSettings(): Promise<void> {
    await this.page
      .getByRole("link", { name: /Settings/i })
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async navigateToBilling(): Promise<void> {
    await this.page
      .getByRole("link", { name: /Billing/i })
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async logout(): Promise<void> {
    // Find and click logout in sidebar or menu
    const logoutButton = this.page
      .getByRole("button", { name: /Logout|Sign Out|Disconnect/i })
      .first();

    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
    }

    // Wait for auth page to appear (app uses conditional rendering, not routing)
    await expect(
      this.page.getByRole("button", { name: /Enter the Castle/i }),
    ).toBeVisible({ timeout: 10000 });
  }

  async isLoggedIn(): Promise<boolean> {
    // Check for presence of sidebar/dashboard elements
    return await this.page
      .getByText(/Dashboard|Boxes|Settings/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }
}
