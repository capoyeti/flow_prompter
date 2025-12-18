// Settings store - manages API keys and application settings
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { STORAGE_KEYS } from '@/config/constants';
import type { ProviderType } from '@/config/providers';

interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
}

interface SettingsState {
  // API keys for each provider (from localStorage)
  apiKeys: ApiKeys;

  // Providers configured on the server (via env vars)
  serverConfiguredProviders: ProviderType[];

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

  // Reset
  reset: () => void;
}

const initialState: SettingsState = {
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
  },
  serverConfiguredProviders: [],
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
      // Persist to localStorage
      const storageKey = {
        openai: STORAGE_KEYS.API_KEY_OPENAI,
        anthropic: STORAGE_KEYS.API_KEY_ANTHROPIC,
        google: STORAGE_KEYS.API_KEY_GOOGLE,
      }[provider];
      setStorageItem(storageKey, key);
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
      return (
        apiKeys.openai.trim().length > 0 ||
        apiKeys.anthropic.trim().length > 0 ||
        apiKeys.google.trim().length > 0
      );
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

      const openaiKey = getStorageItem(STORAGE_KEYS.API_KEY_OPENAI) ?? '';
      const anthropicKey = getStorageItem(STORAGE_KEYS.API_KEY_ANTHROPIC) ?? '';
      const googleKey = getStorageItem(STORAGE_KEYS.API_KEY_GOOGLE) ?? '';
      const onboardingComplete = getStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';

      set((state) => {
        state.apiKeys = {
          openai: openaiKey,
          anthropic: anthropicKey,
          google: googleKey,
        };
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

    // Reset
    reset: () => set(initialState),
  }))
);

// Selector to check if a provider is enabled (has API key)
export const selectProviderEnabled = (provider: ProviderType) => (state: SettingsState) =>
  state.apiKeys[provider].trim().length > 0;

// Selector to get all disabled providers
export const selectDisabledProviders = (state: SettingsState): ProviderType[] => {
  const disabled: ProviderType[] = [];
  if (!state.apiKeys.openai.trim()) disabled.push('openai');
  if (!state.apiKeys.anthropic.trim()) disabled.push('anthropic');
  if (!state.apiKeys.google.trim()) disabled.push('google');
  return disabled;
};
