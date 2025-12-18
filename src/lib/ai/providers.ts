// AI Provider abstraction using Vercel AI SDK
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ProviderType, getModelById } from '@/config/providers';

// Provider client cache (only for env var-based clients)
const providerClients: Map<ProviderType, ReturnType<typeof createProviderClient>> = new Map();

function createProviderClient(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'openai':
      return createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
      });
    case 'anthropic':
      return createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      });
    case 'google':
      return createGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getProviderClient(provider: ProviderType, apiKey?: string) {
  // If a custom API key is provided, create a fresh client (don't cache)
  if (apiKey) {
    return createProviderClient(provider, apiKey);
  }

  // Otherwise use cached client with env var
  let client = providerClients.get(provider);
  if (!client) {
    client = createProviderClient(provider);
    providerClients.set(provider, client);
  }
  return client;
}

export interface ExecuteRequest {
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string; // Client-provided API key (from localStorage)
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    thinking?: {
      enabled: boolean;
      budget?: number;
    };
  };
}

export function getLanguageModel(modelId: string, apiKey?: string) {
  const modelConfig = getModelById(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const client = getProviderClient(modelConfig.provider, apiKey);

  // Return the appropriate model based on provider
  switch (modelConfig.provider) {
    case 'openai':
      return client(modelConfig.name);
    case 'anthropic':
      return client(modelConfig.name);
    case 'google':
      return client(modelConfig.name);
    default:
      throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }
}

// Check if a provider has a valid API key configured
export function isProviderConfigured(provider: ProviderType): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    default:
      return false;
  }
}

// Get all configured providers
export function getConfiguredProviders(): ProviderType[] {
  const providers: ProviderType[] = ['openai', 'anthropic', 'google'];
  return providers.filter(isProviderConfigured);
}
