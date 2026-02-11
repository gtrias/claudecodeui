import express from 'express';
import { environmentVariablesDb } from '../database/db.js';
import type { Request, Response } from 'express';
import type { EnvironmentVariable, EnvironmentVariableMasked, CreateEnvironmentVariableRequest, UpdateEnvironmentVariableRequest } from '../../shared/types.js';

const router = express.Router();

// Validation helper
function validateEnvVarKey(key: string): { valid: boolean; error?: string } {
  if (!key || !key.trim()) {
    return { valid: false, error: 'Key is required' };
  }
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    return { valid: false, error: 'Key must be in UPPER_SNAKE_CASE (e.g., MY_VAR_123)' };
  }
  return { valid: true };
}

// Mask sensitive values
function maskSensitiveValue(envVar: EnvironmentVariable): EnvironmentVariableMasked {
  return {
    ...envVar,
    value: envVar.is_sensitive ? '••••••••' : envVar.value,
    has_value: true,
  };
}

// ===============================
// Global Environment Variables
// ===============================

// Get all global environment variables
router.get('/global', async (req: Request, res: Response) => {
  try {
    const envVars = environmentVariablesDb.getGlobalEnvironmentVariables();
    const masked = envVars.map(maskSensitiveValue);
    res.json({ environmentVariables: masked });
  } catch (error) {
    console.error('Error fetching global environment variables:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch environment variables' });
  }
});

// Create a new global environment variable
router.post('/global', async (req: Request, res: Response) => {
  try {
    const { key, value, is_sensitive = false } = req.body as CreateEnvironmentVariableRequest;

    const validation = validateEnvVarKey(key);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!value || !value.trim()) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const created = environmentVariablesDb.createGlobalEnvironmentVariable(key.trim(), value, is_sensitive);
    res.json({
      success: true,
      environmentVariable: maskSensitiveValue(created),
    });
  } catch (error) {
    console.error('Error creating global environment variable:', error instanceof Error ? error.message : 'Unknown error');
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An environment variable with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to create environment variable' });
  }
});

// Update a global environment variable
router.put('/global/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { value, is_sensitive } = req.body as UpdateEnvironmentVariableRequest;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const success = environmentVariablesDb.updateGlobalEnvironmentVariable(
      parseInt(id),
      value,
      is_sensitive ?? false
    );

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Environment variable not found' });
    }
  } catch (error) {
    console.error('Error updating global environment variable:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update environment variable' });
  }
});

// Delete a global environment variable
router.delete('/global/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = environmentVariablesDb.deleteGlobalEnvironmentVariable(parseInt(id));

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Environment variable not found' });
    }
  } catch (error) {
    console.error('Error deleting global environment variable:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete environment variable' });
  }
});

// ===============================
// Project Environment Variables
// ===============================

// Get environment variables for a project (includes global)
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { global, project } = environmentVariablesDb.getProjectEnvironmentVariables(projectId);

    const maskedGlobal = global.map(maskSensitiveValue);
    const maskedProject = project.map(maskSensitiveValue);

    res.json({
      environmentVariables: {
        global: maskedGlobal,
        project: maskedProject,
      },
    });
  } catch (error) {
    console.error('Error fetching project environment variables:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch environment variables' });
  }
});

// Create a new project environment variable
router.post('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { key, value, is_sensitive = false } = req.body as CreateEnvironmentVariableRequest;

    const validation = validateEnvVarKey(key);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!value || !value.trim()) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const created = environmentVariablesDb.createProjectEnvironmentVariable(projectId, key.trim(), value, is_sensitive);
    res.json({
      success: true,
      environmentVariable: maskSensitiveValue(created),
    });
  } catch (error) {
    console.error('Error creating project environment variable:', error instanceof Error ? error.message : 'Unknown error');
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An environment variable with this key already exists for this project' });
    }
    res.status(500).json({ error: 'Failed to create environment variable' });
  }
});

// Update a project environment variable
router.put('/project/:projectId/:id', async (req: Request, res: Response) => {
  try {
    const { projectId, id } = req.params;
    const { value, is_sensitive } = req.body as UpdateEnvironmentVariableRequest;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const success = environmentVariablesDb.updateProjectEnvironmentVariable(
      projectId,
      parseInt(id),
      value,
      is_sensitive ?? false
    );

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Environment variable not found' });
    }
  } catch (error) {
    console.error('Error updating project environment variable:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update environment variable' });
  }
});

// Delete a project environment variable
router.delete('/project/:projectId/:id', async (req: Request, res: Response) => {
  try {
    const { projectId, id } = req.params;
    const success = environmentVariablesDb.deleteProjectEnvironmentVariable(projectId, parseInt(id));

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Environment variable not found' });
    }
  } catch (error) {
    console.error('Error deleting project environment variable:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete environment variable' });
  }
});

export default router;
