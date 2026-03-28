import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock localStorage for zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
  localStorageMock.clear();
});

beforeEach(() => {
  localStorageMock.clear();
});
