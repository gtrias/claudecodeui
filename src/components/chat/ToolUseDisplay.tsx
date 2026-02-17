import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Tool input data (parsed JSON)
 */
export interface ToolInput {
  pattern?: string;
  path?: string;
  file_path?: string;
  old_string?: string;
  new_string?: string;
  content?: string;
  [key: string]: any;
}

/**
 * Tool result data
 */
export interface ToolResult {
  content?: string;
  isError?: boolean;
  toolUseResult?: any;
  [key: string]: any;
}

/**
 * Props for ToolUseDisplay component
 */
export interface ToolUseDisplayProps {
  /** Tool name (e.g., 'Edit', 'Grep', 'Read') */
  toolName: string;
  /** Tool ID */
  toolId: string;
  /** Tool input (JSON string) */
  toolInput?: string;
  /** Tool result */
  toolResult?: ToolResult;
  /** Whether to auto-expand details */
  autoExpand?: boolean;
  /** Whether this is a minimized display (for search tools) */
  minimized?: boolean;
  /** Callback for settings button */
  onShowSettings?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ToolUseDisplay - Render tool use information with styled display
 * 
 * Features:
 * - Minimized display for search tools (Grep, Glob)
 * - Full display for other tools (Edit, Write, etc.)
 * - Tool icon and name
 * - Expandable input/output details
 * - Settings button
 * - Result linking for search tools
 */
export const ToolUseDisplay: React.FC<ToolUseDisplayProps> = ({
  toolName,
  toolId,
  toolInput,
  toolResult,
  autoExpand = false,
  minimized = false,
  onShowSettings,
  className = ''
}) => {
  const { t } = useTranslation('chat');

  // Parse tool input
  let parsedInput: ToolInput | null = null;
  if (toolInput) {
    try {
      parsedInput = JSON.parse(toolInput);
    } catch (error) {
      console.error('Failed to parse tool input:', error);
    }
  }

  // Minimized display for search tools (Grep, Glob)
  if (minimized && ['Grep', 'Glob'].includes(toolName)) {
    return (
      <div className={`group relative bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-primary dark:border-primary pl-3 py-2 my-2 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          {/* Tool info */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0">
            {/* Search icon */}
            <svg 
              className="w-3.5 h-3.5 text-primary dark:text-primary flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>

            <span className="font-medium flex-shrink-0">{toolName}</span>
            <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">•</span>

            {/* Input details */}
            {parsedInput && (
              <span className="font-mono truncate flex-1 min-w-0">
                {parsedInput.pattern && (
                  <span>
                    {t('search.pattern') || 'Pattern'}{' '}
                    <span className="text-primary dark:text-primary">{parsedInput.pattern}</span>
                  </span>
                )}
                {parsedInput.path && (
                  <span className="ml-2">
                    {t('search.in') || 'in'} {parsedInput.path}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Result link */}
          {toolResult && (
            <a
              href={`#tool-result-${toolId}`}
              className="flex-shrink-0 text-xs text-primary dark:text-primary hover:text-primary/80 dark:hover:text-primary font-medium transition-colors flex items-center gap-1"
            >
              <span>{t('tools.searchResults') || 'Results'}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Full display for other tools
  return (
    <div className={`group relative bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/10 dark:to-accent/5 border border-primary/20/30 dark:border-primary/30/30 rounded-lg p-3 mb-2 ${className}`}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/3 dark:from-primary/5 dark:to-primary/3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Tool icon */}
          <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-primary dark:from-primary dark:to-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 dark:shadow-primary/20">
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            {/* Subtle pulse animation */}
            <div className="absolute inset-0 rounded-lg bg-primary dark:bg-primary animate-pulse opacity-20" />
          </div>

          {/* Tool name and ID */}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {toolName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {toolId}
            </span>
          </div>
        </div>

        {/* Settings button */}
        {onShowSettings && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowSettings();
            }}
            className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group/btn backdrop-blur-sm"
            title={t('tools.settings') || 'Settings'}
          >
            <svg 
              className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-primary dark:group-hover/btn:text-primary transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tool input display (if provided - will be expanded in actual usage) */}
      {parsedInput && (
        <div className="relative text-xs text-gray-600 dark:text-gray-400 font-mono bg-white/50 dark:bg-gray-900/30 rounded p-2">
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(parsedInput, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolUseDisplay;
