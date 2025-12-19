// Assistant store - manages the prompt assistant conversation
// This is SEPARATE from the execution context
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AssistantMessage, PromptSuggestion, ExecutionSnapshot } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

interface AssistantState {
  // Conversation history (separate from execution)
  conversation: AssistantMessage[];

  // Current input being typed
  currentInput: string;

  // Is assistant currently generating
  isGenerating: boolean;

  // Streaming content during generation
  streamingContent: string;

  // Read-only snapshot of execution state (for context)
  executionSnapshot: ExecutionSnapshot | null;

  // Active suggestions that can be applied
  pendingSuggestions: PromptSuggestion[];
}

interface AssistantActions {
  // Input management
  setCurrentInput: (input: string) => void;

  // Conversation management
  addUserMessage: (content: string) => AssistantMessage;
  addAssistantMessage: (content: string, suggestions?: PromptSuggestion[]) => AssistantMessage;
  updateStreamingContent: (delta: string) => void;
  finalizeStreamingMessage: (suggestions?: PromptSuggestion[]) => void;

  // Generation state
  startGeneration: () => void;
  endGeneration: () => void;

  // Snapshot management (bridge from execution context)
  updateExecutionSnapshot: (snapshot: ExecutionSnapshot) => void;

  // Suggestions
  setSuggestions: (suggestions: PromptSuggestion[]) => void;
  clearSuggestions: () => void;

  // Clear conversation
  clearConversation: () => void;

  // Reset
  reset: () => void;
}

const initialState: AssistantState = {
  conversation: [],
  currentInput: '',
  isGenerating: false,
  streamingContent: '',
  executionSnapshot: null,
  pendingSuggestions: [],
};

export const useAssistantStore = create<AssistantState & AssistantActions>()(
  immer((set, get) => ({
    ...initialState,

    // Input management
    setCurrentInput: (input) =>
      set((state) => {
        state.currentInput = input;
      }),

    // Conversation management
    addUserMessage: (content) => {
      const message: AssistantMessage = {
        id: uuidv4(),
        conversationId: '', // Will be set when persisted
        role: 'user',
        content,
        // Capture execution snapshot at time of message
        executionSnapshotJson: get().executionSnapshot ?? undefined,
        createdAt: new Date(),
      };
      set((state) => {
        state.conversation.push(message);
        state.currentInput = '';
      });
      return message;
    },

    addAssistantMessage: (content, suggestions) => {
      const message: AssistantMessage = {
        id: uuidv4(),
        conversationId: '',
        role: 'assistant',
        content,
        suggestionsJson: suggestions,
        createdAt: new Date(),
      };
      set((state) => {
        state.conversation.push(message);
        if (suggestions) {
          state.pendingSuggestions = suggestions;
        }
      });
      return message;
    },

    updateStreamingContent: (delta) =>
      set((state) => {
        state.streamingContent += delta;
      }),

    finalizeStreamingMessage: (suggestions) =>
      set((state) => {
        if (state.streamingContent) {
          state.conversation.push({
            id: uuidv4(),
            conversationId: '',
            role: 'assistant',
            content: state.streamingContent,
            suggestionsJson: suggestions,
            createdAt: new Date(),
          });
          state.streamingContent = '';
          if (suggestions) {
            state.pendingSuggestions = suggestions;
          }
        }
      }),

    // Generation state
    startGeneration: () =>
      set((state) => {
        state.isGenerating = true;
        state.streamingContent = '';
      }),

    endGeneration: () =>
      set((state) => {
        state.isGenerating = false;
      }),

    // Snapshot management
    updateExecutionSnapshot: (snapshot) =>
      set((state) => {
        state.executionSnapshot = snapshot;
      }),

    // Suggestions
    setSuggestions: (suggestions) =>
      set((state) => {
        state.pendingSuggestions = suggestions;
      }),

    clearSuggestions: () =>
      set((state) => {
        state.pendingSuggestions = [];
      }),

    // Clear conversation
    clearConversation: () =>
      set((state) => {
        state.conversation = [];
        state.streamingContent = '';
        state.pendingSuggestions = [];
      }),

    // Reset
    reset: () => set(initialState),
  }))
);

// Helper to build the assistant system prompt with execution context
export function buildAssistantSystemPrompt(snapshot: ExecutionSnapshot | null): string {
  if (!snapshot) {
    return `You are a Prompt Engineering Assistant. Help the user improve their prompts.

Currently, no prompt or execution results are available. Ask the user to:
1. Write a prompt in the editor
2. Run it against one or more models
3. Then ask you for help improving it.`;
  }

  const modelCount = snapshot.latestRuns.length;
  const outputsSection = modelCount > 0
    ? snapshot.latestRuns
        .map(
          (run, index) => `#### Output ${index + 1}: ${run.model} (${run.provider})
Status: ${run.status}
\`\`\`
${run.output.slice(0, 2000)}${run.output.length > 2000 ? '...(truncated)' : ''}
\`\`\``
        )
        .join('\n\n')
    : 'No outputs yet. The user should run the prompt first.';

  // Build intent section if available
  const intentSection = snapshot.promptIntent
    ? `### User's Intent
${snapshot.promptIntent}
`
    : '';

  // Build guardrails section if available
  const guardrailsSection = snapshot.promptGuardrails
    ? `### Guardrails (Rules & Constraints)
${snapshot.promptGuardrails}
`
    : '';

  // Build examples section if available
  const examplesSection = snapshot.promptExamples && snapshot.promptExamples.length > 0
    ? `### Examples
${snapshot.promptExamples
  .map(
    (ex) => `**${ex.type === 'positive' ? 'Positive' : 'Negative'} Example (id: ${ex.id}):**
\`\`\`
${ex.content}
\`\`\``
  )
  .join('\n\n')}
`
    : '';

  // Add multi-model awareness note
  const multiModelNote = modelCount > 1
    ? `\n\n**IMPORTANT: The user is testing against ${modelCount} different models. Analyze each model's output separately and compare their performance. Different models may need different prompt strategies.**\n`
    : '';

  return `You are a Prompt Engineering Assistant. Your role is to help improve prompts based on their outputs.${multiModelNote}

## CONTEXT (READ-ONLY - This is the user's current work)

### Current Prompt: "${snapshot.promptName}"
\`\`\`
${snapshot.promptContent}
\`\`\`

${intentSection}${guardrailsSection}${examplesSection}### Selected Models
${snapshot.selectedModels.map((m) => `- ${m.name} (${m.provider})`).join('\n')}

### Latest Outputs
${outputsSection}

${snapshot.latestEvaluation ? `### Latest Evaluation Results
The outputs were evaluated with the following results:

Evaluation criteria: "${snapshot.latestEvaluation.evaluationPrompt}"

${snapshot.latestEvaluation.results
  .map((r) => {
    let evalSection = `#### ${r.modelId}: Score ${r.score}/100\n`;
    evalSection += `**Reasoning:** ${r.reasoning}\n`;
    if (r.strengths && r.strengths.length > 0) {
      evalSection += `**Strengths:**\n${r.strengths.map(s => `  + ${s}`).join('\n')}\n`;
    }
    if (r.weaknesses && r.weaknesses.length > 0) {
      evalSection += `**Weaknesses:**\n${r.weaknesses.map(w => `  - ${w}`).join('\n')}\n`;
    }
    return evalSection;
  })
  .join('\n')}
` : ''}
---

## Your Responsibilities

1. **Analyze each model's output separately** - Different models have different strengths, personalities, and failure modes
2. **Compare performance across models** - Note which models are performing well vs struggling
3. **Give model-specific advice when relevant** - A prompt fix for one model may not help (or may hurt) another
4. **Explain** what's happening and why for each model
5. **Suggest** concrete improvements to any of the four parts: prompt, intent, examples, or guardrails

## When Suggesting Changes

The user's prompt configuration has FOUR parts you can update independently:
- **prompt**: The main instructions
- **intent**: High-level goal (what the prompt should achieve)
- **examples**: Positive/negative output examples (show-don't-tell guidance)
- **guardrails**: Rules and constraints (what the model must/must not do)

Use the \`target\` attribute to specify which part to update:

### 1. Updating the Prompt
<suggestion target="prompt" type="full_rewrite" confidence="high">
<proposed>
[The complete improved prompt]
</proposed>
<rationale>
[Why this change helps]
</rationale>
</suggestion>

### 2. Updating the Intent
<suggestion target="intent" type="full_rewrite" confidence="medium">
<proposed>
[Clear description of what the prompt should achieve]
</proposed>
<rationale>
[Why clarifying intent helps]
</rationale>
</suggestion>

### 3. Updating Guardrails
<suggestion target="guardrails" type="full_rewrite" confidence="high">
<proposed>
- Never mention competitors
- Keep responses under 200 words
- Always cite sources
</proposed>
<rationale>
[Why these constraints help]
</rationale>
</suggestion>

### 4. Updating Examples
Adding a new positive example:
<suggestion target="examples" type="patch" confidence="high" action="add" example-type="positive">
<proposed>
[The example content]
</proposed>
<rationale>
[Why this example helps]
</rationale>
</suggestion>

Adding a negative example:
<suggestion target="examples" type="patch" confidence="medium" action="add" example-type="negative">
<proposed>
[Example of what to avoid]
</proposed>
<rationale>
[Why showing what to avoid helps]
</rationale>
</suggestion>

## Guidelines for Choosing What to Update

- **Prompt**: Core instructions, task description, context
- **Intent**: When the user's goal isn't clear or outputs miss the point
- **Examples**: When format or style isn't right (show-don't-tell is powerful)
- **Guardrails**: Hard constraints, safety rules, output requirements

## Important Notes

- Focus on improving the configuration, not the conversation
- Each output above is from a DIFFERENT model - analyze them separately
- Don't blend or confuse outputs from different models
- If one model succeeds and another fails, call that out explicitly
- Some changes are universal; others may only help specific models
- Be specific and actionable in your suggestions`;
}
