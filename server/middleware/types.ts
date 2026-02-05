/**
 * Middleware Type Definitions for Claude Code UI
 */

import type { Request, Response, NextFunction } from 'express';

// ==========================================
// Express Request Extensions
// ==========================================

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    git_name?: string;
    git_email?: string;
  };
  apiKey?: string;
}

export interface ApiKeyRequest extends Request {
  apiKey?: string;
}

export interface WebSocketRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// ==========================================
// Middleware Function Types
// ==========================================

export type RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => void;

export type AsyncRequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

export type ErrorHandler = (error: Error, req: AuthRequest, res: Response, next: NextFunction) => void;

// ==========================================
// JWT Token Types
// ==========================================

export interface JwtConfig {
  secret: string;
  algorithm?: 'HS256' | 'HS384' | 'HS512';
  expiresIn?: string | number;
}

export interface JwtPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface DecodedToken {
  userId: number;
  username: string;
}

// ==========================================
// Authentication Result Types
// ==========================================

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
  };
  token?: string;
  error?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  userId?: number;
  username?: string;
  error?: string;
}

// ==========================================
// WebSocket Auth Types
// ==========================================

export type WebSocketAuthVerify = (info: {
  origin: string;
  secure?: boolean;
  req: Request;
}) => boolean | void;

export interface WebSocketAuthConfig {
  verifyClient?: WebSocketAuthVerify;
}

export interface WebSocketAuthResult {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
  };
  error?: string;
}

// ==========================================
// Error Response Types
// ==========================================

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

// ==========================================
// Rate Limit Types
// ==========================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  isRateLimited: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  info?: RateLimitInfo;
}
