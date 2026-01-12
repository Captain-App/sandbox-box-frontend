import { Context, Effect, Layer, Option } from "effect";

export interface BoxSecret {
  id: string;
  userId: string;
  name: string;
  hint: string;
  createdAt: number;
  lastUsed?: number;
}

export interface BoxSecretsServiceInterface {
  readonly listSecrets: (userId: string) => Effect.Effect<BoxSecret[], Error>;
  readonly createSecret: (userId: string, name: string, value: string) => Effect.Effect<BoxSecret, Error>;
  readonly deleteSecret: (userId: string, secretId: string) => Effect.Effect<void, Error>;
  readonly getSecretValue: (userId: string, secretId: string) => Effect.Effect<Option.Option<string>, Error>;
  readonly getFullSecrets: (userId: string) => Effect.Effect<Record<string, string>, Error>;
}

export class BoxSecretsService extends Context.Tag("BoxSecretsService")<
  BoxSecretsService,
  BoxSecretsServiceInterface
>() {}

function makeD1BoxSecretsService(db: D1Database, masterKey: string): BoxSecretsServiceInterface {
  const getMasterKey = async () => {
    const encoder = new TextEncoder();
    return await crypto.subtle.importKey(
      "raw",
      encoder.encode(masterKey.padEnd(32, "0").slice(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  };

  const encrypt = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const key = await getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  };

  const decrypt = async (base64: string) => {
    const combined = new Uint8Array(atob(base64).split("").map((c) => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getMasterKey();
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  };

  return {
    listSecrets: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const { results } = await db
            .prepare("SELECT id, user_id, name, hint, created_at, last_used FROM user_box_secrets WHERE user_id = ? ORDER BY created_at DESC")
            .bind(userId)
            .all();

          return results.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            name: r.name,
            hint: r.hint,
            createdAt: r.created_at,
            lastUsed: r.last_used || undefined,
          }));
        },
        catch: (error) => new Error(`Failed to list box secrets: ${error}`),
      }),

    createSecret: (userId, name, value) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          const encrypted = await encrypt(value);
          const hint = value.length > 4 ? `...${value.slice(-4)}` : "****";
          const now = Math.floor(Date.now() / 1000);

          await db
            .prepare(
              "INSERT INTO user_box_secrets (id, user_id, name, encrypted_value, hint, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(id, userId, name, encrypted, hint, now)
            .run();

          return {
            id,
            userId,
            name,
            hint,
            createdAt: now,
          };
        },
        catch: (error) => new Error(`Failed to create box secret: ${error}`),
      }),

    deleteSecret: (userId, secretId) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .prepare("DELETE FROM user_box_secrets WHERE user_id = ? AND id = ?")
            .bind(userId, secretId)
            .run();
        },
        catch: (error) => new Error(`Failed to delete box secret: ${error}`),
      }),

    getSecretValue: (userId, secretId) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .prepare("SELECT encrypted_value FROM user_box_secrets WHERE user_id = ? AND id = ?")
            .bind(userId, secretId)
            .first();

          if (!result || !result.encrypted_value) return Option.none();

          const decrypted = await decrypt(result.encrypted_value as string);
          
          // Update last used
          const now = Math.floor(Date.now() / 1000);
          await db
            .prepare("UPDATE user_box_secrets SET last_used = ? WHERE id = ?")
            .bind(now, secretId)
            .run();

          return Option.some(decrypted);
        },
        catch: (error) => new Error(`Failed to get box secret value: ${error}`),
      }),
  };
}

export function makeBoxSecretsServiceLayer(db: D1Database, masterKey: string): Layer.Layer<BoxSecretsService> {
  return Layer.succeed(BoxSecretsService, makeD1BoxSecretsService(db, masterKey));
}
