import { Context, Effect, Layer } from "effect";
import { UserBalance, Transaction, TransactionType, SessionStorageError } from "@shipbox/shared";

export interface BillingServiceInterface {
  readonly getBalance: (userId: string) => Effect.Effect<UserBalance, SessionStorageError>;
  readonly addTransaction: (
    userId: string, 
    amount: number, 
    type: TransactionType, 
    description?: string, 
    metadata?: string
  ) => Effect.Effect<Transaction, SessionStorageError>;
  readonly reportUsage: (
    userId: string, 
    sessionId: string, 
    durationMs: number
  ) => Effect.Effect<void, SessionStorageError>;
  readonly reportTokenUsage: (
    userId: string,
    sessionId: string,
    service: string,
    inputTokens: number,
    outputTokens: number,
    model: string | null
  ) => Effect.Effect<void, SessionStorageError>;
  readonly topUp: (
    userId: string,
    amountCredits: number,
    description: string
  ) => Effect.Effect<void, SessionStorageError>;
  readonly getTransactions: (
    userId: string,
    limit?: number
  ) => Effect.Effect<Transaction[], SessionStorageError>;
  readonly getConsumption: (
    userId: string,
    periodStart: number
  ) => Effect.Effect<number, SessionStorageError>;
  readonly getStripeCustomerId: (userId: string) => Effect.Effect<string | null, SessionStorageError>;
  readonly setStripeCustomerId: (userId: string, customerId: string) => Effect.Effect<void, SessionStorageError>;
  readonly grantStarterCredits: (userId: string) => Effect.Effect<boolean, SessionStorageError>;
}

export class BillingService extends Context.Tag("BillingService")<
  BillingService,
  BillingServiceInterface
>() {}

function makeD1BillingService(db: D1Database): BillingServiceInterface {
  // Simple rate: 1 credit per minute of usage
  const CREDITS_PER_MS = 1 / (60 * 1000);

  return {
    getBalance: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db.prepare(
            "SELECT balance_credits, updated_at FROM user_balances WHERE user_id = ?"
          ).bind(userId).first();

          if (!result) {
            return { userId, balanceCredits: 0, updatedAt: Math.floor(Date.now() / 1000) };
          }

          return {
            userId,
            balanceCredits: result.balance_credits as number,
            updatedAt: result.updated_at as number,
          };
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    addTransaction: (userId, amount, type, description, metadata) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          // Use a batch to update balance and add transaction atomically
          await db.batch([
            db.prepare(
              "INSERT INTO transactions (id, user_id, amount_credits, type, description, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(id, userId, amount, type, description || null, now, metadata || null),
            db.prepare(
              "INSERT INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_credits = balance_credits + ?, updated_at = ?"
            ).bind(userId, amount, now, amount, now)
          ]);

          return {
            id,
            userId,
            amountCredits: amount,
            type,
            description,
            createdAt: now,
            metadata,
          };
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    reportUsage: (userId, sessionId, durationMs) =>
      Effect.gen(function* () {
        const credits = Math.ceil(durationMs * CREDITS_PER_MS);
        if (credits <= 0) return;

        yield* Effect.tryPromise({
          try: async () => {
            const id = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);
            const amount = -credits;

            await db.batch([
              db.prepare(
                "INSERT INTO transactions (id, user_id, amount_credits, type, description, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(id, userId, amount, "usage", `Sandbox usage for ${sessionId}`, now, JSON.stringify({ sessionId, durationMs })),
              db.prepare(
                "INSERT INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_credits = balance_credits + ?, updated_at = ?"
              ).bind(userId, amount, now, amount, now)
            ]);
          },
          catch: (error) => new SessionStorageError({ 
            cause: error instanceof Error ? error.message : String(error) 
          }),
        });
      }),

    reportTokenUsage: (userId, sessionId, service, inputTokens, outputTokens, model) =>
      Effect.gen(function* () {
        // Basic pricing: 1 credit per 1000 input tokens, 5 credits per 1000 output tokens
        // In reality we should use model-specific pricing
        const credits = Math.ceil((inputTokens / 1000) * 1 + (outputTokens / 1000) * 5);
        if (credits <= 0) return;

        yield* Effect.tryPromise({
          try: async () => {
            const id = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);
            const amount = -credits;

            await db.batch([
              db.prepare(
                "INSERT INTO transactions (id, user_id, amount_credits, type, description, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(id, userId, amount, "usage", `AI token usage for ${sessionId} (${model})`, now, JSON.stringify({ sessionId, service, inputTokens, outputTokens, model })),
              db.prepare(
                "INSERT INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_credits = balance_credits + ?, updated_at = ?"
              ).bind(userId, amount, now, amount, now)
            ]);
          },
          catch: (error) => new SessionStorageError({ 
            cause: error instanceof Error ? error.message : String(error) 
          }),
        });
      }),

    topUp: (userId, amountCredits, description) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          await db.batch([
            db.prepare(
              "INSERT INTO transactions (id, user_id, amount_credits, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(id, userId, amountCredits, "top-up", description, now),
            db.prepare(
              "INSERT INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_credits = balance_credits + ?, updated_at = ?"
            ).bind(userId, amountCredits, now, amountCredits, now)
          ]);
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getTransactions: (userId, limit = 50) =>
      Effect.tryPromise({
        try: async () => {
          const { results } = await db.prepare(
            "SELECT id, user_id, amount_credits, type, description, created_at, metadata FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
          ).bind(userId, limit).all();

          return results.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            amountCredits: r.amount_credits,
            type: r.type,
            description: r.description || undefined,
            createdAt: r.created_at,
            metadata: r.metadata || undefined,
          }));
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getConsumption: (userId, periodStart) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db.prepare(
            "SELECT SUM(ABS(amount_credits)) as total FROM transactions WHERE user_id = ? AND amount_credits < 0 AND created_at >= ?"
          ).bind(userId, periodStart).first();

          return (result?.total as number) || 0;
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getStripeCustomerId: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db.prepare(
            "SELECT stripe_customer_id FROM user_balances WHERE user_id = ?"
          ).bind(userId).first();
          return (result?.stripe_customer_id as string) || null;
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    setStripeCustomerId: (userId, customerId) =>
      Effect.tryPromise({
        try: async () => {
          const now = Math.floor(Date.now() / 1000);
          await db.prepare(
            "INSERT INTO user_balances (user_id, balance_credits, updated_at, stripe_customer_id) VALUES (?, 0, ?, ?) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id = ?, updated_at = ?"
          ).bind(userId, now, customerId, customerId, now).run();
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    grantStarterCredits: (userId) =>
      Effect.gen(function* (this: any) {
        const STARTER_CREDITS = 100; // £1.00
        
        const hasCredits = yield* Effect.tryPromise({
          try: async () => {
            const result = await db.prepare(
              "SELECT 1 FROM transactions WHERE user_id = ? AND type = 'starter'"
            ).bind(userId).first();
            return !!result;
          },
          catch: (error) => new SessionStorageError({ 
            cause: error instanceof Error ? error.message : String(error) 
          }),
        });

        if (hasCredits) return false;

        yield* Effect.tryPromise({
          try: async () => {
            const id = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);
            await db.batch([
              db.prepare(
                "INSERT INTO transactions (id, user_id, amount_credits, type, description, created_at) VALUES (?, ?, ?, 'starter', 'Starter credits', ?)"
              ).bind(id, userId, STARTER_CREDITS, now),
              db.prepare(
                "INSERT INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_credits = balance_credits + ?, updated_at = ?"
              ).bind(userId, STARTER_CREDITS, now, STARTER_CREDITS, now)
            ]);
          },
          catch: (error) => new SessionStorageError({ 
            cause: error instanceof Error ? error.message : String(error) 
          }),
        });

        return true;
      }),
  };
}

export function makeBillingServiceLayer(db: D1Database): Layer.Layer<BillingService> {
  return Layer.succeed(BillingService, makeD1BillingService(db));
}
