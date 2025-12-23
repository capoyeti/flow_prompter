import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbEvaluationCriteria, DbVersionEvaluation } from '../types';

// Transform DB row to app model for criteria
function toEvaluationCriteria(row: DbEvaluationCriteria) {
  return {
    id: row.id,
    promptId: row.prompt_id,
    evaluationPrompt: row.evaluation_prompt,
    useSmartDefault: row.use_smart_default,
    evaluatorModelId: row.evaluator_model_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Transform DB row to app model for evaluation results
function toVersionEvaluation(row: DbVersionEvaluation) {
  return {
    id: row.id,
    versionId: row.version_id,
    runId: row.run_id,
    evaluationPrompt: row.evaluation_prompt,
    evaluatorModelId: row.evaluator_model_id,
    results: row.results_json ?? [],
    averageScore: row.average_score,
    evaluatedAt: new Date(row.evaluated_at),
  };
}

export type EvaluationCriteria = ReturnType<typeof toEvaluationCriteria>;
export type VersionEvaluation = ReturnType<typeof toVersionEvaluation>;

export const evaluationCriteriaRepository = {
  /**
   * Find evaluation criteria for a prompt
   */
  async findByPromptId(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('prompt_id', promptId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toEvaluationCriteria(data as DbEvaluationCriteria) : undefined;
  },

  /**
   * Create or update evaluation criteria for a prompt (upsert)
   */
  async upsert(input: {
    promptId: string;
    evaluationPrompt?: string | null;
    useSmartDefault?: boolean;
    evaluatorModelId?: string | null;
  }) {
    const supabase = getServerSupabaseClient();

    const upsertData = {
      prompt_id: input.promptId,
      evaluation_prompt: input.evaluationPrompt ?? null,
      use_smart_default: input.useSmartDefault ?? true,
      evaluator_model_id: input.evaluatorModelId ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('evaluation_criteria')
      .upsert(upsertData as never, { onConflict: 'prompt_id' })
      .select()
      .single();

    if (error) throw error;
    return toEvaluationCriteria(data as DbEvaluationCriteria);
  },

  /**
   * Delete evaluation criteria for a prompt
   */
  async delete(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { error } = await supabase
      .from('evaluation_criteria')
      .delete()
      .eq('prompt_id', promptId);

    if (error) throw error;
    return true;
  },
};

export const versionEvaluationRepository = {
  /**
   * Find all evaluations for a version
   */
  async findByVersionId(versionId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('version_evaluations')
      .select('*')
      .eq('version_id', versionId)
      .order('evaluated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DbVersionEvaluation[]).map(toVersionEvaluation);
  },

  /**
   * Get the latest evaluation for a version
   */
  async findLatestByVersionId(versionId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('version_evaluations')
      .select('*')
      .eq('version_id', versionId)
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toVersionEvaluation(data as DbVersionEvaluation) : undefined;
  },

  /**
   * Create a new evaluation result
   */
  async create(input: {
    versionId: string;
    runId?: string | null;
    evaluationPrompt: string;
    evaluatorModelId: string;
    results: {
      modelId: string;
      score: number;
      reasoning: string;
      strengths?: string[];
      improvements?: string[];
    }[];
  }) {
    const supabase = getServerSupabaseClient();

    // Calculate average score
    const totalScore = input.results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = input.results.length > 0 ? totalScore / input.results.length : null;

    const insertData = {
      version_id: input.versionId,
      run_id: input.runId ?? null,
      evaluation_prompt: input.evaluationPrompt,
      evaluator_model_id: input.evaluatorModelId,
      results_json: input.results,
      average_score: averageScore,
    };

    const { data, error } = await supabase
      .from('version_evaluations')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toVersionEvaluation(data as DbVersionEvaluation);
  },

  /**
   * Delete all evaluations for a version
   */
  async deleteByVersionId(versionId: string) {
    const supabase = getServerSupabaseClient();

    const { error } = await supabase
      .from('version_evaluations')
      .delete()
      .eq('version_id', versionId);

    if (error) throw error;
    return true;
  },
};
