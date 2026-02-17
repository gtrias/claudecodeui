import { router } from '../index.js';
import { healthRouter } from './health.js';
import { cliRouter } from './cli.js';
import { mcpRouter } from './mcp.js';

export const appRouter = router({
  health: healthRouter,
  cli: cliRouter,
  mcp: mcpRouter,
});

export type AppRouter = typeof appRouter;
