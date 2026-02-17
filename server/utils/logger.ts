/**
 * Shared Logger Utility
 * 
 * Provides consistent logging across server modules with color support
 * and log level filtering.
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get log level from environment, default to 'debug' for development
const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
}

/**
 * Create a logger instance for a specific module/component
 */
export function createLogger(prefix: string) {
  const coloredPrefix = `${colors.magenta}[${prefix}]${colors.reset}`;

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${message}`, ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${colors.cyan}${message}${colors.reset}`, ...args);
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${colors.yellow}${message}${colors.reset}`, ...args);
      }
    },

    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${colors.red}${message}${colors.reset}`, ...args);
      }
    },

    success: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${colors.green}${message}${colors.reset}`, ...args);
      }
    },

    /**
     * Log with custom formatting for structured data
     */
    data: (label: string, data: unknown) => {
      if (shouldLog('debug')) {
        const jsonStr = JSON.stringify(data, null, 2);
        const truncated = jsonStr.length > 500 ? jsonStr.substring(0, 500) + '...' : jsonStr;
        console.log(`${colors.dim}${formatTimestamp()}${colors.reset} ${coloredPrefix} ${colors.blue}${label}:${colors.reset}\n${truncated}`);
      }
    },

    /**
     * Log a separator line for visual grouping
     */
    separator: (label?: string) => {
      if (shouldLog('debug')) {
        const line = '═'.repeat(50);
        if (label) {
          console.log(`${colors.dim}${line} ${label} ${line}${colors.reset}`);
        } else {
          console.log(`${colors.dim}${line}${colors.reset}`);
        }
      }
    },
  };
}

// Pre-configured loggers for common modules
export const codexLogger = createLogger('CODEX');
export const claudeLogger = createLogger('CLAUDE');
export const cursorLogger = createLogger('CURSOR');
export const wsLogger = createLogger('WS');
export const dbLogger = createLogger('DB');
