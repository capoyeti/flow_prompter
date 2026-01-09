'use client';

import { useMemo } from 'react';
import { useExecutionStore, useSettingsStore } from '@/stores';
import { getModelById, MODELS, ProviderType } from '@/config/providers';
import type { ExecutionErrorType } from '@/types/models';

export interface RunDisplay {
  modelId: string;
  modelName: string;
  provider: string;
  status: 'streaming' | 'completed' | 'error';
  content: string;
  thinking?: string;
  errorMessage?: string;
  errorType?: ExecutionErrorType;
  errorProvider?: ProviderType;
  latencyMs?: number;
}

export function useExecutionPanel() {
  const {
    activeRuns,
    completedRuns,
    isExecuting,
    selectedModelIds,
    lastSentPrompt,
    historyViewIndex,
    promptHistory,
  } = useExecutionStore();

  const ollamaModels = useSettingsStore((state) => state.ollamaModels);

  // Helper to get model info with proper Ollama detection
  const getModelInfo = (modelId: string) => {
    // First check static MODELS
    const staticModel = getModelById(modelId);
    if (staticModel) {
      return { displayName: staticModel.displayName, provider: staticModel.provider };
    }
    // Check Ollama models
    const ollamaModel = ollamaModels.find((m) => m.id === modelId);
    if (ollamaModel) {
      return { displayName: ollamaModel.displayName, provider: 'ollama' as ProviderType };
    }
    // Unknown model - assume Ollama since dynamic models are typically Ollama
    return { displayName: modelId, provider: 'ollama' as ProviderType };
  };

  // Check if we're viewing a historical version
  const isViewingHistory = historyViewIndex >= 0 && historyViewIndex < promptHistory.length;
  const historicalSnapshot = isViewingHistory ? promptHistory[historyViewIndex].snapshot : null;

  // Combine active and completed runs into a display list, sorted by selectedModelIds order
  const runs = useMemo(() => {
    const result: RunDisplay[] = [];

    // If viewing history, use the historical snapshot data
    if (historicalSnapshot) {
      historicalSnapshot.completedRuns.forEach((run) => {
        const modelInfo = getModelInfo(run.modelId);
        result.push({
          modelId: run.modelId,
          modelName: modelInfo.displayName,
          provider: modelInfo.provider,
          status: run.status,
          content: run.output,
          thinking: run.thinking,
          errorMessage: run.errorMessage,
          errorType: run.errorType,
          errorProvider: run.errorProvider,
          latencyMs: run.latencyMs,
        });
      });

      // Sort by the canonical order in MODELS config (provider grouping)
      result.sort((a, b) => {
        const indexA = MODELS.findIndex((m) => m.id === a.modelId);
        const indexB = MODELS.findIndex((m) => m.id === b.modelId);
        const orderA = indexA === -1 ? Infinity : indexA;
        const orderB = indexB === -1 ? Infinity : indexB;
        return orderA - orderB;
      });

      return result;
    }

    // Otherwise, use live data
    // Add active (streaming) runs
    activeRuns.forEach((run, modelId) => {
      const modelInfo = getModelInfo(modelId);
      result.push({
        modelId,
        modelName: modelInfo.displayName,
        provider: modelInfo.provider,
        status: 'streaming',
        content: run.state.content,
        thinking: run.state.thinking || undefined,
      });
    });

    // Add completed runs
    completedRuns.forEach((run, modelId) => {
      const modelInfo = getModelInfo(modelId);
      result.push({
        modelId,
        modelName: modelInfo.displayName,
        provider: modelInfo.provider,
        status: run.status,
        content: run.output,
        thinking: run.thinking,
        errorMessage: run.errorMessage,
        errorType: run.errorType,
        errorProvider: run.errorProvider,
        latencyMs: run.latencyMs,
      });
    });

    // Sort by the canonical order in MODELS config (provider grouping)
    result.sort((a, b) => {
      const indexA = MODELS.findIndex((m) => m.id === a.modelId);
      const indexB = MODELS.findIndex((m) => m.id === b.modelId);
      const orderA = indexA === -1 ? Infinity : indexA;
      const orderB = indexB === -1 ? Infinity : indexB;
      return orderA - orderB;
    });

    return result;
  }, [activeRuns, completedRuns, historicalSnapshot, ollamaModels]);

  const hasRuns = runs.length > 0;

  return {
    runs,
    isExecuting,
    hasRuns,
    selectedModelIds,
    lastSentPrompt,
    isViewingHistory,
  };
}
