import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for ThinkingBlock component
 */
export interface ThinkingBlockProps {
  /** Thinking content (reasoning/reflection) */
  content: string;
  /** Whether to show thinking by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ThinkingBlock - Render AI's internal reasoning/thinking
 * 
 * Features:
 * - Collapsible thinking display
 * - Token count estimation
 * - Expand/collapse animation
 * - Visual distinction from regular content
 * - i18n support
 */
export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  defaultExpanded = false,
  className = ''
}) => {
  const { t } = useTranslation('chat');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!content) return null;

  // Estimate token count (rough approximation: ~4 chars per token)
  const estimatedTokens = Math.ceil(content.length / 4);

  return (
    <div className={`my-3 ${className}`}>
      <details 
        open={isExpanded}
        onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
        className="group"
      >
        <summary className="flex items-center gap-2 cursor-pointer list-none select-none p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/30 dark:border-purple-800/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          {/* Icon */}
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          </div>

          {/* Label */}
          <span className="font-medium text-sm text-purple-900 dark:text-purple-100">
            {t('thinking.label') || 'Thinking'}
          </span>

          {/* Token count badge */}
          <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
            ~{estimatedTokens} {t('thinking.tokens') || 'tokens'}
          </span>

          {/* Chevron */}
          <svg 
            className={`ml-auto w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </summary>

        {/* Thinking content */}
        <div className="mt-2 p-4 rounded-lg bg-white/50 dark:bg-gray-900/30 border border-purple-100 dark:border-purple-900/50">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-sans">
              {content}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
};

export default ThinkingBlock;
