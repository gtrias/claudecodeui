# Inbox Feature Design

**Date**: 2026-02-18  
**Status**: Approved  
**Author**: Brainstorming session

---

## Overview

A collapsible **Inbox section at the top of the sidebar** that surfaces sessions needing attention across all projects, using the existing industrial tactile design language.

### Problem Statement

When working on multiple tasks simultaneously, the current sidebar (projects → sessions tree) makes it hard to:
- See which sessions are actively processing (AI is thinking)
- Know which sessions just finished and need attention
- Find sessions that need user input (permission prompts)
- Track important sessions across different projects

### Solution

An always-visible Inbox section at the top of the sidebar that aggregates actionable sessions from all projects, organized by urgency/state.

---

## Session States Tracked

| State | Icon | Trigger | Dismiss Behavior |
|-------|------|---------|------------------|
| ⏸️ **Needs Input** | `AlertCircle` | Permission prompt / question pending | Auto-dismiss when user responds |
| 🔄 **Processing** | `Loader2` (spinning) | AI is thinking (`processingSessions`) | Auto-dismiss when complete |
| 🆕 **New Messages** | `MessageCircle` | `lastActivity > lastViewedTimestamp` | Manual dismiss (X or click to view) |
| ✅ **Completed** | `CheckCircle` | Finished in last 30 min | Manual dismiss |
| 📌 **Pinned** | `Pin` | User explicitly pinned | Manual dismiss only |

### Priority Order (Top to Bottom)

1. ⏸️ **Needs Input** — Blocking! User must act
2. 🔄 **Processing** — Awareness, will finish soon
3. 🆕 **New Messages** — Unread responses to review
4. ✅ **Completed** — Recent completions (last 30 min)
5. 📌 **Pinned** — User's watchlist (stable)

---

## Layout Structure

```
┌─────────────────────────────────────┐
│ 📥 INBOX (4)              [▼] [−]  │  ← Header: count, collapse toggle
├─────────────────────────────────────┤
│ ⏸️ NEEDS INPUT (1)                 │  ← Section header (collapsible)
│ ┌─────────────────────────────────┐ │
│ │ 🟡 api-server                   │ │  ← Tactile card style
│ │    "Allow edit to config.ts?"  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🔄 PROCESSING (2)                  │
│ ┌─────────────────────────────────┐ │
│ │ ● claude-ui          2m ago    │ │  ← Pulsing indicator
│ │   "Add inbox feature"     [×]  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ● docs-site           1m ago   │ │
│ │   "Fix typo in README"         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ✅ COMPLETED (1)                   │
│ ┌─────────────────────────────────┐ │
│ │ backend              5m ago [×]│ │
│ │   "Refactor auth module"       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📌 PINNED (0)                      │  ← Empty section hidden
└─────────────────────────────────────┘
│ 🔍 Search projects...              │  ← Existing search
│ 📁 Projects...                     │  ← Existing project list
```

---

## Interaction Behaviors

| Action | Result |
|--------|--------|
| **Click inbox item** | Navigate to that session (selects project + session) |
| **Click [×]** | Dismiss from inbox (manual states only) |
| **Click [▼] header** | Collapse/expand entire inbox section |
| **Click section header** | Collapse/expand that section |
| **Right-click / long-press** | Context menu: Pin, Dismiss, Open in new tab |
| **Swipe left (mobile)** | Quick dismiss |

---

## Persistence Strategy

| Data | Storage | Behavior |
|------|---------|----------|
| `pinnedSessions` | localStorage | Survives refresh |
| `lastViewedTimestamp` per session | localStorage | For "new messages" detection |
| `dismissedCompletedSessions` | localStorage (with 24h TTL) | Prevents re-showing old completions |
| Processing/NeedsInput states | In-memory (App.tsx) | Rebuilt from live WebSocket state |

### Why Persist Pins Only (Not Everything)

Full persistence creates stale/misleading state:
- Dismissed "completed" session might have NEW messages next day
- "Processing" state from yesterday is outdated
- Dismissed "needs input" might mean user never actually responded

**Pins are intentional. Everything else is derived from reality.**

---

## Visual Design (Industrial Tactile)

Consistent with existing sidebar design language:

- **Section headers**: Uppercase, small text, muted color, subtle border-bottom
- **Inbox items**: Same `session-card-tactile` style as existing sessions
- **Active/Processing**: Green pulsing dot (existing pattern) + subtle background tint
- **Needs Input**: Acid yellow left border (matches `btn-tactile-acid`)
- **Dismiss button**: Appears on hover, subtle `×` icon
- **Empty state**: Inbox collapses to single line: `📥 Inbox · All clear`

### Color Coding

| State | Visual Treatment |
|-------|------------------|
| Needs Input | Acid yellow left border, slightly elevated |
| Processing | Green pulsing dot, subtle green tint |
| New Messages | Blue dot indicator |
| Completed | Check icon, neutral styling |
| Pinned | Pin icon, subtle highlight |

---

## Mobile Considerations

- Inbox section at top of mobile sidebar (same position)
- Swipe-to-dismiss for manual items
- Tap to navigate (same as desktop)
- Section headers collapsible to save space
- Touch-friendly hit targets (min 44px)

---

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  WebSocket  │────▶│   App.tsx    │────▶│   Inbox     │
│  Messages   │     │ - processing │     │  Component  │
└─────────────┘     │ - needsInput │     └─────────────┘
                    └──────────────┘            │
                           │                   │
                    ┌──────▼──────┐            │
                    │ localStorage│◀───────────┘
                    │ - pinned    │   (persist pins,
                    │ - lastViewed│    lastViewed)
                    └─────────────┘
```

### State Sources

| State | Source |
|-------|--------|
| Processing | `processingSessions` Set in App.tsx |
| Needs Input | New: track permission prompts via WebSocket |
| New Messages | Compare `lastViewedTimestamp` vs session `lastActivity` |
| Completed | Sessions with `lastActivity` in last 30 min + not processing |
| Pinned | `pinnedSessions` from localStorage |

---

## Technical Implementation Notes

### New Files to Create

- `src/components/Inbox.tsx` - Main inbox component
- `src/components/InboxItem.tsx` - Individual inbox item
- `src/hooks/useInboxState.ts` - Inbox state management hook
- `src/types/inbox.ts` - TypeScript types for inbox

### Files to Modify

- `src/App.tsx` - Add needsInput tracking, pass inbox props
- `src/components/Sidebar.tsx` - Integrate Inbox component at top
- `src/components/ChatInterface.tsx` - Update lastViewedTimestamp on session view
- `src/i18n/locales/en.json` - Add inbox translations
- `src/i18n/locales/zh.json` - Add inbox translations (Chinese)

### Key Hooks into Existing System

1. **processingSessions** - Already tracked in App.tsx
2. **activeSessions** - Already tracked in App.tsx
3. **selectedSession** - Use to update lastViewedTimestamp
4. **WebSocket messages** - Listen for permission prompts (type: 'permission')
5. **Session lastActivity** - Already available in session data

---

## Success Criteria

1. User can see all sessions needing attention at a glance
2. Sessions are correctly categorized by state
3. Clicking an inbox item navigates to that session
4. Dismiss behavior works correctly per state type
5. Pinned sessions persist across refreshes
6. Empty inbox shows "All clear" state
7. Mobile experience is smooth with swipe-to-dismiss
8. Visual design matches existing industrial tactile style

---

## Out of Scope (Future Enhancements)

- Sound/desktop notifications for new items
- Inbox badge count in browser tab title
- Keyboard shortcuts for inbox navigation
- Filtering inbox by project
- Inbox item previews (last message snippet)

---

## Appendix: Existing Code References

### Session Types (from Sidebar.tsx)

```typescript
interface BaseSession {
  id: string;
  lastActivity: string;
  messageCount?: number;
  title?: string;
  archived?: boolean;
  __provider?: 'claude' | 'cursor' | 'codex' | 'pi';
  __projectName?: string;
}
```

### Processing Sessions (from App.tsx)

```typescript
const [processingSessions, setProcessingSessions] = useState(new Set());

// markSessionAsProcessing: Called when Claude starts thinking
// markSessionAsNotProcessing: Called when Claude finishes
```

### Active Session Detection (from Sidebar.tsx)

```typescript
// Calculate if session is active (within last 10 minutes)
const diffInMinutes = Math.floor((currentTime.getTime() - sessionDate.getTime()) / (1000 * 60));
const isActive = diffInMinutes < 10;
```
