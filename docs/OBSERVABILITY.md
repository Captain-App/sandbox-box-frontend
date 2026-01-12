# Observability: How We See What's Happening

Shipbox runs across multiple Cloudflare Workers, Durable Objects, and containerized sandboxes spread globally. When something goes wrong, we need to answer "what happened?" without SSH access or log files.

We use three systems that work together:

```
┌────────────────────────────────────────────────────────────────┐
│                        You (debugging)                         │
└───────────┬───────────────────┬───────────────────┬────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │  Sentry  │        │Honeycomb │        │ Admin    │
      │ (Errors) │        │ (Traces) │        │   MCP    │
      └──────────┘        └──────────┘        └──────────┘
            │                   │                   │
            └───────────────────┴───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   All three services  │
                    │   (API, Engine, Admin)│
                    └───────────────────────┘
```

---

## Sentry: "What Broke?"

Every exception, crash, and unhandled rejection ends up in Sentry. We run two projects:

| Project          | Covers                                        |
| ---------------- | --------------------------------------------- |
| `shipbox-api`    | The main API worker (auth, billing, sessions) |
| `shipbox-engine` | The sandbox orchestration engine              |

### What Gets Captured

- **Exceptions**: Automatic. Any thrown error with full stack trace.
- **Request Context**: Method, path, URL attached to every error.
- **User Context**: After auth, we attach `userId` and `email`.
- **Request IDs**: Every request gets a UUID. Errors include it.

### How It's Wired

Every worker wraps its fetch handler with `@sentry/cloudflare`:

```typescript
export default sentryWrapper(
  (env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 1.0 }),
  { fetch: app.fetch },
);
```

Inside request handlers, we set context:

```typescript
Sentry.setTag("requestId", requestId);
Sentry.setUser({ id: user.id, email: user.email });
```

Workflows manually capture exceptions with extra context:

```typescript
Sentry.captureException(error, {
  tags: { category: "system" },
  extra: { workflowId, runId, sessionId },
});
```

---

## Honeycomb: "What Happened Before It Broke?"

Sentry tells you _what_ broke. Honeycomb tells you _why_ — the full request trace across services.

### Distributed Tracing

Every request flows through multiple services. Honeycomb stitches them together:

```
[Frontend] → [API Worker] → [Engine Worker] → [Sandbox Container]
     ├─ span 1     ├─ span 2       ├─ span 3        └─ span 4
     └─────────────┴───────────────┴─────────────────────────────┘
                            Trace ID: abc123
```

### What Gets Traced

- **HTTP Requests**: Every inbound/outbound request with timing.
- **Workflow Steps**: Each step in a task workflow is a span.
- **Service Calls**: API → Engine communication.
- **OpenCode Operations**: Commands, file operations, LLM calls.

### How It's Wired

We use `@microlabs/otel-cf-workers` to instrument Workers:

```typescript
export default instrument(sentryWrappedHandler, (env) => ({
  exporter: {
    url: "https://api.honeycomb.io/v1/traces",
    headers: {
      "x-honeycomb-team": env.HONEYCOMB_API_KEY,
      "x-honeycomb-dataset": "shipbox-api", // or shipbox-engine
    },
  },
  service: { name: "shipbox-api" },
}));
```

### Datasets

| Dataset          | What's In It                                       |
| ---------------- | -------------------------------------------------- |
| `shipbox-api`    | Auth, billing, session management, GitHub webhooks |
| `shipbox-engine` | Sandbox orchestration, OpenCode runs, MCP protocol |
| `shipbox-admin`  | Admin MCP operations                               |

---

## Admin MCP: "Let Me Ask the System Directly"

Here's the interesting one. Instead of opening Sentry and Honeycomb in browser tabs, we built an MCP server that lets LLMs query system state directly.

### What It Does

The Admin MCP server (`workers/admin-mcp`) exposes tools that let Cursor (or any MCP client) introspect the live system:

| Tool                         | What It Returns                                      |
| ---------------------------- | ---------------------------------------------------- |
| `admin_get_stats`            | High-level metrics: users, sessions, revenue         |
| `admin_list_users`           | User list with balances and activity                 |
| `admin_list_sessions`        | All sessions with status                             |
| `admin_list_r2_sessions`     | Sessions from R2 storage (most accurate)             |
| `admin_get_session_metadata` | Full metadata for a specific session                 |
| `admin_get_session_logs`     | Recent command logs for a session                    |
| `admin_list_transactions`    | Recent billing transactions                          |
| `admin_get_errors`           | **Unresolved Sentry issues** (pulls from Sentry API) |
| `admin_list_recent_traces`   | **Recent Honeycomb traces**                          |
| `admin_get_trace`            | **Full trace details** from Honeycomb                |
| `admin_get_session_traces`   | All traces for a session                             |
| `admin_check_health`         | Ping all services, return latencies                  |
| `admin_create_session`       | Create a new sandbox session                         |
| `admin_call_engine_mcp`      | Proxy MCP calls to the engine                        |

### Why This Matters

Traditional debugging: Open Sentry → Find error → Copy trace ID → Open Honeycomb → Search → Read spans → Maybe SSH into something.

With Admin MCP: "Hey Claude, what errors happened in the last hour? Show me the trace for the failing request."

The LLM can:

1. Call `admin_get_errors` to see Sentry issues
2. Call `admin_get_trace` with the trace ID
3. Call `admin_get_session_metadata` if it involves a session
4. Correlate everything and explain what went wrong

### How It's Wired

The Admin MCP worker has service bindings to both the API and Engine:

```jsonc
// wrangler.jsonc
"services": [
  { "binding": "SHIPBOX_API", "service": "shipbox-api" },
  { "binding": "SANDBOX_MCP", "service": "shipbox-engine" }
]
```

And secrets for Sentry/Honeycomb APIs:

```bash
wrangler secret put SENTRY_AUTH_TOKEN
wrangler secret put SENTRY_ORG
wrangler secret put HONEYCOMB_API_KEY
```

### Connecting to Admin MCP

Add to your MCP client config (e.g., Cursor's `mcp.json`):

```json
{
  "mcpServers": {
    "shipbox-admin": {
      "command": "npx",
      "args": ["mcp-remote", "https://admin.shipbox.dev/mcp"]
    }
  }
}
```

---

## Putting It Together: A Debugging Session

User reports: "My sandbox won't start."

**Step 1: Check recent errors**

```
Claude: Uses admin_get_errors to check Sentry
→ Finds: "SandboxStartTimeout" error for session abc123
```

**Step 2: Get the trace**

```
Claude: Uses admin_get_session_traces with sessionId=abc123
→ Finds trace showing: Workflow started → Sandbox creation → 30s timeout
```

**Step 3: Check session state**

```
Claude: Uses admin_get_session_metadata with sessionId=abc123
→ Finds: status="creating", no workspace cloned, no backup restored
```

**Step 4: Diagnose**

```
Claude: "The sandbox timed out during initial creation.
The trace shows the container started but OpenCode
never initialized. Check if ANTHROPIC_API_KEY is set."
```

All without leaving the IDE.

---

## Environment Variables

These need to be set as secrets in each worker:

| Variable            | Where          | Purpose                  |
| ------------------- | -------------- | ------------------------ |
| `SENTRY_DSN`        | All workers    | Sentry project DSN       |
| `HONEYCOMB_API_KEY` | All workers    | Send traces to Honeycomb |
| `HONEYCOMB_DATASET` | All workers    | Dataset name             |
| `SENTRY_AUTH_TOKEN` | Admin MCP only | Query Sentry API         |
| `SENTRY_ORG`        | Admin MCP only | Sentry org slug          |

---

## The Point

Observability isn't about collecting data. It's about answering questions fast:

- **Sentry**: "What exception just happened?"
- **Honeycomb**: "What was the request doing when it failed?"
- **Admin MCP**: "Let me just ask the system directly."

Each tool has a job. Together, they mean 3am pages get resolved faster.
