import express from 'express';
import { userDb } from '../database/db.js';
const router = express.Router();
// GET /api/user/profile - Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
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
            },
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
// PUT /api/user/profile - Update current user profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { username, email, avatar_url } = req.body;
        if (!username && !email && !avatar_url) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        userDb.updateUser(userId, { username, email, avatar_url });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating user profile:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});
// DELETE /api/user/profile - Delete current user profile
router.delete('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        userDb.deleteUser(userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting user profile:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to delete user profile' });
    }
});
export default router;
