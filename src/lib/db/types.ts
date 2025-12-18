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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
