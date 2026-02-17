import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';

export interface User {
  id: string;
  email: string;
}

export interface Context {
  user: User | null;
}

// HTTP context
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<Context> {
  const authHeader = opts.req.headers.authorization;
  
  // For now, trust authenticated requests from the same origin
  // TODO: Integrate with Convex auth token validation
  let user: User | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    // Placeholder - will integrate with Convex auth
    user = { id: '1', email: 'user@example.com' };
  }
  
  return { user };
}

// WebSocket context
export async function createWSContext(
  opts: CreateWSSContextFnOptions
): Promise<Context> {
  // Extract token from connection params or headers
  // TODO: Integrate with Convex auth
  return { user: { id: '1', email: 'user@example.com' } };
}
