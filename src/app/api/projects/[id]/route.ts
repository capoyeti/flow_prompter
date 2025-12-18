// Project API - get, update, delete a single project
import { NextRequest } from 'next/server';
import { projectRepository } from '@/lib/db/repositories';
import { STATIC_USER_ID } from '@/config/constants';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return Response.json({ project });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return Response.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify exists and ownership
    const existing = await projectRepository.findById(id);
    if (!existing || existing.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = await projectRepository.update(id, parsed.data);
    return Response.json({ project });
  } catch (error) {
    console.error('Failed to update project:', error);
    return Response.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify exists and ownership
    const existing = await projectRepository.findById(id);
    if (!existing || existing.userId !== STATIC_USER_ID) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await projectRepository.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return Response.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
