// Projects API - list and create projects
import { NextRequest } from 'next/server';
import { projectRepository } from '@/lib/db/repositories';
import { STATIC_USER_ID } from '@/config/constants';
import { z } from 'zod';

// GET /api/projects - List all projects for the current user
export async function GET() {
  try {
    const projects = await projectRepository.findAll(STATIC_USER_ID);
    return Response.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return Response.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
});

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await projectRepository.create({
      userId: STATIC_USER_ID,
      name: parsed.data.name,
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return Response.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
