// src/utils/sessionAdapters.ts

import type { UnifiedSession, SessionProvider } from '../types/session';

interface ClaudeSession {
  id: string;
  summary?: string;
  title?: string;
  messageCount?: number;
  lastActivity: string;
  archived?: boolean;
}

interface CursorSession {
  id: string;
  name?: string;
  createdAt: string;
  messageCount?: number;
}

interface CodexSession {
  id: string;
  name?: string;
  summary?: string;
  createdAt?: string;
  lastActivity?: string;
  messageCount?: number;
}

interface PiSession {
  id: string;
  name?: string;
  summary?: string;
  createdAt?: string;
  lastActivity?: string;
  messageCount?: number;
}

export function adaptClaudeSession(
  session: ClaudeSession,
  projectPath: string,
  projectName: string
): UnifiedSession {
  return {
    id: session.id,
    provider: 'claude',
    projectPath,
    projectName,
    title: session.title || session.summary || 'Claude Session',
    summary: session.summary,
    messageCount: session.messageCount || 0,
    lastActivity: session.lastActivity,
    createdAt: session.lastActivity, // Claude doesn't have separate createdAt
    archived: session.archived,
  };
}

export function adaptCursorSession(
  session: CursorSession,
  projectPath: string,
  projectName: string
): UnifiedSession {
  return {
    id: session.id,
    provider: 'cursor',
    projectPath,
    projectName,
    title: session.name || 'Cursor Session',
    messageCount: session.messageCount || 0,
    lastActivity: session.createdAt,
    createdAt: session.createdAt,
  };
}

export function adaptCodexSession(
  session: CodexSession,
  projectPath: string,
  projectName: string
): UnifiedSession {
  return {
    id: session.id,
    provider: 'codex',
    projectPath,
    projectName,
    title: session.summary || session.name || 'Codex Session',
    summary: session.summary,
    messageCount: session.messageCount || 0,
    lastActivity: session.lastActivity || session.createdAt || new Date().toISOString(),
    createdAt: session.createdAt || new Date().toISOString(),
  };
}

export function adaptPiSession(
  session: PiSession,
  projectPath: string,
  projectName: string
): UnifiedSession {
  return {
    id: session.id,
    provider: 'pi',
    projectPath,
    projectName,
    title: session.summary || session.name || 'Pi Session',
    summary: session.summary,
    messageCount: session.messageCount || 0,
    lastActivity: session.lastActivity || session.createdAt || new Date().toISOString(),
    createdAt: session.createdAt || new Date().toISOString(),
  };
}

interface ProjectWithSessions {
  name: string;
  fullPath: string;
  sessions?: ClaudeSession[];
  cursorSessions?: CursorSession[];
  codexSessions?: CodexSession[];
  piSessions?: PiSession[];
}

export function adaptAllSessions(project: ProjectWithSessions): UnifiedSession[] {
  const sessions: UnifiedSession[] = [];
  
  (project.sessions || []).forEach(s => {
    sessions.push(adaptClaudeSession(s, project.fullPath, project.name));
  });
  
  (project.cursorSessions || []).forEach(s => {
    sessions.push(adaptCursorSession(s, project.fullPath, project.name));
  });
  
  (project.codexSessions || []).forEach(s => {
    sessions.push(adaptCodexSession(s, project.fullPath, project.name));
  });
  
  (project.piSessions || []).forEach(s => {
    sessions.push(adaptPiSession(s, project.fullPath, project.name));
  });
  
  // Sort by lastActivity descending
  return sessions.sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
}

interface FilterOptions {
  searchQuery?: string;
  provider?: SessionProvider | 'all';
  projectPath?: string | 'all';
  sortBy?: 'lastActivity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export function filterSessions(
  sessions: UnifiedSession[],
  filters: FilterOptions
): UnifiedSession[] {
  let filtered = [...sessions];
  
  // Search filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.summary?.toLowerCase().includes(query)
    );
  }
  
  // Provider filter
  if (filters.provider && filters.provider !== 'all') {
    filtered = filtered.filter(s => s.provider === filters.provider);
  }
  
  // Project filter
  if (filters.projectPath && filters.projectPath !== 'all') {
    filtered = filtered.filter(s => s.projectPath === filters.projectPath);
  }
  
  // Sort
  const sortBy = filters.sortBy || 'lastActivity';
  const sortOrder = filters.sortOrder || 'desc';
  
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'lastActivity') {
      comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return filtered;
}
