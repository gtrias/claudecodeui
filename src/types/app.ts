/**
 * Type definitions for App.tsx
 */

export interface Session {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  __provider?: 'claude' | 'cursor' | 'codex' | 'pi';
  __projectName?: string;
}

export interface CursorSession extends Session {
  __provider: 'cursor';
}

export interface CodexSession extends Session {
  __provider: 'codex';
}

export interface PiSession extends Session {
  __provider: 'pi';
}

export interface SessionMeta {
  total: number;
  recent?: number;
}

export interface Project {
  name: string;
  displayName?: string;
  fullPath?: string;
  path?: string;
  sessions?: Session[];
  cursorSessions?: CursorSession[];
  codexSessions?: CodexSession[];
  piSessions?: PiSession[];
  sessionMeta?: SessionMeta;
  taskmaster?: {
    hasTaskmaster?: boolean;
    status?: string;
    metadata?: {
      taskCount?: number;
      completed?: number;
    };
  };
}

export interface LoadingProgress {
  phase: string;
  current?: number;
  total?: number;
  currentProject?: string;
}

export interface ReleaseInfo {
  title?: string;
  body?: string;
  htmlUrl?: string;
}

export interface VersionModalProps {
  showVersionModal: boolean;
  setShowVersionModal: (show: boolean) => void;
  updateAvailable: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseInfo?: ReleaseInfo;
}

export type ActiveTab = 'chat' | 'files' | 'git' | 'preview';
