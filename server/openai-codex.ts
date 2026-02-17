/**
 * OpenAI Codex SDK Integration - TypeScript Version
 * =================================================
 *
 * This module provides integration with the OpenAI Codex SDK for non-interactive
 * chat sessions. It mirrors the pattern used in claude-sdk.js for consistency.
 *
 * ## Usage
 *
 * - queryCodex(command, options, ws) - Execute a prompt with streaming via WebSocket
 * - abortCodexSession(sessionId) - Cancel an active session
 * - isCodexSessionActive(sessionId) - Check if a session is running
 * - getActiveCodexSessions() - List all active sessions
 */

import { Codex, type ThreadEvent } from '@openai/codex-sdk';
import type { WebSocket } from 'ws';
// TODO: Environment variables are now in Convex - pass via WebSocket options
import { codexLogger as log } from './utils/logger.js';

// Track active sessions
const activeCodexSessions = new Map<string, any>();

// Transform Codex SDK ThreadEvent to WebSocket message format
function transformCodexEvent(event: ThreadEvent): Record<string, unknown> {
  // Map SDK event types to a consistent format for WebSocket clients
  switch (event.type) {
    case 'item.started':
    case 'item.updated':
    case 'item.completed': {
      const item = event.item;
      if (!item) {
        return { type: event.type, item: null };
      }

      // Transform based on item type
      switch (item.type) {
        case 'agent_message':
          return {
            type: 'item',
            itemType: 'agent_message',
            message: {
              role: 'assistant',
              content: (item as { text?: string }).text || '',
            },
          };

        case 'reasoning':
          return {
            type: 'item',
            itemType: 'reasoning',
            content: (item as { text?: string }).text || '',
          };

        case 'command_execution':
          return {
            type: 'item',
            itemType: 'command_execution',
            command: (item as { command?: string }).command || '',
            output: (item as { aggregated_output?: string }).aggregated_output || '',
          };

        case 'file_change':
          return {
            type: 'item',
            itemType: 'file_change',
            changes: (item as { changes?: unknown[] }).changes || [],
          };

        default:
          return { type: event.type, item };
      }
    }

    case 'thread.started':
      return { type: 'thread_started', threadId: event.thread_id };

    case 'turn.started':
      return { type: 'turn_started' };

    case 'turn.completed':
      return { type: 'turn_completed' };

    case 'turn.failed':
      return { type: 'turn_failed', error: event.error?.message || 'Unknown error' };

    case 'thread.error':
      return { type: 'error', message: event.error?.message || 'Unknown error' };

    default:
      return { type: (event as { type: string }).type };
  }
}

// Options interface matching ChatCommandRequest
interface CodexCommandOptions {
  projectPath?: string;
  sessionId?: string;
  resume?: boolean;
  cwd?: string;
  model?: string;
}

// WebSocket writer interface
interface WebSocketWriter {
  send: (data: unknown) => void;
}

// Query Codex using the Thread-based SDK API
export async function queryCodex(
  message: string,
  options: CodexCommandOptions,
  ws?: WebSocketWriter
): Promise<{ output: string; sessionId: string }> {
  log.separator('queryCodex called');
  log.info('Message: ' + (message?.substring(0, 100) + (message?.length > 100 ? '...' : '')));
  log.data('Options', options);
  log.debug('WebSocket provided: ' + !!ws);

  const sessionId = options.sessionId || Date.now().toString();
  const project = options.projectPath || options.cwd || process.cwd();
  const model = options.model;

  log.info(`Session: ${sessionId} | Project: ${project} | Model: ${model || 'gpt-4 (default)'}`);

  // Environment variables are now stored in Convex - frontend should pass them via options.envVars
  const projectEnvVars: Record<string, string> = (options as any)?.envVars || {};
  if (Object.keys(projectEnvVars).length > 0) {
    log.debug(`Loaded ${Object.keys(projectEnvVars).length} environment variables from options`);
  }

  // Create abort controller for this session
  const abortController = new AbortController();

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  log.debug(`OPENAI_API_KEY present: ${!!apiKey} (length: ${apiKey?.length || 0})`);

  // Initialize Codex SDK with environment variables
  log.debug('Creating Codex instance...');
  const codex = new Codex({
    apiKey: apiKey,
    env: Object.keys(projectEnvVars).length > 0 ? projectEnvVars : undefined,
  });
  log.debug('Codex instance created');

  // Start a new thread with the project as working directory
  const threadConfig = {
    model: model || 'gpt-4',
    workingDirectory: project,
    sandboxMode: 'workspace-write' as const,
  };
  log.debug('Starting thread with config:', threadConfig);
  const thread = codex.startThread(threadConfig);
  log.info(`Thread created, ID: ${thread.id}`);

  // Store the session with abort capability
  activeCodexSessions.set(sessionId, {
    thread,
    abortController,
    createdAt: new Date(),
  });

  let output = '';
  let eventCount = 0;

  // Helper to send codex-response messages in the format the UI expects
  const sendCodexResponse = (data: Record<string, unknown>) => {
    if (ws) {
      const message = {
        type: 'codex-response',
        data,
        sessionId,
      };
      log.debug('Sending codex-response: ' + JSON.stringify(message).substring(0, 200));
      ws.send(message);
    }
  };

  try {
    // Send session-created as a TOP-LEVEL message (not wrapped in codex-response)
    // This is required for frontend session tracking
    if (ws) {
      log.info(`Sending session-created with sessionId: ${sessionId}`);
      ws.send({
        type: 'session-created',
        sessionId,
      });
    }

    // Use streaming API for real-time updates
    log.debug('Calling thread.runStreamed()...');
    const streamedResult = await thread.runStreamed(message, {
      signal: abortController.signal,
    });
    log.debug(`runStreamed() returned (type: ${typeof streamedResult})`);

    // Process events from the stream
    log.debug('Starting to iterate over events...');
    for await (const event of streamedResult.events) {
      eventCount++;
      log.debug(`Event #${eventCount}: ${event.type}`);
      log.data(`Event #${eventCount} details`, event);

      // Handle different event types and send in the format UI expects
      if (event.type === 'item.completed' || event.type === 'item.updated') {
        const item = event.item;
        if (!item) continue;

        switch (item.type) {
          case 'agent_message': {
            const text = (item as { text?: string }).text || '';
            log.debug(`Agent message (${text.length} chars)`);
            
            if (event.type === 'item.completed') {
              output += text;
            }
            
            // Send in format UI expects: { type: 'item', itemType: 'agent_message', message: { content: '...' } }
            sendCodexResponse({
              type: 'item',
              itemType: 'agent_message',
              message: {
                role: 'assistant',
                content: text,
              },
            });
            break;
          }

          case 'reasoning': {
            const text = (item as { text?: string }).text || '';
            log.debug(`Reasoning (${text.length} chars)`);
            
            // Send reasoning as thinking content
            sendCodexResponse({
              type: 'item',
              itemType: 'reasoning',
              message: {
                content: text,
              },
            });
            break;
          }

          case 'command_execution': {
            const cmd = item as { command?: string; aggregated_output?: string; status?: string; exit_code?: number };
            log.info(`Command: ${cmd.command?.substring(0, 80)}${(cmd.command?.length || 0) > 80 ? '...' : ''}`);
            
            sendCodexResponse({
              type: 'item',
              itemType: 'command_execution',
              command: cmd.command || '',
              output: cmd.aggregated_output || '',
              status: cmd.status,
              exitCode: cmd.exit_code,
            });
            break;
          }

          case 'file_change': {
            const changes = (item as { changes?: unknown[] }).changes || [];
            log.info(`File changes: ${changes.length} files`);
            
            sendCodexResponse({
              type: 'item',
              itemType: 'file_change',
              changes,
            });
            break;
          }

          default:
            log.warn(`Unknown item type: ${item.type}`);
        }
      } else if (event.type === 'turn.completed') {
        log.success('Turn completed');
        sendCodexResponse({ type: 'turn_completed' });
      } else if (event.type === 'turn.failed') {
        const error = (event as { error?: { message?: string } }).error;
        log.error(`Turn failed: ${error?.message}`);
        sendCodexResponse({ type: 'error', message: error?.message || 'Unknown error' });
      } else if (event.type === 'thread.error') {
        const error = (event as { error?: { message?: string } }).error;
        log.error(`Thread error: ${error?.message}`);
        sendCodexResponse({ type: 'error', message: error?.message || 'Unknown error' });
      }
    }
    log.info(`Finished processing ${eventCount} events`);
    
    // Send completion message as TOP-LEVEL type (not wrapped in codex-response)
    if (ws) {
      log.success('Sending codex-complete message');
      ws.send({
        type: 'codex-complete',
        sessionId,
        exitCode: 0,
      });
    }
  } catch (error) {
    log.error('Error during streaming:', error);
    log.error(`Error details: ${(error as Error).name} - ${(error as Error).message}`);
    
    // Send error to client
    sendCodexResponse({ type: 'error', message: (error as Error).message || 'Unknown error' });
    
    if ((error as Error).name === 'AbortError') {
      log.warn(`Session ${sessionId} was aborted`);
    } else {
      throw error;
    }
  }

  log.debug(`Final output: ${output.length} chars`);

  // Update session with final output
  activeCodexSessions.set(sessionId, {
    output,
    createdAt: new Date(),
  });

  log.separator('queryCodex complete');
  return {
    output,
    sessionId,
  };
}

// Abort a Codex session
export function abortCodexSession(sessionId: string): boolean {
  const session = activeCodexSessions.get(sessionId);
  if (session) {
    session.abort?.();
    activeCodexSessions.delete(sessionId);
    return true;
  }
  return false;
}

// Check if a session is active
export function isCodexSessionActive(sessionId: string): boolean {
  return activeCodexSessions.has(sessionId);
}

// Get active sessions
export function getActiveCodexSessions(): string[] {
  return Array.from(activeCodexSessions.keys());
}

// Cache for models list with TTL
interface CachedModels {
  models: string[];
  timestamp: number;
}

let modelsCache: CachedModels | null = null;
const MODELS_CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MODELS_API_URL = 'https://api.openai.com/v1/models';

/**
 * Get OAuth token from codex auth file
 * Codex CLI stores OAuth credentials in ~/.codex/auth.json
 */
async function getCodexOAuthToken(): Promise<string | null> {
  try {
    const os = await import('os');
    const fs = await import('fs/promises');
    const path = await import('path');

    const authFilePath = path.join(os.homedir(), '.codex', 'auth.json');

    const authContent = await fs.readFile(authFilePath, 'utf-8');
    const auth = JSON.parse(authContent);

    // Use the access_token from OAuth credentials
    if (auth.tokens?.access_token) {
      return auth.tokens.access_token;
    }

    // Fallback to OPENAI_API_KEY if available
    if (auth.OPENAI_API_KEY) {
      return auth.OPENAI_API_KEY;
    }

    return null;
  } catch (error) {
    log.warn('Error reading codex auth file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return null;
  }
}

/**
 * Fetch available models from OpenAI API
 * Uses in-memory cache with 1-hour TTL to avoid excessive API calls
 * Supports both API key and OAuth authentication
 */
export async function fetchOpenAIModels(): Promise<string[]> {
  // Check cache first
  if (modelsCache && Date.now() - modelsCache.timestamp < MODELS_CACHE_TTL) {
    return modelsCache.models;
  }

  let authToken: string | null = null;

  // Try to get OAuth token from codex auth file first
  authToken = await getCodexOAuthToken();

  // Fallback to environment variable if codex auth fails
  if (!authToken && process.env.OPENAI_API_KEY) {
    authToken = process.env.OPENAI_API_KEY;
  }

  if (!authToken) {
    log.warn('No authentication token available for OpenAI API');
    // Return cached models if available, even if expired
    if (modelsCache) {
      log.debug('Using expired cache due to missing auth');
      return modelsCache.models;
    }
    return [];
  }

  try {
    const response = await fetch(MODELS_API_URL, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data
      .map((model: any) => model.id)
      .filter((id: string) => id && typeof id === 'string')
      .sort((a: string, b: string) => a.localeCompare(b));

    // Update cache
    modelsCache = {
      models,
      timestamp: Date.now(),
    };

    return models;
  } catch (error) {
    log.error('Error fetching OpenAI models: ' + (error instanceof Error ? error.message : 'Unknown error'));

    // Return cached models if available, even if expired
    if (modelsCache) {
      log.debug('Using expired cache due to API error');
      return modelsCache.models;
    }

    // Return empty array if no cache and API fails
    return [];
  }
}

/**
 * Clear the models cache (useful for testing or forcing refresh)
 */
export function clearModelsCache(): void {
  modelsCache = null;
}

