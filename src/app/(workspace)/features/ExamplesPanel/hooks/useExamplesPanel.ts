'use client';

import { useCallback, useMemo } from 'react';
import { useExecutionStore } from '@/stores';
import type { ExampleType } from '@/types/models';

export function useExamplesPanel() {
  const {
    promptExamples,
    addExample,
    promptHistory,
    historyViewIndex,
  } = useExecutionStore();

  // When viewing history, show the historical examples
  const displayExamples = useMemo(() => {
    if (historyViewIndex >= 0 && historyViewIndex < promptHistory.length) {
      return promptHistory[historyViewIndex].snapshot.examples;
    }
    return promptExamples;
  }, [promptExamples, promptHistory, historyViewIndex]);

  const isViewingHistory = historyViewIndex >= 0;

  const handleAddExample = useCallback(
    (type: ExampleType) => {
      // Don't allow adding when viewing history
      if (isViewingHistory) return;
      addExample(type);
    },
    [addExample, isViewingHistory]
  );

  // Compute subtitle statistics
  const subtitle = useMemo(() => {
    if (displayExamples.length === 0) {
      return 'None added';
    }

    const positiveCount = displayExamples.filter((ex) => ex.type === 'positive').length;
    const negativeCount = displayExamples.filter((ex) => ex.type === 'negative').length;

    const parts: string[] = [];
    if (positiveCount > 0) parts.push(`${positiveCount} positive`);
    if (negativeCount > 0) parts.push(`${negativeCount} negative`);

    return `${displayExamples.length} example${displayExamples.length !== 1 ? 's' : ''} (${parts.join(', ')})`;
  }, [displayExamples]);

  return {
    examples: displayExamples,
    addExample: handleAddExample,
    subtitle,
    isViewingHistory,
  };
}
