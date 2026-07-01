export type MessageRole = 'user' | 'interviewer' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  stage?: string;
  quality?: string;
  score?: number;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface ToolCallInfo {
  tool_name: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface StreamingEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'tool_result' | 'message_done' | 'error';
  content?: string;
  tool_name?: string;
  result?: Record<string, unknown>;
  session_state?: Record<string, unknown>;
  full_state?: Record<string, unknown>;
  error?: string;
}
