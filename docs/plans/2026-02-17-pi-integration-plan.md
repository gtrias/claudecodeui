# Pi RPC Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full Pi integration via RPC mode with dynamic model discovery, WebSocket streaming, thinking levels, permissions, and session management.

**Architecture:** Spawn dedicated `pi --mode rpc` process per chat session, communicate via JSON over stdin/stdout, bridge events to WebSocket. Model discovery via short-lived RPC process.

**Tech Stack:** Node.js, Express, WebSocket (ws), child_process, readline

---

## Task 1: Create Pi RPC Types

**Files:**
- Create: `server/pi-rpc-types.ts`

**Step 1: Create type definitions**

```typescript
// server/pi-rpc-types.ts
import type { ChildProcess } from 'child_process';
import type { Writable } from 'stream';

// Thinking levels supported by Pi
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

// Session states
export type PiSessionState = 'starting' | 'ready' | 'streaming' | 'aborted' | 'closed';

// Model from Pi's get_available_models
export interface PiModel {
  id: string;
  name: string;
  provider: string;
  api: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
  cost?: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
}

// Transformed model for UI
export interface PiModelOption {
  value: string;      // "provider/model-id"
  label: string;      // Display name
  provider: string;
  reasoning: boolean;
  contextWindow: number;
}

// Active session tracking
export interface ActivePiSession {
  id: string;
  process: ChildProcess;
  stdin: Writable;
  projectPath: string;
  piSessionFile?: string;
  model?: string;
  thinkingLevel: ThinkingLevel;
  state: PiSessionState;
  createdAt: Date;
  onEvent: (event: PiWebSocketEvent) => void;
  onClose: (code: number) => void;
}

// Start session options
export interface StartPiSessionOptions {
  sessionId: string;
  projectPath: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  resumeSessionPath?: string;
  onEvent: (event: PiWebSocketEvent) => void;
  onClose: (code: number) => void;
}

// Pi RPC commands (client -> Pi)
export type PiRpcCommand =
  | { type: 'prompt'; message: string; images?: ImageContent[] }
  | { type: 'steer'; message: string }
  | { type: 'follow_up'; message: string }
  | { type: 'abort' }
  | { type: 'get_state' }
  | { type: 'get_available_models' }
  | { type: 'set_model'; provider: string; modelId: string }
  | { type: 'set_thinking_level'; level: ThinkingLevel }
  | { type: 'new_session' }
  | { type: 'get_messages' };

// Pi RPC response
export interface PiRpcResponse {
  type: 'response';
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// Pi RPC events (Pi -> client)
export interface PiMessageUpdateEvent {
  type: 'message_update';
  message: unknown;
  assistantMessageEvent: {
    type: 'text_delta' | 'thinking_delta' | 'toolcall_start' | 'toolcall_delta' | 'toolcall_end' | 'done' | 'error';
    delta?: string;
    contentIndex?: number;
    toolCall?: unknown;
    reason?: string;
  };
}

export interface PiToolExecutionEvent {
  type: 'tool_execution_start' | 'tool_execution_update' | 'tool_execution_end';
  toolCallId: string;
  toolName: string;
  args?: object;
  partialResult?: { content: Array<{ type: string; text: string }> };
  result?: { content: Array<{ type: string; text: string }> };
  isError?: boolean;
}

export interface PiExtensionUIRequestEvent {
  type: 'extension_ui_request';
  id: string;
  method: 'select' | 'confirm' | 'input' | 'editor' | 'notify' | 'setStatus';
  title?: string;
  options?: string[];
  message?: string;
  placeholder?: string;
  timeout?: number;
}

export interface PiAgentEvent {
  type: 'agent_start' | 'agent_end';
  messages?: unknown[];
}

export type PiRpcEvent =
  | PiMessageUpdateEvent
  | PiToolExecutionEvent
  | PiExtensionUIRequestEvent
  | PiAgentEvent
  | PiRpcResponse;

// Image content for prompts
export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

// WebSocket events (server -> browser client)
export type PiWebSocketEvent =
  | { type: 'pi-session-created'; sessionId: string; sessionFile?: string }
  | { type: 'pi-text-delta'; sessionId: string; delta: string; contentIndex: number }
  | { type: 'pi-thinking-delta'; sessionId: string; delta: string }
  | { type: 'pi-tool-start'; sessionId: string; toolCallId: string; toolName: string; args: object }
  | { type: 'pi-tool-update'; sessionId: string; toolCallId: string; partialResult: string }
  | { type: 'pi-tool-end'; sessionId: string; toolCallId: string; result: object; isError: boolean }
  | { type: 'pi-permission-request'; sessionId: string; requestId: string; method: string; title: string; options?: string[]; message?: string; timeout?: number }
  | { type: 'pi-agent-start'; sessionId: string }
  | { type: 'pi-agent-end'; sessionId: string; messages: unknown[] }
  | { type: 'pi-error'; sessionId: string; error: string; errorType: PiErrorType }
  | { type: 'pi-session-closed'; sessionId: string; exitCode: number };

// Error types
export type PiErrorType =
  | 'pi_not_installed'
  | 'pi_spawn_failed'
  | 'pi_crash'
  | 'pi_timeout'
  | 'pi_auth_error'
  | 'pi_model_not_found'
  | 'pi_parse_error'
  | 'pi_connection_lost';

// Permission response from client
export interface PiPermissionResponse {
  value?: string;
  confirmed?: boolean;
  cancelled?: boolean;
}
```

**Step 2: Commit**

```bash
git add server/pi-rpc-types.ts
git commit -m "feat(pi): add Pi RPC type definitions"
```

---

## Task 2: Create Pi RPC Manager - Core Structure

**Files:**
- Create: `server/pi-rpc.ts`

**Step 1: Create the PiRpcManager class with isPiInstalled**

```typescript
// server/pi-rpc.ts
import { spawn, type ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import type {
  ActivePiSession,
  PiModel,
  PiModelOption,
  PiRpcCommand,
  PiRpcEvent,
  PiRpcResponse,
  PiWebSocketEvent,
  StartPiSessionOptions,
  ThinkingLevel,
  PiPermissionResponse,
  PiErrorType,
} from './pi-rpc-types.js';

// Model cache
interface ModelCache {
  models: PiModel[];
  timestamp: number;
}

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class PiRpcManager {
  private processes: Map<string, ActivePiSession> = new Map();
  private pendingPermissions: Map<string, { sessionId: string; timeout?: number; createdAt: number }> = new Map();
  private modelCache: ModelCache | null = null;
  private timeoutWatcher: NodeJS.Timeout | null = null;

  constructor() {
    this.startTimeoutWatcher();
  }

  /**
   * Check if Pi CLI is installed
   */
  async isPiInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('pi', ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
      
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
      
      // Timeout after 5 seconds
      setTimeout(() => {
        proc.kill();
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Get Pi CLI version
   */
  async getPiVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      const proc = spawn('pi', ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
      let output = '';
      
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      proc.on('error', () => resolve(null));
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          resolve(null);
        }
      });
      
      setTimeout(() => {
        proc.kill();
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Start timeout watcher for permission requests
   */
  private startTimeoutWatcher(): void {
    if (this.timeoutWatcher) return;
    
    this.timeoutWatcher = setInterval(() => {
      const now = Date.now();
      for (const [requestId, pending] of this.pendingPermissions) {
        if (pending.timeout && now - pending.createdAt > pending.timeout) {
          this.respondToPermission(pending.sessionId, requestId, { cancelled: true });
        }
      }
    }, 1000);
  }

  /**
   * Stop timeout watcher
   */
  dispose(): void {
    if (this.timeoutWatcher) {
      clearInterval(this.timeoutWatcher);
      this.timeoutWatcher = null;
    }
    
    // Kill all processes
    for (const [sessionId] of this.processes) {
      this.endSession(sessionId);
    }
  }

  /**
   * Get active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.processes.keys());
  }

  /**
   * Check if session is active
   */
  isSessionActive(sessionId: string): boolean {
    return this.processes.has(sessionId);
  }
}

export const piRpcManager = new PiRpcManager();
```

**Step 2: Commit**

```bash
git add server/pi-rpc.ts
git commit -m "feat(pi): add PiRpcManager core structure with CLI detection"
```

---

## Task 3: Add Model Discovery to PiRpcManager

**Files:**
- Modify: `server/pi-rpc.ts`

**Step 1: Add getAvailableModels method**

Add this method to the `PiRpcManager` class after `isSessionActive`:

```typescript
  /**
   * Get available models from Pi (with caching)
   */
  async getAvailableModels(): Promise<PiModelOption[]> {
    // Check cache
    if (this.modelCache && Date.now() - this.modelCache.timestamp < MODEL_CACHE_TTL_MS) {
      return this.formatModelsForUI(this.modelCache.models);
    }

    // Fetch from Pi RPC
    const models = await this.fetchModelsFromPi();
    this.modelCache = { models, timestamp: Date.now() };
    return this.formatModelsForUI(models);
  }

  /**
   * Invalidate model cache
   */
  invalidateModelCache(): void {
    this.modelCache = null;
  }

  /**
   * Format models for UI dropdown
   */
  private formatModelsForUI(models: PiModel[]): PiModelOption[] {
    return models.map((m) => ({
      value: `${m.provider}/${m.id}`,
      label: m.name,
      provider: m.provider,
      reasoning: m.reasoning,
      contextWindow: m.contextWindow,
    }));
  }

  /**
   * Fetch models from Pi RPC process
   */
  private async fetchModelsFromPi(): Promise<PiModel[]> {
    return new Promise((resolve, reject) => {
      const proc = spawn('pi', ['--mode', 'rpc', '--no-session'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          proc.kill();
        }
      };

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout fetching models from Pi'));
      }, 30000);

      const rl = createInterface({ input: proc.stdout });

      rl.on('line', (line) => {
        try {
          const event = JSON.parse(line) as PiRpcResponse;
          if (event.type === 'response' && event.command === 'get_available_models') {
            clearTimeout(timeout);
            resolved = true;
            proc.kill();
            
            if (event.success && event.data) {
              const data = event.data as { models: PiModel[] };
              resolve(data.models || []);
            } else {
              reject(new Error(event.error || 'Failed to get models'));
            }
          }
        } catch {
          // Ignore parse errors for non-JSON lines
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          if (code !== 0) {
            reject(new Error(`Pi process exited with code ${code}`));
          } else {
            resolve([]);
          }
        }
      });

      // Send the command
      proc.stdin.write(JSON.stringify({ type: 'get_available_models' }) + '\n');
    });
  }
```

**Step 2: Commit**

```bash
git add server/pi-rpc.ts
git commit -m "feat(pi): add model discovery with caching to PiRpcManager"
```

---

## Task 4: Add Session Management to PiRpcManager

**Files:**
- Modify: `server/pi-rpc.ts`

**Step 1: Add session management methods**

Add these methods to `PiRpcManager` after `fetchModelsFromPi`:

```typescript
  /**
   * Start a new Pi RPC session
   */
  async startSession(options: StartPiSessionOptions): Promise<void> {
    const { sessionId, projectPath, model, thinkingLevel, resumeSessionPath, onEvent, onClose } = options;

    // Check Pi is installed
    if (!(await this.isPiInstalled())) {
      onEvent({
        type: 'pi-error',
        sessionId,
        error: 'Pi CLI not found. Install with: npm i -g @mariozechner/pi-coding-agent',
        errorType: 'pi_not_installed',
      });
      throw new Error('Pi CLI not installed');
    }

    // Build command args
    const args = ['--mode', 'rpc'];
    
    if (resumeSessionPath) {
      args.push('--session', resumeSessionPath);
    } else {
      args.push('--no-session');
    }

    // Spawn process
    const proc = spawn('pi', args, {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    const session: ActivePiSession = {
      id: sessionId,
      process: proc,
      stdin: proc.stdin,
      projectPath,
      model,
      thinkingLevel: thinkingLevel || 'medium',
      state: 'starting',
      createdAt: new Date(),
      onEvent,
      onClose,
    };

    this.processes.set(sessionId, session);

    // Handle stdout (JSON events)
    const rl = createInterface({ input: proc.stdout });
    rl.on('line', (line) => {
      this.handlePiOutput(session, line);
    });

    // Handle stderr
    proc.stderr.on('data', (data) => {
      console.error(`[Pi ${sessionId}] stderr:`, data.toString());
    });

    // Handle process errors
    proc.on('error', (err) => {
      console.error(`[Pi ${sessionId}] process error:`, err);
      session.state = 'closed';
      onEvent({
        type: 'pi-error',
        sessionId,
        error: `Failed to start Pi: ${err.message}`,
        errorType: 'pi_spawn_failed',
      });
      this.processes.delete(sessionId);
      onClose(1);
    });

    // Handle process exit
    proc.on('close', (code) => {
      console.log(`[Pi ${sessionId}] process exited with code ${code}`);
      session.state = 'closed';
      this.processes.delete(sessionId);
      onEvent({
        type: 'pi-session-closed',
        sessionId,
        exitCode: code ?? 0,
      });
      onClose(code ?? 0);
    });

    // Set model and thinking level if specified
    session.state = 'ready';
    onEvent({ type: 'pi-session-created', sessionId });

    if (model) {
      const [provider, modelId] = model.split('/');
      if (provider && modelId) {
        await this.sendCommand(sessionId, { type: 'set_model', provider, modelId });
      }
    }

    if (thinkingLevel) {
      await this.sendCommand(sessionId, { type: 'set_thinking_level', level: thinkingLevel });
    }
  }

  /**
   * Handle output line from Pi process
   */
  private handlePiOutput(session: ActivePiSession, line: string): void {
    try {
      const event = JSON.parse(line) as PiRpcEvent;
      this.handlePiEvent(session, event);
    } catch {
      console.warn(`[Pi ${session.id}] Failed to parse line:`, line.substring(0, 100));
      session.onEvent({
        type: 'pi-error',
        sessionId: session.id,
        error: `Invalid JSON from Pi: ${line.substring(0, 100)}`,
        errorType: 'pi_parse_error',
      });
    }
  }

  /**
   * Handle parsed Pi event
   */
  private handlePiEvent(session: ActivePiSession, event: PiRpcEvent): void {
    const { id: sessionId, onEvent } = session;

    switch (event.type) {
      case 'message_update': {
        const { assistantMessageEvent } = event;
        if (assistantMessageEvent.type === 'text_delta' && assistantMessageEvent.delta) {
          onEvent({
            type: 'pi-text-delta',
            sessionId,
            delta: assistantMessageEvent.delta,
            contentIndex: assistantMessageEvent.contentIndex ?? 0,
          });
        } else if (assistantMessageEvent.type === 'thinking_delta' && assistantMessageEvent.delta) {
          onEvent({
            type: 'pi-thinking-delta',
            sessionId,
            delta: assistantMessageEvent.delta,
          });
        }
        break;
      }

      case 'tool_execution_start':
        onEvent({
          type: 'pi-tool-start',
          sessionId,
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          args: event.args || {},
        });
        break;

      case 'tool_execution_update':
        onEvent({
          type: 'pi-tool-update',
          sessionId,
          toolCallId: event.toolCallId,
          partialResult: event.partialResult?.content?.[0]?.text || '',
        });
        break;

      case 'tool_execution_end':
        onEvent({
          type: 'pi-tool-end',
          sessionId,
          toolCallId: event.toolCallId,
          result: event.result || {},
          isError: event.isError || false,
        });
        break;

      case 'extension_ui_request':
        // Only handle dialog methods (select, confirm, input)
        if (['select', 'confirm', 'input', 'editor'].includes(event.method)) {
          this.pendingPermissions.set(event.id, {
            sessionId,
            timeout: event.timeout,
            createdAt: Date.now(),
          });
          
          onEvent({
            type: 'pi-permission-request',
            sessionId,
            requestId: event.id,
            method: event.method,
            title: event.title || '',
            options: event.options,
            message: event.message,
            timeout: event.timeout,
          });
        }
        break;

      case 'agent_start':
        session.state = 'streaming';
        onEvent({ type: 'pi-agent-start', sessionId });
        break;

      case 'agent_end':
        session.state = 'ready';
        onEvent({
          type: 'pi-agent-end',
          sessionId,
          messages: event.messages || [],
        });
        break;

      case 'response':
        // Handle responses to commands (usually just logged)
        if (!event.success) {
          console.error(`[Pi ${sessionId}] Command ${event.command} failed:`, event.error);
        }
        break;
    }
  }

  /**
   * Send command to Pi session
   */
  async sendCommand(sessionId: string, command: PiRpcCommand): Promise<PiRpcResponse | null> {
    const session = this.processes.get(sessionId);
    if (!session) {
      console.error(`[Pi] Session ${sessionId} not found`);
      return null;
    }

    try {
      session.stdin.write(JSON.stringify(command) + '\n');
      return { type: 'response', command: command.type, success: true };
    } catch (err) {
      console.error(`[Pi ${sessionId}] Failed to send command:`, err);
      return { type: 'response', command: command.type, success: false, error: String(err) };
    }
  }

  /**
   * Send prompt to Pi session
   */
  async sendPrompt(sessionId: string, message: string, images?: Array<{ type: 'image'; data: string; mimeType: string }>): Promise<void> {
    const session = this.processes.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const command: PiRpcCommand = { type: 'prompt', message };
    if (images && images.length > 0) {
      (command as any).images = images;
    }

    session.stdin.write(JSON.stringify(command) + '\n');
  }

  /**
   * Abort current operation in session
   */
  async abort(sessionId: string): Promise<void> {
    await this.sendCommand(sessionId, { type: 'abort' });
    const session = this.processes.get(sessionId);
    if (session) {
      session.state = 'ready';
    }
  }

  /**
   * End session (kill process)
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.processes.get(sessionId);
    if (session) {
      session.process.kill();
      this.processes.delete(sessionId);
    }
  }

  /**
   * Respond to permission request
   */
  async respondToPermission(sessionId: string, requestId: string, response: PiPermissionResponse): Promise<void> {
    const session = this.processes.get(sessionId);
    if (!session) return;

    const piResponse = {
      type: 'extension_ui_response',
      id: requestId,
      ...response,
    };

    session.stdin.write(JSON.stringify(piResponse) + '\n');
    this.pendingPermissions.delete(requestId);
  }

  /**
   * Set model for session
   */
  async setModel(sessionId: string, provider: string, modelId: string): Promise<void> {
    await this.sendCommand(sessionId, { type: 'set_model', provider, modelId });
    const session = this.processes.get(sessionId);
    if (session) {
      session.model = `${provider}/${modelId}`;
    }
  }

  /**
   * Set thinking level for session
   */
  async setThinkingLevel(sessionId: string, level: ThinkingLevel): Promise<void> {
    await this.sendCommand(sessionId, { type: 'set_thinking_level', level });
    const session = this.processes.get(sessionId);
    if (session) {
      session.thinkingLevel = level;
    }
  }
```

**Step 2: Commit**

```bash
git add server/pi-rpc.ts
git commit -m "feat(pi): add session management to PiRpcManager"
```

---

## Task 5: Update Pi Routes

**Files:**
- Modify: `server/routes/pi.ts`

**Step 1: Replace pi.ts with updated implementation**

```typescript
// server/routes/pi.ts
import express from 'express';
import type { Request, Response } from 'express';
import { piRpcManager } from '../pi-rpc.js';

const router = express.Router();

// GET /api/pi/check - Check if Pi CLI is installed
router.get('/check', async (_req: Request, res: Response) => {
  try {
    const installed = await piRpcManager.isPiInstalled();
    let version: string | null = null;
    
    if (installed) {
      version = await piRpcManager.getPiVersion();
    }
    
    res.json({ installed, version });
  } catch (error) {
    console.error('Error checking Pi installation:', error);
    res.status(500).json({ 
      installed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/pi/models - Get available Pi models (dynamic)
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const installed = await piRpcManager.isPiInstalled();
    if (!installed) {
      return res.json({ 
        success: false, 
        error: 'Pi CLI not installed',
        models: [] 
      });
    }

    const models = await piRpcManager.getAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    console.error('Error getting Pi models:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      models: [] 
    });
  }
});

// POST /api/pi/models/refresh - Invalidate cache and refetch models
router.post('/models/refresh', async (_req: Request, res: Response) => {
  try {
    piRpcManager.invalidateModelCache();
    const models = await piRpcManager.getAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    console.error('Error refreshing Pi models:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      models: [] 
    });
  }
});

// GET /api/pi/sessions - Get Pi sessions (existing functionality)
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const projectPath = req.query.projectPath as string;
    if (!projectPath) {
      return res.json({ sessions: [] });
    }

    const { getPiSessions } = await import('../projects.js');
    const sessions = await getPiSessions(projectPath);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error getting Pi sessions:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/pi/sessions/:sessionId/messages - Get messages for a Pi session
router.get('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const projectPath = req.query.projectPath as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const { getPiSessionMessages } = await import('../projects.js');
    const result = await getPiSessionMessages(sessionId, projectPath, limit, offset);

    if (Array.isArray(result)) {
      res.json({ messages: result });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error getting Pi session messages:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/pi/sessions/:sessionId - Delete a Pi session
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const projectPath = req.query.projectPath as string;

    const { deletePiSession } = await import('../projects.js');
    await deletePiSession(sessionId, projectPath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Pi session:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/pi/active-sessions - Get active Pi sessions on server
router.get('/active-sessions', (_req: Request, res: Response) => {
  const sessions = piRpcManager.getActiveSessions();
  res.json({ success: true, sessions });
});

export default router;
```

**Step 2: Commit**

```bash
git add server/routes/pi.ts
git commit -m "feat(pi): update Pi routes with dynamic model discovery"
```

---

## Task 6: Add Pi WebSocket Handlers

**Files:**
- Modify: `server/index.js` (or wherever WebSocket handlers are defined)

**Step 1: Identify WebSocket handler location**

Run: `grep -rn "ws\|websocket\|WebSocket" server/ --include="*.ts" --include="*.js" | grep -v node_modules | head -20`

Check where WebSocket message handling occurs (likely `server/index.js` or a dedicated file).

**Step 2: Add Pi message handlers**

Add to the WebSocket message handler (after existing Claude/Cursor handlers):

```typescript
// Import at top
import { piRpcManager } from './pi-rpc.js';
import type { ThinkingLevel } from './pi-rpc-types.js';

// In WebSocket message handler
case 'pi-start': {
  const { projectPath, model, thinkingLevel, resumeSession } = data;
  const sessionId = crypto.randomUUID();
  
  try {
    await piRpcManager.startSession({
      sessionId,
      projectPath,
      model,
      thinkingLevel: thinkingLevel as ThinkingLevel,
      resumeSessionPath: resumeSession,
      onEvent: (event) => {
        ws.send(JSON.stringify(event));
      },
      onClose: (code) => {
        console.log(`Pi session ${sessionId} closed with code ${code}`);
      },
    });
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'pi-error',
      sessionId,
      error: error instanceof Error ? error.message : 'Failed to start Pi session',
      errorType: 'pi_spawn_failed',
    }));
  }
  break;
}

case 'pi-message': {
  const { sessionId, message, images } = data;
  try {
    await piRpcManager.sendPrompt(sessionId, message, images);
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'pi-error',
      sessionId,
      error: error instanceof Error ? error.message : 'Failed to send message',
      errorType: 'pi_connection_lost',
    }));
  }
  break;
}

case 'pi-set-model': {
  const { sessionId, provider, modelId } = data;
  await piRpcManager.setModel(sessionId, provider, modelId);
  break;
}

case 'pi-set-thinking': {
  const { sessionId, level } = data;
  await piRpcManager.setThinkingLevel(sessionId, level as ThinkingLevel);
  break;
}

case 'pi-abort': {
  const { sessionId } = data;
  await piRpcManager.abort(sessionId);
  break;
}

case 'pi-end': {
  const { sessionId } = data;
  await piRpcManager.endSession(sessionId);
  break;
}

case 'pi-permission-response': {
  const { sessionId, requestId, response } = data;
  await piRpcManager.respondToPermission(sessionId, requestId, response);
  break;
}
```

**Step 3: Commit**

```bash
git add server/index.js  # or wherever handlers were added
git commit -m "feat(pi): add Pi WebSocket message handlers"
```

---

## Task 7: Add Pi State to ChatInterface

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add Pi-related state**

Find the state declarations section (around line 100-200) and add:

```typescript
// Pi provider state
const [piInstalled, setPiInstalled] = useState<boolean | null>(null);
const [piModels, setPiModels] = useState<Array<{ value: string; label: string; provider: string; reasoning: boolean }>>([]);
const [piModel, setPiModel] = useState<string>('');
const [piThinkingLevel, setPiThinkingLevel] = useState<string>('medium');
const [piSessionId, setPiSessionId] = useState<string | null>(null);
const [piPermissionRequest, setPiPermissionRequest] = useState<{
  requestId: string;
  method: string;
  title: string;
  options?: string[];
  message?: string;
  timeout?: number;
} | null>(null);
const [piModelLoadError, setPiModelLoadError] = useState<string | null>(null);
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi state variables to ChatInterface"
```

---

## Task 8: Add Pi Installation Check

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add useEffect for Pi installation check**

Find the useEffect section and add:

```typescript
// Check if Pi CLI is installed
useEffect(() => {
  authenticatedFetch('/api/pi/check')
    .then((res) => res.json())
    .then((data) => {
      setPiInstalled(data.installed);
      if (data.installed) {
        console.log('[Pi] CLI installed, version:', data.version);
      }
    })
    .catch((err) => {
      console.error('[Pi] Error checking installation:', err);
      setPiInstalled(false);
    });
}, []);
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi CLI installation check"
```

---

## Task 9: Add Pi Model Fetching

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add useEffect for Pi model fetching**

```typescript
// Fetch Pi models when provider is 'pi'
useEffect(() => {
  if (provider !== 'pi' || !piInstalled) return;

  setPiModelLoadError(null);
  
  authenticatedFetch('/api/pi/models')
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.models && data.models.length > 0) {
        setPiModels(data.models);
        // Set default model if none selected
        if (!piModel && data.models.length > 0) {
          setPiModel(data.models[0].value);
        }
      } else if (data.models?.length === 0) {
        setPiModelLoadError('No models available. Configure API keys with `pi /login`');
      } else {
        setPiModelLoadError(data.error || 'Failed to load models');
      }
    })
    .catch((err) => {
      console.error('[Pi] Error fetching models:', err);
      setPiModelLoadError('Failed to load models');
    });
}, [provider, piInstalled]);
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi model fetching"
```

---

## Task 10: Add Pi to Provider Dropdown

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Find provider dropdown and add Pi option**

Locate the provider dropdown (search for `provider` select/dropdown) and add Pi option:

```tsx
{/* Pi provider option - disabled if not installed */}
<option 
  value="pi" 
  disabled={piInstalled === false}
  title={piInstalled === false ? 'Pi CLI not installed' : undefined}
>
  Pi {piInstalled === false ? '(not installed)' : ''}
</option>
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi to provider dropdown"
```

---

## Task 11: Add Pi Model Dropdown

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add Pi model dropdown in settings area**

Find where Claude/Cursor model dropdowns are rendered and add Pi model dropdown:

```tsx
{provider === 'pi' && (
  <div className="flex flex-col gap-2">
    {piModelLoadError ? (
      <div className="text-amber-500 text-sm">{piModelLoadError}</div>
    ) : (
      <select
        value={piModel}
        onChange={(e) => setPiModel(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1"
      >
        {piModels.map((m) => (
          <option key={m.value} value={m.value}>
            {m.value}
          </option>
        ))}
      </select>
    )}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi model dropdown"
```

---

## Task 12: Add Thinking Level Selector

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add thinking level constants and selector**

Add constants near top of file:

```typescript
const PI_THINKING_LEVELS = [
  { value: 'off', label: 'Off' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
```

Add selector next to model dropdown:

```tsx
{provider === 'pi' && piModels.find((m) => m.value === piModel)?.reasoning && (
  <select
    value={piThinkingLevel}
    onChange={(e) => setPiThinkingLevel(e.target.value)}
    className="bg-gray-700 text-white rounded px-2 py-1"
    title="Thinking Level"
  >
    {PI_THINKING_LEVELS.map((t) => (
      <option key={t.value} value={t.value}>
        {t.label}
      </option>
    ))}
  </select>
)}
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add thinking level selector"
```

---

## Task 13: Add Pi WebSocket Event Handlers

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add Pi event handlers in WebSocket onmessage**

Find the WebSocket `onmessage` handler and add Pi event handling:

```typescript
// Pi events
case 'pi-session-created':
  setPiSessionId(data.sessionId);
  break;

case 'pi-text-delta':
  // Append text to current message (similar to claude-response handling)
  // This depends on your existing message handling pattern
  appendToAssistantMessage(data.delta);
  break;

case 'pi-thinking-delta':
  // Handle thinking output if you display it
  appendToThinkingOutput(data.delta);
  break;

case 'pi-tool-start':
  // Show tool execution started
  addToolExecution({
    toolCallId: data.toolCallId,
    toolName: data.toolName,
    args: data.args,
    status: 'running',
  });
  break;

case 'pi-tool-update':
  updateToolExecution(data.toolCallId, { partialResult: data.partialResult });
  break;

case 'pi-tool-end':
  updateToolExecution(data.toolCallId, {
    result: data.result,
    isError: data.isError,
    status: 'complete',
  });
  break;

case 'pi-permission-request':
  setPiPermissionRequest({
    requestId: data.requestId,
    method: data.method,
    title: data.title,
    options: data.options,
    message: data.message,
    timeout: data.timeout,
  });
  break;

case 'pi-agent-end':
  // Agent finished processing
  setIsStreaming(false);
  break;

case 'pi-error':
  // Show error
  addErrorMessage(data.error);
  if (data.errorType === 'pi_not_installed') {
    setPiInstalled(false);
  }
  break;

case 'pi-session-closed':
  setPiSessionId(null);
  break;
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi WebSocket event handlers"
```

---

## Task 14: Add Pi Message Sending

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Update send message handler for Pi**

Find the message send function and add Pi handling:

```typescript
// In sendMessage function or similar
if (provider === 'pi') {
  if (!piSessionId) {
    // Start new session
    ws.send(JSON.stringify({
      type: 'pi-start',
      projectPath: currentProject?.path || process.cwd(),
      model: piModel,
      thinkingLevel: piThinkingLevel,
    }));
  }
  
  // Wait for session to be created, then send message
  // Or if session exists, send directly
  if (piSessionId) {
    ws.send(JSON.stringify({
      type: 'pi-message',
      sessionId: piSessionId,
      message: messageText,
      images: attachedImages,
    }));
  }
  return;
}
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi message sending"
```

---

## Task 15: Add Pi Permission Dialog

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Add permission dialog component**

Add dialog rendering (could be a separate component, but inline for simplicity):

```tsx
{/* Pi Permission Dialog */}
{piPermissionRequest && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold mb-4">{piPermissionRequest.title}</h3>
      
      {piPermissionRequest.message && (
        <p className="text-gray-300 mb-4">{piPermissionRequest.message}</p>
      )}
      
      {piPermissionRequest.method === 'select' && piPermissionRequest.options && (
        <div className="flex flex-col gap-2">
          {piPermissionRequest.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                ws?.send(JSON.stringify({
                  type: 'pi-permission-response',
                  sessionId: piSessionId,
                  requestId: piPermissionRequest.requestId,
                  response: { value: opt },
                }));
                setPiPermissionRequest(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      
      {piPermissionRequest.method === 'confirm' && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              ws?.send(JSON.stringify({
                type: 'pi-permission-response',
                sessionId: piSessionId,
                requestId: piPermissionRequest.requestId,
                response: { confirmed: false },
              }));
              setPiPermissionRequest(null);
            }}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            No
          </button>
          <button
            onClick={() => {
              ws?.send(JSON.stringify({
                type: 'pi-permission-response',
                sessionId: piSessionId,
                requestId: piPermissionRequest.requestId,
                response: { confirmed: true },
              }));
              setPiPermissionRequest(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Yes
          </button>
        </div>
      )}
      
      <button
        onClick={() => {
          ws?.send(JSON.stringify({
            type: 'pi-permission-response',
            sessionId: piSessionId,
            requestId: piPermissionRequest.requestId,
            response: { cancelled: true },
          }));
          setPiPermissionRequest(null);
        }}
        className="mt-4 text-gray-400 hover:text-white text-sm"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi permission dialog"
```

---

## Task 16: Add Pi Abort Handler

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Step 1: Update abort/stop handler for Pi**

Find the abort/stop function and add Pi handling:

```typescript
// In handleAbort or similar function
if (provider === 'pi' && piSessionId) {
  ws?.send(JSON.stringify({
    type: 'pi-abort',
    sessionId: piSessionId,
  }));
  return;
}
```

**Step 2: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(pi): add Pi abort handler"
```

---

## Task 17: Integration Testing

**Files:**
- Manual testing

**Step 1: Test Pi CLI detection**

1. Run the app
2. Check browser console for Pi installation log
3. Verify Pi option is enabled/disabled correctly in provider dropdown

**Step 2: Test model fetching**

1. Select Pi as provider
2. Verify model dropdown populates with `provider/model` format
3. Verify thinking level selector appears for reasoning models

**Step 3: Test chat session**

1. Send a message with Pi provider
2. Verify streaming text appears
3. Verify tool executions are shown
4. Test abort functionality

**Step 4: Test permissions**

1. Trigger a tool that requires permission
2. Verify permission dialog appears
3. Test approve/deny/cancel actions

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat(pi): complete Pi RPC integration"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Pi RPC type definitions | `server/pi-rpc-types.ts` |
| 2 | PiRpcManager core structure | `server/pi-rpc.ts` |
| 3 | Model discovery with caching | `server/pi-rpc.ts` |
| 4 | Session management | `server/pi-rpc.ts` |
| 5 | Updated Pi routes | `server/routes/pi.ts` |
| 6 | WebSocket handlers | `server/index.js` |
| 7-16 | UI components | `src/components/ChatInterface.tsx` |
| 17 | Integration testing | Manual |

Total: ~17 tasks, estimated 2-4 hours implementation time.
