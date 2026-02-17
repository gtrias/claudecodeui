# Convex Settings Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate API keys, credentials, and model settings from SQLite to Convex with one-time data migration.

**Architecture:** Add Convex tables for settings data, create queries/mutations, update frontend components to use Convex hooks, and implement one-time migration from SQLite.

**Tech Stack:** Convex, React, TypeScript, existing SQLite (for migration source)

**Design Document:** `docs/plans/2025-02-17-convex-settings-migration-design.md`

---

## Task 1: Update Convex Schema with Settings Tables

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add settings tables to schema**

Update `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  
  // API Keys - for external access to Claude Code UI
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    key: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key", ["key"]),

  // Credentials - stored secrets (Anthropic key, OpenAI key, etc.)
  credentials: defineTable({
    userId: v.id("users"),
    type: v.string(),
    name: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Model Settings - user preferences
  modelSettings: defineTable({
    userId: v.id("users"),
    model: v.string(),
    provider: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Migration tracking
  userMigrations: defineTable({
    userId: v.id("users"),
    settingsMigrated: v.boolean(),
    migratedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),
});
```

**Step 2: Verify Convex syncs**

Run: `npx convex dev` (should already be running)
Expected: "Convex functions ready!" with no schema errors

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add Convex schema for settings tables"
```

---

## Task 2: Create Convex Settings Queries and Mutations

**Files:**
- Create: `convex/settings.ts`

**Step 1: Create settings.ts with all functions**

Create `convex/settings.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ Helper Functions ============

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ccui_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function maskApiKey(key: string): string {
  return key.substring(0, 10) + "...";
}

// ============ API Keys ============

export const getApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return keys.map((key) => ({
      ...key,
      key: maskApiKey(key.key),
    }));
  },
});

export const validateApiKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    
    if (!apiKey || !apiKey.isActive) return null;
    
    return { userId: apiKey.userId, name: apiKey.name };
  },
});

export const createApiKey = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const key = generateApiKey();
    const id = await ctx.db.insert("apiKeys", {
      userId,
      name,
      key,
      isActive: true,
      createdAt: Date.now(),
    });
    
    return { id, name, key };
  },
});

export const deleteApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const apiKey = await ctx.db.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found");
    }
    
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleApiKey = mutation({
  args: { id: v.id("apiKeys"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const apiKey = await ctx.db.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found");
    }
    
    await ctx.db.patch(id, { isActive });
    return { success: true };
  },
});

// ============ Credentials ============

export const getCredentials = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    let queryBuilder = ctx.db
      .query("credentials")
      .withIndex("by_user", (q) => q.eq("userId", userId));
    
    const credentials = await queryBuilder.collect();
    
    // Filter by type if provided
    const filtered = type 
      ? credentials.filter((c) => c.type === type)
      : credentials;
    
    // Don't return the actual value for security
    return filtered.map((c) => ({
      _id: c._id,
      type: c.type,
      name: c.name,
      description: c.description,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  },
});

export const getActiveCredential = query({
  args: { type: v.string() },
  handler: async (ctx, { type }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    const credentials = await ctx.db
      .query("credentials")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", type))
      .collect();
    
    const active = credentials.find((c) => c.isActive);
    return active?.value || null;
  },
});

export const createCredential = mutation({
  args: {
    type: v.string(),
    name: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { type, name, value, description }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const id = await ctx.db.insert("credentials", {
      userId,
      type,
      name,
      value,
      description,
      isActive: true,
      createdAt: Date.now(),
    });
    
    return { id, type, name };
  },
});

export const updateCredential = mutation({
  args: { id: v.id("credentials"), value: v.string() },
  handler: async (ctx, { id, value }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }
    
    await ctx.db.patch(id, { value });
    return { success: true };
  },
});

export const deleteCredential = mutation({
  args: { id: v.id("credentials") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }
    
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleCredential = mutation({
  args: { id: v.id("credentials"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }
    
    await ctx.db.patch(id, { isActive });
    return { success: true };
  },
});

// ============ Model Settings ============

export const getModelSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    const settings = await ctx.db
      .query("modelSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    return settings;
  },
});

export const updateModelSettings = mutation({
  args: { model: v.string(), provider: v.string() },
  handler: async (ctx, { model, provider }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("modelSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, { model, provider, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("modelSettings", {
        userId,
        model,
        provider,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// ============ Migration ============

export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { migrated: false };
    
    const migration = await ctx.db
      .query("userMigrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    return { migrated: migration?.settingsMigrated || false };
  },
});

export const migrateSettings = mutation({
  args: {
    apiKeys: v.array(v.object({
      name: v.string(),
      key: v.string(),
      isActive: v.boolean(),
    })),
    credentials: v.array(v.object({
      type: v.string(),
      name: v.string(),
      value: v.string(),
      description: v.optional(v.string()),
      isActive: v.boolean(),
    })),
    modelSettings: v.optional(v.object({
      model: v.string(),
      provider: v.string(),
    })),
  },
  handler: async (ctx, { apiKeys, credentials, modelSettings }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if already migrated
    const existing = await ctx.db
      .query("userMigrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing?.settingsMigrated) {
      return { success: true, message: "Already migrated" };
    }
    
    // Migrate API keys
    for (const key of apiKeys) {
      await ctx.db.insert("apiKeys", {
        userId,
        name: key.name,
        key: key.key,
        isActive: key.isActive,
        createdAt: Date.now(),
      });
    }
    
    // Migrate credentials
    for (const cred of credentials) {
      await ctx.db.insert("credentials", {
        userId,
        type: cred.type,
        name: cred.name,
        value: cred.value,
        description: cred.description,
        isActive: cred.isActive,
        createdAt: Date.now(),
      });
    }
    
    // Migrate model settings
    if (modelSettings) {
      await ctx.db.insert("modelSettings", {
        userId,
        model: modelSettings.model,
        provider: modelSettings.provider,
        updatedAt: Date.now(),
      });
    }
    
    // Mark migration complete
    if (existing) {
      await ctx.db.patch(existing._id, { settingsMigrated: true, migratedAt: Date.now() });
    } else {
      await ctx.db.insert("userMigrations", {
        userId,
        settingsMigrated: true,
        migratedAt: Date.now(),
      });
    }
    
    return { success: true, message: "Migration complete" };
  },
});
```

**Step 2: Verify Convex syncs**

Check `npx convex dev` output for any errors.
Expected: "Convex functions ready!"

**Step 3: Commit**

```bash
git add convex/settings.ts
git commit -m "feat: add Convex settings queries and mutations"
```

---

## Task 3: Create Express Migration Endpoint

**Files:**
- Create: `server/routes/migrate.ts`
- Modify: `server/index.ts`

**Step 1: Create migrate.ts**

Create `server/routes/migrate.ts`:

```typescript
import express from 'express';
import { apiKeysDb, credentialsDb } from '../database/db.js';
import type { Request, Response } from 'express';

const router = express.Router();

// GET /api/migrate/settings - Export SQLite settings for Convex migration
router.get('/settings', async (req: Request, res: Response) => {
  try {
    // Get the first user's data (single-user system)
    const userId = 1;
    
    // Get API keys (with full key values for migration)
    const apiKeys = apiKeysDb.getApiKeys(userId).map((key: any) => ({
      name: key.name || key.key_name,
      key: key.api_key,
      isActive: key.is_active === 1 || key.is_active === true,
    }));
    
    // Get credentials (with full values for migration)
    const credentialsRaw = credentialsDb.getCredentialsWithValues(userId);
    const credentials = credentialsRaw.map((cred: any) => ({
      type: cred.credential_type || cred.type,
      name: cred.credential_name || cred.name,
      value: cred.credential_value || cred.value,
      description: cred.description || undefined,
      isActive: cred.is_active === 1 || cred.is_active === true,
    }));
    
    // Get model settings
    const modelSettingsRaw = apiKeysDb.getModelSettings(userId);
    const modelSettings = modelSettingsRaw ? {
      model: modelSettingsRaw.model,
      provider: modelSettingsRaw.provider,
    } : undefined;
    
    res.json({
      success: true,
      data: {
        apiKeys,
        credentials,
        modelSettings,
      },
    });
  } catch (error) {
    console.error('Migration export error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

export default router;
```

**Step 2: Add getCredentialsWithValues to db.ts**

Add to `server/database/db.ts` in the credentialsDb object:

```typescript
getCredentialsWithValues: (userId: number): any[] => {
  try {
    const rows = db.prepare(
      'SELECT id, credential_name, credential_type, credential_value, description, is_active, created_at FROM user_credentials WHERE user_id = ?'
    ).all(userId);
    return rows as any[];
  } catch (error) {
    console.error('Error fetching credentials with values:', error);
    return [];
  }
},
```

**Step 3: Mount migrate routes in index.ts**

Add to `server/index.ts`:

```typescript
import migrateRoutes from './routes/migrate.js';

// In the routes section:
app.use('/api/migrate', migrateRoutes);
```

**Step 4: Commit**

```bash
git add server/routes/migrate.ts server/database/db.ts server/index.ts
git commit -m "feat: add Express migration endpoint for SQLite export"
```

---

## Task 4: Create Frontend Migration Hook

**Files:**
- Create: `src/hooks/useMigrateSettings.ts`

**Step 1: Create the migration hook**

Create `src/hooks/useMigrateSettings.ts`:

```typescript
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

export function useMigrateSettings() {
  const { isAuthenticated } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const migrationStatus = useQuery(
    api.settings.checkMigrationStatus,
    isAuthenticated ? {} : "skip"
  );
  const migrateSettings = useMutation(api.settings.migrateSettings);
  
  useEffect(() => {
    async function runMigration() {
      if (!isAuthenticated) return;
      if (migrationStatus === undefined) return; // Still loading
      if (migrationStatus.migrated) return; // Already done
      if (migrating) return; // Already in progress
      
      setMigrating(true);
      setError(null);
      
      try {
        // Fetch SQLite data from Express
        const response = await fetch("/api/migrate/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings from server");
        }
        
        const { data } = await response.json();
        
        // Migrate to Convex
        await migrateSettings({
          apiKeys: data.apiKeys || [],
          credentials: data.credentials || [],
          modelSettings: data.modelSettings,
        });
        
        console.log("Settings migration complete");
      } catch (err) {
        console.error("Migration error:", err);
        setError(err instanceof Error ? err.message : "Migration failed");
      } finally {
        setMigrating(false);
      }
    }
    
    runMigration();
  }, [isAuthenticated, migrationStatus, migrating, migrateSettings]);
  
  return { migrating, error, migrated: migrationStatus?.migrated || false };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useMigrateSettings.ts
git commit -m "feat: add useMigrateSettings hook for SQLite to Convex migration"
```

---

## Task 5: Create useSettings Hook

**Files:**
- Create: `src/hooks/useSettings.ts`

**Step 1: Create the settings hooks**

Create `src/hooks/useSettings.ts`:

```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

// ============ API Keys ============

export function useApiKeys() {
  const { isAuthenticated } = useAuth();
  
  const apiKeys = useQuery(
    api.settings.getApiKeys,
    isAuthenticated ? {} : "skip"
  );
  const createApiKey = useMutation(api.settings.createApiKey);
  const deleteApiKey = useMutation(api.settings.deleteApiKey);
  const toggleApiKey = useMutation(api.settings.toggleApiKey);
  
  return {
    apiKeys: apiKeys || [],
    isLoading: apiKeys === undefined,
    createApiKey: async (name: string) => {
      return await createApiKey({ name });
    },
    deleteApiKey: async (id: string) => {
      return await deleteApiKey({ id: id as any });
    },
    toggleApiKey: async (id: string, isActive: boolean) => {
      return await toggleApiKey({ id: id as any, isActive });
    },
  };
}

// ============ Credentials ============

export function useCredentials(type?: string) {
  const { isAuthenticated } = useAuth();
  
  const credentials = useQuery(
    api.settings.getCredentials,
    isAuthenticated ? { type } : "skip"
  );
  const createCredential = useMutation(api.settings.createCredential);
  const updateCredential = useMutation(api.settings.updateCredential);
  const deleteCredential = useMutation(api.settings.deleteCredential);
  const toggleCredential = useMutation(api.settings.toggleCredential);
  
  return {
    credentials: credentials || [],
    isLoading: credentials === undefined,
    createCredential: async (data: {
      type: string;
      name: string;
      value: string;
      description?: string;
    }) => {
      return await createCredential(data);
    },
    updateCredential: async (id: string, value: string) => {
      return await updateCredential({ id: id as any, value });
    },
    deleteCredential: async (id: string) => {
      return await deleteCredential({ id: id as any });
    },
    toggleCredential: async (id: string, isActive: boolean) => {
      return await toggleCredential({ id: id as any, isActive });
    },
  };
}

export function useActiveCredential(type: string) {
  const { isAuthenticated } = useAuth();
  
  const value = useQuery(
    api.settings.getActiveCredential,
    isAuthenticated ? { type } : "skip"
  );
  
  return {
    value,
    isLoading: value === undefined,
  };
}

// ============ Model Settings ============

export function useModelSettings() {
  const { isAuthenticated } = useAuth();
  
  const settings = useQuery(
    api.settings.getModelSettings,
    isAuthenticated ? {} : "skip"
  );
  const updateModelSettings = useMutation(api.settings.updateModelSettings);
  
  return {
    settings,
    isLoading: settings === undefined,
    updateModelSettings: async (model: string, provider: string) => {
      return await updateModelSettings({ model, provider });
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: add useSettings hooks for Convex settings access"
```

---

## Task 6: Integrate Migration in App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add migration hook to App**

Find the main App component and add the migration hook near the top of the component:

```typescript
import { useMigrateSettings } from "./hooks/useMigrateSettings";

// Inside the App component:
const { migrating, error: migrationError } = useMigrateSettings();

// Optionally show migration status in UI (can be removed later)
useEffect(() => {
  if (migrating) {
    console.log("Migrating settings to Convex...");
  }
  if (migrationError) {
    console.error("Settings migration error:", migrationError);
  }
}, [migrating, migrationError]);
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate settings migration hook in App"
```

---

## Task 7: Update ApiKeysSettings Component

**Files:**
- Modify: `src/components/ApiKeysSettings.tsx`

**Step 1: Read current implementation**

Run: `cat src/components/ApiKeysSettings.tsx | head -100`

**Step 2: Replace REST calls with Convex hooks**

Update the component to use `useApiKeys()` hook instead of REST API calls.

Key changes:
- Replace `useState` + `useEffect` + `fetch` with `useApiKeys()`
- Replace `fetch('/api/settings/api-keys', ...)` calls with hook methods
- Remove manual refetching (Convex auto-updates)

**Step 3: Commit**

```bash
git add src/components/ApiKeysSettings.tsx
git commit -m "refactor: use Convex hooks in ApiKeysSettings"
```

---

## Task 8: Update CredentialsSettings Component

**Files:**
- Modify: `src/components/CredentialsSettings.tsx`

**Step 1: Read current implementation**

Run: `cat src/components/CredentialsSettings.tsx | head -100`

**Step 2: Replace REST calls with Convex hooks**

Update the component to use `useCredentials()` hook.

**Step 3: Commit**

```bash
git add src/components/CredentialsSettings.tsx
git commit -m "refactor: use Convex hooks in CredentialsSettings"
```

---

## Task 9: Update Model Settings in AccountContent

**Files:**
- Modify: `src/components/settings/AccountContent.tsx`

**Step 1: Read current implementation**

Run: `grep -n "model" src/components/settings/AccountContent.tsx | head -20`

**Step 2: Replace with Convex hooks**

If model settings are managed in this file, update to use `useModelSettings()` hook.

**Step 3: Commit**

```bash
git add src/components/settings/AccountContent.tsx
git commit -m "refactor: use Convex hooks for model settings"
```

---

## Task 10: Test End-to-End

**Step 1: Start all servers**

Terminal 1: `npx convex dev`
Terminal 2: `npm run dev`

**Step 2: Test migration flow**

1. Log in with email OTP
2. Check browser console for "Migrating settings to Convex..."
3. Check browser console for "Settings migration complete"
4. Open Convex dashboard and verify data in tables

**Step 3: Test settings CRUD**

1. Go to Settings → API Keys
2. Create a new API key
3. Toggle it off/on
4. Delete it
5. Go to Credentials, repeat similar tests

**Step 4: Test real-time sync**

1. Open app in two browser tabs
2. Create a credential in one tab
3. Verify it appears in the other tab instantly

**Step 5: Fix any issues found**

```bash
git add -A
git commit -m "fix: resolve issues from end-to-end testing"
```

---

## Task 11: Cleanup Old Settings Code

**Files:**
- Modify: `server/index.ts` - remove settings routes
- Modify: `src/utils/api.js` - remove settings endpoints
- Keep: `server/routes/settings.ts` (can delete later)
- Keep: `server/routes/migrate.ts` (needed for migration)

**Step 1: Comment out settings routes in server/index.ts**

```typescript
// DEPRECATED: Settings moved to Convex
// app.use('/api/settings', authenticateToken, settingsRoutes);
```

**Step 2: Comment out settings endpoints in api.js**

Comment out the settings-related API endpoints.

**Step 3: Commit**

```bash
git add server/index.ts src/utils/api.js
git commit -m "chore: disable old settings routes after Convex migration"
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1 | Update Convex schema | 5 min |
| 2 | Create Convex settings functions | 15 min |
| 3 | Create Express migration endpoint | 10 min |
| 4 | Create migration hook | 5 min |
| 5 | Create useSettings hook | 10 min |
| 6 | Integrate migration in App | 5 min |
| 7 | Update ApiKeysSettings | 15 min |
| 8 | Update CredentialsSettings | 15 min |
| 9 | Update model settings | 10 min |
| 10 | Test end-to-end | 20 min |
| 11 | Cleanup old code | 5 min |

**Total estimated time: ~2 hours**

---

## References

- Design Document: `docs/plans/2025-02-17-convex-settings-migration-design.md`
- Convex Auth Setup: `docs/plans/2025-02-15-convex-auth-migration-design.md`
- [Convex Queries/Mutations](https://docs.convex.dev/functions)
- [Convex React Hooks](https://docs.convex.dev/client/react)
