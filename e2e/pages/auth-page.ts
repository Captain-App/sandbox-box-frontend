import { Page, expect } from "@playwright/test";

/**
 * Page object for login/auth functionality
 */
export class AuthPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    // Handle landing page redirect
    const landingHeading = this.page.getByText(/Your Agents/i).first();
    if (await landingHeading.isVisible({ timeout: 5000 })) {
      await this.page
        .getByRole("button", { name: /Sign In|Get Started/i })
        .first()
        .click();
    }
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill('input[type="password"]', password);
  }

  async clickLogin(): Promise<void> {
    await this.page
      .getByRole("button", { name: /Enter the Castle/i })
      .click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
    // Wait for redirect to dashboard
    await this.page.waitForURL("/");
    await this.page.waitForLoadState("networkidle");
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.page
      .getByRole("button", { name: /Enter the Castle/i })
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  async expectOnLogin(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: /Enter the Castle/i }),
    ).toBeVisible({ timeout: 10000 });
  }
}
