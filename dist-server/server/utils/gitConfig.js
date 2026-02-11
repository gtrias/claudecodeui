/**
 * Git Configuration Utility - TypeScript Version
 */
import { execSync } from 'child_process';
// Get git config from global .gitconfig file
export const getGitConfig = () => {
    let name = '';
    let email = '';
    try {
        name = execSync('git config --global user.name', { encoding: 'utf8' }).trim();
        email = execSync('git config --global user.email', { encoding: 'utf8' }).trim();
    }
    catch (error) {
        console.error('Error getting git config:', error);
    }
    return { name, email };
};
// Check if git is configured
export const isGitConfigured = () => {
    try {
        const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
        const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
        return name.length > 0 && email.length > 0;
    }
    catch (error) {
        return false;
    }
};
// Set git config for a specific repository
export const setGitConfig = (dir, name, email) => {
    try {
        execSync(`git config user.name "${name}"`, { cwd: dir, stdio: 'pipe' });
        execSync(`git config user.email "${email}"`, { cwd: dir, stdio: 'pipe' });
    }
    catch (error) {
        console.error('Error setting git config:', error);
    }
};
// Get git status for a directory
export const getGitStatus = (dir) => {
    const status = { modified: [], added: [], deleted: [], untracked: [] };
    try {
        const output = execSync('git status --porcelain', { cwd: dir, encoding: 'utf8' });
        const lines = output.split('\n').filter((line) => line.length > 0);
        for (const line of lines) {
            const code = line.slice(0, 2).trim();
            const filePath = line.slice(3).trim();
            switch (code) {
                case 'M ':
                case ' M':
                    status.modified.push(filePath);
                    break;
                case 'A ':
                case ' A':
                    status.added.push(filePath);
                    break;
                case 'D ':
                case ' D':
                    status.deleted.push(filePath);
                    break;
                case '??':
                    status.untracked.push(filePath);
                    break;
            }
        }
    }
    catch (error) {
        console.error('Error getting git status:', error);
    }
    return status;
};
// Get git branch for a directory
export const getGitBranch = (dir) => {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    }
    catch (error) {
        return 'unknown';
    }
};
// Get git remote URL for a directory
export const getGitRemoteUrl = (dir) => {
    try {
        return execSync('git remote get-url origin', { cwd: dir, encoding: 'utf8' }).trim();
    }
    catch (error) {
        return '';
    }
};
