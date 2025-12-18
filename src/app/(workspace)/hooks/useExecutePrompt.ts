'use client';

import { useCallback } from 'react';
import { useExecutionStore, useSettingsStore } from '@/stores';
import { getModelById } from '@/config/providers';
import { buildPrompt } from '@/utils/prompt/buildPrompt';
import { v4 as uuidv4 } from 'uuid';

export function useExecutePrompt() {
  const {
    currentPrompt,
    selectedModelIds,
    parameters,
    promptIntent,
    promptExamples,
    promptGuardrails,
    startExecution,
    updateExecution,
    completeExecution,
    failExecution,
    setLastSentPrompt,
    pushHistory,
  } = useExecutionStore();
  const { getApiKey } = useSettingsStore();

  const executeModel = useCallback(
    async (modelId: string, fullPrompt: string) => {
      if (!fullPrompt) {
        return;
      }

      const runId = uuidv4();
      startExecution(modelId, runId);

      // Get the API key for this model's provider
      const model = getModelById(modelId);
      const apiKey = model ? getApiKey(model.provider) : undefined;

      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptId: currentPrompt?.id.startsWith('temp-') ? undefined : currentPrompt?.id,
            promptContent: fullPrompt,
            modelId,
            apiKey: apiKey || undefined, // Don't send empty string
            parameters,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Execution failed');
        }

        // Handle plain text streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let output = '';
        const startTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          output += chunk;
          updateExecution(modelId, { content: chunk });
        }

        const latencyMs = Date.now() - startTime;
        completeExecution(modelId, { output, latencyMs });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        failExecution(modelId, message);
      }
    },
    [
      currentPrompt,
      parameters,
      getApiKey,
      startExecution,
      updateExecution,
      completeExecution,
      failExecution,
    ]
  );

  const executeAll = useCallback(async () => {
    if (!currentPrompt?.contentMarkdown) {
      return;
    }

    // Build the combined prompt with intent, examples, and guardrails
    const { fullPrompt } = buildPrompt({
      content: currentPrompt.contentMarkdown,
      intent: promptIntent || undefined,
      examples: promptExamples.length > 0 ? promptExamples : undefined,
      guardrails: promptGuardrails || undefined,
    });

    // Store what was sent for display purposes
    setLastSentPrompt(fullPrompt);

    // Execute all selected models in parallel with the same combined prompt
    await Promise.all(selectedModelIds.map((modelId) => executeModel(modelId, fullPrompt)));

    // Push to history AFTER execution completes so we capture the results
    pushHistory('user', 'Run');
  }, [selectedModelIds, executeModel, currentPrompt, promptIntent, promptExamples, promptGuardrails, setLastSentPrompt, pushHistory]);

  return {
    executeModel,
    executeAll,
  };
}
