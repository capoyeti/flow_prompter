// External API - Get current production version of a prompt
import { NextRequest } from 'next/server';
import { promptRepository, promptVersionRepository } from '@/lib/db/repositories';
import { requireApiKey } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/prompts/[id]/production
 *
 * Get the current production version of a prompt.
 * This is the endpoint external systems should use to fetch the active prompt.
 *
 * Headers:
 *   x-api-key: Your API key (or Authorization: Bearer <key>)
 *
 * Response:
 *   200: { version: PromptVersion, prompt: { id, name } }
 *   401: { error: 'Unauthorized' }
 *   404: { error: 'Prompt not found' } or { error: 'No production version' }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Verify prompt exists
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Get production version
    const productionVersion = await promptVersionRepository.findProductionVersion(id);
    if (!productionVersion) {
      return Response.json(
        { error: 'No production version deployed for this prompt' },
        { status: 404 }
      );
    }

    return Response.json({
      version: productionVersion,
      prompt: {
        id: prompt.id,
        name: prompt.name,
      },
    });
  } catch (error) {
    console.error('Failed to fetch production version:', error);
    return Response.json(
      { error: 'Failed to fetch production version' },
      { status: 500 }
    );
  }
}
