import type { PromptExportData, PromptExample } from '@/types/models';

const EXPORT_VERSION = '1.1';

interface ExportInput {
  promptName: string;
  promptContent: string;
  promptIntent?: string;
  promptGuardrails?: string;
  promptExamples?: PromptExample[];
  completedRuns?: Map<string, {
    modelId: string;
    output: string;
    thinking?: string;
    status: 'completed' | 'error';
    latencyMs?: number;
  }>;
}

/**
 * Build a PromptExportData object from execution store state
 */
export function buildExportData(input: ExportInput): PromptExportData {
  const executionHistory = input.completedRuns
    ? Array.from(input.completedRuns.values())
        .filter((run) => run.status === 'completed')
        .map((run) => ({
          modelId: run.modelId,
          output: run.output,
          thinking: run.thinking,
          status: run.status,
          latencyMs: run.latencyMs,
        }))
    : undefined;

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    prompt: {
      name: input.promptName,
      content: input.promptContent,
      intent: input.promptIntent || undefined,
      guardrails: input.promptGuardrails || undefined,
      examples: input.promptExamples?.length ? input.promptExamples : undefined,
    },
    executionHistory: executionHistory?.length ? executionHistory : undefined,
  };
}

/**
 * Serialize export data to JSON string
 */
export function exportToJson(data: PromptExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Trigger browser download of export JSON
 */
export function downloadExport(data: PromptExportData, filename?: string): void {
  const json = exportToJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = data.prompt.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'prompt';

  const finalFilename = filename || `${sanitizedName}-export.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
