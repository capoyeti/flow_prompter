import { useMemo } from 'react';
import { useEvaluatorStore } from '@/stores';
import { useExecutionStore } from '@/stores';

export function useEvaluationResults() {
  const { currentEvaluation, isEvaluating, activeEvaluations } = useEvaluatorStore();
  const { completedRuns, selectedModelIds, historyViewIndex, getViewedHistoryEvaluation } = useExecutionStore();

  // Determine which evaluation to show based on whether we're viewing history
  const effectiveEvaluation = useMemo(() => {
    if (historyViewIndex >= 0) {
      // Viewing history - get evaluation from that snapshot
      return getViewedHistoryEvaluation();
    }
    // Live view - use current evaluation
    return currentEvaluation;
  }, [historyViewIndex, getViewedHistoryEvaluation, currentEvaluation]);

  // Get the order of models from selectedModelIds to maintain consistent ordering
  const orderedResults = useMemo(() => {
    if (!effectiveEvaluation?.results) return [];

    // Sort results by the order in selectedModelIds
    return [...effectiveEvaluation.results].sort((a, b) => {
      const aIndex = selectedModelIds.indexOf(a.modelId);
      const bIndex = selectedModelIds.indexOf(b.modelId);
      return aIndex - bIndex;
    });
  }, [effectiveEvaluation?.results, selectedModelIds]);

  // Calculate average score
  const averageScore = useMemo(() => {
    if (!effectiveEvaluation?.results || effectiveEvaluation.results.length === 0) {
      return null;
    }
    const total = effectiveEvaluation.results.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / effectiveEvaluation.results.length);
  }, [effectiveEvaluation?.results]);

  // Check if there are outputs to evaluate
  const hasOutputs = completedRuns.size > 0;

  // When viewing history, we're not evaluating and have results if the snapshot has them
  const isViewingHistory = historyViewIndex >= 0;

  return {
    results: orderedResults,
    isEvaluating: isViewingHistory ? false : isEvaluating,
    activeEvaluations,
    hasResults: orderedResults.length > 0,
    hasOutputs: isViewingHistory ? true : hasOutputs, // History always has outputs
    averageScore,
    evaluatedAt: effectiveEvaluation?.evaluatedAt,
    isViewingHistory,
  };
}
