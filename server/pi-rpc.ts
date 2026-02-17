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

  // Placeholder methods to be implemented in Tasks 3 and 4
  async getAvailableModels(): Promise<PiModelOption[]> {
    return [];
  }
  
  invalidateModelCache(): void {
    this.modelCache = null;
  }

  async startSession(options: StartPiSessionOptions): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async sendCommand(sessionId: string, command: PiRpcCommand): Promise<PiRpcResponse | null> {
    return null;
  }

  async sendPrompt(sessionId: string, message: string, images?: Array<{ type: 'image'; data: string; mimeType: string }>): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async abort(sessionId: string): Promise<void> {
    // To be implemented
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.processes.get(sessionId);
    if (session) {
      session.process.kill();
      this.processes.delete(sessionId);
    }
  }

  async respondToPermission(sessionId: string, requestId: string, response: PiPermissionResponse): Promise<void> {
    // To be implemented
  }

  async setModel(sessionId: string, provider: string, modelId: string): Promise<void> {
    // To be implemented
  }

  async setThinkingLevel(sessionId: string, level: ThinkingLevel): Promise<void> {
    // To be implemented
  }
}

export const piRpcManager = new PiRpcManager();
