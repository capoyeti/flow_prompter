import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbProject } from '../types';

// Transform DB row to app model
function toProject(row: DbProject) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const projectRepository = {
  async findAll(userId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DbProject[]).map(toProject);
  },

  async findById(id: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toProject(data as DbProject) : undefined;
  },

  async create(input: { userId: string; name: string }) {
    const supabase = getServerSupabaseClient();

    const insertData = {
      user_id: input.userId,
      name: input.name,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toProject(data as DbProject);
  },

  async update(id: string, input: { name?: string }) {
    const supabase = getServerSupabaseClient();

    const updateData = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toProject(data as DbProject) : undefined;
  },

  async delete(id: string) {
    const supabase = getServerSupabaseClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};
