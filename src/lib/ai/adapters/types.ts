// Provider Adapter Interface
// Each provider implements this interface for a plugin-based architecture

import type { LanguageModel } from 'ai';
import type { ModelConfig, ProviderCapabilities } from '@/config/providers';

/**
 * Parameters passed to getProviderOptions for provider-specific configurations
 */
export interface ProviderOptionsParams {
  thinking?: { enabled: boolean; budget?: number };
  modelConfig: ModelConfig;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Provider metadata for UI display and configuration
 */
export interface ProviderMetadata {
  /** Unique identifier matching ProviderType */
  id: string;
  /** Display name for UI */
  displayName: string;
  /** Brand color (hex) for UI theming */
  brandColor: string;
  /** Environment variable name for API key */
  envKeyName: string;
  /** Whether this is a local provider (like Ollama) */
  isLocal: boolean;
  /** Custom base URL (for Ollama, self-hosted) */
  baseUrl?: string;
  /** Description for settings UI */
  description?: string;
}

/**
 * Provider adapter interface - each provider implements this
 */
export interface ProviderAdapter extends ProviderMetadata {
  /**
   * Create the AI SDK client for this provider
   * @param apiKey Optional API key (uses env var if not provided)
   * @returns Provider client instance
   */
  createClient(apiKey?: string): unknown;

  /**
   * Get a language model instance from the client
   * @param client The provider client from createClient
   * @param modelName The model name to instantiate
   * @returns LanguageModel instance for use with Vercel AI SDK
   */
  getLanguageModel(client: unknown, modelName: string): LanguageModel;

  /**
   * Check if provider is configured (has API key or is locally available)
   * @param apiKey Optional client-provided API key
   * @returns Boolean or Promise<boolean> indicating if provider is ready
   */
  isConfigured(apiKey?: string): boolean | Promise<boolean>;

  /**
   * Get provider-specific options for streamText/generateText
   * Used for features like Anthropic's thinking, DeepSeek reasoning, etc.
   * @param params Parameters including thinking config and model config
   * @returns Provider options object to merge into stream options
   */
  getProviderOptions?(params: ProviderOptionsParams): Record<string, unknown>;

  /**
   * Get default models for this provider
   * Used primarily by Ollama for dynamic model discovery
   * @returns Array of ModelConfig or Promise for async discovery
   */
  getAvailableModels?(): ModelConfig[] | Promise<ModelConfig[]>;

  /**
   * Get default capabilities for models from this provider
   * Used when creating dynamic model configs (e.g., Ollama)
   */
  getDefaultCapabilities?(): ProviderCapabilities;
}

/**
 * Helper type for creating adapter with required fields
 */
export type CreateProviderAdapter = Omit<ProviderAdapter, 'getAvailableModels' | 'getDefaultCapabilities' | 'getProviderOptions'> & {
  getProviderOptions?: ProviderAdapter['getProviderOptions'];
  getAvailableModels?: ProviderAdapter['getAvailableModels'];
  getDefaultCapabilities?: ProviderAdapter['getDefaultCapabilities'];
};

/**
 * Standard capabilities for cloud-hosted LLM providers
 */
export const DEFAULT_CLOUD_CAPABILITIES: ProviderCapabilities = {
  supportsStreaming: true,
  supportsThinking: false,
  supportsTemperature: true,
  temperatureRange: { min: 0, max: 2, default: 1 },
  supportsSystemPrompt: true,
  supportsMaxTokens: true,
  maxOutputTokens: 4096,
};

/**
 * Standard capabilities for local LLM providers (Ollama)
 */
export const DEFAULT_LOCAL_CAPABILITIES: ProviderCapabilities = {
  supportsStreaming: true,
  supportsThinking: false,
  supportsTemperature: true,
  temperatureRange: { min: 0, max: 2, default: 0.7 },
  supportsSystemPrompt: true,
  supportsMaxTokens: true,
  maxOutputTokens: 4096,
};
