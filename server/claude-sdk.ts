/**
 * Claude SDK Integration - TypeScript Version
 *
 * This module provides SDK-based integration with Claude using the @anthropic-ai/claude-agent-sdk.
 * It mirrors the interface of claude-cli.js but uses the SDK internally for better performance
 * and maintainability.
 *
 * Key features:
 * - Direct SDK integration without child processes
 * - Session management with abort capability
 * - Options mapping between CLI and SDK formats
 * - WebSocket message streaming
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CLAUDE_MODELS } from '../shared/modelConstants.js';
import { environmentVariablesDb } from './database/db.js';

// Types
interface WebSocketWriter {
  send: (data: unknown) => void;
  setSessionId?: (sessionId: string) => void;
}

interface QueryOptions {
  sessionId?: string;
  projectPath?: string;
  cwd?: string;
  model?: string;
  resume?: boolean;
  permissionMode?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  toolsSettings?: {
    allowedTools?: string[];
    disallowedTools?: string[];
    skipPermissions?: boolean;
  };
  images?: string[];
  [key: string]: unknown;
}

interface SDKOptions {
  projectPath?: string;
  cwd?: string;
  model?: string;
  resume?: boolean;
  sessionId?: string;
  permissionMode?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  mcpServers?: unknown;
  env?: Record<string, string>;
  canUseTool?: (toolName: string, input: unknown, context?: { signal?: AbortSignal }) => Promise<{ behavior: string; updatedInput?: unknown; message?: string }>;
}

interface SessionData {
  queryInstance: AsyncIterable<unknown>;
  tempImagePaths: string[];
  tempDir: string | null;
  abort?: () => void;
}

// Session tracking
const activeSessions = new Map<string, SessionData>();
const pendingToolApprovals = new Map<string, (decision: unknown) => void>();

const TOOL_APPROVAL_TIMEOUT_MS = parseInt(process.env.CLAUDE_TOOL_APPROVAL_TIMEOUT_MS || '55000', 10);

function createRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

function waitForToolApproval(
  requestId: string,
  options: { timeoutMs?: number; signal?: AbortSignal; onCancel?: (reason: string) => void } = {}
): Promise<unknown> {
  const { timeoutMs = TOOL_APPROVAL_TIMEOUT_MS, signal, onCancel } = options;

  return new Promise(resolve => {
    let settled = false;
    let abortHandler: (() => void) | null = null;

    const finalize = (decision: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(decision);
    };

    const cleanup = () => {
      pendingToolApprovals.delete(requestId);
      clearTimeout(timeout);
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    const timeout = setTimeout(() => {
      onCancel?.('timeout');
      finalize(null);
    }, timeoutMs);

    abortHandler = () => {
      onCancel?.('cancelled');
      finalize({ cancelled: true });
    };

    if (signal) {
      if (signal.aborted) {
        onCancel?.('cancelled');
        finalize({ cancelled: true });
        return;
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    pendingToolApprovals.set(requestId, finalize);
  });
}

export function resolveToolApproval(requestId: string, decision: unknown): boolean {
  const resolveFn = pendingToolApprovals.get(requestId);
  if (resolveFn) {
    resolveFn(decision);
    return true;
  }
  return false;
}

export function getActiveClaudeSDKSessions(): string[] {
  return Array.from(activeSessions.keys());
}

export function isClaudeSDKSessionActive(sessionId: string): boolean {
  return activeSessions.has(sessionId);
}

export async function abortClaudeSDKSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.abort?.();
    activeSessions.delete(sessionId);
    // Clean up temp files
    await cleanupTempFiles(session.tempImagePaths, session.tempDir);
    return true;
  }
  return false;
}

function addSession(sessionId: string, queryInstance: AsyncIterable<unknown>, tempImagePaths: string[], tempDir: string | null): void {
  activeSessions.set(sessionId, {
    queryInstance,
    tempImagePaths,
    tempDir,
    abort: () => {
      // The SDK handles abort internally
    }
  });
}

function removeSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

async function cleanupTempFiles(tempImagePaths: string[], tempDir: string | null): Promise<void> {
  try {
    for (const filePath of tempImagePaths) {
      await fs.unlink(filePath).catch(() => {});
    }
    if (tempDir) {
      await fs.rmdir(tempDir).catch(() => {});
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

async function loadMcpConfig(cwd?: string): Promise<unknown | null> {
  try {
    const home = os.homedir();
    const configPath = path.join(home, '.claude', 'mcp_servers.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function mapCliOptionsToSDK(options: QueryOptions): SDKOptions {
  const sdkOptions: SDKOptions = {
    projectPath: options.projectPath || options.cwd,
    cwd: options.cwd,
    model: options.model || CLAUDE_MODELS[0],
    resume: options.resume,
    sessionId: options.sessionId,
    allowedTools: options.toolsSettings?.allowedTools || options.allowedTools || [],
    disallowedTools: options.toolsSettings?.disallowedTools || options.disallowedTools || [],
  };

  if (options.toolsSettings?.skipPermissions || options.permissionMode === 'bypassPermissions') {
    sdkOptions.permissionMode = 'bypassPermissions';
  }

  return sdkOptions;
}

function matchesToolPermission(entry: string, toolName: string, input: unknown): boolean {
  if (entry === toolName) return true;
  if (entry.endsWith(':*')) {
    const prefix = entry.slice(0, -2);
    return toolName.startsWith(prefix);
  }
  if (entry.includes('(') && entry.includes(')')) {
    const match = entry.match(/^(\w+)\((.+)\)$/);
    if (match) {
      const [, tool, pattern] = match;
      if (tool === toolName) {
        // Check if input matches pattern
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        if (pattern.endsWith('*')) {
          return inputStr.startsWith(pattern.slice(0, -1));
        }
        return inputStr === pattern;
      }
    }
  }
  return false;
}

function transformMessage(message: unknown): unknown {
  // Pass through messages as-is for now
  return message;
}

function extractTokenBudget(message: unknown): unknown | null {
  const msg = message as { modelUsage?: { inputTokens?: number; outputTokens?: number } };
  if (msg.modelUsage) {
    return {
      inputTokens: msg.modelUsage.inputTokens,
      outputTokens: msg.modelUsage.outputTokens,
    };
  }
  return null;
}

// Main query function - streams messages via WebSocket
export async function queryClaudeSDK(
  command: string,
  options: QueryOptions = {},
  ws: WebSocketWriter
): Promise<void> {
  const { sessionId } = options;
  let capturedSessionId = sessionId;
  let sessionCreatedSent = false;
  const tempImagePaths: string[] = [];
  let tempDir: string | null = null;

  try {
    // Map CLI options to SDK format
    const sdkOptions = mapCliOptionsToSDK(options);

    // Load environment variables for this project (merged with process.env to preserve PATH)
    try {
      const projectId = (options.projectPath || options.cwd || '').replace(/[\\/]/g, '-').replace(/^-/, '');
      if (projectId) {
        const projectEnvVars = environmentVariablesDb.getMergedEnvironmentVariables(projectId) || {};
        // IMPORTANT: Merge with process.env to preserve PATH and other system variables
        sdkOptions.env = { ...process.env, ...projectEnvVars } as Record<string, string>;
        console.log('[INFO] Loaded environment variables for Claude project:', projectId, Object.keys(projectEnvVars).length, 'variables');
      }
    } catch (error) {
      console.error('[WARN] Failed to load environment variables:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Load MCP configuration
    const mcpServers = await loadMcpConfig(options.cwd);
    if (mcpServers) {
      sdkOptions.mcpServers = mcpServers;
    }

    // Tool approval handler
    sdkOptions.canUseTool = async (toolName: string, input: unknown, context?: { signal?: AbortSignal }) => {
      if (sdkOptions.permissionMode === 'bypassPermissions') {
        return { behavior: 'allow', updatedInput: input };
      }

      const isDisallowed = (sdkOptions.disallowedTools || []).some(entry =>
        matchesToolPermission(entry, toolName, input)
      );
      if (isDisallowed) {
        return { behavior: 'deny', message: 'Tool disallowed by settings' };
      }

      const isAllowed = (sdkOptions.allowedTools || []).some(entry =>
        matchesToolPermission(entry, toolName, input)
      );
      if (isAllowed) {
        return { behavior: 'allow', updatedInput: input };
      }

      const requestId = createRequestId();
      ws.send({
        type: 'claude-permission-request',
        requestId,
        toolName,
        input,
        sessionId: capturedSessionId || sessionId || null
      });

      const decision = await waitForToolApproval(requestId, {
        signal: context?.signal,
        onCancel: (reason) => {
          ws.send({
            type: 'claude-permission-cancelled',
            requestId,
            reason,
            sessionId: capturedSessionId || sessionId || null
          });
        }
      }) as { cancelled?: boolean; allow?: boolean; updatedInput?: unknown; message?: string; rememberEntry?: string } | null;

      if (!decision) {
        return { behavior: 'deny', message: 'Permission request timed out' };
      }

      if (decision.cancelled) {
        return { behavior: 'deny', message: 'Permission request cancelled' };
      }

      if (decision.allow) {
        if (decision.rememberEntry && typeof decision.rememberEntry === 'string') {
          if (!sdkOptions.allowedTools?.includes(decision.rememberEntry)) {
            sdkOptions.allowedTools = sdkOptions.allowedTools || [];
            sdkOptions.allowedTools.push(decision.rememberEntry);
          }
          if (Array.isArray(sdkOptions.disallowedTools)) {
            sdkOptions.disallowedTools = sdkOptions.disallowedTools.filter(entry => entry !== decision.rememberEntry);
          }
        }
        return { behavior: 'allow', updatedInput: decision.updatedInput ?? input };
      }

      return { behavior: 'deny', message: decision.message ?? 'User denied tool use' };
    };

    // Create SDK query instance
    const queryInstance = query({
      prompt: command,
      options: sdkOptions as Parameters<typeof query>[0]['options']
    });

    // Track the query instance
    if (capturedSessionId) {
      addSession(capturedSessionId, queryInstance, tempImagePaths, tempDir);
    }

    // Process streaming messages
    console.log('Starting async generator loop for session:', capturedSessionId || 'NEW');
    for await (const message of queryInstance) {
      const msg = message as { session_id?: string; type?: string };
      
      // Capture session ID from first message
      if (msg.session_id && !capturedSessionId) {
        capturedSessionId = msg.session_id;
        addSession(capturedSessionId, queryInstance, tempImagePaths, tempDir);

        if (ws.setSessionId && typeof ws.setSessionId === 'function') {
          ws.setSessionId(capturedSessionId);
        }

        if (!sessionId && !sessionCreatedSent) {
          sessionCreatedSent = true;
          ws.send({
            type: 'session-created',
            sessionId: capturedSessionId
          });
        }
      }

      // Transform and send message
      const transformedMessage = transformMessage(message);
      ws.send({
        type: 'claude-response',
        data: transformedMessage,
        sessionId: capturedSessionId || sessionId || null
      });

      // Extract token budget
      if (msg.type === 'result') {
        const tokenBudget = extractTokenBudget(message);
        if (tokenBudget) {
          ws.send({
            type: 'token-budget',
            data: tokenBudget,
            sessionId: capturedSessionId || sessionId || null
          });
        }
      }
    }

    // Clean up
    if (capturedSessionId) {
      removeSession(capturedSessionId);
    }
    await cleanupTempFiles(tempImagePaths, tempDir);

    // Send completion
    console.log('Streaming complete, sending claude-complete event');
    ws.send({
      type: 'claude-complete',
      sessionId: capturedSessionId,
      exitCode: 0,
      isNewSession: !sessionId && !!command
    });

  } catch (error) {
    console.error('SDK query error:', error);

    if (capturedSessionId) {
      removeSession(capturedSessionId);
    }
    await cleanupTempFiles(tempImagePaths, tempDir);

    ws.send({
      type: 'claude-error',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: capturedSessionId || sessionId || null
    });

    throw error;
  }
}

export {
  activeSessions,
  pendingToolApprovals,
  TOOL_APPROVAL_TIMEOUT_MS,
  createRequestId,
  waitForToolApproval,
};
