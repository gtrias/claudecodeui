# Pi RPC Integration Design

**Date:** 2026-02-17  
**Status:** Approved  
**Author:** AI Assistant + User collaboration

## Overview

Full Pi integration via RPC mode when Pi is selected as the AI provider. Enables dynamic model discovery, WebSocket streaming, thinking level control, permission handling, and session management.

## Goals

- Dynamic model discovery from Pi's configured providers (17+ supported)
- Real-time WebSocket streaming for chat
- Thinking level selector in UI
- Permission dialogs matching current Claude SDK pattern
- Session management (create new, resume existing)
- Graceful error handling with Pi CLI detection

## Non-Goals

- Managing Pi's API keys (delegated to Pi CLI)
- Bundling Pi SDK (uses user's installed CLI)
- Auto-installing Pi CLI

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │ Model       │  │ Thinking    │  │ ChatInterface               │ │
│  │ Dropdown    │  │ Level       │  │ (WebSocket)                 │ │
│  │ provider/id │  │ Selector    │  │                             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Server (Express)                            │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ /api/pi/models      │  │ WebSocket Handler                   │  │
│  │ /api/pi/check       │  │ (manages Pi RPC processes)          │  │
│  └─────────────────────┘  │                                     │  │
│                           │  ┌─────────┐ ┌─────────┐            │  │
│                           │  │ Session │ │ Session │ ...        │  │
│                           │  │ Process │ │ Process │            │  │
│                           │  │ (pi rpc)│ │ (pi rpc)│            │  │
│                           │  └─────────┘ └─────────┘            │  │
│                           └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │ stdin/stdout (JSON lines)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Pi RPC Process (per session)                     │
│  pi --mode rpc [--session <path>] --cwd <project>                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration method | Pi RPC (subprocess) | Uses user's installed Pi with their extensions/skills/settings |
| Process model | One per session | Clean isolation, simple lifecycle management |
| Authentication | Delegate to Pi | Pi manages its own API keys via `~/.pi/agent/auth.json` |
| Model caching | 5 minutes | Balance freshness vs performance |
| Pi not installed | Disable in dropdown | Clear UX, no broken state |
| Model format | `provider/model` | Matches Pi's native format |

## Components

### New Files

#### `server/pi-rpc.ts`

Pi RPC process manager:

```typescript
interface PiRpcProcess {
  process: ChildProcess;
  sessionId: string;
  projectPath: string;
  stdin: Writable;
  onEvent: (event: PiEvent) => void;
  onClose: (code: number) => void;
}

class PiRpcManager {
  private processes: Map<string, PiRpcProcess> = new Map();

  async isPiInstalled(): Promise<boolean>;
  async getAvailableModels(): Promise<PiModel[]>;
  async startSession(options: StartSessionOptions): Promise<void>;
  async sendCommand(sessionId: string, command: PiCommand): Promise<PiResponse>;
  async sendPrompt(sessionId: string, message: string, images?: ImageContent[]): Promise<void>;
  async abort(sessionId: string): Promise<void>;
  async endSession(sessionId: string): Promise<void>;
  async respondToPermission(sessionId: string, requestId: string, response: ExtensionUIResponse): Promise<void>;
}

export const piRpcManager = new PiRpcManager();
```

### Updated Files

#### `server/routes/pi.ts`

New endpoints:

```typescript
// GET /api/pi/check - Check if Pi CLI is installed
router.get('/check', async (req, res) => {
  const installed = await piRpcManager.isPiInstalled();
  res.json({ installed, version: installed ? await getPiVersion() : null });
});

// GET /api/pi/models - Get available models (dynamic)
router.get('/models', async (req, res) => {
  const models = await piRpcManager.getAvailableModels();
  res.json({ 
    success: true, 
    models: models.map(m => ({
      id: `${m.provider}/${m.id}`,
      label: m.name,
      provider: m.provider,
      reasoning: m.reasoning,
      contextWindow: m.contextWindow
    }))
  });
});

// POST /api/pi/models/refresh - Invalidate cache and refetch
router.post('/models/refresh', async (req, res) => {
  modelCache = null;
  const models = await getAvailableModels();
  res.json({ success: true, models });
});
```

## WebSocket Protocol

### Client → Server Messages

```typescript
// Start Pi chat session
{ 
  type: 'pi-start',
  projectPath: string,
  model?: string,           // "anthropic/claude-sonnet-4"
  thinkingLevel?: string,   // "off" | "minimal" | "low" | "medium" | "high"
  resumeSession?: string    // Session file path to resume
}

// Send message
{
  type: 'pi-message',
  sessionId: string,
  message: string,
  images?: ImageContent[]
}

// Change model mid-session
{
  type: 'pi-set-model',
  sessionId: string,
  provider: string,
  modelId: string
}

// Change thinking level
{
  type: 'pi-set-thinking',
  sessionId: string,
  level: string
}

// Abort current operation
{
  type: 'pi-abort',
  sessionId: string
}

// End session
{
  type: 'pi-end',
  sessionId: string
}

// Permission response
{
  type: 'pi-permission-response',
  sessionId: string,
  requestId: string,
  response: { value?: string, confirmed?: boolean, cancelled?: boolean }
}
```

### Server → Client Messages

```typescript
// Session started
{ type: 'pi-session-created', sessionId: string, sessionFile: string }

// Streaming text
{ type: 'pi-text-delta', sessionId: string, delta: string, contentIndex: number }

// Thinking output
{ type: 'pi-thinking-delta', sessionId: string, delta: string }

// Tool execution
{ type: 'pi-tool-start', sessionId: string, toolCallId: string, toolName: string, args: object }
{ type: 'pi-tool-update', sessionId: string, toolCallId: string, partialResult: string }
{ type: 'pi-tool-end', sessionId: string, toolCallId: string, result: object, isError: boolean }

// Permission request
{
  type: 'pi-permission-request',
  sessionId: string,
  requestId: string,
  method: 'select' | 'confirm' | 'input',
  title: string,
  options?: string[],
  message?: string,
  timeout?: number
}

// Agent lifecycle
{ type: 'pi-agent-end', sessionId: string, messages: AgentMessage[] }

// Errors
{ type: 'pi-error', sessionId: string, error: string, errorType: PiErrorType }

// Session closed
{ type: 'pi-session-closed', sessionId: string, exitCode: number }
```

### Event Mapping (Pi RPC → WebSocket)

| Pi RPC Event | WebSocket Event |
|--------------|-----------------|
| `message_update` (text_delta) | `pi-text-delta` |
| `message_update` (thinking_delta) | `pi-thinking-delta` |
| `tool_execution_start` | `pi-tool-start` |
| `tool_execution_update` | `pi-tool-update` |
| `tool_execution_end` | `pi-tool-end` |
| `extension_ui_request` | `pi-permission-request` |
| `agent_end` | `pi-agent-end` |

## Model Discovery

### Flow

1. App startup / Pi provider selected
2. `GET /api/pi/check` → Spawns `pi --version`
3. `GET /api/pi/models` → Spawns `pi --mode rpc --no-session`, sends `get_available_models`
4. UI renders dropdown with `provider/model` format

### Caching

```typescript
let modelCache: { models: PiModel[], timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getAvailableModels(): Promise<PiModel[]> {
  if (modelCache && Date.now() - modelCache.timestamp < CACHE_TTL_MS) {
    return modelCache.models;
  }
  const models = await fetchModelsFromPiRpc();
  modelCache = { models, timestamp: Date.now() };
  return models;
}
```

## Session Management

### Lifecycle States

```
IDLE → STARTING → READY ↔ STREAMING
                    ↓
                 ABORTED
```

### New vs Resume

```typescript
// New session (no resumeSessionPath)
// Spawns: pi --mode rpc --no-session
// First prompt creates session file

// Resume existing (with resumeSessionPath)
// Spawns: pi --mode rpc --session /path/to/session.jsonl
```

## Permission Handling

Pi extensions use `extension_ui_request` for user interaction. We map these to permission dialogs:

```typescript
// Pi sends
{ "type": "extension_ui_request", "id": "uuid-1", "method": "select", "title": "Allow?", "options": ["Allow", "Deny"] }

// We forward to client as
{ "type": "pi-permission-request", "sessionId": "...", "requestId": "uuid-1", "method": "select", ... }

// Client responds
{ "type": "pi-permission-response", "sessionId": "...", "requestId": "uuid-1", "response": { "value": "Allow" } }

// We send to Pi
{ "type": "extension_ui_response", "id": "uuid-1", "value": "Allow" }
```

Timeout handling: If client doesn't respond within `timeout`, send `{ cancelled: true }`.

## UI Changes

### Provider Dropdown
- Add "Pi" option
- Disable/gray out if Pi CLI not installed

### Model Dropdown (Pi)
- Fetch from `/api/pi/models`
- Format: `provider/model` (e.g., "anthropic/claude-sonnet-4")

### Thinking Level Selector
- Show when Pi provider selected and model supports reasoning
- Options: Off, Minimal, Low, Medium, High

### Permission Dialog
- Reuse existing dialog pattern
- Support `select`, `confirm`, `input` methods
- Show countdown timer for timeout

### New State
```typescript
const [piModel, setPiModel] = useState<string>('');
const [piThinkingLevel, setPiThinkingLevel] = useState<string>('medium');
const [piSessionId, setPiSessionId] = useState<string | null>(null);
const [piPermissionRequest, setPiPermissionRequest] = useState<PermissionRequest | null>(null);
const [piInstalled, setPiInstalled] = useState<boolean | null>(null);
```

## Error Handling

### Error Types

```typescript
type PiErrorType = 
  | 'pi_not_installed'
  | 'pi_spawn_failed'
  | 'pi_crash'
  | 'pi_timeout'
  | 'pi_auth_error'
  | 'pi_model_not_found'
  | 'pi_parse_error'
  | 'pi_connection_lost';
```

### Handling

- **pi_not_installed**: Disable Pi in provider dropdown
- **pi_auth_error**: Show message to run `pi /login`
- **pi_crash**: Show error in chat, allow retry
- **pi_parse_error**: Log and continue (don't crash session)

### Reconnection

Buffer recent events server-side. On WebSocket reconnect, replay missed events.

## Testing Considerations

- Mock Pi CLI for unit tests
- Integration tests with real Pi CLI
- Test permission timeout behavior
- Test session resume functionality
- Test error scenarios (Pi not installed, no API keys, process crash)

## Future Enhancements

- Model favorites/pinning
- Per-project model preferences
- Pi extension UI beyond select/confirm/input (custom components)
- Session branching UI (Pi's `/tree` functionality)
