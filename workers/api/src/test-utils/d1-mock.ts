/**
 * Mock D1 database for testing.
 * Implements a subset of the D1 interface used by shipbox-api.
 */
export function createMockD1() {
  // Store table data as arrays of objects
  const store = new Map<string, any[]>();
  store.set("user_sessions", []);
  store.set("user_balances", [
    { user_id: "user-123", balance_credits: 1000, updated_at: Math.floor(Date.now() / 1000) }
  ]);
  store.set("transactions", []);
  store.set("user_api_keys", []);
  store.set("user_box_secrets", []);
  store.set("github_installations", []);

  const prepare = (query: string) => {
    const upQuery = query.toUpperCase();
    return {
      bind: (...args: any[]) => {
        const stmt = {
          all: async () => {
            const tableNameMatch = query.match(/FROM\s+(\w+)/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : "";
            let results = store.get(tableName) || [];

            if (upQuery.includes("WHERE USER_ID = ?")) {
              const userId = args[0];
              results = results.filter((r) => r.user_id === userId);
            }

            if (upQuery.includes("SELECT COUNT(*)")) {
              return { results: [{ count: results.length }] };
            }

            if (upQuery.includes("SELECT SUM(ABS(AMOUNT_CREDITS))")) {
              const userId = args[0];
              const periodStart = args[1];
              const total = results
                .filter(r => r.user_id === userId && r.amount_credits < 0 && r.created_at >= periodStart)
                .reduce((acc, r) => acc + Math.abs(r.amount_credits), 0);
              return { results: [{ total }] };
            }

            if (upQuery.includes("ORDER BY CREATED_AT DESC")) {
              results = [...results].sort((a, b) => b.created_at - a.created_at);
            }

            return { results };
          },

          first: async () => {
            const upQuery = query.toUpperCase();
            if (upQuery.includes("SELECT SUM(ABS(AMOUNT_CREDITS))")) {
              const userId = args[0];
              const periodStart = args[1];
              const tableNameMatch = query.match(/FROM\s+(\w+)/i);
              const tableName = tableNameMatch ? tableNameMatch[1] : "";
              const results = store.get(tableName) || [];
              const total = results
                .filter(r => r.user_id === userId && r.amount_credits < 0 && r.created_at >= periodStart)
                .reduce((acc, r) => acc + Math.abs(r.amount_credits), 0);
              return { total };
            }

            const tableNameMatch = query.match(/FROM\s+(\w+)/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : "";
            let results = store.get(tableName) || [];

            if (upQuery.includes("WHERE USER_ID = ? AND SESSION_ID = ?")) {
              const [userId, sessionId] = args;
              return results.find((r) => r.user_id === userId && r.session_id === sessionId) || null;
            }

            if (upQuery.includes("WHERE USER_ID = ? AND ID = ?")) {
              const [userId, id] = args;
              return results.find((r) => r.user_id === userId && r.id === id) || null;
            }

            if (upQuery.includes("WHERE USER_ID = ?")) {
              const userId = args[0];
              return results.find((r) => r.user_id === userId) || null;
            }

            return results[0] || null;
          },

          run: async () => {
            const tableNameMatch = query.match(/(?:INSERT\s+INTO|FROM|UPDATE|DELETE\s+FROM)\s+(\w+)/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : "";
            
            if (upQuery.startsWith("INSERT")) {
              const current = store.get(tableName) || [];
              if (tableName === "user_sessions") {
                const [userId, sessionId, createdAt] = args;
                store.set(tableName, [...current, { user_id: userId, session_id: sessionId, created_at: createdAt }]);
              } else if (tableName === "user_balances") {
                const [userId, balanceCredits, updatedAt] = args;
                const existing = current.find(r => r.user_id === userId);
                if (existing) {
                  if (upQuery.includes("BALANCE_CREDITS + ?")) {
                    existing.balance_credits += balanceCredits;
                  } else {
                    existing.balance_credits = balanceCredits;
                  }
                  existing.updated_at = updatedAt;
                } else {
                  store.set(tableName, [...current, { user_id: userId, balance_credits: balanceCredits, updated_at: updatedAt }]);
                }
              } else if (tableName === "transactions") {
                const [id, userId, amount, type, description, createdAt, metadata] = args;
                store.set(tableName, [...current, { id, user_id: userId, amount_credits: amount, type, description, created_at: createdAt, metadata }]);
              } else if (tableName === "user_api_keys") {
                const [userId, encrypted, hint, createdAt] = args;
                const filtered = current.filter(r => r.user_id !== userId);
                store.set(tableName, [...filtered, { user_id: userId, anthropic_key_encrypted: encrypted, key_hint: hint, created_at: createdAt }]);
              } else if (tableName === "github_installations") {
                const [userId, instId, login, type, createdAt] = args;
                const filtered = current.filter(r => r.user_id !== userId);
                store.set(tableName, [...filtered, { user_id: userId, installation_id: instId, account_login: login, account_type: type, created_at: createdAt }]);
              } else if (tableName === "user_box_secrets") {
                const [id, userId, name, encrypted, hint, createdAt] = args;
                store.set(tableName, [...current, { id, user_id: userId, name, encrypted_value: encrypted, hint, created_at: createdAt }]);
              }
            } else if (upQuery.startsWith("UPDATE")) {
              if (tableName === "user_box_secrets") {
                const [lastUsed, id] = args;
                const current = store.get(tableName) || [];
                const item = current.find(r => r.id === id);
                if (item) item.last_used = lastUsed;
              }
            } else if (upQuery.startsWith("DELETE")) {
              if (tableName === "user_sessions") {
                const [userId, sessionId] = args;
                const current = store.get(tableName) || [];
                const filtered = current.filter((r) => !(r.user_id === userId && r.session_id === sessionId));
                store.set(tableName, filtered);
              } else if (tableName === "user_api_keys" || tableName === "github_installations") {
                const [userId] = args;
                const current = store.get(tableName) || [];
                const filtered = current.filter((r) => r.user_id !== userId);
                store.set(tableName, filtered);
              } else if (tableName === "user_box_secrets") {
                const [userId, id] = args;
                const current = store.get(tableName) || [];
                const filtered = current.filter((r) => !(r.user_id === userId && r.id === id));
                store.set(tableName, filtered);
              }
            }
            return { meta: { changes: 1 } };
          },
        };
        return stmt;
      },
    };
  };

  const batch = async (statements: any[]) => {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  };

  return {
    prepare,
    batch,
    _store: store,
  } as unknown as D1Database & { _store: Map<string, any[]> };
}
