// Evaluator store - manages the evaluation of model outputs
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EvaluationResult, EvaluationSnapshot } from '@/types/models';

interface EvaluatorState {
  // User's custom evaluation prompt (empty = use smart default)
  evaluationPrompt: string;

  // Whether to auto-generate prompt from intent
  isUsingSmartDefault: boolean;

  // Current evaluation results
  currentEvaluation: EvaluationSnapshot | null;

  // Is evaluation currently running
  isEvaluating: boolean;

  // Streaming state per model (for live updates)
  activeEvaluations: Map<string, Partial<EvaluationResult>>;
}

interface EvaluatorActions {
  // Prompt management
  setEvaluationPrompt: (prompt: string) => void;
  toggleSmartDefault: () => void;

  // Evaluation lifecycle
  startEvaluation: () => void;
  updateEvaluationResult: (
    modelId: string,
    delta: Partial<EvaluationResult>
  ) => void;
  completeEvaluation: (results: EvaluationResult[], evaluationPrompt: string) => void;
  failEvaluation: (error: string) => void;
  clearEvaluation: () => void;

  // Snapshot for history/assistant context
  getEvaluationSnapshot: () => EvaluationSnapshot | null;

  // Reset
  reset: () => void;
}

const initialState: EvaluatorState = {
  evaluationPrompt: '',
  isUsingSmartDefault: true,
  currentEvaluation: null,
  isEvaluating: false,
  activeEvaluations: new Map(),
};

export const useEvaluatorStore = create<EvaluatorState & EvaluatorActions>()(
  immer((set, get) => ({
    ...initialState,

    // Prompt management
    setEvaluationPrompt: (prompt) =>
      set((state) => {
        state.evaluationPrompt = prompt;
        // If user provides custom prompt, disable smart default
        if (prompt.trim()) {
          state.isUsingSmartDefault = false;
        }
      }),

    toggleSmartDefault: () =>
      set((state) => {
        state.isUsingSmartDefault = !state.isUsingSmartDefault;
      }),

    // Evaluation lifecycle
    startEvaluation: () =>
      set((state) => {
        state.isEvaluating = true;
        state.activeEvaluations = new Map();
      }),

    updateEvaluationResult: (modelId, delta) =>
      set((state) => {
        const existing = state.activeEvaluations.get(modelId) || {};
        state.activeEvaluations.set(modelId, { ...existing, ...delta });
      }),

    completeEvaluation: (results, evaluationPrompt) =>
      set((state) => {
        state.isEvaluating = false;
        state.activeEvaluations = new Map();
        state.currentEvaluation = {
          evaluationPrompt,
          results,
          evaluatedAt: Date.now(),
        };
      }),

    failEvaluation: (error) =>
      set((state) => {
        state.isEvaluating = false;
        state.activeEvaluations = new Map();
        // Keep existing evaluation if there is one
        console.error('Evaluation failed:', error);
      }),

    clearEvaluation: () =>
      set((state) => {
        state.currentEvaluation = null;
        state.activeEvaluations = new Map();
      }),

    // Snapshot for history/assistant context
    getEvaluationSnapshot: () => {
      const state = get();
      return state.currentEvaluation;
    },

    // Reset
    reset: () => set(initialState),
  }))
);

// Default evaluation scale
export const EVALUATION_SCALE = {
  MIN: 0,
  MAX: 100,
} as const;
