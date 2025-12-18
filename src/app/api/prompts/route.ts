// Prompts API - list and create prompts
import { NextRequest } from 'next/server';
import { promptRepository, projectRepository } from '@/lib/db/repositories';
import { STATIC_USER_ID } from '@/config/constants';
import { z } from 'zod';

// GET /api/prompts?projectId=xxx - List all prompts for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return Response.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const prompts = await promptRepository.findByProjectId(projectId);
    return Response.json({ prompts });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return Response.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

const createPromptSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  contentMarkdown: z.string().default(''),
});

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPromptSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const project = await projectRepository.findById(parsed.data.projectId);
    if (!project || project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const prompt = await promptRepository.create({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      contentMarkdown: parsed.data.contentMarkdown,
    });

    return Response.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return Response.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
