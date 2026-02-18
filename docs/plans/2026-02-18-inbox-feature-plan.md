# Inbox Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible Inbox section at the top of the sidebar that surfaces sessions needing attention (processing, needs input, new messages, completed, pinned) across all projects.

**Architecture:** The Inbox component sits at the top of Sidebar, receives state from App.tsx (processingSessions, needsInputSessions) and derives other states from session data + localStorage. A custom hook manages inbox state including persistence.

**Tech Stack:** React 18, TypeScript, TailwindCSS, localStorage, existing WebSocket integration

**Design Document:** `docs/plans/2026-02-18-inbox-feature-design.md`

---

## Task 1: Create Inbox TypeScript Types

**Files:**
- Create: `src/types/inbox.ts`

**Step 1: Create the types file**

```typescript
// src/types/inbox.ts

/**
 * Inbox state types for tracking session attention states
 */

export type InboxState = 
  | 'needs-input'    // Permission prompt / question pending
  | 'processing'     // AI is thinking
  | 'new-messages'   // Unread responses
  | 'completed'      // Recently finished
  | 'pinned';        // User pinned

export interface InboxItem {
  sessionId: string;
  projectName: string;
  projectDisplayName: string;
  sessionTitle: string;
  state: InboxState;
  timestamp: number;           // Last activity timestamp
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
  permissionPrompt?: string;   // For needs-input state
}

export interface InboxSection {
  state: InboxState;
  label: string;
  icon: string;
  items: InboxItem[];
  collapsed: boolean;
}

export interface InboxPersistedState {
  pinnedSessions: string[];                    // Session IDs
  lastViewedTimestamps: Record<string, number>; // sessionId -> timestamp
  dismissedCompletedSessions: Record<string, number>; // sessionId -> dismissedAt (TTL 24h)
  collapsedSections: InboxState[];             // Which sections are collapsed
  inboxCollapsed: boolean;                     // Whether entire inbox is collapsed
}

export interface UseInboxStateReturn {
  inboxItems: InboxItem[];
  inboxSections: InboxSection[];
  totalCount: number;
  
  // Actions
  pinSession: (sessionId: string) => void;
  unpinSession: (sessionId: string) => void;
  dismissItem: (sessionId: string) => void;
  markSessionViewed: (sessionId: string) => void;
  toggleSection: (state: InboxState) => void;
  toggleInbox: () => void;
  
  // State
  isInboxCollapsed: boolean;
  isPinned: (sessionId: string) => boolean;
}
```

**Step 2: Commit**

```bash
git add src/types/inbox.ts
git commit -m "feat(inbox): add TypeScript types for inbox feature"
```

---

## Task 2: Create useInboxState Hook

**Files:**
- Create: `src/hooks/useInboxState.ts`

**Step 1: Create the hook file**

```typescript
// src/hooks/useInboxState.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  InboxItem, 
  InboxSection, 
  InboxState, 
  InboxPersistedState, 
  UseInboxStateReturn 
} from '../types/inbox';

const STORAGE_KEY = 'claude-inbox-state';
const COMPLETED_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const COMPLETED_WINDOW_MS = 30 * 60 * 1000;   // 30 minutes

interface Project {
  name: string;
  displayName: string;
  sessions?: Array<{
    id: string;
    title?: string;
    summary?: string;
    lastActivity: string;
    __provider?: 'claude' | 'cursor' | 'codex' | 'pi';
  }>;
  cursorSessions?: Array<{
    id: string;
    name?: string;
    createdAt: string;
    __provider?: 'cursor';
  }>;
  codexSessions?: Array<{
    id: string;
    name?: string;
    summary?: string;
    createdAt?: string;
    lastActivity: string;
    __provider?: 'codex';
  }>;
  piSessions?: Array<{
    id: string;
    name?: string;
    summary?: string;
    createdAt?: string;
    lastActivity: string;
    __provider?: 'pi';
  }>;
}

interface UseInboxStateProps {
  projects: Project[];
  processingSessions: Set<string>;
  needsInputSessions: Map<string, string>; // sessionId -> prompt message
  currentSessionId?: string;
}

const SECTION_CONFIG: Array<{ state: InboxState; label: string; icon: string }> = [
  { state: 'needs-input', label: 'NEEDS INPUT', icon: 'AlertCircle' },
  { state: 'processing', label: 'PROCESSING', icon: 'Loader2' },
  { state: 'new-messages', label: 'NEW MESSAGES', icon: 'MessageCircle' },
  { state: 'completed', label: 'COMPLETED', icon: 'CheckCircle' },
  { state: 'pinned', label: 'PINNED', icon: 'Pin' },
];

function loadPersistedState(): InboxPersistedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Clean up expired dismissed sessions
      const now = Date.now();
      const cleanedDismissed: Record<string, number> = {};
      for (const [id, timestamp] of Object.entries(parsed.dismissedCompletedSessions || {})) {
        if (now - (timestamp as number) < COMPLETED_TTL_MS) {
          cleanedDismissed[id] = timestamp as number;
        }
      }
      return {
        pinnedSessions: parsed.pinnedSessions || [],
        lastViewedTimestamps: parsed.lastViewedTimestamps || {},
        dismissedCompletedSessions: cleanedDismissed,
        collapsedSections: parsed.collapsedSections || [],
        inboxCollapsed: parsed.inboxCollapsed || false,
      };
    }
  } catch (e) {
    console.error('Failed to load inbox state:', e);
  }
  return {
    pinnedSessions: [],
    lastViewedTimestamps: {},
    dismissedCompletedSessions: {},
    collapsedSections: [],
    inboxCollapsed: false,
  };
}

function savePersistedState(state: InboxPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save inbox state:', e);
  }
}

export function useInboxState({
  projects,
  processingSessions,
  needsInputSessions,
  currentSessionId,
}: UseInboxStateProps): UseInboxStateReturn {
  const [persistedState, setPersistedState] = useState<InboxPersistedState>(loadPersistedState);

  // Save persisted state whenever it changes
  useEffect(() => {
    savePersistedState(persistedState);
  }, [persistedState]);

  // Mark current session as viewed when it changes
  useEffect(() => {
    if (currentSessionId) {
      setPersistedState(prev => ({
        ...prev,
        lastViewedTimestamps: {
          ...prev.lastViewedTimestamps,
          [currentSessionId]: Date.now(),
        },
      }));
    }
  }, [currentSessionId]);

  // Build inbox items from all sources
  const inboxItems = useMemo<InboxItem[]>(() => {
    const items: InboxItem[] = [];
    const now = Date.now();
    const pinnedSet = new Set(persistedState.pinnedSessions);
    const processedIds = new Set<string>();

    // Helper to get all sessions from a project
    const getAllSessions = (project: Project) => {
      const sessions: Array<{
        id: string;
        title: string;
        lastActivity: number;
        provider: 'claude' | 'cursor' | 'codex' | 'pi';
      }> = [];

      (project.sessions || []).forEach(s => {
        sessions.push({
          id: s.id,
          title: s.title || s.summary || 'New Session',
          lastActivity: new Date(s.lastActivity).getTime(),
          provider: 'claude',
        });
      });

      (project.cursorSessions || []).forEach(s => {
        sessions.push({
          id: s.id,
          title: s.name || 'Cursor Session',
          lastActivity: new Date(s.createdAt).getTime(),
          provider: 'cursor',
        });
      });

      (project.codexSessions || []).forEach(s => {
        sessions.push({
          id: s.id,
          title: s.summary || s.name || 'Codex Session',
          lastActivity: new Date(s.createdAt || s.lastActivity).getTime(),
          provider: 'codex',
        });
      });

      (project.piSessions || []).forEach(s => {
        sessions.push({
          id: s.id,
          title: s.summary || s.name || 'Pi Session',
          lastActivity: new Date(s.createdAt || s.lastActivity).getTime(),
          provider: 'pi',
        });
      });

      return sessions;
    };

    // Process all projects
    for (const project of projects) {
      const allSessions = getAllSessions(project);

      for (const session of allSessions) {
        // 1. Needs Input (highest priority)
        if (needsInputSessions.has(session.id)) {
          items.push({
            sessionId: session.id,
            projectName: project.name,
            projectDisplayName: project.displayName,
            sessionTitle: session.title,
            state: 'needs-input',
            timestamp: session.lastActivity,
            provider: session.provider,
            permissionPrompt: needsInputSessions.get(session.id),
          });
          processedIds.add(session.id);
          continue;
        }

        // 2. Processing
        if (processingSessions.has(session.id)) {
          items.push({
            sessionId: session.id,
            projectName: project.name,
            projectDisplayName: project.displayName,
            sessionTitle: session.title,
            state: 'processing',
            timestamp: session.lastActivity,
            provider: session.provider,
          });
          processedIds.add(session.id);
          continue;
        }

        // 3. New Messages (unread)
        const lastViewed = persistedState.lastViewedTimestamps[session.id] || 0;
        if (session.lastActivity > lastViewed && !processedIds.has(session.id)) {
          items.push({
            sessionId: session.id,
            projectName: project.name,
            projectDisplayName: project.displayName,
            sessionTitle: session.title,
            state: 'new-messages',
            timestamp: session.lastActivity,
            provider: session.provider,
          });
          processedIds.add(session.id);
          continue;
        }

        // 4. Completed (recent, not dismissed)
        const isRecent = now - session.lastActivity < COMPLETED_WINDOW_MS;
        const isDismissed = persistedState.dismissedCompletedSessions[session.id] !== undefined;
        if (isRecent && !isDismissed && !processedIds.has(session.id)) {
          items.push({
            sessionId: session.id,
            projectName: project.name,
            projectDisplayName: project.displayName,
            sessionTitle: session.title,
            state: 'completed',
            timestamp: session.lastActivity,
            provider: session.provider,
          });
          processedIds.add(session.id);
          continue;
        }

        // 5. Pinned
        if (pinnedSet.has(session.id) && !processedIds.has(session.id)) {
          items.push({
            sessionId: session.id,
            projectName: project.name,
            projectDisplayName: project.displayName,
            sessionTitle: session.title,
            state: 'pinned',
            timestamp: session.lastActivity,
            provider: session.provider,
          });
          processedIds.add(session.id);
        }
      }
    }

    // Sort by timestamp within each state
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [projects, processingSessions, needsInputSessions, persistedState]);

  // Group items into sections
  const inboxSections = useMemo<InboxSection[]>(() => {
    return SECTION_CONFIG.map(config => ({
      ...config,
      items: inboxItems.filter(item => item.state === config.state),
      collapsed: persistedState.collapsedSections.includes(config.state),
    })).filter(section => section.items.length > 0);
  }, [inboxItems, persistedState.collapsedSections]);

  const totalCount = inboxItems.length;

  // Actions
  const pinSession = useCallback((sessionId: string) => {
    setPersistedState(prev => ({
      ...prev,
      pinnedSessions: [...prev.pinnedSessions.filter(id => id !== sessionId), sessionId],
    }));
  }, []);

  const unpinSession = useCallback((sessionId: string) => {
    setPersistedState(prev => ({
      ...prev,
      pinnedSessions: prev.pinnedSessions.filter(id => id !== sessionId),
    }));
  }, []);

  const dismissItem = useCallback((sessionId: string) => {
    setPersistedState(prev => ({
      ...prev,
      dismissedCompletedSessions: {
        ...prev.dismissedCompletedSessions,
        [sessionId]: Date.now(),
      },
      // Also mark as viewed
      lastViewedTimestamps: {
        ...prev.lastViewedTimestamps,
        [sessionId]: Date.now(),
      },
    }));
  }, []);

  const markSessionViewed = useCallback((sessionId: string) => {
    setPersistedState(prev => ({
      ...prev,
      lastViewedTimestamps: {
        ...prev.lastViewedTimestamps,
        [sessionId]: Date.now(),
      },
    }));
  }, []);

  const toggleSection = useCallback((state: InboxState) => {
    setPersistedState(prev => {
      const isCollapsed = prev.collapsedSections.includes(state);
      return {
        ...prev,
        collapsedSections: isCollapsed
          ? prev.collapsedSections.filter(s => s !== state)
          : [...prev.collapsedSections, state],
      };
    });
  }, []);

  const toggleInbox = useCallback(() => {
    setPersistedState(prev => ({
      ...prev,
      inboxCollapsed: !prev.inboxCollapsed,
    }));
  }, []);

  const isPinned = useCallback((sessionId: string) => {
    return persistedState.pinnedSessions.includes(sessionId);
  }, [persistedState.pinnedSessions]);

  return {
    inboxItems,
    inboxSections,
    totalCount,
    pinSession,
    unpinSession,
    dismissItem,
    markSessionViewed,
    toggleSection,
    toggleInbox,
    isInboxCollapsed: persistedState.inboxCollapsed,
    isPinned,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useInboxState.ts
git commit -m "feat(inbox): add useInboxState hook for inbox state management"
```

---

## Task 3: Create InboxItem Component

**Files:**
- Create: `src/components/InboxItem.tsx`

**Step 1: Create the component**

```typescript
// src/components/InboxItem.tsx

import React from 'react';
import { X, Pin, AlertCircle, Loader2, MessageCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import type { InboxItem as InboxItemType, InboxState } from '../types/inbox';

interface InboxItemProps {
  item: InboxItemType;
  onSelect: (item: InboxItemType) => void;
  onDismiss?: (sessionId: string) => void;
  onPin?: (sessionId: string) => void;
  onUnpin?: (sessionId: string) => void;
  isPinned: boolean;
}

const STATE_ICONS: Record<InboxState, React.ElementType> = {
  'needs-input': AlertCircle,
  'processing': Loader2,
  'new-messages': MessageCircle,
  'completed': CheckCircle,
  'pinned': Pin,
};

const PROVIDER_LOGOS: Record<string, React.ElementType> = {
  claude: ClaudeLogo,
  cursor: CursorLogo,
  codex: CodexLogo,
  pi: PiLogo,
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function InboxItem({
  item,
  onSelect,
  onDismiss,
  onPin,
  onUnpin,
  isPinned,
}: InboxItemProps): JSX.Element {
  const StateIcon = STATE_ICONS[item.state];
  const ProviderLogo = PROVIDER_LOGOS[item.provider] || ClaudeLogo;
  
  const canDismiss = item.state === 'new-messages' || item.state === 'completed' || item.state === 'pinned';
  const isProcessing = item.state === 'processing';
  const needsInput = item.state === 'needs-input';

  return (
    <div
      className={cn(
        "group relative p-2 rounded-[2px] border transition-all duration-100 cursor-pointer",
        "session-card-tactile hover:border-border",
        needsInput && "border-l-2 border-l-[#d4ff00] dark:border-l-[#d4ff00] bg-[#fefce8]/30 dark:bg-[#1a1f00]/30",
        isProcessing && "bg-green-50/30 dark:bg-green-900/10"
      )}
      onClick={() => onSelect(item)}
    >
      <div className="flex items-start gap-2">
        {/* State indicator */}
        <div className={cn(
          "w-5 h-5 rounded-[2px] flex items-center justify-center flex-shrink-0 mt-0.5",
          needsInput && "bg-[#d4ff00]/20 dark:bg-[#d4ff00]/10",
          isProcessing && "bg-green-100 dark:bg-green-900/30",
          item.state === 'new-messages' && "bg-blue-100 dark:bg-blue-900/30",
          item.state === 'completed' && "bg-muted",
          item.state === 'pinned' && "bg-yellow-100 dark:bg-yellow-900/30"
        )}>
          <StateIcon 
            className={cn(
              "w-3 h-3",
              needsInput && "text-[#a3c400] dark:text-[#d4ff00]",
              isProcessing && "text-green-600 dark:text-green-400 animate-spin",
              item.state === 'new-messages' && "text-blue-600 dark:text-blue-400",
              item.state === 'completed' && "text-muted-foreground",
              item.state === 'pinned' && "text-yellow-600 dark:text-yellow-400"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {item.projectDisplayName}
            </span>
            <ProviderLogo className="w-3 h-3 flex-shrink-0 opacity-60" />
          </div>
          <div className="text-sm font-medium text-foreground truncate mt-0.5">
            {item.permissionPrompt || item.sessionTitle}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatTimeAgo(item.timestamp)}
          </div>
        </div>

        {/* Action buttons (show on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Pin/Unpin button */}
          {item.state !== 'pinned' && onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-secondary hover:bg-secondary/80 flex items-center justify-center"
              title="Pin session"
            >
              <Pin className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
          {item.state === 'pinned' && onUnpin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpin(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 flex items-center justify-center"
              title="Unpin session"
            >
              <Pin className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
            </button>
          )}
          
          {/* Dismiss button */}
          {canDismiss && onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-secondary hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center"
              title="Dismiss"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

export default InboxItem;
```

**Step 2: Commit**

```bash
git add src/components/InboxItem.tsx
git commit -m "feat(inbox): add InboxItem component"
```

---

## Task 4: Create Inbox Component

**Files:**
- Create: `src/components/Inbox.tsx`

**Step 1: Create the main inbox component**

```typescript
// src/components/Inbox.tsx

import React from 'react';
import { ChevronDown, ChevronRight, Inbox as InboxIcon, AlertCircle, Loader2, MessageCircle, CheckCircle, Pin } from 'lucide-react';
import { cn } from '../lib/utils';
import { InboxItem } from './InboxItem';
import { useTranslation } from 'react-i18next';
import type { InboxItem as InboxItemType, InboxSection, InboxState } from '../types/inbox';

interface InboxProps {
  sections: InboxSection[];
  totalCount: number;
  isCollapsed: boolean;
  onToggleInbox: () => void;
  onToggleSection: (state: InboxState) => void;
  onSelectItem: (item: InboxItemType) => void;
  onDismissItem: (sessionId: string) => void;
  onPinSession: (sessionId: string) => void;
  onUnpinSession: (sessionId: string) => void;
  isPinned: (sessionId: string) => boolean;
  isMobile?: boolean;
}

const STATE_ICONS: Record<InboxState, React.ElementType> = {
  'needs-input': AlertCircle,
  'processing': Loader2,
  'new-messages': MessageCircle,
  'completed': CheckCircle,
  'pinned': Pin,
};

const STATE_COLORS: Record<InboxState, string> = {
  'needs-input': 'text-[#a3c400] dark:text-[#d4ff00]',
  'processing': 'text-green-600 dark:text-green-400',
  'new-messages': 'text-blue-600 dark:text-blue-400',
  'completed': 'text-muted-foreground',
  'pinned': 'text-yellow-600 dark:text-yellow-400',
};

export function Inbox({
  sections,
  totalCount,
  isCollapsed,
  onToggleInbox,
  onToggleSection,
  onSelectItem,
  onDismissItem,
  onPinSession,
  onUnpinSession,
  isPinned,
  isMobile = false,
}: InboxProps): JSX.Element | null {
  const { t } = useTranslation('sidebar');

  // Don't render if no items
  if (totalCount === 0) {
    return (
      <div className="px-3 md:px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <InboxIcon className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            {t('inbox.title', 'Inbox')}
          </span>
          <span className="text-xs">·</span>
          <span className="text-xs">{t('inbox.allClear', 'All clear')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {/* Header */}
      <button
        onClick={onToggleInbox}
        className={cn(
          "w-full px-3 md:px-4 py-2 flex items-center justify-between",
          "hover:bg-accent/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <InboxIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {t('inbox.title', 'Inbox')}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 text-xs font-medium rounded-[2px]",
            "bg-primary/10 text-primary"
          )}>
            {totalCount}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-2 md:px-3 pb-2 space-y-2">
          {sections.map((section) => {
            const SectionIcon = STATE_ICONS[section.state];
            
            return (
              <div key={section.state}>
                {/* Section Header */}
                <button
                  onClick={() => onToggleSection(section.state)}
                  className={cn(
                    "w-full px-2 py-1 flex items-center gap-2",
                    "hover:bg-accent/30 rounded-[2px] transition-colors"
                  )}
                >
                  <SectionIcon className={cn("w-3 h-3", STATE_COLORS[section.state])} />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({section.items.length})
                  </span>
                  <div className="flex-1" />
                  {section.collapsed ? (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>

                {/* Section Items */}
                {!section.collapsed && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <InboxItem
                        key={item.sessionId}
                        item={item}
                        onSelect={onSelectItem}
                        onDismiss={onDismissItem}
                        onPin={onPinSession}
                        onUnpin={onUnpinSession}
                        isPinned={isPinned(item.sessionId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Inbox;
```

**Step 2: Commit**

```bash
git add src/components/Inbox.tsx
git commit -m "feat(inbox): add main Inbox component"
```

---

## Task 5: Add i18n Translations

**Files:**
- Modify: `src/i18n/locales/en/sidebar.json`
- Modify: `src/i18n/locales/zh-CN/sidebar.json`

**Step 1: Update English translations**

Add to `src/i18n/locales/en/sidebar.json` after the `"deleteConfirmation"` section:

```json
  "inbox": {
    "title": "Inbox",
    "allClear": "All clear",
    "needsInput": "Needs Input",
    "processing": "Processing",
    "newMessages": "New Messages",
    "completed": "Completed",
    "pinned": "Pinned",
    "pin": "Pin session",
    "unpin": "Unpin session",
    "dismiss": "Dismiss"
  }
```

**Step 2: Update Chinese translations**

Add to `src/i18n/locales/zh-CN/sidebar.json` after the `"deleteConfirmation"` section:

```json
  "inbox": {
    "title": "收件箱",
    "allClear": "已全部处理",
    "needsInput": "需要输入",
    "processing": "处理中",
    "newMessages": "新消息",
    "completed": "已完成",
    "pinned": "已固定",
    "pin": "固定会话",
    "unpin": "取消固定",
    "dismiss": "忽略"
  }
```

**Step 3: Commit**

```bash
git add src/i18n/locales/en/sidebar.json src/i18n/locales/zh-CN/sidebar.json
git commit -m "feat(inbox): add i18n translations for inbox feature"
```

---

## Task 6: Add needsInputSessions State to App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add needsInputSessions state**

Find the line with `const [processingSessions, setProcessingSessions] = useState(new Set());` (around line 86) and add after it:

```typescript
  // Needs Input Sessions: Track sessions waiting for user permission/input
  // Maps sessionId -> permission prompt message
  const [needsInputSessions, setNeedsInputSessions] = useState<Map<string, string>>(new Map());
```

**Step 2: Add handlers for needsInputSessions**

Find the section with `// markSessionAsProcessing` and `// markSessionAsNotProcessing` (around line 620-630) and add:

```typescript
  // Needs Input Session Functions: Track sessions waiting for user permission
  
  // markSessionNeedsInput: Called when a permission prompt is received
  const markSessionNeedsInput = useCallback((sessionId: string, promptMessage: string) => {
    setNeedsInputSessions(prev => new Map(prev).set(sessionId, promptMessage));
  }, []);
  
  // clearSessionNeedsInput: Called when user responds to permission prompt
  const clearSessionNeedsInput = useCallback((sessionId: string) => {
    setNeedsInputSessions(prev => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  }, []);
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(inbox): add needsInputSessions state to App.tsx"
```

---

## Task 7: Integrate Inbox into Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Add imports at top of file**

After the existing imports, add:

```typescript
import { Inbox } from './Inbox';
import { useInboxState } from '../hooks/useInboxState';
import type { InboxItem as InboxItemType } from '../types/inbox';
```

**Step 2: Update SidebarProps interface**

Find the `SidebarProps` interface and add these properties:

```typescript
  processingSessions: Set<string>;
  needsInputSessions: Map<string, string>;
  onNavigateToSession?: (projectName: string, sessionId: string) => void;
```

**Step 3: Update function signature to receive new props**

Find the function signature `function Sidebar({` and add the new props:

```typescript
function Sidebar({
  projects,
  selectedProject,
  selectedSession,
  onProjectSelect,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  onProjectDelete,
  isLoading,
  loadingProgress,
  onRefresh,
  onShowSettings,
  isPWA,
  isMobile,
  onToggleSidebar,
  processingSessions,
  needsInputSessions,
  onNavigateToSession
}: SidebarProps) {
```

**Step 4: Initialize useInboxState hook**

After the existing hooks (around line 150, after `const { tasksEnabled } = useTasksSettings();`), add:

```typescript
  // Inbox state
  const {
    inboxSections,
    totalCount: inboxCount,
    isInboxCollapsed,
    toggleInbox,
    toggleSection,
    dismissItem,
    pinSession,
    unpinSession,
    isPinned,
    markSessionViewed,
  } = useInboxState({
    projects,
    processingSessions,
    needsInputSessions,
    currentSessionId: selectedSession?.id,
  });

  // Handle inbox item selection
  const handleInboxItemSelect = (item: InboxItemType) => {
    // Mark as viewed
    markSessionViewed(item.sessionId);
    
    // Navigate to the session
    if (onNavigateToSession) {
      onNavigateToSession(item.projectName, item.sessionId);
    } else {
      // Fallback: find project and session, select them
      const project = projects.find(p => p.name === item.projectName);
      if (project) {
        onProjectSelect(project);
        // Find the session in the project
        const allSessions = getAllSessions(project);
        const session = allSessions.find(s => s.id === item.sessionId);
        if (session) {
          onSessionSelect({ ...session, __projectName: project.name });
        }
      }
    }
  };
```

**Step 5: Add Inbox component to render**

Find the `{/* Search Filter */}` section (around line 540) and add BEFORE it:

```tsx
      {/* Inbox Section */}
      {!isLoading && projects.length > 0 && (
        <Inbox
          sections={inboxSections}
          totalCount={inboxCount}
          isCollapsed={isInboxCollapsed}
          onToggleInbox={toggleInbox}
          onToggleSection={toggleSection}
          onSelectItem={handleInboxItemSelect}
          onDismissItem={dismissItem}
          onPinSession={pinSession}
          onUnpinSession={unpinSession}
          isPinned={isPinned}
          isMobile={isMobile}
        />
      )}
```

**Step 6: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(inbox): integrate Inbox component into Sidebar"
```

---

## Task 8: Pass Inbox Props from App.tsx to Sidebar

**Files:**
- Modify: `src/App.tsx`

**Step 1: Find Sidebar component usage and add props**

Find where `<Sidebar` is rendered (around line 780-800) and add the new props:

```tsx
<Sidebar
  projects={projects}
  selectedProject={selectedProject}
  selectedSession={selectedSession}
  onProjectSelect={handleProjectSelect}
  onSessionSelect={handleSessionSelect}
  onNewSession={handleNewSession}
  onSessionDelete={handleSessionDelete}
  onProjectDelete={handleProjectDelete}
  isLoading={isLoadingProjects}
  loadingProgress={loadingProgress}
  onRefresh={refreshProjects}
  onShowSettings={() => setShowSettings(true)}
  isPWA={isPWA}
  isMobile={isMobile}
  onToggleSidebar={() => setSidebarVisible(false)}
  processingSessions={processingSessions}
  needsInputSessions={needsInputSessions}
  onNavigateToSession={handleNavigateToSession}
/>
```

**Step 2: Add handleNavigateToSession function if not exists**

If `handleNavigateToSession` doesn't exist, add it near other handlers:

```typescript
  // Handle navigation to a specific session (used by Inbox)
  const handleNavigateToSession = useCallback((projectName: string, sessionId: string) => {
    const project = projects.find(p => p.name === projectName);
    if (project) {
      setSelectedProject(project);
      // Find the session
      const allSessions = [
        ...(project.sessions || []),
        ...(project.cursorSessions || []),
        ...(project.codexSessions || []),
        ...(project.piSessions || []),
      ];
      const session = allSessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSession({ ...session, __projectName: projectName });
      }
    }
  }, [projects]);
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(inbox): pass inbox props from App.tsx to Sidebar"
```

---

## Task 9: Track Permission Prompts in ChatInterface

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add props for needsInput tracking**

Find the `ChatInterfaceProps` interface and add:

```typescript
  onSessionNeedsInput?: (sessionId: string, prompt: string) => void;
  onSessionInputCleared?: (sessionId: string) => void;
```

**Step 2: Update function signature**

Add the new props to the destructured parameters.

**Step 3: Call onSessionNeedsInput when permission prompt is received**

Find where permission prompts are handled (search for `type: 'permission'` or similar) and add:

```typescript
// When permission prompt is received
if (onSessionNeedsInput && currentSessionId) {
  onSessionNeedsInput(currentSessionId, permissionMessage);
}
```

**Step 4: Call onSessionInputCleared when user responds**

After the user responds to a permission prompt:

```typescript
// When user responds to permission
if (onSessionInputCleared && currentSessionId) {
  onSessionInputCleared(currentSessionId);
}
```

**Step 5: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(inbox): track permission prompts in ChatInterface"
```

---

## Task 10: Wire Permission Tracking in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Pass permission handlers to ChatInterface**

Find where `<ChatInterface` is rendered and add:

```tsx
  onSessionNeedsInput={markSessionNeedsInput}
  onSessionInputCleared={clearSessionNeedsInput}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(inbox): wire permission tracking from ChatInterface to App"
```

---

## Task 11: Add Mobile Swipe-to-Dismiss

**Files:**
- Modify: `src/components/InboxItem.tsx`

**Step 1: Add touch handling for swipe gesture**

Update the InboxItem component to handle swipe:

```typescript
import React, { useState, useRef } from 'react';

// Inside component, add state for swipe
const [swipeX, setSwipeX] = useState(0);
const touchStartX = useRef(0);
const SWIPE_THRESHOLD = 80;

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!canDismiss) return;
  const diff = touchStartX.current - e.touches[0].clientX;
  if (diff > 0) {
    setSwipeX(Math.min(diff, SWIPE_THRESHOLD));
  }
};

const handleTouchEnd = () => {
  if (swipeX >= SWIPE_THRESHOLD && onDismiss) {
    onDismiss(item.sessionId);
  }
  setSwipeX(0);
};
```

**Step 2: Apply transform style**

```tsx
<div
  className={cn(...)}
  style={{ transform: `translateX(-${swipeX}px)` }}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onClick={() => onSelect(item)}
>
```

**Step 3: Commit**

```bash
git add src/components/InboxItem.tsx
git commit -m "feat(inbox): add mobile swipe-to-dismiss for inbox items"
```

---

## Task 12: Final Testing & Verification

**Step 1: Run type checking**

```bash
npm run typecheck
```

Expected: No TypeScript errors

**Step 2: Run linting**

```bash
npm run lint
```

Expected: No linting errors (or only warnings)

**Step 3: Build the project**

```bash
npm run build
```

Expected: Successful build

**Step 4: Manual testing checklist**

- [ ] Inbox shows at top of sidebar when there are items
- [ ] "All clear" message shows when inbox is empty
- [ ] Processing sessions appear in inbox with spinning indicator
- [ ] Permission prompts appear in "Needs Input" section
- [ ] Recently completed sessions appear in "Completed" section
- [ ] Clicking inbox item navigates to that session
- [ ] Dismiss button removes item from inbox
- [ ] Pin button adds session to "Pinned" section
- [ ] Pinned sessions persist after page refresh
- [ ] Sections collapse/expand correctly
- [ ] Mobile: swipe left dismisses item
- [ ] All providers (Claude, Cursor, Codex, Pi) show correct icons

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(inbox): complete inbox feature implementation"
```

---

## Summary

This implementation plan creates a complete Inbox feature with:

1. **Types** (`src/types/inbox.ts`) - TypeScript definitions
2. **State Hook** (`src/hooks/useInboxState.ts`) - State management with localStorage persistence
3. **InboxItem** (`src/components/InboxItem.tsx`) - Individual item with actions
4. **Inbox** (`src/components/Inbox.tsx`) - Main component with sections
5. **i18n** - English and Chinese translations
6. **App.tsx integration** - needsInputSessions state and handlers
7. **Sidebar integration** - Inbox rendered at top
8. **ChatInterface integration** - Permission prompt tracking
9. **Mobile support** - Swipe-to-dismiss

Total estimated time: 2-3 hours for a senior developer familiar with the codebase.
