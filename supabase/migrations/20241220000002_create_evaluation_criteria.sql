-- Migration: Create evaluation_criteria table for prompt evaluation configuration
-- Stores the evaluation criteria/rubric for each prompt

CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  evaluation_prompt TEXT,              -- Custom evaluation prompt/rubric
  use_smart_default BOOLEAN DEFAULT TRUE,  -- Whether to use AI-generated default criteria
  evaluator_model_id VARCHAR(100),     -- Model to use for evaluation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prompt_id)
);

-- Index for prompt lookup
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_prompt_id ON evaluation_criteria(prompt_id);

-- RLS
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to evaluation_criteria" ON evaluation_criteria
  FOR ALL USING (true);

COMMENT ON TABLE evaluation_criteria IS 'Evaluation criteria configuration per prompt';
COMMENT ON COLUMN evaluation_criteria.evaluation_prompt IS 'Custom rubric or criteria for evaluating outputs';
COMMENT ON COLUMN evaluation_criteria.use_smart_default IS 'If true, generate criteria from prompt intent/content';
