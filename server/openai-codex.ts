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

import { Codex, type CodexEvent } from '@openai/codex-sdk';
import type { WebSocket } from 'ws';

// Track active sessions
const activeCodexSessions = new Map<string, any>();

// Transform Codex SDK event to WebSocket message format
function transformCodexEvent(event: CodexEvent): { type: string; item?: any } {
  // Map SDK event types to a consistent format
  switch (event.type) {
    case 'item.started':
    case 'item.updated':
    case 'item.completed':
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
              content: item.text,
            },
          };

        case 'reasoning':
          return {
            type: 'item',
            itemType: 'reasoning',
            content: item.summary || [],
          };

        case 'function_call':
          return {
            type: 'item',
            itemType: 'function_call',
            functionCall: {
              name: item.name,
              arguments: item.arguments,
            },
          };

        default:
          return { type: event.type, item };
      }

    case 'response.created':
      return { type: 'response', id: event.response.id };

    case 'error':
      return { type: 'error', message: event.error.message };

    default:
      return { type: event.type };
  }
}

// Query Codex
export async function queryCodex(
  project: string,
  message: string,
  model?: string,
  ws?: WebSocket
): Promise<{ output: string; sessionId: string }> {
  const sessionId = Date.now().toString();
  
  const codex = new Codex({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await codex.chat.completions.create({
    model: model || 'gpt-4',
    messages: [
      { role: 'system', content: `Project: ${project}` },
      { role: 'user', content: message },
    ],
    stream: true,
  });

  let output = '';
  let accumulatedText = '';

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content || '';
    accumulatedText += content;
    output += content;

    // Send output to WebSocket if provided
    if (ws) {
      ws.send(JSON.stringify({ type: 'output', data: content }));
    }
  }

  activeCodexSessions.set(sessionId, {
    output,
    createdAt: new Date(),
  });

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

export {
  activeCodexSessions,
  transformCodexEvent,
  queryCodex,
  abortCodexSession,
  isCodexSessionActive,
  getActiveCodexSessions,
};