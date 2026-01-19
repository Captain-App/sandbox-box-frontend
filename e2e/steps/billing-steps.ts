import { expect } from "@playwright/test";
import { StepContext, StepParams } from "../framework";
import { BillingPage } from "../pages";

export async function verifyBalance(ctx: StepContext): Promise<void> {
  const billingPage = new BillingPage(ctx.page);

  await billingPage.goto();
  await billingPage.expectBalanceVisible();

  const balance = await billingPage.getBalance();
  ctx.state.balance = balance;
  expect(balance).toBeGreaterThanOrEqual(0);
}

export async function viewInvoices(ctx: StepContext): Promise<void> {
  const billingPage = new BillingPage(ctx.page);

  await billingPage.goto();
  await billingPage.expectBillingVisible();

  // Look for invoices section
  const invoicesSection = ctx.page.getByText(/Invoices|Transactions/i);
  expect(await invoicesSection.isVisible({ timeout: 5000 })).toBeTruthy();
}
