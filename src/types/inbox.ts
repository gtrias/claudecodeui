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
