-- Migration: Create version_evaluations table for storing evaluation results
-- Stores evaluation results for each prompt version

CREATE TABLE IF NOT EXISTS version_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  run_id UUID REFERENCES prompt_runs(id) ON DELETE SET NULL,  -- Optional link to specific run
  evaluation_prompt TEXT NOT NULL,     -- The criteria used for this evaluation
  evaluator_model_id VARCHAR(100) NOT NULL,  -- Model that performed evaluation
  results_json JSONB NOT NULL,         -- Per-model scores and reasoning
  average_score DECIMAL(5,2),          -- Computed average across all models
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_version_evaluations_version_id ON version_evaluations(version_id);
CREATE INDEX IF NOT EXISTS idx_version_evaluations_run_id ON version_evaluations(run_id);
CREATE INDEX IF NOT EXISTS idx_version_evaluations_evaluated_at ON version_evaluations(evaluated_at DESC);

-- RLS
ALTER TABLE version_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to version_evaluations" ON version_evaluations
  FOR ALL USING (true);

COMMENT ON TABLE version_evaluations IS 'Evaluation results for prompt versions';
COMMENT ON COLUMN version_evaluations.results_json IS 'Array of {modelId, score, reasoning, strengths, improvements}';
COMMENT ON COLUMN version_evaluations.average_score IS 'Average score across all evaluated model outputs (0-100)';
