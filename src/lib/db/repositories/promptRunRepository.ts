import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbPromptRun } from '../types';

// Transform DB row to app model
function toPromptRun(row: DbPromptRun) {
  return {
    id: row.id,
    promptId: row.prompt_id,
    promptSnapshot: row.prompt_snapshot,
    provider: row.provider,
    model: row.model,
    parametersJson: row.parameters_json,
    outputMarkdown: row.output_markdown,
    thinkingOutput: row.thinking_output ?? undefined,
    usageJson: row.usage_json ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    status: row.status as 'pending' | 'running' | 'completed' | 'error',
    errorMessage: row.error_message ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export const promptRunRepository = {
  async findByPromptId(promptId: string, options?: { limit?: number; offset?: number }) {
    const supabase = getServerSupabaseClient();

    let query = supabase
      .from('prompt_runs')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return ((data ?? []) as DbPromptRun[]).map(toPromptRun);
  },

  async findById(id: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptRun(data as DbPromptRun) : undefined;
  },

  async create(input: {
    promptId: string;
    promptSnapshot: string;
    provider: string;
    model: string;
    parametersJson: DbPromptRun['parameters_json'];
    outputMarkdown?: string;
    status?: string;
  }) {
    const supabase = getServerSupabaseClient();

    const insertData = {
      prompt_id: input.promptId,
      prompt_snapshot: input.promptSnapshot,
      provider: input.provider,
      model: input.model,
      parameters_json: input.parametersJson,
      output_markdown: input.outputMarkdown ?? '',
      status: input.status ?? 'pending',
    };

    const { data, error } = await supabase
      .from('prompt_runs')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toPromptRun(data as DbPromptRun);
  },

  async update(
    id: string,
    input: {
      outputMarkdown?: string;
      thinkingOutput?: string;
      usageJson?: DbPromptRun['usage_json'];
      latencyMs?: number;
      status?: string;
      errorMessage?: string;
    }
  ) {
    const supabase = getServerSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (input.outputMarkdown !== undefined) updateData.output_markdown = input.outputMarkdown;
    if (input.thinkingOutput !== undefined) updateData.thinking_output = input.thinkingOutput;
    if (input.usageJson !== undefined) updateData.usage_json = input.usageJson;
    if (input.latencyMs !== undefined) updateData.latency_ms = input.latencyMs;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.errorMessage !== undefined) updateData.error_message = input.errorMessage;

    const { data, error } = await supabase
      .from('prompt_runs')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toPromptRun(data as DbPromptRun) : undefined;
  },

  async findLatestByModels(promptId: string, modelIds: string[]) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_runs')
      .select('*')
      .eq('prompt_id', promptId)
      .in('model', modelIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by model and take the most recent for each
    const latestByModel = new Map<string, ReturnType<typeof toPromptRun>>();
    for (const row of (data ?? []) as DbPromptRun[]) {
      if (!latestByModel.has(row.model)) {
        latestByModel.set(row.model, toPromptRun(row));
      }
    }
    return latestByModel;
  },

  async findRecentCompleted(promptId: string, limit = 10) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('prompt_runs')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data ?? []) as DbPromptRun[]).map(toPromptRun);
  },
};
