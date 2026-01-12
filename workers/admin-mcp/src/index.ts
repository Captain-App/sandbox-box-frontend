import { withSentry as sentryWrapper } from "@sentry/cloudflare";
import * as Sentry from "@sentry/cloudflare";
import { instrument } from "@microlabs/otel-cf-workers";
import { AdminMcpAgent } from "./agent/admin-agent";

// Export Durable Object class
export { AdminMcpAgent };

const workerFetch = async (
  request: Request,
  env: any,
  ctx: ExecutionContext,
): Promise<Response> => {
  const url = new URL(request.url);

  // Health check
  if (url.pathname === "/health") {
    return new Response("OK", { status: 200 });
  }

      // MCP endpoint - route to AdminMcpAgent
      if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
        return AdminMcpAgent.serve("/mcp", { binding: "ADMIN_AGENT" }).fetch(request, env, ctx);
      }

      // Debug route to check engine internal sessions
      if (url.pathname === "/debug/engine-sessions") {
        const res = await env.SANDBOX_MCP.fetch("http://sandbox/internal/sessions");
        return res;
      }

      // Debug route to check all runs
      if (url.pathname === "/debug/engine-runs") {
        const res = await env.SANDBOX_MCP.fetch("http://sandbox/internal/runs/list"); // I'll assume this is the path
        return res;
      }

      // Debug route to check session logs
      if (url.pathname.startsWith("/debug/logs/")) {
        const sessionId = url.pathname.split("/")[3];
        const res = await env.SANDBOX_MCP.fetch(`http://sandbox/internal/sessions/${sessionId}/logs`);
        return res;
      }

      return new Response("Not Found", { status: 404 });
};

export default instrument(
  sentryWrapper(
    (env: any) => ({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    }),
    {
      fetch: workerFetch,
    },
  ),
  (env: any) => ({
    exporter: {
      url: "https://api.honeycomb.io/v1/traces",
      headers: {
        "x-honeycomb-team": env.HONEYCOMB_API_KEY || "",
        "x-honeycomb-dataset": env.HONEYCOMB_DATASET || "shipbox-admin",
      },
    },
    service: { name: "shipbox-admin-mcp" },
  }),
);
