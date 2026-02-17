# tRPC Runner API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement type-safe tRPC Runner API alongside existing Express routes, enabling gradual migration with compile-time safety.

**Architecture:** tRPC router mounted on Express at `/trpc`, with HTTP procedures for request/response and WebSocket subscriptions for streaming. Services layer shared between old and new routes.

**Tech Stack:** tRPC v11, @tanstack/react-query, Zod, ws (WebSocket)

---

## Phase 0: Setup

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install tRPC and related packages**

Run:
```bash
npm install @trpc/server@^11.0.0 @trpc/client@^11.0.0 @trpc/react-query@^11.0.0 @tanstack/react-query@^5.0.0 ws
npm install -D @types/ws
```

**Step 2: Verify installation**

Run: `npm ls @trpc/server`
Expected: Shows @trpc/server@11.x.x

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tRPC and react-query dependencies"
```

---

### Task 2: Create tRPC Server Setup

**Files:**
- Create: `server/trpc/index.ts`
- Create: `server/trpc/context.ts`

**Step 1: Create tRPC context**

```typescript
// server/trpc/context.ts
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
```

**Step 2: Create tRPC initialization**

```typescript
// server/trpc/index.ts
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
        path: error.message,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Authenticated procedure
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now non-null
    },
  });
});

export const authedProcedure = t.procedure.use(isAuthed);
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to trpc files

**Step 4: Commit**

```bash
git add server/trpc/
git commit -m "feat: add tRPC server initialization and context"
```

---

### Task 3: Create Root Router Scaffold

**Files:**
- Create: `server/trpc/routers/_app.ts`
- Create: `server/trpc/routers/health.ts`

**Step 1: Create health router for testing**

```typescript
// server/trpc/routers/health.ts
import { z } from 'zod';
import { router, publicProcedure } from '../index.js';

export const healthRouter = router({
  check: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      transport: 'trpc',
    };
  }),
  
  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return { echo: input.message };
    }),
});
```

**Step 2: Create root app router**

```typescript
// server/trpc/routers/_app.ts
import { router } from '../index.js';
import { healthRouter } from './health.js';

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add server/trpc/routers/
git commit -m "feat: add tRPC root router scaffold with health check"
```

---

### Task 4: Mount tRPC on Express

**Files:**
- Modify: `server/index.ts`

**Step 1: Add tRPC Express adapter imports**

Add after other imports in `server/index.ts`:

```typescript
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc/routers/_app.js';
import { createContext } from './trpc/context.js';
```

**Step 2: Mount tRPC middleware**

Add after the API routes, before the SPA fallback:

```typescript
  // tRPC API - mounted alongside REST routes
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`tRPC error on ${path}:`, error.message);
      },
    })
  );
```

**Step 3: Test the endpoint**

Run: `curl http://localhost:3001/trpc/health.check`
Expected: `{"result":{"data":{"status":"ok","timestamp":"...","transport":"trpc"}}}`

**Step 4: Commit**

```bash
git add server/index.ts
git commit -m "feat: mount tRPC router on Express at /trpc"
```

---

### Task 5: Create tRPC React Client

**Files:**
- Create: `src/lib/trpc.ts`
- Create: `src/lib/TRPCProvider.tsx`

**Step 1: Create tRPC client**

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

**Step 2: Create tRPC provider**

```typescript
// src/lib/TRPCProvider.tsx
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser - use relative URL
    return '';
  }
  return 'http://localhost:3001';
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          headers() {
            // Get auth token from storage
            const token = localStorage.getItem('convex_auth_token');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck 2>&1 | grep -E "trpc|TRPC" | head -5`
Expected: No errors (or pre-existing unrelated errors)

**Step 4: Commit**

```bash
git add src/lib/
git commit -m "feat: add tRPC React client and provider"
```

---

### Task 6: Integrate TRPCProvider in App

**Files:**
- Modify: `src/main.tsx`

**Step 1: Import and wrap with TRPCProvider**

Add import:
```typescript
import { TRPCProvider } from './lib/TRPCProvider';
```

Wrap the app (inside ConvexClientProvider):
```typescript
<ConvexClientProvider>
  <TRPCProvider>
    {/* existing app content */}
  </TRPCProvider>
</ConvexClientProvider>
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: integrate TRPCProvider in app"
```

---

## Phase 1: CLI Status Endpoints

### Task 7: Create CLI Router

**Files:**
- Create: `server/trpc/routers/cli.ts`
- Modify: `server/trpc/routers/_app.ts`

**Step 1: Create CLI router with status procedure**

```typescript
// server/trpc/routers/cli.ts
import { z } from 'zod';
import { spawn } from 'child_process';
import { router, authedProcedure } from '../index.js';

const AgentEnum = z.enum(['claude', 'cursor', 'codex', 'pi']);
type Agent = z.infer<typeof AgentEnum>;

interface CliStatus {
  authenticated: boolean;
  email: string | null;
  error: string | null;
  installed: boolean;
}

async function checkCliStatus(command: string): Promise<CliStatus> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(command, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            installed: true,
            authenticated: true, // Simplified - CLI exists and runs
            email: null,
            error: null,
          });
        } else {
          resolve({
            installed: true,
            authenticated: false,
            email: null,
            error: stderr || `Exit code ${code}`,
          });
        }
      });

      proc.on('error', () => {
        resolve({
          installed: false,
          authenticated: false,
          email: null,
          error: `${command} CLI not found`,
        });
      });
    } catch (err) {
      resolve({
        installed: false,
        authenticated: false,
        email: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}

export const cliRouter = router({
  status: authedProcedure
    .input(z.object({ agent: AgentEnum }))
    .query(async ({ input }) => {
      return checkCliStatus(input.agent);
    }),
    
  statusAll: authedProcedure.query(async () => {
    const agents: Agent[] = ['claude', 'cursor', 'codex', 'pi'];
    const results = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        status: await checkCliStatus(agent),
      }))
    );
    return Object.fromEntries(results.map((r) => [r.agent, r.status]));
  }),
});
```

**Step 2: Add to root router**

Update `server/trpc/routers/_app.ts`:
```typescript
import { router } from '../index.js';
import { healthRouter } from './health.js';
import { cliRouter } from './cli.js';

export const appRouter = router({
  health: healthRouter,
  cli: cliRouter,
});

export type AppRouter = typeof appRouter;
```

**Step 3: Test the endpoint**

Run: `curl "http://localhost:3001/trpc/cli.status?input=%7B%22agent%22%3A%22claude%22%7D"`
Expected: JSON with authenticated/installed status

**Step 4: Commit**

```bash
git add server/trpc/routers/
git commit -m "feat: add tRPC CLI status endpoints"
```

---

### Task 8: Create useCli Hook

**Files:**
- Create: `src/hooks/useCli.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/useCli.ts
import { trpc } from '../lib/trpc';

export type Agent = 'claude' | 'cursor' | 'codex' | 'pi';

export function useCliStatus(agent: Agent) {
  return trpc.cli.status.useQuery(
    { agent },
    {
      staleTime: 30000, // Cache for 30 seconds
      retry: 1,
    }
  );
}

export function useAllCliStatus() {
  return trpc.cli.statusAll.useQuery(undefined, {
    staleTime: 30000,
    retry: 1,
  });
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck 2>&1 | grep useCli`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useCli.ts
git commit -m "feat: add useCli hooks for CLI status"
```

---

### Task 9: Update Settings Component to Use tRPC

**Files:**
- Modify: `src/components/Settings.tsx`

**Step 1: Replace authenticatedFetch calls with tRPC**

Find the `checkClaudeAuth`, `checkCursorAuth`, `checkCodexAuth`, `checkPiAuth` functions and replace with:

```typescript
// Add import at top
import { useCliStatus } from '../hooks/useCli';

// Inside the component, replace the useState + useEffect for auth status with:
const claudeStatus = useCliStatus('claude');
const cursorStatus = useCliStatus('cursor');
const codexStatus = useCliStatus('codex');
const piStatus = useCliStatus('pi');

// Map to existing AuthStatus interface
const claudeAuthStatus: AuthStatus = {
  authenticated: claudeStatus.data?.authenticated ?? false,
  email: claudeStatus.data?.email ?? null,
  loading: claudeStatus.isLoading,
  error: claudeStatus.data?.error ?? null,
};
// ... same for cursor, codex, pi
```

**Step 2: Remove old fetch functions**

Delete or comment out:
- `checkClaudeAuth` function
- `checkCursorAuth` function
- `checkCodexAuth` function
- `checkPiAuth` function
- Related useEffect calls

**Step 3: Test in browser**

Expected: Settings page loads without "Unexpected token '<'" errors

**Step 4: Commit**

```bash
git add src/components/Settings.tsx src/hooks/useCli.ts
git commit -m "refactor: use tRPC for CLI auth status in Settings"
```

---

## Phase 2: MCP Endpoints

### Task 10: Create MCP Router

**Files:**
- Create: `server/trpc/routers/mcp.ts`
- Modify: `server/trpc/routers/_app.ts`

**Step 1: Create MCP router**

```typescript
// server/trpc/routers/mcp.ts
import { z } from 'zod';
import { router, authedProcedure } from '../index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

const McpServerSchema = z.object({
  name: z.string(),
  type: z.enum(['stdio', 'http']).default('stdio'),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  url: z.string().optional(),
});

type McpServer = z.infer<typeof McpServerSchema>;

async function getMcpConfigPath(agent: string): Promise<string> {
  const home = os.homedir();
  switch (agent) {
    case 'claude':
      return path.join(home, '.claude', 'mcp_servers.json');
    case 'cursor':
      return path.join(home, '.cursor', 'mcp.json');
    case 'codex':
      return path.join(home, '.codex', 'mcp.json');
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}

async function readMcpConfig(agent: string): Promise<McpServer[]> {
  try {
    const configPath = await getMcpConfigPath(agent);
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    // Handle different config formats
    if (config.mcpServers) {
      return Object.entries(config.mcpServers).map(([name, cfg]: [string, any]) => ({
        name,
        ...cfg,
      }));
    }
    if (Array.isArray(config)) {
      return config;
    }
    return [];
  } catch (err) {
    // Config doesn't exist yet
    return [];
  }
}

export const mcpRouter = router({
  list: authedProcedure
    .input(z.object({
      agent: z.enum(['claude', 'cursor', 'codex']),
    }))
    .query(async ({ input }) => {
      const servers = await readMcpConfig(input.agent);
      return { servers };
    }),
});
```

**Step 2: Add to root router**

Update `server/trpc/routers/_app.ts`:
```typescript
import { mcpRouter } from './mcp.js';

export const appRouter = router({
  health: healthRouter,
  cli: cliRouter,
  mcp: mcpRouter,
});
```

**Step 3: Test the endpoint**

Run: `curl "http://localhost:3001/trpc/mcp.list?input=%7B%22agent%22%3A%22claude%22%7D"`
Expected: JSON with servers array

**Step 4: Commit**

```bash
git add server/trpc/routers/
git commit -m "feat: add tRPC MCP server endpoints"
```

---

### Task 11: Create useMcp Hook and Update Settings

**Files:**
- Create: `src/hooks/useMcp.ts`
- Modify: `src/components/Settings.tsx`

**Step 1: Create the hook**

```typescript
// src/hooks/useMcp.ts
import { trpc } from '../lib/trpc';

export type McpAgent = 'claude' | 'cursor' | 'codex';

export function useMcpServers(agent: McpAgent) {
  return trpc.mcp.list.useQuery(
    { agent },
    {
      staleTime: 10000,
      retry: 1,
    }
  );
}
```

**Step 2: Update Settings to use tRPC for MCP**

Replace `fetchCursorMcpServers` and `fetchCodexMcpServers` with:

```typescript
// Add import
import { useMcpServers } from '../hooks/useMcp';

// Inside component
const cursorMcp = useMcpServers('cursor');
const codexMcp = useMcpServers('codex');

// Use data
const cursorMcpServers = cursorMcp.data?.servers ?? [];
const codexMcpServers = codexMcp.data?.servers ?? [];
```

**Step 3: Remove old fetch functions**

Delete `fetchCursorMcpServers` and `fetchCodexMcpServers` functions.

**Step 4: Commit**

```bash
git add src/hooks/useMcp.ts src/components/Settings.tsx
git commit -m "refactor: use tRPC for MCP servers in Settings"
```

---

## Phase 3: Files Router (Future)

### Task 12: Create Files Router Scaffold

**Files:**
- Create: `server/trpc/routers/files.ts`
- Create: `server/services/file-service.ts`

*(Detailed implementation to follow in next iteration)*

---

## Phase 4: Git Router (Future)

### Task 13: Create Git Router Scaffold

**Files:**
- Create: `server/trpc/routers/git.ts`
- Create: `server/services/git-service.ts`

*(Detailed implementation to follow in next iteration)*

---

## Phase 5: Projects Router (Future)

### Task 14: Create Projects Router Scaffold

*(Detailed implementation to follow in next iteration)*

---

## Summary

This plan covers:
- **Phase 0 (Tasks 1-6):** Setup tRPC infrastructure
- **Phase 1 (Tasks 7-9):** CLI status endpoints (fix current errors)
- **Phase 2 (Tasks 10-11):** MCP endpoints (fix current errors)
- **Phases 3-5:** Future migration of files, git, projects

After completing Tasks 1-11, the current "HTML instead of JSON" errors will be resolved, and the foundation for gradual migration will be in place.
