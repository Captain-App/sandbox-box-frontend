import { Hono } from "hono";
import { Effect, Exit, Cause } from "effect";
import { BillingService, makeBillingServiceLayer } from "../services/billing";
import { StripeService, makeStripeServiceLayer } from "../services/stripe";
import { Bindings, Variables } from "../index";
import { LoggerLayer, withRequestContext } from "@shipbox/shared";

export const billingRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get("/balance", async (c) => {
    const user = c.get("user");
    const billingLayer = makeBillingServiceLayer(c.env.DB);
    const result = await Effect.runPromise(
      BillingService.pipe(
        Effect.flatMap((service) => service.getBalance(user.id)),
        Effect.provide(billingLayer)
      )
    );
    return c.json(result);
  })
  .get("/transactions", async (c) => {
    const user = c.get("user");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
    const billingLayer = makeBillingServiceLayer(c.env.DB);
    const result = await Effect.runPromise(
      BillingService.pipe(
        Effect.flatMap((service) => service.getTransactions(user.id, limit)),
        Effect.provide(billingLayer)
      )
    );
    return c.json(result);
  })
  .get("/consumption", async (c) => {
    const user = c.get("user");
    // Default to last 30 days
    const periodStart = c.req.query("periodStart") 
      ? parseInt(c.req.query("periodStart")!) 
      : Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    const billingLayer = makeBillingServiceLayer(c.env.DB);
    const result = await Effect.runPromise(
      BillingService.pipe(
        Effect.flatMap((service) => service.getConsumption(user.id, periodStart)),
        Effect.provide(billingLayer)
      )
    );
    return c.json({ consumptionCredits: result });
  })
  .post("/checkout", async (c) => {
    const user = c.get("user");
    const { amountCredits } = await c.req.json();

    if (!amountCredits || amountCredits < 500) {
      return c.json({ error: "Minimum top-up is 500 credits (£5.00)" }, 400);
    }

    const stripeLayer = makeStripeServiceLayer(
      c.env.STRIPE_API_KEY,
      c.env.STRIPE_WEBHOOK_SECRET,
      c.env.APP_URL || "https://shipbox.dev"
    );

    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const stripe = yield* StripeService;
        return yield* stripe.createCheckoutSession(user.id, amountCredits);
      }).pipe(Effect.provide(stripeLayer))
    );

    if (Exit.isFailure(result)) {
      return c.json({ error: "Failed to create checkout session" }, 500);
    }

    return c.json(result.value);
  })
  .post("/webhook", async (c) => {
    const signature = c.req.header("stripe-signature");
    const payload = await c.req.text();

    if (!signature) return c.json({ error: "Missing signature" }, 400);

    const stripeLayer = makeStripeServiceLayer(
      c.env.STRIPE_API_KEY,
      c.env.STRIPE_WEBHOOK_SECRET,
      c.env.APP_URL || "https://shipbox.dev"
    );
    const billingLayer = makeBillingServiceLayer(c.env.DB);

    const requestId = c.get("requestId");
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const stripe = yield* StripeService;
        const billing = yield* BillingService;

        const { userId, amountCredits } = yield* stripe.handleWebhook(payload, signature);
        
        // Only process if we have valid data (skip ignored events)
        if (userId && amountCredits > 0) {
          yield* billing.topUp(userId, amountCredits, "Stripe top-up");
          yield* Effect.log(`Credited ${amountCredits} to user ${userId}`);
        }
        
        return { success: true };
      }).pipe(
        Effect.provide(stripeLayer),
        Effect.provide(billingLayer),
        withRequestContext(requestId),
        Effect.provide(LoggerLayer)
      )
    );

    if (Exit.isFailure(result)) {
      await Effect.runPromise(
        Effect.logError("Billing webhook error", result.cause).pipe(
          withRequestContext(requestId),
          Effect.provide(LoggerLayer)
        )
      );
      return c.json({ error: "Webhook processing failed" }, 500);
    }

    return c.json(result.value);
  });
