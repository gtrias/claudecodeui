import express from 'express';
import { spawn } from 'child_process';
const router = express.Router();
// POST /api/cursor/chat - Send message to Cursor
router.post('/chat', async (req, res) => {
    try {
        const { message, model, project } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        // Start Cursor process
        const cursorProcess = spawn('cursor', ['chat', '--message', message], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let output = '';
        let errorOutput = '';
        cursorProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        cursorProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        cursorProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true, output });
            }
            else {
                res.status(500).json({
                    error: errorOutput || 'Cursor process failed',
                });
            }
        });
        cursorProcess.on('error', (error) => {
            console.error('Error starting Cursor process:', error);
            res.status(500).json({ error: error.message });
        });
    }
    catch (error) {
        console.error('Error in Cursor chat:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// POST /api/cursor/abort - Abort current Cursor session
router.post('/abort', async (req, res) => {
    try {
        // In production, implement proper session abort
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error aborting Cursor session:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// GET /api/cursor/sessions - Get active Cursor sessions
router.get('/sessions', async (req, res) => {
    try {
        // In production, return active sessions
        res.json({ sessions: [] });
    }
    catch (error) {
        console.error('Error getting Cursor sessions:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
export default router;
