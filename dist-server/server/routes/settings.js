import express from 'express';
import { apiKeysDb, credentialsDb } from '../database/db.js';
const router = express.Router();
// ===============================
// API Keys Management
// ===============================
// Get all API keys for the authenticated user
router.get('/api-keys', async (req, res) => {
    try {
        const userId = req.user?.id;
        const apiKeys = apiKeysDb.getApiKeys(userId);
        // Don't send the full API key in the list for security
        const sanitizedKeys = apiKeys.map((key) => ({
            ...key,
            api_key: key.api_key.substring(0, 10) + '...',
        }));
        res.json({ apiKeys: sanitizedKeys });
    }
    catch (error) {
        console.error('Error fetching API keys:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});
// Create a new API key
router.post('/api-keys', async (req, res) => {
    try {
        const { keyName } = req.body;
        const userId = req.user?.id;
        if (!keyName || !keyName.trim()) {
            return res.status(400).json({ error: 'Key name is required' });
        }
        const result = apiKeysDb.createApiKey(userId, keyName.trim());
        res.json({
            success: true,
            apiKey: result,
        });
    }
    catch (error) {
        console.error('Error creating API key:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to create API key' });
    }
});
// Delete an API key
router.delete('/api-keys/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params;
        const userId = req.user?.id;
        const success = apiKeysDb.deleteApiKey(userId, parseInt(keyId));
        if (success) {
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: 'API key not found' });
        }
    }
    catch (error) {
        console.error('Error deleting API key:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});
// Toggle API key active status
router.patch('/api-keys/:keyId/toggle', async (req, res) => {
    try {
        const { keyId } = req.params;
        const { isActive } = req.body;
        const userId = req.user?.id;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' });
        }
        const success = apiKeysDb.toggleApiKey(userId, parseInt(keyId), isActive);
        if (success) {
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: 'API key not found' });
        }
    }
    catch (error) {
        console.error('Error toggling API key:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to toggle API key' });
    }
});
// ===============================
// Generic Credentials Management
// ===============================
// Get all credentials for the authenticated user (optionally filtered by type)
router.get('/credentials', async (req, res) => {
    try {
        const { type } = req.query;
        const userId = req.user?.id;
        const credentials = credentialsDb.getCredentials(userId, type || null);
        // Don't send the actual credential values for security
        res.json({ credentials });
    }
    catch (error) {
        console.error('Error fetching credentials:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to fetch credentials' });
    }
});
// Create a new credential
router.post('/credentials', async (req, res) => {
    try {
        const { type, key, value } = req.body;
        const userId = req.user?.id;
        if (!type || !key || !value) {
            return res.status(400).json({ error: 'Type, key, and value are required' });
        }
        credentialsDb.createCredential(userId, type, key, value);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error creating credential:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to create credential' });
    }
});
// Update a credential
router.put('/credentials/:credentialId', async (req, res) => {
    try {
        const { credentialId } = req.params;
        const { value } = req.body;
        const userId = req.user?.id;
        if (!value) {
            return res.status(400).json({ error: 'Value is required' });
        }
        credentialsDb.updateCredential(userId, parseInt(credentialId), value);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating credential:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to update credential' });
    }
});
// Delete a credential
router.delete('/credentials/:credentialId', async (req, res) => {
    try {
        const { credentialId } = req.params;
        const userId = req.user?.id;
        const success = credentialsDb.deleteCredential(userId, parseInt(credentialId));
        if (success) {
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: 'Credential not found' });
        }
    }
    catch (error) {
        console.error('Error deleting credential:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to delete credential' });
    }
});
// Get model settings
router.get('/models', async (req, res) => {
    try {
        const userId = req.user?.id;
        const models = apiKeysDb.getModelSettings(userId);
        res.json({ models });
    }
    catch (error) {
        console.error('Error fetching model settings:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to fetch model settings' });
    }
});
// Update model settings
router.patch('/models', async (req, res) => {
    try {
        const { model, provider } = req.body;
        const userId = req.user?.id;
        if (!model || !provider) {
            return res.status(400).json({ error: 'Model and provider are required' });
        }
        apiKeysDb.updateModelSettings(userId, model, provider);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating model settings:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Failed to update model settings' });
    }
});
export default router;
