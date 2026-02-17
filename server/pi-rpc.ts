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
   * End Pi session
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
}

export const piRpcManager = new PiRpcManager();
