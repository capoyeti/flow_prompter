// Prompt API - get, update, delete a single prompt
import { NextRequest } from 'next/server';
import { promptRepository } from '@/lib/db/repositories';
import { STATIC_USER_ID } from '@/config/constants';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/prompts/[id] - Get a single prompt
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await promptRepository.findByIdWithProject(id);

    if (!result) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Verify ownership via project
    if (result.project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return Response.json({ prompt: result.prompt });
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    return Response.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

const updatePromptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contentMarkdown: z.string().optional(),
});

// PATCH /api/prompts/[id] - Update a prompt
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify exists and ownership
    const result = await promptRepository.findByIdWithProject(id);
    if (!result || result.project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const prompt = await promptRepository.update(id, parsed.data);
    return Response.json({ prompt });
  } catch (error) {
    console.error('Failed to update prompt:', error);
    return Response.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Delete a prompt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify exists and ownership
    const result = await promptRepository.findByIdWithProject(id);
    if (!result || result.project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    await promptRepository.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return Response.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
