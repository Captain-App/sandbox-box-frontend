import { Context, Effect, Layer } from "effect";
import { SessionId } from "../models/session";
import { SessionStorageError } from "../models/errors";

export interface SessionServiceInterface {
  readonly register: (userId: string, sessionId: string) => Effect.Effect<void, SessionStorageError>;
  readonly listOwned: (userId: string) => Effect.Effect<string[], SessionStorageError>;
  readonly checkOwnership: (userId: string, sessionId: string) => Effect.Effect<boolean, SessionStorageError>;
  readonly unregister: (userId: string, sessionId: string) => Effect.Effect<void, SessionStorageError>;
}

export class SessionService extends Context.Tag("SessionService")<
  SessionService,
  SessionServiceInterface
>() {}

function makeD1SessionService(db: D1Database): SessionServiceInterface {
  return {
    register: (userId, sessionId) =>
      Effect.tryPromise({
        try: async () => {
          const now = Math.floor(Date.now() / 1000);
          await db.prepare(
            "INSERT INTO user_sessions (user_id, session_id, created_at) VALUES (?, ?, ?)"
          ).bind(userId, sessionId, now).run();
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    listOwned: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const { results } = await db.prepare(
            "SELECT session_id FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC"
          ).bind(userId).all();
          return results.map(r => r.session_id as string);
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    checkOwnership: (userId, sessionId) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db.prepare(
            "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
          ).bind(userId, sessionId).first();
          return !!result;
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    unregister: (userId, sessionId) =>
      Effect.tryPromise({
        try: async () => {
          await db.prepare(
            "DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?"
          ).bind(userId, sessionId).run();
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),
  };
}

export function makeSessionServiceLayer(db: D1Database): Layer.Layer<SessionService> {
  return Layer.succeed(SessionService, makeD1SessionService(db));
}
