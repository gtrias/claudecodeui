import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * WebSocket message type
 */
export interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

/**
 * Props for useChatWebSocket hook
 */
export interface UseChatWebSocketProps {
  /** WebSocket URL */
  url?: string;
  /** Whether to connect automatically */
  autoConnect?: boolean;
  /** Callback when message received */
  onMessage?: (message: WebSocketMessage) => void;
  /** Callback when connected */
  onConnect?: () => void;
  /** Callback when disconnected */
  onDisconnect?: () => void;
  /** Callback on error */
  onError?: (error: Event) => void;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
}

/**
 * Return type for useChatWebSocket hook
 */
export interface UseChatWebSocketReturn {
  /** WebSocket connection state */
  isConnected: boolean;
  /** Send a message */
  sendMessage: (message: WebSocketMessage) => void;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Last error */
  error: Event | null;
}

/**
 * Custom hook for WebSocket connection management
 * 
 * Features:
 * - Auto-connect and reconnection
 * - Message sending/receiving
 * - Connection state tracking
 * - Error handling
 * - Configurable reconnection strategy
 * 
 * Note: Placeholder implementation for the refactoring.
 * Full WebSocket logic integration happens in US-036.
 */
export function useChatWebSocket(props?: UseChatWebSocketProps): UseChatWebSocketReturn {
  const {
    url,
    autoConnect = false,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5
  } = props || {};

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!url) {
      console.warn('WebSocket URL not provided');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        if (onConnect) onConnect();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (onMessage) onMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        if (onError) onError(event);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        if (onDisconnect) onDisconnect();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          console.warn('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectDelay, maxReconnectAttempts]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Send a message through WebSocket
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
    }
  }, []);

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, url, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
    error
  };
}

export default useChatWebSocket;
