import { Schema } from "effect";

export const SessionId = Schema.String.pipe(Schema.brand("SessionId"));
export type SessionId = typeof SessionId.Type;

// Minimal session record for the ownership registry
export const UserSession = Schema.Struct({
  userId: Schema.String,
  sessionId: SessionId,
  createdAt: Schema.Number,
});
export type UserSession = typeof UserSession.Type;

// Input for creating a session (passed through to sandbox-mcp)
export const CreateSessionInput = Schema.Struct({
  name: Schema.String,
  region: Schema.String,
  repository: Schema.optionalWith(Schema.String, { exact: true }),
});
export type CreateSessionInput = typeof CreateSessionInput.Type;
