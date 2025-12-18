'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExecutionStore } from '@/stores';
import type { Prompt } from '@/types/models';

export function usePromptEditor() {
  const {
    currentPrompt,
    isExecuting,
    updatePromptContent,
    updatePromptName,
    setCurrentPrompt,
    promptHistory,
    historyViewIndex,
  } = useExecutionStore();

  // Track local edits when viewing history (ephemeral until Run)
  const [localEdits, setLocalEdits] = useState<string | null>(null);
  const lastHistoryIndex = useRef(historyViewIndex);

  // When history index changes, reset local edits
  useEffect(() => {
    if (historyViewIndex !== lastHistoryIndex.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalEdits(null);
      lastHistoryIndex.current = historyViewIndex;
    }
  }, [historyViewIndex]);

  // When viewing history, show that version's content (or local edits); otherwise show live
  const isViewingHistory = historyViewIndex >= 0;
  const displayContent = useMemo(() => {
    console.log('[usePromptEditor] Computing displayContent:', {
      isViewingHistory,
      historyViewIndex,
      promptHistoryLength: promptHistory.length,
      localEdits,
      currentContent: currentPrompt?.contentMarkdown?.slice(0, 50),
    });
    if (isViewingHistory) {
      // If user has made local edits, show those; otherwise show history
      if (localEdits !== null) {
        console.log('[usePromptEditor] Returning localEdits:', localEdits.slice(0, 50));
        return localEdits;
      }
      if (historyViewIndex < promptHistory.length) {
        const historyContent = promptHistory[historyViewIndex].snapshot.content;
        console.log('[usePromptEditor] Returning history content:', historyContent.slice(0, 50));
        return historyContent;
      }
    }
    console.log('[usePromptEditor] Returning current content');
    return currentPrompt?.contentMarkdown ?? '';
  }, [isViewingHistory, historyViewIndex, promptHistory, currentPrompt?.contentMarkdown, localEdits]);

  // Initialize with a default prompt if none exists
  useEffect(() => {
    if (!currentPrompt) {
      // Create a temporary in-memory prompt for immediate use
      const tempPrompt: Prompt = {
        id: 'temp-' + Date.now(),
        projectId: '',
        name: '',
        contentMarkdown: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentPrompt(tempPrompt);
    }
  }, [currentPrompt, setCurrentPrompt]);

  const handleChange = useCallback(
    (value: string) => {
      if (isViewingHistory) {
        // When viewing history, edits are ephemeral (stored locally until Run)
        setLocalEdits(value);
      } else {
        updatePromptContent(value);
      }
    },
    [isViewingHistory, updatePromptContent]
  );

  const handleNameChange = useCallback(
    (name: string) => {
      updatePromptName(name);
    },
    [updatePromptName]
  );

  return {
    content: displayContent,
    promptName: currentPrompt?.name ?? '',
    isExecuting,
    onChange: handleChange,
    onNameChange: handleNameChange,
  };
}
