/**
 * Project Management - TypeScript Version
 * Type-safe project operations for Claude Code UI
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import type { ProjectInfo, ApiResponse } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
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
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  ok: (text: string) => `${colors.green}${text}${colors.reset}`,
  warn: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  bright: (text: string) => `${colors.bright}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
};

// Claude projects path
const CLAUDE_PROJECTS_PATH = path.join(process.env.HOME || '', '.claude', 'projects');

// Cache for project directories
let projectDirectoryCache: Map<string, string> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL = 60000; // 1 minute

// Clear project directory cache
export const clearProjectDirectoryCache = (): void => {
  projectDirectoryCache.clear();
  lastCacheRefresh = 0;
};

// Extract project directory from Claude project name
export const extractProjectDirectory = async (projectName: string): Promise<string | null> => {
  const now = Date.now();
  if (projectDirectoryCache.has(projectName) && (now - lastCacheRefresh) < CACHE_TTL) {
    return projectDirectoryCache.get(projectName) || null;
  }

  try {
    const projectsPath = CLAUDE_PROJECTS_PATH;
    if (!fs.existsSync(projectsPath)) {
      return null;
    }

    const projects = fs.readdirSync(projectsPath);
    for (const dir of projects) {
      const projectDir = path.join(projectsPath, dir);
      const stat = fs.statSync(projectDir);
      if (!stat.isDirectory()) continue;

      const configPath = path.join(projectDir, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.project_name === projectName) {
            projectDirectoryCache.set(projectName, projectDir);
            lastCacheRefresh = now;
            return projectDir;
          }
        } catch {
          // Skip invalid config files
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting project directory:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

// Get all projects
export const getProjects = async (progressCallback?: (progress: { progress: number; message: string }) => void): Promise<ProjectInfo[]> => {
  const projects: ProjectInfo[] = [];
  const projectsPath = CLAUDE_PROJECTS_PATH;

  if (!fs.existsSync(projectsPath)) {
    return projects;
  }

  try {
    const entries = fs.readdirSync(projectsPath);
    const total = entries.length;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const projectPath = path.join(projectsPath, entry);
      const stat = fs.statSync(projectPath);

      if (!stat.isDirectory()) continue;

      const configPath = path.join(projectPath, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          projects.push({
            name: config.project_name || entry,
            displayName: config.display_name || config.project_name || entry,
            path: projectPath,
          });
        } catch {
          // Skip invalid config files
        }
      }

      if (progressCallback) {
        progressCallback({
          progress: Math.round(((i + 1) / total) * 100),
          message: `Scanning project ${i + 1}/${total}`,
        });
      }
    }

    // Sort by display name
    projects.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return projects;
  } catch (error) {
    console.error('Error getting projects:', error instanceof Error ? error.message : 'Unknown error');
    return projects;
  }
};

// Get sessions for a project
export const getSessions = async (
  projectName: string,
  limit: number = 5,
  offset: number = 0
): Promise<{ sessions: { id: string; createdAt: string; messages: number }[]; total: number }> => {
  const sessions: { id: string; createdAt: string; messages: number }[] = [];
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    return { sessions, total: 0 };
  }

  try {
    const sessionsPath = path.join(projectDir, 'sessions');
    if (!fs.existsSync(sessionsPath)) {
      return { sessions, total: 0 };
    }

    const sessionDirs = fs.readdirSync(sessionsPath);
    const total = sessionDirs.length;

    const sortedDirs = sessionDirs
      .map((dir) => {
        const sessionPath = path.join(sessionsPath, dir);
        const stat = fs.statSync(sessionPath);
        return { dir, mtime: stat.mtime };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const paginatedDirs = sortedDirs.slice(offset, offset + limit);

    for (const item of paginatedDirs) {
      const sessionPath = path.join(sessionsPath, item.dir);
      const messagesPath = path.join(sessionPath, 'messages.json');
      const messages = fs.existsSync(messagesPath) ? JSON.parse(fs.readFileSync(messagesPath, 'utf8')).length : 0;

      sessions.push({
        id: item.dir,
        createdAt: item.mtime.toISOString(),
        messages,
      });
    }

    return { sessions, total };
  } catch (error) {
    console.error('Error getting sessions:', error instanceof Error ? error.message : 'Unknown error');
    return { sessions, total: 0 };
  }
};

// Get session messages
export const getSessionMessages = async (
  projectName: string,
  sessionId: string,
  limit?: number,
  offset?: number
): Promise<{ messages: unknown[] } | unknown[]> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    return { messages: [] };
  }

  try {
    const sessionPath = path.join(projectDir, 'sessions', sessionId, 'messages.json');
    if (!fs.existsSync(sessionPath)) {
      return { messages: [] };
    }

    const messages = JSON.parse(fs.readFileSync(sessionPath, 'utf8')) as unknown[];

    if (limit !== undefined && offset !== undefined) {
      return {
        messages: messages.slice(offset, offset + limit),
        total: messages.length,
        limit,
        offset,
      };
    }

    return messages;
  } catch (error) {
    console.error('Error getting session messages:', error instanceof Error ? error.message : 'Unknown error');
    return { messages: [] };
  }
};

// Rename project
export const renameProject = async (projectName: string, displayName: string): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    const configPath = path.join(projectDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config not found for project: ${projectName}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.display_name = displayName;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Clear cache
    projectDirectoryCache.clear();
  } catch (error) {
    console.error('Error renaming project:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Delete session
export const deleteSession = async (projectName: string, sessionId: string): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    const sessionPath = path.join(projectDir, 'sessions', sessionId);
    if (!fs.existsSync(sessionPath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    fs.rmSync(sessionPath, { recursive: true, force: true });
  } catch (error) {
    console.error('Error deleting session:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Delete project
export const deleteProject = async (projectName: string, force: boolean = false): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    fs.rmSync(projectDir, { recursive: true, force });
    projectDirectoryCache.delete(projectName);
  } catch (error) {
    console.error('Error deleting project:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Add project manually
export const addProjectManually = async (projectPath: string): Promise<ProjectInfo> => {
  try {
    // Validate path exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Path does not exist: ${projectPath}`);
    }

    // Check if it's a valid project (has config.json)
    const configPath = path.join(projectPath, 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Not a valid Claude project: ${projectPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectName = config.project_name || path.basename(projectPath);

    // Add to cache
    projectDirectoryCache.set(projectName, projectPath);
    lastCacheRefresh = Date.now();

    return {
      name: projectName,
      displayName: config.display_name || projectName,
      path: projectPath,
    };
  } catch (error) {
    console.error('Error adding project manually:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Validate workspace path
export const validateWorkspacePath = async (pathToValidate: string): Promise<{ valid: boolean; resolvedPath?: string; error?: string }> => {
  try {
    const resolvedPath = path.resolve(pathToValidate);
    const stat = fs.statSync(resolvedPath);

    if (!stat.isDirectory()) {
      return { valid: false, error: 'Path is not a directory' };
    }

    return { valid: true, resolvedPath };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get file tree
export const getFileTree = async (
  dir: string,
  maxDepth: number = 10,
  currentDepth: number = 0,
  showHidden: boolean = false
): Promise<{ name: string; path: string; type: 'file' | 'directory' }[]> => {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const items: { name: string; path: string; type: 'file' | 'directory' }[] = [];

  try {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      if (!showHidden && entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        items.push({
          name: entry,
          path: fullPath,
          type: 'directory',
        });

        // Recursively get subdirectories (only for first level)
        if (currentDepth === 0) {
          const subItems = await getFileTree(fullPath, maxDepth, currentDepth + 1, showHidden);
          items.push(...subItems);
        }
      } else if (stat.isFile()) {
        items.push({
          name: entry,
          path: fullPath,
          type: 'file',
        });
      }
    }
  } catch (error) {
    console.error('Error getting file tree:', error instanceof Error ? error.message : 'Unknown error');
  }

  return items;
};

export {
  CLAUDE_PROJECTS_PATH,
  getProjects,
  getSessions,
  getSessionMessages,
  renameProject,
  deleteSession,
  deleteProject,
  addProjectManually,
  validateWorkspacePath,
  getFileTree,
  extractProjectDirectory,
  clearProjectDirectoryCache,
};
EOF