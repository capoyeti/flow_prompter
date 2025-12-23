// DeepSeek Provider Adapter
import { createDeepSeek } from '@ai-sdk/deepseek';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';

type DeepSeekClient = ReturnType<typeof createDeepSeek>;

export const deepseekAdapter: ProviderAdapter = {
  id: 'deepseek',
  displayName: 'DeepSeek',
  brandColor: '#4f46e5',
  envKeyName: 'DEEPSEEK_API_KEY',
  isLocal: false,
  description: 'DeepSeek AI models with reasoning capabilities',

  createClient(apiKey?: string): DeepSeekClient {
    return createDeepSeek({
      apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const deepseekClient = client as DeepSeekClient;
    return deepseekClient(modelName);
  },

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.DEEPSEEK_API_KEY);
  },

  getProviderOptions(params: ProviderOptionsParams): Record<string, unknown> {
    // DeepSeek R1 has built-in reasoning that outputs in <think> tags
    // The reasoning is automatically captured by the Vercel AI SDK
    if (params.thinking?.enabled && params.modelConfig.capabilities.supportsThinking) {
      // DeepSeek R1 models handle reasoning internally
      // No special options needed - reasoning is part of the response
      return {};
    }
    return {};
  },
};
