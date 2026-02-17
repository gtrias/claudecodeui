import { router } from '../index.js';
import { healthRouter } from './health.js';
import { cliRouter } from './cli.js';

export const appRouter = router({
  health: healthRouter,
  cli: cliRouter,
});

export type AppRouter = typeof appRouter;
