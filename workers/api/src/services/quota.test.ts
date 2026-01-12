import { describe, it, expect } from "vitest";
import { Effect, Layer, Exit } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { QuotaService, makeQuotaServiceLayer } from "./quota";

describe("QuotaService", () => {
  it("should allow sandbox creation if under limit", async () => {
    const db = createMockD1();
    const layer = makeQuotaServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* QuotaService;
      return yield* service.checkSandboxQuota("user-123");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(Exit.isSuccess(result)).toBe(true);
  });

  it("should reject sandbox creation if at limit", async () => {
    const db = createMockD1();
    const layer = makeQuotaServiceLayer(db);

    // Add 3 sessions for user-123 (MAX_ACTIVE_SANDBOXES = 3)
    const store = (db as any)._store;
    store.set("user_sessions", [
      { user_id: "user-123", session_id: "s1" },
      { user_id: "user-123", session_id: "s2" },
      { user_id: "user-123", session_id: "s3" },
    ]);

    const program = Effect.gen(function* () {
      const service = yield* QuotaService;
      return yield* service.checkSandboxQuota("user-123");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("should allow if balance is positive", async () => {
    const db = createMockD1();
    const layer = makeQuotaServiceLayer(db);

    const program = Effect.gen(function* () {
      const service = yield* QuotaService;
      return yield* service.checkBalance("user-123");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(Exit.isSuccess(result)).toBe(true);
  });

  it("should reject if balance is zero or negative", async () => {
    const db = createMockD1();
    const layer = makeQuotaServiceLayer(db);

    const store = (db as any)._store;
    store.set("user_balances", [{ user_id: "user-broke", balance_credits: 0 }]);

    const program = Effect.gen(function* () {
      const service = yield* QuotaService;
      return yield* service.checkBalance("user-broke");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(Exit.isFailure(result)).toBe(true);
  });
});
