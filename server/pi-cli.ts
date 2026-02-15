import { spawn, SpawnOptions } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { WebSocket } from 'ws';
import { environmentVariablesDb } from './database/db.js';

// Type definitions
interface PiSession {
  process: any;
  sessionId: string;
  created: Date;
}

interface PiCommandResult {
  command: string;
  baseArgs: string[];
}

interface PiMessage {
  type: string;
  sessionId: string;
  data: {
    type: string;
    delta?: {
      type: string;
      text?: string;
    };
    content?: string;
  };
}

// Track active processes by session ID
let activePiProcesses = new Map<string, PiSession>();

// Get default Pi test script path
function getDefaultPiTestScriptPath(): string {
  return path.join(os.homedir(), 'src', 'pi-mono', 'pi-test.sh');
}

// Resolve Pi command to use
async function resolvePiCommand(): Promise<PiCommandResult> {
  const configured = process.env.PI_CLI_COMMAND?.trim();
  if (configured) {
    const parts = configured.split(/\s+/);
    return { command: parts[0], baseArgs: parts.slice(1) };
  }

  // Default to installed binary if present
  return { command: 'pi', baseArgs: [] };
}

// Extract text from content (handles various content formats)
function extractTextFromContent(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (!part) return '';
      if (typeof part === 'string') return part;
      if (part.type === 'text') return part.text || '';
      if (part.type === 'thinking') return ''; // don't surface by default
      return '';
    })
    .filter(Boolean)
    .join('');
}

// Send Claude delta message to WebSocket
function sendClaudeDelta(ws: WebSocket, sessionId: string, text: string): void {
  if (!text) return;
  ws.send(JSON.stringify({
    type: 'claude-response',
    sessionId,
    data: {
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text,
      },
    },
  }));
}

// Spawn a Pi command
export async function spawnPi(
  command: string,
  options: { sessionId?: string; projectPath?: string; cwd?: string; model?: string } = {},
  ws?: WebSocket
): Promise<{ output: string; sessionId: string }> {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, model } = options;
    let capturedSessionId = sessionId || Date.now().toString();

    const { command: piCommand, baseArgs } = await resolvePiCommand();

    const args = [...baseArgs];

    if (sessionId) {
      args.push('--resume=' + sessionId);
    }

    if (command && command.trim()) {
      args.push('-p', command);
      args.push('--output-format', 'stream-json');
    }

    if (model) {
      args.push('--model', model);
    }

    if (projectPath) {
      args.push('--project-path', projectPath);
    }

    // Load environment variables for this project
    let projectEnvVars: Record<string, string> = {};
    try {
      // Generate a project ID from the project path
      const projectId = (projectPath || '').replace(/[\\/]/g, '-').replace(/^-/, '');
      if (projectId) {
        projectEnvVars = environmentVariablesDb.getMergedEnvironmentVariables(projectId) || {};
        console.log('[INFO] Loaded environment variables for Pi project:', projectId, Object.keys(projectEnvVars).length, 'variables');
      }
    } catch (error) {
      console.error('[WARN] Failed to load environment variables for Pi:', error instanceof Error ? error.message : 'Unknown error');
    }

    const spawnOptions: SpawnOptions = {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...projectEnvVars }, // Inject environment variables
    };

    const piProcess = spawn(piCommand, args, spawnOptions);

    let output = '';
    let errorOutput = '';

    piProcess.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      if (ws) {
        ws.send(JSON.stringify({ type: 'output', data: chunk }));
      }
    });

    piProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    piProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve({ output, sessionId: capturedSessionId });
      } else {
        reject(new Error(`Pi process exited with code ${code}: ${errorOutput}`));
      }
    });

    piProcess.on('error', (error: Error) => {
      reject(error);
    });

    // Store active session
    activePiProcesses.set(capturedSessionId, {
      process: piProcess,
      sessionId: capturedSessionId,
      created: new Date(),
    });
  });
}

// Abort a Pi session
export function abortPiSession(sessionId: string): boolean {
  const session = activePiProcesses.get(sessionId);
  if (session) {
    session.process.kill();
    activePiProcesses.delete(sessionId);
    return true;
  }
  return false;
}

// Check if a session is active
export function isPiSessionActive(sessionId: string): boolean {
  return activePiProcesses.has(sessionId);
}

// Get active sessions
export function getActivePiSessions(): string[] {
  return Array.from(activePiProcesses.keys());
}

export {
  activePiProcesses,
  getDefaultPiTestScriptPath,
  resolvePiCommand,
  extractTextFromContent,
  sendClaudeDelta,
};