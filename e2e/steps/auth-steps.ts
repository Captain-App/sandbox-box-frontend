import { expect } from "@playwright/test";
import { StepContext, TestStep } from "../framework";
import { AuthPage, DashboardPage } from "../pages";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "password";

export async function login(ctx: StepContext): Promise<void> {
  // First check if we're already logged in from the stored session state
  await ctx.page.goto("/");
  await ctx.page.waitForLoadState("networkidle");

  const dashboardPage = new DashboardPage(ctx.page);
  const alreadyLoggedIn = await dashboardPage.isLoggedIn();

  if (alreadyLoggedIn) {
    // Already authenticated from setup project's stored session
    ctx.state.isLoggedIn = true;
    ctx.state.currentUserEmail = TEST_EMAIL;
    return;
  }

  // Not logged in, perform login flow
  const authPage = new AuthPage(ctx.page);
  await authPage.login(TEST_EMAIL, TEST_PASSWORD);

  // Update state
  ctx.state.isLoggedIn = true;
  ctx.state.currentUserEmail = TEST_EMAIL;
}

export async function logout(ctx: StepContext): Promise<void> {
  const { DashboardPage } = await import("../pages");
  const dashboardPage = new DashboardPage(ctx.page);

  if (ctx.state.isLoggedIn) {
    await dashboardPage.logout();
    ctx.state.isLoggedIn = false;
    ctx.state.currentUserEmail = undefined;
  }
}

export async function verifyLoggedIn(ctx: StepContext): Promise<void> {
  const { DashboardPage } = await import("../pages");
  const dashboardPage = new DashboardPage(ctx.page);

  const isLoggedIn = await dashboardPage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
  expect(ctx.state.isLoggedIn).toBeTruthy();
}

export async function verifyLoggedOut(ctx: StepContext): Promise<void> {
  const authPage = new AuthPage(ctx.page);

  const onLogin = await authPage.isLoginFormVisible();
  expect(onLogin).toBeTruthy();
  expect(ctx.state.isLoggedIn).toBeFalsy();
}

export async function navigateToLogin(ctx: StepContext): Promise<void> {
  // Clear auth state to access the login page
  await ctx.page.context().clearCookies();
  await ctx.page.evaluate(() => localStorage.clear());

  const authPage = new AuthPage(ctx.page);
  await authPage.goto();
  await authPage.expectOnLogin();

  // Mark as logged out since we cleared the session
  ctx.state.isLoggedIn = false;
  ctx.state.currentUserEmail = undefined;
}
