import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

// Mock API
vi.mock('../lib/api', () => ({
  api: {
    getSessions: vi.fn(() => Promise.resolve([])),
    createSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    startSession: vi.fn(),
  },
}))
