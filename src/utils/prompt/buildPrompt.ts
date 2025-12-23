import type { PromptExample } from '@/types/models';
import type { FeedbackData } from '@/stores/executionStore';

export interface BuildPromptInput {
  content: string;
  intent?: string;
  examples?: PromptExample[];
  guardrails?: string;
  feedbackData?: FeedbackData | null;
}

export interface BuiltPrompt {
  // The full combined prompt sent to the model
  fullPrompt: string;
  // Whether any extras were added (for UI display purposes)
  hasExtras: boolean;
  // Whether feedback data was injected
  hasFeedbackData: boolean;
}

// Template variable for feedback data injection
const FEEDBACK_DATA_VARIABLE = '{{FEEDBACK_DATA}}';

/**
 * Build a combined prompt that includes the base prompt, intent, examples, guardrails,
 * and feedback data (for CloverERA).
 *
 * Structure:
 * 1. Intent (if provided) - explains what the prompt should accomplish
 * 2. Examples (if provided) - positive/negative output examples
 * 3. Guardrails (if provided) - rules and constraints the model must follow
 * 4. Main prompt content (with {{FEEDBACK_DATA}} replaced if feedback data is provided)
 */
export function buildPrompt(input: BuildPromptInput): BuiltPrompt {
  const sections: string[] = [];
  let hasExtras = false;
  let hasFeedbackData = false;

  // Process content - inject feedback data if present
  let processedContent = input.content;
  if (input.feedbackData && input.feedbackData.rows.length > 0) {
    const feedbackJson = JSON.stringify(input.feedbackData.rows, null, 2);
    if (processedContent.includes(FEEDBACK_DATA_VARIABLE)) {
      processedContent = processedContent.replace(FEEDBACK_DATA_VARIABLE, feedbackJson);
      hasFeedbackData = true;
    }
  }

  // Add intent section if provided
  if (input.intent?.trim()) {
    sections.push(`## Intent\n${input.intent.trim()}`);
    hasExtras = true;
  }

  // Add examples section if provided
  if (input.examples && input.examples.length > 0) {
    const examplesWithContent = input.examples.filter((ex) => ex.content.trim());

    if (examplesWithContent.length > 0) {
      const positiveExamples = examplesWithContent.filter((ex) => ex.type === 'positive');
      const negativeExamples = examplesWithContent.filter((ex) => ex.type === 'negative');

      const exampleParts: string[] = ['## Examples'];

      if (positiveExamples.length > 0) {
        exampleParts.push('### Good outputs (aim for these):');
        positiveExamples.forEach((ex, i) => {
          exampleParts.push(`Example ${i + 1}:\n\`\`\`\n${ex.content.trim()}\n\`\`\``);
        });
      }

      if (negativeExamples.length > 0) {
        exampleParts.push('### Bad outputs (avoid these):');
        negativeExamples.forEach((ex, i) => {
          exampleParts.push(`Example ${i + 1}:\n\`\`\`\n${ex.content.trim()}\n\`\`\``);
        });
      }

      sections.push(exampleParts.join('\n'));
      hasExtras = true;
    }
  }

  // Add guardrails section if provided
  if (input.guardrails?.trim()) {
    sections.push(`## Guardrails\n${input.guardrails.trim()}`);
    hasExtras = true;
  }

  // Add main prompt content (with feedback data already injected)
  if (processedContent.trim()) {
    if (hasExtras) {
      sections.push(`## Prompt\n${processedContent.trim()}`);
    } else {
      // If no extras, just use the content as-is
      sections.push(processedContent.trim());
    }
  }

  return {
    fullPrompt: sections.join('\n\n'),
    hasExtras,
    hasFeedbackData,
  };
}
