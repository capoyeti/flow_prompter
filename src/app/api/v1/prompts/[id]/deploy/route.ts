// External API - Deploy a version to production
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { promptRepository, promptVersionRepository, deploymentAuditRepository } from '@/lib/db/repositories';
import { requireApiKey } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const deploySchema = z.object({
  versionId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

/**
 * POST /api/v1/prompts/[id]/deploy
 *
 * Deploy a specific version to production.
 *
 * Headers:
 *   x-api-key: Your API key (or Authorization: Bearer <key>)
 *
 * Body:
 *   versionId: UUID of the version to deploy
 *   notes: Optional deployment notes
 *
 * Response:
 *   200: { version: PromptVersion, previousVersion?: PromptVersion, auditLog: DeploymentAuditLog }
 *   400: { error: 'Invalid request', details: ... }
 *   401: { error: 'Unauthorized' }
 *   404: { error: 'Prompt not found' } or { error: 'Version not found' }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const parsed = deploySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { versionId, notes } = parsed.data;

    // Verify prompt exists
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      return Response.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Verify version exists and belongs to this prompt
    const version = await promptVersionRepository.findById(versionId);
    if (!version || version.promptId !== id) {
      return Response.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get current production version (if any)
    const previousVersion = await promptVersionRepository.findProductionVersion(id);

    // Deploy the new version
    const deployedVersion = await promptVersionRepository.deployToProduction(versionId);

    // Create audit log entry
    const auditLog = await deploymentAuditRepository.create({
      promptId: id,
      versionId,
      action: previousVersion ? 'deploy' : 'deploy',
      previousVersionId: previousVersion?.id ?? null,
      performedBy: 'api',
      notes: notes ?? null,
    });

    return Response.json({
      version: deployedVersion,
      previousVersion: previousVersion ?? null,
      auditLog,
    });
  } catch (error) {
    console.error('Failed to deploy version:', error);
    return Response.json(
      { error: 'Failed to deploy version' },
      { status: 500 }
    );
  }
}
