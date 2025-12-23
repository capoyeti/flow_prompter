// Ollama Provider Adapter
// Uses OpenAI-compatible API endpoint for local LLM support
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter, ProviderOptionsParams } from './types';
import type { ModelConfig, ProviderCapabilities } from '@/config/providers';

type OllamaClient = ReturnType<typeof createOpenAI>;

// Default Ollama base URL
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/v1';

export const ollamaAdapter: ProviderAdapter = {
  id: 'ollama',
  displayName: 'Ollama (Local)',
  brandColor: '#1a1a2e',
  envKeyName: 'OLLAMA_BASE_URL', // Not really needed, but for consistency
  isLocal: true,
  baseUrl: DEFAULT_OLLAMA_BASE_URL,
  description: 'Local LLMs via Ollama',

  createClient(baseUrl?: string): OllamaClient {
    // Ollama uses OpenAI-compatible API
    return createOpenAI({
      baseURL: baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
      apiKey: 'ollama', // Ollama doesn't require an API key
    });
  },

  getLanguageModel(client: unknown, modelName: string): LanguageModel {
    const ollamaClient = client as OllamaClient;
    return ollamaClient(modelName);
  },

  async isConfigured(baseUrl?: string): Promise<boolean> {
    const url = baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
    try {
      // Check if Ollama is running by hitting the tags endpoint
      const response = await fetch(`${url.replace('/v1', '')}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  getProviderOptions(_params: ProviderOptionsParams): Record<string, unknown> {
    // Local models don't have special options
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

  async getAvailableModels(): Promise<ModelConfig[]> {
    const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
    try {
      const response = await fetch(`${baseUrl.replace('/v1', '')}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.warn('Ollama not available or returned error');
        return [];
      }

      const data = await response.json() as { models: Array<{ name: string; size: number; details?: { parameter_size?: string } }> };
      const models: ModelConfig[] = [];

      for (const model of data.models || []) {
        // Extract model name (remove :tag if present for display)
        const displayName = model.name.split(':')[0];
        const paramSize = model.details?.parameter_size || '';

        models.push({
          id: `ollama-${model.name}`,
          provider: 'ollama' as const,
          name: model.name,
          displayName: `${displayName}${paramSize ? ` (${paramSize})` : ''}`,
          contextWindow: 4096, // Default, varies by model
          capabilities: this.getDefaultCapabilities!(),
          tier: 2, // Default tier for local models
        });
      }

      return models;
    } catch (error) {
      console.warn('Failed to fetch Ollama models:', error);
      return [];
    }
  },
};
