import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
// Helper function to scan directory for command files
async function scanCommandsDirectory(dir, baseDir, namespace) {
    const commands = [];
    try {
        // Check if directory exists
        await fs.access(dir);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                const subCommands = await scanCommandsDirectory(fullPath, baseDir, namespace);
                commands.push(...subCommands);
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Parse markdown file for metadata
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    const { data: frontmatter, content: commandContent } = matter(content);
                    // Calculate relative path from baseDir for command name
                    const relativePath = path.relative(baseDir, fullPath);
                    // Remove .md extension and convert to command name
                    const commandName = '/' + relativePath.replace(/\.md$/, '').replace(/\\/g, '/');
                    // Extract description from frontmatter or first line of content
                    let description = frontmatter.description || '';
                    if (!description) {
                        const firstLine = commandContent.trim().split('\n')[0];
                        description = firstLine.replace(/^#+\s*/, '').trim();
                    }
                    commands.push({
                        name: commandName,
                        path: fullPath,
                        relativePath,
                        description,
                        namespace,
                        metadata: frontmatter,
                    });
                }
                catch (err) {
                    console.error(`Error parsing command file ${fullPath}:`, err instanceof Error ? err.message : 'Unknown error');
                }
            }
        }
    }
    catch (err) {
        // Directory doesn't exist or can't be accessed - this is okay
        if (err.code !== 'ENOENT' && err.code !== 'EACCES') {
            console.error(`Error scanning directory ${dir}:`, err instanceof Error ? err.message : 'Unknown error');
        }
    }
    return commands;
}
// Built-in commands that are always available
const BUILTIN_COMMANDS = [
    {
        name: '/help',
        path: '',
        relativePath: '',
        description: 'Show this help message',
        namespace: 'system',
        metadata: {},
    },
    {
        name: '/clear',
        path: '',
        relativePath: '',
        description: 'Clear the chat history',
        namespace: 'system',
        metadata: {},
    },
    {
        name: '/reset',
        path: '',
        relativePath: '',
        description: 'Reset the current session',
        namespace: 'system',
        metadata: {},
    },
    {
        name: '/model',
        path: '',
        relativePath: '',
        description: 'Change the current model',
        namespace: 'system',
        metadata: {},
    },
];
// Get all commands
router.get('/', async (req, res) => {
    try {
        const commands = [...BUILTIN_COMMANDS];
        // Scan for project commands
        const projectCommandsDir = path.join(process.env.HOME || '', '.claude', 'commands');
        const projectCommands = await scanCommandsDirectory(projectCommandsDir, projectCommandsDir, 'project');
        commands.push(...projectCommands);
        // Scan for user commands
        const userCommandsDir = path.join(__dirname, '../../commands');
        if (fs.existsSync(userCommandsDir)) {
            const userCommands = await scanCommandsDirectory(userCommandsDir, userCommandsDir, 'user');
            commands.push(...userCommands);
        }
        res.json({
            success: true,
            data: commands,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get commands by namespace
router.get('/namespace/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        const commands = [];
        // Scan for commands in the specified namespace
        const commandsDir = path.join(process.env.HOME || '', '.claude', 'commands', namespace);
        if (fs.existsSync(commandsDir)) {
            const namespaceCommands = await scanCommandsDirectory(commandsDir, commandsDir, namespace);
            commands.push(...namespaceCommands);
        }
        res.json({
            success: true,
            data: commands,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get command details
router.get('/:commandName', async (req, res) => {
    try {
        const { commandName } = req.params;
        // Find the command
        const commandsDir = path.join(process.env.HOME || '', '.claude', 'commands');
        const commands = await scanCommandsDirectory(commandsDir, commandsDir, 'project');
        const command = commands.find(c => c.name === commandName);
        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'Command not found',
            });
        }
        // Read command content
        const content = await fs.readFile(command.path, 'utf8');
        const { data: frontmatter, content: commandContent } = matter(content);
        res.json({
            success: true,
            data: {
                ...command,
                content: commandContent,
                frontmatter,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export default router;
export { scanCommandsDirectory, BUILTIN_COMMANDS, };
