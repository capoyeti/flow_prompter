// Google Provider Adapter
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';

type GoogleClient = ReturnType<typeof createGoogleGenerativeAI>;

export const googleAdapter: ProviderAdapter = {
  id: 'google',
  displayName: 'Google',
  brandColor: '#3b82f6',
  envKeyName: 'GOOGLE_GENERATIVE_AI_API_KEY',
  isLocal: false,
  description: 'Gemini models from Google',

  createClient(apiKey?: string): GoogleClient {
    return createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const googleClient = client as GoogleClient;
    return googleClient(modelName);
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  },

  getProviderOptions(params: ProviderOptionsParams): Record<string, unknown> {
    // Google Gemini thinking is handled internally by the model
    if (params.thinking?.enabled && params.modelConfig.capabilities.supportsThinking) {
      // Gemini models may support thinking in future - placeholder
      return {};
    }
    return {};
  },
};
