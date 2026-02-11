import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { IS_PLATFORM } from '../constants/config';
const WebSocketContext = createContext(null);
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
const buildWebSocketUrl = (token) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (IS_PLATFORM)
        return `${protocol}//${window.location.host}/ws`; // Platform mode: Use same domain as the page (goes through proxy)
    if (!token)
        return null;
    return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`; // OSS mode: Use same host:port that served the page
};
const useWebSocketProviderState = () => {
    const wsRef = useRef(null);
    const unmountedRef = useRef(false); // Track if component is unmounted
    const [latestMessage, setLatestMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef(null);
    const { token } = useAuth();
    const connect = useCallback(() => {
        if (unmountedRef.current)
            return; // Prevent connection if unmounted
        try {
            // Construct WebSocket URL
            const wsUrl = buildWebSocketUrl(token);
            if (!wsUrl)
                return console.warn('No authentication token found for WebSocket connection');
            const websocket = new WebSocket(wsUrl);
            websocket.onopen = () => {
                setIsConnected(true);
                wsRef.current = websocket;
            };
            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLatestMessage(data);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            websocket.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (unmountedRef.current)
                        return; // Prevent reconnection if unmounted
                    connect();
                }, 3000);
            };
            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }, [token]); // everytime token changes, we reconnect
    useEffect(() => {
        connect();
        return () => {
            unmountedRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, connect]); // everytime token changes, we reconnect
    const sendMessage = useCallback((message) => {
        const socket = wsRef.current;
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        }
        else {
            console.warn('WebSocket not connected');
        }
    }, [isConnected]);
    const value = useMemo(() => ({
        ws: wsRef.current,
        sendMessage,
        latestMessage,
        isConnected
    }), [sendMessage, latestMessage, isConnected]);
    return value;
};
export const WebSocketProvider = ({ children }) => {
    const webSocketData = useWebSocketProviderState();
    return (_jsx(WebSocketContext.Provider, { value: webSocketData, children: children }));
};
export default WebSocketContext;
