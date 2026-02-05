import express from 'express';
import { spawn } from 'child_process';
import type { Request, Response } from 'express';

const router = express.Router();

// Type definitions
interface McpToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface McpToolResult {
  content: string;
  isError: boolean;
}

// POST /api/mcp-utils/call - Call an MCP tool
router.post('/call', async (req: Request, res: Response) => {
  try {
    const { toolName, arguments: args } = req.body as McpToolCall;

    if (!toolName) {
      return res.status(400).json({
        error: 'Tool name is required',
        isError: true,
      } as McpToolResult);
    }

    // In production, implement proper MCP protocol
    // For now, return placeholder response
    res.json({
      content: `Tool ${toolName} called with args: ${JSON.stringify(args)}`,
      isError: false,
    } as McpToolResult);
  } catch (error) {
    console.error('Error calling MCP tool:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      isError: true,
    } as McpToolResult);
  }
});

// GET /api/mcp-utils/tools - List available MCP tools
router.get('/tools', async (req: Request, res: Response) => {
  try {
    // In production, implement proper MCP protocol
    // For now, return empty array
    res.json({ tools: [] });
  } catch (error) {
    console.error('Error listing MCP tools:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/mcp-utils/resources - List available MCP resources
router.get('/resources', async (req: Request, res: Response) => {
  try {
    // In production, implement proper MCP protocol
    // For now, return empty array
    res.json({ resources: [] });
  } catch (error) {
    console.error('Error listing MCP resources:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
export {
  McpToolCall,
  McpToolResult,
};