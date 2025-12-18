'use client';

import { useCallback, useMemo } from 'react';
import { useExecutionStore } from '@/stores';

export function useGuardrailsPanel() {
  const {
    promptGuardrails,
    updateGuardrails,
    promptHistory,
    historyViewIndex,
  } = useExecutionStore();

  // When viewing history, show the historical value
  const displayContent = useMemo(() => {
    if (historyViewIndex >= 0 && historyViewIndex < promptHistory.length) {
      return promptHistory[historyViewIndex].snapshot.guardrails;
    }
    return promptGuardrails;
  }, [promptGuardrails, promptHistory, historyViewIndex]);

  const isViewingHistory = historyViewIndex >= 0;

  const handleChange = useCallback(
    (content: string) => {
      // Don't allow editing when viewing history
      if (isViewingHistory) return;
      updateGuardrails(content);
    },
    [updateGuardrails, isViewingHistory]
  );

  // Generate subtitle preview (first ~50 chars)
  const subtitle = displayContent
    ? displayContent.slice(0, 50) + (displayContent.length > 50 ? '...' : '')
    : 'Not set';

  return {
    content: displayContent,
    onChange: handleChange,
    subtitle,
    isViewingHistory,
  };
}
