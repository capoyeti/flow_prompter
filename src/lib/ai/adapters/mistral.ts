// Mistral Provider Adapter
import { createMistral } from '@ai-sdk/mistral';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';

type MistralClient = ReturnType<typeof createMistral>;

export const mistralAdapter: ProviderAdapter = {
  id: 'mistral',
  displayName: 'Mistral',
  brandColor: '#ff7000',
  envKeyName: 'MISTRAL_API_KEY',
  isLocal: false,
  description: 'Mistral AI models',

  createClient(apiKey?: string): MistralClient {
    return createMistral({
      apiKey: apiKey || process.env.MISTRAL_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const mistralClient = client as MistralClient;
    // Type assertion needed due to SDK version mismatch between V1/V2
    return mistralClient(modelName) as unknown as LanguageModel;
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.MISTRAL_API_KEY);
  },

  getProviderOptions(_params: ProviderOptionsParams): Record<string, unknown> {
    // Mistral doesn't have special thinking/reasoning options yet
    return {};
  },
};
