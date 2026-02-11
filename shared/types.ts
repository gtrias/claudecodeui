/**
 * Shared Type Definitions for Claude Code UI
 * Centralized types for both client and server
 */

// ==========================================
// User & Authentication Types
// ==========================================

export interface User {
  id: number;
  username: string;
  password_hash?: string;
  git_name?: string;
  git_email?: string;
  created_at?: string;
  last_login?: string;
  has_completed_onboarding: boolean;
  is_active: boolean;
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectInfo {
  name: string;
  displayName: string;
  path: string;
  lastSession?: string;
  sessionCount?: number;
}

export interface SessionInfo {
  id: string;
  projectPath: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Chat & Message Types
// ==========================================

export interface ChatMessage {
  type: 'user' | 'assistant' | 'tool' | 'error';
  content: string;
  timestamp: string;
  images?: Image[];
  toolName?: string;
  toolId?: string;
  toolInput?: string;
  toolResult?: string;
  isToolUse?: boolean;
}

export interface Image {
  data: string;
  name: string;
}

export interface ToolMessage {
  type: 'tool';
  toolName: string;
  toolId: string;
  toolInput: string;
  toolResult?: string;
}

// ==========================================
// WebSocket Message Types
// ==========================================

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface ChatCommandMessage {
  type: 'claude-command' | 'cursor-command' | 'codex-command' | 'pi-command';
  command: string;
  options: {
    projectPath?: string;
    sessionId?: string;
    resume?: boolean;
    cwd?: string;
    model?: string;
  };
}

export interface ResumeSessionMessage {
  type: 'cursor-resume';
  sessionId: string;
  options?: {
    cwd?: string;
  };
}

export interface AbortSessionMessage {
  type: 'abort-session';
  sessionId: string;
  provider?: 'claude' | 'cursor' | 'codex' | 'pi';
}

export interface SessionStatusMessage {
  type: 'check-session-status';
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
  sessionId: string;
}

export interface SessionStatusResponse {
  type: 'session-status';
  sessionId: string;
  provider: string;
  isProcessing: boolean;
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

export interface SessionAbortedMessage {
  type: 'session-aborted';
  sessionId: string;
  provider: string;
  success: boolean;
}

export interface OutputMessage {
  type: 'output';
  data: string;
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
  projects: ProjectInfo[];
  timestamp: string;
  changeType: string;
  changedFile: string;
}

// ==========================================
// Database Types
// ==========================================

export interface ApiKeyRow {
  id: number;
  user_id: number;
  key_name: string;
  api_key: string;
  created_at: string;
  last_used?: string;
  is_active: boolean;
}

export interface CredentialRow {
  id: number;
  user_id: number;
  credential_name: string;
  credential_type: 'github_token' | 'gitlab_token' | 'bitbucket_token';
  credential_value: string;
  description?: string;
  created_at: string;
  is_active: boolean;
}

// ==========================================
// Environment Variables Types
// ==========================================

export interface EnvironmentVariable {
  id: number;
  key: string;
  value: string;
  scope: 'global' | `project:${string}`;
  is_sensitive: boolean;
  created_at: number;
  updated_at: number;
}

export interface EnvironmentVariableMasked extends Omit<EnvironmentVariable, 'value'> {
  value: string; // Masked value for UI
  has_value: boolean;
}

export interface EnvironmentVariablesResponse {
  global: EnvironmentVariableMasked[];
  project: EnvironmentVariableMasked[];
}

export interface CreateEnvironmentVariableRequest {
  key: string;
  value: string;
  scope: 'global' | `project:${string}`;
  is_sensitive?: boolean;
}

export interface UpdateEnvironmentVariableRequest {
  value?: string;
  is_sensitive?: boolean;
}

// ==========================================
// Git Types
// ==========================================

export interface GitConfig {
  name: string;
  email: string;
}

export interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// ==========================================
// File System Types
// ==========================================

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export interface FileContent {
  path: string;
  content: string;
}

export interface FileSaveRequest {
  filePath: string;
  content: string;
}

// ==========================================
// Settings Types
// ==========================================

export interface ClaudeSettings {
  allowedTools: string[];
  disallowedTools: string[];
  skipPermissions: boolean;
  projectSortOrder: 'name' | 'lastUsed';
}

export interface ModelOption {
  value: string;
  label: string;
}

export interface ModelConfig {
  OPTIONS: ModelOption[];
  DEFAULT: string;
}

export interface ProviderConfig {
  claude: ModelConfig;
  cursor: ModelConfig;
  codex: ModelConfig;
  pi: ModelConfig;
}

// ==========================================
// Project Configuration Types
// ==========================================

export interface ProjectModelConfig {
  projectId: string;
  timestamp: number;
  activeProvider: 'claude' | 'cursor' | 'codex' | 'pi';
  models: {
    claude: string;
    cursor: string;
    codex: string;
    pi: string;
  };
  codexModelChoice?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

// ==========================================
// MCP (Model Context Protocol) Types
// ==========================================

export interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
}

export interface McpResource {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// ==========================================
// Utility Types
// ==========================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Constructor<T> = new (...args: unknown[]) => T;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ==========================================
// Vite Env Types
// ==========================================

export interface ImportMetaEnv {
  readonly VITE_PORT?: string;
  readonly VITE_IS_PLATFORM?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
