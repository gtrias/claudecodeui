import express from 'express';
import { spawn } from 'child_process';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface CursorRequest {
  message: string;
  model?: string;
  project?: string;
}

interface CursorResponse {
  success: boolean;
  output?: string;
  error?: string;
}

// POST /api/cursor/chat - Send message to Cursor
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, model, project } = req.body as CursorRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Start Cursor process
    const cursorProcess = spawn('cursor', ['chat', '--message', message], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    cursorProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    cursorProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    cursorProcess.on('close', (code: number) => {
      if (code === 0) {
        res.json({ success: true, output });
      } else {
        res.status(500).json({
          error: errorOutput || 'Cursor process failed',
        });
      }
    });

    cursorProcess.on('error', (error: Error) => {
      console.error('Error starting Cursor process:', error);
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    console.error('Error in Cursor chat:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/cursor/abort - Abort current Cursor session
router.post('/abort', async (req: Request, res: Response) => {
  try {
    // In production, implement proper session abort
    res.json({ success: true });
  } catch (error) {
    console.error('Error aborting Cursor session:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/cursor/sessions - Get active Cursor sessions
// GET /api/cursor/mcp - Get Cursor MCP servers configuration
router.get('/mcp', async (req: Request, res: Response) => {
  try {
    // Cursor doesn't have built-in MCP support yet
    // Return empty array for now
    res.json({ servers: [] });
  } catch (error) {
    res.json({ servers: [], error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    // In production, return active sessions
    res.json({ sessions: [] });
  } catch (error) {
    console.error('Error getting Cursor sessions:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
export {
  CursorRequest,
  CursorResponse,
};