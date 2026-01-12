import { Schema } from "effect";

/**
 * Error categories for smarter alerting and observability.
 *
 * - user:auth  : Authentication failures (e.g. private repo without access)
 * - user:input : Invalid user input (e.g. malformed repo URL)
 * - system:infra: Infrastructure failures (e.g. R2 timeout, Sandbox crash)
 * - system:bug : Code bugs or unexpected states
 */
export type ErrorCategory = "user:auth" | "user:input" | "system:infra" | "system:bug";

/**
 * Interface for errors that carry a category.
 */
export interface CategorizedError {
  readonly category: ErrorCategory;
}

/**
 * Type guard for CategorizedError.
 */
export function isCategorizedError(error: unknown): error is CategorizedError {
  return typeof error === "object" && error !== null && "category" in error;
}

/**
 * Get the category of an error, defaulting to system:bug.
 */
export function getErrorCategory(error: unknown): ErrorCategory {
  if (isCategorizedError(error)) {
    return error.category;
  }
  return "system:bug";
}

/**
 * Base class for user-caused errors.
 */
export class UserError extends Schema.TaggedError<UserError>()("UserError", {
  message: Schema.String,
  category: Schema.Literal("user:auth", "user:input"),
}) {}

/**
 * Base class for system-caused errors.
 */
export class SystemError extends Schema.TaggedError<SystemError>()("SystemError", {
  message: Schema.String,
  category: Schema.Literal("system:infra", "system:bug"),
}) {}
