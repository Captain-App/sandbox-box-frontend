import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Option } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { ApiKeyService, makeApiKeyServiceLayer } from "./api-keys";

// Mock global crypto for the test environment if needed
if (typeof global.crypto === "undefined") {
  const { crypto } = require("node:crypto");
  global.crypto = crypto;
}

describe("ApiKeyService", () => {
  const MASTER_KEY = "test-master-key-32-chars-long-!!!";
  const USER_ID = "user-123";
  const TEST_API_KEY = "sk-ant-123456789";

  it("should store and retrieve an API key with encryption", async () => {
    const db = createMockD1();
    const layer = makeApiKeyServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* ApiKeyService;
      yield* service.storeApiKey(USER_ID, TEST_API_KEY);

      const retrieved = yield* service.getApiKey(USER_ID);
      const hint = yield* service.getKeyHint(USER_ID);

      return { retrieved, hint };
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    expect(Option.isSome(result.retrieved)).toBe(true);
    expect(result.retrieved.value).toBe(TEST_API_KEY);
    expect(Option.isSome(result.hint)).toBe(true);
    expect(result.hint.value).toBe("***6789");

    // Verify it's encrypted in the database
    const store = (db as any)._store.get("user_api_keys");
    expect(store[0].anthropic_key_encrypted).not.toBe(TEST_API_KEY);
  });

  it("should return None for non-existent key", async () => {
    const db = createMockD1();
    const layer = makeApiKeyServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* ApiKeyService;
      return yield* service.getApiKey("no-user");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(Option.isNone(result)).toBe(true);
  });

  it("should delete an API key", async () => {
    const db = createMockD1();
    const layer = makeApiKeyServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* ApiKeyService;
      yield* service.storeApiKey(USER_ID, TEST_API_KEY);
      yield* service.deleteApiKey(USER_ID);
      return yield* service.getApiKey(USER_ID);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(Option.isNone(result)).toBe(true);
  });
});
