// External API - List all versions of a prompt
import { NextRequest } from 'next/server';
import { promptRepository, promptVersionRepository } from '@/lib/db/repositories';
import { requireApiKey } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/prompts/[id]/versions
 *
 * List all versions of a prompt, ordered by version number descending.
 *
 * Headers:
 *   x-api-key: Your API key (or Authorization: Bearer <key>)
 *
 * Query Parameters:
 *   limit: Maximum number of versions to return (default: 50)
 *   offset: Number of versions to skip (default: 0)
 *
 * Response:
 *   200: { versions: PromptVersion[], prompt: { id, name }, pagination: { total, limit, offset } }
 *   401: { error: 'Unauthorized' }
 *   404: { error: 'Prompt not found' }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Verify prompt exists
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Get all versions (we'll slice for pagination)
    const allVersions = await promptVersionRepository.findByPromptId(id);
    const paginatedVersions = allVersions.slice(offset, offset + limit);

    return Response.json({
      versions: paginatedVersions,
      prompt: {
        id: prompt.id,
        name: prompt.name,
      },
      pagination: {
        total: allVersions.length,
        limit,
        offset,
        hasMore: offset + limit < allVersions.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    return Response.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
