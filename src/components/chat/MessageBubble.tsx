import React from 'react';
import { MessageMarkdown } from './MessageMarkdown';

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Props for MessageBubble component
 */
export interface MessageBubbleProps {
  /** Message role */
  role: MessageRole;
  /** Message content (markdown) */
  content: string;
  /** Timestamp */
  timestamp?: string;
  /** Provider name (claude, cursor, codex, pi) */
  provider?: string;
  /** Whether message is being streamed */
  isStreaming?: boolean;
  /** Images attached to message */
  images?: any[];
  /** Markdown components override */
  markdownComponents?: Record<string, React.ComponentType<any>>;
  /** Additional CSS classes */
  className?: string;
  /** Children (for tool uses, thinking, etc.) */
  children?: React.ReactNode;
}

/**
 * MessageBubble - Render a chat message with role-based styling
 * 
 * Features:
 * - Role-based styling (user vs assistant)
 * - Markdown rendering
 * - Timestamp display
 * - Provider badge
 * - Streaming indicator
 * - Image attachments
 * - Custom markdown components
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  provider,
  isStreaming = false,
  images,
  markdownComponents,
  className = '',
  children
}) => {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-medium text-sm">
            AI
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header with timestamp and provider */}
        {(timestamp || provider) && (
          <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {timestamp && (
              <span>{new Date(timestamp).toLocaleTimeString()}</span>
            )}
            {provider && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
                {provider}
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 max-w-[85%] ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          {/* Images */}
          {images && images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((image, idx) => (
                <img
                  key={idx}
                  src={image.url || image.source?.url}
                  alt={image.alt || 'Attachment'}
                  className="max-w-xs rounded border border-gray-200 dark:border-gray-700"
                />
              ))}
            </div>
          )}

          {/* Markdown content */}
          {content && (
            <MessageMarkdown
              components={markdownComponents}
              className={isUser ? 'prose-invert' : ''}
            >
              {content}
            </MessageMarkdown>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <span className="inline-flex items-center gap-1 ml-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
            </span>
          )}

          {/* Additional content (tool uses, thinking, etc.) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
