-- Migration: Create prompt_versions table for version history
-- This table stores immutable snapshots of prompts for versioning and production deployment

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
  source VARCHAR(20) DEFAULT 'user',  -- 'user', 'assistant', 'auto'
  label VARCHAR(255),                  -- Optional user-provided label
  changed_part VARCHAR(50),            -- What was changed: 'content', 'intent', 'guardrails', 'examples'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prompt_id, version_number)
);

-- Ensure only one production version per prompt
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_single_production
  ON prompt_versions (prompt_id) WHERE is_production = TRUE;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_is_production ON prompt_versions(is_production) WHERE is_production = TRUE;

-- RLS
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to prompt_versions" ON prompt_versions
  FOR ALL USING (true);

COMMENT ON TABLE prompt_versions IS 'Immutable version snapshots of prompts for version history and production deployment';
COMMENT ON COLUMN prompt_versions.version_number IS 'Auto-incrementing version number per prompt (1, 2, 3...)';
COMMENT ON COLUMN prompt_versions.is_production IS 'Whether this version is currently deployed to production';
COMMENT ON COLUMN prompt_versions.source IS 'What created this version: user, assistant suggestion, or auto-save';
