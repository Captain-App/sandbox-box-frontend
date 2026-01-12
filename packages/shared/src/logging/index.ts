import { Context, Effect, Layer, Logger } from "effect";

/**
 * Request context carrying identifiers for correlation
 */
export interface RequestContext {
  readonly requestId: string;
  readonly userId?: string;
  readonly sessionId?: string;
}

export const RequestContext = Context.Tag<RequestContext>();

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
 * Effect Logger implementation that outputs structured JSON
 */
export const structuredLogger = Logger.make<unknown, void>((options) => {
  const context = options.context;
  const requestContext = Context.getOption(context, RequestContext);

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: options.logLevel.label,
    message: options.message,
  };

  if (requestContext._tag === "Some") {
    logEntry.requestId = requestContext.value.requestId;
    logEntry.userId = requestContext.value.userId;
    logEntry.sessionId = requestContext.value.sessionId;
  }

  // Include any other annotations/meta if available
  // In Effect 3.x, we can use options.annotations if needed, 
  // but for now, we'll stick to the core RequestContext.

  globalThis.console.log(JSON.stringify(logEntry));
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
) => <R, E, A>(effect: Effect.Effect<R, E, A>) =>
  Effect.provideService(effect, RequestContext, { requestId, userId, sessionId });
