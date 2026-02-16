import express from 'express';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface PiMessage {
  type: string;
  data?: unknown;
  error?: string;
}

interface PiRequest {
  message: string;
  model?: string;
  project?: string;
}

// POST /api/pi/chat - Send message to Pi
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, model, project } = req.body as PiRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Start Pi process
    const piProcess = spawn('pi', ['chat', '--message', message], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    piProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    piProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    piProcess.on('close', (code: number) => {
      if (code === 0) {
        res.json({ success: true, output });
      } else {
        res.status(500).json({
          error: errorOutput || 'Pi process failed',
        });
      }
    });

    piProcess.on('error', (error: Error) => {
      console.error('Error starting Pi process:', error);
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    console.error('Error in Pi chat:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/pi/models - Get available Pi models
router.get('/models', async (req: Request, res: Response) => {
  try {
    // Read models from config or return default list
    const models = ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-5-haiku'];

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error getting Pi models:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/pi/sessions - Get Pi sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const projectPath = req.query.projectPath as string;
    if (!projectPath) {
      return res.json({ sessions: [] });
    }

    const { getPiSessions } = await import('../projects.js');
    const sessions = await getPiSessions(projectPath);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error getting Pi sessions:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/pi/sessions/:sessionId/messages - Get messages for a Pi session
router.get('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const projectPath = req.query.projectPath as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const { getPiSessionMessages } = await import('../projects.js');
    const result = await getPiSessionMessages(sessionId, projectPath, limit, offset);

    if (Array.isArray(result)) {
      res.json({ messages: result });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error getting Pi session messages:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/pi/sessions/:sessionId - Delete a Pi session
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const projectPath = req.query.projectPath as string;

    const { deletePiSession } = await import('../projects.js');
    await deletePiSession(sessionId, projectPath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Pi session:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
export {
  PiMessage,
  PiRequest,
};