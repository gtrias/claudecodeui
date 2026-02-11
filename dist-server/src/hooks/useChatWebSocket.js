import { useEffect, useRef, useCallback, useState } from 'react';
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
export function useChatWebSocket(props) {
    const { url, autoConnect = false, onMessage, onConnect, onDisconnect, onError, reconnectDelay = 3000, maxReconnectAttempts = 5 } = props || {};
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
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
                if (onConnect)
                    onConnect();
            };
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (onMessage)
                        onMessage(message);
                }
                catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };
            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError(event);
                if (onError)
                    onError(event);
            };
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;
                if (onDisconnect)
                    onDisconnect();
                // Attempt reconnection
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    console.log(`Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                }
                else {
                    console.warn('Max reconnection attempts reached');
                }
            };
            wsRef.current = ws;
        }
        catch (err) {
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
    const sendMessage = useCallback((message) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send message');
            return;
        }
        try {
            wsRef.current.send(JSON.stringify(message));
        }
        catch (err) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect, url]);
    return {
        isConnected,
        sendMessage,
        connect,
        disconnect,
        error
    };
}
export default useChatWebSocket;
