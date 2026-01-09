// AI Provider abstraction using Vercel AI SDK
// Now uses the adapter registry for extensibility

import { ProviderType, getModelConfigDynamic } from '@/config/providers';
import { getProvider, getAllProviders } from './adapters';

// Provider client cache (only for env var-based clients)
const providerClients: Map<string, unknown> = new Map();

/**
 * Get a provider client, using cache for env var-based clients
 */
export function getProviderClient(provider: ProviderType, apiKey?: string) {
  const adapter = getProvider(provider);
  if (!adapter) {
    throw new Error(`Unknown provider: ${provider}. Make sure it's registered in the adapter registry.`);
  }

  // If a custom API key is provided, create a fresh client (don't cache)
  if (apiKey) {
    return adapter.createClient(apiKey);
  }

  // Otherwise use cached client with env var
  let client = providerClients.get(provider);
  if (!client) {
    client = adapter.createClient();
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

/**
 * Get a language model instance using the adapter registry
 * Supports both static models and dynamically discovered Ollama models
 */
export function getLanguageModel(modelId: string, apiKey?: string) {
  const modelConfig = getModelConfigDynamic(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const adapter = getProvider(modelConfig.provider);
  if (!adapter) {
    throw new Error(`Unknown provider: ${modelConfig.provider}. Make sure it's registered.`);
  }

  const client = getProviderClient(modelConfig.provider, apiKey);
  return adapter.getLanguageModel(client, modelConfig.name);
}

/**
 * Check if a provider has a valid API key configured
 * Uses the adapter's isConfigured method
 */
export function isProviderConfigured(provider: ProviderType): boolean | Promise<boolean> {
  const adapter = getProvider(provider);
  if (!adapter) {
    return false;
  }
  return adapter.isConfigured();
}

/**
 * Get all configured providers (that have API keys or are available)
 * Note: This is synchronous and only checks env vars, not async checks like Ollama
 */
export function getConfiguredProviders(): ProviderType[] {
  const allProviders = getAllProviders();
  const configured: ProviderType[] = [];

  for (const adapter of allProviders) {
    // For sync check, we only check if isConfigured returns a boolean immediately
    const isConfigured = adapter.isConfigured();
    if (typeof isConfigured === 'boolean' && isConfigured) {
      configured.push(adapter.id as ProviderType);
    }
  }

  return configured;
}

/**
 * Get all configured providers including async checks (like Ollama)
 * Use this when you need to check local providers
 */
export async function getConfiguredProvidersAsync(): Promise<ProviderType[]> {
  const allProviders = getAllProviders();
  const configured: ProviderType[] = [];

  for (const adapter of allProviders) {
    const isConfigured = await adapter.isConfigured();
    if (isConfigured) {
      configured.push(adapter.id as ProviderType);
    }
  }

  return configured;
}
