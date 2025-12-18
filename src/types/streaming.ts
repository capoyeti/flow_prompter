// Streaming types for AI responses

export enum ChunkType {
  CONTENT_START = 'content_start',
  CONTENT_DELTA = 'content_delta',
  CONTENT_END = 'content_end',
  THINKING_START = 'thinking_start',
  THINKING_DELTA = 'thinking_delta',
  THINKING_END = 'thinking_end',
  USAGE = 'usage',
  ERROR = 'error',
  DONE = 'done',
}

export interface StreamChunk {
  type: ChunkType;
  content?: string;
  thinking?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
  };
  error?: string;
  finishReason?: string;
}

export interface StreamingState {
  status: 'idle' | 'streaming' | 'complete' | 'error';
  content: string;
  thinking: string;
  error?: Error;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    totalTokens: number;
  };
  startTime?: number;
  endTime?: number;
}

export const initialStreamingState: StreamingState = {
  status: 'idle',
  content: '',
  thinking: '',
};

// Reducer actions for streaming state
export type StreamingAction =
  | { type: 'START' }
  | { type: 'CONTENT_DELTA'; content: string }
  | { type: 'THINKING_DELTA'; thinking: string }
  | { type: 'COMPLETE'; usage?: StreamingState['usage'] }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };

export function streamingReducer(
  state: StreamingState,
  action: StreamingAction
): StreamingState {
  switch (action.type) {
    case 'START':
      return {
        ...initialStreamingState,
        status: 'streaming',
        startTime: Date.now(),
      };
    case 'CONTENT_DELTA':
      return {
        ...state,
        content: state.content + action.content,
      };
    case 'THINKING_DELTA':
      return {
        ...state,
        thinking: state.thinking + action.thinking,
      };
    case 'COMPLETE':
      return {
        ...state,
        status: 'complete',
        usage: action.usage,
        endTime: Date.now(),
      };
    case 'ERROR':
      return {
        ...state,
        status: 'error',
        error: action.error,
        endTime: Date.now(),
      };
    case 'RESET':
      return initialStreamingState;
    default:
      return state;
  }
}
