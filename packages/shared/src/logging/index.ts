import { Context, Effect, Layer, Logger, FiberRef, FiberRefs, Cause } from "effect";

/**
 * Request context carrying identifiers for correlation
 */
export interface RequestContext {
  readonly requestId: string;
  readonly userId?: string;
  readonly sessionId?: string;
}

export const RequestContext = Context.GenericTag<RequestContext>("@shipbox/shared/RequestContext");

/**
 * Sentry-like interface to avoid direct dependency in shared
 */
export interface SentryBreadcrumb {
  message?: string;
  category?: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: { [key: string]: any };
}

export interface SentryClient {
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void;
  captureException(exception: any, hint?: any): string;
}

/**
 * FiberRef to store an optional Sentry client for the current execution context
 */
export const currentSentry = FiberRef.unsafeMake<SentryClient | null>(null);

/**
 * Structured log entry format
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: unknown;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Effect Logger implementation that outputs structured JSON and records Sentry breadcrumbs
 */
export const structuredLogger = Logger.make<unknown, void>((options) => {
  // Get the current context from FiberRefs
  const context = FiberRefs.getOrDefault(options.context, FiberRef.currentContext);
  const requestContext = Context.getOption(context, RequestContext);
  const sentry = FiberRefs.getOrDefault(options.context, currentSentry);

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: options.logLevel.label,
    message: options.message,
  };

  let requestId: string | undefined;
  let userId: string | undefined;
  let sessionId: string | undefined;

  if (requestContext._tag === "Some") {
    const ctx = requestContext.value as RequestContext;
    requestId = ctx.requestId;
    userId = ctx.userId;
    sessionId = ctx.sessionId;
    
    logEntry.requestId = requestId;
    logEntry.userId = userId;
    logEntry.sessionId = sessionId;
  }

  // Record Sentry breadcrumb if client is available
  if (sentry) {
    sentry.addBreadcrumb({
      message: typeof options.message === "string" ? options.message : JSON.stringify(options.message),
      level: options.logLevel.label.toLowerCase() as any,
      category: "log",
      data: {
        requestId,
        userId,
        sessionId,
      },
    });
  }

  // Use console directly (globalThis.console doesn't work in all envs)
  console.log(JSON.stringify(logEntry));
});

/**
 * Layer to provide the structured logger
 */
export const LoggerLayer = Logger.replace(Logger.defaultLogger, structuredLogger);

/**
 * Utility to run an effect with RequestContext
 */
export const withRequestContext = (
  requestId: string,
  userId?: string,
  sessionId?: string
) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.provideService(effect, RequestContext, { requestId, userId, sessionId });

/**
 * Utility to provide Sentry client to an effect
 */
export const withSentry = (sentry: SentryClient) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.locally(effect, currentSentry, sentry);

/**
 * Utility to report Effect failure to Sentry
 */
export const captureEffectError = <E>(
  cause: Cause.Cause<E>,
  sentry?: SentryClient,
  context?: Record<string, any>
) => {
  if (!sentry) return;

  const error = Cause.failureOrCause(cause);
  const exception = error._tag === "Left" ? error.left : new Error(Cause.pretty(cause));
  
  sentry.captureException(exception, {
    extra: {
      ...context,
      prettyCause: Cause.pretty(cause),
    },
  });
};
