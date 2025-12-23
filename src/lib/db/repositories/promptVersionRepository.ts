import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbPromptVersion } from '../types';

// Transform DB row to app model
function toPromptVersion(row: DbPromptVersion) {
  return {
    id: row.id,
    promptId: row.prompt_id,
    versionNumber: row.version_number,
    contentMarkdown: row.content_markdown,
    intent: row.intent,
    guardrails: row.guardrails,
    examples: row.examples_json ?? [],
    selectedModelIds: row.selected_model_ids ?? [],
    isProduction: row.is_production,
    deployedAt: row.deployed_at ? new Date(row.deployed_at) : null,
    source: row.source,
    label: row.label,
    changedPart: row.changed_part,
    createdAt: new Date(row.created_at),
  };
}

export type PromptVersion = ReturnType<typeof toPromptVersion>;

export const promptVersionRepository = {
  /**
   * Find all versions for a prompt, ordered by version number descending
   */
  async findByPromptId(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DbPromptVersion[]).map(toPromptVersion);
  },

  /**
   * Find a specific version by ID
   */
  async findById(id: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptVersion(data as DbPromptVersion) : undefined;
  },

  /**
   * Get the current production version for a prompt
   */
  async findProductionVersion(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_production', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptVersion(data as DbPromptVersion) : undefined;
  },

  /**
   * Get the latest version number for a prompt
   */
  async getLatestVersionNumber(promptId: string): Promise<number> {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    const row = data as { version_number: number } | null;
    return row?.version_number ?? 0;
  },

  /**
   * Create a new version for a prompt
   */
  async create(input: {
    promptId: string;
    contentMarkdown: string;
    intent?: string | null;
    guardrails?: string | null;
    examples?: { input: string; output: string }[];
    selectedModelIds?: string[];
    source?: 'user' | 'assistant' | 'auto';
    label?: string | null;
    changedPart?: 'content' | 'intent' | 'guardrails' | 'examples' | null;
  }) {
    const supabase = getServerSupabaseClient();

    // Get next version number
    const latestVersion = await this.getLatestVersionNumber(input.promptId);
    const nextVersion = latestVersion + 1;

    const insertData = {
      prompt_id: input.promptId,
      version_number: nextVersion,
      content_markdown: input.contentMarkdown,
      intent: input.intent ?? null,
      guardrails: input.guardrails ?? null,
      examples_json: input.examples ?? [],
      selected_model_ids: input.selectedModelIds ?? [],
      is_production: false,
      source: input.source ?? 'user',
      label: input.label ?? null,
      changed_part: input.changedPart ?? null,
    };

    const { data, error } = await supabase
      .from('prompt_versions')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toPromptVersion(data as DbPromptVersion);
  },

  /**
   * Deploy a version to production (sets is_production=true, unsets others)
   */
  async deployToProduction(versionId: string) {
    const supabase = getServerSupabaseClient();

    // First, get the version to find the prompt_id
    const version = await this.findById(versionId);
    if (!version) throw new Error('Version not found');

    // Unset all other production versions for this prompt
    await supabase
      .from('prompt_versions')
      .update({ is_production: false, deployed_at: null } as never)
      .eq('prompt_id', version.promptId)
      .eq('is_production', true);

    // Set this version as production
    const { data, error } = await supabase
      .from('prompt_versions')
      .update({
        is_production: true,
        deployed_at: new Date().toISOString(),
      } as never)
      .eq('id', versionId)
      .select()
      .single();

    if (error) throw error;
    return toPromptVersion(data as DbPromptVersion);
  },

  /**
   * Remove production flag from a version
   */
  async undeployFromProduction(versionId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .update({
        is_production: false,
        deployed_at: null,
      } as never)
      .eq('id', versionId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptVersion(data as DbPromptVersion) : undefined;
  },

  /**
   * Update version label
   */
  async updateLabel(versionId: string, label: string | null) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_versions')
      .update({ label } as never)
      .eq('id', versionId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptVersion(data as DbPromptVersion) : undefined;
  },
};
