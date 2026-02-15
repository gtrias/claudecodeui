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
export const CLAUDE_PROJECTS_PATH = path.join(process.env.HOME || '', '.claude', 'projects');

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

    // First, check if projectName is a directory name directly
    const directPath = path.join(projectsPath, projectName);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
      projectDirectoryCache.set(projectName, directPath);
      lastCacheRefresh = now;
      return directPath;
    }

    // Otherwise, scan for config.json that matches
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

// Generate display name from directory name (e.g., "-home-genar-src-myproject" -> "myproject")
const generateDisplayName = (dirName: string): string => {
  // Directory names are paths with / replaced by -
  // e.g., "-home-genar-src-myproject" -> extract last part "myproject"
  const parts = dirName.split('-').filter(Boolean);
  return parts[parts.length - 1] || dirName;
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

      // Try to read config.json if it exists, otherwise use directory name
      const configPath = path.join(projectPath, 'config.json');
      let projectName = entry;
      let displayName = generateDisplayName(entry);

      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          projectName = config.project_name || entry;
          displayName = config.display_name || config.project_name || generateDisplayName(entry);
        } catch {
          // Use defaults if config is invalid
        }
      }

      // Always add the project (don't require config.json)
      projects.push({
        name: projectName,
        displayName: displayName,
        path: projectPath,
      });

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

// Generate a title from the first user message in a session
function generateSessionTitle(sessionPath: string): string {
  try {
    if (!fs.existsSync(sessionPath)) {
      return 'New Session';
    }

    const content = fs.readFileSync(sessionPath, 'utf8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.message && entry.message.role === 'user' && entry.message.content) {
          // Get first user message and truncate to reasonable length
          const title = entry.message.content
            .split('\n')[0]
            .trim()
            .substring(0, 60);
          return title.length === 60 ? title + '...' : title;
        }
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }
  } catch (error) {
    console.error('Error generating session title:', error instanceof Error ? error.message : 'Unknown error');
  }

  return 'New Session';
}

// Get sessions for a project
export const getSessions = async (
  projectName: string,
  limit: number = 5,
  offset: number = 0,
  includeArchived: boolean = false
): Promise<{ sessions: { id: string; createdAt: string; messages: number; title?: string; archived?: boolean }[]; total: number }> => {
  const sessions: { id: string; createdAt: string; messages: number; title?: string; archived?: boolean }[] = [];
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    return { sessions, total: 0 };
  }

  try {
    // Sessions are stored as .jsonl files in the project directory
    const sessionFiles = fs.readdirSync(projectDir)
      .filter(file => file.endsWith('.jsonl'));

    // Filter out archived sessions if not including them
    const activeSessions = includeArchived
      ? sessionFiles
      : sessionFiles.filter(file => !file.startsWith('archived-'));

    const total = activeSessions.length;

    const sortedFiles = activeSessions
      .map((file) => {
        const filePath = path.join(projectDir, file);
        const stat = fs.statSync(filePath);
        return { file, mtime: stat.mtime };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const paginatedFiles = sortedFiles.slice(offset, offset + limit);

    for (const item of paginatedFiles) {
      const sessionPath = path.join(projectDir, item.file);
      const sessionId = item.file.replace('.jsonl', '');
      const content = fs.readFileSync(sessionPath, 'utf8');
      const lines = content.trim().split('\n');
      const messageCount = lines.length;

      // Generate title from first user message
      const title = generateSessionTitle(sessionPath);
      const archived = item.file.startsWith('archived-');

      sessions.push({
        id: sessionId,
        createdAt: item.mtime.toISOString(),
        messages: messageCount,
        title,
        archived,
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

// Archive session (renames session file with archived- prefix instead of deleting)
export const archiveSession = async (projectName: string, sessionId: string): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    // Sessions are stored as .jsonl files in the project directory
    const sessionFile = `${sessionId}.jsonl`;
    const sessionPath = path.join(projectDir, sessionFile);

    if (!fs.existsSync(sessionPath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check if already archived
    if (sessionFile.startsWith('archived-')) {
      return; // Already archived
    }

    // Rename with archived- prefix instead of deleting
    const archivedFileName = `archived-${sessionFile}`;
    const archivedPath = path.join(projectDir, archivedFileName);

    // If archived version already exists, add timestamp
    let finalArchivedPath = archivedPath;
    if (fs.existsSync(archivedPath)) {
      const timestamp = Date.now();
      finalArchivedPath = path.join(projectDir, `archived-${timestamp}-${sessionFile}`);
    }

    fs.renameSync(sessionPath, finalArchivedPath);
  } catch (error) {
    console.error('Error archiving session:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Delete session (permanent deletion - use archiveSession instead)
export const deleteSession = async (projectName: string, sessionId: string): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    // Sessions are stored as .jsonl files in the project directory
    const sessionFile = `${sessionId}.jsonl`;
    const sessionPath = path.join(projectDir, sessionFile);

    if (!fs.existsSync(sessionPath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    fs.rmSync(sessionPath, { force: true });
  } catch (error) {
    console.error('Error deleting session:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// Unarchive session (restore from archived state)
export const unarchiveSession = async (projectName: string, sessionId: string): Promise<void> => {
  const projectDir = await extractProjectDirectory(projectName);

  if (!projectDir) {
    throw new Error(`Project not found: ${projectName}`);
  }

  try {
    // Find the archived session file
    const files = fs.readdirSync(projectDir);
    const archivedFile = files.find(f =>
      f === `archived-${sessionId}.jsonl` ||
      f.startsWith(`archived-${sessionId}.jsonl`)
    );

    if (!archivedFile) {
      throw new Error(`Archived session not found: ${sessionId}`);
    }

    const archivedPath = path.join(projectDir, archivedFile);
    const restoredFile = `${sessionId}.jsonl`;
    const restoredPath = path.join(projectDir, restoredFile);

    // If active session already exists, add timestamp
    let finalRestoredPath = restoredPath;
    if (fs.existsSync(restoredPath)) {
      const timestamp = Date.now();
      finalRestoredPath = path.join(projectDir, `${sessionId}-${timestamp}.jsonl`);
    }

    fs.renameSync(archivedPath, finalRestoredPath);
  } catch (error) {
    console.error('Error unarchiving session:', error instanceof Error ? error.message : 'Unknown error');
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