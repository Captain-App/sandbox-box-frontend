import { createClient } from "@supabase/supabase-js";
import { Context, Next } from "hono";
import { Effect, Exit } from "effect";
import {
  ShipboxApiKeyService,
  makeShipboxApiKeyServiceLayer,
} from "../services/shipbox-api-keys";

export const supabaseAuth = () => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];

    // Check if it's a Shipbox API key
    if (token.startsWith("sb_")) {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* ShipboxApiKeyService;
          return yield* service.validateKey(token);
        }).pipe(Effect.provide(makeShipboxApiKeyServiceLayer(c.env.DB))),
      );

      if (Exit.isSuccess(result)) {
        c.set("user", { id: result.value });
        await next();
        return;
      }

      return c.json(
        { error: "Unauthorized", details: "Invalid Shipbox API key" },
        401,
      );
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized", details: error?.message }, 401);
    }

    c.set("user", user);
    await next();
  };
};
