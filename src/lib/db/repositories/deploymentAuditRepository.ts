import { getServerSupabaseClient } from '@/lib/supabase/client';
import type { DbDeploymentAuditLog } from '../types';

// Transform DB row to app model
function toDeploymentAuditLog(row: DbDeploymentAuditLog) {
  return {
    id: row.id,
    promptId: row.prompt_id,
    versionId: row.version_id,
    action: row.action,
    previousVersionId: row.previous_version_id,
    performedBy: row.performed_by,
    performedAt: new Date(row.performed_at),
    notes: row.notes,
  };
}

export type DeploymentAuditLog = ReturnType<typeof toDeploymentAuditLog>;

export const deploymentAuditRepository = {
  /**
   * Find all deployment logs for a prompt, ordered by most recent first
   */
  async findByPromptId(promptId: string, limit?: number) {
    const supabase = getServerSupabaseClient();

    let query = supabase
      .from('deployment_audit_log')
      .select('*')
      .eq('prompt_id', promptId)
      .order('performed_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return ((data ?? []) as DbDeploymentAuditLog[]).map(toDeploymentAuditLog);
  },

  /**
   * Find all deployment logs for a specific version
   */
  async findByVersionId(versionId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('deployment_audit_log')
      .select('*')
      .eq('version_id', versionId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DbDeploymentAuditLog[]).map(toDeploymentAuditLog);
  },

  /**
   * Get the most recent deployment for a prompt
   */
  async findLatestByPromptId(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('deployment_audit_log')
      .select('*')
      .eq('prompt_id', promptId)
      .order('performed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toDeploymentAuditLog(data as DbDeploymentAuditLog) : undefined;
  },

  /**
   * Log a deployment action (immutable - cannot be updated or deleted)
   */
  async create(input: {
    promptId: string;
    versionId: string;
    action: 'deploy' | 'rollback' | 'undeploy';
    previousVersionId?: string | null;
    performedBy?: string | null;
    notes?: string | null;
  }) {
    const supabase = getServerSupabaseClient();

    const insertData = {
      prompt_id: input.promptId,
      version_id: input.versionId,
      action: input.action,
      previous_version_id: input.previousVersionId ?? null,
      performed_by: input.performedBy ?? null,
      notes: input.notes ?? null,
    };

    const { data, error } = await supabase
      .from('deployment_audit_log')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return toDeploymentAuditLog(data as DbDeploymentAuditLog);
  },

  /**
   * Get deployment history with counts by action type
   */
  async getDeploymentStats(promptId: string) {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('deployment_audit_log')
      .select('action')
      .eq('prompt_id', promptId);

    if (error) throw error;

    const logs = (data ?? []) as { action: string }[];
    const stats = {
      totalDeployments: logs.filter(l => l.action === 'deploy').length,
      totalRollbacks: logs.filter(l => l.action === 'rollback').length,
      totalUndeploys: logs.filter(l => l.action === 'undeploy').length,
      total: logs.length,
    };

    return stats;
  },
};
