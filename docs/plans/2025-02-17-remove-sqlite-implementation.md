# Remove SQLite, Convex-Only Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove SQLite database dependency and use Convex as the single source of truth for all user data.

**Architecture:** Add new Convex tables for environment variables and user profiles. Update backend auth middleware to validate Convex sessions. Remove all SQLite code and dependencies.

**Tech Stack:** Convex, TypeScript, Express

---

## Task 1: Add Environment Variables Table to Convex Schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add environmentVariables table definition**

```typescript
// Add to convex/schema.ts after existing tables

  // Environment Variables - global and project-level
  environmentVariables: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
    scope: v.string(), // "global" or "project:{projectPath}"
    isSensitive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_scope", ["userId", "scope"]),
```

**Step 2: Deploy schema to Convex**

Run: `npx convex dev` (or it auto-deploys if running)
Expected: Schema updated successfully

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(convex): add environmentVariables table"
```

---

## Task 2: Add User Profiles Table to Convex Schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add userProfiles table definition**

```typescript
// Add to convex/schema.ts after environmentVariables

  // User Profile - git config, onboarding status
  userProfiles: defineTable({
    userId: v.id("users"),
    gitName: v.optional(v.string()),
    gitEmail: v.optional(v.string()),
    hasCompletedOnboarding: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
```

**Step 2: Deploy schema to Convex**

Run: `npx convex dev`
Expected: Schema updated successfully

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(convex): add userProfiles table"
```

---

## Task 3: Add Environment Variables Convex Functions

**Files:**
- Create: `convex/environmentVariables.ts`

**Step 1: Create environment variables Convex functions**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ Environment Variables ============

export const getGlobalEnvironmentVariables = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const vars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    return vars;
  },
});

export const getProjectEnvironmentVariables = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { global: [], project: [] };

    const globalVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    const projectScope = `project:${projectId}`;
    const projectVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", projectScope))
      .collect();

    return { global: globalVars, project: projectVars };
  },
});

export const getMergedEnvironmentVariables = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return {};

    const globalVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    const projectScope = `project:${projectId}`;
    const projectVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", projectScope))
      .collect();

    // Merge: global first, project overrides
    const merged: Record<string, string> = {};
    for (const v of globalVars) {
      merged[v.key] = v.value;
    }
    for (const v of projectVars) {
      merged[v.key] = v.value;
    }
    return merged;
  },
});

export const createEnvironmentVariable = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    scope: v.string(),
    isSensitive: v.boolean(),
  },
  handler: async (ctx, { key, value, scope, isSensitive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("environmentVariables", {
      userId,
      key,
      value,
      scope,
      isSensitive,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const updateEnvironmentVariable = mutation({
  args: {
    id: v.id("environmentVariables"),
    value: v.string(),
    isSensitive: v.boolean(),
  },
  handler: async (ctx, { id, value, isSensitive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Environment variable not found");
    }

    await ctx.db.patch(id, { value, isSensitive, updatedAt: Date.now() });
    return { success: true };
  },
});

export const deleteEnvironmentVariable = mutation({
  args: { id: v.id("environmentVariables") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Environment variable not found");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});
```

**Step 2: Deploy to Convex**

Run: `npx convex dev`
Expected: Functions deployed

**Step 3: Commit**

```bash
git add convex/environmentVariables.ts
git commit -m "feat(convex): add environment variables functions"
```

---

## Task 4: Add User Profile Convex Functions

**Files:**
- Create: `convex/userProfile.ts`

**Step 1: Create user profile Convex functions**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ User Profile ============

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

export const getGitConfig = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;
    return { gitName: profile.gitName, gitEmail: profile.gitEmail };
  },
});

export const updateGitConfig = mutation({
  args: {
    gitName: v.string(),
    gitEmail: v.string(),
  },
  handler: async (ctx, { gitName, gitEmail }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { gitName, gitEmail, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        gitName,
        gitEmail,
        hasCompletedOnboarding: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile?.hasCompletedOnboarding ?? false;
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { hasCompletedOnboarding: true, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        hasCompletedOnboarding: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
```

**Step 2: Deploy to Convex**

Run: `npx convex dev`
Expected: Functions deployed

**Step 3: Commit**

```bash
git add convex/userProfile.ts
git commit -m "feat(convex): add user profile functions"
```

---

## Task 5: Add Convex HTTP Endpoint for Backend Auth Validation

**Files:**
- Modify: `convex/http.ts`

**Step 1: Check current http.ts content and add validation endpoint**

```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Auth routes from @convex-dev/auth
auth.addHttpRoutes(http);

// Session validation endpoint for backend
http.route({
  path: "/validateSession",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ valid: true, userId: userId.toString() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

**Step 2: Deploy to Convex**

Run: `npx convex dev`
Expected: HTTP routes updated

**Step 3: Commit**

```bash
git add convex/http.ts
git commit -m "feat(convex): add session validation HTTP endpoint"
```

---

## Task 6: Create New Convex Auth Middleware for Backend

**Files:**
- Create: `server/middleware/convex-auth.ts`

**Step 1: Create Convex-based auth middleware**

```typescript
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
```

**Step 2: Commit**

```bash
git add server/middleware/convex-auth.ts
git commit -m "feat: add Convex authentication middleware"
```

---

## Task 7: Update User Routes to Use Convex

**Files:**
- Modify: `server/routes/user.ts`

**Step 1: Rewrite user routes to use Convex via tRPC or direct calls**

```typescript
import express from 'express';
import type { Response } from 'express';
import { authenticateConvex, ConvexAuthRequest } from '../middleware/convex-auth.js';

const router = express.Router();

// Git config - now proxies to Convex
// Frontend should call Convex directly, but keep this for compatibility
router.get('/git-config', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  try {
    // Frontend should use Convex query directly
    // This endpoint can return a redirect or instruction
    res.json({ 
      message: 'Use Convex query userProfile:getGitConfig directly',
      deprecated: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get git config' });
  }
});

router.post('/git-config', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  try {
    res.json({ 
      message: 'Use Convex mutation userProfile:updateGitConfig directly',
      deprecated: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update git config' });
  }
});

router.get('/onboarding-status', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  try {
    res.json({ 
      message: 'Use Convex query userProfile:hasCompletedOnboarding directly',
      deprecated: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

router.post('/complete-onboarding', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  try {
    res.json({ 
      message: 'Use Convex mutation userProfile:completeOnboarding directly',
      deprecated: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;
```

**Step 2: Commit**

```bash
git add server/routes/user.ts
git commit -m "refactor: update user routes to indicate Convex migration"
```

---

## Task 8: Update Environment Variables Routes

**Files:**
- Modify: `server/routes/environment-variables.ts`

**Step 1: Rewrite to indicate Convex migration**

```typescript
import express from 'express';
import type { Response } from 'express';
import { authenticateConvex, ConvexAuthRequest } from '../middleware/convex-auth.js';

const router = express.Router();

// All environment variable operations should now use Convex directly
// These endpoints are kept for backward compatibility but marked deprecated

router.get('/global', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query environmentVariables:getGlobalEnvironmentVariables',
    deprecated: true,
    variables: []
  });
});

router.get('/project/:projectId', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query environmentVariables:getProjectEnvironmentVariables',
    deprecated: true,
    global: [],
    project: []
  });
});

router.post('/global', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:createEnvironmentVariable',
    deprecated: true
  });
});

router.put('/global/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:updateEnvironmentVariable',
    deprecated: true
  });
});

router.delete('/global/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:deleteEnvironmentVariable',
    deprecated: true
  });
});

export default router;
```

**Step 2: Commit**

```bash
git add server/routes/environment-variables.ts
git commit -m "refactor: update env vars routes to indicate Convex migration"
```

---

## Task 9: Update Frontend to Use Convex for User Profile

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Update AuthContext to use Convex for onboarding status**

```typescript
import React, { createContext, useContext, ReactNode } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { IS_PLATFORM } from "../constants/config";

interface User {
  email?: string;
  username?: string;
  id?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsSetup: boolean;
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  
  // Get onboarding status from Convex
  const onboardingStatus = useQuery(
    api.userProfile.hasCompletedOnboarding,
    isAuthenticated ? {} : "skip"
  );
  const completeOnboardingMutation = useMutation(api.userProfile.completeOnboarding);

  // Platform mode bypass
  if (IS_PLATFORM) {
    const platformValue: AuthContextValue = {
      user: { email: "platform-user", username: "platform-user" },
      token: null,
      login: async () => ({ success: true }),
      register: async () => ({ success: true }),
      logout: () => {},
      isLoading: false,
      isAuthenticated: true,
      needsSetup: false,
      hasCompletedOnboarding: true,
      refreshOnboardingStatus: async () => {},
      error: null,
    };

    return (
      <AuthContext.Provider value={platformValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  const user: User | null = isAuthenticated
    ? {
        email: "authenticated-user",
        username: "authenticated-user",
        id: "convex-user",
      }
    : null;

  const logout = (): void => {
    signOut().catch((error: unknown) => {
      console.error("Logout error:", error);
    });
  };

  const login = async (): Promise<AuthResponse> => {
    console.warn("login() is deprecated. Use OTP authentication.");
    return { success: false, error: "Use OTP authentication" };
  };

  const register = async (): Promise<AuthResponse> => {
    console.warn("register() is deprecated. Use OTP authentication.");
    return { success: false, error: "Use OTP authentication" };
  };

  const refreshOnboardingStatus = async (): Promise<void> => {
    // Convex queries auto-refresh, no manual refresh needed
  };

  const value: AuthContextValue = {
    user,
    token: null,
    login,
    register,
    logout,
    isLoading: isConvexLoading || (isAuthenticated && onboardingStatus === undefined),
    isAuthenticated,
    needsSetup: false,
    hasCompletedOnboarding: onboardingStatus ?? false,
    refreshOnboardingStatus,
    error: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor: use Convex for onboarding status in AuthContext"
```

---

## Task 10: Update Onboarding Component to Use Convex

**Files:**
- Modify: `src/components/Onboarding.tsx`

**Step 1: Update to use Convex mutation for completing onboarding**

Look for the onComplete handler and update to use Convex mutation:

```typescript
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Inside component:
const completeOnboardingMutation = useMutation(api.userProfile.completeOnboarding);

// In the completion handler:
const handleComplete = async () => {
  try {
    await completeOnboardingMutation();
    onComplete?.();
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
  }
};
```

**Step 2: Commit**

```bash
git add src/components/Onboarding.tsx
git commit -m "refactor: use Convex mutation for onboarding completion"
```

---

## Task 11: Update Server Index to Remove SQLite

**Files:**
- Modify: `server/index.ts`

**Step 1: Remove SQLite initialization and old auth**

Remove these imports and calls:
- `import { initializeDatabase } from './database/db.js'`
- `import { authenticateToken } from './middleware/auth.js'`
- `await initializeDatabase()`

Replace with:
- `import { authenticateConvex } from './middleware/convex-auth.js'`

Update route mounting to use `authenticateConvex` instead of `authenticateToken`.

**Step 2: Commit**

```bash
git add server/index.ts
git commit -m "refactor: remove SQLite initialization, use Convex auth"
```

---

## Task 12: Remove SQLite Database Files

**Files:**
- Delete: `server/database/db.ts`
- Delete: `server/database/init.sql`
- Delete: `server/database/types.ts`
- Delete: `server/middleware/auth.ts`
- Delete: `server/routes/auth.ts`

**Step 1: Remove files**

```bash
rm server/database/db.ts
rm server/database/init.sql
rm server/database/types.ts
rm server/middleware/auth.ts
rm server/routes/auth.ts
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove SQLite database files and old auth"
```

---

## Task 13: Remove better-sqlite3 from Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove better-sqlite3**

```bash
npm uninstall better-sqlite3
npm uninstall @types/better-sqlite3
```

**Step 2: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds without SQLite

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove better-sqlite3 dependency"
```

---

## Task 14: Update Agent Routes to Fetch Credentials from Convex

**Files:**
- Modify: `server/routes/agent.ts`

**Step 1: Update to fetch API keys from Convex**

The agent routes need to get Anthropic/OpenAI API keys. These should be fetched from Convex credentials. Since the backend can't directly query Convex (it's a frontend library), we need to:

1. Have the frontend pass the API key in the request, OR
2. Use Convex HTTP actions to fetch credentials

For now, update to expect API key from request or environment:

```typescript
// In agent route handlers, get API key from:
// 1. Request body/header (frontend fetches from Convex and sends)
// 2. Environment variable as fallback
const apiKey = req.body.apiKey || process.env.ANTHROPIC_API_KEY;
```

**Step 2: Commit**

```bash
git add server/routes/agent.ts
git commit -m "refactor: update agent routes for Convex credential flow"
```

---

## Task 15: Test the Migration

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test login flow**
- Open app in browser
- Login with OTP
- Verify projects load

**Step 3: Test on mobile**
- Open app on phone
- Login with same account
- Verify projects load (this was the original issue!)

**Step 4: Test environment variables UI**
- Go to Settings
- Try adding/editing environment variables
- Verify they persist across refreshes

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found in testing"
```

---

## Task 16: Final Cleanup and Documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

**Step 1: Update AGENTS.md**

Remove references to SQLite, update architecture description.

**Step 2: Update README.md**

Remove SQLite setup instructions if any.

**Step 3: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: update documentation to reflect Convex-only architecture"
```

---

## Summary

After completing all tasks:
- ✅ SQLite completely removed
- ✅ All data in Convex (users, credentials, env vars, profiles)
- ✅ Backend validates Convex sessions
- ✅ Mobile login works correctly
- ✅ No better-sqlite3 dependency
