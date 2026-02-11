import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { promisify } from 'util';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exec = promisify(spawn);
// Parse Claude MCP list output
function parseClaudeListOutput(output) {
    const servers = [];
    const lines = output.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.startsWith('===') || line.startsWith('---')) {
            continue;
        }
        // Try to parse server name and type from output
        const match = line.match(/^\s*-\s+(\S+)\s+\(([^)]+)\)/);
        if (match) {
            servers.push({
                name: match[1],
                type: match[2],
            });
        }
    }
    return servers;
}
// GET /api/mcp/cli/list - List MCP servers using Claude CLI
router.get('/cli/list', async (req, res) => {
    try {
        console.log('📋 Listing MCP servers using Claude CLI');
        const process = spawn('claude', ['mcp', 'list'], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    output: stdout,
                    servers: parseClaudeListOutput(stdout),
                });
            }
            else {
                console.error('Claude CLI error:', stderr);
                res.status(500).json({
                    error: 'Claude CLI command failed',
                    details: stderr,
                });
            }
        });
        process.on('error', (error) => {
            console.error('Error running Claude CLI:', error);
            res.status(500).json({
                error: 'Failed to run Claude CLI',
                details: error.message,
            });
        });
    }
    catch (error) {
        console.error('Error listing MCP servers via CLI:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            error: 'Failed to list MCP servers',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/mcp/cli/add - Add MCP server using Claude CLI
router.post('/cli/add', async (req, res) => {
    try {
        const { name, type = 'stdio', command, args = [], url, headers = {}, env = {}, scope = 'user', projectPath } = req.body;
        console.log(`➕ Adding MCP server using Claude CLI (${scope} scope):`, name);
        let cliArgs = ['mcp', 'add'];
        // Add scope flag
        cliArgs.push('--scope', scope);
        if (type === 'http') {
            cliArgs.push('--transport', 'http', name, url);
            // Add headers if provided
            Object.entries(headers).forEach(([key, value]) => {
                cliArgs.push('--header', `${key}: ${value}`);
            });
        }
        else if (type === 'sse') {
            cliArgs.push('--transport', 'sse', name, url);
            // Add headers if provided
            Object.entries(headers).forEach(([key, value]) => {
                cliArgs.push('--header', `${key}: ${value}`);
            });
        }
        else {
            // stdio (default): claude mcp add --scope user <name> <command> [args...]
            cliArgs.push(name);
            // Add environment variables
            Object.entries(env).forEach(([key, value]) => {
                cliArgs.push('-e', `${key}=${value}`);
            });
            if (command) {
                cliArgs.push(command);
            }
            if (args && args.length > 0) {
                cliArgs.push(...args);
            }
        }
        console.log('🔧 Running Claude CLI command:', 'claude', cliArgs.join(' '));
        // For local scope, we need to run the command in the project directory
        const spawnOptions = {
            cwd: projectPath || process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
        };
        const process = spawn('claude', cliArgs, spawnOptions);
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    output: stdout,
                });
            }
            else {
                console.error('Claude CLI error:', stderr);
                res.status(500).json({
                    error: 'Claude CLI command failed',
                    details: stderr,
                });
            }
        });
        process.on('error', (error) => {
            console.error('Error running Claude CLI:', error);
            res.status(500).json({
                error: 'Failed to run Claude CLI',
                details: error.message,
            });
        });
    }
    catch (error) {
        console.error('Error adding MCP server via CLI:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            error: 'Failed to add MCP server',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/mcp/cli/remove - Remove MCP server using Claude CLI
router.post('/cli/remove', async (req, res) => {
    try {
        const { name, scope = 'user', projectPath } = req.body;
        console.log(`➖ Removing MCP server using Claude CLI (${scope} scope):`, name);
        const cliArgs = ['mcp', 'remove', '--scope', scope, name];
        const process = spawn('claude', cliArgs, {
            cwd: projectPath || process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    output: stdout,
                });
            }
            else {
                console.error('Claude CLI error:', stderr);
                res.status(500).json({
                    error: 'Claude CLI command failed',
                    details: stderr,
                });
            }
        });
        process.on('error', (error) => {
            console.error('Error running Claude CLI:', error);
            res.status(500).json({
                error: 'Failed to run Claude CLI',
                details: error.message,
            });
        });
    }
    catch (error) {
        console.error('Error removing MCP server via CLI:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({
            error: 'Failed to remove MCP server',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export default router;
export { parseClaudeListOutput, };
