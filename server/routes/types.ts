/**
 * Route Type Definitions for Claude Code UI
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/types.js';

// ==========================================
// Route Handler Types
// ==========================================

export type RouteHandler = (req: AuthRequest, res: Response) => void | Promise<void>;

export type AsyncRouteHandler = (req: AuthRequest, res: Response) => Promise<void>;

export type RouteMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => void | Promise<void>;

// ==========================================
// Route Parameter Types
// ==========================================

export interface RouteParams {
  [key: string]: string;
}

export interface QueryParams {
  [key: string]: string | string[];
}

export interface BodyParams {
  [key: string]: unknown;
}

// ==========================================
// Project Route Types
// ==========================================

export interface CreateProjectRequest {
  path: string;
}

export interface RenameProjectRequest {
  displayName: string;
}

export interface ProjectQueryParams {
  limit?: string;
  offset?: string;
}

export interface BrowseFilesystemQuery {
  path?: string;
}

export interface CreateFolderRequest {
  path: string;
}

// ==========================================
// Chat/Session Route Types
// ==========================================

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

export interface ResumeSessionRequest {
  type: 'cursor-resume';
  sessionId: string;
  options?: {
    cwd?: string;
  };
}

export interface AbortSessionRequest {
  type: 'abort-session';
  sessionId: string;
  provider?: 'claude' | 'cursor' | 'codex' | 'pi';
}

export interface SessionStatusRequest {
  type: 'check-session-status';
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
  sessionId: string;
}

export interface PermissionResponse {
  type: 'claude-permission-response';
  requestId: string;
  allow: boolean;
  updatedInput?: string;
  message?: string;
  rememberEntry?: boolean;
}

// ==========================================
// File Operation Types
// ==========================================

export interface ReadFileRequest {
  projectName: string;
  filePath: string;
}

export interface SaveFileRequest {
  projectName: string;
  filePath: string;
  content: string;
}

export interface FileContentResponse {
  path: string;
  content: string;
}

export interface FileSaveResponse {
  success: boolean;
  path: string;
  message: string;
}

// ==========================================
// Utility Types
// ==========================================

export interface EmptyResponse {
  success: true;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

// ==========================================
// Pagination Types
// ==========================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ==========================================
// Model Options Types
// ==========================================

export interface ModelOption {
  value: string;
  label: string;
}

export interface ModelConfig {
  OPTIONS: ModelOption[];
  DEFAULT: string;
}

export interface ProviderModelConfig {
  claude: ModelConfig;
  cursor: ModelConfig;
  codex: ModelConfig;
  pi: ModelConfig;
}

// ==========================================
// WebSocket Types
// ==========================================

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  type: 'user' | 'assistant' | 'tool' | 'error';
  content: string;
  timestamp: string;
  images?: { data: string; name: string }[];
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

export interface ActiveSessionsMessage {
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
