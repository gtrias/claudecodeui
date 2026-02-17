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
