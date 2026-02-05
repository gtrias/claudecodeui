import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface CliAuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface CliAuthRequest {
  token?: string;
}

// POST /api/cli-auth/verify - Verify CLI authentication token
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as CliAuthRequest;

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
    } as CliAuthResponse);
  } catch (error) {
    console.error('Error verifying CLI auth token:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    } as CliAuthResponse);
  }
});

// POST /api/cli-auth/clear - Clear CLI authentication token
router.post('/clear', async (req: Request, res: Response) => {
  try {
    const tokenPath = path.join(process.env.HOME || '', '.claude', 'cli-token.txt');
    await fs.unlink(tokenPath).catch(() => {}); // Ignore if file doesn't exist

    res.json({
      success: true,
      message: 'Token cleared',
    } as CliAuthResponse);
  } catch (error) {
    console.error('Error clearing CLI auth token:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    } as CliAuthResponse);
  }
});

// GET /api/cli-auth/status - Get CLI authentication status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const tokenPath = path.join(process.env.HOME || '', '.claude', 'cli-token.txt');
    const tokenExists = await fs.access(tokenPath).then(() => true).catch(() => false);

    res.json({
      success: true,
      isAuthenticated: tokenExists,
    } as CliAuthResponse);
  } catch (error) {
    console.error('Error checking CLI auth status:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    } as CliAuthResponse);
  }
});

export default router;
export {
  CliAuthResponse,
  CliAuthRequest,
};