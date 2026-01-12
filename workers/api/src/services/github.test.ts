import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Option, Exit } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { GitHubService, makeGitHubServiceLayer } from "./github";

// Mock jose
vi.mock("jose", () => ({
  importPKCS8: vi.fn().mockResolvedValue({}),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt"),
  })),
}));

describe("GitHubService", () => {
  const mockD1 = createMockD1();
  const layer = makeGitHubServiceLayer(mockD1 as any, "app-123", "priv-key");
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (mockD1 as any)._store.set("github_installations", []);
    global.fetch = vi.fn();
  });

  it("should store and retrieve an installation", async () => {
    const program = Effect.gen(function* () {
      const service = yield* GitHubService;
      const inst = {
        userId,
        installationId: 456,
        accountLogin: "crew",
        accountType: "User",
      };
      yield* service.storeInstallation(inst);
      return yield* service.getInstallation(userId);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    
    expect(Option.isSome(result)).toBe(true);
    expect(result.value.installationId).toBe(456);
    expect(result.value.accountLogin).toBe("crew");
  });

  it("should return None if installation not found", async () => {
    const program = Effect.gen(function* () {
      const service = yield* GitHubService;
      return yield* service.getInstallation("unknown");
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(Option.isNone(result)).toBe(true);
  });

  it("should get an installation token", async () => {
    // 1. Seed installation
    (mockD1 as any)._store.set("github_installations", [{
      user_id: userId,
      installation_id: 456,
      account_login: "crew",
      account_type: "User",
    }]);

    // 2. Mock fetch for access token
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ token: "gh-token-123" }), { status: 200 }));

    const program = Effect.gen(function* () {
      const service = yield* GitHubService;
      return yield* service.getInstallationToken(userId);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(result).toBe("gh-token-123");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/app/installations/456/access_tokens",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should fail to get token if installation missing", async () => {
    const program = Effect.gen(function* () {
      const service = yield* GitHubService;
      return yield* service.getInstallationToken(userId);
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("should delete an installation", async () => {
    // Seed
    (mockD1 as any)._store.set("github_installations", [{
      user_id: userId,
      installation_id: 456,
    }]);

    const program = Effect.gen(function* () {
      const service = yield* GitHubService;
      yield* service.deleteInstallation(userId);
      return yield* service.getInstallation(userId);
    });

    const result = await Effect.runPromise(Effect.provide(program, layer));
    expect(Option.isNone(result)).toBe(true);
  });
});
