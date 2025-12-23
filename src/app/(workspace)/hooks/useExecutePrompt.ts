'use client';

import { useCallback } from 'react';
import { useExecutionStore, useSettingsStore, useEvaluatorStore } from '@/stores';
import { getModelById, ProviderType } from '@/config/providers';
import { buildPrompt } from '@/utils/prompt/buildPrompt';
import { v4 as uuidv4 } from 'uuid';

// Helper to get display name for provider
function getProviderDisplayName(provider: ProviderType): string {
  const names: Record<ProviderType, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    mistral: 'Mistral',
    deepseek: 'DeepSeek',
    perplexity: 'Perplexity',
    ollama: 'Ollama',
  };
  return names[provider] ?? provider;
}

export function useExecutePrompt() {
  const {
    currentPrompt,
    selectedModelIds,
    parameters,
    promptIntent,
    promptExamples,
    promptGuardrails,
    feedbackData,
    startExecution,
    updateExecution,
    completeExecution,
    failExecution,
    setLastSentPrompt,
    pushHistory,
  } = useExecutionStore();
  const { getApiKey, isProviderAvailable } = useSettingsStore();
  const { clearEvaluation } = useEvaluatorStore();

  const executeModel = useCallback(
    async (modelId: string, fullPrompt: string) => {
      if (!fullPrompt) {
        return;
      }

      const runId = uuidv4();
      startExecution(modelId, runId);

      // Get the model config
      const model = getModelById(modelId);
      if (!model) {
        failExecution(modelId, 'Unknown model', 'unknown');
        return;
      }

      // Check if provider has API key available (local or server)
      if (!isProviderAvailable(model.provider)) {
        const providerLabel = getProviderDisplayName(model.provider);
        failExecution(
          modelId,
          `No API key configured for ${providerLabel}`,
          'missing_api_key',
          model.provider
        );
        return;
      }

      // Get the API key for this model's provider
      const apiKey = getApiKey(model.provider);

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
        failExecution(modelId, message, 'api_error');
      }
    },
    [
      currentPrompt,
      parameters,
      getApiKey,
      isProviderAvailable,
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

    // Clear any previous evaluation results since we're running a new prompt
    clearEvaluation();

    // Build the combined prompt with intent, examples, guardrails, and feedback data
    const { fullPrompt } = buildPrompt({
      content: currentPrompt.contentMarkdown,
      intent: promptIntent || undefined,
      examples: promptExamples.length > 0 ? promptExamples : undefined,
      guardrails: promptGuardrails || undefined,
      feedbackData: feedbackData || undefined,
    });

    // Store what was sent for display purposes
    setLastSentPrompt(fullPrompt);

    // Execute all selected models in parallel with the same combined prompt
    await Promise.all(selectedModelIds.map((modelId) => executeModel(modelId, fullPrompt)));

    // Push to history AFTER execution completes so we capture the results
    pushHistory('user', 'Run');
  }, [selectedModelIds, executeModel, currentPrompt, promptIntent, promptExamples, promptGuardrails, feedbackData, setLastSentPrompt, pushHistory, clearEvaluation]);

  return {
    executeModel,
    executeAll,
  };
}
