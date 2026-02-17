import express from 'express';
import type { Response } from 'express';
import { authenticateConvex, ConvexAuthRequest } from '../middleware/convex-auth.js';

const router = express.Router();

// All user endpoints now use Convex directly from frontend
// These routes are kept for backward compatibility but marked deprecated

// GET /api/user/profile - Get current user profile
router.get('/profile', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query userProfile:getProfile directly',
    deprecated: true,
    convexUserId: req.convexUserId
  });
});

// PUT /api/user/profile - Update current user profile
router.put('/profile', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutations directly',
    deprecated: true
  });
});

// DELETE /api/user/profile - Delete current user profile
router.delete('/profile', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutations directly',
    deprecated: true
  });
});

// GET /api/user/git-config - Get git configuration
router.get('/git-config', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query userProfile:getGitConfig directly',
    deprecated: true
  });
});

// POST /api/user/git-config - Update git configuration
router.post('/git-config', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation userProfile:updateGitConfig directly',
    deprecated: true
  });
});

// GET /api/user/onboarding-status - Get onboarding status
router.get('/onboarding-status', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query userProfile:hasCompletedOnboarding directly',
    deprecated: true
  });
});

// POST /api/user/complete-onboarding - Mark onboarding as complete
router.post('/complete-onboarding', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation userProfile:completeOnboarding directly',
    deprecated: true
  });
});

export default router;
