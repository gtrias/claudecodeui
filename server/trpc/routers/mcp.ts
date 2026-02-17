import { z } from 'zod';
import { router, authedProcedure } from '../index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

const McpServerSchema = z.object({
  name: z.string(),
  type: z.enum(['stdio', 'http']).default('stdio'),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  url: z.string().optional(),
});

type McpServer = z.infer<typeof McpServerSchema>;

async function getMcpConfigPath(agent: string): Promise<string> {
  const home = os.homedir();
  switch (agent) {
    case 'claude':
      return path.join(home, '.claude', 'mcp_servers.json');
    case 'cursor':
      return path.join(home, '.cursor', 'mcp.json');
    case 'codex':
      return path.join(home, '.codex', 'mcp.json');
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}

async function readMcpConfig(agent: string): Promise<McpServer[]> {
  try {
    const configPath = await getMcpConfigPath(agent);
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    // Handle different config formats
    if (config.mcpServers) {
      // Claude format: { mcpServers: { name: config, ... } }
      return Object.entries(config.mcpServers).map(([name, cfg]: [string, unknown]) => ({
        name,
        ...(cfg as object),
      })) as McpServer[];
    }
    if (Array.isArray(config)) {
      return config;
    }
    if (config.servers) {
      // Alternative format: { servers: [...] }
      return config.servers;
    }
    return [];
  } catch {
    // Config doesn't exist yet
    return [];
  }
}

export const mcpRouter = router({
  list: authedProcedure
    .input(z.object({
      agent: z.enum(['claude', 'cursor', 'codex']),
    }))
    .query(async ({ input }) => {
      const servers = await readMcpConfig(input.agent);
      return { servers };
    }),
});
