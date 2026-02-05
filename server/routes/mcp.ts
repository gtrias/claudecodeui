import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import type { Request, Response } from 'express';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exec = promisify(spawn);

// Type definitions
interface MCPConfig {
  name: string;
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  scope?: 'user' | 'project';
  projectPath?: string;
}

interface MCPListResponse {
  success: boolean;
  output: string;
  servers: MCPConfig[];
}

interface MCPAddResponse {
  success: boolean;
  output: string;
}

interface MCPError {
  error: string;
  details?: string;
}

// Parse Claude MCP list output
function parseClaudeListOutput(output: string): MCPConfig[] {
  const servers: MCPConfig[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (!line.trim() || line.startsWith('===') || line.startsWith('---')) {
      continue;
    }

    // Try to parse server name and type from output
    const match = line.match(/^\s*-\s+(\S+)\s+\(([^)]+)\)/);
    if (match) {
      servers.push({
        name: match[1],
        type: match[2] as 'stdio' | 'http' | 'sse',
      });
    }
  }

  return servers;
}

// GET /api/mcp/cli/list - List MCP servers using Claude CLI
router.get('/cli/list', async (req: Request, res: Response) => {
  try {
    console.log('📋 Listing MCP servers using Claude CLI');
    
    const process = spawn('claude', ['mcp', 'list'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    process.on('close', (code: number) => {
      if (code === 0) {
        res.json({
          success: true,
          output: stdout,
          servers: parseClaudeListOutput(stdout),
        } as MCPListResponse);
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(500).json({
          error: 'Claude CLI command failed',
          details: stderr,
        } as MCPError);
      }
    });
    
    process.on('error', (error: Error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({
        error: 'Failed to run Claude CLI',
        details: error.message,
      } as MCPError);
    });
  } catch (error) {
    console.error('Error listing MCP servers via CLI:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: 'Failed to list MCP servers',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as MCPError);
  }
});

// POST /api/mcp/cli/add - Add MCP server using Claude CLI
router.post('/cli/add', async (req: Request, res: Response) => {
  try {
    const { name, type = 'stdio', command, args = [], url, headers = {}, env = {}, scope = 'user', projectPath } = req.body as MCPConfig;
    
    console.log(`➕ Adding MCP server using Claude CLI (${scope} scope):`, name);
    
    let cliArgs = ['mcp', 'add'];
    
    // Add scope flag
    cliArgs.push('--scope', scope);
    
    if (type === 'http') {
      cliArgs.push('--transport', 'http', name, url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else if (type === 'sse') {
      cliArgs.push('--transport', 'sse', name, url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else {
      // stdio (default): claude mcp add --scope user <name> <command> [args...]
      cliArgs.push(name);
      // Add environment variables
      Object.entries(env).forEach(([key, value]) => {
        cliArgs.push('-e', `${key}=${value}`);
      });
      if (command) {
        cliArgs.push(command);
      }
      if (args && args.length > 0) {
        cliArgs.push(...args);
      }
    }
    
    console.log('🔧 Running Claude CLI command:', 'claude', cliArgs.join(' '));
    
    // For local scope, we need to run the command in the project directory
    const spawnOptions = {
      cwd: projectPath || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    };
    
    const process = spawn('claude', cliArgs, spawnOptions);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    process.on('close', (code: number) => {
      if (code === 0) {
        res.json({
          success: true,
          output: stdout,
        } as MCPAddResponse);
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(500).json({
          error: 'Claude CLI command failed',
          details: stderr,
        } as MCPError);
      }
    });
    
    process.on('error', (error: Error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({
        error: 'Failed to run Claude CLI',
        details: error.message,
      } as MCPError);
    });
  } catch (error) {
    console.error('Error adding MCP server via CLI:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: 'Failed to add MCP server',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as MCPError);
  }
});

// POST /api/mcp/cli/remove - Remove MCP server using Claude CLI
router.post('/cli/remove', async (req: Request, res: Response) => {
  try {
    const { name, scope = 'user', projectPath } = req.body;

    console.log(`➖ Removing MCP server using Claude CLI (${scope} scope):`, name);

    const cliArgs = ['mcp', 'remove', '--scope', scope, name];

    const process = spawn('claude', cliArgs, {
      cwd: projectPath || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    process.on('close', (code: number) => {
      if (code === 0) {
        res.json({
          success: true,
          output: stdout,
        } as MCPAddResponse);
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(500).json({
          error: 'Claude CLI command failed',
          details: stderr,
        } as MCPError);
      }
    });

    process.on('error', (error: Error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({
        error: 'Failed to run Claude CLI',
        details: error.message,
      } as MCPError);
    });
  } catch (error) {
    console.error('Error removing MCP server via CLI:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: 'Failed to remove MCP server',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as MCPError);
  }
});

export default router;
export {
  MCPConfig,
  MCPListResponse,
  MCPAddResponse,
  MCPError,
  parseClaudeListOutput,
};