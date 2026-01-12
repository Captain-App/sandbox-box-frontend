import { supabase } from './supabase';

export const adminApi = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://backend.shipbox.dev/admin',
  
  async getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  },

  async fetch(path: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      // Don't auto-logout here, let AuthContext handle it if needed
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Admin API error: ${res.status} ${error}`);
    }

    return res.json();
  },

  async getStats() {
    return this.fetch('/stats');
  },

  async searchUsers(query: string) {
    return this.fetch(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async getUserDetails(userId: string) {
    return this.fetch(`/users/${userId}`);
  },

  async listUsers(limit = 50, offset = 0) {
    return this.fetch(`/users?limit=${limit}&offset=${offset}`);
  },

  async listSessions(limit = 50, offset = 0) {
    return this.fetch(`/sessions?limit=${limit}&offset=${offset}`);
  },

  async listTransactions(userId?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (userId) params.append('userId', userId);
    return this.fetch(`/transactions?${params.toString()}`);
  },

  async getSessionLogs(sessionId: string) {
    return this.fetch(`/sessions/${sessionId}/logs`);
  },

  async getSessionMetadata(sessionId: string) {
    return this.fetch(`/sessions/${sessionId}/metadata`);
  }
};
