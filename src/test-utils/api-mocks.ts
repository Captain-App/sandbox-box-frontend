import { vi } from "vitest";

export function createMockApi() {
  return {
    getSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    reportUsage: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({ anthropicHint: null }),
    setAnthropicKey: vi.fn(),
    deleteAnthropicKey: vi.fn(),
    getGitHubStatus: vi.fn().mockResolvedValue(null),
    disconnectGitHub: vi.fn(),
    getBalance: vi.fn().mockResolvedValue({ balanceCredits: 0 }),
    createCheckoutSession: vi.fn(),
  };
}

export type MockedApi = ReturnType<typeof createMockApi>;
