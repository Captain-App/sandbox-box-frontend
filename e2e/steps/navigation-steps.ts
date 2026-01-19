import { expect } from "@playwright/test";
import { StepContext, StepParams } from "../framework";
import { DashboardPage } from "../pages";

export async function navigateToDashboard(ctx: StepContext): Promise<void> {
  const dashboardPage = new DashboardPage(ctx.page);
  await dashboardPage.goto();
  await dashboardPage.expectDashboardVisible();
}

export async function navigateToBoxes(ctx: StepContext): Promise<void> {
  const dashboardPage = new DashboardPage(ctx.page);
  await dashboardPage.navigateToBoxes();
}

export async function navigateToSettings(ctx: StepContext): Promise<void> {
  const dashboardPage = new DashboardPage(ctx.page);
  await dashboardPage.navigateToSettings();
}

export async function navigateToBilling(ctx: StepContext): Promise<void> {
  const dashboardPage = new DashboardPage(ctx.page);
  await dashboardPage.navigateToBilling();
}
