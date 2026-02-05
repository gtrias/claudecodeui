import express from 'express';
import { getPiSessions, getPiSessionMessages, deletePiSession } from '../projects.js';

const router = express.Router();

router.get('/sessions', async (req, res) => {
  try {
    const { projectPath } = req.query;
    if (!projectPath) {
      return res.status(400).json({ success: false, error: 'projectPath query parameter required' });
    }

    const sessions = await getPiSessions(projectPath);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching Pi sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectPath, limit, offset } = req.query;

    const result = await getPiSessionMessages(
      sessionId,
      projectPath || null,
      limit ? parseInt(limit, 10) : null,
      offset ? parseInt(offset, 10) : 0
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching Pi session messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectPath } = req.query;
    await deletePiSession(sessionId, projectPath || null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Pi session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
