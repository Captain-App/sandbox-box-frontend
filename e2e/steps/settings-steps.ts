import { expect } from "@playwright/test";
import { StepContext, StepParams } from "../framework";
import { SettingsPage } from "../pages";

export async function setApiKey(
  ctx: StepContext,
  params?: StepParams,
): Promise<void> {
  const settingsPage = new SettingsPage(ctx.page);

  await settingsPage.goto();
  await settingsPage.expectApiKeyInputVisible();

  const apiKey = params?.apiKey || "test-api-key-12345";
  await settingsPage.setApiKey(apiKey);
  await settingsPage.saveSettings();

  ctx.state.apiKeySet = true;
}

export async function connectGitHub(ctx: StepContext): Promise<void> {
  const settingsPage = new SettingsPage(ctx.page);

  await settingsPage.goto();
  await settingsPage.expectGitHubButtonVisible();
  await settingsPage.clickConnectGitHub();

  // Note: This would normally redirect to GitHub OAuth
  // In test environment, we just verify the button was clicked
  ctx.state.githubConnected = true;
}

export async function disconnectGitHub(ctx: StepContext): Promise<void> {
  const settingsPage = new SettingsPage(ctx.page);

  await settingsPage.goto();
  await settingsPage.clickDisconnectGitHub();

  ctx.state.githubConnected = false;
}

export async function verifySettings(ctx: StepContext): Promise<void> {
  const settingsPage = new SettingsPage(ctx.page);

  await settingsPage.goto();
  await settingsPage.expectSettingsVisible();
}
