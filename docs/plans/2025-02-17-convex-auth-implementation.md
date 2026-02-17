# Convex Auth Single Source of Truth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish Convex as the single source of truth for authentication, fixing the WebSocket bug and enabling server-side JWT validation.

**Architecture:** Fix WebSocket reconnection bug first (immediate), then integrate Convex JWT tokens into AuthContext and server middleware, finally remove SQLite user tables.

**Tech Stack:** Convex Auth, jose (JWT verification), React Context

---

## Phase 1: Immediate WebSocket Fix

### Task 1: Fix WebSocket unmountedRef Bug

**Files:**
- Modify: `src/contexts/WebSocketContext.tsx`

**Step 1: Separate unmount tracking from reconnection**

Find the current useEffect (around line 86-99):
```typescript
useEffect(() => {
  connect();
  
  return () => {
    unmountedRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token, isAuthenticated, connect]);
```

Replace with TWO separate useEffects:
```typescript
// Track actual component unmount (runs only once on unmount)
useEffect(() => {
  return () => {
    unmountedRef.current = true;
  };
}, []);

// Handle connection lifecycle (runs when auth changes)
useEffect(() => {
  connect();
  
  return () => {
    // Clean up connection but DON'T set unmountedRef
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };
}, [token, isAuthenticated, connect]);
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Test in browser**

1. Start server: `npm run dev`
2. Open browser, login via OTP
3. Check console for: `[WS] Chat client connected`
4. Send a message, verify no "Not connected" error

**Step 4: Commit**

```bash
git add src/contexts/WebSocketContext.tsx
git commit -m "fix: separate WebSocket unmount tracking from reconnection logic"
```

---

## Phase 2: Convex JWT Integration

### Task 2: Install jose for JWT Verification

**Files:**
- Modify: `package.json`

**Step 1: Install jose**

Run: `npm install jose`

**Step 2: Verify installation**

Run: `npm ls jose`
Expected: Shows jose@5.x.x

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose for JWT verification"
```

---

### Task 3: Add useAuthToken to AuthContext

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Import useAuthToken**

Add to imports:
```typescript
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
```

**Step 2: Get token in AuthProvider**

Inside `AuthProvider`, after the `useConvexAuth()` call:
```typescript
const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
const { signOut } = useAuthActions();
const convexToken = useAuthToken();  // Add this line
```

**Step 3: Update the returned value**

Find where `token: null` is set and change to:
```typescript
token: convexToken ?? null,
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Test token is available**

Add temporary console.log in AuthProvider:
```typescript
console.log('[Auth] Token available:', !!convexToken);
```

Check browser console after login - should show `true`.

**Step 6: Remove debug log and commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: expose Convex JWT token via AuthContext"
```

---

### Task 4: Create Convex JWT Middleware

**Files:**
- Create: `server/middleware/convex-auth.ts`

**Step 1: Create the middleware file**

```typescript
/**
 * Convex JWT Authentication Middleware
 * Validates Convex auth tokens using JWKS
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import type { Request, Response, NextFunction } from 'express';

interface ConvexJWTPayload extends JWTPayload {
  sub?: string;  // User ID
  email?: string;
}

interface AuthenticatedRequest extends Request {
  convexUser?: {
    id: string;
    email?: string;
  };
}

// Cache JWKS for performance
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (jwksCache) return jwksCache;
  
  const convexSiteUrl = process.env.AUTH_CONVEX_SITE_URL;
  if (!convexSiteUrl) {
    throw new Error('AUTH_CONVEX_SITE_URL environment variable not set');
  }
  
  jwksCache = createRemoteJWKSet(
    new URL(`${convexSiteUrl}/.well-known/jwks.json`)
  );
  return jwksCache;
}

export const authenticateConvexJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip auth in platform mode
  if (process.env.VITE_IS_PLATFORM === 'true') {
    req.convexUser = { id: 'platform-user' };
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : (req.query.token as string | undefined);

  if (!token) {
    res.status(401).json({ error: 'No authentication token provided' });
    return;
  }

  try {
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks) as { payload: ConvexJWTPayload };
    
    req.convexUser = {
      id: payload.sub || 'unknown',
      email: payload.email,
    };
    
    next();
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const authenticateWebSocketConvex = async (
  token: string | null
): Promise<{ success: boolean; user?: { id: string; email?: string }; error?: string }> => {
  // Platform mode bypass
  if (process.env.VITE_IS_PLATFORM === 'true') {
    return { success: true, user: { id: 'platform-user' } };
  }

  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks) as { payload: ConvexJWTPayload };
    
    return {
      success: true,
      user: {
        id: payload.sub || 'unknown',
        email: payload.email,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
};
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds (middleware not yet used)

**Step 3: Commit**

```bash
git add server/middleware/convex-auth.ts
git commit -m "feat: add Convex JWT verification middleware"
```

---

### Task 5: Update WebSocket to Validate Convex JWT

**Files:**
- Modify: `server/index.ts`

**Step 1: Import the new middleware**

Add to imports:
```typescript
import { authenticateWebSocketConvex } from './middleware/convex-auth.js';
```

**Step 2: Update WebSocket connection handler**

Find `wss.on('connection', ...)` and update to validate token:

```typescript
wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  // Extract token from URL query params
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  // Validate Convex JWT
  const authResult = await authenticateWebSocketConvex(token);
  
  if (!authResult.success) {
    console.log(c.warn(`[WS] Auth failed: ${authResult.error}`));
    ws.close(4001, 'Authentication failed');
    return;
  }
  
  console.log(c.info(`[WS] Client connected, user: ${authResult.user?.id}`));
  connectedClients.add(ws);

  const writer = new WebSocketWriter(ws);
  // ... rest of handler
```

**Step 3: Add IncomingMessage import**

Add to imports at top:
```typescript
import type { IncomingMessage } from 'http';
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add server/index.ts
git commit -m "feat: validate Convex JWT on WebSocket connection"
```

---

### Task 6: Add AUTH_CONVEX_SITE_URL to Environment

**Files:**
- Modify: `.env.local` (or create `.env`)

**Step 1: Get Convex site URL**

Run: `npx convex dashboard`

Or find in Convex dashboard → Settings → URL Configuration
Format: `https://<deployment-name>.convex.site`

**Step 2: Add to environment**

Add to `.env.local`:
```
AUTH_CONVEX_SITE_URL=https://jovial-jay-601.convex.site
```

**Step 3: Restart server and test**

1. Restart: `npm run dev`
2. Login via OTP
3. Check server logs for: `[WS] Client connected, user: ...`

**Step 4: Commit env example**

```bash
echo "AUTH_CONVEX_SITE_URL=https://your-deployment.convex.site" >> .env.example
git add .env.example
git commit -m "docs: add AUTH_CONVEX_SITE_URL to env example"
```

---

## Phase 3: SQLite User Cleanup (Future)

### Task 7: Remove userDb from Server (Future)

*This task should be done after Phase 2 is stable and tested.*

**Files:**
- Modify: `server/middleware/auth.ts` - Remove JWT validation, keep only Convex
- Modify: `server/index.ts` - Remove userDb imports
- Modify: `server/database/db.ts` - Remove user-related functions

**Not implemented yet - requires:**
1. All endpoints verified working with Convex auth
2. Backup of any remaining user data
3. Migration testing

---

## Testing Checklist

After completing Tasks 1-6:

- [ ] WebSocket connects after OTP login
- [ ] Chat messages send successfully  
- [ ] Server logs show Convex user ID
- [ ] Refresh page maintains connection
- [ ] Multiple tabs work independently
- [ ] Logout disconnects WebSocket

---

## Rollback Plan

If issues occur:

1. **Task 1 issues:** Revert WebSocketContext.tsx
2. **Task 3-5 issues:** Remove convex-auth.ts, revert to old auth middleware
3. **Environment issues:** Check AUTH_CONVEX_SITE_URL is correct

```bash
# Quick rollback to before this plan
git log --oneline -10  # Find commit before changes
git revert HEAD~N..HEAD  # Revert N commits
```
