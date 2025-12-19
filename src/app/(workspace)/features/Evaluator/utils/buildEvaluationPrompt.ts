// Utility for building smart default evaluation prompts

/**
 * Builds a smart default evaluation prompt based on available context.
 * Uses intent if available, otherwise falls back to generic evaluation.
 */
export function buildSmartDefaultPrompt(intent?: string): string {
  if (intent?.trim()) {
    return `Evaluate how well each output achieves the following intent:

"${intent}"

Consider clarity, completeness, accuracy, and alignment with the stated goal.`;
  }

  return `Evaluate how well each output addresses the prompt's apparent goal.

Consider:
- Relevance to the prompt
- Clarity and coherence
- Completeness of response
- Accuracy of information (if applicable)`;
}

/**
 * Gets a preview of what the evaluation will assess.
 * Used to show users what criteria will be evaluated.
 */
export function getEvaluationPreview(
  intent?: string,
  customPrompt?: string
): string {
  if (customPrompt?.trim()) {
    return customPrompt;
  }
  return buildSmartDefaultPrompt(intent);
}
