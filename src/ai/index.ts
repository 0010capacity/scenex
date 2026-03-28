/**
 * AI Module
 * Provides abstraction layer for AI providers (Claude CLI, OpenAI, etc.)
 */

// Types and interfaces
export * from './types';

// Provider implementations
export { ClaudeProvider } from './providers/claude';
export { MockProvider } from './providers/mock';

// Factory functions
export {
  createAIProvider,
  getAIProvider,
  setAIProviderType,
  getCurrentProviderType,
} from './provider-factory';
