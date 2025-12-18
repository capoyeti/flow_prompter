import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbPrompt, DbProject } from '../types';

// Transform DB row to app model
function toPrompt(row: DbPrompt) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    contentMarkdown: row.content_markdown,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const promptRepository = {
  async findByProjectId(projectId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DbPrompt[]).map(toPrompt);
  },

  async findById(id: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPrompt(data as DbPrompt) : undefined;
  },

  async create(input: { projectId: string; name: string; contentMarkdown?: string }) {
    const supabase = getServerSupabaseClient();

    const insertData = {
      project_id: input.projectId,
      name: input.name,
      content_markdown: input.contentMarkdown ?? '',
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toPrompt(data as DbPrompt);
  },

  async update(id: string, input: { name?: string; contentMarkdown?: string }) {
    const supabase = getServerSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.contentMarkdown !== undefined) updateData.content_markdown = input.contentMarkdown;

    const { data, error } = await supabase
      .from('prompts')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPrompt(data as DbPrompt) : undefined;
  },

  async delete(id: string) {
    const supabase = getServerSupabaseClient();

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async findByIdWithProject(id: string) {
    const supabase = getServerSupabaseClient();

    // Get prompt
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (promptError && promptError.code !== 'PGRST116') throw promptError;
    if (!promptData) return undefined;

    const prompt = promptData as DbPrompt;

    // Get project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', prompt.project_id)
      .single();

    if (projectError) throw projectError;

    const project = projectData as DbProject;

    return {
      prompt: toPrompt(prompt),
      project: {
        id: project.id,
        userId: project.user_id,
        name: project.name,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      },
    };
  },
};
