import express from 'express';
import { spawn } from 'child_process';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface CodexRequest {
  message: string;
  model?: string;
  project?: string;
}

interface CodexResponse {
  success: boolean;
  output?: string;
  error?: string;
}

// POST /api/codex/chat - Send message to Codex
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, model, project } = req.body as CodexRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Start Codex process
    const codexProcess = spawn('codex', ['chat', '--message', message], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    codexProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    codexProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    codexProcess.on('close', (code: number) => {
      if (code === 0) {
        res.json({ success: true, output });
      } else {
        res.status(500).json({
          error: errorOutput || 'Codex process failed',
        });
      }
    });

    codexProcess.on('error', (error: Error) => {
      console.error('Error starting Codex process:', error);
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    console.error('Error in Codex chat:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/codex/abort - Abort current Codex session
router.post('/abort', async (req: Request, res: Response) => {
  try {
    // In production, implement proper session abort
    res.json({ success: true });
  } catch (error) {
    console.error('Error aborting Codex session:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/codex/sessions - Get active Codex sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    // In production, return active sessions
    res.json({ sessions: [] });
  } catch (error) {
    console.error('Error getting Codex sessions:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/codex/sessions/:sessionId/messages - Get messages for a Codex session
router.get('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const { getCodexSessionMessages } = await import('../projects.js');
    const result = await getCodexSessionMessages(sessionId, limit, offset);

    if (Array.isArray(result)) {
      res.json({ messages: result });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error getting Codex session messages:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/codex/models - Get available Codex models from OpenAI API
// GET /api/codex/mcp/config/read - Read Codex MCP configuration
router.get('/mcp/config/read', async (req: Request, res: Response) => {
  try {
    // Codex MCP config - return empty for now
    res.json({ servers: [] });
  } catch (error) {
    res.json({ servers: [], error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/codex/mcp/cli/list - List Codex MCP servers via CLI
router.get('/mcp/cli/list', async (req: Request, res: Response) => {
  try {
    // Codex MCP CLI list - return empty for now
    res.json({ servers: [] });
  } catch (error) {
    res.json({ servers: [], error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const { fetchOpenAIModels } = await import('../openai-codex.js');
    const models = await fetchOpenAIModels();

    if (models.length === 0) {
      // If API fails and no cache, return error
      return res.status(500).json({
        error: 'Failed to fetch models from OpenAI API',
        success: false
      });
    }

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error getting Codex models:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
export {
  CodexRequest,
  CodexResponse,
};