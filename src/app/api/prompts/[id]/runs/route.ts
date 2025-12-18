// Prompt Runs API - list runs for a prompt
import { NextRequest } from 'next/server';
import { promptRepository, promptRunRepository } from '@/lib/db/repositories';
import { STATIC_USER_ID } from '@/config/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/prompts/[id]/runs - List runs for a prompt
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Verify prompt exists and belongs to user
    const result = await promptRepository.findByIdWithProject(id);
    if (!result || result.project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const runs = await promptRunRepository.findByPromptId(id, { limit, offset });
    return Response.json({ runs });
  } catch (error) {
    console.error('Failed to fetch runs:', error);
    return Response.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}
