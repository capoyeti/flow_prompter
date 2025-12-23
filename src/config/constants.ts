// Application constants

export const APP_NAME = 'CloverERA Prompt Evaluator';
export const APP_DESCRIPTION = 'A prompt evaluation tool for testing and optimizing CloverERA feedback analysis prompts';

// Static user ID for now (auth-ready structure)
export const STATIC_USER_ID = '00000000-0000-0000-0000-000000000001';

// LocalStorage keys (all prefixed with cloverera:)
export const STORAGE_KEYS = {
  SELECTED_MODEL_IDS: 'cloverera:selectedModelIds',
  ASSISTANT_PANEL_OPEN: 'cloverera:assistantPanelOpen',
  API_KEY_OPENAI: 'cloverera:apiKey:openai',
  API_KEY_ANTHROPIC: 'cloverera:apiKey:anthropic',
  API_KEY_GOOGLE: 'cloverera:apiKey:google',
  API_KEY_MISTRAL: 'cloverera:apiKey:mistral',
  API_KEY_DEEPSEEK: 'cloverera:apiKey:deepseek',
  API_KEY_PERPLEXITY: 'cloverera:apiKey:perplexity',
  API_KEY_AZURE: 'cloverera:apiKey:azure',
  OLLAMA_BASE_URL: 'cloverera:ollama:baseUrl',
  ONBOARDING_COMPLETE: 'cloverera:onboardingComplete',
  THEME: 'cloverera:theme',
  PANEL_MODEL_ID: 'cloverera:panelModelId', // Shared model for Evaluator & Assistant panel
  FEEDBACK_DATA: 'cloverera:feedbackData', // Uploaded feedback data
} as const;

// API key storage key mapping by provider
export const API_KEY_STORAGE_MAP: Record<string, string> = {
  openai: STORAGE_KEYS.API_KEY_OPENAI,
  anthropic: STORAGE_KEYS.API_KEY_ANTHROPIC,
  google: STORAGE_KEYS.API_KEY_GOOGLE,
  mistral: STORAGE_KEYS.API_KEY_MISTRAL,
  deepseek: STORAGE_KEYS.API_KEY_DEEPSEEK,
  perplexity: STORAGE_KEYS.API_KEY_PERPLEXITY,
  azure: STORAGE_KEYS.API_KEY_AZURE,
};

// Keyboard shortcuts
export const SHORTCUTS = {
  RUN_PROMPT: 'mod+enter',
  SAVE_PROMPT: 'mod+s',
  NEW_PROMPT: 'mod+n',
} as const;

// UI Constants
export const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  ASSISTANT_HEIGHT: 300,
  OUTPUT_CARD_MIN_WIDTH: 320,
} as const;

// Streaming
export const STREAMING = {
  CHUNK_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
} as const;

// Run history
export const HISTORY = {
  MAX_RUNS_DISPLAYED: 50,
  MAX_RUNS_PER_PROMPT: 100,
} as const;

// Evaluation
export const EVALUATION = {
  DEFAULT_MODEL_ID: 'claude-sonnet-4-5-20250929',
  SCALE_MIN: 0,
  SCALE_MAX: 100,
} as const;
