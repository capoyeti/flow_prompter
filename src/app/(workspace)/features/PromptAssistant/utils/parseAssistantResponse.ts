// Parser for structured assistant responses
// Handles XML-like suggestion blocks in responses

import type { SuggestionTarget, ExampleType, ExampleOperation } from '@/types/models';

export interface ParsedSuggestion {
  id: string;
  type: 'full_rewrite' | 'patch';
  target: SuggestionTarget;
  confidence: 'high' | 'medium' | 'low';
  proposed: string;
  rationale: string;
  exampleOperation?: ExampleOperation;
}

export interface ParsedResponse {
  segments: Array<
    | { type: 'text'; content: string }
    | { type: 'suggestion'; suggestion: ParsedSuggestion }
  >;
  hasSuggestions: boolean;
}

// Regex to match suggestion blocks with optional target and example attributes
// Supports: target="prompt|intent|examples|guardrails" (defaults to "prompt")
// For examples: action="add|update|remove", example-type="positive|negative", example-id="..."
const SUGGESTION_REGEX =
  /<suggestion\s+(?:target="([^"]+)"\s+)?type="([^"]+)"\s+confidence="([^"]+)"(?:\s+action="([^"]+)")?(?:\s+example-type="([^"]+)")?(?:\s+example-id="([^"]+)")?>\s*<proposed>([\s\S]*?)<\/proposed>\s*<rationale>([\s\S]*?)<\/rationale>\s*<\/suggestion>/gi;

export function parseAssistantResponse(content: string): ParsedResponse {
  const segments: ParsedResponse['segments'] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let suggestionCount = 0;

  // Reset regex state
  SUGGESTION_REGEX.lastIndex = 0;

  while ((match = SUGGESTION_REGEX.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Parse the suggestion
    const [, targetRaw, typeRaw, confidenceRaw, actionRaw, exampleTypeRaw, exampleIdRaw, proposed, rationale] = match;

    // Parse target (default to "prompt" for backward compatibility)
    const target: SuggestionTarget =
      targetRaw === 'intent' || targetRaw === 'examples' || targetRaw === 'guardrails'
        ? targetRaw
        : 'prompt';

    const type = typeRaw === 'patch' ? 'patch' : 'full_rewrite';
    const confidence =
      confidenceRaw === 'low'
        ? 'low'
        : confidenceRaw === 'medium'
          ? 'medium'
          : 'high';

    // Build example operation if targeting examples
    let exampleOperation: ExampleOperation | undefined;
    if (target === 'examples' && actionRaw) {
      const action = actionRaw === 'update' || actionRaw === 'remove' ? actionRaw : 'add';
      exampleOperation = {
        action,
        exampleId: exampleIdRaw || undefined,
        exampleType: (exampleTypeRaw === 'positive' || exampleTypeRaw === 'negative'
          ? exampleTypeRaw
          : undefined) as ExampleType | undefined,
      };
    }

    segments.push({
      type: 'suggestion',
      suggestion: {
        id: `suggestion-${Date.now()}-${suggestionCount++}`,
        type,
        target,
        confidence,
        proposed: proposed.trim(),
        rationale: rationale.trim(),
        exampleOperation,
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trim();
    if (textAfter) {
      segments.push({ type: 'text', content: textAfter });
    }
  }

  // If no segments were found, treat entire content as text
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content: content.trim() });
  }

  return {
    segments,
    hasSuggestions: segments.some((s) => s.type === 'suggestion'),
  };
}

// Helper to extract just the suggestions from a response
export function extractSuggestions(content: string): ParsedSuggestion[] {
  const parsed = parseAssistantResponse(content);
  return parsed.segments
    .filter((s): s is { type: 'suggestion'; suggestion: ParsedSuggestion } =>
      s.type === 'suggestion'
    )
    .map((s) => s.suggestion);
}
