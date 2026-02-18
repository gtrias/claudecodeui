// src/types/session.ts

export type SessionProvider = 'claude' | 'cursor' | 'codex' | 'pi';

export interface UnifiedSession {
  id: string;
  provider: SessionProvider;
  projectPath: string;
  projectName: string;
  
  // Display
  title: string;
  summary?: string | undefined;
  
  // Metadata
  messageCount: number;
  lastActivity: string; // ISO timestamp
  createdAt: string;    // ISO timestamp
  
  // Optional
  archived?: boolean | undefined;
}

export interface SessionFilters {
  searchQuery: string;
  provider: SessionProvider | 'all';
  projectPath: string | 'all';
  sortBy: 'lastActivity' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface SessionsModalState {
  isOpen: boolean;
  sessions: UnifiedSession[];
  loading: boolean;
  filters: SessionFilters;
  initialProjectPath?: string;
}
