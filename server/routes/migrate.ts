import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

// GET /api/migrate/settings - Export SQLite settings for Convex migration
// NOTE: SQLite has been removed. This endpoint returns empty data.
// Migration to Convex should have already been completed for existing users.
router.get('/settings', async (req: Request, res: Response) => {
  console.log('[migrate/settings] Handler called - SQLite removed, returning empty data');
  
  res.json({
    success: true,
    data: {
      apiKeys: [],
      credentials: [],
      modelSettings: undefined,
    },
    message: 'SQLite has been removed. Data is now stored in Convex.',
  });
});

export default router;
