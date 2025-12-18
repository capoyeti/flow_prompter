import type { PromptExample, ExampleType } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

export interface ImportResult {
  success: boolean;
  data?: ParsedImportData;
  error?: string;
}

export interface ParsedImportData {
  promptName: string;
  promptContent: string;
  promptIntent?: string;
  promptGuardrails?: string;
  promptExamples?: PromptExample[];
  executionHistory?: {
    modelId: string;
    output: string;
    thinking?: string;
    status: string;
    latencyMs?: number;
  }[];
}

/**
 * Parse and validate import JSON with fault tolerance
 * - Ignores unknown fields
 * - Provides sensible defaults for missing optional fields
 * - Validates required fields exist
 */
export function parseImportJson(jsonString: string): ImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      error: 'Invalid JSON format',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      error: 'Invalid data structure',
    };
  }

  const data = parsed as Record<string, unknown>;

  // Check for prompt object (required)
  if (!data.prompt || typeof data.prompt !== 'object') {
    return {
      success: false,
      error: 'Missing required "prompt" field',
    };
  }

  const prompt = data.prompt as Record<string, unknown>;

  // Validate required prompt content
  if (typeof prompt.content !== 'string' || !prompt.content.trim()) {
    return {
      success: false,
      error: 'Missing or empty prompt content',
    };
  }

  // Build result with defaults for missing optional fields
  const result: ParsedImportData = {
    promptName: typeof prompt.name === 'string' && prompt.name.trim()
      ? prompt.name
      : 'Imported Prompt',
    promptContent: prompt.content as string,
  };

  // Optional: intent
  if (typeof prompt.intent === 'string' && prompt.intent.trim()) {
    result.promptIntent = prompt.intent;
  }

  // Optional: guardrails
  if (typeof prompt.guardrails === 'string' && prompt.guardrails.trim()) {
    result.promptGuardrails = prompt.guardrails;
  }

  // Optional: examples (with validation and ID generation)
  if (Array.isArray(prompt.examples)) {
    const validExamples: PromptExample[] = [];

    for (const ex of prompt.examples) {
      if (ex && typeof ex === 'object') {
        const example = ex as Record<string, unknown>;
        if (typeof example.content === 'string') {
          const exampleType: ExampleType =
            example.type === 'positive' || example.type === 'negative'
              ? example.type
              : 'positive';

          validExamples.push({
            id: typeof example.id === 'string' ? example.id : uuidv4(),
            content: example.content,
            type: exampleType,
          });
        }
      }
    }

    if (validExamples.length > 0) {
      result.promptExamples = validExamples;
    }
  }

  // Optional: execution history
  if (Array.isArray(data.executionHistory)) {
    const validRuns: ParsedImportData['executionHistory'] = [];

    for (const run of data.executionHistory) {
      if (run && typeof run === 'object') {
        const r = run as Record<string, unknown>;
        if (typeof r.modelId === 'string' && typeof r.output === 'string') {
          validRuns.push({
            modelId: r.modelId,
            output: r.output,
            thinking: typeof r.thinking === 'string' ? r.thinking : undefined,
            status: typeof r.status === 'string' ? r.status : 'completed',
            latencyMs: typeof r.latencyMs === 'number' ? r.latencyMs : undefined,
          });
        }
      }
    }

    if (validRuns.length > 0) {
      result.executionHistory = validRuns;
    }
  }

  return {
    success: true,
    data: result,
  };
}

/**
 * Read file contents and parse as import JSON
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        resolve({
          success: false,
          error: 'Failed to read file',
        });
        return;
      }
      resolve(parseImportJson(content));
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsText(file);
  });
}
