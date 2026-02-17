/**
 * Convex Authentication Middleware
 * Validates Convex session tokens for backend API routes
 */

import type { Request, Response, NextFunction } from 'express';

// Extended request type with Convex user info
export interface ConvexAuthRequest extends Request {
  convexUserId?: string;
}

const CONVEX_URL = process.env.VITE_CONVEX_URL;

/**
 * Middleware to authenticate requests using Convex session
 * Extracts token from Authorization header and validates with Convex
 */
export const authenticateConvex = async (
  req: ConvexAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip auth in development if SKIP_AUTH is set
  if (process.env.SKIP_AUTH === 'true') {
    req.convexUserId = 'dev-user';
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'No authentication token provided' });
    return;
  }

  if (!CONVEX_URL) {
    console.error('VITE_CONVEX_URL not configured');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    // Validate token with Convex HTTP endpoint
    const convexHttpUrl = CONVEX_URL.replace('.cloud', '.site');
    const response = await fetch(`${convexHttpUrl}/validateSession`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    const data = await response.json();
    if (!data.valid || !data.userId) {
      res.status(401).json({ error: 'Session validation failed' });
      return;
    }

    req.convexUserId = data.userId;
    next();
  } catch (error) {
    console.error('Convex auth error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
};
