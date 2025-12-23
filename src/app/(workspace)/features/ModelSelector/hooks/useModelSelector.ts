'use client';

import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useExecutionStore, useSettingsStore } from '@/stores';
import { MODELS, ModelConfig, ProviderType } from '@/config/providers';
import { STORAGE_KEYS } from '@/config/constants';

const DEFAULT_MODEL_ID = 'gpt-5.2';

export function useModelSelector() {
  const { selectedModelIds, toggleModel, setSelectedModels } = useExecutionStore();
  const { isProviderAvailable, openSettingsModal, loadFromStorage, fetchServerProviders, fetchOllamaModels } = useSettingsStore();
  const isInitialized = useRef(false);

  // Initialize settings store from localStorage and fetch server providers + Ollama models
  useEffect(() => {
    loadFromStorage();
    fetchServerProviders();
    fetchOllamaModels();
  }, [loadFromStorage, fetchServerProviders, fetchOllamaModels]);

  // Get server configured providers from settings store
  const serverConfiguredProviders = useSettingsStore((state) => state.serverConfiguredProviders);
  const apiKeys = useSettingsStore((state) => state.apiKeys);
  const serverProvidersLoaded = useSettingsStore((state) => state.serverProvidersLoaded);
  const isInitializedSettings = useSettingsStore((state) => state.isInitialized);
  const ollamaModels = useSettingsStore((state) => state.ollamaModels);
  const ollamaModelsLoaded = useSettingsStore((state) => state.ollamaModelsLoaded);

  // Group models by provider - ONLY include providers that have API keys configured
  const modelsByProvider = useMemo(() => {
    // Don't compute until settings are loaded
    if (!isInitializedSettings || !serverProvidersLoaded) {
      return {} as Partial<Record<ProviderType, ModelConfig[]>>;
    }

    const grouped: Record<ProviderType, ModelConfig[]> = {
      openai: [],
      anthropic: [],
      google: [],
      mistral: [],
      deepseek: [],
      perplexity: [],
      ollama: [],
    };

    // Add static models (excluding Ollama - those come from dynamic discovery)
    for (const model of MODELS) {
      if (model.provider !== 'ollama' && grouped[model.provider]) {
        grouped[model.provider].push(model);
      }
    }

    // Add dynamically discovered Ollama models
    if (ollamaModelsLoaded && ollamaModels.length > 0) {
      for (const ollamaModel of ollamaModels) {
        grouped.ollama.push({
          id: ollamaModel.id,
          provider: 'ollama',
          name: ollamaModel.name,
          displayName: ollamaModel.displayName,
          contextWindow: 128000, // Default, varies by model
          capabilities: {
            supportsStreaming: true,
            supportsThinking: ollamaModel.supportsThinking,
            supportsTemperature: true,
            temperatureRange: { min: 0, max: 2, default: 0.7 },
            supportsSystemPrompt: true,
            supportsMaxTokens: true,
            maxOutputTokens: 8192,
          },
          tier: 1,
        });
      }
    }

    // Filter to only show providers that have API keys (server or client-side)
    return Object.fromEntries(
      Object.entries(grouped).filter(([provider, models]) => {
        if (models.length === 0) return false;
        const providerKey = provider as ProviderType;
        const hasServerKey = serverConfiguredProviders.includes(providerKey);
        const hasClientKey = apiKeys[providerKey]?.trim().length > 0;
        return hasServerKey || hasClientKey;
      })
    ) as Partial<Record<ProviderType, ModelConfig[]>>;
  }, [serverConfiguredProviders, apiKeys, isInitializedSettings, serverProvidersLoaded, ollamaModels, ollamaModelsLoaded]);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL_IDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate that stored IDs still exist in MODELS
          const validIds = parsed.filter((id: string) =>
            MODELS.some((m) => m.id === id)
          );
          if (validIds.length > 0) {
            setSelectedModels(validIds);
            return;
          }
        }
      }
      // First time or invalid storage - use default
      setSelectedModels([DEFAULT_MODEL_ID]);
    } catch {
      // localStorage error - use default
      setSelectedModels([DEFAULT_MODEL_ID]);
    }
  }, [setSelectedModels]);

  // Persist to localStorage when selection changes
  useEffect(() => {
    if (!isInitialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL_IDS, JSON.stringify(selectedModelIds));
    } catch {
      // Ignore localStorage errors
    }
  }, [selectedModelIds]);

  // Wrapped toggle that only works if provider is available
  const handleToggleModel = useCallback(
    (modelId: string) => {
      const model = MODELS.find((m) => m.id === modelId);
      if (model && isProviderAvailable(model.provider)) {
        toggleModel(modelId);
      }
    },
    [toggleModel, isProviderAvailable]
  );

  // Open settings modal (for "Configure Providers" button)
  const handleAddApiKey = useCallback(() => {
    openSettingsModal();
  }, [openSettingsModal]);

  // Loading state - true until both localStorage and server providers are loaded
  const isLoading = !isInitializedSettings || !serverProvidersLoaded;

  return {
    modelsByProvider,
    selectedModelIds,
    toggleModel: handleToggleModel,
    setSelectedModels,
    onAddApiKey: handleAddApiKey,
    isLoading,
  };
}
