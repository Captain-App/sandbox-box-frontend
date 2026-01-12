import { Schema } from "effect";

// --- Session Errors ---

export class SessionNotFoundError extends Schema.TaggedError<SessionNotFoundError>()(
  "SessionNotFoundError",
  { sessionId: Schema.String },
) {
  override get message(): string {
    return `Session not found: ${this.sessionId}`;
  }
}

export class RunNotFoundError extends Schema.TaggedError<RunNotFoundError>()(
  "RunNotFoundError",
  { runId: Schema.String },
) {
  override get message(): string {
    return `Run not found: ${this.runId}`;
  }
}

// --- Storage Errors ---

export class SessionStorageError extends Schema.TaggedError<SessionStorageError>()(
  "SessionStorageError",
  { cause: Schema.String },
) {
  override get message(): string {
    return `Session storage error: ${this.cause}`;
  }
}

export class SessionStorageReadError extends Schema.TaggedError<SessionStorageReadError>()(
  "SessionStorageReadError",
  {
    sessionId: Schema.optionalWith(Schema.String, { exact: true }),
    cause: Schema.String,
  },
) {
  override get message(): string {
    return this.sessionId
      ? `Failed to read session ${this.sessionId}: ${this.cause}`
      : `Failed to read sessions: ${this.cause}`;
  }
}

export class SessionStorageWriteError extends Schema.TaggedError<SessionStorageWriteError>()(
  "SessionStorageWriteError",
  {
    sessionId: Schema.optionalWith(Schema.String, { exact: true }),
    cause: Schema.String,
  },
) {
  override get message(): string {
    return this.sessionId
      ? `Failed to write session ${this.sessionId}: ${this.cause}`
      : `Failed to write session index: ${this.cause}`;
  }
}

export class RunStorageReadError extends Schema.TaggedError<RunStorageReadError>()(
  "RunStorageReadError",
  {
    runId: Schema.optionalWith(Schema.String, { exact: true }),
    cause: Schema.String,
  },
) {
  override get message(): string {
    return this.runId
      ? `Failed to read run ${this.runId}: ${this.cause}`
      : `Failed to read runs: ${this.cause}`;
  }
}

export class RunStorageWriteError extends Schema.TaggedError<RunStorageWriteError>()(
  "RunStorageWriteError",
  {
    runId: Schema.optionalWith(Schema.String, { exact: true }),
    cause: Schema.String,
  },
) {
  override get message(): string {
    return this.runId
      ? `Failed to write run ${this.runId}: ${this.cause}`
      : `Failed to write run index: ${this.cause}`;
  }
}

// --- external Service Errors ---

export class GithubError extends Schema.TaggedError<GithubError>()(
  "GithubError",
  { cause: Schema.String },
) {
  override get message(): string {
    return `GitHub API error: ${this.cause}`;
  }
}

// --- Type Guards ---

export function isSessionError(
  error: unknown,
): error is SessionNotFoundError | RunNotFoundError {
  return (
    error instanceof SessionNotFoundError || error instanceof RunNotFoundError
  );
}

export function isSessionStorageError(
  error: unknown,
): error is SessionStorageReadError | SessionStorageWriteError {
  return (
    error instanceof SessionStorageReadError ||
    error instanceof SessionStorageWriteError
  );
}

export function isRunStorageError(
  error: unknown,
): error is RunStorageReadError | RunStorageWriteError {
  return (
    error instanceof RunStorageReadError ||
    error instanceof RunStorageWriteError
  );
}
