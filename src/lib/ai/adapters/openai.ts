// OpenAI Provider Adapter
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';

type OpenAIClient = ReturnType<typeof createOpenAI>;

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  displayName: 'OpenAI',
  brandColor: '#22c55e',
  envKeyName: 'OPENAI_API_KEY',
  isLocal: false,
  description: 'GPT models from OpenAI',

  createClient(apiKey?: string): OpenAIClient {
    return createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const openaiClient = client as OpenAIClient;
    return openaiClient(modelName);
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.OPENAI_API_KEY);
  },

  getProviderOptions(params: ProviderOptionsParams): Record<string, unknown> {
    // OpenAI thinking/reasoning is handled differently than Anthropic
    // For now, return empty object - can be extended for o1 reasoning
    if (params.thinking?.enabled && params.modelConfig.capabilities.supportsThinking) {
      // OpenAI o1 models handle reasoning internally, no special options needed
      return {};
    }
    return {};
  },
};
