# Convex Settings Migration Design

**Date:** 2025-02-17  
**Status:** Approved  
**Scope:** Migrate API Keys, Credentials, and Model Settings from SQLite to Convex

---

## Overview

Migrate all user settings from the Express/SQLite backend to Convex, completing the gradual migration started with authentication.

### Goals

- Move API keys, credentials, and model settings to Convex
- Store values directly in Convex (no additional encryption)
- One-time migration from existing SQLite data
- Multi-user ready (settings tied to Convex user ID)
- Leverage Convex real-time sync across devices/tabs

### Non-Goals

- Client-side encryption of sensitive values (Convex security is sufficient)
- Backward compatibility after migration (one-time migration, then Convex only)
- Migrating other data (projects, sessions) - future work

---

## Architecture

### Approach: Convex Tables with Direct Frontend Access

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ApiKeysSettings │  │ CredentialsSett │  │ ModelSettings   │  │
│  │ useQuery/       │  │ useQuery/       │  │ useQuery/       │  │
│  │ useMutation     │  │ useMutation     │  │ useMutation     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │ Convex React Client
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Convex Backend                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │ apiKeys table  │  │ credentials    │  │ modelSettings     │  │
│  │                │  │ table          │  │ table             │  │
│  └────────────────┘  └────────────────┘  └───────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ settings.ts - queries and mutations                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Convex Schema

```typescript
// convex/schema.ts

// API Keys - for external access to Claude Code UI
apiKeys: defineTable({
  userId: v.id("users"),        // Convex auth user ID
  name: v.string(),             // Key name/label
  key: v.string(),              // The actual API key
  isActive: v.boolean(),        // Enable/disable
  createdAt: v.number(),        // Timestamp
})
  .index("by_user", ["userId"])
  .index("by_key", ["key"]),

// Credentials - stored secrets (Anthropic key, OpenAI key, etc.)
credentials: defineTable({
  userId: v.id("users"),
  type: v.string(),             // e.g., "anthropic", "openai", "github"
  name: v.string(),             // Display name
  value: v.string(),            // The secret value
  description: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_type", ["userId", "type"]),

// Model Settings - user preferences
modelSettings: defineTable({
  userId: v.id("users"),
  model: v.string(),            // e.g., "claude-3-opus"
  provider: v.string(),         // e.g., "anthropic"
  updatedAt: v.number(),
})
  .index("by_user", ["userId"]),
```

---

## Convex Functions

### API Keys

| Function | Type | Description |
|----------|------|-------------|
| `getApiKeys` | Query | List all user's API keys (masked values) |
| `validateApiKey(key)` | Query | Check if key is valid (unauthenticated) |
| `createApiKey(name)` | Mutation | Generate and store new API key |
| `deleteApiKey(id)` | Mutation | Remove API key |
| `toggleApiKey(id, isActive)` | Mutation | Enable/disable key |

### Credentials

| Function | Type | Description |
|----------|------|-------------|
| `getCredentials(type?)` | Query | List credentials (optionally by type) |
| `getActiveCredential(type)` | Query | Get active credential value for a type |
| `createCredential(...)` | Mutation | Create new credential |
| `updateCredential(id, value)` | Mutation | Update credential value |
| `deleteCredential(id)` | Mutation | Delete credential |
| `toggleCredential(id, isActive)` | Mutation | Enable/disable credential |

### Model Settings

| Function | Type | Description |
|----------|------|-------------|
| `getModelSettings` | Query | Get user's model preferences |
| `updateModelSettings(model, provider)` | Mutation | Update preferences |

---

## Migration Strategy

### Flow

```
User logs in (Convex auth)
         │
         ▼
Check Convex migration flag
         │
         ├─── Already migrated? → DONE
         │
         ▼ Not migrated
Call Express GET /api/migrate/settings
(returns SQLite data as JSON)
         │
         ▼
Call Convex migrateSettings(data)
(stores in Convex tables)
         │
         ▼
Set migration flag = complete
```

### Components

1. **Express endpoint** `GET /api/migrate/settings`
   - Reads current SQLite data (apiKeys, credentials, modelSettings)
   - Returns JSON payload
   - No auth needed (uses existing SQLite user)

2. **Convex mutation** `migrateSettings(data)`
   - Receives SQLite data
   - Stores in Convex tables under current user ID
   - Sets `migrationComplete` flag on user

3. **Frontend hook** `useMigrateSettings()`
   - Runs once after login
   - Checks if migration needed
   - Orchestrates the flow

---

## Frontend Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ApiKeysSettings.tsx` | Replace REST calls with Convex hooks |
| `src/components/CredentialsSettings.tsx` | Replace REST calls with Convex hooks |
| `src/components/settings/AccountContent.tsx` | Use Convex for model settings |
| `src/utils/api.js` | Remove settings-related endpoints |

### New Files

| File | Purpose |
|------|---------|
| `convex/settings.ts` | Queries and mutations for settings |
| `src/hooks/useSettings.ts` | Custom hooks wrapping Convex settings |
| `src/hooks/useMigrateSettings.ts` | Migration orchestration hook |

### Hook Pattern

```tsx
// Before (REST)
const [apiKeys, setApiKeys] = useState([]);
useEffect(() => {
  fetch('/api/settings/api-keys').then(...)
}, []);

// After (Convex)
const apiKeys = useQuery(api.settings.getApiKeys);
const createKey = useMutation(api.settings.createApiKey);
```

---

## Cleanup (After Migration Verified)

### Remove

- `server/routes/settings.ts`
- Settings routes from `server/index.ts`
- `apiKeysDb`, `credentialsDb` from `server/database/db.ts`
- Settings endpoints from `src/utils/api.js`

### Keep Temporarily

- `GET /api/migrate/settings` - needed for migration

### SQLite Tables

- Keep `api_keys`, `user_credentials` tables as migration source
- Can drop after all users migrated

---

## Approval

- [x] Schema Design
- [x] Convex Functions
- [x] Migration Strategy
- [x] Frontend Changes
- [x] Cleanup Plan
