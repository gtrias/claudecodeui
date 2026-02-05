/**
 * API Type Definitions for Claude Code UI
 * TypeScript definitions for API calls
 */

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
  };
  token?: string;
  error?: string;
}

export interface ProjectResponse {
  name: string;
  displayName: string;
  path: string;
  lastSession?: string;
  sessionCount?: number;
}

export interface SessionResponse {
  id: string;
  projectPath: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  type: 'user' | 'assistant' | 'tool' | 'error';
  content: string;
  timestamp: string;
  images?: { data: string; name: string }[];
  toolName?: string;
  toolId?: string;
  toolInput?: string;
  toolResult?: string;
  isToolUse?: boolean;
}

export interface FileResponse {
  path: string;
  content: string;
}

export interface SettingsResponse {
  [key: string]: unknown;
}

// ==========================================
// API Request Types
// ==========================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface CreateProjectRequest {
  path: string;
}

export interface CreateFolderRequest {
  path: string;
}

export interface SaveFileRequest {
  filePath: string;
  content: string;
}

export interface ChatCommandRequest {
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

export interface AbortSessionRequest {
  type: 'abort-session';
  sessionId: string;
  provider: string;
}

export interface ResumeSessionRequest {
  type: 'cursor-resume';
  sessionId: string;
  options?: {
    cwd?: string;
  };
}

export interface SessionStatusRequest {
  type: 'check-session-status';
  provider: string;
  sessionId: string;
}

// ==========================================
// API Methods
// ==========================================

export interface AuthApi {
  status(): Promise<ApiResponse<{ needsSetup: boolean }>>;
  login(username: string, password: string): Promise<ApiResponse<AuthResponse>>;
  register(username: string, password: string): Promise<ApiResponse<AuthResponse>>;
  user(): Promise<ApiResponse<{ user: any }>>;
  logout(): Promise<ApiResponse>;
}

export interface ProjectsApi {
  list(): Promise<ApiResponse<ProjectResponse[]>>;
  get(projectName: string): Promise<ApiResponse<ProjectResponse>>;
  create(path: string): Promise<ApiResponse>;
  delete(projectName: string): Promise<ApiResponse>;
  rename(projectName: string, displayName: string): Promise<ApiResponse>;
  browse(path?: string): Promise<ApiResponse<{ path: string; suggestions: { path: string; name: string; type: string }[] }>>;
  createFolder(path: string): Promise<ApiResponse>;
  readFile(projectName: string, filePath: string): Promise<ApiResponse<FileResponse>>;
  saveFile(projectName: string, filePath: string, content: string): Promise<ApiResponse>;
  listFiles(projectName: string): Promise<ApiResponse<{ name: string; path: string; type: 'file' | 'directory' }[]>>;
}

export interface CommandsApi {
  send(command: string, options: { projectPath?: string; sessionId?: string; model?: string }): Promise<void>;
  abort(sessionId: string, provider: string): Promise<void>;
  resume(sessionId: string, provider: string): Promise<void>;
  getStatus(sessionId: string, provider: string): Promise<ApiResponse<{ isProcessing: boolean }>>;
}

export interface SettingsApi {
  save(key: string, value: unknown): Promise<ApiResponse>;
  load<T>(key: string): Promise<ApiResponse<T>>;
}

export interface GitApi {
  config(): Promise<ApiResponse<{ name: string; email: string }>>;
  status(): Promise<ApiResponse<{ modified: string[]; added: string[]; deleted: string[]; untracked: string[] }>>;
  branches(): Promise<ApiResponse<{ name: string; current: boolean }[]>>;
  commits(): Promise<ApiResponse<{ hash: string; message: string; author: string; date: string }[]>>;
}

export interface McpApi {
  listServers(): Promise<ApiResponse<{ id: string; name: string; url: string; enabled: boolean }[]>>;
  addServer(url: string): Promise<ApiResponse>;
  updateServer(id: string, url: string, enabled: boolean): Promise<ApiResponse>;
  deleteServer(id: string): Promise<ApiResponse>;
  listResources(serverId: string): Promise<ApiResponse<{ uri: string; name: string }[]>>;
  listTools(serverId: string): Promise<ApiResponse<{ name: string; description: string; inputSchema: unknown }[]>>;
}

export interface UserApi {
  onboardingStatus(): Promise<ApiResponse<{ hasCompletedOnboarding: boolean }>>;
  completeOnboarding(): Promise<ApiResponse>;
  gitConfig(): Promise<ApiResponse<{ git_name: string; git_email: string }>>;
  updateGitConfig(name: string, email: string): Promise<ApiResponse>;
}

// ==========================================
// API Utility Types
// ==========================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestInit extends RequestInit {
  body?: string | FormData;
  headers?: Record<string, string>;
}

export interface ApiOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<T>;
  text: () => Promise<string>;
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

export interface OutputMessage {
  type: 'output';
  data: string;
}

export interface SessionStatusMessage {
  type: 'session-status';
  sessionId: string;
  provider: string;
  isProcessing: boolean;
}

export interface SessionAbortedMessage {
  type: 'session-aborted';
  sessionId: string;
  provider: string;
  success: boolean;
}

export interface ActiveSessionsMessage {
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
  projects: ProjectResponse[];
  timestamp: string;
  changeType: string;
  changedFile: string;
}
