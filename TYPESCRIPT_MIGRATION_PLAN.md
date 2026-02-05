# TypeScript Migration Plan for Claude Code UI

## Project Overview

- **Project**: Claude Code UI (`@siteboon/claude-code-ui`)
- **Type**: Full-stack React + Vite + Express application
- **Current State**: JavaScript (JS/JSX) codebase with ~30K+ lines
- **Build System**: Vite for client, Express for server
- **Database**: SQLite with better-sqlite3
- **Real-time**: WebSocket for chat and shell communication

---

## Key Files to Migrate (Priority Order)

### Critical Server Files
| File | Lines | Priority | Description |
|------|-------|----------|-------------|
| `server/index.js` | 1886 | 🔴 Critical | Main server entry point, WebSocket handlers |
| `server/routes/agent.js` | 4482 | 🔴 Critical | Agent SDK integration |
| `server/routes/taskmaster.js` | 6396 | 🔴 Critical | TaskMaster integration |
| `server/database/db.js` | ~400 | 🔴 Critical | Database operations |
| `server/middleware/auth.js` | ~100 | 🔴 Critical | Auth middleware |

### High Priority Server Files
| File | Lines | Priority | Description |
|------|-------|----------|-------------|
| `server/projects.js` | ~672 | 🟠 High | Project management |
| `server/routes/git.js` | ~389 | 🟠 High | Git operations |
| `server/claude-sdk.js` | ~239 | 🟠 High | Claude SDK integration |
| `server/cursor-cli.js` | ~95 | 🟠 High | Cursor CLI wrapper |
| `server/openai-codex.js` | ~97 | 🟠 High | Codex SDK integration |
| `server/pi-cli.js` | ~85 | 🟠 High | Pi CLI wrapper |

### Frontend Files
| File | Lines | Priority | Description |
|------|-------|----------|-------------|
| `src/components/ChatInterface.jsx` | 5877 | 🔴 Critical | Main chat component |
| `src/components/Sidebar.jsx` | 1564 | 🔴 Critical | Sidebar navigation |
| `src/components/MainContent.jsx` | ~1000 | 🔴 Critical | Main content area |
| `src/contexts/AuthContext.jsx` | 188 | 🟠 High | Auth state management |
| `src/utils/api.js` | ~100 | 🟠 High | API utility functions |

---

## Current Codebase Structure

```
claudecodeui/
├── server/                      # Backend (Express)
│   ├── index.js                # Main server file (~1886 lines)
│   ├── cli.js                  # CLI utility (~400 lines)
│   ├── database/
│   │   └── db.js               # Database operations (~400 lines)
│   ├── routes/                 # API routes (12 files)
│   ├── middleware/             # Auth middleware
│   ├── utils/                  # Utility functions
│   └── *.js                    # SDK integrations (Claude, Cursor, Codex, Pi)
├── src/                         # Frontend (React)
│   ├── components/             # React components (30+ files)
│   ├── contexts/               # React contexts (5 files)
│   ├── hooks/                  # Custom hooks (4 files)
│   ├── utils/                  # Utility functions
│   ├── i18n/                   # Internationalization
│   └── App.jsx                 # Main app component
├── shared/                      # Shared types/constants
│   └── modelConstants.js
├── tsconfig.json               # TypeScript config (existing, not enabled)
└── vite.config.js              # Vite configuration
```

---

## Phases of Migration

### Phase 1: Foundation Setup (Completed)

#### 1.1 TypeScript Configuration ✅
- [x] Update `tsconfig.json` with strict settings
- [x] Add missing `@types/*` packages
- [x] Create `src/types/` directory structure
- [x] Configure IDE settings for TypeScript

#### 1.2 Type Dependencies ✅
```bash
npm install --save-dev \
  @types/express \
  @types/ws \
  @types/better-sqlite3 \
  @types/node-fetch \
  @types/cors \
  @types/mime-types \
  @types/bcrypt \
  @types/jsonwebtoken
```

#### 1.3 Shared Type Definitions
Create `shared/types.ts`:
- User types
- Message types
- API response types
- WebSocket message types
- Database row types

---

### Phase 2: Database Layer Migration (Week 2)

#### 2.1 Database Types
Create `server/database/types.ts`:
```typescript
export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  git_name?: string;
  git_email?: string;
  created_at: string;
  last_login?: string;
  has_completed_onboarding: boolean;
  is_active: boolean;
}

export interface ApiKeyRow {
  id: number;
  user_id: number;
  key_name: string;
  api_key: string;
  created_at: string;
  last_used?: string;
  is_active: boolean;
}

export interface CredentialRow {
  id: number;
  user_id: number;
  credential_name: string;
  credential_type: string;
  credential_value: string;
  description?: string;
  created_at: string;
  is_active: boolean;
}
```

#### 2.2 Migrate `db.js` to `db.ts`
- [ ] Convert database functions with proper types
- [ ] Add return type annotations
- [ ] Type the database connection
- [ ] Type query results

#### 2.3 Migrate Middleware
- [ ] `server/middleware/auth.js` → `server/middleware/auth.ts`
- [ ] Type authentication functions
- [ ] Type token verification

---

### Phase 3: Server Routes Migration (Week 3-4)

#### 3.1 Route Type Definitions
Create `server/routes/types.ts`:
```typescript
export interface AuthRequest extends Request {
  user?: User;
  apiKey?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}
```

#### 3.2 Migrate Routes (Priority Order)
1. **Low Complexity** (Week 3):
   - [ ] `routes/cli-auth.js` → `routes/cli-auth.ts`
   - [ ] `routes/commands.js` → `routes/commands.ts`
   - [ ] `routes/mcp-utils.js` → `routes/mcp-utils.ts`

2. **Medium Complexity** (Week 4):
   - [ ] `routes/auth.js` → `routes/auth.ts`
   - [ ] `routes/user.js` → `routes/user.ts`
   - [ ] `routes/settings.js` → `routes/settings.ts`
   - [ ] `routes/git.js` → `routes/git.ts`

3. **High Complexity** (Week 4):
   - [ ] `routes/projects.js` → `routes/projects.ts`
   - [ ] `routes/cursor.js` → `routes/cursor.ts`
   - [ ] `routes/codex.js` → `routes/codex.ts`
   - [ ] `routes/pi.js` → `routes/pi.ts`
   - [ ] `routes/mcp.js` → `routes/mcp.ts`

4. **Critical** (Week 4):
   - [ ] `routes/agent.js` → `routes/agent.ts`
   - [ ] `routes/taskmaster.js` → `routes/taskmaster.ts`

#### 3.3 Server Entry Point
- [ ] Convert `server/index.js` → `server/index.ts`
- [ ] Type Express app and routes
- [ ] Type WebSocket handlers
- [ ] Type middleware

---

### Phase 4: Server Utilities Migration (Week 5)

#### 4.1 SDK Integrations
- [ ] `claude-sdk.js` → `claude-sdk.ts`
- [ ] `cursor-cli.js` → `cursor-cli.ts`
- [ ] `openai-codex.js` → `openai-codex.ts`
- [ ] `pi-cli.js` → `pi-cli.ts`
- [ ] `projects.js` → `projects.ts`

#### 4.2 Utility Functions
- [ ] `load-env.js` → `load-env.ts`
- [ ] `utils/gitConfig.js` → `utils/gitConfig.ts`
- [ ] `utils/mcp-detector.js` → `utils/mcp-detector.ts`
- [ ] `utils/commandParser.js` → `utils/commandParser.ts`

#### 4.3 CLI Tool
- [ ] Convert `server/cli.js` → `server/cli.ts`
- [ ] Type CLI argument parsing
- [ ] Type command handlers

---

### Phase 5: Frontend Type Definitions (Week 6)

#### 5.1 Shared Types
Create `src/types/`:
- [ ] `components.d.ts` - Component props
- [ ] `contexts.d.ts` - Context types
- [ ] `api.d.ts` - API response types
- [ ] `websocket.d.ts` - WebSocket message types

#### 5.2 Context Types
```typescript
// src/contexts/types.ts
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: object) => void;
  lastMessage: Message | null;
}
```

#### 5.3 Utility Functions
- [ ] `src/lib/utils.js` → `src/lib/utils.ts`
- [ ] `src/utils/api.js` → `src/utils/api.ts`
- [ ] `src/hooks/useLocalStorage.jsx` → `src/hooks/useLocalStorage.ts`
- [ ] `src/hooks/useAudioRecorder.js` → `src/hooks/useAudioRecorder.ts`
- [ ] `src/hooks/useVersionCheck.js` → `src/hooks/useVersionCheck.ts`

---

### Phase 6: Frontend Components Migration (Week 7-8)

#### 6.1 Migrate Components (Priority by Complexity)

**Week 7 - Simple Components**:
- [ ] `Button.jsx` → `Button.tsx`
- [ ] `Input.jsx` → `Input.tsx`
- [ ] `Badge.jsx` → `Badge.tsx`
- [ ] `Tooltip.jsx` → `Tooltip.tsx`
- [ ] `ScrollArea.jsx` → `ScrollArea.tsx`

**Week 7 - Utilities**:
- [ ] `useLocalStorage.jsx` → `useLocalStorage.ts`
- [ ] `ErrorBoundary.jsx` → `ErrorBoundary.tsx`

**Week 8 - Complex Components**:
- [ ] `ChatInterface.jsx` → `ChatInterface.tsx`
- [ ] `Sidebar.jsx` → `Sidebar.tsx`
- [ ] `MainContent.jsx` → `MainContent.tsx`
- [ ] `CommandMenu.jsx` → `CommandMenu.tsx`
- [ ] `CodeEditor.jsx` → `CodeEditor.tsx`

**Week 8 - Settings Components**:
- [ ] `Settings.jsx` → `Settings.tsx`
- [ ] `GitSettings.jsx` → `GitSettings.tsx`
- [ ] `CredentialsSettings.jsx` → `CredentialsSettings.tsx`
- [ ] `AgentListItem.jsx` → `AgentListItem.tsx`
- [ ] `McpServersContent.jsx` → `McpServersContent.tsx`

#### 6.2 Context Components
- [ ] `AuthContext.jsx` → `AuthContext.tsx`
- [ ] `ThemeContext.jsx` → `ThemeContext.tsx`
- [ ] `TasksSettingsContext.jsx` → `TasksSettingsContext.tsx`
- [ ] `TaskMasterContext.jsx` → `TaskMasterContext.tsx`
- [ ] `WebSocketContext.tsx` (already TypeScript)

---

### Phase 7: Configuration Migration (Week 9)

#### 7.1 Build Configuration
- [ ] Convert `vite.config.js` → `vite.config.ts`
- [ ] Type Vite configuration
- [ ] Add build type checks

#### 7.2 Type Configuration
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true
  }
}
```

#### 7.3 Package.json Updates
- [ ] Add `typecheck` script
- [ ] Add pre-commit hook for type checking

---

### Phase 8: Final Cleanup (Week 10)

#### 8.1 Remove JavaScript Files
- [ ] Delete `.js` files after `.ts` conversion
- [ ] Ensure no `.js` files remain in source

#### 8.2 Type Checking
- [ ] Run `tsc --noEmit` - fix all errors
- [ ] Remove `@ts-ignore` comments
- [ ] Add JSDoc comments to remaining JS

#### 8.3 Documentation
- [ ] Update README with TypeScript info
- [ ] Document type patterns used
- [ ] Add migration notes

#### 8.4 CI/CD Integration
- [ ] Add TypeScript check to CI pipeline
- [ ] Configure pre-commit hooks
- [ ] Add type coverage reporting

---

## Strategy Guidelines

### When Converting Files

1. **Start with Types, Not Implementation**
   - Define interfaces first
   - Then add function signatures
   - Finally implement

2. **Use `any` Sparingly**
   - Default to `unknown`
   - Use generics when possible
   - Define interfaces for external data

3. **React-Specific Patterns**
   ```typescript
   // Props interface
   interface MyComponentProps {
     title: string;
     onClick?: () => void;
     items: Item[];
   }

   // Typed context
   const MyContext = createContext<ContextType | undefined>(undefined);

   // Typed refs
   const myRef = useRef<HTMLDivElement>(null);
   ```

4. **Error Handling**
   ```typescript
   // Type-safe error handling
   try {
     const result = await fetchData();
     return result;
   } catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Unknown error';
     throw new Error(message);
   }
   ```

---

## Risk Mitigation

### High-Risk Areas
1. **WebSocket Handlers** - Complex message protocols
2. **Database Operations** - Schema changes
3. **Authentication** - Security implications
4. **SDK Integrations** - External API compatibility

### Mitigation Strategies
- Test each conversion
- Keep JS/TS compatibility during migration
- Use git branches for each phase
- Rollback plan ready

---

## Success Criteria

- [ ] All source files converted to TypeScript
- [ ] `tsc --noEmit` passes with 0 errors
- [ ] All tests pass
- [ ] Build completes successfully
- [ ] CI/CD includes type checking
- [ ] Documentation updated

---

## Notes

- This is a **gradual migration** - JS and TS can coexist
- Use `@ts-check` in JS files for incremental checking
- Consider using `// @ts-nocheck` for files that need more work
- Type definitions can be added incrementally

---

*Last Updated: February 5, 2026*
---

## Phase 1 Completion Status (Completed)

### Created Files

#### TypeScript Configuration
- `tsconfig.json` - Updated with strict settings
- `server/tsconfig.json` - Node.js server config

#### Type Dependencies Installed
- `@types/express`
- `@types/ws`
- `@types/better-sqlite3`
- `@types/node-fetch`
- `@types/cors`
- `@types/mime-types`
- `@types/bcrypt`
- `@types/jsonwebtoken`

#### Shared Type Definitions
- `shared/types.ts` - Shared interfaces for client/server
- `server/database/types.ts` - Database operation types
- `server/middleware/types.ts` - Auth/middleware types
- `server/routes/types.ts` - Route handler types
- `src/types/components.d.ts` - React component props
- `src/types/contexts.d.ts` - Context types
- `src/types/api.d.ts` - API response/request types
- `src/types/websocket.d.ts` - WebSocket message types
- `src/vite-env.d.ts` - Vite environment types

#### IDE Configuration
- `.vscode/settings.json` - VS Code TypeScript/ESLint settings

### TypeScript Configuration Details

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "checkJs": true,
    "allowJs": true
  }
}
```

### Current Status

- Phase 1: ✅ Completed
- Phase 2: ⏳ Ready to start (Database Layer Migration)

### Next Steps (Phase 2)

1. Convert `server/database/db.js` to `server/database/db.ts`
2. Convert `server/middleware/auth.js` to `server/middleware/auth.ts`
3. Run `npm run typecheck` to verify no new errors

---

## Phase 2 Progress (In Progress)

### Completed Type Definitions

#### Database Types
- `server/database/types.ts` - Database operation interfaces
- `server/database/db.ts` - Converted from `db.js` with types

#### Middleware Types
- `server/middleware/types.ts` - Auth middleware interfaces
- `server/middleware/auth.ts` - Converted from `auth.js` with types

#### Shared Types
- `shared/types.ts` - Shared interfaces for client/server

### Type Definitions Created

| File | Description |
|------|-------------|
| `server/database/types.ts` | Database interfaces (User, ApiKey, Credential) |
| `server/database/db.ts` | Type-safe database operations |
| `server/middleware/types.ts` | Auth middleware interfaces |
| `server/middleware/auth.ts` | Type-safe authentication middleware |
| `server/routes/types.ts` | Route handler types |
| `shared/types.ts` | Shared types (User, Project, Message, WebSocket) |
| `src/types/components.d.ts` | React component props |
| `src/types/contexts.d.ts` | Context types |
| `src/types/api.d.ts` | API types |
| `src/types/websocket.d.ts` | WebSocket types |

### TypeScript Errors (Expected)

Current typecheck shows ~200 errors - all from JS files that need conversion:
- `src/App.jsx` - Main app component (needs conversion)
- `src/components/ApiKeysSettings.jsx` - API keys component (needs conversion)

These are expected - Phase 2 continues with converting remaining files.

### Next Steps

1. Continue converting server files to TypeScript
2. Convert `server/routes/auth.js` → `server/routes/auth.ts`
3. Convert remaining route files
4. Convert client components one by one
5. Run `tsc --noEmit` after each conversion
6. Fix type errors incrementally

---

## Summary

**Phase 1**: ✅ Completed (Configuration, Type Definitions)
**Phase 2**: 🔄 In Progress (Server Migration)
**Phase 3**: ⏳ Upcoming (Route Migration)
**Phase 4**: ⏳ Upcoming (Frontend Migration)
