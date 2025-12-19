'use client';

import { Play } from 'lucide-react';
import { useEvaluator } from './hooks/useEvaluator';
import { EvaluationPromptEditor } from './features/EvaluationPromptEditor/EvaluationPromptEditor';
import { EvaluationResults } from './features/EvaluationResults/EvaluationResults';
import { Button } from '@/components';
import { useExecutionStore } from '@/stores';

interface EvaluatorProps {
  modelId?: string;
}

export function Evaluator({ modelId }: EvaluatorProps) {
  const { canEvaluate, isEvaluating, runEvaluation } = useEvaluator({ modelId });
  const historyViewIndex = useExecutionStore((s) => s.historyViewIndex);
  const isViewingHistory = historyViewIndex >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Evaluation Prompt Section */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200">
        <EvaluationPromptEditor />
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200">
        <Button
          variant="primary"
          onClick={runEvaluation}
          disabled={!canEvaluate || isViewingHistory}
          loading={isEvaluating}
          icon={<Play className="h-4 w-4" />}
          className="w-full"
        >
          {isViewingHistory
            ? 'Viewing History'
            : isEvaluating
              ? 'Evaluating...'
              : 'Evaluate Outputs'}
        </Button>
      </div>

      {/* Results Section (scrollable) */}
      <div className="flex-1 overflow-auto p-4">
        <EvaluationResults />
      </div>
    </div>
  );
}
