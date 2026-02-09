import { useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Return type for useChatScroll hook
 */
export interface UseChatScrollReturn {
  /** Ref for the element at the end of messages (for auto-scroll) */
  messagesEndRef: React.RefObject<HTMLDivElement>;
  /** Ref for the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  /** Scroll to bottom of container */
  scrollToBottom: () => void;
  /** Check if user is near the bottom (within 50px) */
  isNearBottom: () => boolean;
  /** Handle scroll events (for detecting manual scrolling) */
  handleScroll: (onScrollUp?: (isNearBottom: boolean) => void) => void;
  /** Store pending scroll position for restoration after pagination */
  storePendingScroll: () => void;
  /** Restore scroll position after new content loads */
  restoreScrollPosition: () => void;
}

/**
 * Props for useChatScroll hook
 */
export interface UseChatScrollProps {
  /** Number of messages (used for triggering scroll restoration) */
  messageCount?: number;
}

/**
 * Custom hook for managing scroll behavior in chat interface
 * 
 * Features:
 * - Auto-scroll to bottom on new messages
 * - Detect when user scrolls up
 * - Restore scroll position after loading older messages
 * - Check proximity to bottom for auto-scroll decisions
 * 
 * @example
 * ```tsx
 * const { scrollContainerRef, scrollToBottom, isNearBottom } = useChatScroll({
 *   messageCount: messages.length
 * });
 * 
 * // In render:
 * <div ref={scrollContainerRef} onScroll={handleScroll}>
 *   {messages.map(msg => <Message key={msg.id} {...msg} />)}
 * </div>
 * ```
 */
export function useChatScroll(props?: UseChatScrollProps): UseChatScrollReturn {
  const { messageCount = 0 } = props || {};
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef<{
    height: number;
    top: number;
  } | null>(null);

  /**
   * Scroll to the bottom of the container
   * Does not reset user scroll state - let scroll handler manage it
   */
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  /**
   * Check if user is near the bottom of the scroll container
   * "Near bottom" is defined as within 50px from the bottom
   */
  const isNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Consider "near bottom" if within 50px of the bottom
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  /**
   * Store current scroll position for restoration after pagination
   * Call this before prepending new messages
   */
  const storePendingScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    pendingScrollRestoreRef.current = {
      height: container.scrollHeight,
      top: container.scrollTop
    };
  }, []);

  /**
   * Restore scroll position after new content loads
   * Automatically maintains user's position when older messages are added
   */
  const restoreScrollPosition = useCallback(() => {
    if (!pendingScrollRestoreRef.current || !scrollContainerRef.current) return;

    const { height, top } = pendingScrollRestoreRef.current;
    const container = scrollContainerRef.current;
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - height;

    container.scrollTop = top + Math.max(scrollDiff, 0);
    pendingScrollRestoreRef.current = null;
  }, []);

  /**
   * Handle scroll events
   * Optionally provide callback for when user scrolls (with near-bottom status)
   */
  const handleScroll = useCallback((onScrollUp?: (isNearBottom: boolean) => void) => {
    if (!scrollContainerRef.current) return;
    
    const nearBottom = isNearBottom();
    
    // Notify parent about scroll state if callback provided
    if (onScrollUp) {
      onScrollUp(nearBottom);
    }
  }, [isNearBottom]);

  /**
   * Auto-restore scroll position when message count changes
   * This runs after new messages are rendered (prepended from pagination)
   */
  useLayoutEffect(() => {
    restoreScrollPosition();
  }, [messageCount, restoreScrollPosition]);

  return {
    messagesEndRef,
    scrollContainerRef,
    scrollToBottom,
    isNearBottom,
    handleScroll,
    storePendingScroll,
    restoreScrollPosition
  };
}

export default useChatScroll;
