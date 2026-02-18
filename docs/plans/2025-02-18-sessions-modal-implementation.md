# Sessions Modal & Unified Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix PI session bugs and add a sessions modal for managing all sessions across providers with filtering capabilities.

**Architecture:** Phase 1 fixes critical bugs (deletion, wrong session loading). Phase 2 creates unified session types. Phase 3 simplifies sidebar to show max 5 sessions. Phase 4 builds the sessions modal with filters. Phase 5 adds polish and i18n.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Express.js, node-pty

**Design Document:** `docs/plans/2025-02-18-sessions-modal-unified-architecture-design.md`

---

## Phase 1: Bug Fixes (Critical)

### Task 1.1: Fix deletePiSession API to include projectPath

**Files:**
- Modify: `src/utils/api.js:81-84`

**Step 1: Update deletePiSession function signature**

```javascript
// In src/utils/api.js, change:
deletePiSession: (sessionId) =>
  authenticatedFetch(`/api/pi/sessions/${sessionId}`, {
    method: 'DELETE',
  }),

// To:
deletePiSession: (sessionId, projectPath) =>
  authenticatedFetch(`/api/pi/sessions/${sessionId}?projectPath=${encodeURIComponent(projectPath)}`, {
    method: 'DELETE',
  }),
```

**Step 2: Verify change**

Run: `grep -A3 "deletePiSession" src/utils/api.js`
Expected: Shows updated function with projectPath parameter

**Step 3: Commit**

```bash
git add src/utils/api.js
git commit -m "fix: add projectPath param to deletePiSession API"
```

---

### Task 1.2: Update Sidebar to pass projectPath when deleting PI sessions

**Files:**
- Modify: `src/components/Sidebar.tsx:498`

**Step 1: Find and update the deletePiSession call**

Search for the delete handler in Sidebar.tsx around line 490-510:

```typescript
// Change from:
response = await api.deletePiSession(sessionId);

// To:
response = await api.deletePiSession(sessionId, project.fullPath);
```

Note: The `project` variable should be available in scope from the delete confirmation state. If not, we need to pass it through `sessionDeleteConfirmation`.

**Step 2: Verify the project is available in handleDeleteSession**

Check if `sessionDeleteConfirmation` includes project info. If not, update the type and state.

**Step 3: Update sessionDeleteConfirmation type if needed**

```typescript
interface SessionDeleteConfirmation {
  projectName: string;
  projectPath: string;  // ADD THIS
  sessionId: string;
  sessionName: string;
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
}
```

**Step 4: Update showDeleteSessionConfirmation calls to include projectPath**

```typescript
showDeleteSessionConfirmation(project.name, project.fullPath, session.id, sessionName, session.__provider || 'claude');
```

**Step 5: Update handleDeleteSession to use projectPath**

```typescript
if (provider === 'pi') {
  response = await api.deletePiSession(sessionId, sessionDeleteConfirmation.projectPath);
}
```

**Step 6: Test manually**

1. Open the app
2. Navigate to a project with PI sessions
3. Try to delete a PI session
4. Verify it deletes successfully (no error, session disappears)

**Step 7: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "fix: pass projectPath when deleting PI sessions"
```

---

### Task 1.3: Fix PI session messages loading - remove fallback scanning

**Files:**
- Modify: `server/projects.js:1388-1430`

**Step 1: Update getPiSessionMessages to require projectPath**

```javascript
async function getPiSessionMessages(sessionId, projectPath, limit = null, offset = 0) {
  // Require projectPath - no more fallback scanning
  if (!projectPath) {
    console.error(`getPiSessionMessages: projectPath is required for session ${sessionId}`);
    return { messages: [], total: 0, hasMore: false };
  }

  try {
    const sessionDir = getPiSessionDir(projectPath);
    let sessionFilePath = null;
    
    try {
      const files = await fs.readdir(sessionDir);
      const match = files.find(file => file.endsWith(`_${sessionId}.jsonl`));
      sessionFilePath = match ? path.join(sessionDir, match) : null;
    } catch {
      // Directory doesn't exist
      return { messages: [], total: 0, hasMore: false };
    }

    if (!sessionFilePath) {
      console.warn(`Pi session file not found for session ${sessionId} in ${sessionDir}`);
      return { messages: [], total: 0, hasMore: false };
    }

    // ... rest of the function remains the same
```

**Step 2: Remove the fallback directory scanning block**

Delete the entire fallback block that scans `~/.pi/agent/sessions/` looking for the session.

**Step 3: Test manually**

1. Open a PI session from the sidebar
2. Verify correct session loads
3. Try with another PI session
4. Verify each loads its own messages

**Step 4: Commit**

```bash
git add server/projects.js
git commit -m "fix: remove fallback scanning in getPiSessionMessages - require projectPath"
```

---

### Task 1.4: Ensure projectPath is passed in session messages API call

**Files:**
- Modify: `src/utils/api.js:45-63`
- Modify: `src/components/ChatInterface.tsx:2450`

**Step 1: Update sessionMessages API to include projectPath**

```javascript
// In src/utils/api.js
sessionMessages: (projectName, sessionId, limit, offset, provider, projectPath) => {
  const params = new URLSearchParams();
  if (limit !== null) {
    params.append('limit', String(limit));
    params.append('offset', String(offset));
  }
  // Add projectPath for providers that need it
  if (projectPath && (provider === 'pi' || provider === 'codex')) {
    params.append('projectPath', projectPath);
  }
  const queryString = params.toString();

  // Route to the correct endpoint based on provider
  let url;
  if (provider === 'codex') {
    url = `/api/codex/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
  } else if (provider === 'pi') {
    url = `/api/pi/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
  } else if (provider === 'cursor') {
    url = `/api/cursor/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
  } else {
    url = `/api/projects/${projectName}/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
  }
  return authenticatedFetch(url);
},
```

**Step 2: Update ChatInterface loadSessionMessages call**

Find the `loadSessionMessages` call and add `selectedProject.fullPath`:

```typescript
const response = await api.sessionMessages(
  projectName, 
  sessionId, 
  MESSAGES_PER_PAGE, 
  currentOffset, 
  provider,
  selectedProject?.fullPath  // Add this
);
```

**Step 3: Test manually**

1. Click on different PI sessions
2. Verify each loads the correct messages
3. No more "wrong session" issue

**Step 4: Commit**

```bash
git add src/utils/api.js src/components/ChatInterface.tsx
git commit -m "fix: pass projectPath in session messages API for PI/Codex"
```

---

## Phase 2: Unified Session Type

### Task 2.1: Create UnifiedSession type definition

**Files:**
- Create: `src/types/session.ts`

**Step 1: Create the unified session types file**

```typescript
// src/types/session.ts

export type SessionProvider = 'claude' | 'cursor' | 'codex' | 'pi';

export interface UnifiedSession {
  id: string;
  provider: SessionProvider;
  projectPath: string;
  projectName: string;
  
  // Display
  title: string;
  summary?: string;
  
  // Metadata
  messageCount: number;
  lastActivity: string; // ISO timestamp
  createdAt: string;    // ISO timestamp
  
  // Optional
  archived?: boolean;
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
```

**Step 2: Commit**

```bash
git add src/types/session.ts
git commit -m "feat: add UnifiedSession type definitions"
```

---

### Task 2.2: Create session adapter utilities

**Files:**
- Create: `src/utils/sessionAdapters.ts`

**Step 1: Create adapter functions**

```typescript
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

export function adaptAllSessions(
  project: {
    name: string;
    fullPath: string;
    sessions?: ClaudeSession[];
    cursorSessions?: CursorSession[];
    codexSessions?: CodexSession[];
    piSessions?: PiSession[];
  }
): UnifiedSession[] {
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

export function filterSessions(
  sessions: UnifiedSession[],
  filters: {
    searchQuery?: string;
    provider?: SessionProvider | 'all';
    projectPath?: string | 'all';
    sortBy?: 'lastActivity' | 'title';
    sortOrder?: 'asc' | 'desc';
  }
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
```

**Step 2: Commit**

```bash
git add src/utils/sessionAdapters.ts
git commit -m "feat: add session adapter utilities for unified sessions"
```

---

## Phase 3: Sidebar Simplification

### Task 3.1: Add session count badge and limit sessions to 5

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Create helper to get limited sessions**

Add this function near the `getAllSessions` function (around line 375):

```typescript
const getLimitedSessions = (project: Project, limit: number = 5): Session[] => {
  const allSessions = getAllSessions(project);
  return allSessions.slice(0, limit);
};

const getSessionCount = (project: Project): number => {
  return getAllSessions(project).length;
};

const hasMoreSessions = (project: Project, limit: number = 5): boolean => {
  return getAllSessions(project).length > limit;
};
```

**Step 2: Update project header to show session count**

Find the project header rendering (around line 1050-1100) and add a badge:

```tsx
{/* Project name with session count badge */}
<span className="truncate font-medium">{project.displayName || project.name}</span>
{getSessionCount(project) > 0 && (
  <Badge variant="secondary" className="ml-2 text-xs">
    {getSessionCount(project)}
  </Badge>
)}
```

**Step 3: Update session list to use limited sessions**

Change the session mapping (around line 1319):

```tsx
// Change from:
getAllSessions(project).map((session) => {

// To:
getLimitedSessions(project, 5).map((session) => {
```

**Step 4: Add "View All Sessions" button**

After the session list mapping ends (around line 1570), add:

```tsx
{hasMoreSessions(project, 5) && (
  <button
    onClick={() => onOpenSessionsModal?.(project.fullPath)}
    className="w-full py-2 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-1"
  >
    <span>{t('sessions.viewAll', { count: getSessionCount(project) })}</span>
    <ChevronRight className="w-3 h-3" />
  </button>
)}
```

**Step 5: Add prop for modal callback**

Update the SidebarProps interface:

```typescript
interface SidebarProps {
  // ... existing props
  onOpenSessionsModal?: (projectPath?: string) => void;
}
```

**Step 6: Add i18n key**

In `src/i18n/locales/en.json`, add:
```json
"sessions": {
  "viewAll": "View all {{count}} sessions",
  "noSessions": "No sessions yet"
}
```

**Step 7: Test manually**

1. Open sidebar with a project that has >5 sessions
2. Verify only 5 sessions shown
3. Verify "View All" button appears
4. Verify session count badge on project header

**Step 8: Commit**

```bash
git add src/components/Sidebar.tsx src/i18n/locales/en.json
git commit -m "feat: limit sidebar sessions to 5 with 'View All' button"
```

---

## Phase 4: Sessions Modal

### Task 4.1: Create SessionsModal component structure

**Files:**
- Create: `src/components/SessionsModal/SessionsModal.tsx`
- Create: `src/components/SessionsModal/index.ts`

**Step 1: Create the modal component**

```tsx
// src/components/SessionsModal/SessionsModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import type { UnifiedSession, SessionProvider, SessionFilters } from '../../types/session';
import { filterSessions } from '../../utils/sessionAdapters';
import SessionCard from './SessionCard';
import EmptySessionsState from './EmptySessionsState';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: UnifiedSession[];
  projects: { name: string; fullPath: string }[];
  initialProjectPath?: string;
  onSessionSelect: (session: UnifiedSession) => void;
  onSessionDelete: (session: UnifiedSession) => void;
}

const PROVIDERS: { value: SessionProvider | 'all'; label: string }[] = [
  { value: 'all', label: 'All Providers' },
  { value: 'claude', label: 'Claude' },
  { value: 'pi', label: 'Pi' },
  { value: 'codex', label: 'Codex' },
  { value: 'cursor', label: 'Cursor' },
];

const SORT_OPTIONS = [
  { value: 'lastActivity-desc', label: 'Newest First' },
  { value: 'lastActivity-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Name A-Z' },
  { value: 'title-desc', label: 'Name Z-A' },
];

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  projects,
  initialProjectPath,
  onSessionSelect,
  onSessionDelete,
}) => {
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState<SessionFilters>({
    searchQuery: '',
    provider: 'all',
    projectPath: initialProjectPath || 'all',
    sortBy: 'lastActivity',
    sortOrder: 'desc',
  });

  // Reset project filter when modal opens with new initialProjectPath
  useEffect(() => {
    if (isOpen && initialProjectPath) {
      setFilters(prev => ({ ...prev, projectPath: initialProjectPath }));
    }
  }, [isOpen, initialProjectPath]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSessions = useMemo(() => {
    return filterSessions(sessions, filters);
  }, [sessions, filters]);

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as ['lastActivity' | 'title', 'asc' | 'desc'];
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t('sessionsModal.title', 'All Sessions')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('sessionsModal.searchPlaceholder', 'Search sessions...')}
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            {/* Provider Filter */}
            <select
              value={filters.provider}
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value as SessionProvider | 'all' }))}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            
            {/* Project Filter */}
            <select
              value={filters.projectPath}
              onChange={(e) => setFilters(prev => ({ ...prev, projectPath: e.target.value }))}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">{t('sessionsModal.allProjects', 'All Projects')}</option>
              {projects.map(p => (
                <option key={p.fullPath} value={p.fullPath}>{p.name}</option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSessions.length === 0 ? (
            <EmptySessionsState 
              hasFilters={filters.searchQuery !== '' || filters.provider !== 'all' || filters.projectPath !== 'all'}
            />
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <SessionCard
                  key={`${session.provider}-${session.id}`}
                  session={session}
                  onSelect={() => {
                    onSessionSelect(session);
                    onClose();
                  }}
                  onDelete={() => onSessionDelete(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsModal;
```

**Step 2: Create index export**

```typescript
// src/components/SessionsModal/index.ts
export { SessionsModal, default } from './SessionsModal';
```

**Step 3: Commit**

```bash
git add src/components/SessionsModal/
git commit -m "feat: create SessionsModal component structure"
```

---

### Task 4.2: Create SessionCard component

**Files:**
- Create: `src/components/SessionsModal/SessionCard.tsx`

**Step 1: Create the session card component**

```tsx
// src/components/SessionsModal/SessionCard.tsx

import React, { useState } from 'react';
import { Trash2, Clock, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { UnifiedSession } from '../../types/session';
import ClaudeLogo from '../ClaudeLogo';
import CursorLogo from '../CursorLogo';
import CodexLogo from '../CodexLogo';
import PiLogo from '../PiLogo';

interface SessionCardProps {
  session: UnifiedSession;
  onSelect: () => void;
  onDelete: () => void;
}

const ProviderLogo: React.FC<{ provider: string; className?: string }> = ({ provider, className }) => {
  switch (provider) {
    case 'claude':
      return <ClaudeLogo className={className} />;
    case 'cursor':
      return <CursorLogo className={className} />;
    case 'codex':
      return <CodexLogo className={className} />;
    case 'pi':
      return <PiLogo className={className} />;
    default:
      return null;
  }
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors",
        "flex items-center gap-3"
      )}
    >
      {/* Provider Logo */}
      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
        <ProviderLogo provider={session.provider} className="w-5 h-5" />
      </div>
      
      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{session.title}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(session.lastActivity)}
          </span>
          {session.messageCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {session.messageCount}
            </span>
          )}
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {session.projectName}
          </Badge>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant={showDeleteConfirm ? "destructive" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={handleDelete}
          title={showDeleteConfirm ? t('common.confirmDelete') : t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SessionCard;
```

**Step 2: Commit**

```bash
git add src/components/SessionsModal/SessionCard.tsx
git commit -m "feat: create SessionCard component for sessions modal"
```

---

### Task 4.3: Create EmptySessionsState component

**Files:**
- Create: `src/components/SessionsModal/EmptySessionsState.tsx`

**Step 1: Create the empty state component**

```tsx
// src/components/SessionsModal/EmptySessionsState.tsx

import React from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptySessionsStateProps {
  hasFilters: boolean;
}

export const EmptySessionsState: React.FC<EmptySessionsStateProps> = ({ hasFilters }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Search className="w-6 h-6 text-muted-foreground" />
        ) : (
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-medium mb-1">
        {hasFilters 
          ? t('sessionsModal.noMatchingSessions', 'No matching sessions')
          : t('sessionsModal.noSessions', 'No sessions yet')
        }
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? t('sessionsModal.tryAdjustingFilters', 'Try adjusting your filters')
          : t('sessionsModal.startNewSession', 'Start a new session to see it here')
        }
      </p>
    </div>
  );
};

export default EmptySessionsState;
```

**Step 2: Commit**

```bash
git add src/components/SessionsModal/EmptySessionsState.tsx
git commit -m "feat: create EmptySessionsState component"
```

---

### Task 4.4: Integrate SessionsModal into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add state for sessions modal**

```typescript
// Near other state declarations
const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
const [sessionsModalInitialProject, setSessionsModalInitialProject] = useState<string | undefined>();
```

**Step 2: Add handler for opening modal**

```typescript
const handleOpenSessionsModal = (projectPath?: string) => {
  setSessionsModalInitialProject(projectPath);
  setSessionsModalOpen(true);
};
```

**Step 3: Add handler for selecting session from modal**

```typescript
const handleSessionSelectFromModal = (session: UnifiedSession) => {
  // Find the project
  const project = projects.find(p => p.fullPath === session.projectPath);
  if (project) {
    setSelectedProject(project);
    // Convert UnifiedSession back to the format expected by setSelectedSession
    setSelectedSession({
      id: session.id,
      __provider: session.provider,
      __projectName: project.name,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      title: session.title,
      summary: session.summary,
    } as any);
  }
  setSessionsModalOpen(false);
};

const handleSessionDeleteFromModal = async (session: UnifiedSession) => {
  try {
    let response;
    if (session.provider === 'pi') {
      response = await api.deletePiSession(session.id, session.projectPath);
    } else if (session.provider === 'codex') {
      response = await api.deleteCodexSession(session.id);
    } else {
      response = await api.deleteSession(session.projectName, session.id);
    }
    
    if (response.ok) {
      // Refresh projects to update session lists
      await fetchProjects();
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};
```

**Step 4: Import and render SessionsModal**

```tsx
import SessionsModal from './components/SessionsModal';
import { adaptAllSessions } from './utils/sessionAdapters';

// Get all sessions from all projects
const allSessions = useMemo(() => {
  return projects.flatMap(p => adaptAllSessions(p));
}, [projects]);

// In the JSX, add before closing </div>:
<SessionsModal
  isOpen={sessionsModalOpen}
  onClose={() => setSessionsModalOpen(false)}
  sessions={allSessions}
  projects={projects.map(p => ({ name: p.name, fullPath: p.fullPath }))}
  initialProjectPath={sessionsModalInitialProject}
  onSessionSelect={handleSessionSelectFromModal}
  onSessionDelete={handleSessionDeleteFromModal}
/>
```

**Step 5: Pass onOpenSessionsModal to Sidebar**

```tsx
<Sidebar
  // ... existing props
  onOpenSessionsModal={handleOpenSessionsModal}
/>
```

**Step 6: Test manually**

1. Open a project with >5 sessions
2. Click "View All Sessions" button
3. Verify modal opens with project pre-selected
4. Test search, provider filter, sort
5. Click a session - verify it opens
6. Delete a session - verify it works

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate SessionsModal into App"
```

---

## Phase 5: Polish

### Task 5.1: Add i18n translations

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/zh.json`

**Step 1: Add English translations**

```json
{
  "sessionsModal": {
    "title": "All Sessions",
    "searchPlaceholder": "Search sessions...",
    "allProjects": "All Projects",
    "allProviders": "All Providers",
    "newestFirst": "Newest First",
    "oldestFirst": "Oldest First",
    "nameAZ": "Name A-Z",
    "nameZA": "Name Z-A",
    "noMatchingSessions": "No matching sessions",
    "noSessions": "No sessions yet",
    "tryAdjustingFilters": "Try adjusting your filters",
    "startNewSession": "Start a new session to see it here"
  },
  "sessions": {
    "viewAll": "View all {{count}} sessions",
    "noSessions": "No sessions yet"
  }
}
```

**Step 2: Add Chinese translations**

```json
{
  "sessionsModal": {
    "title": "所有会话",
    "searchPlaceholder": "搜索会话...",
    "allProjects": "所有项目",
    "allProviders": "所有提供商",
    "newestFirst": "最新优先",
    "oldestFirst": "最早优先",
    "nameAZ": "名称 A-Z",
    "nameZA": "名称 Z-A",
    "noMatchingSessions": "没有匹配的会话",
    "noSessions": "暂无会话",
    "tryAdjustingFilters": "尝试调整筛选条件",
    "startNewSession": "开始新会话以在此查看"
  },
  "sessions": {
    "viewAll": "查看全部 {{count}} 个会话",
    "noSessions": "暂无会话"
  }
}
```

**Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat: add i18n translations for sessions modal"
```

---

### Task 5.2: Add mobile responsiveness to SessionsModal

**Files:**
- Modify: `src/components/SessionsModal/SessionsModal.tsx`

**Step 1: Update modal classes for mobile**

```tsx
// Change the modal container classes:
<div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col md:mx-4 md:rounded-lg md:max-h-[90vh] fixed md:relative inset-0 md:inset-auto rounded-none md:rounded-lg">
```

**Step 2: Make filter bar responsive**

```tsx
<div className="p-4 border-b border-border">
  <div className="flex flex-col md:flex-row gap-3">
    {/* Search - full width on mobile */}
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={t('sessionsModal.searchPlaceholder')}
        value={filters.searchQuery}
        onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
        className="pl-9 w-full"
      />
    </div>
    
    {/* Filters row - wrap on mobile */}
    <div className="flex flex-wrap gap-2">
      {/* Provider, Project, Sort dropdowns */}
    </div>
  </div>
</div>
```

**Step 3: Make session cards touch-friendly**

Already using appropriate padding and sizing. Verify min-height is touch-friendly:

```tsx
<div
  onClick={onSelect}
  className={cn(
    "group p-4 md:p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors",
    "flex items-center gap-3 min-h-[60px]"
  )}
>
```

**Step 4: Commit**

```bash
git add src/components/SessionsModal/
git commit -m "feat: add mobile responsiveness to SessionsModal"
```

---

### Task 5.3: Final testing and cleanup

**Step 1: Run type checking**

```bash
npm run typecheck
```
Expected: No errors

**Step 2: Run linting**

```bash
npm run lint
```
Expected: No errors (or fix any that appear)

**Step 3: Manual testing checklist**

- [ ] Delete PI session works
- [ ] Open PI session loads correct session
- [ ] Sidebar shows max 5 sessions per project
- [ ] "View All" button appears for projects with >5 sessions
- [ ] Modal opens with correct project pre-selected
- [ ] Search filters sessions correctly
- [ ] Provider filter works
- [ ] Project filter works
- [ ] Sort options work
- [ ] Session card click opens session
- [ ] Delete from modal works
- [ ] Modal closes on Escape
- [ ] Modal closes on backdrop click
- [ ] Mobile layout looks good
- [ ] Empty state shows when no sessions match

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: sessions modal & unified architecture - complete"
```

---

## Summary

This implementation plan covers:
1. **Bug fixes** - PI session deletion and wrong session loading
2. **Unified types** - Consistent session interface across providers
3. **Sidebar simplification** - Max 5 sessions with "View All" button
4. **Sessions modal** - Full-featured modal with search, filters, and actions
5. **Polish** - i18n, mobile responsiveness, edge cases

Total estimated time: 3-4 hours for experienced developer
