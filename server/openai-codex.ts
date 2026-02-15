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
import { environmentVariablesDb } from './database/db.js';

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

  // Load environment variables for this project
  let projectEnvVars: Record<string, string> = {};
  try {
    // Generate a project ID from the project path
    const projectId = project.replace(/[\\/]/g, '-').replace(/^-/, '');
    projectEnvVars = environmentVariablesDb.getMergedEnvironmentVariables(projectId) || {};
    console.log('[INFO] Loaded environment variables for Codex project:', projectId, Object.keys(projectEnvVars).length, 'variables');
  } catch (error) {
    console.error('[WARN] Failed to load environment variables for Codex:', error instanceof Error ? error.message : 'Unknown error');
  }

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
    env: projectEnvVars, // Pass environment variables to Codex SDK
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
    console.error('Error reading codex auth file:', error instanceof Error ? error.message : 'Unknown error');
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
    console.error('No authentication token available for OpenAI API');
    // Return cached models if available, even if expired
    if (modelsCache) {
      console.log('Using expired cache due to missing auth');
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
    console.error('Error fetching OpenAI models:', error instanceof Error ? error.message : 'Unknown error');

    // Return cached models if available, even if expired
    if (modelsCache) {
      console.log('Using expired cache due to API error');
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

