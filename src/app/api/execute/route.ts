// Execute endpoint - streams prompt execution to a model
import { NextRequest } from 'next/server';
import { executePromptStream } from '@/lib/ai/execute';
import { getModelConfigDynamic } from '@/config/providers';
import { promptRepository, promptRunRepository } from '@/lib/db/repositories';
import { z } from 'zod';

const executeSchema = z.object({
  promptId: z.string().uuid().optional(),
  promptContent: z.string().min(1),
  modelId: z.string(),
  apiKey: z.string().optional(), // Client-provided API key
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    thinking: z.object({
      enabled: z.boolean(),
      budget: z.number().positive().optional(),
    }).optional(),
    systemPrompt: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = executeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { promptId, promptContent, modelId, apiKey, parameters } = parsed.data;

    // Validate model exists (supports both static models and dynamic Ollama models)
    const modelConfig = getModelConfigDynamic(modelId);
    if (!modelConfig) {
      return Response.json(
        { error: `Unknown model: ${modelId}` },
        { status: 400 }
      );
    }

    // Create run record (for tracking)
    let runId: string | undefined;
    if (promptId) {
      const prompt = await promptRepository.findById(promptId);
      if (prompt) {
        const run = await promptRunRepository.create({
          promptId,
          promptSnapshot: promptContent,
          provider: modelConfig.provider,
          model: modelId,
          parametersJson: parameters ?? {},
          outputMarkdown: '',
          status: 'running',
        });
        runId = run.id;
      }
    }

    // Execute with streaming
    const result = await executePromptStream({
      modelId,
      prompt: promptContent,
      systemPrompt: parameters?.systemPrompt,
      apiKey,
      parameters,
    });

    // Get the text stream response
    const response = result.toTextStreamResponse();

    // Add run ID header if we created a run
    if (runId) {
      const headers = new Headers(response.headers);
      headers.set('X-Run-Id', runId);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  } catch (error) {
    console.error('Execute error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
