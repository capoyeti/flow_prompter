// Anthropic Provider Adapter
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';

type AnthropicClient = ReturnType<typeof createAnthropic>;

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  displayName: 'Anthropic',
  brandColor: '#f97316',
  envKeyName: 'ANTHROPIC_API_KEY',
  isLocal: false,
  description: 'Claude models from Anthropic',

  createClient(apiKey?: string): AnthropicClient {
    return createAnthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const anthropicClient = client as AnthropicClient;
    return anthropicClient(modelName);
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.ANTHROPIC_API_KEY);
  },

  getProviderOptions(params: ProviderOptionsParams): Record<string, unknown> {
    // Anthropic-specific thinking configuration
    if (params.thinking?.enabled && params.modelConfig.capabilities.supportsThinking) {
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: params.thinking.budget ?? 10000,
          },
        },
      };
    }
    return {};
  },
};
