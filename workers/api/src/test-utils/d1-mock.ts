/**
 * Mock D1 database for testing.
 * Implements the minimal subset of D1 interface needed for tests.
 */
export function createMockD1() {
  const store = new Map<string, any[]>();

  const prepare = (query: string) => {
    return {
      bind: (...args: any[]) => {
        return {
          all: async () => {
            // Very simple mock: returns everything for a table
            const tableName = query.match(/FROM\s+(\w+)/i)?.[1];
            return { results: store.get(tableName || "") || [] };
          },
          first: async () => {
            const tableName = query.match(/FROM\s+(\w+)/i)?.[1];
            const items = store.get(tableName || "") || [];
            // Simple ID matching
            const id = args[0];
            return items.find(i => i.id === id) || null;
          },
          run: async () => {
            // Simple INSERT/UPDATE/DELETE mock
            if (query.toUpperCase().startsWith('INSERT')) {
              const tableName = query.match(/INSERT\s+INTO\s+(\w+)/i)?.[1];
              if (tableName) {
                const current = store.get(tableName) || [];
                // This is a hack, but enough for simple tests
                // In real tests we'd want better SQL parsing
                const item: any = {};
                // ... logic to map args to columns ...
                // For now, let's just assume args are in the right order for our sessions table
                if (tableName === 'sessions') {
                   const [id, userId, name, region, repository, status, createdAt, lastActivity] = args;
                   store.set(tableName, [...current, { id, userId, name, region, repository, status, createdAt, lastActivity }]);
                }
              }
            } else if (query.toUpperCase().startsWith('DELETE')) {
              const tableName = query.match(/FROM\s+(\w+)/i)?.[1];
              const id = args[0];
              if (tableName) {
                const current = store.get(tableName) || [];
                const filtered = current.filter(i => i.id !== id);
                const changes = current.length - filtered.length;
                store.set(tableName, filtered);
                return { meta: { changes } };
              }
            }
            return { meta: { changes: 1 } };
          }
        };
      }
    };
  };

  return {
    prepare,
    _store: store,
    // Add other D1 methods as needed, or cast to D1Database
  } as unknown as D1Database & { _store: Map<string, any[]> };
}
