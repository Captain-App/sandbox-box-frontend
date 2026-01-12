import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock window.location for tests that need it
if (typeof window !== 'undefined') {
  const originalLocation = window.location;
  // We can't delete window.location, but we can mock its properties
  Object.defineProperty(window, 'location', {
    value: {
      ...originalLocation,
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    configurable: true,
    writable: true,
  });
}
