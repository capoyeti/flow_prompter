// Database types for Supabase tables

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbPrompt {
  id: string;
  project_id: string;
  name: string;
  content_markdown: string;
  created_at: string;
  updated_at: string;
}

export interface DbPromptRun {
  id: string;
  prompt_id: string;
  prompt_snapshot: string;
  provider: string;
  model: string;
  parameters_json: {
    temperature?: number;
    maxTokens?: number;
    thinking?: { enabled: boolean; budget?: number };
    systemPrompt?: string;
  };
  output_markdown: string;
  thinking_output: string | null;
  usage_json: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    totalTokens: number;
  } | null;
  latency_ms: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface DbAssistantConversation {
  id: string;
  prompt_id: string;
  created_at: string;
}

export interface DbAssistantMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions_json: {
    id: string;
    type: 'full_rewrite' | 'patch' | 'structural';
    proposedPrompt: string;
    rationale: string;
    confidence: 'high' | 'medium' | 'low';
  }[] | null;
  execution_snapshot_json: {
    promptContent: string;
    promptName: string;
    selectedModels: { id: string; name: string; provider: string }[];
    latestRuns: { model: string; provider: string; output: string; status: string }[];
  } | null;
  created_at: string;
}

// Version history types
export interface DbPromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content_markdown: string;
  intent: string | null;
  guardrails: string | null;
  examples_json: { input: string; output: string }[];
  selected_model_ids: string[];
  is_production: boolean;
  deployed_at: string | null;
  source: 'user' | 'assistant' | 'auto';
  label: string | null;
  changed_part: 'content' | 'intent' | 'guardrails' | 'examples' | null;
  created_at: string;
}

export interface DbEvaluationCriteria {
  id: string;
  prompt_id: string;
  evaluation_prompt: string | null;
  use_smart_default: boolean;
  evaluator_model_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVersionEvaluation {
  id: string;
  version_id: string;
  run_id: string | null;
  evaluation_prompt: string;
  evaluator_model_id: string;
  results_json: {
    modelId: string;
    score: number;
    reasoning: string;
    strengths?: string[];
    improvements?: string[];
  }[];
  average_score: number | null;
  evaluated_at: string;
}

export interface DbDeploymentAuditLog {
  id: string;
  prompt_id: string;
  version_id: string;
  action: 'deploy' | 'rollback' | 'undeploy';
  previous_version_id: string | null;
  performed_by: string | null;
  performed_at: string;
  notes: string | null;
}

// Supabase Database type definition
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: DbProject;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompts: {
        Row: DbPrompt;
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          content_markdown?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          content_markdown?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_runs: {
        Row: DbPromptRun;
        Insert: {
          id?: string;
          prompt_id: string;
          prompt_snapshot: string;
          provider: string;
          model: string;
          parameters_json: DbPromptRun['parameters_json'];
          output_markdown?: string;
          thinking_output?: string | null;
          usage_json?: DbPromptRun['usage_json'];
          latency_ms?: number | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          prompt_snapshot?: string;
          provider?: string;
          model?: string;
          parameters_json?: DbPromptRun['parameters_json'];
          output_markdown?: string;
          thinking_output?: string | null;
          usage_json?: DbPromptRun['usage_json'];
          latency_ms?: number | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      assistant_conversations: {
        Row: DbAssistantConversation;
        Insert: {
          id?: string;
          prompt_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          created_at?: string;
        };
      };
      assistant_messages: {
        Row: DbAssistantMessage;
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          suggestions_json?: DbAssistantMessage['suggestions_json'];
          execution_snapshot_json?: DbAssistantMessage['execution_snapshot_json'];
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          suggestions_json?: DbAssistantMessage['suggestions_json'];
          execution_snapshot_json?: DbAssistantMessage['execution_snapshot_json'];
          created_at?: string;
        };
      };
      prompt_versions: {
        Row: DbPromptVersion;
        Insert: {
          id?: string;
          prompt_id: string;
          version_number: number;
          content_markdown: string;
          intent?: string | null;
          guardrails?: string | null;
          examples_json?: DbPromptVersion['examples_json'];
          selected_model_ids?: string[];
          is_production?: boolean;
          deployed_at?: string | null;
          source?: DbPromptVersion['source'];
          label?: string | null;
          changed_part?: DbPromptVersion['changed_part'];
          created_at?: string;
        };
        Update: {
          is_production?: boolean;
          deployed_at?: string | null;
          label?: string | null;
        };
      };
      evaluation_criteria: {
        Row: DbEvaluationCriteria;
        Insert: {
          id?: string;
          prompt_id: string;
          evaluation_prompt?: string | null;
          use_smart_default?: boolean;
          evaluator_model_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          evaluation_prompt?: string | null;
          use_smart_default?: boolean;
          evaluator_model_id?: string | null;
          updated_at?: string;
        };
      };
      version_evaluations: {
        Row: DbVersionEvaluation;
        Insert: {
          id?: string;
          version_id: string;
          run_id?: string | null;
          evaluation_prompt: string;
          evaluator_model_id: string;
          results_json: DbVersionEvaluation['results_json'];
          average_score?: number | null;
          evaluated_at?: string;
        };
        Update: {
          results_json?: DbVersionEvaluation['results_json'];
          average_score?: number | null;
        };
      };
      deployment_audit_log: {
        Row: DbDeploymentAuditLog;
        Insert: {
          id?: string;
          prompt_id: string;
          version_id: string;
          action: DbDeploymentAuditLog['action'];
          previous_version_id?: string | null;
          performed_by?: string | null;
          performed_at?: string;
          notes?: string | null;
        };
        Update: never;  // Immutable audit log
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
