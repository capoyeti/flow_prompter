import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/stores';
import { STORAGE_KEYS } from '@/config/constants';
import {
  MODELS,
  getModelById,
  getBestAvailableModel,
  getModelsGroupedByProvider,
  type ModelConfig,
  type ProviderType,
} from '@/config/providers';

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

/**
 * Hook to manage the shared panel model (used by both Evaluator and Assistant).
 * - Persists selection to localStorage
 * - Auto-selects the best available model based on API keys
 * - Falls back gracefully if selected model becomes unavailable
 */
export function usePanelModel() {
  const isProviderAvailable = useSettingsStore((s) => s.isProviderAvailable);
  const isInitialized = useSettingsStore((s) => s.isInitialized);

  // Get available providers
  const availableProviders = useMemo(() => {
    const providers: ProviderType[] = [];
    if (isProviderAvailable('anthropic')) providers.push('anthropic');
    if (isProviderAvailable('openai')) providers.push('openai');
    if (isProviderAvailable('google')) providers.push('google');
    return providers;
  }, [isProviderAvailable]);

  // Compute the best default model
  const bestDefaultModel = useMemo(() => {
    return getBestAvailableModel(availableProviders);
  }, [availableProviders]);

  // State for the selected model ID
  const [selectedModelId, setSelectedModelIdState] = useState<string>(() => {
    // Try to load from localStorage first
    const stored = getStorageItem(STORAGE_KEYS.PANEL_MODEL_ID);
    if (stored) {
      const model = getModelById(stored);
      if (model) return stored;
    }
    // Fall back to best available or first tier-1 model
    return bestDefaultModel?.id ?? 'claude-opus-4-5-20251101';
  });

  // Re-validate selection when providers change or initialization completes
  useEffect(() => {
    if (!isInitialized) return;

    const currentModel = getModelById(selectedModelId);
    if (!currentModel) {
      // Model doesn't exist, pick best available
      if (bestDefaultModel) {
        setSelectedModelIdState(bestDefaultModel.id);
        setStorageItem(STORAGE_KEYS.PANEL_MODEL_ID, bestDefaultModel.id);
      }
      return;
    }

    // Check if current model's provider is available
    const isCurrentProviderAvailable = isProviderAvailable(currentModel.provider);
    if (!isCurrentProviderAvailable && bestDefaultModel) {
      // Current model's provider not available, switch to best available
      setSelectedModelIdState(bestDefaultModel.id);
      setStorageItem(STORAGE_KEYS.PANEL_MODEL_ID, bestDefaultModel.id);
    }
  }, [isInitialized, isProviderAvailable, selectedModelId, bestDefaultModel]);

  // Handler to change the selected model
  const setSelectedModelId = useCallback((modelId: string) => {
    setSelectedModelIdState(modelId);
    setStorageItem(STORAGE_KEYS.PANEL_MODEL_ID, modelId);
  }, []);

  // Get the current model config
  const selectedModel = useMemo(() => {
    return getModelById(selectedModelId);
  }, [selectedModelId]);

  // Get models grouped by provider for the dropdown
  const modelsByProvider = useMemo(() => {
    return getModelsGroupedByProvider();
  }, []);

  // Get only tier-1 models (most capable) for the panel dropdown
  // The user wants only the most intelligent models here
  const tier1Models = useMemo(() => {
    return MODELS.filter((m) => m.tier === 1);
  }, []);

  // Check if a specific model is available (its provider has an API key)
  const isModelAvailable = useCallback(
    (model: ModelConfig) => {
      return isProviderAvailable(model.provider);
    },
    [isProviderAvailable]
  );

  return {
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    modelsByProvider,
    tier1Models,
    availableProviders,
    isModelAvailable,
  };
}
