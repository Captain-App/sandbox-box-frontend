import { Context, Effect, Layer, Option } from "effect";

export interface ShipboxApiKey {
  key_hash: string;
  user_id: string;
  name: string;
  key_hint: string;
  created_at: number;
  last_used?: number;
}

export interface ShipboxApiKeyServiceInterface {
  readonly createKey: (userId: string, name: string) => Effect.Effect<{ key: string; name: string; hint: string }, Error>;
  readonly validateKey: (key: string) => Effect.Effect<string, Error>; // returns userId
  readonly listKeys: (userId: string) => Effect.Effect<Omit<ShipboxApiKey, 'key_hash'>[], Error>;
  readonly deleteKey: (userId: string, hint: string) => Effect.Effect<void, Error>;
}

export class ShipboxApiKeyService extends Context.Tag("ShipboxApiKeyService")<
  ShipboxApiKeyService,
  ShipboxApiKeyServiceInterface
>() {}

function makeShipboxApiKeyService(db: D1Database): ShipboxApiKeyServiceInterface {
  const hashKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const generateKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return "sb_" + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  return {
    createKey: (userId, name) =>
      Effect.tryPromise({
        try: async () => {
          const key = generateKey();
          const hash = await hashKey(key);
          const hint = `sb_***${key.slice(-4)}`;
          const now = Math.floor(Date.now() / 1000);

          await db
            .prepare(
              `INSERT INTO user_shipbox_api_keys (key_hash, user_id, name, key_hint, created_at)
               VALUES (?, ?, ?, ?, ?)`
            )
            .bind(hash, userId, name, hint, now)
            .run();

          return { key, name, hint };
        },
        catch: (error) => new Error(`Failed to create API key: ${error}`),
      }),

    validateKey: (key) =>
      Effect.tryPromise({
        try: async () => {
          const hash = await hashKey(key);
          const result = await db
            .prepare("SELECT user_id FROM user_shipbox_api_keys WHERE key_hash = ?")
            .bind(hash)
            .first();

          if (!result) throw new Error("Invalid API key");

          // Update last used
          const now = Math.floor(Date.now() / 1000);
          await db
            .prepare("UPDATE user_shipbox_api_keys SET last_used = ? WHERE key_hash = ?")
            .bind(now, hash)
            .run();

          return result.user_id as string;
        },
        catch: (error) => new Error(`Validation failed: ${error instanceof Error ? error.message : error}`),
      }),

    listKeys: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const { results } = await db
            .prepare("SELECT user_id, name, key_hint, created_at, last_used FROM user_shipbox_api_keys WHERE user_id = ?")
            .bind(userId)
            .all();

          return results as any;
        },
        catch: (error) => new Error(`Failed to list API keys: ${error}`),
      }),

    deleteKey: (userId, hint) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare("DELETE FROM user_shipbox_api_keys WHERE user_id = ? AND key_hint = ?")
            .bind(userId, hint)
            .run();
        },
        catch: (error) => new Error(`Failed to delete API key: ${error}`),
      }),
  };
}

export function makeShipboxApiKeyServiceLayer(db: D1Database): Layer.Layer<ShipboxApiKeyService> {
  return Layer.succeed(ShipboxApiKeyService, makeShipboxApiKeyService(db));
}
