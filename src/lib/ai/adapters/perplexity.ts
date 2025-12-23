// Perplexity Provider Adapter
import { createPerplexity } from '@ai-sdk/perplexity';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';
import type { ProviderCapabilities } from '@/config/providers';

type PerplexityClient = ReturnType<typeof createPerplexity>;

// Extended capabilities for Perplexity's unique features
export interface PerplexityCapabilities extends ProviderCapabilities {
  supportsWebSearch: boolean;
  supportsCitations: boolean;
}

export const perplexityAdapter: ProviderAdapter = {
  id: 'perplexity',
  displayName: 'Perplexity',
  brandColor: '#20b2aa',
  envKeyName: 'PERPLEXITY_API_KEY',
  isLocal: false,
  description: 'Perplexity AI with web search and citations',

  createClient(apiKey?: string): PerplexityClient {
    return createPerplexity({
      apiKey: apiKey || process.env.PERPLEXITY_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const perplexityClient = client as PerplexityClient;
    return perplexityClient(modelName);
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.PERPLEXITY_API_KEY);
  },

  getProviderOptions(_params: ProviderOptionsParams): Record<string, unknown> {
    // Perplexity models have built-in web search - no special options needed
    // Citations are automatically included in responses
    return {};
  },

  getDefaultCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 0.7 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 4096,
    };
  },
};
