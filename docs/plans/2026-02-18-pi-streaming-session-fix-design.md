# PI CLI Streaming & Session Persistence Fix

**Date**: 2026-02-18  
**Status**: ✅ Implemented

## Problem Statement

Two critical issues with PI CLI integration:

1. **Tool calls and think blocks not rendering in real-time**: Users don't see anything for extended periods; only final responses appear at the end
2. **PI sessions disappear after page refresh**: Session state is lost, requiring users to start fresh

## Root Cause Analysis

### Issue 1: Missing Event Handlers

**Location**: `server/pi-rpc.ts`, `handlePiEvent()` function (lines ~270-295)

The `message_update` event handler only processes two event subtypes:
- ✅ `text_delta` → forwards as `pi-text-delta`
- ✅ `thinking_delta` → forwards as `pi-thinking-delta`

**Missing handlers for:**
- ❌ `toolcall_start` - Tool execution begins
- ❌ `toolcall_delta` - Tool call argument streaming (shown in logs)
- ❌ `toolcall_end` - Tool execution completes
- ❌ `done` - Message completion signal
- ❌ `error` - Error during message generation

**Evidence from logs:**
```
[DEBUG Pi RPC] message_update subtype: toolcall_delta delta length: 10
```
These events arrive but are silently dropped.

### Issue 2: Session Resume Not Working

**Good news**: PI CLI **DOES persist sessions** to disk at `~/.pi/agent/sessions/<project>/`!

The backend correctly:
- ✅ Loads `piSessions` via `getPiSessions()` in `server/projects.js`
- ✅ Returns them in project data
- ✅ Has API for loading messages: `GET /api/pi/sessions/:sessionId/messages`

The frontend correctly:
- ✅ Displays PI sessions in sidebar
- ✅ Loads session messages when selected via `loadSessionMessages()`
- ✅ Sets `selectedSession` with `__provider: 'pi'`

**BUT the bug is in** `src/components/ChatInterface.tsx` line ~4760:

```typescript
if (!piSessionId) {
  // Start new session with initial message
  sendMessage({ type: 'pi-start', ... });
}
```

When user selects an existing PI session from sidebar:
1. `selectedSession` is set with the PI session data
2. Messages are loaded from disk (correctly!)
3. **BUT `piSessionId` remains `null`** (never set from selectedSession)
4. So the next message starts a **NEW session** instead of resuming!

The missing link: There's no `useEffect` that sets `piSessionId = selectedSession.id` when a PI session is selected.

## Proposed Solution

### Approach: Minimal, Targeted Fixes

**Rationale**: Fix the specific bugs without refactoring the entire PI integration.

---

### Fix 1: Add Missing Event Handlers in `pi-rpc.ts`

**Changes to `handlePiEvent()` method:**

```typescript
case 'message_update': {
  const { assistantMessageEvent } = event;
  const eventType = assistantMessageEvent?.type;
  const delta = assistantMessageEvent?.delta;
  const contentIndex = assistantMessageEvent?.contentIndex ?? 0;

  switch (eventType) {
    case 'text_delta':
      if (delta) {
        onEvent({
          type: 'pi-text-delta',
          sessionId,
          delta,
          contentIndex,
        });
      }
      break;

    case 'thinking_delta':
      if (delta) {
        onEvent({
          type: 'pi-thinking-delta',
          sessionId,
          delta,
        });
      }
      break;

    // NEW: Handle tool call streaming
    case 'toolcall_start':
      onEvent({
        type: 'pi-tool-start',
        sessionId,
        toolCallId: assistantMessageEvent.toolCall?.id || `tc-${Date.now()}`,
        toolName: assistantMessageEvent.toolCall?.name || 'unknown',
        args: {},
      });
      break;

    case 'toolcall_delta':
      // Stream tool call argument updates
      onEvent({
        type: 'pi-tool-update',
        sessionId,
        toolCallId: assistantMessageEvent.toolCall?.id || '',
        partialResult: delta || '',
      });
      break;

    case 'toolcall_end':
      onEvent({
        type: 'pi-tool-end',
        sessionId,
        toolCallId: assistantMessageEvent.toolCall?.id || '',
        result: assistantMessageEvent.toolCall || {},
        isError: false,
      });
      break;

    case 'done':
      // Signal message completion
      console.log(`[Pi ${sessionId}] Message complete`);
      break;

    case 'error':
      onEvent({
        type: 'pi-error',
        sessionId,
        error: assistantMessageEvent.reason || 'Unknown error',
        errorType: 'pi_message_error',
      });
      break;
  }
  break;
}
```

**New type needed in `pi-rpc-types.ts`:**
```typescript
export type PiErrorType =
  | // ... existing types
  | 'pi_message_error';  // NEW
```

---

### Fix 2: Set `piSessionId` When Selecting a PI Session

**The core fix** - Add a `useEffect` in `ChatInterface.tsx`:

```typescript
// Sync piSessionId with selectedSession for PI sessions
useEffect(() => {
  if (selectedSession?.__provider === 'pi' && selectedSession?.id) {
    // When a PI session is selected from sidebar, set piSessionId to resume it
    setPiSessionId(selectedSession.id);
    console.log('[Pi] Resuming session from sidebar:', selectedSession.id);
  }
}, [selectedSession]);
```

This ensures that when the user clicks on a PI session in the sidebar:
1. `selectedSession` is set with the PI session data
2. Messages are loaded (already works)
3. **NEW:** `piSessionId` is set from `selectedSession.id`
4. Next message will use the existing session

---

### Fix 3: Pass Session ID for Resume on `pi-start`

**Modify the `pi-start` message in `ChatInterface.tsx`** (~line 4770):

```typescript
sendMessage({
  type: 'pi-start',
  projectPath: selectedProject.fullPath || selectedProject.path,
  model: piModel || undefined,
  thinkingLevel: piThinkingLevel || 'medium',
  initialMessage: messageContent,
  images: uploadedImages.length > 0 ? uploadedImages : undefined,
  // NEW: Include resumeSessionId if resuming
  resumeSessionId: selectedSession?.__provider === 'pi' ? selectedSession.id : undefined,
});
```

**Backend change** in `server/index.ts` WebSocket handler:

```typescript
case 'pi-start':
  await piRpcManager.startSession({
    sessionId: uuidv4(),
    projectPath: data.projectPath,
    model: data.model,
    thinkingLevel: data.thinkingLevel,
    // NEW: Pass session path for resume
    resumeSessionPath: data.resumeSessionId || undefined,
    onEvent: (event) => ws.send(JSON.stringify(event)),
    onClose: (code) => { /* handle close */ },
  });
  // Then send initial message...
  break;
```

---

### Fix 4: Optional localStorage for Quick Resume on Refresh

For faster resume after page refresh (avoids needing to click sidebar):

```typescript
// In ChatInterface.tsx

// Persist active session to localStorage
useEffect(() => {
  if (piSessionId && selectedProject?.name) {
    localStorage.setItem(`pi-active-session-${selectedProject.name}`, piSessionId);
  }
}, [piSessionId, selectedProject?.name]);

// Restore on mount
useEffect(() => {
  if (provider === 'pi' && selectedProject?.name && !selectedSession) {
    const stored = localStorage.getItem(`pi-active-session-${selectedProject.name}`);
    if (stored) {
      setPiSessionId(stored);
    }
  }
}, [provider, selectedProject?.name]);

// Clear on session close
case 'pi-session-closed':
  setPiSessionId(null);
  if (selectedProject?.name) {
    localStorage.removeItem(`pi-active-session-${selectedProject.name}`);
  }
  break;
```

---

## UI/UX Improvements (Optional Enhancements)

### Better Visual Feedback During Long Operations

1. **Streaming indicator**: Show "Claude is thinking..." or "Executing tool..." with animation
2. **Tool call visualization**: Show tool arguments as they stream in
3. **Progress indication**: For file reads/writes, show incremental output

### Implementation for Tool Call Streaming Display

In `ChatInterface.tsx`, update `pi-tool-update` handler:

```typescript
case 'pi-tool-update':
  setChatMessages(prev => {
    const updated = [...prev];
    // Find the streaming tool message and append to its content
    for (let i = updated.length - 1; i >= 0; i--) {
      if (updated[i].isToolUse && updated[i].isStreaming) {
        updated[i].toolInput = (updated[i].toolInput || '') + latestMessage.partialResult;
        break;
      }
    }
    return updated;
  });
  break;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `server/pi-rpc.ts` | Add missing event handlers (`toolcall_start`, `toolcall_delta`, `toolcall_end`, `done`, `error`) in `handlePiEvent()` |
| `server/pi-rpc-types.ts` | Add `pi_message_error` to `PiErrorType` |
| `src/components/ChatInterface.tsx` | Add `useEffect` to sync `piSessionId` with `selectedSession`; add `resumeSessionId` to `pi-start` message; optional localStorage persistence |
| `server/index.ts` | Pass `resumeSessionPath` from `pi-start` message to `piRpcManager.startSession()` |

---

## Testing Plan

### Issue 1: Streaming Events
1. Start a PI session
2. Ask PI to perform a task requiring tool use (e.g., "read file.txt")
3. Verify:
   - Tool execution appears immediately when started
   - Tool arguments stream in as they're generated
   - Tool results appear when complete
   - Think blocks render in real-time

### Issue 2: Session Persistence
1. Start a PI session
2. Send a message and get a response
3. Refresh the page
4. Verify:
   - Session ID is restored
   - PI attempts to resume the session
   - Previous context is maintained (or graceful fallback if session expired)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| localStorage may not persist across domains | Use project-specific keys |
| Session may have expired on PI server side | Handle resume failure gracefully, start new session |
| Different PI versions may have different event formats | Defensive parsing with fallbacks |

---

## Decision Points for Review

1. **Session storage location**: localStorage vs Convex database?
   - Recommendation: localStorage for simplicity; database for multi-device sync

2. **Tool delta visualization**: Stream tool args vs show spinner?
   - Recommendation: Stream args for transparency

3. **Resume behavior**: Auto-resume vs ask user?
   - Recommendation: Auto-resume with fallback

---

## Approval

Please review this design and confirm:
- [ ] Issue root causes are correctly identified
- [ ] Proposed solutions address the problems
- [ ] Approach (minimal, targeted fixes) is acceptable
- [ ] Any additional requirements to consider

Once approved, I'll create a detailed implementation plan.
