// AI Provider and Model configurations
// This is the single source of truth for all model capabilities

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'deepseek'
  | 'perplexity'
  | 'ollama';

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsThinking: boolean;
  supportsTemperature: boolean;
  temperatureRange?: { min: number; max: number; default: number };
  supportsSystemPrompt: boolean;
  supportsMaxTokens: boolean;
  maxOutputTokens?: number;
}

export interface ModelConfig {
  id: string;
  provider: ProviderType;
  name: string;
  displayName: string;
  contextWindow: number;
  capabilities: ProviderCapabilities;
  isDefault?: boolean;
  /** Intelligence tier: 1 = most capable, 2 = strong, 3 = fast/efficient */
  tier: 1 | 2 | 3;
}

export const MODELS: ModelConfig[] = [
  // OpenAI Models (ordered by tier)
  {
    id: 'gpt-5.2',
    provider: 'openai',
    name: 'gpt-5.2',
    displayName: 'GPT-5.2',
    contextWindow: 400000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 128000,
    },
    isDefault: true,
    tier: 1, // Most capable
  },
  {
    id: 'gpt-5-mini',
    provider: 'openai',
    name: 'gpt-5-mini',
    displayName: 'GPT-5 Mini',
    contextWindow: 128000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 32000,
    },
    tier: 2, // Strong
  },
  {
    id: 'gpt-5-nano',
    provider: 'openai',
    name: 'gpt-5-nano',
    displayName: 'GPT-5 Nano',
    contextWindow: 128000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 16000,
    },
    tier: 3, // Fast/efficient
  },

  // Anthropic Models (ordered by tier)
  {
    id: 'claude-opus-4-5-20251101',
    provider: 'anthropic',
    name: 'claude-opus-4-5-20251101',
    displayName: 'Claude Opus 4.5',
    contextWindow: 200000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 1, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 64000,
    },
    tier: 1, // Most capable
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    name: 'claude-sonnet-4-5-20250929',
    displayName: 'Claude Sonnet 4.5',
    contextWindow: 200000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 1, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 64000,
    },
    isDefault: true,
    tier: 2, // Strong
  },

  // Google Models (ordered by tier)
  {
    id: 'gemini-3-pro-preview',
    provider: 'google',
    name: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro',
    contextWindow: 200000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 65536,
    },
    tier: 1, // Most capable
  },
  {
    id: 'gemini-3-flash-preview',
    provider: 'google',
    name: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    contextWindow: 1000000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 65536,
    },
    isDefault: true,
    tier: 3, // Fast/efficient
  },

  // Mistral Models
  {
    id: 'mistral-large-latest',
    provider: 'mistral',
    name: 'mistral-large-latest',
    displayName: 'Mistral Large',
    contextWindow: 128000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 1, default: 0.7 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    isDefault: true,
    tier: 1,
  },
  {
    id: 'mistral-small-latest',
    provider: 'mistral',
    name: 'mistral-small-latest',
    displayName: 'Mistral Small',
    contextWindow: 32000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 1, default: 0.7 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    tier: 2,
  },
  {
    id: 'codestral-latest',
    provider: 'mistral',
    name: 'codestral-latest',
    displayName: 'Codestral',
    contextWindow: 32000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 1, default: 0.2 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    tier: 2,
  },

  // DeepSeek Models
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    contextWindow: 64000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 1 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    tier: 2,
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'deepseek-reasoner',
    displayName: 'DeepSeek R1',
    contextWindow: 64000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: true, // R1 has built-in reasoning
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 0.6 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    isDefault: true,
    tier: 1,
  },

  // Perplexity Models
  {
    id: 'sonar-pro',
    provider: 'perplexity',
    name: 'sonar-pro',
    displayName: 'Sonar Pro',
    contextWindow: 200000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 0.7 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    isDefault: true,
    tier: 1,
  },
  {
    id: 'sonar',
    provider: 'perplexity',
    name: 'sonar',
    displayName: 'Sonar',
    contextWindow: 128000,
    capabilities: {
      supportsStreaming: true,
      supportsThinking: false,
      supportsTemperature: true,
      temperatureRange: { min: 0, max: 2, default: 0.7 },
      supportsSystemPrompt: true,
      supportsMaxTokens: true,
      maxOutputTokens: 8192,
    },
    tier: 2,
  },

  // Ollama models are discovered dynamically from the local Ollama instance
  // See /api/ollama/models endpoint and useModelSelector hook
];

// Helper functions
export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: ProviderType): ModelConfig[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getDefaultModels(): ModelConfig[] {
  return MODELS.filter((m) => m.isDefault);
}

export function getProviderColor(provider: ProviderType): string {
  const colors: Record<ProviderType, string> = {
    openai: 'text-green-600',
    anthropic: 'text-orange-500',
    google: 'text-blue-500',
    mistral: 'text-orange-600',
    deepseek: 'text-indigo-600',
    perplexity: 'text-teal-600',
    ollama: 'text-gray-600',
  };
  return colors[provider];
}

export function getProviderBgColor(provider: ProviderType): string {
  const colors: Record<ProviderType, string> = {
    openai: 'bg-green-50',
    anthropic: 'bg-orange-50',
    google: 'bg-blue-50',
    mistral: 'bg-orange-50',
    deepseek: 'bg-indigo-50',
    perplexity: 'bg-teal-50',
    ollama: 'bg-gray-50',
  };
  return colors[provider];
}

/** Get all tier-1 (most capable) models */
export function getTier1Models(): ModelConfig[] {
  return MODELS.filter((m) => m.tier === 1);
}

/** Get the most capable model for a provider */
export function getMostCapableModel(provider: ProviderType): ModelConfig | undefined {
  return MODELS.filter((m) => m.provider === provider).sort((a, b) => a.tier - b.tier)[0];
}

/**
 * Get the best available model based on which providers have API keys.
 * Prioritizes tier-1 models from available providers.
 * @param availableProviders - Array of providers that have API keys configured
 */
export function getBestAvailableModel(availableProviders: ProviderType[]): ModelConfig | undefined {
  if (availableProviders.length === 0) return undefined;

  // Get all tier-1 models from available providers, sorted by our preferred order
  const providerPriority: ProviderType[] = [
    'anthropic',
    'openai',
    'google',
    'deepseek',
    'mistral',
    'perplexity',
    'ollama',
  ];

  for (const provider of providerPriority) {
    if (availableProviders.includes(provider)) {
      const bestForProvider = getMostCapableModel(provider);
      if (bestForProvider) return bestForProvider;
    }
  }

  // Fallback: any model from available providers
  return MODELS.find((m) => availableProviders.includes(m.provider));
}

/** Get models grouped by provider, sorted by tier within each group */
export function getModelsGroupedByProvider(): Record<ProviderType, ModelConfig[]> {
  const grouped: Record<ProviderType, ModelConfig[]> = {
    anthropic: [],
    openai: [],
    google: [],
    mistral: [],
    deepseek: [],
    perplexity: [],
    ollama: [],
  };

  for (const model of MODELS) {
    if (grouped[model.provider]) {
      grouped[model.provider].push(model);
    }
  }

  // Sort each group by tier
  for (const provider of Object.keys(grouped) as ProviderType[]) {
    grouped[provider].sort((a, b) => a.tier - b.tier);
  }

  return grouped;
}

// Card color config for output cards - white cards with colored borders
export interface CardColors {
  // Border color (provider accent)
  border: string;
  // Title text color (matches border)
  title: string;
  // Icon/accent color
  accent: string;
  // Subtle background tint for thinking section
  tint: string;
}

export function getProviderCardColors(provider: ProviderType): CardColors {
  // Uses CSS variables for title and tint colors to support theme switching
  // Border and accent colors remain constant across themes
  const colors: Record<ProviderType, CardColors> = {
    openai: {
      border: '#22c55e',
      title: 'var(--provider-openai-title)',
      accent: '#22c55e',
      tint: 'var(--provider-openai-tint)',
    },
    anthropic: {
      border: '#f97316',
      title: 'var(--provider-anthropic-title)',
      accent: '#f97316',
      tint: 'var(--provider-anthropic-tint)',
    },
    google: {
      border: '#3b82f6',
      title: 'var(--provider-google-title)',
      accent: '#3b82f6',
      tint: 'var(--provider-google-tint)',
    },
    mistral: {
      border: '#ff7000',
      title: 'var(--provider-mistral-title, #ff7000)',
      accent: '#ff7000',
      tint: 'var(--provider-mistral-tint, rgba(255, 112, 0, 0.05))',
    },
    deepseek: {
      border: '#4f46e5',
      title: 'var(--provider-deepseek-title, #4f46e5)',
      accent: '#4f46e5',
      tint: 'var(--provider-deepseek-tint, rgba(79, 70, 229, 0.05))',
    },
    perplexity: {
      border: '#20b2aa',
      title: 'var(--provider-perplexity-title, #20b2aa)',
      accent: '#20b2aa',
      tint: 'var(--provider-perplexity-tint, rgba(32, 178, 170, 0.05))',
    },
    ollama: {
      border: '#1a1a2e',
      title: 'var(--provider-ollama-title, #1a1a2e)',
      accent: '#1a1a2e',
      tint: 'var(--provider-ollama-tint, rgba(26, 26, 46, 0.05))',
    },
  };
  return colors[provider];
}
