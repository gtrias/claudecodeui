/**
 * WebSocket Type Definitions for Claude Code UI
 * TypeScript definitions for WebSocket communication
 */

// ==========================================
// WebSocket Message Types
// ==========================================

export type WebSocketMessageType = 
  | 'claude-command'
  | 'cursor-command'
  | 'codex-command'
  | 'pi-command'
  | 'cursor-resume'
  | 'abort-session'
  | 'claude-permission-response'
  | 'cursor-abort'
  | 'check-session-status'
  | 'get-active-sessions'
  | 'output'
  | 'session-status'
  | 'session-aborted'
  | 'active-sessions'
  | 'url_open'
  | 'loading_progress'
  | 'projects_updated'
  | 'shell-output'
  | 'shell-exit'
  | 'shell-init'
  | 'shell-input';

// ==========================================
// Command Message Types
// ==========================================

export interface CommandMessage {
  type: 'claude-command' | 'cursor-command' | 'codex-command' | 'pi-command';
  command: string;
  options: CommandOptions;
}

export interface CommandOptions {
  projectPath?: string;
  sessionId?: string;
  resume?: boolean;
  cwd?: string;
  model?: string;
}

export interface ResumeMessage {
  type: 'cursor-resume';
  sessionId: string;
  options?: {
    cwd?: string;
  };
}

export interface AbortMessage {
  type: 'abort-session' | 'cursor-abort';
  sessionId: string;
  provider?: 'claude' | 'cursor' | 'codex' | 'pi';
}

export interface PermissionResponseMessage {
  type: 'claude-permission-response';
  requestId: string;
  allow: boolean;
  updatedInput?: string;
  message?: string;
  rememberEntry?: boolean;
}

export interface SessionStatusMessage {
  type: 'check-session-status';
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
  sessionId: string;
}

export interface ActiveSessionsMessage {
  type: 'get-active-sessions';
}

// ==========================================
// Response Message Types
// ==========================================

export interface OutputMessage {
  type: 'output';
  data: string;
}

export interface SessionStatusResponse {
  type: 'session-status';
  sessionId: string;
  provider: string;
  isProcessing: boolean;
}

export interface SessionAbortedResponse {
  type: 'session-aborted';
  sessionId: string;
  provider: string;
  success: boolean;
}

export interface ActiveSessionsResponse {
  type: 'active-sessions';
  sessions: {
    claude: string[];
    cursor: string[];
    codex: string[];
    pi: string[];
  };
}

export interface UrlOpenMessage {
  type: 'url_open';
  url: string;
}

export interface LoadingProgressMessage {
  type: 'loading_progress';
  progress: number;
  message: string;
}

export interface ProjectsUpdatedMessage {
  type: 'projects_updated';
  projects: { name: string; displayName: string; path: string }[];
  timestamp: string;
  changeType: string;
  changedFile: string;
}

// ==========================================
// Shell Message Types
// ==========================================

export interface ShellInitMessage {
  type: 'shell-init';
  projectPath: string;
  sessionId?: string;
  hasSession?: boolean;
  provider?: 'claude' | 'cursor' | 'codex' | 'pi' | 'plain-shell';
  initialCommand?: string;
  cols?: number;
  rows?: number;
}

export interface ShellInputMessage {
  type: 'shell-input';
  data: string;
}

export interface ShellResizeMessage {
  type: 'shell-resize';
  cols: number;
  rows: number;
}

export interface ShellExitMessage {
  type: 'shell-exit';
  exitCode: number;
  signal?: string;
}

export interface ShellOutputMessage {
  type: 'shell-output';
  data: string;
}

// ==========================================
// Shell Response Types
// ==========================================

export interface ShellResponse {
  type: 'output' | 'exit' | 'resize' | 'error';
  data?: string;
  exitCode?: number;
  signal?: string;
}

// ==========================================
// WebSocket Connection Types
// ==========================================

export interface WebSocketConfig {
  url: string;
  token?: string;
  protocols?: string | string[];
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface WebSocketConnection {
  ws: WebSocket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
}

// ==========================================
// Message Handlers
// ==========================================

export type MessageHandler<T extends WebSocketMessageType> = (message: Extract<WebSocketMessage, { type: T }>) => void;

export interface MessageHandlers {
  onCommand?: MessageHandler<'claude-command' | 'cursor-command' | 'codex-command' | 'pi-command'>;
  onOutput?: MessageHandler<'output' | 'shell-output'>;
  onSessionStatus?: MessageHandler<'session-status' | 'shell-exit'>;
  onSessionAborted?: MessageHandler<'session-aborted' | 'cursor-abort'>;
  onUrlOpen?: MessageHandler<'url_open'>;
  onLoadingProgress?: MessageHandler<'loading_progress'>;
  onProjectsUpdated?: MessageHandler<'projects_updated'>;
}

// ==========================================
// Utility Types
// ==========================================

export type WebSocketMessageUnion = 
  | CommandMessage
  | ResumeMessage
  | AbortMessage
  | PermissionResponseMessage
  | SessionStatusMessage
  | ActiveSessionsMessage
  | OutputMessage
  | SessionStatusResponse
  | SessionAbortedResponse
  | ActiveSessionsResponse
  | UrlOpenMessage
  | LoadingProgressMessage
  | ProjectsUpdatedMessage
  | ShellInitMessage
  | ShellInputMessage
  | ShellResizeMessage
  | ShellExitMessage
  | ShellOutputMessage;

export type MessageWithType<T extends WebSocketMessageType> = Extract<WebSocketMessageUnion, { type: T }>;

export type MessageTypes = WebSocketMessageUnion['type'];
