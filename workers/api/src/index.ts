import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

type Bindings = {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SANDBOX_MCP: Fetcher;
};

type Variables = {
  user: { id: string };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS
app.use("*", cors());

// Health check - no auth needed
app.get("/health", (c) => c.text("OK"));

// Auth middleware for /sessions/*
app.use("/sessions/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized", details: error?.message }, 401);
  }

  c.set("user", { id: user.id });
  await next();
});

// List sessions
app.get("/sessions", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT session_id FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();

  const sessionIds = results.map(r => r.session_id as string);

  // Fetch metadata from sandbox-mcp for each session
  const sessions = await Promise.all(
    sessionIds.map(async (id) => {
      try {
        const res = await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${id}`);
        if (res.ok) {
          const s = await res.json() as any;
          return { ...s, id: s.sessionId };
        }
      } catch (e) {
        console.error(`Failed to fetch session ${id}:`, e);
      }
      return null;
    })
  );

  return c.json(sessions.filter(s => s !== null));
});

// Create session
app.post("/sessions", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  // Create session in sandbox-mcp
  const res = await c.env.SANDBOX_MCP.fetch("http://sandbox/internal/sessions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    return c.json({ error: "Failed to create session in engine" }, 500);
  }

  const session = await res.json() as any;
  const now = Math.floor(Date.now() / 1000);

  // Register ownership
  await c.env.DB.prepare(
    "INSERT INTO user_sessions (user_id, session_id, created_at) VALUES (?, ?, ?)"
  ).bind(user.id, session.sessionId, now).run();

  return c.json({ ...session, id: session.sessionId }, 201);
});

// Get session
app.get("/sessions/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  // Check ownership
  const ownership = await c.env.DB.prepare(
    "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, id).first();

  if (!ownership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Fetch from sandbox-mcp
  const res = await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${id}`);
  if (!res.ok) {
    return c.json({ error: "Session not found" }, 404);
  }

  const session = await res.json() as any;
  return c.json({ ...session, id: session.sessionId });
});

// Delete session
app.delete("/sessions/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  // Check ownership
  const ownership = await c.env.DB.prepare(
    "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, id).first();

  if (!ownership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Delete in sandbox-mcp
  await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${id}`, { method: "DELETE" });

  // Unregister ownership
  await c.env.DB.prepare(
    "DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, id).run();

  return c.json({ success: true });
});

// Start session
app.post("/sessions/:id/start", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  // Check ownership
  const ownership = await c.env.DB.prepare(
    "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, id).first();

  if (!ownership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Start in sandbox-mcp
  const res = await c.env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${id}/start`, { method: "POST" });
  return c.json(await res.json());
});

// Proxy to sandbox-mcp web UI
app.all("/session/:sessionId/*", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("sessionId");

  // Check ownership
  const ownership = await c.env.DB.prepare(
    "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, sessionId).first();

  if (!ownership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Proxy to sandbox-mcp
  return c.env.SANDBOX_MCP.fetch(c.req.raw);
});

export default app;
