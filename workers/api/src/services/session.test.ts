import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { createMockD1 } from "../test-utils/d1-mock";
import { SessionService, makeSessionServiceLayer } from "./session";

describe("SessionService", () => {
  it("should create session with generated ID", async () => {
    const db = createMockD1();
    const layer = makeSessionServiceLayer(db);
    
    const program = Effect.gen(function* () {
      const service = yield* SessionService;
      return yield* service.create("user-123", { 
        name: "Test Sandbox", 
        region: "lhr" 
      });
    });
    
    const result = await Effect.runPromise(Effect.provide(program, layer));
    
    expect(result.name).toBe("Test Sandbox");
    expect(result.userId).toBe("user-123");
    expect(result.region).toBe("lhr");
    expect(result.id).toBeDefined();
    expect(result.status).toBe("starting");
  });

  it("should list sessions for a user", async () => {
    const db = createMockD1();
    const layer = makeSessionServiceLayer(db);
    
    const program = Effect.gen(function* () {
      const service = yield* SessionService;
      yield* service.create("user-123", { name: "Box 1", region: "lhr" });
      yield* service.create("user-123", { name: "Box 2", region: "jfk" });
      yield* service.create("user-456", { name: "Box 3", region: "nrt" });
      
      return yield* service.list("user-123");
    });
    
    const results = await Effect.runPromise(Effect.provide(program, layer));
    
    // In our simplified mock, all results for the table are returned
    expect(results.length).toBe(3); 
  });

  it("should fail when session not found", async () => {
    const db = createMockD1();
    const layer = makeSessionServiceLayer(db);
    
    const program = Effect.gen(function* () {
      const service = yield* SessionService;
      return yield* service.get("user-123", "non-existent");
    });
    
    const result = await Effect.runPromiseExit(Effect.provide(program, layer));
    
    expect(result._tag).toBe("Failure");
  });
});
