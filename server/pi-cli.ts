import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
// TODO: Environment variables are now in Convex - pass via WebSocket options

// Logger utility
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[PI-CLI] [INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[PI-CLI] [WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[PI-CLI] [ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.log(`[PI-CLI] [DEBUG] ${msg}`, ...args),
};

// WebSocket writer interface (matches what index.ts passes)
interface WebSocketWriter {
  send: (data: unknown) => void;
  setSessionId?: (sessionId: string) => void;
  getSessionId?: () => string | null;
}

// Type definitions
interface PiSession {
  process: ChildProcess;
  sessionId: string;
  created: Date;
  abortController?: AbortController;
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

interface PiOptions {
  sessionId?: string;
  projectPath?: string;
  cwd?: string;
  model?: string;
  provider?: string;
}

// Track active processes by session ID
const activePiProcesses = new Map<string, PiSession>();

// Get default Pi test script path
function getDefaultPiTestScriptPath(): string {
  return path.join(os.homedir(), 'src', 'pi-mono', 'pi-test.sh');
}

// Resolve Pi command to use
async function resolvePiCommand(): Promise<PiCommandResult> {
  const configured = process.env.PI_CLI_COMMAND?.trim();
  if (configured) {
    logger.info(`Using configured PI_CLI_COMMAND: ${configured}`);
    const parts = configured.split(/\s+/);
    return { command: parts[0], baseArgs: parts.slice(1) };
  }

  // Default to installed binary if present
  logger.info('Using default pi command');
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

// Parse a JSON line from Pi's stream-json output
function parseJsonLine(line: string): unknown | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('{')) return null;
  
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    logger.debug(`Failed to parse JSON line: ${trimmed.substring(0, 100)}...`);
    return null;
  }
}

// Transform Pi message format to Claude SDK format expected by frontend
function transformPiMessage(piMsg: unknown): unknown {
  if (!piMsg || typeof piMsg !== 'object') return piMsg;
  
  const msg = piMsg as Record<string, unknown>;
  
  // Handle message_update events - extract just the delta, not the full partial
  if (msg.type === 'message_update' && msg.assistantMessageEvent) {
    const event = msg.assistantMessageEvent as Record<string, unknown>;
    const eventType = event.type as string;
    
    // For text_delta events, create a simple content_block_delta
    if (eventType === 'text_delta' && event.delta) {
      return {
        type: 'content_block_delta',
        index: event.contentIndex || 0,
        delta: {
          type: 'text_delta',
          text: event.delta
        }
      };
    }
    
    // For thinking_delta events
    if (eventType === 'thinking_delta' && event.delta) {
      return {
        type: 'content_block_delta',
        index: event.contentIndex || 0,
        delta: {
          type: 'thinking_delta',
          thinking: event.delta
        }
      };
    }
    
    // For text_start, create content_block_start
    if (eventType === 'text_start') {
      return {
        type: 'content_block_start',
        index: event.contentIndex || 0,
        content_block: {
          type: 'text',
          text: ''
        }
      };
    }
    
    // For thinking_start
    if (eventType === 'thinking_start') {
      return {
        type: 'content_block_start',
        index: event.contentIndex || 0,
        content_block: {
          type: 'thinking',
          thinking: ''
        }
      };
    }
    
    // For text_end/thinking_end, create content_block_stop
    if (eventType === 'text_end' || eventType === 'thinking_end') {
      return {
        type: 'content_block_stop',
        index: event.contentIndex || 0
      };
    }
  }
  
  // Handle message_start - only for assistant messages, signals start of streaming
  if (msg.type === 'message_start' && msg.message) {
    const message = msg.message as Record<string, unknown>;
    // Skip user message_start - user input already displayed
    if (message.role === 'user') {
      return { type: 'pi_internal', subtype: 'user_message_start' };
    }
    // For assistant, signal message start (no content yet)
    return {
      type: 'message_start',
      message: {
        id: message.id || `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [], // Empty - content comes via deltas
        model: message.model || 'pi',
        stop_reason: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      }
    };
  }
  
  // Handle message_end - don't include content (it's already been streamed)
  if (msg.type === 'message_end') {
    const message = (msg.message || {}) as Record<string, unknown>;
    return {
      type: 'message_delta',
      delta: {
        stop_reason: (message.stopReason as string) || 'end_turn'
      },
      usage: message.usage
    };
  }
  
  // Handle turn_end - signals end of assistant turn, content already streamed
  if (msg.type === 'turn_end') {
    return {
      type: 'message_delta',
      delta: {
        stop_reason: 'end_turn'
      }
    };
  }
  
  // Handle agent_end - signals end of agent session, content already streamed  
  if (msg.type === 'agent_end') {
    return {
      type: 'message_delta',
      delta: {
        stop_reason: 'end_turn'
      }
    };
  }
  
  // Filter out messages that would duplicate content
  // These contain full accumulated text that's already been streamed via deltas
  const skipTypes = ['session', 'agent_start', 'turn_start'];
  if (skipTypes.includes(msg.type as string)) {
    return { type: 'pi_internal', subtype: msg.type }; // Internal message, frontend can ignore
  }
  
  // For user message_start/message_end, pass through but without content rendering
  if (msg.type === 'message_start' || msg.type === 'message_end') {
    const message = (msg.message || {}) as Record<string, unknown>;
    if (message.role === 'user') {
      return { type: 'pi_internal', subtype: 'user_message' }; // User messages already shown
    }
  }
  
  // Pass through other message types as-is (but log for debugging)
  logger.debug(`Passing through unhandled Pi message type: ${msg.type}`);
  return piMsg;
}

// Spawn a Pi command
export async function spawnPi(
  command: string,
  options: PiOptions = {},
  ws?: WebSocketWriter
): Promise<{ output: string; sessionId: string }> {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, model, provider } = options;
    let capturedSessionId = sessionId || `pi-${Date.now()}`;
    let sessionCreatedSent = false;

    logger.info('=== Starting Pi Session ===');
    logger.info(`Command: ${command}`);
    logger.info(`Session ID: ${capturedSessionId}`);
    logger.info(`Project Path: ${projectPath || 'not set'}`);
    logger.info(`CWD: ${cwd || 'not set'}`);
    logger.info(`Model: ${model || 'default'}`);
    logger.info(`Provider: ${provider || 'default'}`);
    logger.info(`WebSocket available: ${!!ws}`);

    const { command: piCommand, baseArgs } = await resolvePiCommand();
    logger.info(`Resolved command: ${piCommand} ${baseArgs.join(' ')}`);

    const args = [...baseArgs];

    // Only use --resume if we have an existing session
    if (sessionId) {
      args.push('--resume=' + sessionId);
      logger.info(`Resuming session: ${sessionId}`);
    }

    // Add the prompt if we have one
    if (command && command.trim()) {
      args.push('-p', command);
      args.push('--mode', 'json');
      logger.info('Using json output mode');
    }

    if (model) {
      args.push('--model', model);
    }

    if (provider) {
      args.push('--provider', provider);
    }

    // Load environment variables for this project
    // Environment variables are now stored in Convex - frontend should pass them via options.envVars
    const projectEnvVars: Record<string, string> = options?.envVars || {};
    if (Object.keys(projectEnvVars).length > 0) {
      logger.info(`Loaded ${Object.keys(projectEnvVars).length} environment variables from options`);
    }

    const workingDir = cwd || projectPath || process.cwd();
    logger.info(`Working directory: ${workingDir}`);

    const spawnOptions: SpawnOptions = {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...projectEnvVars },
    };

    logger.info(`Spawning: ${piCommand} ${args.join(' ')}`);
    
    let piProcess: ChildProcess;
    try {
      piProcess = spawn(piCommand, args, spawnOptions);
      logger.info(`Process spawned with PID: ${piProcess.pid}`);
    } catch (spawnError) {
      logger.error('Failed to spawn Pi process:', spawnError);
      if (ws) {
        ws.send({
          type: 'claude-error',
          error: `Failed to spawn Pi process: ${spawnError instanceof Error ? spawnError.message : 'Unknown error'}`,
          sessionId: capturedSessionId
        });
      }
      return reject(new Error(`Failed to spawn Pi: ${spawnError instanceof Error ? spawnError.message : 'Unknown error'}`));
    }

    let output = '';
    let errorOutput = '';
    let lineBuffer = '';

    // Send session created event
    if (ws && !sessionCreatedSent && !sessionId) {
      sessionCreatedSent = true;
      logger.info('Sending session-created event');
      ws.send({
        type: 'session-created',
        sessionId: capturedSessionId
      });
      if (ws.setSessionId) {
        ws.setSessionId(capturedSessionId);
      }
    }

    // Verify streams are available
    if (!piProcess.stdout || !piProcess.stderr) {
      logger.warn('Process streams not available');
    }

    // Add a timeout to check if process is stuck
    const stuckCheckTimeout = setTimeout(() => {
      logger.warn(`Process appears stuck after 30s - no stdout/stderr/exit events`);
      logger.warn(`Process still running: ${!piProcess.killed}, exitCode: ${piProcess.exitCode}`);
    }, 30000);

    // Stream event listeners for diagnostics (debug level)
    piProcess.stdout?.on('end', () => logger.debug('stdout END'));
    piProcess.stdout?.on('close', () => logger.debug('stdout CLOSE'));
    piProcess.stderr?.on('end', () => logger.debug('stderr END'));
    piProcess.stderr?.on('close', () => logger.debug('stderr CLOSE'));

    // Process stdout - handle stream-json format
    piProcess.stdout?.on('data', (data: Buffer) => {
      try {
        const chunk = data.toString();
        output += chunk;
        lineBuffer += chunk;
        logger.debug(`STDOUT chunk (${chunk.length} bytes)`);
      } catch (err) {
        logger.error(`Error in stdout handler: ${err}`);
      }

      // Process complete lines
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        logger.debug(`Processing line: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);

        const parsed = parseJsonLine(line);
        if (parsed && typeof parsed === 'object') {
          const msg = parsed as Record<string, unknown>;
          
          // Check for session_id in the message
          if (msg.session_id && typeof msg.session_id === 'string') {
            if (capturedSessionId !== msg.session_id) {
              logger.info(`Session ID updated: ${capturedSessionId} -> ${msg.session_id}`);
              capturedSessionId = msg.session_id;
              
              // Update session tracking
              if (activePiProcesses.has(capturedSessionId)) {
                const oldSession = activePiProcesses.get(capturedSessionId);
                if (oldSession) {
                  activePiProcesses.delete(capturedSessionId);
                }
              }
            }
          }

          // Forward the message to the frontend using claude-response format
          if (ws) {
            logger.debug(`Forwarding message type: ${msg.type || 'unknown'}`);
            
            // Transform Pi messages to match Claude SDK format expected by frontend
            const transformedData = transformPiMessage(parsed);
            ws.send({
              type: 'claude-response',
              data: transformedData,
              sessionId: capturedSessionId
            });
          }
        } else {
          // Plain text output - wrap in text delta
          if (ws && line.trim()) {
            logger.debug('Forwarding plain text as content_block_delta');
            ws.send({
              type: 'claude-response',
              data: {
                type: 'content_block_delta',
                delta: {
                  type: 'text_delta',
                  text: line + '\n'
                }
              },
              sessionId: capturedSessionId
            });
          }
        }
      }
    });

    // Process stderr
    piProcess.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      errorOutput += chunk;
      logger.info(`STDERR received (${chunk.length} bytes): ${chunk.substring(0, 500)}${chunk.length > 500 ? '...' : ''}`);

      // Forward stderr as error message
      if (ws) {
        ws.send({
          type: 'claude-response',
          data: {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: `[stderr] ${chunk}`
            }
          },
          sessionId: capturedSessionId
        });
      }
    });

    // Clear stuck check on any terminal event
    const clearStuckCheck = () => clearTimeout(stuckCheckTimeout);

    piProcess.on('spawn', () => logger.debug('Process spawned'));

    piProcess.on('exit', (code: number | null, signal: string | null) => {
      clearStuckCheck();
      logger.debug(`Process exit: code=${code}, signal=${signal}`);
    });

    piProcess.on('disconnect', () => logger.debug('Process disconnected'));

    piProcess.on('close', (code: number | null) => {
      clearStuckCheck();
      logger.info(`Pi process completed with code: ${code}`);
      
      // Process any remaining buffered content
      if (lineBuffer.trim() && ws) {
        const parsed = parseJsonLine(lineBuffer);
        if (parsed) {
          ws.send({
            type: 'claude-response',
            data: parsed,
            sessionId: capturedSessionId
          });
        }
      }

      // Remove from active processes
      activePiProcesses.delete(capturedSessionId);

      // Send completion event
      if (ws) {
        logger.info('Sending claude-complete event');
        ws.send({
          type: 'claude-complete',
          sessionId: capturedSessionId,
          exitCode: code || 0,
          isNewSession: !sessionId
        });
      }

      if (code === 0 || code === null) {
        logger.info('Session completed successfully');
        resolve({ output, sessionId: capturedSessionId });
      } else {
        logger.error(`Process exited with code ${code}: ${errorOutput}`);
        if (ws) {
          ws.send({
            type: 'claude-error',
            error: errorOutput || `Pi process exited with code ${code}`,
            sessionId: capturedSessionId
          });
        }
        reject(new Error(`Pi process exited with code ${code}: ${errorOutput}`));
      }
    });

    piProcess.on('error', (error: Error) => {
      logger.error('Process error:', error.message);
      activePiProcesses.delete(capturedSessionId);
      
      if (ws) {
        ws.send({
          type: 'claude-error',
          error: error.message,
          sessionId: capturedSessionId
        });
      }
      
      reject(error);
    });

    // Store active session
    activePiProcesses.set(capturedSessionId, {
      process: piProcess,
      sessionId: capturedSessionId,
      created: new Date(),
    });

    logger.debug(`Session ${capturedSessionId} added to active processes`);

    // Close stdin AFTER all event listeners are set up to signal no more input
    if (piProcess.stdin) {
      piProcess.stdin.end();
    }
  });
}

// Abort a Pi session
export function abortPiSession(sessionId: string): boolean {
  logger.info(`Attempting to abort session: ${sessionId}`);
  const session = activePiProcesses.get(sessionId);
  if (session) {
    logger.info(`Killing process for session: ${sessionId}`);
    session.process.kill('SIGTERM');
    activePiProcesses.delete(sessionId);
    return true;
  }
  logger.warn(`Session not found for abort: ${sessionId}`);
  return false;
}

// Check if a session is active
export function isPiSessionActive(sessionId: string): boolean {
  const isActive = activePiProcesses.has(sessionId);
  logger.debug(`Session ${sessionId} active: ${isActive}`);
  return isActive;
}

// Get active sessions
export function getActivePiSessions(): string[] {
  const sessions = Array.from(activePiProcesses.keys());
  logger.debug(`Active sessions: ${sessions.join(', ') || 'none'}`);
  return sessions;
}

export {
  activePiProcesses,
  getDefaultPiTestScriptPath,
  resolvePiCommand,
  extractTextFromContent,
  logger,
};
