import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { BillingService, makeBillingServiceLayer } from "./billing";

describe("BillingService", () => {
  it("should get zero balance for new user", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      return yield* service.getBalance("new-user");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    expect(result.balanceCredits).toBe(0);
  });

  it("should get correct balance for existing user", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      return yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    expect(result.balanceCredits).toBe(1000);
  });

  it("should report sandbox usage and deduct credits", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      // 10 minutes = 600,000 ms. 1 credit per minute = 10 credits.
      yield* service.reportUsage("user-123", "session-abc", 600000);
      return yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    // Original 1000 - 10 = 990
    expect(result.balanceCredits).toBe(990);

    // Check transaction
    const transactions = (db as any)._store.get("transactions");
    expect(transactions.length).toBe(1);
    expect(transactions[0].amount_credits).toBe(-10);
    expect(transactions[0].type).toBe("usage");
  });

  it("should report token usage and deduct credits", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      // 1000 input tokens (1 credit) + 1000 output tokens (5 credits) = 6 credits
      yield* service.reportTokenUsage(
        "user-123",
        "session-abc",
        "anthropic",
        1000,
        1000,
        "claude-3-5-sonnet",
      );
      return yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    // Original 1000 - 6 = 994
    expect(result.balanceCredits).toBe(994);
  });

  it("should top up credits", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      yield* service.topUp("user-123", 5000, "Stripe recharge");
      return yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    // Original 1000 + 5000 = 6000
    expect(result.balanceCredits).toBe(6000);

    // Check transaction
    const transactions = (db as any)._store.get("transactions");
    expect(transactions.length).toBe(1);
    expect(transactions[0].amount_credits).toBe(5000);
    expect(transactions[0].type).toBe("top-up");
  });

  it("should do nothing for zero duration usage", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      yield* service.reportUsage("user-123", "session-abc", 0);
      return yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(result.balanceCredits).toBe(1000);
    expect((db as any)._store.get("transactions").length).toBe(0);
  });

  it("should handle database errors gracefully", async () => {
    const db = createMockD1();
    // Force error by mocking prepare to throw
    db.prepare = () => {
      throw new Error("DB Error");
    };

    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      yield* service.getBalance("user-123");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(result._tag).toBe("Failure");
  });

  it("should get transactions", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      yield* service.topUp("user-123", 1000, "Top up");
      // Add a small delay to ensure different timestamps in mock
      yield* Effect.promise(
        () => new Promise((resolve) => setTimeout(resolve, 1100)),
      );
      yield* service.reportUsage("user-123", "session-1", 60000); // -1 credit
      return yield* service.getTransactions("user-123");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(result.length).toBe(2);
    // Usage should be first because it's newer (ordered DESC)
    expect(result[0].type).toBe("usage");
    expect(result[1].type).toBe("top-up");
  });

  it("should get consumption for period", async () => {
    const db = createMockD1();
    const layer = makeBillingServiceLayer(db);
    const now = Math.floor(Date.now() / 1000);

    const program = Effect.gen(function* () {
      const service = yield* BillingService;
      yield* service.reportUsage("user-123", "session-1", 600000); // -10 credits
      yield* service.topUp("user-123", 1000, "Top up"); // positive, should be ignored by getConsumption
      return yield* service.getConsumption("user-123", now - 3600);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(result).toBe(10);
  });
});
