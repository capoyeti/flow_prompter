export { useExecutionStore, selectIsExecuting, selectCanExecute } from './executionStore';
export { useAssistantStore, buildAssistantSystemPrompt } from './assistantStore';
export { useEvaluatorStore, EVALUATION_SCALE } from './evaluatorStore';
export { useProjectStore } from './projectStore';
export { useSettingsStore, selectProviderEnabled, selectDisabledProviders } from './settingsStore';
export { useThemeStore } from './themeStore';
export type { Theme } from './themeStore';

// Import stores for the reset function
import { useExecutionStore } from './executionStore';
import { useAssistantStore } from './assistantStore';
import { useEvaluatorStore } from './evaluatorStore';
import type { Prompt } from '@/types/models';

/**
 * Reset all workspace state to start fresh.
 * Call this when creating a new prompt or clearing the workspace.
 */
export function resetWorkspace() {
  // Create a fresh prompt
  const newPrompt: Prompt = {
    id: 'temp-' + Date.now(),
    projectId: '',
    name: '',
    contentMarkdown: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Reset execution store
  const executionStore = useExecutionStore.getState();
  executionStore.clearHistory();
  executionStore.clearExecutions();
  executionStore.setLastSentPrompt('');
  executionStore.setCurrentPrompt(newPrompt);
  executionStore.setIntent('');
  executionStore.setGuardrails('');
  executionStore.setExamples([]);

  // Reset assistant store
  useAssistantStore.getState().clearConversation();

  // Reset evaluator store
  useEvaluatorStore.getState().reset();

  console.log('[resetWorkspace] Workspace reset complete');
}
