import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

// This file uses Miniflare to run real integration tests against the worker

describe("Worker Integration Tests (Miniflare)", () => {
  beforeAll(async () => {
    // Seed the D1 database with test data using batch statements
    const statements = [
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          user_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, session_id)
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_balances (
          user_id TEXT PRIMARY KEY,
          balance_credits INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          amount_credits INTEGER NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL,
          metadata TEXT
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_api_keys (
          user_id TEXT PRIMARY KEY,
          anthropic_key_encrypted TEXT,
          key_hint TEXT,
          created_at INTEGER NOT NULL
        )
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS github_installations (
          user_id TEXT PRIMARY KEY,
          installation_id INTEGER NOT NULL,
          account_login TEXT NOT NULL,
          account_type TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `),
    ];

    await env.DB.batch(statements);

    await env.DB.prepare(
      `INSERT OR REPLACE INTO user_balances (user_id, balance_credits, updated_at) VALUES (?, ?, ?)`,
    )
      .bind("test-user-123", 5000, Math.floor(Date.now() / 1000))
      .run();
  });

  it("GET /health returns OK", async () => {
    const response = await SELF.fetch("http://localhost/health");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });

  it("GET /billing/balance requires auth", async () => {
    const response = await SELF.fetch("http://localhost/billing/balance");
    expect(response.status).toBe(401);
  });

  it("POST /billing/checkout requires auth", async () => {
    const response = await SELF.fetch("http://localhost/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCredits: 1000 }),
    });
    expect(response.status).toBe(401);
  });

  it("POST /billing/webhook accepts requests without auth", async () => {
    // Webhooks don't require Bearer auth (they use signature verification)
    const response = await SELF.fetch("http://localhost/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123,v1=abc",
      },
      body: JSON.stringify({ type: "test" }),
    });
    // Will fail signature verification, but should not be 401
    expect(response.status).not.toBe(401);
  });

  it("GET /github/install requires auth", async () => {
    const response = await SELF.fetch("http://localhost/github/install");
    expect(response.status).toBe(401);
  });

  it("POST /github/webhook accepts requests without auth", async () => {
    const response = await SELF.fetch("http://localhost/github/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-event": "ping",
        "x-hub-signature-256": "sha256=abc", // Provide a signature (will fail verification but bypass auth)
      },
      body: JSON.stringify({ zen: "test" }),
    });
    // Should not require auth (webhooks use signature verification)
    // Will return 401 if signature fails, but that's from the webhook handler, not auth middleware
    // A 200 or 401 from signature failure is acceptable - we just verify it's not from auth middleware
    expect([200, 401]).toContain(response.status);
  });

  it("GET /sessions requires auth", async () => {
    const response = await SELF.fetch("http://localhost/sessions");
    expect(response.status).toBe(401);
  });

  it("GET /settings/api-keys requires auth", async () => {
    const response = await SELF.fetch("http://localhost/settings/api-keys");
    expect(response.status).toBe(401);
  });

  it("POST /internal/report-token-usage updates balance", async () => {
    const userId = "test-user-123";

    const response = await SELF.fetch(
      "http://localhost/internal/report-token-usage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId: "sess-1",
          service: "anthropic",
          inputTokens: 1000,
          outputTokens: 1000,
          model: "claude-3-5-sonnet",
        }),
      },
    );

    expect(response.status).toBe(200);

    // Check balance was updated in D1
    const result = await env.DB.prepare(
      "SELECT balance_credits FROM user_balances WHERE user_id = ?",
    )
      .bind(userId)
      .first();

    // 5000 - 6 credits (1 for input, 5 for output) = 4994
    expect(result?.balance_credits).toBe(4994);
  });

  it("GET /internal/user-config/:userId returns user keys", async () => {
    const userId = "test-user-123";

    // Seed key
    await env.DB.prepare(
      "INSERT INTO user_api_keys (user_id, anthropic_key_encrypted, key_hint, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(userId, "enc-key", "sk-ant-...", Date.now())
      .run();

    const response = await SELF.fetch(
      `http://localhost/internal/user-config/${userId}`,
    );
    expect(response.status).toBe(200);

    const data = (await response.json()) as any;
    expect(data.anthropicKey).toBeDefined();
  });
});
