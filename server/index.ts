#!/usr/bin/env node
// Load environment variables before other imports execute
import './load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import mime from 'mime-types';
import type { Request, Response, NextFunction } from 'express';
import type { Server as HttpServer } from 'http';
import type { WebSocket } from 'ws';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

const c = {
  info: (text: string): string => `${colors.cyan}${text}${colors.reset}`,
  ok: (text: string): string => `${colors.green}${text}${colors.reset}`,
  warn: (text: string): string => `${colors.yellow}${text}${colors.reset}`,
  tip: (text: string): string => `${colors.blue}${text}${colors.reset}`,
  bright: (text: string): string => `${colors.bright}${text}${colors.reset}`,
  dim: (text: string): string => `${colors.dim}${text}${colors.reset}`,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File system watcher for projects folder
let projectsWatcher: any = null;
const connectedClients = new Set<WebSocket>();
let isGetProjectsRunning = false; // Flag to prevent reentrant calls

// Type definitions
interface ProjectInfo {
  name: string;
  displayName: string;
  path: string;
}

interface SessionInfo {
  id: string;
  createdAt: string;
  messages: number;
}

interface ProgressMessage {
  type: string;
  progress?: number;
  message?: string;
}

interface WebSocketMessage {
  type: string;
  data?: unknown;
  error?: string;
}

// Import server modules
import { getProjects, getSessions, getSessionMessages, renameProject, deleteSession, deleteProject, addProjectManually, extractProjectDirectory, clearProjectDirectoryCache } from './projects.js';
import { queryClaudeSDK, abortClaudeSDKSession, isClaudeSDKSessionActive, getActiveClaudeSDKSessions, resolveToolApproval } from './claude-sdk.js';
import { spawnCursor, abortCursorSession, isCursorSessionActive, getActiveCursorSessions } from './cursor-cli.js';
import { queryCodex, abortCodexSession, isCodexSessionActive, getActiveCodexSessions } from './openai-codex.js';
import { spawnPi, abortPiSession, isPiSessionActive, getActivePiSessions } from './pi-cli.js';
import gitRoutes from './routes/git.js';
import authRoutes from './routes/auth.js';
import mcpRoutes from './routes/mcp.js';
import cursorRoutes from './routes/cursor.js';
import taskmasterRoutes from './routes/taskmaster.js';
import mcpUtilsRoutes from './routes/mcp-utils.js';
import commandsRoutes from './routes/commands.js';
import settingsRoutes from './routes/settings.js';
import agentRoutes from './routes/agent.js';
import projectsRoutes, { WORKSPACES_ROOT, validateWorkspacePath } from './routes/projects.js';
import cliAuthRoutes from './routes/cli-auth.js';
import userRoutes from './routes/user.js';
import codexRoutes from './routes/codex.js';
import piRoutes from './routes/pi.js';
import { initializeDatabase } from './database/db.js';
import { validateApiKey, authenticateToken, authenticateWebSocket } from './middleware/auth.js';
import { IS_PLATFORM } from './constants/config.js';

// Broadcast progress to all connected WebSocket clients
function broadcastProgress(progress: ProgressMessage): void {
  const message = JSON.stringify({
    type: 'loading_progress',
    ...progress,
  });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Setup file system watcher for Claude projects folder using chokidar
async function setupProjectsWatcher(): Promise<void> {
  const chokidar = (await import('chokidar')).default;
  const claudeProjectsPath = path.join(process.env.HOME || '', '.claude', 'projects');

  if (projectsWatcher) {
    projectsWatcher.close();
  }

  try {
    // Initialize chokidar watcher with optimized settings
    projectsWatcher = chokidar.watch(claudeProjectsPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
      ],
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      depth: 1,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
      ignorePermissionErrors: false,
      atomic: true,
    });

    // Add event listeners
    projectsWatcher.on('add', (path: string) => {
      console.log(c.info(`Project added: ${path}`));
      clearProjectDirectoryCache();
    });

    projectsWatcher.on('unlink', (path: string) => {
      console.log(c.info(`Project removed: ${path}`));
      clearProjectDirectoryCache();
    });

    projectsWatcher.on('change', (path: string) => {
      console.log(c.info(`Project changed: ${path}`));
      clearProjectDirectoryCache();
    });

    projectsWatcher.on('error', (error: Error) => {
      console.error(c.warn(`Watcher error: ${error.message}`));
    });

    console.log(c.ok('Projects watcher initialized'));
  } catch (error) {
    console.error(c.warn(`Failed to setup projects watcher: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

// Clear project directory cache
function clearProjectDirectoryCache(): void {
  // Implementation will be added later
}

// Main server setup
async function startServer(): Promise<void> {
  const PORT = process.env.PORT || 3000;

  const app = express();
  const server = new (HttpServer as any)(app);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const projects = await getProjects();
      res.json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/projects/:name/sessions', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await getSessions(name, limit, offset);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/projects/rename', async (req: Request, res: Response) => {
    try {
      const { projectName, displayName } = req.body;
      await renameProject(projectName, displayName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/projects/:name', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      await deleteProject(name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Start WebSocket server
  const wss = new (WebSocket as any).Server({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    connectedClients.add(ws);

    ws.on('close', () => {
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error(c.warn(`WebSocket error: ${error.message}`));
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(c.warn(`Error: ${err.message}`));
    res.status(500).json({
      success: false,
      error: err.message,
    });
  });

  server.listen(PORT, () => {
    console.log(c.ok(`Server running on port ${PORT}`));
    console.log(c.info(`Environment: ${process.env.NODE_ENV || 'development'}`));
    console.log(c.info(`Platform: ${process.env.IS_PLATFORM || 'standalone'}`));
  });

  // Setup projects watcher
  await setupProjectsWatcher();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(c.warn(`Uncaught Exception: ${error.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(c.warn(`Unhandled Rejection: ${reason}`));
});

// Start server
startServer().catch((error) => {
  console.error(c.warn(`Failed to start server: ${error.message}`));
  process.exit(1);
});

export {
  startServer,
  setupProjectsWatcher,
  clearProjectDirectoryCache,
  broadcastProgress,
};