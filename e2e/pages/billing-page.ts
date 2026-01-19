import { Page, expect } from "@playwright/test";

/**
 * Page object for billing functionality
 */
export class BillingPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page
      .getByRole("link", { name: /Billing/i })
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async expectBillingVisible(): Promise<void> {
    await expect(this.page.getByText(/Balance|Billing/i).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async getBalance(): Promise<number> {
    const balanceText = this.page.getByText(/Balance|Credits/i).first();
    const text = await balanceText.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async expectBalanceVisible(): Promise<void> {
    await expect(
      this.page.getByText(/Balance|Credits/i).first(),
    ).toBeVisible({ timeout: 10000 });
  }
}
