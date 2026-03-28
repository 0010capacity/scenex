/**
 * AI Provider Factory
 * Creates AI provider instances based on configuration
 */

import type { AIProvider, AIProviderType } from './types';
import { ClaudeProvider } from './providers/claude';
import { MockProvider } from './providers/mock';

let currentProvider: AIProvider | null = null;
let currentProviderType: AIProviderType | null = null;

/**
 * Create an AI provider instance
 */
export function createAIProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case 'claude':
      return new ClaudeProvider();
    case 'mock':
      return new MockProvider();
    case 'openai':
    case 'anthropic':
      // Placeholder for future providers
      console.warn(`Provider '${type}' is not yet implemented, falling back to Claude.`);
      return new ClaudeProvider();
    default:
      console.warn(`Unknown provider type '${type}', falling back to Claude.`);
      return new ClaudeProvider();
  }
}

/**
 * Get or create the current AI provider
 */
export function getAIProvider(type?: AIProviderType): AIProvider {
  if (type && type !== currentProviderType) {
    currentProviderType = type;
    currentProvider = createAIProvider(type);
  }

  if (!currentProvider) {
    currentProviderType = 'claude';
    currentProvider = new ClaudeProvider();
  }

  return currentProvider;
}

/**
 * Set the current AI provider type
 */
export function setAIProviderType(type: AIProviderType): void {
  currentProviderType = type;
  currentProvider = createAIProvider(type);
}

/**
 * Get the current provider type
 */
export function getCurrentProviderType(): AIProviderType | null {
  return currentProviderType;
}
