// Provider Adapters - Auto-registration
// Import this file to ensure all providers are registered

import { registerProvider } from './registry';

// Import existing provider adapters
import { openaiAdapter } from './openai';
import { anthropicAdapter } from './anthropic';
import { googleAdapter } from './google';

// Import new provider adapters
import { mistralAdapter } from './mistral';
import { deepseekAdapter } from './deepseek';
import { perplexityAdapter } from './perplexity';
import { ollamaAdapter } from './ollama';

// Register built-in cloud providers
registerProvider(openaiAdapter);
registerProvider(anthropicAdapter);
registerProvider(googleAdapter);

// Register new cloud providers
registerProvider(mistralAdapter);
registerProvider(deepseekAdapter);
registerProvider(perplexityAdapter);

// Register local providers
registerProvider(ollamaAdapter);

// Re-export registry functions for convenience
export {
  providerRegistry,
  registerProvider,
  getProvider,
  getAllProviders,
  getProviderIds
} from './registry';

// Re-export types
export type {
  ProviderAdapter,
  ProviderMetadata,
  ProviderOptionsParams,
  CreateProviderAdapter
} from './types';

// Re-export individual adapters for direct access
export { openaiAdapter } from './openai';
export { anthropicAdapter } from './anthropic';
export { googleAdapter } from './google';
export { mistralAdapter } from './mistral';
export { deepseekAdapter } from './deepseek';
export { perplexityAdapter } from './perplexity';
export { ollamaAdapter } from './ollama';
