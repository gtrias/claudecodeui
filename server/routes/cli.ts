import express from 'express';
import { spawn } from 'child_process';
import type { Request, Response } from 'express';

const router = express.Router();

// Helper to check if a command exists and is authenticated
async function checkCliStatus(
  command: string,
  args: string[],
  authPattern: RegExp
): Promise<{ authenticated: boolean; email: string | null; error: string | null }> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const output = stdout + stderr;
        const match = output.match(authPattern);
        
        if (match) {
          resolve({
            authenticated: true,
            email: match[1] || null,
            error: null,
          });
        } else if (code === 0) {
          // Command ran but no auth info found
          resolve({
            authenticated: false,
            email: null,
            error: null,
          });
        } else {
          resolve({
            authenticated: false,
            email: null,
            error: `Command exited with code ${code}`,
          });
        }
      });

      proc.on('error', (err) => {
        resolve({
          authenticated: false,
          email: null,
          error: `Command not found: ${command}`,
        });
      });
    } catch (err) {
      resolve({
        authenticated: false,
        email: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}

// GET /api/cli/claude/status - Check Claude CLI authentication
router.get('/claude/status', async (req: Request, res: Response) => {
  try {
    // Try to get Claude CLI auth status
    const result = await checkCliStatus(
      'claude',
      ['--version'],
      /logged in as ([^\s]+)/i
    );
    
    // If version check works, try to get actual auth status
    if (!result.error) {
      const authResult = await checkCliStatus(
        'claude',
        ['auth', 'status'],
        /(?:logged in as|authenticated as|email[:\s]+)([^\s\n]+)/i
      );
      res.json(authResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    res.json({
      authenticated: false,
      email: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/cli/cursor/status - Check Cursor CLI authentication
router.get('/cursor/status', async (req: Request, res: Response) => {
  try {
    const result = await checkCliStatus(
      'cursor',
      ['--version'],
      /logged in as ([^\s]+)/i
    );
    res.json(result);
  } catch (error) {
    res.json({
      authenticated: false,
      email: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/cli/codex/status - Check Codex CLI authentication
router.get('/codex/status', async (req: Request, res: Response) => {
  try {
    const result = await checkCliStatus(
      'codex',
      ['--version'],
      /logged in as ([^\s]+)/i
    );
    res.json(result);
  } catch (error) {
    res.json({
      authenticated: false,
      email: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/cli/pi/status - Check Pi CLI authentication
router.get('/pi/status', async (req: Request, res: Response) => {
  try {
    const result = await checkCliStatus(
      'pi',
      ['--version'],
      /logged in as ([^\s]+)/i
    );
    res.json(result);
  } catch (error) {
    res.json({
      authenticated: false,
      email: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
