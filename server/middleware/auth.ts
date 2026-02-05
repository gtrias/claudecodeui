/**
 * Authentication Middleware - TypeScript Version
 * Type-safe authentication for Claude Code UI
 */

import jwt from 'jsonwebtoken';
import { userDb } from '../database/db.js';
import type { AuthRequest, DecodedToken, AuthResult, TokenValidationResult } from './types.js';

// Get JWT secret from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'claude-ui-dev-secret-change-in-production';

// Optional API key middleware
export const validateApiKey = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Skip API key validation if not configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// JWT authentication middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Platform mode: use single database user
  if (process.env.VITE_IS_PLATFORM === 'true') {
    try {
      const user = userDb.getFirstUser();
      if (!user) {
        return res.status(500).json({ error: 'Platform mode: No user found in database' });
      }
      req.user = user;
      return next();
    } catch (error) {
      console.error('Platform mode error:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(500).json({ error: 'Platform mode: Failed to fetch user' });
    }
  }

  // Normal OSS JWT validation
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Also check query param for SSE endpoints
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // Verify user still exists and is active
    const user = userDb.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Generate JWT token (never expires)
export const generateToken = (user: { id: number; username: string }): string => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    JWT_SECRET
    // No expiration - token lasts forever
  );
};

// WebSocket authentication function
export const authenticateWebSocket = (token: string | null): AuthResult => {
  // Platform mode: bypass token validation
  if (process.env.VITE_IS_PLATFORM === 'true') {
    try {
      const user = userDb.getFirstUser();
      if (user) {
        return { success: true, user: { id: user.id, username: user.username } };
      }
      return { success: false, error: 'No user found' };
    } catch (error) {
      console.error('Platform mode WebSocket error:', error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: 'Failed to fetch user' };
    }
  }

  // Normal OSS JWT validation
  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return { success: true, user: { id: decoded.userId, username: decoded.username } };
  } catch (error) {
    console.error('WebSocket token verification error:', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Invalid token' };
  }
};

export { JWT_SECRET };
