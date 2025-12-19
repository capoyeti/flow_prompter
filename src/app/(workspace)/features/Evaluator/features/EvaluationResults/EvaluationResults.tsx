'use client';

import { Loader2, ClipboardList } from 'lucide-react';
import { useEvaluationResults } from './hooks/useEvaluationResults';
import { ModelScoreCard } from './features/ModelScoreCard/ModelScoreCard';

export function EvaluationResults() {
  const {
    results,
    isEvaluating,
    hasResults,
    hasOutputs,
    averageScore,
    isViewingHistory,
  } = useEvaluationResults();

  // Loading state
  if (isEvaluating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Evaluating outputs...</p>
      </div>
    );
  }

  // No outputs to evaluate
  if (!hasOutputs) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
        <ClipboardList className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm text-center">
          Run your prompt first to generate<br />outputs that can be evaluated.
        </p>
      </div>
    );
  }

  // No results yet
  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
        <ClipboardList className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm text-center">
          {isViewingHistory
            ? <>This version was not evaluated.<br />Return to Live to run new evaluations.</>
            : <>Click &quot;Evaluate Outputs&quot; to grade<br />your model outputs.</>
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      {averageScore !== null && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Results ({results.length} model{results.length !== 1 ? 's' : ''})
          </span>
          <span className="text-sm text-neutral-600">
            Avg: <span className="font-semibold">{averageScore}</span>
          </span>
        </div>
      )}

      {/* Score cards */}
      <div className="space-y-3">
        {results.map((result) => (
          <ModelScoreCard key={result.modelId} result={result} />
        ))}
      </div>
    </div>
  );
}
