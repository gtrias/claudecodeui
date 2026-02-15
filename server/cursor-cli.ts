import { spawn, SpawnOptions } from 'child_process';
import crossSpawn from 'cross-spawn';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { WebSocket } from 'ws';
import { environmentVariablesDb } from './database/db.js';

// Use cross-spawn on Windows for better command execution
const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;

// Type definitions
interface CursorOptions {
  sessionId?: string;
  projectPath?: string;
  cwd?: string;
  resume?: boolean;
  toolsSettings?: {
    allowedShellCommands: string[];
    skipPermissions: boolean;
  };
  skipPermissions?: boolean;
  model?: string;
  images?: string[];
}

interface CursorSession {
  process: any;
  sessionId: string;
  created: Date;
}

// Track active processes by session ID
let activeCursorProcesses = new Map<string, CursorSession>();

// Spawn a Cursor command
export async function spawnCursor(
  command: string,
  options: CursorOptions = {},
  ws?: WebSocket
): Promise<{ output: string; sessionId: string }> {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, resume, toolsSettings, skipPermissions, model, images } = options;
    let capturedSessionId = sessionId; // Track session ID throughout the process
    let sessionCreatedSent = false; // Track if we've already sent session-created event
    let messageBuffer = ''; // Buffer for accumulating assistant messages
    
    // Use tools settings passed from frontend, or defaults
    const settings = toolsSettings || {
      allowedShellCommands: [],
      skipPermissions: false
    };
    
    // Build Cursor CLI command
    const args: string[] = [];
    
    // Build flags allowing both resume and prompt together (reply in existing session)
    // Treat presence of sessionId as intention to resume, regardless of resume flag
    if (sessionId) {
      args.push('--resume=' + sessionId);
    }

    if (command && command.trim()) {
      // Provide a prompt (works for both new and resumed sessions)
      args.push('-p', command);

      // Add model flag if specified (only meaningful for new sessions; harmless on resume)
      if (!sessionId && model) {
        args.push('--model', model);
      }

      // Request streaming JSON when we are providing a prompt
      args.push('--output-format', 'stream-json');
    }
    
    // Add skip permissions flag if enabled
    if (skipPermissions || settings.skipPermissions) {
      args.push('-f');
      console.log('⚠️  Using -f flag (skip permissions)');
    }

    // Add project path if specified
    if (projectPath) {
      args.push('--project-path', projectPath);
    }

    // Add images if specified
    if (images && images.length > 0) {
      for (const image of images) {
        args.push('--image', image);
      }
    }

    // Load environment variables for this project
    let projectEnvVars: Record<string, string> = {};
    try {
      // Generate a project ID from the project path
      const projectId = (projectPath || '').replace(/[\\/]/g, '-').replace(/^-/, '');
      if (projectId) {
        projectEnvVars = environmentVariablesDb.getMergedEnvironmentVariables(projectId) || {};
        console.log('[INFO] Loaded environment variables for Cursor project:', projectId, Object.keys(projectEnvVars).length, 'variables');
      }
    } catch (error) {
      console.error('[WARN] Failed to load environment variables for Cursor:', error instanceof Error ? error.message : 'Unknown error');
    }

    const spawnOptions: SpawnOptions = {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...projectEnvVars }, // Inject environment variables
    };

    const cursorProcess = spawnFunction('cursor', args, spawnOptions);

    let output = '';
    let errorOutput = '';

    cursorProcess.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      
      // Send output to WebSocket if provided
      if (ws) {
        ws.send(JSON.stringify({ type: 'output', data: chunk }));
      }
    });

    cursorProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    cursorProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve({ output, sessionId: capturedSessionId || Date.now().toString() });
      } else {
        reject(new Error(`Cursor process exited with code ${code}: ${errorOutput}`));
      }
    });

    cursorProcess.on('error', (error: Error) => {
      reject(error);
    });

    // Store active session
    if (!sessionId) {
      capturedSessionId = Date.now().toString();
      activeCursorProcesses.set(capturedSessionId, {
        process: cursorProcess,
        sessionId: capturedSessionId,
        created: new Date(),
      });
    }
  });
}

// Abort a Cursor session
export function abortCursorSession(sessionId: string): boolean {
  const session = activeCursorProcesses.get(sessionId);
  if (session) {
    session.process.kill();
    activeCursorProcesses.delete(sessionId);
    return true;
  }
  return false;
}

// Check if a session is active
export function isCursorSessionActive(sessionId: string): boolean {
  return activeCursorProcesses.has(sessionId);
}

// Get active sessions
export function getActiveCursorSessions(): string[] {
  return Array.from(activeCursorProcesses.keys());
}

export { activeCursorProcesses };