// Ollama models endpoint - dynamically fetches installed models from local Ollama instance

import { NextResponse } from 'next/server';

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaModelInfo {
  id: string;
  name: string;
  displayName: string;
  size: number;
  sizeFormatted: string;
  parameterSize?: string;
  family?: string;
  supportsThinking: boolean;
}

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function getDisplayName(name: string, details?: OllamaModel['details']): string {
  // Clean up model name for display
  // Examples: "deepseek-r1:32b" -> "DeepSeek R1 32B"
  //           "gpt-oss:20b" -> "GPT-OSS 20B"
  //           "mistral:latest" -> "Mistral"

  const [baseName, tag] = name.split(':');

  // Capitalize and format the base name
  const formattedBase = baseName
    .split('-')
    .map(part => {
      // Handle special cases
      if (part.toLowerCase() === 'gpt') return 'GPT';
      if (part.toLowerCase() === 'oss') return 'OSS';
      if (part.toLowerCase() === 'r1') return 'R1';
      if (part.toLowerCase() === 'deepseek') return 'DeepSeek';
      if (part.toLowerCase() === 'qwen') return 'Qwen';
      if (part.toLowerCase() === 'qwen3') return 'Qwen 3';
      if (part.toLowerCase() === 'llama') return 'Llama';
      if (part.toLowerCase() === 'mistral') return 'Mistral';
      if (part.toLowerCase() === 'coder') return 'Coder';
      // Default: capitalize first letter
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');

  // Add tag info if not "latest"
  let displayName = formattedBase;
  if (tag && tag !== 'latest') {
    // Format size tags like "32b" -> "32B"
    const formattedTag = tag.replace(/(\d+)([bB])/, '$1B').toUpperCase();
    displayName += ` ${formattedTag}`;
  }

  // Add parameter size from details if available and not already in name
  if (details?.parameter_size && !displayName.includes(details.parameter_size)) {
    displayName += ` (${details.parameter_size})`;
  }

  return displayName;
}

function supportsThinking(name: string): boolean {
  // Models known to support thinking/reasoning (chain-of-thought)
  const thinkingModels = [
    'deepseek-r1',    // DeepSeek reasoning model
    'qwen3-coder',    // Qwen 3 with reasoning
    'qwen3',          // Qwen 3 base with reasoning
    'gpt-oss',        // OpenAI open-weight model with configurable reasoning
    'o1',             // OpenAI o1 reasoning
    'o3',             // OpenAI o3 reasoning
  ];
  const lowerName = name.toLowerCase();
  return thinkingModels.some(m => lowerName.includes(m));
}

export async function GET() {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout since Ollama should be local
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Ollama models', models: [] },
        { status: response.status }
      );
    }

    const data: OllamaTagsResponse = await response.json();

    const models: OllamaModelInfo[] = data.models.map((model) => ({
      id: `ollama-${model.name.replace(':', '-')}`,
      name: model.name,
      displayName: getDisplayName(model.name, model.details),
      size: model.size,
      sizeFormatted: formatSize(model.size),
      parameterSize: model.details?.parameter_size,
      family: model.details?.family,
      supportsThinking: supportsThinking(model.name),
    }));

    // Sort by size (largest first) to show most capable models at top
    models.sort((a, b) => b.size - a.size);

    return NextResponse.json({ models, baseUrl: ollamaBaseUrl });
  } catch (error) {
    // Ollama not running or not reachable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: `Ollama not reachable at ${ollamaBaseUrl}. Make sure Ollama is running.`,
        details: errorMessage,
        models: []
      },
      { status: 503 }
    );
  }
}
