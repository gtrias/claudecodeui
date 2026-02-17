// server/routes/pi.ts
import express from 'express';
import type { Request, Response } from 'express';
import { piRpcManager } from '../pi-rpc.js';

const router = express.Router();

// GET /api/pi/check - Check if Pi CLI is installed
router.get('/check', async (_req: Request, res: Response) => {
  try {
    const installed = await piRpcManager.isPiInstalled();
    let version: string | null = null;
    
    if (installed) {
      version = await piRpcManager.getPiVersion();
    }
    
    res.json({ installed, version });
  } catch (error) {
    console.error('Error checking Pi installation:', error);
    res.status(500).json({ 
      installed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/pi/models - Get available Pi models (dynamic)
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const installed = await piRpcManager.isPiInstalled();
    if (!installed) {
      return res.json({ 
        success: false, 
        error: 'Pi CLI not installed',
        models: [] 
      });
    }

    const models = await piRpcManager.getAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    console.error('Error getting Pi models:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      models: [] 
    });
  }
});

// POST /api/pi/models/refresh - Invalidate cache and refetch models
router.post('/models/refresh', async (_req: Request, res: Response) => {
  try {
    piRpcManager.invalidateModelCache();
    const models = await piRpcManager.getAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    console.error('Error refreshing Pi models:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      models: [] 
    });
  }
});

// GET /api/pi/sessions - Get Pi sessions (existing functionality)
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

// GET /api/pi/active-sessions - Get active Pi sessions on server
router.get('/active-sessions', (_req: Request, res: Response) => {
  const sessions = piRpcManager.getActiveSessions();
  res.json({ success: true, sessions });
});

export default router;
