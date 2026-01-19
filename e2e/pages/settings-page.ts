import { Page, expect } from "@playwright/test";

/**
 * Page object for settings functionality
 */
export class SettingsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page
      .getByRole("link", { name: /Settings/i })
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async expectSettingsVisible(): Promise<void> {
    await expect(this.page.getByText(/Settings/i).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async setApiKey(key: string): Promise<void> {
    const apiKeyInput = this.page
      .locator("input[placeholder*='API Key'], input[placeholder*='Key']")
      .first();
    if (await apiKeyInput.isVisible({ timeout: 5000 })) {
      await apiKeyInput.fill(key);
    }
  }

  async saveSettings(): Promise<void> {
    const saveButton = this.page.getByRole("button", { name: /Save/i });
    if (await saveButton.isVisible({ timeout: 5000 })) {
      await saveButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  async expectApiKeyInputVisible(): Promise<void> {
    const apiKeyInput = this.page.locator(
      "input[placeholder*='API Key'], input[placeholder*='Key']",
    );
    await expect(apiKeyInput.first()).toBeVisible({ timeout: 10000 });
  }

  async expectGitHubButtonVisible(): Promise<void> {
    const githubButton = this.page.getByRole("button", {
      name: /Connect GitHub|GitHub/i,
    });
    await expect(githubButton).toBeVisible({ timeout: 10000 });
  }

  async clickConnectGitHub(): Promise<void> {
    const githubButton = this.page.getByRole("button", {
      name: /Connect GitHub|GitHub/i,
    });
    await githubButton.click();
  }

  async clickDisconnectGitHub(): Promise<void> {
    const disconnectButton = this.page.getByRole("button", {
      name: /Disconnect|Revoke/i,
    });
    if (await disconnectButton.isVisible({ timeout: 5000 })) {
      await disconnectButton.click();
    }
  }
}
