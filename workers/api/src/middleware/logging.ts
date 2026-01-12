import { MiddlewareHandler } from "hono";
import { Effect } from "effect";
import { withRequestContext, LoggerLayer } from "@shipbox/shared";
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
  });

  const start = Date.now();
  const { method, path } = c.req;

  // Log request entry
  await Effect.runPromise(
    Effect.log(`--> ${method} ${path}`).pipe(
      withRequestContext(requestId),
      Effect.provide(LoggerLayer)
    )
  );

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const user = c.get("user") as { id: string } | undefined;

  if (user) {
    Sentry.setUser({ id: user.id });
    Sentry.setTag("userId", user.id);
  }

  // Log request exit with full context
  await Effect.runPromise(
    Effect.log(`<-- ${method} ${path} ${status} (${duration}ms)`).pipe(
      withRequestContext(requestId, user?.id),
      Effect.provide(LoggerLayer)
    )
  );
};
