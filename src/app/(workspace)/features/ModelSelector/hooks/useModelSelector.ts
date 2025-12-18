'use client';

import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useExecutionStore, useSettingsStore } from '@/stores';
import { MODELS, ModelConfig, ProviderType } from '@/config/providers';
import { STORAGE_KEYS } from '@/config/constants';

const DEFAULT_MODEL_ID = 'gpt-5.2';

export function useModelSelector() {
  const { selectedModelIds, toggleModel, setSelectedModels } = useExecutionStore();
  const { isProviderAvailable, openSettingsModal, loadFromStorage, fetchServerProviders } = useSettingsStore();
  const isInitialized = useRef(false);

  // Initialize settings store from localStorage and fetch server providers
  useEffect(() => {
    loadFromStorage();
    fetchServerProviders();
  }, [loadFromStorage, fetchServerProviders]);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<ProviderType, ModelConfig[]> = {
      openai: [],
      anthropic: [],
      google: [],
    };

    for (const model of MODELS) {
      grouped[model.provider].push(model);
    }

    // Remove empty providers
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, models]) => models.length > 0)
    ) as Record<ProviderType, ModelConfig[]>;
  }, []);

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

  // Check if a provider is disabled (no API key locally or on server)
  const isProviderDisabled = useCallback(
    (provider: ProviderType): boolean => {
      return !isProviderAvailable(provider);
    },
    [isProviderAvailable]
  );

  // Open settings modal (for "Add key" link)
  const handleAddApiKey = useCallback(() => {
    openSettingsModal();
  }, [openSettingsModal]);

  return {
    modelsByProvider,
    selectedModelIds,
    toggleModel: handleToggleModel,
    setSelectedModels,
    isProviderDisabled,
    onAddApiKey: handleAddApiKey,
  };
}
