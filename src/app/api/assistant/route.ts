// Assistant endpoint - handles the prompt assistant conversation (SEPARATE from execution)
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import { buildAssistantSystemPrompt } from '@/stores/assistantStore';
import { z } from 'zod';

// Default fallback model if none specified
const DEFAULT_ASSISTANT_MODEL = 'claude-opus-4-5-20251101';

const assistantSchema = z.object({
  message: z.string().min(1),
  modelId: z.string().optional(), // Allow dynamic model selection
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  executionSnapshot: z.object({
    promptContent: z.string(),
    promptName: z.string(),
    promptIntent: z.string().optional(),
    promptExamples: z.array(z.object({
      id: z.string(),
      content: z.string(),
      type: z.enum(['positive', 'negative']),
    })).optional(),
    selectedModels: z.array(z.object({
      id: z.string(),
      name: z.string(),
      provider: z.string(),
    })),
    latestRuns: z.array(z.object({
      model: z.string(),
      provider: z.string(),
      output: z.string(),
      status: z.enum(['pending', 'running', 'completed', 'error']),
    })),
  }).nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assistantSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, modelId, conversationHistory, executionSnapshot } = parsed.data;

    // Build the system prompt with execution context
    const systemPrompt = buildAssistantSystemPrompt(executionSnapshot);

    // Build messages array
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (conversationHistory) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the current message
    messages.push({ role: 'user', content: message });

    // Get the model - use specified modelId or fall back to default
    const model = getLanguageModel(modelId || DEFAULT_ASSISTANT_MODEL);

    // Stream the response
    const result = await streamText({
      model,
      messages,
      temperature: 0.7, // Slightly creative for suggestions
      maxOutputTokens: 4096,
    });

    // Return as streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Assistant error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
