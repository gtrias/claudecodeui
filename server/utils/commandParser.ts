/**
 * Command Parser Utility - TypeScript Version
 * Parse and validate Claude command strings
 */

export interface ParsedCommand {
  command: string;
  arguments: string[];
  options: Record<string, string | boolean>;
}

export interface CommandOptions {
  projectPath?: string;
  sessionId?: string;
  model?: string;
  resume?: boolean;
  cwd?: string;
}

// Parse a command string into components
export const parseCommand = (command: string): ParsedCommand => {
  const trimmed = command.trim();
  if (!trimmed) {
    return { command: '', arguments: [], options: {} };
  }

  // Extract command and arguments
  const parts = trimmed.split(/\s+/);
  const commandName = parts[0];
  const argumentsParts = parts.slice(1);

  // Parse options
  const options: Record<string, string | boolean> = {};
  const argsWithoutOptions: string[] = [];

  for (let i = 0; i < argumentsParts.length; i++) {
    const part = argumentsParts[i];

    if (part.startsWith('--')) {
      // Boolean flag (e.g., --verbose)
      if (i + 1 >= argumentsParts.length || argumentsParts[i + 1].startsWith('--')) {
        options[part.slice(2)] = true;
      } else {
        // Option with value (e.g., --model sonnet)
        options[part.slice(2)] = argumentsParts[++i];
      }
    } else if (part.startsWith('-')) {
      // Short flag (e.g., -v)
      if (part.length > 2) {
        // Combined flags (e.g., -vf)
        for (let j = 1; j < part.length; j++) {
          options[part[j]] = true;
        }
      } else if (i + 1 < argumentsParts.length && !argumentsParts[i + 1].startsWith('-')) {
        options[part.slice(1)] = argumentsParts[++i];
      } else {
        options[part.slice(1)] = true;
      }
    } else {
      argsWithoutOptions.push(part);
    }
  }

  return {
    command: commandName,
    arguments: argsWithoutOptions,
    options,
  };
};

// Validate command options
export const validateOptions = (options: CommandOptions): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (options.projectPath && !options.projectPath.trim()) {
    errors.push('Project path cannot be empty');
  }

  if (options.sessionId && !options.sessionId.trim()) {
    errors.push('Session ID cannot be empty');
  }

  if (options.model && !options.model.trim()) {
    errors.push('Model cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Extract project path from command
export const extractProjectPath = (command: string): string | null => {
  const parsed = parseCommand(command);

  // Check for --project-path option
  if (parsed.options['project-path']) {
    return parsed.options['project-path'] as string;
  }

  // Check for --cwd option
  if (parsed.options.cwd) {
    return parsed.options.cwd as string;
  }

  // Check for positional argument (project path)
  if (parsed.arguments.length > 0) {
    return parsed.arguments[0];
  }

  return null;
};

// Check if command is a continuation/resume
export const isResumeCommand = (command: string): boolean => {
  const trimmed = command.trim().toLowerCase();
  return trimmed === 'continue' || trimmed === 'resume';
};

// Get command type
export const getCommandType = (command: string): 'claude' | 'cursor' | 'codex' | 'pi' | 'unknown' => {
  const trimmed = command.trim().toLowerCase();

  if (trimmed.startsWith('claude ') || trimmed === 'claude') {
    return 'claude';
  }
  if (trimmed.startsWith('cursor ') || trimmed === 'cursor') {
    return 'cursor';
  }
  if (trimmed.startsWith('codex ') || trimmed === 'codex') {
    return 'codex';
  }
  if (trimmed.startsWith('pi ') || trimmed === 'pi') {
    return 'pi';
  }

  return 'unknown';
};

export {
  parseCommand,
  validateOptions,
  extractProjectPath,
  isResumeCommand,
  getCommandType,
};
