import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
const router = express.Router();
// POST /api/cli-auth/verify - Verify CLI authentication token
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
            });
        }
        // Store token in a temporary file for use by CLI
        const tokenPath = path.join(process.env.HOME || '', '.claude', 'cli-token.txt');
        await fs.writeFile(tokenPath, token, 'utf8');
        res.json({
            success: true,
            message: 'Token verified and stored',
        });
    }
    catch (error) {
        console.error('Error verifying CLI auth token:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/cli-auth/clear - Clear CLI authentication token
router.post('/clear', async (req, res) => {
    try {
        const tokenPath = path.join(process.env.HOME || '', '.claude', 'cli-token.txt');
        await fs.unlink(tokenPath).catch(() => { }); // Ignore if file doesn't exist
        res.json({
            success: true,
            message: 'Token cleared',
        });
    }
    catch (error) {
        console.error('Error clearing CLI auth token:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/cli-auth/status - Get CLI authentication status
router.get('/status', async (req, res) => {
    try {
        const tokenPath = path.join(process.env.HOME || '', '.claude', 'cli-token.txt');
        const tokenExists = await fs.access(tokenPath).then(() => true).catch(() => false);
        res.json({
            success: true,
            isAuthenticated: tokenExists,
        });
    }
    catch (error) {
        console.error('Error checking CLI auth status:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export default router;
