'use client';

import { useCallback, useMemo } from 'react';
import { useExecutionStore } from '@/stores';

export function useHistoryTimeline() {
  const {
    promptHistory,
    historyViewIndex,
    currentPrompt,
    viewHistoryVersion,
    restoreHistoryVersion,
  } = useExecutionStore();

  // Current content is either from history preview or live prompt
  const previewContent = useMemo(() => {
    if (historyViewIndex >= 0 && historyViewIndex < promptHistory.length) {
      return promptHistory[historyViewIndex].snapshot.content;
    }
    return null;
  }, [promptHistory, historyViewIndex]);

  const isViewingHistory = historyViewIndex >= 0;

  // Selecting a version previews it (shows in editor without making it "live")
  const handleSelectVersion = useCallback(
    (index: number) => {
      console.log('[useHistoryTimeline] handleSelectVersion called with index:', index);
      viewHistoryVersion(index);
    },
    [viewHistoryVersion]
  );

  // Go back to live/current version
  const handleGoToLive = useCallback(() => {
    viewHistoryVersion(-1);
  }, [viewHistoryVersion]);

  return {
    promptHistory,
    historyViewIndex,
    previewContent,
    isViewingHistory,
    currentContent: currentPrompt?.contentMarkdown ?? '',
    handleSelectVersion,
    handleGoToLive,
  };
}
