// Settings store - manages API keys and application settings
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { STORAGE_KEYS, API_KEY_STORAGE_MAP } from '@/config/constants';
import type { ProviderType, ModelConfig } from '@/config/providers';

// Dynamic API keys interface - supports all providers
type ApiKeys = Record<ProviderType, string>;

// Ollama model info from dynamic discovery
export interface OllamaModelInfo {
  id: string;
  name: string;
  displayName: string;
  size: number;
  sizeFormatted: string;
  parameterSize?: string;
  family?: string;
  supportsThinking: boolean;
}

interface SettingsState {
  // API keys for each provider (from localStorage)
  apiKeys: ApiKeys;

  // Providers configured on the server (via env vars)
  serverConfiguredProviders: ProviderType[];

  // Dynamically discovered Ollama models
  ollamaModels: OllamaModelInfo[];

  // Whether Ollama models have been fetched
  ollamaModelsLoaded: boolean;

  // Settings modal visibility
  isSettingsModalOpen: boolean;

  // Whether user has completed initial onboarding
  hasCompletedOnboarding: boolean;

  // Whether the store has been initialized from localStorage
  isInitialized: boolean;

  // Whether server providers have been fetched
  serverProvidersLoaded: boolean;
}

interface SettingsActions {
  // API key management
  setApiKey: (provider: ProviderType, key: string) => void;
  getApiKey: (provider: ProviderType) => string;
  hasApiKey: (provider: ProviderType) => boolean;
  hasAnyApiKey: () => boolean;
  isProviderAvailable: (provider: ProviderType) => boolean;

  // Modal management
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Onboarding
  completeOnboarding: () => void;

  // Initialization
  loadFromStorage: () => void;
  fetchServerProviders: () => Promise<void>;
  fetchOllamaModels: () => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState: SettingsState = {
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    mistral: '',
    deepseek: '',
    perplexity: '',
    ollama: '', // Ollama uses base URL, not API key
  },
  serverConfiguredProviders: [],
  ollamaModels: [],
  ollamaModelsLoaded: false,
  isSettingsModalOpen: false,
  hasCompletedOnboarding: false,
  isInitialized: false,
  serverProvidersLoaded: false,
};

// Helper to safely get from localStorage
function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper to safely set localStorage
function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  immer((set, get) => ({
    ...initialState,

    // API key management
    setApiKey: (provider, key) => {
      set((state) => {
        state.apiKeys[provider] = key;
      });
      // Persist to localStorage using dynamic mapping
      const storageKey = API_KEY_STORAGE_MAP[provider];
      if (storageKey) {
        setStorageItem(storageKey, key);
      }
    },

    getApiKey: (provider) => get().apiKeys[provider],

    // Returns true if user has entered a key in localStorage
    hasApiKey: (provider) => {
      const key = get().apiKeys[provider];
      return key !== undefined && key.trim().length > 0;
    },

    // Returns true if user has any key in localStorage
    hasAnyApiKey: () => {
      const { apiKeys } = get();
      return Object.values(apiKeys).some((key) => key && key.trim().length > 0);
    },

    // Returns true if provider is available (either via localStorage OR server env var)
    isProviderAvailable: (provider) => {
      const state = get();
      const hasLocalKey = state.apiKeys[provider]?.trim().length > 0;
      const hasServerKey = state.serverConfiguredProviders.includes(provider);
      return hasLocalKey || hasServerKey;
    },

    // Modal management
    openSettingsModal: () =>
      set((state) => {
        state.isSettingsModalOpen = true;
      }),

    closeSettingsModal: () =>
      set((state) => {
        state.isSettingsModalOpen = false;
      }),

    // Onboarding
    completeOnboarding: () => {
      set((state) => {
        state.hasCompletedOnboarding = true;
      });
      setStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    },

    // Initialize from localStorage
    loadFromStorage: () => {
      if (get().isInitialized) return;

      // Load API keys for all providers
      const apiKeys: ApiKeys = {
        openai: getStorageItem(STORAGE_KEYS.API_KEY_OPENAI) ?? '',
        anthropic: getStorageItem(STORAGE_KEYS.API_KEY_ANTHROPIC) ?? '',
        google: getStorageItem(STORAGE_KEYS.API_KEY_GOOGLE) ?? '',
        mistral: getStorageItem(STORAGE_KEYS.API_KEY_MISTRAL) ?? '',
        deepseek: getStorageItem(STORAGE_KEYS.API_KEY_DEEPSEEK) ?? '',
        perplexity: getStorageItem(STORAGE_KEYS.API_KEY_PERPLEXITY) ?? '',
        ollama: getStorageItem(STORAGE_KEYS.OLLAMA_BASE_URL) ?? '',
      };
      const onboardingComplete = getStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';

      set((state) => {
        state.apiKeys = apiKeys;
        state.hasCompletedOnboarding = onboardingComplete;
        state.isInitialized = true;
      });
    },

    // Fetch which providers have server-side env vars configured
    fetchServerProviders: async () => {
      if (get().serverProvidersLoaded) return;

      try {
        const response = await fetch('/api/providers');
        if (!response.ok) return;

        const data = await response.json();
        const configured: ProviderType[] = data.providers
          ?.filter((p: { provider: ProviderType; configured: boolean }) => p.configured)
          .map((p: { provider: ProviderType }) => p.provider) ?? [];

        set((state) => {
          state.serverConfiguredProviders = configured;
          state.serverProvidersLoaded = true;
        });
      } catch {
        // Silently fail - server providers are optional
        set((state) => {
          state.serverProvidersLoaded = true;
        });
      }
    },

    // Fetch available Ollama models from local instance
    fetchOllamaModels: async () => {
      if (get().ollamaModelsLoaded) return;

      try {
        const response = await fetch('/api/ollama/models');
        if (!response.ok) {
          set((state) => {
            state.ollamaModelsLoaded = true;
          });
          return;
        }

        const data = await response.json();
        const models: OllamaModelInfo[] = data.models ?? [];

        set((state) => {
          state.ollamaModels = models;
          state.ollamaModelsLoaded = true;
        });
      } catch {
        // Silently fail - Ollama may not be running
        set((state) => {
          state.ollamaModelsLoaded = true;
        });
      }
    },

    // Reset
    reset: () => set(initialState),
  }))
);

// Selector to check if a provider is enabled (has API key)
export const selectProviderEnabled = (provider: ProviderType) => (state: SettingsState) => {
  const key = state.apiKeys[provider];
  return key ? key.trim().length > 0 : false;
};

// Selector to get all disabled providers
export const selectDisabledProviders = (state: SettingsState): ProviderType[] => {
  const allProviders: ProviderType[] = ['openai', 'anthropic', 'google', 'mistral', 'deepseek', 'perplexity', 'ollama'];
  return allProviders.filter((provider) => {
    const key = state.apiKeys[provider];
    return !key || !key.trim();
  });
};
