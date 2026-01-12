import { Context, Next } from "hono";

export const adminAuth = () => {
  return async (c: Context, next: Next) => {
    // 1. Support legacy static token (for MCP)
    const adminToken = c.req.header("X-Admin-Token");
    const expectedToken = c.env.ADMIN_TOKEN;

    if (expectedToken && adminToken === expectedToken) {
      await next();
      return;
    }

    // 2. Support Supabase Auth with admin role
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // Verify user with Supabase
        const userRes = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: c.env.SUPABASE_ANON_KEY,
          },
        });

        if (userRes.ok) {
          const user = (await userRes.json()) as { id: string };

          // Check role in public.user_roles
          // Users have RLS permission to see their own roles in ghostly
          const roleRes = await fetch(
            `${c.env.SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin&select=role`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: c.env.SUPABASE_ANON_KEY,
              },
            },
          );

          if (roleRes.ok) {
            const roles = (await roleRes.json()) as any[];
            if (roles.length > 0) {
              c.set("user", user);
              await next();
              return;
            }
          }
        }
      } catch (e) {
        console.error("Admin auth error:", e);
      }
    }

    return c.json({ error: "Forbidden: Admin role required" }, 403);
  };
};
