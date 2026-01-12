import { Context, Effect, Layer } from "effect";

export interface EmailServiceInterface {
  readonly sendWelcomeEmail: (email: string) => Effect.Effect<void, Error>;
  readonly sendLowBalanceWarning: (email: string, balance: number) => Effect.Effect<void, Error>;
  readonly sendReceipt: (email: string, amount: number) => Effect.Effect<void, Error>;
}

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  EmailServiceInterface
>() {}

function makeConsoleEmailService(): EmailServiceInterface {
  return {
    sendWelcomeEmail: (email) =>
      Effect.sync(() => {
        console.log(`[EMAIL] Welcome email sent to ${email}`);
      }),
    sendLowBalanceWarning: (email, balance) =>
      Effect.sync(() => {
        console.log(`[EMAIL] Low balance warning sent to ${email}: £${(balance / 100).toFixed(2)} remaining`);
      }),
    sendReceipt: (email, amount) =>
      Effect.sync(() => {
        console.log(`[EMAIL] Receipt sent to ${email}: £${(amount / 100).toFixed(2)}`);
      }),
  };
}

export function makeEmailServiceLayer(): Layer.Layer<EmailService> {
  return Layer.succeed(EmailService, makeConsoleEmailService());
}
