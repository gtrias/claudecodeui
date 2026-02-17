import express from 'express';
import { apiKeysDb, credentialsDb } from '../database/db.js';
import type { Request, Response } from 'express';

const router = express.Router();

// GET /api/migrate/settings - Export SQLite settings for Convex migration
router.get('/settings', async (req: Request, res: Response) => {
  console.log('[migrate/settings] Handler called');
  try {
    // Get the first user's data (single-user system)
    const userId = 1;

    // Get API keys (with full key values for migration)
    let apiKeys: Array<{ name: string; key: string; isActive: boolean }> = [];
    try {
      const apiKeysRaw = apiKeysDb.getApiKeys(userId);
      apiKeys = apiKeysRaw.map((key: any) => ({
        name: key.name || key.key_name || 'Unnamed Key',
        key: key.api_key,
        isActive: key.is_active === 1 || key.is_active === true,
      }));
    } catch (e) {
      console.log('No API keys to migrate');
    }

    // Get credentials (with full values for migration)
    let credentials: Array<{
      type: string;
      name: string;
      value: string;
      description?: string;
      isActive: boolean;
    }> = [];
    try {
      const credentialsRaw = credentialsDb.getCredentialsWithValues(userId);
      credentials = credentialsRaw.map((cred: any) => ({
        type: cred.credential_type || cred.type || 'unknown',
        name: cred.credential_name || cred.name || 'Unnamed Credential',
        value: cred.credential_value || cred.value || '',
        description: cred.description || undefined,
        isActive: cred.is_active === 1 || cred.is_active === true,
      }));
    } catch (e) {
      console.log('No credentials to migrate');
    }

    // Model settings not currently stored in SQLite
    const modelSettings = undefined;

    res.json({
      success: true,
      data: {
        apiKeys,
        credentials,
        modelSettings,
      },
    });
  } catch (error) {
    console.error(
      'Migration export error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

export default router;
