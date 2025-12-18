import type { PromptExample } from '@/types/models';

export interface BuildPromptInput {
  content: string;
  intent?: string;
  examples?: PromptExample[];
  guardrails?: string;
}

export interface BuiltPrompt {
  // The full combined prompt sent to the model
  fullPrompt: string;
  // Whether any extras were added (for UI display purposes)
  hasExtras: boolean;
}

/**
 * Build a combined prompt that includes the base prompt, intent, examples, and guardrails.
 *
 * Structure:
 * 1. Intent (if provided) - explains what the prompt should accomplish
 * 2. Examples (if provided) - positive/negative output examples
 * 3. Guardrails (if provided) - rules and constraints the model must follow
 * 4. Main prompt content
 */
export function buildPrompt(input: BuildPromptInput): BuiltPrompt {
  const sections: string[] = [];
  let hasExtras = false;

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

  // Add main prompt content
  if (input.content.trim()) {
    if (hasExtras) {
      sections.push(`## Prompt\n${input.content.trim()}`);
    } else {
      // If no extras, just use the content as-is
      sections.push(input.content.trim());
    }
  }

  return {
    fullPrompt: sections.join('\n\n'),
    hasExtras,
  };
}
