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
