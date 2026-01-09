-- =============================================
-- FLOW PROMPTER DATABASE SETUP
-- Run this in Supabase SQL Editor to replace old schema
-- =============================================

-- =============================================
-- STEP 1: DROP OLD TABLES (Financial/Compliance System)
-- =============================================

DROP TABLE IF EXISTS compliance_audit_log CASCADE;
DROP TABLE IF EXISTS fica_submissions CASCADE;
DROP TABLE IF EXISTS portfolio_reports CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS holdings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS lisp_platforms CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS advisors CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- =============================================
-- STEP 2: CREATE FLOW PROMPTER SCHEMA
-- =============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt runs table (immutable execution history)
CREATE TABLE IF NOT EXISTS prompt_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_snapshot TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  parameters_json JSONB NOT NULL DEFAULT '{}',
  output_markdown TEXT NOT NULL DEFAULT '',
  thinking_output TEXT,
  usage_json JSONB,
  latency_ms INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assistant conversations table (separate from runs)
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assistant messages table
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  suggestions_json JSONB,
  execution_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt versions table for version history
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  intent TEXT,
  guardrails TEXT,
  examples_json JSONB DEFAULT '[]',
  selected_model_ids JSONB DEFAULT '[]',
  is_production BOOLEAN DEFAULT FALSE,
  deployed_at TIMESTAMPTZ,
  source VARCHAR(20) DEFAULT 'user',
  label VARCHAR(255),
  changed_part VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prompt_id, version_number)
);

-- Evaluation criteria table
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  evaluation_prompt TEXT,
  use_smart_default BOOLEAN DEFAULT TRUE,
  evaluator_model_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prompt_id)
);

-- Version evaluations table
CREATE TABLE IF NOT EXISTS version_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  run_id UUID REFERENCES prompt_runs(id) ON DELETE SET NULL,
  evaluation_prompt TEXT NOT NULL,
  evaluator_model_id VARCHAR(100) NOT NULL,
  results_json JSONB NOT NULL,
  average_score DECIMAL(5,2),
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment audit log table
CREATE TABLE IF NOT EXISTS deployment_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  previous_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  performed_by VARCHAR(255),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_prompt_id ON prompt_runs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_created_at ON prompt_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_prompt_id ON assistant_conversations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation_id ON assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_is_production ON prompt_versions(is_production) WHERE is_production = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_single_production ON prompt_versions (prompt_id) WHERE is_production = TRUE;
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_prompt_id ON evaluation_criteria(prompt_id);
CREATE INDEX IF NOT EXISTS idx_version_evaluations_version_id ON version_evaluations(version_id);
CREATE INDEX IF NOT EXISTS idx_version_evaluations_run_id ON version_evaluations(run_id);
CREATE INDEX IF NOT EXISTS idx_version_evaluations_evaluated_at ON version_evaluations(evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_prompt_id ON deployment_audit_log(prompt_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_version_id ON deployment_audit_log(version_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_performed_at ON deployment_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_action ON deployment_audit_log(action);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API uses service role key)
CREATE POLICY "Service role has full access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Service role has full access to prompts" ON prompts FOR ALL USING (true);
CREATE POLICY "Service role has full access to prompt_runs" ON prompt_runs FOR ALL USING (true);
CREATE POLICY "Service role has full access to assistant_conversations" ON assistant_conversations FOR ALL USING (true);
CREATE POLICY "Service role has full access to assistant_messages" ON assistant_messages FOR ALL USING (true);
CREATE POLICY "Service role has full access to prompt_versions" ON prompt_versions FOR ALL USING (true);
CREATE POLICY "Service role has full access to evaluation_criteria" ON evaluation_criteria FOR ALL USING (true);
CREATE POLICY "Service role has full access to version_evaluations" ON version_evaluations FOR ALL USING (true);
CREATE POLICY "Service role has full access to deployment_audit_log" ON deployment_audit_log FOR ALL USING (true);

-- =============================================
-- DONE! Flow Prompter database is ready.
-- =============================================
