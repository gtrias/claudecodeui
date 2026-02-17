/**
 * Frontend Logger Utility
 * 
 * Provides consistent logging across frontend components with
 * colored output in browser console and log level filtering.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get log level from localStorage or default to 'debug' for development
function getCurrentLogLevel(): LogLevel {
  if (typeof window !== 'undefined' && window.localStorage) {
    const level = localStorage.getItem('logLevel') as LogLevel;
    if (level && LOG_LEVEL_PRIORITY[level] !== undefined) {
      return level;
    }
  }
  // Default to 'info' in production, 'debug' in development
  return import.meta.env.DEV ? 'debug' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getCurrentLogLevel()];
}

// Console styling for different log levels
const styles = {
  prefix: 'font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  debug: 'background: #6b7280; color: white;',
  info: 'background: #3b82f6; color: white;',
  warn: 'background: #f59e0b; color: white;',
  error: 'background: #ef4444; color: white;',
  success: 'background: #10b981; color: white;',
};

/**
 * Create a logger instance for a specific module/component
 */
export function createLogger(prefix: string) {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(`%c${prefix}%c ${message}`, styles.prefix + styles.debug, '', ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(`%c${prefix}%c ${message}`, styles.prefix + styles.info, '', ...args);
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(`%c${prefix}%c ${message}`, styles.prefix + styles.warn, '', ...args);
      }
    },

    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(`%c${prefix}%c ${message}`, styles.prefix + styles.error, '', ...args);
      }
    },

    success: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(`%c${prefix}%c ${message}`, styles.prefix + styles.success, '', ...args);
      }
    },

    /**
     * Log with custom formatting for structured data
     */
    data: (label: string, data: unknown) => {
      if (shouldLog('debug')) {
        console.groupCollapsed(`%c${prefix}%c ${label}`, styles.prefix + styles.debug, '');
        console.log(data);
        console.groupEnd();
      }
    },
  };
}

// Pre-configured loggers for common modules
export const codexUILogger = createLogger('CODEX-UI');
export const claudeUILogger = createLogger('CLAUDE-UI');
export const wsLogger = createLogger('WS');
export const chatLogger = createLogger('CHAT');

/**
 * Set the log level (persists to localStorage)
 * Usage in browser console: window.setLogLevel('debug')
 */
if (typeof window !== 'undefined') {
  (window as unknown as { setLogLevel: (level: LogLevel) => void }).setLogLevel = (level: LogLevel) => {
    if (LOG_LEVEL_PRIORITY[level] !== undefined) {
      localStorage.setItem('logLevel', level);
      console.log(`Log level set to: ${level}`);
    } else {
      console.error(`Invalid log level: ${level}. Use one of: debug, info, warn, error`);
    }
  };
}
