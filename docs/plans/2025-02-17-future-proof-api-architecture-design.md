# Future-Proof API Architecture Design

**Date:** 2025-02-17  
**Status:** Approved  
**Author:** AI Assistant + User collaboration

## Overview

This document defines the target architecture for Claude Code UI's API layer, solving recurring issues with endpoint mismatches, type safety, and the hybrid Convex/Express setup.

## Problem Statement

Current issues:
1. Frontend calls endpoints that don't exist (returns HTML instead of JSON)
2. No compile-time safety for API contracts
3. Mixed Express routes with partial Convex migration
4. Unclear boundaries between user data and server operations

## Architecture

### High-Level Split

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Convex React hooks          │  tRPC React hooks                │
│  - useQuery(api.settings...) │  - trpc.runner.files.useQuery()  │
│  - useMutation(api.auth...)  │  - trpc.runner.cli.useSubscription() │
└──────────────┬───────────────┴──────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐    ┌─────────────────────────────────┐
│        Convex Cloud          │    │      Runner API (Express)       │
│  ────────────────────────    │    │  ─────────────────────────────  │
│  • Authentication            │    │  • tRPC Router                  │
│  • API Keys                  │    │    - files.read/write/list      │
│  • Credentials               │    │    - git.status/diff/commit     │
│  • Model Settings            │    │    - cli.spawn/abort            │
│  • User Preferences          │    │    - cli.stream (subscription)  │
│  • Future user data          │    │    - mcp.list/add/remove        │
│                              │    │    - env.get/set                │
└──────────────────────────────┘    └─────────────────────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────────────┐
                                │         Local System            │
                                │  • CLI tools (claude, cursor)   │
                                │  • Filesystem                   │
                                │  • Git repositories             │
                                │  • MCP config files             │
                                └─────────────────────────────────┘
```

### Boundary Rules

| Data Type | Location | Reason |
|-----------|----------|--------|
| User authentication | Convex | User-specific, needs sync across devices |
| API keys, credentials | Convex | User-specific settings |
| Model preferences | Convex | User-specific settings |
| File operations | Runner API | Requires local filesystem access |
| Git operations | Runner API | Requires local git CLI |
| CLI execution | Runner API | Requires spawning local processes |
| MCP configuration | Runner API | Stored in local config files |
| Environment variables | Runner API | Local to server |

## Technology Choices

### Convex (User Data)
- Already implemented for auth and settings
- Real-time sync built-in
- Type-safe via generated SDK

### tRPC (Runner API)
- Type-safe RPC layer
- HTTP for request/response operations
- WebSocket subscriptions for streaming (CLI output)
- Mounts on existing Express server
- Gradual migration support

### Transport Selection

| Operation | Transport | Reason |
|-----------|-----------|--------|
| CLI output streaming | WebSocket | Real-time, long-running, bidirectional |
| File read/write | HTTP | Request/response, cacheable |
| Git status/diff | HTTP | Request/response, stateless |
| File watching | WebSocket | Push notifications |
| CLI spawn/abort | HTTP | Command initiation |

## tRPC Router Structure

```typescript
export const appRouter = router({
  runner: router({
    files: router({
      read: procedure.input(z.object({ project: z.string(), path: z.string() })).query(),
      write: procedure.input(z.object({ project: z.string(), path: z.string(), content: z.string() })).mutation(),
      list: procedure.input(z.object({ project: z.string(), path: z.string().optional() })).query(),
      watch: procedure.subscription(),
    }),

    git: router({
      status: procedure.input(z.object({ project: z.string() })).query(),
      diff: procedure.input(z.object({ project: z.string(), file: z.string().optional() })).query(),
      commit: procedure.input(z.object({ project: z.string(), message: z.string() })).mutation(),
      branches: procedure.input(z.object({ project: z.string() })).query(),
      checkout: procedure.input(z.object({ project: z.string(), branch: z.string() })).mutation(),
      pull: procedure.input(z.object({ project: z.string() })).mutation(),
      push: procedure.input(z.object({ project: z.string() })).mutation(),
    }),

    cli: router({
      spawn: procedure.input(z.object({
        agent: z.enum(['claude', 'cursor', 'codex', 'pi']),
        project: z.string(),
        message: z.string(),
        model: z.string().optional(),
      })).mutation(),
      abort: procedure.input(z.object({ sessionId: z.string() })).mutation(),
      status: procedure.input(z.object({ agent: z.enum(['claude', 'cursor', 'codex', 'pi']) })).query(),
      stream: procedure.input(z.object({ sessionId: z.string() })).subscription(),
    }),

    mcp: router({
      list: procedure.input(z.object({ scope: z.enum(['user', 'project']), project: z.string().optional() })).query(),
      add: procedure.input(z.object({ name: z.string(), config: z.any() })).mutation(),
      remove: procedure.input(z.object({ name: z.string() })).mutation(),
    }),

    env: router({
      list: procedure.input(z.object({ project: z.string().optional() })).query(),
      set: procedure.input(z.object({ key: z.string(), value: z.string(), project: z.string().optional() })).mutation(),
      delete: procedure.input(z.object({ key: z.string(), project: z.string().optional() })).mutation(),
    }),

    projects: router({
      list: procedure.query(),
      sessions: procedure.input(z.object({ project: z.string() })).query(),
      addManual: procedure.input(z.object({ path: z.string() })).mutation(),
    }),
  }),
});

export type AppRouter = typeof appRouter;
```

## Frontend Integration

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

// Provider setup in main.tsx
<ConvexClientProvider>
  <TRPCProvider>
    <App />
  </TRPCProvider>
</ConvexClientProvider>

// Usage - Convex for user data
const settings = useQuery(api.settings.getModelSettings);

// Usage - tRPC for runner operations
const files = trpc.runner.files.list.useQuery({ project: 'myapp' });
const gitStatus = trpc.runner.git.status.useQuery({ project: 'myapp' });

// CLI streaming with WebSocket subscription
trpc.runner.cli.stream.useSubscription(
  { sessionId },
  { onData: (chunk) => handleChunk(chunk) }
);
```

## Folder Structure

```
claudecodeui/
├── convex/                          # Convex (user data)
│   ├── auth.ts
│   ├── schema.ts
│   └── settings.ts
│
├── server/
│   ├── trpc/                        # tRPC Runner API
│   │   ├── index.ts                 # tRPC init, context, auth
│   │   └── routers/
│   │       ├── _app.ts              # Root router
│   │       ├── files.ts
│   │       ├── git.ts
│   │       ├── cli.ts
│   │       ├── mcp.ts
│   │       ├── env.ts
│   │       └── projects.ts
│   │
│   ├── services/                    # Shared business logic
│   │   ├── cli-executor.ts
│   │   ├── file-service.ts
│   │   └── git-service.ts
│   │
│   ├── routes/                      # OLD Express routes (deprecated)
│   └── index.ts
│
├── src/
│   ├── lib/
│   │   └── trpc.ts                  # tRPC client
│   └── hooks/
│       ├── useSettings.ts           # Convex hooks
│       ├── useFiles.ts              # tRPC hooks
│       ├── useGit.ts
│       └── useCli.ts
```

## Authentication

```typescript
export async function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user = null;
  if (token) {
    user = await verifyConvexToken(token);
  }
  return { user };
}

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

## Error Handling

| Code | When |
|------|------|
| `UNAUTHORIZED` | No/invalid auth token |
| `NOT_FOUND` | File, project, session doesn't exist |
| `BAD_REQUEST` | Invalid input |
| `INTERNAL_SERVER_ERROR` | Unexpected error |
| `TIMEOUT` | CLI operation timed out |

## Migration Strategy

### Phase 0: Setup (Week 1)
- Install tRPC dependencies
- Create router scaffold
- Mount on Express alongside existing routes
- Setup frontend provider

### Phase 1: New Endpoints (Week 2)
- Implement missing endpoints in tRPC
- cli.status for all agents
- mcp endpoints

### Phase 2: File Operations (Week 3)
- Migrate files.read/write/list
- Update frontend components
- Remove old routes

### Phase 3: Git Operations (Week 4)
- Migrate git.* procedures
- Update GitExplorer
- Remove old routes

### Phase 4: CLI Operations (Week 5)
- Migrate cli.spawn/abort/stream
- Replace WebSocket chat with tRPC subscriptions
- Update ChatInterface

### Phase 5: Cleanup (Week 6)
- Remove deprecated Express routes
- Remove authenticatedFetch utility
- Update documentation

## Dependencies

```json
{
  "@trpc/server": "^11.0.0",
  "@trpc/client": "^11.0.0",
  "@trpc/react-query": "^11.0.0",
  "@tanstack/react-query": "^5.0.0",
  "ws": "^8.0.0"
}
```

## Benefits

1. **Compile-time safety** - TypeScript errors if frontend calls non-existent endpoint
2. **No HTML errors** - tRPC always returns proper JSON responses
3. **Gradual migration** - Old routes work alongside new tRPC
4. **Real-time streaming** - tRPC subscriptions for CLI output
5. **Clear boundaries** - Convex for user data, tRPC for runner operations
6. **Better DX** - Full autocomplete, type inference, error handling

## Related Documents

- `docs/plans/2025-02-17-convex-settings-migration-design.md` - Convex settings migration
- `docs/plans/2025-02-15-convex-auth-migration-design.md` - Convex auth migration
