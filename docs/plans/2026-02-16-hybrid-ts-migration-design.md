# Hybrid TypeScript Migration Design

**Date:** 2026-02-16  
**Status:** Implemented

## Problem

The TypeScript "migration" was actually a destructive rewrite that removed 50-95% of functionality from core server files:

| File | Old JS Lines | New TS Lines | Loss |
|------|-------------|--------------|------|
| projects.js | 2,005 | 542 | 73% |
| taskmaster.js | 1,962 | 96 | 95% |
| git.js | 1,127 | 325 | 71% |
| commands.js | 521 | 226 | 57% |
| mcp.js | 551 | 273 | 50% |

This caused cascading failures:
- Projects not loading
- Sessions not loading
- TaskMaster endpoints returning HTML (404)
- Commands endpoints failing
- Login not persisting

## Solution: Hybrid Approach

Instead of a complete TypeScript rewrite, we adopted a hybrid approach:

1. **Restore working JavaScript files** from commit `b84a4c2`
2. **Delete broken TypeScript stubs** that lost functionality
3. **Keep server/index.ts as TypeScript** (it was working)
4. **Migrate incrementally** over time

## Files Restored

From commit `b84a4c2`:
- `server/projects.js` - Core project/session discovery
- `server/routes/taskmaster.js` - TaskMaster integration
- `server/routes/commands.js` - Slash commands
- `server/routes/git.js` - Git panel functionality
- `server/routes/mcp.js` - MCP server configuration
- `server/utils/mcp-detector.js` - MCP detection utility
- `server/utils/taskmaster-websocket.js` - TaskMaster WebSocket

## Files Deleted

Broken TypeScript stubs:
- `server/projects.ts`
- `server/routes/taskmaster.ts`
- `server/routes/commands.ts`
- `server/routes/git.ts`
- `server/routes/mcp.ts`
- `server/utils/mcp-detector.ts`
- `server/utils/taskmaster-websocket.ts`

## Changes to index.ts

- Removed `archiveSession` and `unarchiveSession` imports (not in old code)
- Session delete now uses `deleteSession` directly
- Imports remain `.js` extension (Node resolves correctly)

## Future Migration Path

For incremental TypeScript migration:

1. Pick one JS file at a time
2. Add TypeScript types as JSDoc comments first
3. Convert to `.ts` when types are complete
4. Test thoroughly before moving to next file
5. Prioritize files by complexity (start simple)

Suggested order:
1. `mcp-detector.js` (smallest)
2. `taskmaster-websocket.js` (small)
3. `commands.js` (medium)
4. `mcp.js` (medium)
5. `git.js` (large)
6. `taskmaster.js` (large)
7. `projects.js` (largest)

## Verification

After implementation, tested endpoints:
- ✅ `/api/health` - Working
- ✅ `/api/projects` - Returns 9 projects
- ✅ `/api/projects/:name/sessions` - Returns sessions
- ✅ `/api/taskmaster/installation-status` - Working
- ✅ `/api/commands/list` (POST) - Returns commands
