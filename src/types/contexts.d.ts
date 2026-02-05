/**
 * Context Type Definitions for Claude Code UI
 * TypeScript definitions for React contexts
 */

import type { createContext, useContext, useState, useEffect, useRef } from 'react';

// ==========================================
// Auth Context Types
// ==========================================

export interface AuthContextType {
  user: { id: number; username: string; git_name?: string; git_email?: string } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  needsSetup: boolean;
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

// ==========================================
// Theme Context Types
// ==========================================

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

// ==========================================
// WebSocket Context Types
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

export interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: ChatCommandMessage | { type: 'abort-session'; sessionId: string; provider?: string }) => void;
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
}

export interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  token?: string;
}

// ==========================================
// Tasks Settings Context Types
// ==========================================

export interface TasksSettingsContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  autoStart: boolean;
  setAutoStart: (autoStart: boolean) => void;
  autoContinue: boolean;
  setAutoContinue: (autoContinue: boolean) => void;
  maxConcurrentTasks: number;
  setMaxConcurrentTasks: (count: number) => void;
}

export interface TasksSettingsProviderProps {
  children: React.ReactNode;
}

// ==========================================
// Task Master Context Types
// ==========================================

export interface TaskMasterContextType {
  isConnected: boolean;
  tasks: TaskMasterTask[];
  activeTask: TaskMasterTask | null;
  connect: () => void;
  disconnect: () => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  acknowledgeTask: (taskId: string) => void;
}

export interface TaskMasterTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskMasterProviderProps {
  children: React.ReactNode;
}

// ==========================================
// Audio Recorder Context Types
// ==========================================

export interface AudioRecorderContextType {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
}

export interface AudioRecorderProviderProps {
  children: React.ReactNode;
}

// ==========================================
// File Tree Context Types
// ==========================================

export interface FileTreeContextType {
  rootPath: string;
  currentPath: string;
  fileTree: FileTreeItem[];
  isLoading: boolean;
  loadFileTree: (path: string) => void;
  selectFile: (filePath: string) => void;
  openFile: (filePath: string) => void;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export interface FileTreeProviderProps {
  children: React.ReactNode;
  rootPath: string;
}

// ==========================================
// Project Context Types
// ==========================================

export interface ProjectContextType {
  projects: ProjectInfo[];
  activeProject: ProjectInfo | null;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  selectProject: (projectName: string) => void;
  createProject: (path: string) => Promise<void>;
  deleteProject: (projectName: string) => Promise<void>;
}

export interface ProjectInfo {
  name: string;
  displayName: string;
  path: string;
  lastSession?: string;
  sessionCount?: number;
}

export interface ProjectProviderProps {
  children: React.ReactNode;
}

// ==========================================
// API Context Types
// ==========================================

export interface ApiContextType {
  auth: {
    status: () => Promise<{ needsSetup: boolean }>;
    login: (username: string, password: string) => Promise<{ success: boolean; user?: any; token?: string }>;
    register: (username: string, password: string) => Promise<{ success: boolean; user?: any; token?: string }>;
    user: () => Promise<{ user: any }>;
    logout: () => Promise<void>;
  };
  projects: {
    list: () => Promise<ProjectInfo[]>;
    get: (projectName: string) => Promise<ProjectInfo>;
    create: (path: string) => Promise<void>;
    delete: (projectName: string) => Promise<void>;
    rename: (projectName: string, displayName: string) => Promise<void>;
    browse: (path?: string) => Promise<{ path: string; suggestions: { path: string; name: string; type: string }[] }>;
    createFolder: (path: string) => Promise<void>;
    readFile: (projectName: string, filePath: string) => Promise<{ path: string; content: string }>;
    saveFile: (projectName: string, filePath: string, content: string) => Promise<void>;
    listFiles: (projectName: string) => Promise<FileTreeItem[]>;
  };
  commands: {
    send: (command: string, options: { projectPath?: string; sessionId?: string; model?: string }) => Promise<void>;
    abort: (sessionId: string, provider: string) => Promise<void>;
    resume: (sessionId: string, provider: string) => Promise<void>;
    getStatus: (sessionId: string, provider: string) => Promise<{ isProcessing: boolean }>;
  };
  settings: {
    save: (key: string, value: unknown) => Promise<void>;
    load: <T>(key: string) => Promise<T | null>;
  };
}

export interface ApiProviderProps {
  children: React.ReactNode;
}

// ==========================================
// Hook Type Definitions
// ==========================================

export type UseState<T> = [T, (value: T) => void];

export type UseEffectCleanup = () => void;

export type UseRef<T> = { current: T };

export type UseCallback<T extends (...args: unknown[]) => unknown> = T;

export type UseMemo<T> = T;
