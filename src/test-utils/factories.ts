import type { Sandbox } from '../lib/api';

let idCounter = 0;

export const sandboxFactory = (overrides?: Partial<Sandbox>): Sandbox => {
  const id = ++idCounter;
  return {
    id: `sb-${id}`,
    sessionId: `sess-${id}`,
    sandboxId: `sandbox-${id}`,
    status: 'active',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    workspacePath: '/workspace',
    webUiUrl: `https://sandbox-${id}.shipbox.dev`,
    title: `Sandbox ${id}`,
    ...overrides,
  };
};

export const settingsFactory = (overrides?: { anthropicHint: string | null }) => ({
  anthropicHint: null,
  ...overrides,
});

export const githubStatusFactory = (overrides?: Partial<{ installationId: number; accountLogin: string; accountType: string }> | null) => {
  if (overrides === null) return null;
  return {
    installationId: 123,
    accountLogin: 'test-user',
    accountType: 'User',
    ...overrides,
  } as { installationId: number; accountLogin: string; accountType: string };
};

export const balanceFactory = (overrides?: Partial<{ userId: string; balanceCredits: number; updatedAt: number }>) => ({
  userId: 'test-user',
  balanceCredits: 0,
  updatedAt: Date.now(),
  ...overrides,
} as { userId: string; balanceCredits: number; updatedAt: number });
