import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { getPiSessions, getPiSessionMessages, deletePiSession } from '../projects.js';

const router = express.Router();

function getPiAgentDir() {
  return process.env.PI_CODING_AGENT_DIR?.trim()
    ? path.resolve(process.env.PI_CODING_AGENT_DIR.trim())
    : path.join(os.homedir(), '.pi', 'agent');
}

function resolvePiCommand() {
  const configured = process.env.PI_CLI_COMMAND?.trim();
  if (configured) {
    const [command, ...args] = configured.split(/\s+/);
    return { command, baseArgs: args };
  }
  return { command: 'pi', baseArgs: [] };
}

function sanitizePiModelsConfig(config) {
  const providers = config?.providers && typeof config.providers === 'object'
    ? config.providers
    : {};

  return Object.entries(providers).map(([providerId, provider]) => ({
    id: providerId,
    models: Array.isArray(provider?.models)
      ? provider.models.map((model) => ({
        id: model?.id || '',
        name: model?.name || model?.id || '',
        reasoning: Boolean(model?.reasoning),
        input: Array.isArray(model?.input) ? model.input : undefined,
        contextWindow: model?.contextWindow || null,
        maxTokens: model?.maxTokens || null
      })).filter((model) => model.id)
      : []
  }));
}

function listPiModelsFromCli() {
  return new Promise((resolve, reject) => {
    const { command, baseArgs } = resolvePiCommand();
    const args = [...baseArgs, '--list-models'];
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `pi --list-models exited with code ${code}`));
      }

      const lines = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return resolve([]);
      }

      const dataLines = lines[0].toLowerCase().startsWith('provider')
        ? lines.slice(1)
        : lines;

      const entries = [];
      for (const line of dataLines) {
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        entries.push({ provider: parts[0], model: parts[1] });
      }

      const byProvider = new Map();
      for (const entry of entries) {
        if (!byProvider.has(entry.provider)) {
          byProvider.set(entry.provider, new Set());
        }
        byProvider.get(entry.provider).add(entry.model);
      }

      const providers = Array.from(byProvider.entries()).map(([provider, models]) => ({
        id: provider,
        models: Array.from(models).map((modelId) => ({
          id: modelId,
          name: modelId,
          reasoning: false,
          input: undefined,
          contextWindow: null,
          maxTokens: null
        }))
      }));

      resolve(providers);
    });
  });
}

router.get('/models', async (req, res) => {
  try {
    const modelsPath = path.join(getPiAgentDir(), 'models.json');

    try {
      const content = await fs.readFile(modelsPath, 'utf8');
      const parsed = JSON.parse(content);
      let providers = sanitizePiModelsConfig(parsed);
      if (providers.length === 0) {
        providers = await listPiModelsFromCli();
      }

      res.json({
        success: true,
        path: modelsPath,
        providers
      });
    } catch (error) {
      if (error?.code === 'ENOENT') {
        const providers = await listPiModelsFromCli();
        return res.json({
          success: true,
          path: modelsPath,
          providers,
          missing: true,
          cliFallback: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading Pi models config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read Pi models configuration',
      details: error.message
    });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const { projectPath } = req.query;
    if (!projectPath) {
      return res.status(400).json({ success: false, error: 'projectPath query parameter required' });
    }

    const sessions = await getPiSessions(projectPath);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching Pi sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectPath, limit, offset } = req.query;

    const result = await getPiSessionMessages(
      sessionId,
      projectPath || null,
      limit ? parseInt(limit, 10) : null,
      offset ? parseInt(offset, 10) : 0
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching Pi session messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { projectPath } = req.query;
    await deletePiSession(sessionId, projectPath || null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Pi session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
