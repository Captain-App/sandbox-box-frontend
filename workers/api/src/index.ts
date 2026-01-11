import { Hono } from "hono";
import { cors } from "hono/cors";
import { supabaseAuth } from "./middleware/auth";
import { sessionsRoutes } from "./routes/sessions";

type Bindings = {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SANDBOX_MCP: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", cors());
app.use("/sessions/*", supabaseAuth());

// Routes
app.route("/sessions", sessionsRoutes);

// Proxy passthrough for OpenCode sessions
// This handles both the initial /session/:id redirect and subsequent proxied requests
app.all("/session/:sessionId/*", async (c) => {
  const user = c.get("user") as any;
  const sessionId = c.req.param("sessionId");
  const db = c.env.DB;

  // Verify ownership
  const ownership = await db.prepare(
    "SELECT 1 FROM user_sessions WHERE user_id = ? AND session_id = ?"
  ).bind(user.id, sessionId).first();

  if (!ownership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Forward to sandbox-mcp engine
  // Note: We use c.req.raw to preserve headers, body, etc.
  return c.env.SANDBOX_MCP.fetch(c.req.raw);
});

// Health check
app.get("/health", (c) => c.text("OK"));

export default app;
