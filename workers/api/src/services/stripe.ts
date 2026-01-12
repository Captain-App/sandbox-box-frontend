import { Context, Effect, Layer } from "effect";
import Stripe from "stripe";

export interface StripeServiceInterface {
  readonly createCheckoutSession: (
    userId: string,
    amountCredits: number,
    customerId?: string | null,
  ) => Effect.Effect<{ url: string }, Error>;
  readonly createPortalSession: (
    customerId: string,
  ) => Effect.Effect<{ url: string }, Error>;
  readonly handleWebhook: (
    payload: string,
    signature: string,
  ) => Effect.Effect<
    {
      userId: string;
      amountCredits: number;
      customerId: string;
      email: string;
    },
    Error
  >;
}

export class StripeService extends Context.Tag("StripeService")<
  StripeService,
  StripeServiceInterface
>() {}

function makeStripeService(
  apiKey: string,
  webhookSecret: string,
  appUrl: string,
): StripeServiceInterface {
  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
  });

  return {
    createCheckoutSession: (userId, amountCredits, customerId) =>
      Effect.tryPromise({
        try: async () => {
          // 100 credits = £1.00
          const amountPence = amountCredits;

          const session = await stripe.checkout.sessions.create({
            customer: customerId || undefined,
            payment_method_types: ["card"],
            line_items: [
              {
                price_data: {
                  currency: "gbp",
                  product_data: {
                    name: "Shipbox Credits",
                    description: `${amountCredits} compute credits`,
                  },
                  unit_amount: amountPence,
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            success_url: `${appUrl}/billing?success=true`,
            cancel_url: `${appUrl}/billing?canceled=true`,
            metadata: {
              userId,
              amountCredits: amountCredits.toString(),
            },
          });

          if (!session.url)
            throw new Error("Failed to create checkout session URL");
          return { url: session.url };
        },
        catch: (error) => new Error(`Stripe error: ${error}`),
      }),

    createPortalSession: (customerId) =>
      Effect.tryPromise({
        try: async () => {
          const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${appUrl}/billing`,
          });
          return { url: session.url };
        },
        catch: (error) => new Error(`Stripe portal error: ${error}`),
      }),

    handleWebhook: (payload, signature) =>
      Effect.tryPromise({
        try: async () => {
          // Use async version for Cloudflare Workers (SubtleCrypto)
          const event = await stripe.webhooks.constructEventAsync(
            payload,
            signature,
            webhookSecret,
          );

          if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const amountCredits = session.metadata?.amountCredits;
            const customerId = session.customer as string;
            const email = session.customer_details?.email || "";

            if (!userId || !amountCredits || !customerId) {
              // This happens with test triggers that don't have our metadata
              return {
                userId: "",
                amountCredits: 0,
                customerId: "",
                email: "",
              };
            }

            return {
              userId,
              amountCredits: parseInt(amountCredits),
              customerId,
              email,
            };
          }

          // Acknowledge other events without processing - don't throw
          return { userId: "", amountCredits: 0, customerId: "", email: "" };
        },
        catch: (error) => new Error(`Webhook error: ${error}`),
      }),
  };
}

export function makeStripeServiceLayer(
  apiKey: string,
  webhookSecret: string,
  appUrl: string,
): Layer.Layer<StripeService> {
  return Layer.succeed(
    StripeService,
    makeStripeService(apiKey, webhookSecret, appUrl),
  );
}
