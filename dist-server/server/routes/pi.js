import express from 'express';
import { spawn } from 'child_process';
const router = express.Router();
// POST /api/pi/chat - Send message to Pi
router.post('/chat', async (req, res) => {
    try {
        const { message, model, project } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        // Start Pi process
        const piProcess = spawn('pi', ['chat', '--message', message], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let output = '';
        let errorOutput = '';
        piProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        piProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        piProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true, output });
            }
            else {
                res.status(500).json({
                    error: errorOutput || 'Pi process failed',
                });
            }
        });
        piProcess.on('error', (error) => {
            console.error('Error starting Pi process:', error);
            res.status(500).json({ error: error.message });
        });
    }
    catch (error) {
        console.error('Error in Pi chat:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// GET /api/pi/models - Get available Pi models
router.get('/models', async (req, res) => {
    try {
        // Read models from config or return default list
        const models = ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-5-haiku'];
        res.json({ success: true, models });
    }
    catch (error) {
        console.error('Error getting Pi models:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
export default router;
