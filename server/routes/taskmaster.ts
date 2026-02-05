import express from 'express';
import { WebSocketServer } from 'ws';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface TaskmasterMessage {
  type: string;
  data?: unknown;
  error?: string;
}

interface TaskRequest {
  id?: string;
  type: string;
  payload: Record<string, unknown>;
}

interface TaskResponse {
  success: boolean;
  taskId?: string;
  output?: unknown;
  error?: string;
}

// POST /api/taskmaster/execute - Execute a task
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { id, type, payload } = req.body as TaskRequest;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required',
      } as TaskResponse);
    }

    // In production, execute the task
    // For now, return placeholder response
    res.json({
      success: true,
      taskId: id || Date.now().toString(),
      output: { type, payload },
    } as TaskResponse);
  } catch (error) {
    console.error('Error executing task:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as TaskResponse);
  }
});

// POST /api/taskmaster/cancel - Cancel a task
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }

    // In production, cancel the task
    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling task:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/taskmaster/status/:taskId - Get task status
router.get('/status/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // In production, return task status
    res.json({
      success: true,
      status: 'pending',
      taskId,
    });
  } catch (error) {
    console.error('Error getting task status:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
export {
  TaskmasterMessage,
  TaskRequest,
  TaskResponse,
};