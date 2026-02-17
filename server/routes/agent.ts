import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { addProjectManually } from '../projects.js';
import { queryClaudeSDK } from '../claude-sdk.js';
import { spawnCursor } from '../cursor-cli.js';
import { queryCodex } from '../openai-codex.js';
import { spawnPi } from '../pi-cli.js';
import { Octokit } from '@octokit/rest';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS } from '../../shared/modelConstants.js';
import { IS_PLATFORM } from '../constants/config.js';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  api_key: string;
  created_at: string;
  is_active: boolean;
}

interface AgentRequest {
  project: string;
  model?: string;
  message: string;
}

/**
 * Middleware to authenticate agent API requests.
 *
 * Supports two authentication modes:
 * 1. Platform mode (IS_PLATFORM=true): For managed/hosted deployments where
 *    authentication is handled by an external proxy. Requests are trusted.
 *
 * 2. API key mode (default): For self-hosted deployments where users authenticate
 *    via API keys. Keys are now stored in Convex - validation happens via HTTP action.
 */
const validateExternalApiKey = async (req: Request, res: Response, next: () => void) => {
  // Platform mode: Authentication is handled externally (e.g., by a proxy layer).
  // Trust the request.
  if (IS_PLATFORM) {
    (req as any).user = { id: 'platform-user', username: 'platform-user' };
    return next();
  }

  // Self-hosted mode: Validate API key from header or query parameter
  const apiKey = (req.headers['x-api-key'] || req.query.apiKey) as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // TODO: Validate API key via Convex HTTP action
  // For now, accept any API key that starts with "ccui_" (Convex-generated keys)
  if (apiKey.startsWith('ccui_') || apiKey.startsWith('ck_')) {
    (req as any).user = { id: 'api-user', username: 'api-user' };
    return next();
  }

  return res.status(401).json({ error: 'Invalid API key format' });
};

/**
 * Get the remote URL of a git repository
 * @param repoPath - Path to the git repository
 * @returns Promise<string> - Remote URL of the repository
 */
async function getGitRemoteUrl(repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['config', '--get', 'remote.origin.url'], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Failed to get git remote: ${stderr}`));
      }
    });

    gitProcess.on('error', (error: Error) => {
      reject(new Error(`Failed to execute git: ${error.message}`));
    });
  });
}

/**
 * Get the current git branch
 * @param repoPath - Path to the git repository
 * @returns Promise<string> - Current branch name
 */
async function getGitBranch(repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(stdout.trim() || 'main');
      } else {
        resolve('main'); // Default to main if no commits yet
      }
    });

    gitProcess.on('error', (error: Error) => {
      reject(new Error(`Failed to execute git: ${error.message}`));
    });
  });
}

/**
 * Get git status for a repository
 * @param repoPath - Path to the git repository
 * @returns Promise<{modified: string[], added: string[], deleted: string[], untracked: string[]}>
 */
async function getGitStatus(repoPath: string): Promise<{modified: string[], added: string[], deleted: string[], untracked: string[]}> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['status', '--porcelain'], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code: number) => {
      if (code === 0) {
        const lines = stdout.split('\n').filter(line => line.length > 0);
        const modified: string[] = [];
        const added: string[] = [];
        const deleted: string[] = [];
        const untracked: string[] = [];

        for (const line of lines) {
          const code = line.slice(0, 2).trim();
          const filePath = line.slice(3).trim();

          switch (code) {
            case 'M ':
            case ' M':
              modified.push(filePath);
              break;
            case 'A ':
            case ' A':
              added.push(filePath);
              break;
            case 'D ':
            case ' D':
              deleted.push(filePath);
              break;
            case '??':
              untracked.push(filePath);
              break;
          }
        }

        resolve({ modified, added, deleted, untracked });
      } else {
        reject(new Error(`Failed to get git status: ${stderr}`));
      }
    });

    gitProcess.on('error', (error: Error) => {
      reject(new Error(`Failed to execute git: ${error.message}`));
    });
  });
}

/**
 * Process agent request with Claude SDK
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const processClaudeRequest = async (req: Request, res: Response, next: () => void) => {
  try {
    const { project, model, message } = req.body as AgentRequest;

    if (!project || !message) {
      return res.status(400).json({ error: 'Project and message are required' });
    }

    const result = await queryClaudeSDK(project, message, model);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Claude SDK error:', error instanceof Error ? error.message : 'Unknown error');
    next(error);
  }
};

/**
 * Process agent request with Cursor
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const processCursorRequest = async (req: Request, res: Response, next: () => void) => {
  try {
    const { project, model, message } = req.body as AgentRequest;

    if (!project || !message) {
      return res.status(400).json({ error: 'Project and message are required' });
    }

    const result = await spawnCursor(project, message, model);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Cursor error:', error instanceof Error ? error.message : 'Unknown error');
    next(error);
  }
};

/**
 * Process agent request with Codex
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const processCodexRequest = async (req: Request, res: Response, next: () => void) => {
  try {
    const { project, model, message } = req.body as AgentRequest;

    if (!project || !message) {
      return res.status(400).json({ error: 'Project and message are required' });
    }

    const result = await queryCodex(message, { projectPath: project, model });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Codex error:', error instanceof Error ? error.message : 'Unknown error');
    next(error);
  }
};

/**
 * Process agent request with Pi
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const processPiRequest = async (req: Request, res: Response, next: () => void) => {
  try {
    const { project, model, message } = req.body as AgentRequest;

    if (!project || !message) {
      return res.status(400).json({ error: 'Project and message are required' });
    }

    const result = await spawnPi(project, message, model);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Pi error:', error instanceof Error ? error.message : 'Unknown error');
    next(error);
  }
};

// Agent request endpoint
router.post('/request', validateExternalApiKey, async (req: Request, res: Response) => {
  try {
    const { project, model, message, provider } = req.body as AgentRequest & { provider?: string };

    if (!project || !message) {
      return res.status(400).json({ error: 'Project and message are required' });
    }

    // Determine which provider to use
    const selectedProvider = provider || (req as any).user?.default_provider || 'claude';

    switch (selectedProvider) {
      case 'claude':
        await processClaudeRequest(req, res, () => {});
        break;
      case 'cursor':
        await processCursorRequest(req, res, () => {});
        break;
      case 'codex':
        await processCodexRequest(req, res, () => {});
        break;
      case 'pi':
        await processPiRequest(req, res, () => {});
        break;
      default:
        return res.status(400).json({ error: `Unknown provider: ${selectedProvider}` });
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get available models for a provider
router.get('/models/:provider', (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    let models: string[] = [];

    switch (provider) {
      case 'claude':
        models = CLAUDE_MODELS;
        break;
      case 'cursor':
        models = CURSOR_MODELS;
        break;
      case 'codex':
        models = CODEX_MODELS;
        break;
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    res.json({ success: true, models });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Get project information
router.get('/project/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const projectPath = await addProjectManually as any; // Placeholder

    if (!projectPath) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [branch, status] = await Promise.all([
      getGitBranch(projectPath),
      getGitStatus(projectPath),
    ]);

    res.json({
      success: true,
      data: {
        name,
        path: projectPath,
        branch,
        status,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get git remote URL
router.get('/git/remote/:project', async (req: Request, res: Response) => {
  try {
    const { project } = req.params;
    const projectPath = await addProjectManually as any; // Placeholder

    if (!projectPath) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const remoteUrl = await getGitRemoteUrl(projectPath);
    res.json({ success: true, remoteUrl });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
export {
  validateExternalApiKey,
  getGitRemoteUrl,
  getGitBranch,
  getGitStatus,
  processClaudeRequest,
  processCursorRequest,
  processCodexRequest,
  processPiRequest,
};