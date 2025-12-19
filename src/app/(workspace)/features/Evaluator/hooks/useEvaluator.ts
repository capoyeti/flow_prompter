import { useCallback, useMemo } from 'react';
import { useEvaluatorStore, useExecutionStore, useSettingsStore } from '@/stores';
import { buildSmartDefaultPrompt } from '../utils/buildEvaluationPrompt';
import { getModelById } from '@/config/providers';
import type { EvaluationResult } from '@/types/models';

interface UseEvaluatorOptions {
  /** Model ID passed from parent (shared panel model) */
  modelId?: string;
}

export function useEvaluator(options: UseEvaluatorOptions = {}) {
  const {
    evaluationPrompt,
    isUsingSmartDefault,
    isEvaluating,
    currentEvaluation,
    startEvaluation,
    completeEvaluation,
    failEvaluation,
  } = useEvaluatorStore();

  // Use modelId from options if provided, otherwise fall back to default
  const selectedModelId = options.modelId ?? 'claude-opus-4-5-20251101';

  const {
    completedRuns,
    currentPrompt,
    promptIntent,
    updateLastHistoryEvaluation,
  } = useExecutionStore();

  const { getApiKey } = useSettingsStore();

  // Check if there are outputs to evaluate
  const hasOutputs = useMemo(() => {
    return completedRuns.size > 0 &&
      Array.from(completedRuns.values()).some(
        (run) => run.status === 'completed' && run.output
      );
  }, [completedRuns]);

  // Can we run an evaluation?
  const canEvaluate = hasOutputs && !isEvaluating;

  // Run the evaluation
  const runEvaluation = useCallback(async () => {
    if (!canEvaluate || !currentPrompt) return;

    startEvaluation();

    try {
      // Get the evaluator model config for API key
      const modelConfig = getModelById(selectedModelId);
      const apiKey = modelConfig ? getApiKey(modelConfig.provider) : undefined;

      // Build outputs array from completed runs
      const outputs = Array.from(completedRuns.entries())
        .filter(([, run]) => run.status === 'completed' && run.output)
        .map(([modelId, run]) => {
          const config = getModelById(modelId);
          return {
            modelId,
            modelName: config?.displayName || modelId,
            provider: config?.provider || 'unknown',
            output: run.output,
          };
        });

      // Determine the evaluation prompt to use
      const effectivePrompt = isUsingSmartDefault
        ? buildSmartDefaultPrompt(promptIntent)
        : evaluationPrompt;

      // Call the evaluate API
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          apiKey,
          promptContent: currentPrompt.contentMarkdown,
          intent: promptIntent || undefined,
          evaluationPrompt: isUsingSmartDefault ? undefined : evaluationPrompt,
          outputs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Evaluation failed');
      }

      const data = await response.json();

      // Validate and extract results
      if (!data.evaluations || !Array.isArray(data.evaluations)) {
        throw new Error('Invalid evaluation response');
      }

      const results: EvaluationResult[] = data.evaluations.map(
        (e: {
          modelId: string;
          score: number;
          reasoning: string;
          strengths?: string[];
          weaknesses?: string[];
        }) => ({
          modelId: e.modelId,
          score: e.score,
          reasoning: e.reasoning,
          strengths: e.strengths,
          weaknesses: e.weaknesses,
        })
      );

      const evaluationSnapshot = {
        evaluationPrompt: effectivePrompt,
        results,
        evaluatedAt: Date.now(),
      };
      completeEvaluation(results, effectivePrompt);
      // Also save evaluation to the most recent history entry
      updateLastHistoryEvaluation(evaluationSnapshot);
    } catch (error) {
      console.error('Evaluation error:', error);
      failEvaluation(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [
    canEvaluate,
    currentPrompt,
    completedRuns,
    selectedModelId,
    isUsingSmartDefault,
    evaluationPrompt,
    promptIntent,
    getApiKey,
    startEvaluation,
    completeEvaluation,
    failEvaluation,
    updateLastHistoryEvaluation,
  ]);

  return {
    canEvaluate,
    isEvaluating,
    hasResults: !!currentEvaluation,
    runEvaluation,
  };
}
