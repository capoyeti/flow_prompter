'use client';

import { useCallback, useState } from 'react';
import { useAssistantStore, useExecutionStore, useSettingsStore } from '@/stores';
import type { ParsedSuggestion } from '../utils/parseAssistantResponse';
import { getModelById } from '@/config/providers';

interface UsePromptAssistantOptions {
  /** Model ID passed from parent (shared panel model) */
  modelId?: string;
}

export function usePromptAssistant(options: UsePromptAssistantOptions = {}) {
  const {
    conversation,
    currentInput,
    isGenerating,
    streamingContent,
    executionSnapshot,
    setCurrentInput,
    addUserMessage,
    addAssistantMessage,
    startGeneration,
    endGeneration,
    updateStreamingContent,
    finalizeStreamingMessage,
    clearConversation,
  } = useAssistantStore();

  // Use modelId from options if provided, otherwise fall back to default
  const selectedModelId = options.modelId ?? 'claude-opus-4-5-20251101';

  const { currentPrompt } = useExecutionStore();

  const { getApiKey } = useSettingsStore();

  // Track which suggestion is currently being applied
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  // Track which suggestions have been applied (for checkmarks)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const hasExecutionContext = !!executionSnapshot?.latestRuns?.length;

  const sendMessage = useCallback(async () => {
    if (!currentInput.trim() || isGenerating) return;

    // Add user message
    addUserMessage(currentInput);
    startGeneration();

    try {
      // Build conversation history for the API
      const conversationHistory = conversation.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          modelId: selectedModelId,
          conversationHistory,
          executionSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle plain text streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        updateStreamingContent(chunk);
      }

      // Finalize the message
      finalizeStreamingMessage();
    } catch (error) {
      console.error('Assistant error:', error);
      // Add error message to conversation
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      addAssistantMessage(`⚠️ **Error:** ${errorMsg}\n\nThis may be due to an invalid API key or the selected model not being available with your current credentials. Check your API key settings or try a different model.`);
    } finally {
      endGeneration();
    }
  }, [
    currentInput,
    isGenerating,
    conversation,
    executionSnapshot,
    selectedModelId,
    addUserMessage,
    addAssistantMessage,
    startGeneration,
    endGeneration,
    updateStreamingContent,
    finalizeStreamingMessage,
  ]);

  // Apply a suggestion to the appropriate part based on target
  const applySuggestion = useCallback(
    async (suggestion: ParsedSuggestion, originalContent?: string) => {
      console.log('[applySuggestion] Starting apply:', {
        id: suggestion.id,
        type: suggestion.type,
        target: suggestion.target,
        proposedLength: suggestion.proposed?.length,
      });

      // Get fresh state from store to avoid stale closure issues
      const store = useExecutionStore.getState();
      const freshPrompt = store.currentPrompt;

      if (!freshPrompt) {
        console.error('[applySuggestion] No currentPrompt!');
        return;
      }

      setApplyingId(suggestion.id);
      setApplyError(null);

      try {
        const target = suggestion.target || 'prompt';

        // If viewing history, switch back to live view so user sees the applied change
        const currentHistoryIndex = useExecutionStore.getState().historyViewIndex;
        if (currentHistoryIndex >= 0) {
          console.log('[applySuggestion] Switching from history view to live');
          store.viewHistoryVersion(-1);
        }

        if (target === 'intent') {
          console.log('[applySuggestion] Applying to intent');
          store.setIntent(suggestion.proposed);
        } else if (target === 'guardrails') {
          console.log('[applySuggestion] Applying to guardrails');
          store.setGuardrails(suggestion.proposed);
        } else if (target === 'examples' && suggestion.exampleOperation) {
          console.log('[applySuggestion] Applying to examples:', suggestion.exampleOperation);
          const op = suggestion.exampleOperation;
          if (op.action === 'add' && op.exampleType) {
            store.addExample(op.exampleType);
            const freshExamples = useExecutionStore.getState().promptExamples;
            const lastExample = freshExamples[freshExamples.length - 1];
            if (lastExample) {
              store.updateExample(lastExample.id, suggestion.proposed);
            }
          } else if (op.action === 'update' && op.exampleId) {
            store.updateExample(op.exampleId, suggestion.proposed);
          } else if (op.action === 'remove' && op.exampleId) {
            store.removeExample(op.exampleId);
          }
        } else {
          // For prompt target
          console.log('[applySuggestion] Applying to prompt, type:', suggestion.type);

          if (suggestion.type === 'full_rewrite') {
            // Full rewrite: directly replace without API call
            console.log('[applySuggestion] Full rewrite - replacing directly');
            console.log('[applySuggestion] Current content:', freshPrompt.contentMarkdown.slice(0, 100));
            console.log('[applySuggestion] New content:', suggestion.proposed.slice(0, 100));
            store.updatePromptContent(suggestion.proposed);
            // Verify it was updated
            const updated = useExecutionStore.getState().currentPrompt?.contentMarkdown;
            console.log('[applySuggestion] After update:', updated?.slice(0, 100));
          } else {
            // Patch: use the intelligent merging API
            console.log('[applySuggestion] Patch - calling API');
            // Get fresh prompt content for the API call
            const currentContent = useExecutionStore.getState().currentPrompt?.contentMarkdown ?? '';
            const modelConfig = getModelById(selectedModelId);
            const apiKey = modelConfig ? getApiKey(modelConfig.provider) : undefined;

            const response = await fetch('/api/apply-patch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentPrompt: currentContent,
                originalPrompt: originalContent,
                suggestion: {
                  type: suggestion.type,
                  confidence: suggestion.confidence,
                  proposed: suggestion.proposed,
                  rationale: suggestion.rationale,
                },
                modelId: selectedModelId,
                apiKey: apiKey || undefined,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[applySuggestion] API error:', response.status, errorText);
              throw new Error(`Failed to apply suggestion: ${response.status}`);
            }

            const result = await response.json();
            console.log('[applySuggestion] API result:', {
              success: result.success,
              hasMergedPrompt: !!result.mergedPrompt,
              mergedLength: result.mergedPrompt?.length,
            });

            if (result.success && result.mergedPrompt) {
              console.log('[applySuggestion] Updating with merged prompt');
              store.updatePromptContent(result.mergedPrompt);
              // Verify it was updated
              const updated = useExecutionStore.getState().currentPrompt?.contentMarkdown;
              console.log('[applySuggestion] After update:', updated?.slice(0, 100));
            } else {
              throw new Error(result.error || 'No merged prompt returned');
            }
          }
        }

        // Mark as applied successfully
        setAppliedIds((prev) => new Set(prev).add(suggestion.id));
        console.log('[applySuggestion] Successfully applied:', suggestion.id);
      } catch (error) {
        console.error('[applySuggestion] Error:', error);
        setApplyError(error instanceof Error ? error.message : 'Failed to apply');
      } finally {
        setApplyingId(null);
      }
    },
    [selectedModelId, getApiKey]
  );

  return {
    conversation,
    currentInput,
    isGenerating,
    streamingContent,
    setCurrentInput,
    sendMessage,
    clearConversation,
    hasExecutionContext,
    applySuggestion,
    applyingId,
    appliedIds,
    applyError,
    currentPromptContent: currentPrompt?.contentMarkdown ?? '',
  };
}
