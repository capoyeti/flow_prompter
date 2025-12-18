'use client';

import { useMemo } from 'react';
import { useExecutionStore } from '@/stores';
import { getModelById } from '@/config/providers';

export interface RunDisplay {
  modelId: string;
  modelName: string;
  provider: string;
  status: 'streaming' | 'completed' | 'error';
  content: string;
  thinking?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export function useExecutionPanel() {
  const { activeRuns, completedRuns, isExecuting, selectedModelIds, lastSentPrompt } =
    useExecutionStore();

  // Combine active and completed runs into a display list, sorted by selectedModelIds order
  const runs = useMemo(() => {
    const result: RunDisplay[] = [];

    // Add active (streaming) runs
    activeRuns.forEach((run, modelId) => {
      const model = getModelById(modelId);
      result.push({
        modelId,
        modelName: model?.displayName ?? modelId,
        provider: model?.provider ?? 'unknown',
        status: 'streaming',
        content: run.state.content,
        thinking: run.state.thinking || undefined,
      });
    });

    // Add completed runs
    completedRuns.forEach((run, modelId) => {
      const model = getModelById(modelId);
      result.push({
        modelId,
        modelName: model?.displayName ?? modelId,
        provider: model?.provider ?? 'unknown',
        status: run.status,
        content: run.output,
        thinking: run.thinking,
        errorMessage: run.errorMessage,
        latencyMs: run.latencyMs,
      });
    });

    // Sort by the order in selectedModelIds for consistent display
    result.sort((a, b) => {
      const indexA = selectedModelIds.indexOf(a.modelId);
      const indexB = selectedModelIds.indexOf(b.modelId);
      // If model not in selectedModelIds, put it at the end
      const orderA = indexA === -1 ? Infinity : indexA;
      const orderB = indexB === -1 ? Infinity : indexB;
      return orderA - orderB;
    });

    return result;
  }, [activeRuns, completedRuns, selectedModelIds]);

  const hasRuns = runs.length > 0;

  return {
    runs,
    isExecuting,
    hasRuns,
    selectedModelIds,
    lastSentPrompt,
  };
}
