// server/pi-rpc-types.ts
import type { ChildProcess } from 'child_process';
import type { Writable } from 'stream';

// Thinking levels supported by Pi
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

// Session states
export type PiSessionState = 'starting' | 'ready' | 'streaming' | 'aborted' | 'closed';

// Model from Pi's get_available_models
export interface PiModel {
  id: string;
  name: string;
  provider: string;
  api: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  cost?: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
}

// Transformed model for UI
export interface PiModelOption {
  value: string;      // "provider/model-id"
  label: string;      // Display name
  provider: string;
  reasoning: boolean;
  contextWindow: number;
}

// Active session tracking
export interface ActivePiSession {
  id: string;
  process: ChildProcess;
  stdin: Writable;
  projectPath: string;
  piSessionFile?: string;
  model?: string;
  thinkingLevel: ThinkingLevel;
  state: PiSessionState;
  createdAt: Date;
  onEvent: (event: PiWebSocketEvent) => void;
  onClose: (code: number) => void;
}

// Start session options
export interface StartPiSessionOptions {
  sessionId: string;
  projectPath: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  resumeSessionPath?: string;
  onEvent: (event: PiWebSocketEvent) => void;
  onClose: (code: number) => void;
}

// Pi RPC commands (client -> Pi)
export type PiRpcCommand =
  | { type: 'prompt'; message: string; images?: ImageContent[] }
  | { type: 'steer'; message: string }
  | { type: 'follow_up'; message: string }
  | { type: 'abort' }
  | { type: 'get_state' }
  | { type: 'get_available_models' }
  | { type: 'set_model'; provider: string; modelId: string }
  | { type: 'set_thinking_level'; level: ThinkingLevel }
  | { type: 'new_session' }
  | { type: 'get_messages' };

// Pi RPC response
export interface PiRpcResponse {
  type: 'response';
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// Pi RPC events (Pi -> client)
export interface PiMessageUpdateEvent {
  type: 'message_update';
  message: unknown;
  assistantMessageEvent: {
    type: 'text_delta' | 'thinking_delta' | 'toolcall_start' | 'toolcall_delta' | 'toolcall_end' | 'done' | 'error';
    delta?: string;
    contentIndex?: number;
    toolCall?: unknown;
    reason?: string;
  };
}

export interface PiToolExecutionEvent {
  type: 'tool_execution_start' | 'tool_execution_update' | 'tool_execution_end';
  toolCallId: string;
  toolName: string;
  args?: object;
  partialResult?: { content: Array<{ type: string; text: string }> };
  result?: { content: Array<{ type: string; text: string }> };
  isError?: boolean;
}

export interface PiExtensionUIRequestEvent {
  type: 'extension_ui_request';
  id: string;
  method: 'select' | 'confirm' | 'input' | 'editor' | 'notify' | 'setStatus';
  title?: string;
  options?: string[];
  message?: string;
  placeholder?: string;
  timeout?: number;
}

export interface PiAgentEvent {
  type: 'agent_start' | 'agent_end';
  messages?: unknown[];
}

export type PiRpcEvent =
  | PiMessageUpdateEvent
  | PiToolExecutionEvent
  | PiExtensionUIRequestEvent
  | PiAgentEvent
  | PiRpcResponse;

// Image content for prompts
export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

// WebSocket events (server -> browser client)
export type PiWebSocketEvent =
  | { type: 'pi-session-created'; sessionId: string; sessionFile?: string }
  | { type: 'pi-text-delta'; sessionId: string; delta: string; contentIndex: number }
  | { type: 'pi-thinking-delta'; sessionId: string; delta: string }
  | { type: 'pi-tool-start'; sessionId: string; toolCallId: string; toolName: string; args: object }
  | { type: 'pi-tool-update'; sessionId: string; toolCallId: string; partialResult: string }
  | { type: 'pi-tool-end'; sessionId: string; toolCallId: string; result: object; isError: boolean }
  | { type: 'pi-permission-request'; sessionId: string; requestId: string; method: string; title: string; options?: string[]; message?: string; timeout?: number }
  | { type: 'pi-agent-start'; sessionId: string }
  | { type: 'pi-agent-end'; sessionId: string; messages: unknown[] }
  | { type: 'pi-error'; sessionId: string; error: string; errorType: PiErrorType }
  | { type: 'pi-session-closed'; sessionId: string; exitCode: number };

// Error types
export type PiErrorType =
  | 'pi_not_installed'
  | 'pi_spawn_failed'
  | 'pi_crash'
  | 'pi_timeout'
  | 'pi_auth_error'
  | 'pi_model_not_found'
  | 'pi_parse_error'
  | 'pi_connection_lost';

// Permission response from client
export interface PiPermissionResponse {
  value?: string;
  confirmed?: boolean;
  cancelled?: boolean;
}
