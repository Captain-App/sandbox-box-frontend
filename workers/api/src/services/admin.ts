import { Context, Effect, Layer } from "effect";
import { SessionStorageError } from "@shipbox/shared";

export interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  totalSessions: number;
  activeSessions: number;
  totalRevenue: number;
  revenueToday: number;
}

export interface AdminUser {
  userId: string;
  email?: string;
  balanceCredits: number;
  sessionCount: number;
  lastActivity: number;
}

export interface AdminUserDetails extends AdminUser {
  githubInstallation?: {
    installationId: number;
    accountLogin: string;
    accountType: string;
  };
  boxSecrets: {
    id: string;
    name: string;
    hint: string;
    createdAt: number;
  }[];
  apiKeys: {
    name: string;
    keyHint: string;
    createdAt: number;
  }[];
  sessions: AdminSession[];
}

export interface AdminSession {
  sessionId: string;
  userId: string;
  status: string;
  createdAt: number;
  lastActivity: number;
  title?: string;
}

export interface AdminServiceInterface {
  readonly getStats: () => Effect.Effect<AdminStats, SessionStorageError>;
  readonly listUsers: (limit: number, offset: number) => Effect.Effect<AdminUser[], SessionStorageError>;
  readonly searchUsers: (query: string) => Effect.Effect<AdminUser[], SessionStorageError>;
  readonly getUserDetails: (userId: string) => Effect.Effect<AdminUserDetails, SessionStorageError>;
  readonly listSessions: (limit: number, offset: number, status?: string) => Effect.Effect<AdminSession[], SessionStorageError>;
  readonly listTransactions: (limit: number, offset: number, userId?: string) => Effect.Effect<any[], SessionStorageError>;
}

export class AdminService extends Context.Tag("AdminService")<
  AdminService,
  AdminServiceInterface
>() {}

function makeD1AdminService(db: D1Database): AdminServiceInterface {
  return {
    getStats: () =>
      Effect.tryPromise({
        try: async () => {
          const now = Math.floor(Date.now() / 1000);
          const oneDayAgo = now - 24 * 60 * 60;

          const stats = await db.batch([
            db.prepare("SELECT COUNT(*) as count FROM user_balances"),
            db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM transactions WHERE created_at >= ?").bind(oneDayAgo),
            db.prepare("SELECT COUNT(*) as count FROM user_sessions"),
            db.prepare("SELECT SUM(amount_credits) as total FROM transactions WHERE amount_credits > 0 AND type = 'top-up'"),
            db.prepare("SELECT SUM(amount_credits) as total FROM transactions WHERE amount_credits > 0 AND type = 'top-up' AND created_at >= ?").bind(oneDayAgo),
          ]);

          return {
            totalUsers: (stats[0].results[0]?.count as number) || 0,
            activeUsers24h: (stats[1].results[0]?.count as number) || 0,
            totalSessions: (stats[2].results[0]?.count as number) || 0,
            activeSessions: 0, 
            totalRevenue: Math.abs((stats[3].results[0]?.total as number) || 0),
            revenueToday: Math.abs((stats[4].results[0]?.total as number) || 0),
          };
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    listUsers: (limit, offset) =>
      Effect.tryPromise({
        try: async () => {
          const { results } = await db.prepare(`
            SELECT 
              ub.user_id, 
              ub.balance_credits, 
              COUNT(DISTINCT us.session_id) as session_count,
              MAX(us.created_at) as last_activity,
              gi.account_login
            FROM user_balances ub
            LEFT JOIN user_sessions us ON ub.user_id = us.user_id
            LEFT JOIN github_installations gi ON ub.user_id = gi.user_id
            GROUP BY ub.user_id
            ORDER BY last_activity DESC NULLS LAST
            LIMIT ? OFFSET ?
          `).bind(limit, offset).all();

          return results.map((r: any) => ({
            userId: r.user_id,
            email: r.account_login, // Use GitHub login as a proxy for email for now since we don't store email in D1
            balanceCredits: r.balance_credits,
            sessionCount: r.session_count,
            lastActivity: r.last_activity || 0,
          }));
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    searchUsers: (query) =>
      Effect.tryPromise({
        try: async () => {
          const sqlQuery = `
            SELECT 
              ub.user_id, 
              ub.balance_credits, 
              COUNT(DISTINCT us.session_id) as session_count,
              MAX(us.created_at) as last_activity,
              gi.account_login
            FROM user_balances ub
            LEFT JOIN user_sessions us ON ub.user_id = us.user_id
            LEFT JOIN github_installations gi ON ub.user_id = gi.user_id
            WHERE ub.user_id LIKE ? OR gi.account_login LIKE ?
            GROUP BY ub.user_id
            ORDER BY last_activity DESC NULLS LAST
            LIMIT 20
          `;
          const pattern = `%${query}%`;
          const { results } = await db.prepare(sqlQuery).bind(pattern, pattern).all();

          return results.map((r: any) => ({
            userId: r.user_id,
            email: r.account_login,
            balanceCredits: r.balance_credits,
            sessionCount: r.session_count,
            lastActivity: r.last_activity || 0,
          }));
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    getUserDetails: (userId) =>
      Effect.tryPromise({
        try: async () => {
          const [balanceRes, githubRes, secretsRes, keysRes, sessionsRes] = await db.batch([
            db.prepare("SELECT * FROM user_balances WHERE user_id = ?").bind(userId),
            db.prepare("SELECT * FROM github_installations WHERE user_id = ?").bind(userId),
            db.prepare("SELECT id, name, hint, created_at FROM user_box_secrets WHERE user_id = ?").bind(userId),
            db.prepare("SELECT name, key_hint, created_at FROM user_shipbox_api_keys WHERE user_id = ?").bind(userId),
            db.prepare("SELECT user_id, session_id, created_at FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC").bind(userId),
          ]);

          const balance = balanceRes.results[0] as any;
          if (!balance) {
            throw new Error(`User ${userId} not found`);
          }

          const github = githubRes.results[0] as any;
          const secrets = secretsRes.results as any[];
          const keys = keysRes.results as any[];
          const stats = sessionsRes.results[0] as any;

          return {
            userId: balance.user_id,
            email: github?.account_login,
            balanceCredits: balance.balance_credits,
            sessionCount: stats?.count || 0,
            lastActivity: stats?.last_activity || 0,
            githubInstallation: github ? {
              installationId: github.installation_id,
              accountLogin: github.account_login,
              accountType: github.account_type,
            } : undefined,
            boxSecrets: secrets.map(s => ({
              id: s.id,
              name: s.name,
              hint: s.hint,
              createdAt: s.created_at,
            })),
            apiKeys: keys.map(k => ({
              name: k.name,
              keyHint: k.key_hint,
              createdAt: k.created_at,
            })),
            sessions: sessionsRes.results.map((s: any) => ({
              sessionId: s.session_id,
              userId: s.user_id,
              status: "unknown",
              createdAt: s.created_at,
              lastActivity: s.created_at,
            })),
          };
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    listSessions: (limit, offset, status) =>
      Effect.tryPromise({
        try: async () => {
          let query = "SELECT user_id, session_id, created_at FROM user_sessions";
          let params: any[] = [];
          query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
          params.push(limit, offset);

          const { results } = await db.prepare(query).bind(...params).all();

          return results.map((r: any) => ({
            sessionId: r.session_id,
            userId: r.user_id,
            status: "unknown",
            createdAt: r.created_at,
            lastActivity: r.created_at,
          }));
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),

    listTransactions: (limit, offset, userId) =>
      Effect.tryPromise({
        try: async () => {
          let query = "SELECT * FROM transactions";
          let params: any[] = [];

          if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
          }

          query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
          params.push(limit, offset);

          const { results } = await db.prepare(query).bind(...params).all();
          return results;
        },
        catch: (error) => new SessionStorageError({ 
          cause: error instanceof Error ? error.message : String(error) 
        }),
      }),
  };
}

export function makeAdminServiceLayer(db: D1Database): Layer.Layer<AdminService> {
  return Layer.succeed(AdminService, makeD1AdminService(db));
}
