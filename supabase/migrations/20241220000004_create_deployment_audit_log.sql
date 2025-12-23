-- Migration: Create deployment_audit_log table for tracking production deployments
-- Immutable audit trail for all deployment actions

CREATE TABLE IF NOT EXISTS deployment_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,         -- 'deploy', 'rollback', 'undeploy'
  previous_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  performed_by VARCHAR(255),           -- User or system identifier
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT                           -- Optional deployment notes
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_prompt_id ON deployment_audit_log(prompt_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_version_id ON deployment_audit_log(version_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_performed_at ON deployment_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_action ON deployment_audit_log(action);

-- RLS
ALTER TABLE deployment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to deployment_audit_log" ON deployment_audit_log
  FOR ALL USING (true);

COMMENT ON TABLE deployment_audit_log IS 'Immutable audit log of all production deployment actions';
COMMENT ON COLUMN deployment_audit_log.action IS 'Type of action: deploy, rollback, or undeploy';
COMMENT ON COLUMN deployment_audit_log.previous_version_id IS 'The version that was in production before this action';
