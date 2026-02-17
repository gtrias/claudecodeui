# Design: Remove SQLite, Use Convex for All Data

**Date:** 2025-02-17  
**Status:** Approved  
**Author:** AI Assistant  

## Overview

Remove SQLite database dependency entirely and migrate all data storage to Convex. This simplifies the architecture, eliminates mobile authentication issues, and provides a single source of truth for all user data.

## Current State

### SQLite Tables (to be removed)
- `users` - username, password_hash, git_name, git_email, has_completed_onboarding
- `api_keys` - external API access keys
- `user_credentials` - tokens (GitHub, GitLab, Anthropic, etc.)
- `environment_variables` - global and project-level env vars

### Already in Convex
- `apiKeys` - ✅ fully implemented
- `credentials` - ✅ fully implemented
- `modelSettings` - ✅ fully implemented
- Auth via `@convex-dev/auth` - ✅ OTP email flow

## Target State

### New Convex Tables

```typescript
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

## Files to Delete

| File | Reason |
|------|--------|
| `server/database/db.ts` | SQLite operations |
| `server/database/init.sql` | SQLite schema |
| `server/database/types.ts` | SQLite types |
| `server/routes/auth.ts` | Old JWT auth (Convex handles auth) |

## Files to Modify

### server/middleware/auth.ts
- Remove JWT validation
- Remove SQLite user lookup
- Add Convex token validation via HTTP action
- Simplified middleware that validates Convex session

### server/index.ts
- Remove `initializeDatabase()` call
- Remove SQLite-related imports
- Update route mounting (remove old auth routes)

### server/routes/user.ts
- Remove `userDb` imports
- Call Convex functions for git config and onboarding
- Use Convex HTTP actions or tRPC

### server/routes/environment-variables.ts
- Remove `environmentVariablesDb` imports
- Call Convex functions for env var CRUD
- Backend needs to fetch env vars for CLI runners

### server/routes/agent.ts
- Remove `credentialsDb` imports
- Fetch credentials from Convex for API keys (Anthropic, OpenAI, etc.)

### convex/schema.ts
- Add `environmentVariables` table
- Add `userProfiles` table

### convex/settings.ts (or new convex/envVars.ts)
- Add CRUD functions for environment variables
- Add CRUD functions for user profile (git config, onboarding)

### package.json
- Remove `better-sqlite3` dependency

## Backend Auth Strategy

Since Convex handles authentication in the frontend, the backend needs to validate requests:

### Option: Convex HTTP Actions
1. Frontend sends Convex auth token in `Authorization` header
2. Backend middleware calls Convex HTTP action to validate token
3. Convex returns user ID if valid
4. Backend proceeds with request

```typescript
// convex/http.ts - add validation endpoint
export const validateSession = httpAction(async (ctx, request) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    return new Response(JSON.stringify({ valid: false }), { status: 401 });
  }
  return new Response(JSON.stringify({ valid: true, userId }), { status: 200 });
});
```

```typescript
// server/middleware/auth.ts - simplified
export const authenticateConvex = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  // Validate with Convex
  const response = await fetch(`${CONVEX_URL}/validateSession`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) return res.status(401).json({ error: 'Invalid session' });
  
  const { userId } = await response.json();
  req.userId = userId;
  next();
};
```

## Data Migration

Existing SQLite data needs to be migrated to Convex:
1. Migration already exists for apiKeys and credentials (`useMigrateSettings` hook)
2. Add environment variables to migration
3. Add git config to migration
4. Run migration on first login after update

## Testing Strategy

1. Verify Convex auth works on mobile and desktop
2. Test environment variables CRUD
3. Test git config persistence
4. Test onboarding flow
5. Verify CLI runners can fetch credentials and env vars

## Rollback Plan

If issues arise:
1. Keep SQLite files in git history (don't force-delete)
2. Can restore SQLite code from git if needed
3. Convex data persists regardless

## Success Criteria

- [ ] No SQLite dependency in package.json
- [ ] No SQLite files in server/database/
- [ ] All data stored in Convex
- [ ] Mobile login shows projects correctly
- [ ] Environment variables work for CLI runners
- [ ] Git config persists across sessions
