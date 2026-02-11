#!/usr/bin/env node
/**
 * CLI Utility - TypeScript Version
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    dim: '\x1b[2m',
};
const c = {
    info: (text) => `${colors.cyan}${text}${colors.reset}`,
    ok: (text) => `${colors.green}${text}${colors.reset}`,
    warn: (text) => `${colors.yellow}${text}${colors.reset}`,
    tip: (text) => `${colors.blue}${text}${colors.reset}`,
    bright: (text) => `${colors.bright}${text}${colors.reset}`,
    dim: (text) => `${colors.dim}${text}${colors.reset}`,
};
// Parse command line arguments
export const parseArgs = (args) => {
    const options = {};
    const positionalArgs = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '-p':
            case '--project':
                options.project = args[++i];
                break;
            case '-s':
            case '--session':
                options.session = args[++i];
                break;
            case '-c':
            case '--cwd':
                options.cwd = args[++i];
                break;
            case '-m':
            case '--model':
                options.model = args[++i];
                break;
            case '-v':
            case '--verbose':
                options.verbose = true;
                break;
            case '-h':
            case '--help':
                printHelp();
                process.exit(0);
            default:
                if (!arg.startsWith('-')) {
                    positionalArgs.push(arg);
                }
        }
    }
    options.command = positionalArgs[0];
    options.args = positionalArgs.slice(1);
    return options;
};
// Print help message
const printHelp = () => {
    console.log(`
${c.bright('Claude Code CLI')} - ${c.dim('TypeScript Version')}

${c.bright('Usage:')} claude-cli [command] [options]

${c.bright('Commands:')}
  run         Run a command in the project directory
  session     Manage sessions
  projects    List projects
  help        Show this help message

${c.bright('Options:')}
  -p, --project <name>    Project name
  -s, --session <id>      Session ID
  -c, --cwd <path>        Working directory
  -m, --model <name>      Model to use
  -v, --verbose           Verbose output
  -h, --help              Show help

${c.bright('Examples:')}
  claude-cli run --project my-project --model sonnet
  claude-cli session --project my-project
  claude-cli projects --verbose
`);
};
// Run a command
export const runCommand = (command, args, cwd) => {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: cwd || process.cwd(),
            stdio: 'inherit',
            shell: true,
        });
        child.on('close', (code) => {
            resolve(code || 0);
        });
        child.on('error', (error) => {
            console.error(c.warn(`Failed to start command: ${error.message}`));
            resolve(1);
        });
    });
};
// Run Claude command
export const runClaudeCommand = (args, options) => {
    const command = 'claude';
    const commandArgs = [...(options?.model ? ['--model', options.model] : []), ...args];
    return runCommand(command, commandArgs, options?.cwd);
};
// Run Cursor command
export const runCursorCommand = (args, options) => {
    const command = 'cursor';
    const commandArgs = [...(options?.model ? ['--model', options.model] : []), ...args];
    return runCommand(command, commandArgs, options?.cwd);
};
// Run Codex command
export const runCodexCommand = (args, options) => {
    const command = 'codex';
    const commandArgs = [...(options?.model ? ['--model', options.model] : []), ...args];
    return runCommand(command, commandArgs, options?.cwd);
};
// Run Pi command
export const runPiCommand = (args, options) => {
    const command = 'pi';
    const commandArgs = [...(options?.model ? ['--model', options.model] : []), ...args];
    return runCommand(command, commandArgs, options?.cwd);
};
// List available commands
export const listCommands = () => {
    return ['run', 'session', 'projects', 'help'];
};
// Check if command exists
export const commandExists = (command) => {
    return listCommands().includes(command);
};
