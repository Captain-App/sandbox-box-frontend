import { Hono } from "hono";
import { Effect, Exit } from "effect";
import { BoxSecretsService, makeBoxSecretsServiceLayer } from "../services/box-secrets";
import { Bindings, Variables } from "../index";

export const boxSecretsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .get("/", async (c) => {
    const user = c.get("user");
    const layer = makeBoxSecretsServiceLayer(c.env.DB, c.env.PROXY_JWT_SECRET);

    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* BoxSecretsService;
        return yield* service.listSecrets(user.id);
      }).pipe(Effect.provide(layer))
    );

    if (Exit.isFailure(result)) {
      return c.json({ error: "Failed to fetch box secrets" }, 500);
    }

    return c.json(result.value);
  })
  .post("/", async (c) => {
    const user = c.get("user");
    const { name, value } = await c.req.json();

    if (!name || !value) {
      return c.json({ error: "Name and value are required" }, 400);
    }

    const layer = makeBoxSecretsServiceLayer(c.env.DB, c.env.PROXY_JWT_SECRET);
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* BoxSecretsService;
        return yield* service.createSecret(user.id, name, value);
      }).pipe(Effect.provide(layer))
    );

    if (Exit.isFailure(result)) {
      return c.json({ error: "Failed to create box secret" }, 500);
    }

    return c.json(result.value);
  })
  .delete("/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const layer = makeBoxSecretsServiceLayer(c.env.DB, c.env.PROXY_JWT_SECRET);
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* BoxSecretsService;
        yield* service.deleteSecret(user.id, id);
      }).pipe(Effect.provide(layer))
    );

    if (Exit.isFailure(result)) {
      return c.json({ error: "Failed to delete box secret" }, 500);
    }

    return c.json({ success: true });
  });
