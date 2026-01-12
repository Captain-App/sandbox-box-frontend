import { Hono } from "hono";
import { Effect, pipe } from "effect";
import { AdminService, makeAdminServiceLayer } from "../services/admin";
import { HoneycombService, makeHoneycombServiceLayer } from "../services/honeycomb";
import { adminAuth } from "../middleware/admin";
import { LoggerLayer, withRequestContext, withSentry } from "@shipbox/shared";
import * as Sentry from "@sentry/cloudflare";
import { createClient } from "@supabase/supabase-js";

const adminRoutes = new Hono<{ Bindings: any }>();

adminRoutes.use("*", adminAuth());

adminRoutes.get("/stats", async (c) => {
  const requestId = c.get("requestId") || crypto.randomUUID();
  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.getStats();
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch stats" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/users", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const requestId = c.get("requestId") || crypto.randomUUID();

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.listUsers(limit, offset);
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch users" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/users/search", async (c) => {
  const query = c.req.query("q") || "";
  const requestId = c.get("requestId") || crypto.randomUUID();

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.searchUsers(query);
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to search users" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/users/:userId", async (c) => {
  const userId = c.req.param("userId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.getUserDetails(userId);
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch user details" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/sessions", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const status = c.req.query("status");
  const requestId = c.get("requestId") || crypto.randomUUID();

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.listSessions(limit, offset, status);
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch sessions" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/sessions/:sessionId/logs", async (c) => {
  const sessionId = c.req.param("sessionId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  try {
    const res = await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${sessionId}/logs`, {
      headers: { "X-Request-Id": requestId }
    });
    if (!res.ok) return c.json({ error: "Failed to fetch logs" }, res.status);
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

adminRoutes.get("/sessions/:sessionId/metadata", async (c) => {
  const sessionId = c.req.param("sessionId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  try {
    const res = await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${sessionId}`, {
      headers: { "X-Request-Id": requestId }
    });
    if (!res.ok) return c.json({ error: "Failed to fetch metadata" }, res.status);
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

adminRoutes.get("/transactions", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const userId = c.req.query("userId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* AdminService;
        return yield* service.listTransactions(limit, offset, userId);
      }),
      Effect.provide(makeAdminServiceLayer(c.env.DB)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/traces/recent", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10");
  const requestId = c.get("requestId") || crypto.randomUUID();

  if (!c.env.HONEYCOMB_API_KEY || !c.env.HONEYCOMB_DATASET) {
    return c.json({ error: "Honeycomb not configured" }, 500);
  }

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* HoneycombService;
        return yield* service.listRecentTraces(limit);
      }),
      Effect.provide(makeHoneycombServiceLayer(c.env.HONEYCOMB_API_KEY, c.env.HONEYCOMB_DATASET)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch recent traces" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/traces/:traceId", async (c) => {
  const traceId = c.req.param("traceId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  if (!c.env.HONEYCOMB_API_KEY || !c.env.HONEYCOMB_DATASET) {
    return c.json({ error: "Honeycomb not configured" }, 500);
  }

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* HoneycombService;
        return yield* service.getTraceDetails(traceId);
      }),
      Effect.provide(makeHoneycombServiceLayer(c.env.HONEYCOMB_API_KEY, c.env.HONEYCOMB_DATASET)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch trace details" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/traces/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const requestId = c.get("requestId") || crypto.randomUUID();

  if (!c.env.HONEYCOMB_API_KEY || !c.env.HONEYCOMB_DATASET) {
    return c.json({ error: "Honeycomb not configured" }, 500);
  }

  const result = await Effect.runPromiseExit(
    pipe(
      Effect.gen(function* () {
        const service = yield* HoneycombService;
        return yield* service.getSessionTraces(sessionId);
      }),
      Effect.provide(makeHoneycombServiceLayer(c.env.HONEYCOMB_API_KEY, c.env.HONEYCOMB_DATASET)),
      withRequestContext(requestId),
      withSentry(Sentry as any),
      Effect.provide(LoggerLayer)
    )
  );

  if (result._tag === "Failure") {
    return c.json({ error: "Failed to fetch session traces" }, 500);
  }

  return c.json(result.value);
});

adminRoutes.get("/auth/token", async (c) => {
  const adminEmail = c.env.ADMIN_USER_EMAIL || "admin@captainapp.co.uk";
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_ROLE_KEY || !adminPassword) {
    return c.json({ error: "Auth integration not configured" }, 500);
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 1. Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (error) {
    // 2. If user doesn't exist, try to create it
    if (error.message.includes("Invalid login credentials")) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      });

      if (createError) {
        return c.json({ error: `Failed to create admin user: ${createError.message}` }, 500);
      }

      // Sign in again after creation
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (retryError) {
        return c.json({ error: `Failed to sign in after creation: ${retryError.message}` }, 500);
      }

      return c.json({
        accessToken: retryData.session?.access_token,
        user: retryData.user
      });
    }

    return c.json({ error: `Auth error: ${error.message}` }, 500);
  }

  return c.json({
    accessToken: data.session?.access_token,
    user: data.user
  });
});

export { adminRoutes };
