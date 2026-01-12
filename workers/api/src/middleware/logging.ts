import { MiddlewareHandler } from "hono";
import { Effect, pipe } from "effect";
import { withRequestContext, LoggerLayer, withSentry } from "@shipbox/shared";
import * as Sentry from "@sentry/cloudflare";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
  }
}

export const loggingMiddleware = (): MiddlewareHandler => async (c, next) => {
  const requestId = c.req.header("X-Request-Id") || crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  // Set Sentry context
  Sentry.setTag("requestId", requestId);
  Sentry.setContext("request", {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
  });

  const start = Date.now();
  const { method, path } = c.req;

  // Log request entry
  await Effect.runPromise(
    pipe(
      Effect.log(`--> ${method} ${path}`),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer),
    ),
  );

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const user = c.get("user") as { id: string; email: string } | undefined;

  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
    Sentry.setTag("userId", user.id);
  }

  // Log request exit with full context
  await Effect.runPromise(
    pipe(
      Effect.log(`<-- ${method} ${path} ${status} (${duration}ms)`),
      withRequestContext(requestId, user?.id),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer),
    ),
  );
};
