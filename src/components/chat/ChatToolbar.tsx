import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for ChatToolbar component
 */
export interface ChatToolbarProps {
  /** Whether AI is currently responding */
  isResponding?: boolean;
  /** Stop generation callback */
  onStop?: () => void;
  /** Clear chat callback */
  onClear?: () => void;
  /** Scroll to bottom callback */
  onScrollToBottom?: () => void;
  /** Export chat callback */
  onExport?: () => void;
  /** Show settings callback */
  onShowSettings?: () => void;
  /** Show thinking toggle */
  showThinking?: boolean;
  /** Toggle thinking callback */
  onToggleThinking?: () => void;
  /** Token budget info */
  tokenBudget?: {
    used: number;
    total: number;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatToolbar - Action toolbar for chat interface
 * 
 * Features:
 * - Stop generation button
 * - Clear chat
 * - Scroll to bottom
 * - Export chat
 * - Show settings
 * - Toggle thinking display
 * - Token budget display
 * - Responsive layout
 */
export const ChatToolbar: React.FC<ChatToolbarProps> = ({
  isResponding = false,
  onStop,
  onClear,
  onScrollToBottom,
  onExport,
  onShowSettings,
  showThinking = false,
  onToggleThinking,
  tokenBudget,
  className = ''
}) => {
  const { t } = useTranslation('chat');

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Stop button (when responding) */}
      {isResponding && onStop && (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          title={t('toolbar.stop') || 'Stop'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          <span>{t('toolbar.stop') || 'Stop'}</span>
        </button>
      )}

      {/* Clear chat */}
      {onClear && (
        <button
          onClick={onClear}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={t('toolbar.clear') || 'Clear chat'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Scroll to bottom */}
      {onScrollToBottom && (
        <button
          onClick={onScrollToBottom}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={t('toolbar.scrollToBottom') || 'Scroll to bottom'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Export */}
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={t('toolbar.export') || 'Export chat'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}

      {/* Toggle thinking */}
      {onToggleThinking && (
        <button
          onClick={onToggleThinking}
          className={`p-2 rounded-md transition-colors ${
            showThinking
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title={t('toolbar.toggleThinking') || 'Toggle thinking display'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Token budget */}
      {tokenBudget && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-mono">
          <span className="text-gray-600 dark:text-gray-400">
            {t('toolbar.tokens') || 'Tokens'}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {tokenBudget.used.toLocaleString()} / {tokenBudget.total.toLocaleString()}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            ({Math.round((tokenBudget.used / tokenBudget.total) * 100)}%)
          </span>
        </div>
      )}

      {/* Settings */}
      {onShowSettings && (
        <button
          onClick={onShowSettings}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title={t('toolbar.settings') || 'Settings'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatToolbar;
