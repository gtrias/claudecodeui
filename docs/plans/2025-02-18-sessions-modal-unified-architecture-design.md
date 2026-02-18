# Sessions Modal & Unified Architecture Design

**Date**: 2025-02-18  
**Status**: Approved  
**Design Preview**: https://p.superdesign.dev/draft/8c8cb368-ff6a-47c0-8baf-573b58cc832d

---

## Problem Statement

### User-Facing Issues
1. **Session list is overwhelming** - All sessions (Claude, Cursor, Codex, Pi) are shown in a long list under each project, making navigation difficult
2. **PI sessions can't be deleted** - Delete action fails silently
3. **Wrong session loads** - Clicking a PI session sometimes opens a different session

### Technical Root Causes
1. **No session limit in sidebar** - All sessions rendered regardless of count
2. **Missing `projectPath` in delete API** - `deletePiSession()` doesn't pass required parameter
3. **Fallback directory scanning** - `getPiSessionMessages()` scans all directories when `projectPath` lookup fails, potentially finding wrong session with similar ID
4. **Inconsistent session interfaces** - Each provider (Claude, Pi, Codex, Cursor) has different data structures and API patterns

---

## Solution Overview

### Approach: Hybrid with Modal
- **Sidebar**: Show max 5 most recent sessions per project + "View All" button
- **Modal**: Fullscreen session browser with filters and bulk actions
- **Architecture**: Unified session API patterns across all providers

---

## UI Design

### 1. Sidebar Changes

#### Current State
```
Project Name
├── Session 1
├── Session 2
├── Session 3
├── ... (unlimited sessions)
└── Session N
```

#### New State
```
Project Name (12)              ← session count badge
├── Session 1 (most recent)
├── Session 2
├── Session 3
├── Session 4
├── Session 5
└── [View All Sessions]        ← opens modal
```

**Rules:**
- Maximum 5 sessions shown per project
- Sessions sorted by `lastActivity` (most recent first)
- Session count badge on project header
- "View All Sessions" button appears if project has >5 sessions

### 2. Sessions Modal

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ All Sessions                                            [X] │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search sessions...] [Provider ▾] [Project ▾] [Sort ▾]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟣 Fix authentication bug          2 hours ago  (5) │   │
│  │ claudecodeui                                    [...] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟠 Add TypeScript types             yesterday   (12) │   │
│  │ my-project                                      [...] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... more sessions                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Components

**Header**
- Title: "All Sessions"
- Close button (X) - also closes on Escape key or backdrop click

**Filter Bar**
| Filter | Type | Options |
|--------|------|---------|
| Search | Text input | Searches session title/summary |
| Provider | Dropdown | All, Claude, Pi, Codex, Cursor |
| Project | Dropdown | All, [list of projects] — pre-selected if opened from project |
| Sort | Dropdown | Date (newest), Date (oldest), Name (A-Z), Name (Z-A) |

**Session Card**
- Provider logo icon (colored)
- Session title (truncated if long)
- Relative timestamp (e.g., "2 hours ago", "yesterday")
- Message count badge
- Project name tag
- Hover actions: Open, Delete

**Empty State**
- Shown when no sessions match filters
- Message: "No sessions found" with suggestion to adjust filters

### 3. Mobile Considerations
- Modal is fullscreen on mobile
- Filter bar collapses to icon buttons that open filter dropdowns
- Session cards are touch-friendly with swipe-to-delete option
- Close button is prominent and easy to tap

---

## Architecture Design

### Unified Session Interface

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
  tokenUsage?: {
    input: number;
    output: number;
  };
}
```

### API Standardization

#### Current State (Inconsistent)
```
Claude:  GET /api/projects/:name/sessions/:id/messages
Pi:      GET /api/pi/sessions/:id/messages?projectPath=X
Codex:   GET /api/codex/sessions/:id/messages
Cursor:  GET /api/cursor/sessions/:id?projectPath=X
```

#### New State (Unified Pattern)
All session APIs follow consistent pattern with required `projectPath`:

```
# List sessions (used by modal)
GET /api/sessions
  ?projectPath=<path>     # optional, filter by project
  &provider=<provider>    # optional, filter by provider
  &search=<query>         # optional, search title/summary
  &sort=<field>           # optional, lastActivity|title
  &order=<asc|desc>       # optional, default desc
  &limit=<n>              # optional, default 50
  &offset=<n>             # optional, default 0

# Get session messages
GET /api/sessions/:id/messages
  ?projectPath=<path>     # REQUIRED
  &provider=<provider>    # REQUIRED
  &limit=<n>
  &offset=<n>

# Delete session
DELETE /api/sessions/:id
  ?projectPath=<path>     # REQUIRED
  &provider=<provider>    # REQUIRED
```

### Bug Fixes

#### Fix 1: PI Session Deletion
**File**: `src/utils/api.js`

```javascript
// Before
deletePiSession: (sessionId) =>
  authenticatedFetch(`/api/pi/sessions/${sessionId}`, {
    method: 'DELETE',
  }),

// After
deletePiSession: (sessionId, projectPath) =>
  authenticatedFetch(`/api/pi/sessions/${sessionId}?projectPath=${encodeURIComponent(projectPath)}`, {
    method: 'DELETE',
  }),
```

**File**: `src/components/Sidebar.tsx`
```typescript
// Before
response = await api.deletePiSession(sessionId);

// After
response = await api.deletePiSession(sessionId, project.fullPath);
```

#### Fix 2: Wrong Session Loading
**File**: `server/projects.js` - `getPiSessionMessages()`

```javascript
// Before: Fallback scanning (REMOVE THIS)
if (!sessionFilePath) {
  // Fallback: scan all session directories
  const sessionsRoot = path.join(os.homedir(), '.pi', 'agent', 'sessions');
  // ... scans all directories
}

// After: Require projectPath, fail if not found
if (!projectPath) {
  throw new Error('projectPath is required for Pi session lookup');
}
if (!sessionFilePath) {
  throw new Error(`Pi session file not found for session ${sessionId} in project ${projectPath}`);
}
```

#### Fix 3: Consistent projectPath in API calls
**File**: `src/utils/api.js`

```javascript
// Ensure all session APIs include projectPath
sessionMessages: (projectName, sessionId, limit, offset, provider, projectPath) => {
  const params = new URLSearchParams();
  if (limit !== null) {
    params.append('limit', limit);
    params.append('offset', offset);
  }
  if (projectPath) {
    params.append('projectPath', projectPath);
  }
  // ... rest of function
}
```

---

## Component Structure

### New Components

```
src/components/
├── SessionsModal/
│   ├── SessionsModal.tsx        # Main modal component
│   ├── SessionsFilterBar.tsx    # Filter bar with search/dropdowns
│   ├── SessionCard.tsx          # Individual session card
│   ├── SessionCardActions.tsx   # Hover actions (open, delete)
│   └── EmptySessionsState.tsx   # Empty state component
└── Sidebar.tsx                  # Modified to limit sessions + add button
```

### State Management

```typescript
// SessionsModal state
interface SessionsModalState {
  isOpen: boolean;
  sessions: UnifiedSession[];
  loading: boolean;
  
  // Filters
  searchQuery: string;
  providerFilter: SessionProvider | 'all';
  projectFilter: string | 'all';  // projectPath or 'all'
  sortBy: 'lastActivity' | 'title';
  sortOrder: 'asc' | 'desc';
  
  // Pre-fill
  initialProject?: string;  // Set when opened from specific project
}
```

---

## Implementation Phases

### Phase 1: Bug Fixes (Critical)
1. Fix `deletePiSession` to pass `projectPath`
2. Remove fallback scanning in `getPiSessionMessages`
3. Ensure all session API calls include `projectPath`

### Phase 2: Unified Session Type
1. Create `UnifiedSession` type
2. Create adapter functions for each provider
3. Update `getAllSessions()` to return `UnifiedSession[]`

### Phase 3: Sidebar Simplification
1. Limit sessions to 5 per project
2. Add session count badge to project header
3. Add "View All Sessions" button

### Phase 4: Sessions Modal
1. Create `SessionsModal` component structure
2. Implement filter bar with search/dropdowns
3. Implement session cards with actions
4. Add delete confirmation dialog
5. Connect to unified sessions API

### Phase 5: Polish
1. Add keyboard navigation (Escape to close)
2. Add loading states
3. Add empty states
4. Mobile responsiveness
5. i18n translations

---

## Testing Considerations

### Manual Testing
- [ ] Delete PI session - should work without errors
- [ ] Open PI session - should load correct session
- [ ] Open modal from project - project should be pre-selected
- [ ] Search sessions - should filter in real-time
- [ ] Filter by provider - should show only matching sessions
- [ ] Sort sessions - should reorder correctly
- [ ] Delete from modal - should remove session and update list
- [ ] Mobile: swipe to delete
- [ ] Mobile: filter dropdowns

### Edge Cases
- Project with 0 sessions
- Project with exactly 5 sessions (no "View All" button)
- Session with very long title
- All sessions filtered out (empty state)
- Network error during delete

---

## Design Assets

- **SuperDesign Project**: https://app.superdesign.dev/teams/235b81b0-3fb4-48cb-81ab-ff9e00b0c7d8/projects/7c38a763-6b02-40cd-9e3f-3054daaab738
- **Final Design Preview**: https://p.superdesign.dev/draft/8c8cb368-ff6a-47c0-8baf-573b58cc832d

---

## Open Questions (Resolved)

1. ~~Modal vs Page?~~ → **Modal** (keeps user in context)
2. ~~Filter complexity?~~ → **Basic + project filter** (search, provider, project, sort)
3. ~~Session limit in sidebar?~~ → **5 sessions** per project

---

## Approval

- [x] Design approved by user (2025-02-18)
- [ ] Implementation plan created
- [ ] Implementation complete
