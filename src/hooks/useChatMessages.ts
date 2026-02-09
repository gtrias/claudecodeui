import { useState, useCallback } from 'react';

/**
 * Message interface
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  provider?: string;
  thinking?: string;
  toolUses?: any[];
  images?: any[];
  [key: string]: any;
}

/**
 * Props for useChatMessages hook
 */
export interface UseChatMessagesProps {
  /** Project name */
  projectName?: string;
  /** Session ID */
  sessionId?: string;
  /** Provider (claude, cursor, codex, pi) */
  provider?: string;
  /** Messages per page for pagination */
  messagesPerPage?: number;
}

/**
 * Return type for useChatMessages hook
 */
export interface UseChatMessagesReturn {
  /** Current messages */
  messages: Message[];
  /** Set messages */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Whether loading messages */
  isLoading: boolean;
  /** Whether loading more (pagination) */
  isLoadingMore: boolean;
  /** Whether has more messages to load */
  hasMore: boolean;
  /** Current streaming message */
  streamingMessage: string | null;
  /** Set streaming message */
  setStreamingMessage: (message: string | null) => void;
  /** Load messages for session */
  loadMessages: (loadMore?: boolean) => Promise<void>;
  /** Add a new message */
  addMessage: (message: Message) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Update a specific message */
  updateMessage: (id: string, updates: Partial<Message>) => void;
}

/**
 * Custom hook for managing chat messages
 * 
 * Features:
 * - Message state management
 * - Pagination support
 * - Streaming message handling
 * - Add/update/clear operations
 * 
 * Note: This is a simplified version. Full integration happens in US-036.
 * The actual ChatInterface has more complex message loading with API calls,
 * which will be integrated during final refactoring.
 */
export function useChatMessages(props?: UseChatMessagesProps): UseChatMessagesReturn {
  const {
    projectName,
    sessionId,
    provider = 'claude',
    messagesPerPage = 50
  } = props || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  /**
   * Load messages from API
   * Placeholder - actual implementation in US-036
   */
  const loadMessages = useCallback(async (loadMore = false) => {
    if (!projectName || !sessionId) return;

    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setMessages([]);
      setOffset(0);
    }

    try {
      // Actual API call will be integrated in US-036
      // For now, this is a placeholder structure
      console.log('Loading messages:', { projectName, sessionId, provider, offset: loadMore ? offset : 0 });
      
      // Simulated response structure
      const newMessages: Message[] = [];
      
      if (loadMore) {
        setMessages(prev => [...newMessages, ...prev]);
        setOffset(prev => prev + newMessages.length);
      } else {
        setMessages(newMessages);
        setOffset(newMessages.length);
      }
      
      setHasMore(newMessages.length === messagesPerPage);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [projectName, sessionId, provider, offset, messagesPerPage]);

  /**
   * Add a new message
   */
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(true);
  }, []);

  /**
   * Update a specific message by ID
   */
  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    isLoadingMore,
    hasMore,
    streamingMessage,
    setStreamingMessage,
    loadMessages,
    addMessage,
    clearMessages,
    updateMessage
  };
}

export default useChatMessages;
