/**
 * MCP (Model Context Protocol) Server Detector - TypeScript Version
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface McpServerInfo {
  name: string;
  url: string;
  enabled: boolean;
  tools?: McpToolInfo[];
  resources?: McpResourceInfo[];
}

export interface McpToolInfo {
  name: string;
  description: string;
}

export interface McpResourceInfo {
  uri: string;
  name: string;
}

export const detectMcpServers = async (): Promise<McpServerInfo[]> => {
  const servers: McpServerInfo[] = [];

  // Check for Claude MCP servers
  const claudeMcpPath = path.join(process.env.HOME || '', '.claude', 'mcp');
  if (fs.existsSync(claudeMcpPath)) {
    const configPath = path.join(claudeMcpPath, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.servers) {
          for (const [name, server] of Object.entries(config.servers)) {
            if (typeof server === 'object' && server !== null) {
              servers.push({
                name,
                url: server.url || '',
                enabled: server.enabled !== false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error reading MCP config:', error);
      }
    }
  }

  return servers;
};

export const checkMcpServer = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Simple HTTP check - in production, use proper MCP protocol
    const http = url.startsWith('https') ? import('https') : import('http');

    http.then((module) => {
      const req = module.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  });
};

export const discoverMcpTools = async (url: string): Promise<McpToolInfo[]> => {
  const tools: McpToolInfo[] = [];

  // In production, implement proper MCP protocol discovery
  // For now, return empty array
  return tools;
};

export const discoverMcpResources = async (url: string): Promise<McpResourceInfo[]> => {
  const resources: McpResourceInfo[] = [];

  // In production, implement proper MCP protocol discovery
  // For now, return empty array
  return resources;
};

export {
  detectMcpServers,
  checkMcpServer,
  discoverMcpTools,
  discoverMcpResources,
};
