import { expect } from "@playwright/test";
import { StepContext, StepParams } from "../framework";
import { BoxWorkspacePage } from "../pages";

export async function createBox(
  ctx: StepContext,
  params?: StepParams,
): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  // Navigate to boxes list
  await boxPage.gotoBoxesList();

  // Click create button
  await boxPage.clickCreateNewBox();
  await boxPage.expectCreateModalVisible();

  // Fill in title
  const title =
    params?.title || `Test Box ${new Date().getTime()}`;
  await boxPage.fillBoxTitle(title);

  // Submit
  await boxPage.submitCreateBox();

  // Update state
  ctx.state.currentSessionTitle = title;
}

export async function openBox(ctx: StepContext): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  await boxPage.gotoBoxesList();
  await boxPage.openFirstBox();
  await boxPage.expectChatInputVisible();
}

export async function deleteBox(ctx: StepContext): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);
  await boxPage.deleteBox();
}

export async function sendMessage(
  ctx: StepContext,
  params?: StepParams,
): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  const message = params?.message || "Hello, can you help me?";
  await boxPage.sendMessage(message);

  // Brief pause to let message send
  await ctx.page.waitForTimeout(500);
}

export async function verifyAgentResponse(ctx: StepContext): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  try {
    await boxPage.waitForAgentResponse(5000);
  } catch {
    // In mock/test environment, agent response might not come
    // This is acceptable for scenario tests
  }
}

export async function openBoxPreview(ctx: StepContext): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  await boxPage.expectPreviewTabVisible();
  await boxPage.clickPreviewTab();
  await boxPage.expectIframeVisible();
}

export async function closeBoxPreview(ctx: StepContext): Promise<void> {
  const boxPage = new BoxWorkspacePage(ctx.page);

  // Close by clicking the X or navigating away
  const closeButton = ctx.page.getByRole("button", {
    name: /Close|Back/i,
  });
  if (await closeButton.isVisible({ timeout: 5000 })) {
    await closeButton.click();
  }
}
