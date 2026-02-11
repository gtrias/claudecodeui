import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import { addProjectManually } from '../projects.js';
import type { Request, Response } from 'express';

const router = express.Router();

function sanitizeGitError(message: string, token: string): string {
  if (!message || !token) return message;
  return message.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '***');
}

// Configure allowed workspace root (defaults to user's home directory)
export const WORKSPACES_ROOT = process.env.WORKSPACES_ROOT || os.homedir();

// System-critical paths that should never be used as workspace directories
export const FORBIDDEN_PATHS = [
  // Unix
  '/',
  '/etc',
  '/bin',
  '/sbin',
  '/usr',
  '/dev',
  '/proc',
  '/sys',
  '/var',
  '/boot',
  '/root',
  '/lib',
  '/lib64',
  '/opt',
  '/tmp',
  '/run',
  // Windows
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\System Volume Information',
  'C:\\$Recycle.Bin'
];

/**
 * Validates that a path is safe for workspace operations
 * @param requestedPath - The path to validate
 * @returns Promise<{valid: boolean, resolvedPath?: string, error?: string}>
 */
export async function validateWorkspacePath(requestedPath: string): Promise<{valid: boolean, resolvedPath?: string, error?: string}> {
  try {
    // Resolve to absolute path
    let absolutePath = path.resolve(requestedPath);

    // Check if path is a forbidden system directory
    const normalizedPath = path.normalize(absolutePath);
    if (FORBIDDEN_PATHS.includes(normalizedPath) || normalizedPath === '/') {
      return {
        valid: false,
        error: 'Cannot use system-critical directories as workspace locations'
      };
    }

    // Additional check for paths starting with forbidden directories
    for (const forbidden of FORBIDDEN_PATHS) {
      if (normalizedPath === forbidden ||
          normalizedPath.startsWith(forbidden + path.sep)) {
        // Exception: /var/tmp and similar user-accessible paths might be allowed
        // but /var itself and most /var subdirectories should be blocked
        if (forbidden === '/var' &&
            (normalizedPath.startsWith('/var/tmp') ||
             normalizedPath.startsWith('/var/folders'))) {
          continue; // Allow these specific cases
        }

        return {
          valid: false,
          error: `Cannot create workspace in system directory: ${forbidden}`
        };
      }
    }

    // Try to resolve the real path (following symlinks)
    let realPath: string;
    try {
      // Check if path exists to resolve real path
      await fs.access(absolutePath);
      realPath = await fs.realpath(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Path doesn't exist yet - check parent directory
        let parentPath = path.dirname(absolutePath);
        try {
          const parentRealPath = await fs.realpath(parentPath);

          // Reconstruct the full path with real parent
          realPath = path.join(parentRealPath, path.basename(absolutePath));
        } catch (parentError) {
          if ((parentError as NodeJS.ErrnoException).code === 'ENOENT') {
            // Parent directory doesn't exist either
            return {
              valid: false,
              error: 'Parent directory does not exist'
            };
          }
          throw parentError;
        }
      } else {
        throw error;
      }
    }

    // Check if path is under WORKSPACES_ROOT
    const normalizedWorkspacesRoot = path.normalize(WORKSPACES_ROOT);
    const normalizedRealPath = path.normalize(realPath);

    if (!normalizedRealPath.startsWith(normalizedWorkspacesRoot + path.sep) &&
        normalizedRealPath !== normalizedWorkspacesRoot) {
      return {
        valid: false,
        error: `Workspace must be inside: ${WORKSPACES_ROOT}`
      };
    }

    return {
      valid: true,
      resolvedPath: realPath
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    // Import and use the getProjects function from projects.js
    const { getProjects } = await import('../projects.js');
    const projects = await getProjects();
    // Return projects array directly (frontend expects this format)
    res.json(projects);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Add project manually
router.post('/', async (req: Request, res: Response) => {
  try {
    const { path: projectPath } = req.body;
    const project = await addProjectManually(projectPath);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate workspace path
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { path: requestedPath } = req.body;
    const result = await validateWorkspacePath(requestedPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
export { validateWorkspacePath, WORKSPACES_ROOT, FORBIDDEN_PATHS };