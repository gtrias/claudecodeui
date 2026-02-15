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

import { query, type QueryOptions } from '@anthropic-ai/claude-agent-sdk';
// Used to mint unique approval request IDs when randomUUID is not available.
// This keeps parallel tool approvals from colliding; it does not add any crypto/security guarantees.
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CLAUDE_MODELS } from '../shared/modelConstants.js';
import { environmentVariablesDb } from './database/db.js';

// Session tracking: Map of session IDs to active query instances
const activeSessions = new Map<string, any>();
// In-memory registry of pending tool approvals keyed by requestId.
// This does not persist approvals or share across processes; it exists so the
// SDK can pause tool execution while the UI decides what to do.
const pendingToolApprovals = new Map<string, (decision: unknown) => void>();

// Default approval timeout kept under the SDK's 60s control timeout.
// This does not change SDK limits; it only defines how long we wait for the UI,
// introduced to avoid hanging the run when no decision arrives.
const TOOL_APPROVAL_TIMEOUT_MS = parseInt(process.env.CLAUDE_TOOL_APPROVAL_TIMEOUT_MS, 10) || 55000;

// Generate a stable request ID for UI approval flows.
// This does not encode tool details or get shown to users; it exists so the UI
// can respond to the correct pending request without collisions.
function createRequestId(): string {
  // if clause is used because randomUUID is not available in older Node.js versions
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

// Wait for a UI approval decision, honoring SDK cancellation.
// This does not auto-approve or auto-deny; it only resolves with UI input,
// and it cleans up the pending map to avoid leaks, introduced to prevent
// replying after the SDK cancels the control request.
function waitForToolApproval(requestId: string, options: { timeoutMs?: number; signal?: AbortSignal; onCancel?: (reason: string) => void } = {}): Promise<unknown> {
  const { timeoutMs = TOOL_APPROVAL_TIMEOUT_MS, signal, onCancel } = options;

  return new Promise(resolve => {
    let settled = false;

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

    // Timeout is local to this process; it does not override SDK timing.
    // It exists to prevent the UI prompt from lingering indefinitely.
    const timeout = setTimeout(() => {
      onCancel?.('timeout');
      finalize(null);
    }, timeoutMs);

    const abortHandler = () => {
      // If the SDK cancels the control request, stop waiting to avoid
      // replying after the process is no longer ready for writes.
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

    pendingToolApprovals.set(requestId, (decision: unknown) => {
      finalize(decision);
    });
  });
}

// Resolve a tool approval based on the requestId
export function resolveToolApproval(requestId: string, decision: unknown): boolean {
  const resolveFn = pendingToolApprovals.get(requestId);
  if (resolveFn) {
    resolveFn(decision);
    return true;
  }
  return false;
}

// Get active sessions
export function getActiveClaudeSDKSessions(): string[] {
  return Array.from(activeSessions.keys());
}

// Check if a session is active
export function isClaudeSDKSessionActive(sessionId: string): boolean {
  return activeSessions.has(sessionId);
}

// Abort a session
export function abortClaudeSDKSession(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.abort?.();
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
}

// Query Claude SDK
export async function queryClaudeSDK(
  project: string,
  message: string,
  model?: string,
  cwd?: string
): Promise<{ output: string; sessionId: string }> {
  const sessionId = createRequestId();

  // Load environment variables for this project
  let projectEnvVars: Record<string, string> = {};
  try {
    // Generate a project ID from the project path
    const projectId = project.replace(/[\\/]/g, '-').replace(/^-/, '');
    projectEnvVars = environmentVariablesDb.getMergedEnvironmentVariables(projectId) || {};
    console.log('[INFO] Loaded environment variables for Claude project:', projectId, Object.keys(projectEnvVars).length, 'variables');
  } catch (error) {
    console.error('[WARN] Failed to load environment variables for Claude:', error instanceof Error ? error.message : 'Unknown error');
  }

  const options: QueryOptions = {
    projectPath: project,
    message,
    model: model || CLAUDE_MODELS[0],
    cwd: cwd || process.cwd(),
    env: projectEnvVars, // Pass environment variables to SDK
  };

  const result = await query(options);

  activeSessions.set(sessionId, result);

  return {
    output: result.output || '',
    sessionId,
  };
}

export {
  activeSessions,
  pendingToolApprovals,
  TOOL_APPROVAL_TIMEOUT_MS,
  createRequestId,
  waitForToolApproval,
};