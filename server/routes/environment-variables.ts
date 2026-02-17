import express from 'express';
import type { Response } from 'express';
import { authenticateConvex, ConvexAuthRequest } from '../middleware/convex-auth.js';

const router = express.Router();

// All environment variable operations now use Convex directly from frontend
// These routes are kept for backward compatibility but marked deprecated

// ===============================
// Global Environment Variables
// ===============================

// Get all global environment variables
router.get('/global', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query environmentVariables:getGlobalEnvironmentVariables',
    deprecated: true,
    environmentVariables: []
  });
});

// Create a new global environment variable
router.post('/global', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:createEnvironmentVariable',
    deprecated: true
  });
});

// Update a global environment variable
router.put('/global/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:updateEnvironmentVariable',
    deprecated: true
  });
});

// Delete a global environment variable
router.delete('/global/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:deleteEnvironmentVariable',
    deprecated: true
  });
});

// ===============================
// Project Environment Variables
// ===============================

// Get environment variables for a project (includes global)
router.get('/project/:projectId', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex query environmentVariables:getProjectEnvironmentVariables',
    deprecated: true,
    environmentVariables: {
      global: [],
      project: []
    }
  });
});

// Create a new project environment variable
router.post('/project/:projectId', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:createEnvironmentVariable with scope "project:{projectId}"',
    deprecated: true
  });
});

// Update a project environment variable
router.put('/project/:projectId/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:updateEnvironmentVariable',
    deprecated: true
  });
});

// Delete a project environment variable
router.delete('/project/:projectId/:id', authenticateConvex, async (req: ConvexAuthRequest, res: Response) => {
  res.json({ 
    message: 'Use Convex mutation environmentVariables:deleteEnvironmentVariable',
    deprecated: true
  });
});

export default router;
