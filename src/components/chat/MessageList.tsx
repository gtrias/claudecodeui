import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Message interface (simplified)
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  /** Messages to display */
  messages: Message[];
  /** Whether loading messages */
  isLoading?: boolean;
  /** Whether loading more messages (pagination) */
  isLoadingMore?: boolean;
  /** Whether has more messages to load */
  hasMore?: boolean;
  /** Load more messages callback */
  onLoadMore?: () => void;
  /** Render function for each message */
  renderMessage: (message: Message, index: number) => React.ReactNode;
  /** Scroll container ref */
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** Auto-scroll to bottom */
  autoScroll?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MessageList - Scrollable list of chat messages
 * 
 * Features:
 * - Infinite scroll with "Load More" button
 * - Auto-scroll to bottom
 * - Empty state
 * - Loading indicators
 * - Reverse chronological order (new at bottom)
 * - Intersection observer for auto-loading
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  renderMessage,
  scrollRef,
  autoScroll = true,
  emptyMessage,
  className = ''
}) => {
  const { t } = useTranslation('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, autoScroll]);

  /**
   * Intersection observer for "load more" at top
   */
  useEffect(() => {
    if (!hasMore || !onLoadMore || !topSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(topSentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isLoadingMore]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Top sentinel for infinite scroll */}
        {hasMore && <div ref={topSentinelRef} className="h-1" />}

        {/* Load more button */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('messages.loadingMore') || 'Loading...'}
                </span>
              ) : (
                t('messages.loadMore') || 'Load more messages'
              )}
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{t('messages.loading') || 'Loading messages...'}</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">
              {emptyMessage || t('messages.empty') || 'No messages yet'}
            </p>
            <p className="text-sm mt-1">
              {t('messages.emptyHint') || 'Start a conversation to see messages here'}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <div key={message.id || index}>
            {renderMessage(message, index)}
          </div>
        ))}

        {/* Bottom anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
