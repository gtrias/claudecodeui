import express from 'express';
import { userDb } from '../database/db.js';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface User {
  id: number;
  username: string;
  created_at: string;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar_url?: string;
}

// GET /api/user/profile - Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const user = userDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
      } as User,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile - Update current user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { username, email, avatar_url } = req.body as UpdateUserRequest;

    if (!username && !email && !avatar_url) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    userDb.updateUser(userId, { username, email, avatar_url });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// DELETE /api/user/profile - Delete current user profile
router.delete('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    userDb.deleteUser(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user profile:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete user profile' });
  }
});

// GET /api/user/onboarding-status - Get onboarding status
router.get('/onboarding-status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hasCompletedOnboarding = userDb.hasCompletedOnboarding(userId);
    res.json({ hasCompletedOnboarding });
  } catch (error) {
    console.error('Error fetching onboarding status:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

// POST /api/user/complete-onboarding - Mark onboarding as complete
router.post('/complete-onboarding', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    userDb.completeOnboarding(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;
export {
  User,
  UpdateUserRequest,
};