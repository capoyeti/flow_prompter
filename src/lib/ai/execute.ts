// Prompt execution logic using Vercel AI SDK
import { streamText } from 'ai';
import { getLanguageModel, ExecuteRequest } from './providers';
import { getModelById } from '@/config/providers';
import { getProvider } from './adapters';

export interface ExecuteOptions extends ExecuteRequest {
  onStart?: () => void;
  onChunk?: (chunk: { content?: string; thinking?: string }) => void;
  onComplete?: (result: ExecuteResult) => void;
  onError?: (error: Error) => void;
}

export interface ExecuteResult {
  content: string;
  thinking?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

export async function executePrompt(options: ExecuteOptions): Promise<ExecuteResult> {
  const { modelId, prompt, systemPrompt, apiKey, parameters, onStart, onComplete, onError } = options;

  const modelConfig = getModelById(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const model = getLanguageModel(modelId, apiKey);
  const startTime = Date.now();

  try {
    onStart?.();

    // Build messages
    const messages: { role: 'system' | 'user'; content: string }[] = [];

    if (systemPrompt && modelConfig.capabilities.supportsSystemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    // Build options based on model capabilities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streamOptions: any = {
      model,
      messages,
    };

    // Add temperature if supported
    if (
      parameters?.temperature !== undefined &&
      modelConfig.capabilities.supportsTemperature
    ) {
      const range = modelConfig.capabilities.temperatureRange;
      if (range) {
        streamOptions.temperature = Math.max(
          range.min,
          Math.min(range.max, parameters.temperature)
        );
      }
    }

    // Add max tokens if supported
    if (
      parameters?.maxTokens !== undefined &&
      modelConfig.capabilities.supportsMaxTokens
    ) {
      const maxAllowed = modelConfig.capabilities.maxOutputTokens;
      streamOptions.maxOutputTokens = maxAllowed
        ? Math.min(parameters.maxTokens, maxAllowed)
        : parameters.maxTokens;
    }

    // Add thinking/reasoning for models that support it
    // Uses adapter's getProviderOptions for provider-specific configuration
    if (
      parameters?.thinking?.enabled &&
      modelConfig.capabilities.supportsThinking
    ) {
      const adapter = getProvider(modelConfig.provider);
      if (adapter?.getProviderOptions) {
        const providerOptions = adapter.getProviderOptions({
          thinking: parameters.thinking,
          modelConfig,
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
        });
        if (Object.keys(providerOptions).length > 0) {
          streamOptions.providerOptions = providerOptions;
        }
      }
    }

    const result = await streamText(streamOptions);

    // Collect the full response
    let content = '';
    let thinking = '';

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        content += part.text;
        options.onChunk?.({ content: part.text });
      } else if (part.type === 'reasoning-delta') {
        thinking += part.text;
        options.onChunk?.({ thinking: part.text });
      }
    }

    const usage = await result.usage;
    const finishReason = await result.finishReason;
    const latencyMs = Date.now() - startTime;

    const executeResult: ExecuteResult = {
      content,
      thinking: thinking || undefined,
      usage: {
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
      },
      finishReason: finishReason ?? 'unknown',
      latencyMs,
    };

    onComplete?.(executeResult);
    return executeResult;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

// Streaming version that returns the stream directly for SSE
export async function executePromptStream(options: ExecuteRequest) {
  const { modelId, prompt, systemPrompt, apiKey, parameters } = options;

  const modelConfig = getModelById(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const model = getLanguageModel(modelId, apiKey);

  // Build messages
  const messages: { role: 'system' | 'user'; content: string }[] = [];

  if (systemPrompt && modelConfig.capabilities.supportsSystemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  // Build options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamOptions: any = {
    model,
    messages,
  };

  // Add temperature if supported
  if (
    parameters?.temperature !== undefined &&
    modelConfig.capabilities.supportsTemperature
  ) {
    const range = modelConfig.capabilities.temperatureRange;
    if (range) {
      streamOptions.temperature = Math.max(
        range.min,
        Math.min(range.max, parameters.temperature)
      );
    }
  }

  // Add max tokens if supported
  if (
    parameters?.maxTokens !== undefined &&
    modelConfig.capabilities.supportsMaxTokens
  ) {
    const maxAllowed = modelConfig.capabilities.maxOutputTokens;
    streamOptions.maxOutputTokens = maxAllowed
      ? Math.min(parameters.maxTokens, maxAllowed)
      : parameters.maxTokens;
  }

  // Add thinking/reasoning for models that support it
  // Uses adapter's getProviderOptions for provider-specific configuration
  if (
    parameters?.thinking?.enabled &&
    modelConfig.capabilities.supportsThinking
  ) {
    const adapter = getProvider(modelConfig.provider);
    if (adapter?.getProviderOptions) {
      const providerOptions = adapter.getProviderOptions({
        thinking: parameters.thinking,
        modelConfig,
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
      });
      if (Object.keys(providerOptions).length > 0) {
        streamOptions.providerOptions = providerOptions;
      }
    }
  }

  return streamText(streamOptions);
}
