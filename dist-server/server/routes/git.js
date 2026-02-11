import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';
import { extractProjectDirectory } from '../projects.js';
const router = express.Router();
const execAsync = promisify(exec);
// Helper function to get the actual project path from the encoded project name
async function getActualProjectPath(projectName) {
    try {
        return await extractProjectDirectory(projectName);
    }
    catch (error) {
        console.error(`Error extracting project directory for ${projectName}:`, error instanceof Error ? error.message : 'Unknown error');
        // Fallback to the old method
        return projectName.replace(/-/g, '/');
    }
}
// Helper function to strip git diff headers
function stripDiffHeaders(diff) {
    if (!diff)
        return '';
    const lines = diff.split('\n');
    const filteredLines = [];
    let startIncluding = false;
    for (const line of lines) {
        // Skip all header lines including diff --git, index, file mode, and --- / +++ file paths
        if (line.startsWith('diff --git') ||
            line.startsWith('index ') ||
            line.startsWith('new file mode') ||
            line.startsWith('deleted file mode') ||
            line.startsWith('---') ||
            line.startsWith('+++')) {
            continue;
        }
        // Start including lines from @@ hunk headers onwards
        if (line.startsWith('@@') || startIncluding) {
            startIncluding = true;
            filteredLines.push(line);
        }
    }
    return filteredLines.join('\n');
}
// Helper function to validate git repository
async function validateGitRepository(projectPath) {
    try {
        // Check if directory exists
        await fs.access(projectPath);
    }
    catch (error) {
        throw new Error(`Project path not found: ${projectPath}`);
    }
    try {
        // Use --show-toplevel to get the root of the git repository
        const { stdout: gitRoot } = await execAsync('git rev-parse --show-toplevel', { cwd: projectPath });
        const normalizedGitRoot = path.resolve(gitRoot.trim());
        const normalizedProjectPath = path.resolve(projectPath);
        // Ensure the git root matches our project path (prevent using parent git repos)
        if (normalizedGitRoot !== normalizedProjectPath) {
            throw new Error(`Project directory is not a git repository. This directory is inside a git repository at ${normalizedGitRoot}, but git operations should be run from the repository root.`);
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Project directory is not a git repository')) {
            throw error;
        }
        throw new Error('Not a git repository. This directory does not contain a .git folder. Initialize a git repository with "git init" to use source control features.');
    }
}
// Get git status for a project
router.get('/status', async (req, res) => {
    const { project } = req.query;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        // Validate git repository
        await validateGitRepository(projectPath);
        // Get current branch - handle case where there are no commits yet
        let branch = 'main';
        let hasCommits = true;
        try {
            const { stdout: branchOutput } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath });
            branch = branchOutput.trim();
        }
        catch (error) {
            // No commits yet - use default branch name
            hasCommits = false;
        }
        // Get git status
        const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: projectPath });
        const lines = statusOutput.split('\n').filter(line => line.length > 0);
        const modified = [];
        const added = [];
        const deleted = [];
        const untracked = [];
        for (const line of lines) {
            const code = line.slice(0, 2).trim();
            const filePath = line.slice(3).trim();
            switch (code) {
                case 'M ':
                case ' M':
                    modified.push(filePath);
                    break;
                case 'A ':
                case ' A':
                    added.push(filePath);
                    break;
                case 'D ':
                case ' D':
                    deleted.push(filePath);
                    break;
                case '??':
                    untracked.push(filePath);
                    break;
            }
        }
        res.json({
            success: true,
            data: {
                branch,
                hasCommits,
                modified,
                added,
                deleted,
                untracked,
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get git log for a project
router.get('/log', async (req, res) => {
    const { project } = req.query;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        await validateGitRepository(projectPath);
        const { stdout: logOutput } = await execAsync('git log --oneline -20', { cwd: projectPath });
        const commits = logOutput.split('\n').filter(line => line.length > 0).map(line => {
            const parts = line.split(' ');
            return {
                hash: parts[0],
                message: parts.slice(1).join(' '),
            };
        });
        res.json({
            success: true,
            data: commits,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get git diff for a project
router.get('/diff', async (req, res) => {
    const { project } = req.query;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        await validateGitRepository(projectPath);
        const { stdout: diffOutput } = await execAsync('git diff', { cwd: projectPath });
        const strippedDiff = stripDiffHeaders(diffOutput);
        res.json({
            success: true,
            data: {
                content: diffOutput,
                stripped: strippedDiff,
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Commit changes
router.post('/commit', async (req, res) => {
    const { project, message } = req.body;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    if (!message) {
        return res.status(400).json({ error: 'Commit message is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        await validateGitRepository(projectPath);
        // Add all changes
        await execAsync('git add .', { cwd: projectPath });
        // Commit changes
        await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: projectPath });
        res.json({
            success: true,
            message: 'Changes committed successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Push to remote
router.post('/push', async (req, res) => {
    const { project, remote = 'origin', branch = 'main' } = req.body;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        await validateGitRepository(projectPath);
        await execAsync(`git push ${remote} ${branch}`, { cwd: projectPath });
        res.json({
            success: true,
            message: 'Pushed successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Pull from remote
router.post('/pull', async (req, res) => {
    const { project, remote = 'origin', branch = 'main' } = req.body;
    if (!project) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const projectPath = await getActualProjectPath(project);
        await validateGitRepository(projectPath);
        await execAsync(`git pull ${remote} ${branch}`, { cwd: projectPath });
        res.json({
            success: true,
            message: 'Pulled successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
export { getActualProjectPath, stripDiffHeaders, validateGitRepository, };
