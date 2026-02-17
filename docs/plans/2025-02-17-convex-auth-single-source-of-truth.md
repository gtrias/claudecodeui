# Convex Auth Single Source of Truth Design

**Date:** 2025-02-17  
**Status:** Approved  
**Author:** AI Assistant + User collaboration

## Overview

Establish Convex as the single source of truth for authentication across all layers of the application, replacing the fragmented auth state spread across Convex, AuthContext, WebSocket, and SQLite.

## Problem Statement

Current issues:
1. **WebSocket bug** - `unmountedRef` set incorrectly on every effect cleanup, preventing reconnection
2. **Token confusion** - `AuthContext.token` is always `null` with Convex auth
3. **No server validation** - Express just uses first SQLite user, doesn't validate Convex
4. **Auth state scattered** - Multiple places check auth differently
5. **SQLite user tables** - Redundant now that Convex handles auth

## Architecture

### Single Source of Truth

```
┌─────────────────────────────────────────────────────┐
│                 CONVEX (Authority)                  │
│  - User identity                                    │
│  - Authentication state                             │
│  - JWT tokens                                       │
│  - Settings data                                    │
└─────────────────────────────────────────────────────┘
                          ↓
              useConvexAuth() + useAuthToken()
                          ↓
┌─────────────────────────────────────────────────────┐
│              AuthContext (Single Hook)              │
│  - isAuthenticated (from Convex)                    │
│  - isLoading (from Convex)                          │
│  - token (Convex JWT)                               │
│  - user (from Convex)                               │
└─────────────────────────────────────────────────────┘
                          ↓
         All consumers use useAuth() only
                          ↓
    ┌─────────────┬─────────────┬─────────────┐
    ↓             ↓             ↓             ↓
WebSocket    Express API    tRPC API    Convex Queries
(token in URL) (Bearer token) (Bearer token) (automatic)
```

## Implementation Phases

### Phase 1: Immediate Fix (WebSocket Bug)

**Problem:** `unmountedRef.current = true` runs on every effect cleanup, not just unmount.

**Current (Wrong):**
```typescript
useEffect(() => {
  connect();
  return () => {
    unmountedRef.current = true;  // BUG: runs on every re-render
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) wsRef.current.close();
  };
}, [token, isAuthenticated, connect]);
```

**Fixed:**
```typescript
// Track unmount separately
useEffect(() => {
  return () => {
    unmountedRef.current = true;
  };
}, []);

// Handle connection with proper cleanup
useEffect(() => {
  connect();
  return () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) wsRef.current.close();
  };
}, [token, isAuthenticated, connect]);
```

### Phase 2: Convex JWT Integration

**Getting Token in Frontend:**
```typescript
import { useAuthToken } from "@convex-dev/auth/react";

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const convexToken = useAuthToken();
  
  const value = {
    isAuthenticated,
    isLoading,
    token: convexToken,  // Now available!
    user: isAuthenticated ? { /* from Convex */ } : null,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Server-side Validation:**
```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const CONVEX_SITE_URL = process.env.AUTH_CONVEX_SITE_URL;
const jwks = createRemoteJWKSet(
  new URL(`${CONVEX_SITE_URL}/.well-known/jwks.json`)
);

export const authenticateConvexToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { payload } = await jwtVerify(token, jwks);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**WebSocket with Token:**
```typescript
const buildWebSocketUrl = (token: string | null, isAuthenticated: boolean) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (IS_PLATFORM) return `${protocol}//${window.location.host}/ws`;
  if (!token || !isAuthenticated) return null;
  return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
};
```

### Phase 3: SQLite User Removal

**Tables to Remove:**
- `users` - Convex handles auth
- User-related columns/references

**Tables Already Migrated:**
- `api_keys` → Convex `apiKeys` table
- `user_credentials` → Convex `credentials` table

**Code Cleanup:**
- Remove `userDb` usage from server
- Remove `authenticateToken` JWT validation (use Convex JWT)
- Remove user creation/login endpoints
- Clean up SQLite schema

## Data Flow

### Authentication Flow
```
1. User enters email in OTPLoginForm
2. Convex sends OTP via Resend
3. User enters OTP in OTPVerifyForm
4. Convex validates, creates session, returns JWT
5. ConvexAuthProvider stores JWT
6. useAuthToken() exposes JWT to AuthContext
7. AuthContext provides to all consumers
```

### Request Flow (After Implementation)
```
Frontend                    Server
   │                          │
   │ GET /api/files           │
   │ Authorization: Bearer <convex-jwt>
   │ ────────────────────────>│
   │                          │ Verify JWT with Convex JWKS
   │                          │ Extract user ID from payload
   │                          │ Process request
   │ <────────────────────────│
   │ { files: [...] }         │
```

### WebSocket Flow (After Implementation)
```
Frontend                    Server
   │                          │
   │ WS /ws?token=<jwt>       │
   │ ────────────────────────>│
   │                          │ Verify JWT with Convex JWKS
   │                          │ Store user context
   │ <────────────────────────│
   │ Connection established   │
   │                          │
   │ { type: 'claude-command' }
   │ ────────────────────────>│
   │                          │ User context available
   │                          │ Process command
```

## Migration Notes

### User ID Change
- Before: SQLite `user.id` (integer: 1, 2, 3...)
- After: Convex `user._id` (string: "jd7abc123...")

### Backward Compatibility
- Settings already migrated to Convex with one-time migration
- API keys use Convex user ID
- No user-specific data remains in SQLite

## Dependencies

```json
{
  "jose": "^5.0.0"  // For JWT verification with JWKS
}
```

## Environment Variables

```env
# Existing
VITE_CONVEX_URL=https://xxx.convex.cloud
AUTH_CONVEX_SITE_URL=https://xxx.convex.site  # For JWKS endpoint

# To Remove (after migration)
JWT_SECRET=xxx  # No longer needed
```

## Success Criteria

1. ✅ WebSocket connects when user authenticates
2. ✅ Server validates Convex JWT on all protected routes
3. ✅ User ID consistent across frontend and backend
4. ✅ No SQLite user tables
5. ✅ Single `useAuth()` hook for all auth needs

## Related Documents

- `docs/plans/2025-02-15-convex-auth-migration-design.md` - Original Convex auth migration
- `docs/plans/2025-02-17-convex-settings-migration-design.md` - Settings migration
- `docs/plans/2025-02-17-future-proof-api-architecture-design.md` - tRPC architecture
