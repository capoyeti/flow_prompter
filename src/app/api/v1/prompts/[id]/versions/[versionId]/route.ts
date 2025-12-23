// External API - Get a specific version with evaluations
import { NextRequest } from 'next/server';
import { promptRepository, promptVersionRepository, versionEvaluationRepository } from '@/lib/db/repositories';
import { requireApiKey } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * GET /api/v1/prompts/[id]/versions/[versionId]
 *
 * Get a specific version with its evaluations.
 *
 * Headers:
 *   x-api-key: Your API key (or Authorization: Bearer <key>)
 *
 * Query Parameters:
 *   include_evaluations: Whether to include evaluation history (default: true)
 *
 * Response:
 *   200: { version: PromptVersion, prompt: { id, name }, evaluations?: VersionEvaluation[] }
 *   401: { error: 'Unauthorized' }
 *   404: { error: 'Prompt not found' } or { error: 'Version not found' }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id, versionId } = await params;
    const { searchParams } = new URL(request.url);
    const includeEvaluations = searchParams.get('include_evaluations') !== 'false';

    // Verify prompt exists
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Get the specific version
    const version = await promptVersionRepository.findById(versionId);
    if (!version || version.promptId !== id) {
      return Response.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Optionally include evaluations
    let evaluations = undefined;
    if (includeEvaluations) {
      evaluations = await versionEvaluationRepository.findByVersionId(versionId);
    }

    return Response.json({
      version,
      prompt: {
        id: prompt.id,
        name: prompt.name,
      },
      evaluations,
    });
  } catch (error) {
    console.error('Failed to fetch version:', error);
    return Response.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}
