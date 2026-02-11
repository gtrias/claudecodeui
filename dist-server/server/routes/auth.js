import express from 'express';
import bcrypt from 'bcrypt';
import { userDb, db } from '../database/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
const router = express.Router();
// Check auth status and setup requirements
router.get('/status', async (req, res) => {
    try {
        const hasUsers = await userDb.hasUsers();
        res.json({
            needsSetup: !hasUsers,
            isAuthenticated: false // Will be overridden by frontend if token exists
        });
    }
    catch (error) {
        console.error('Auth status error:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User registration (setup) - only allowed if no users exist
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({ error: 'Username must be at least 3 characters, password at least 6 characters' });
        }
        // Use a transaction to prevent race conditions
        db.prepare('BEGIN').run();
        try {
            // Check if users already exist (only allow one user)
            const hasUsers = userDb.hasUsers();
            if (hasUsers) {
                db.prepare('ROLLBACK').run();
                return res.status(403).json({ error: 'User already exists. This is a single-user system.' });
            }
            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            // Create user
            userDb.createUser(username, passwordHash);
            db.prepare('COMMIT').run();
            res.status(201).json({ message: 'User created successfully' });
        }
        catch (error) {
            db.prepare('ROLLBACK').run();
            console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Get user by username
        const user = userDb.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = generateToken(user.id);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
            }
        });
    }
    catch (error) {
        console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Login failed' });
    }
});
// User logout
router.post('/logout', authenticateToken, (req, res) => {
    try {
        // Token is invalidated on the client side
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});
// Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const userId = req.userId;
        const user = userDb.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            username: user.username,
            created_at: user.created_at,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// Update user password
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }
        // Get user
        const user = userDb.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        // Update password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        userDb.updatePassword(userId, passwordHash);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Password update error:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Password update failed' });
    }
});
// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        userDb.deleteUser(userId);
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
export default router;
