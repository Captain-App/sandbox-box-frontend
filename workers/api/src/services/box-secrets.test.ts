import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Option } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { BoxSecretsService, makeBoxSecretsServiceLayer } from "./box-secrets";

// Mock global crypto for the test environment
if (typeof global.crypto === "undefined") {
  const { crypto } = require("node:crypto");
  global.crypto = crypto;
}

describe("BoxSecretsService", () => {
  const MASTER_KEY = "test-master-key-32-chars-long-!!!";
  const USER_ID = "user-123";
  const SECRET_NAME = "GITHUB_TOKEN";
  const SECRET_VALUE = "ghp_1234567890abcdef";

  it("should create and list secrets", async () => {
    const db = createMockD1();
    const layer = makeBoxSecretsServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* BoxSecretsService;
      yield* service.createSecret(USER_ID, SECRET_NAME, SECRET_VALUE);
      return yield* service.listSecrets(USER_ID);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    expect(result.length).toBe(1);
    expect(result[0].name).toBe(SECRET_NAME);
    expect(result[0].hint).toBe("...cdef");
    expect(result[0].userId).toBe(USER_ID);
  });

  it("should retrieve secret value with decryption", async () => {
    const db = createMockD1();
    const layer = makeBoxSecretsServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* BoxSecretsService;
      const secret = yield* service.createSecret(
        USER_ID,
        SECRET_NAME,
        SECRET_VALUE,
      );
      const retrieved = yield* service.getSecretValue(USER_ID, secret.id);
      return { retrieved, secretId: secret.id };
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));

    expect(Option.isSome(result.retrieved)).toBe(true);
    expect(result.retrieved.value).toBe(SECRET_VALUE);

    // Check if last_used was updated in mock store
    const store = (db as any)._store.get("user_box_secrets");
    expect(store[0].last_used).toBeDefined();
  });

  it("should return None for non-existent secret", async () => {
    const db = createMockD1();
    const layer = makeBoxSecretsServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* BoxSecretsService;
      return yield* service.getSecretValue(USER_ID, "non-existent-id");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(Option.isNone(result)).toBe(true);
  });

  it("should delete a secret", async () => {
    const db = createMockD1();
    const layer = makeBoxSecretsServiceLayer(db, MASTER_KEY);

    const program = Effect.gen(function* () {
      const service = yield* BoxSecretsService;
      const secret = yield* service.createSecret(
        USER_ID,
        SECRET_NAME,
        SECRET_VALUE,
      );
      yield* service.deleteSecret(USER_ID, secret.id);
      return yield* service.listSecrets(USER_ID);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(result.length).toBe(0);
  });
});
