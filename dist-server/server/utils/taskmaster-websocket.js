/**
 * TaskMaster WebSocket Utility - TypeScript Version
 */
import { WebSocket } from 'ws';
export class TaskmasterWebSocket {
    constructor(config) {
        Object.defineProperty(this, "ws", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "token", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onOpen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onClose", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reconnectTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5000
        });
        Object.defineProperty(this, "reconnectTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.url = config.url;
        this.token = config.token;
        this.onOpen = config.onOpen;
        this.onClose = config.onClose;
        this.onError = config.onError;
        this.onMessage = config.onMessage;
    }
    connect() {
        if (this.ws) {
            this.close();
        }
        const url = this.token ? `${this.url}?token=${this.token}` : this.url;
        this.ws = new WebSocket(url);
        this.ws.on('open', () => {
            console.log('TaskMaster WebSocket connected');
            this.onOpen?.();
        });
        this.ws.on('close', (code, reason) => {
            console.log(`TaskMaster WebSocket closed: ${code} ${reason}`);
            this.onClose?.(code, reason.toString());
            this.scheduleReconnect();
        });
        this.ws.on('error', (error) => {
            console.error('TaskMaster WebSocket error:', error);
            this.onError?.(error);
        });
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.onMessage?.(message);
            }
            catch (error) {
                console.error('Error parsing message:', error);
            }
        });
    }
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        this.ws.send(JSON.stringify(message));
        return true;
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            console.log('Reconnecting to TaskMaster...');
            this.connect();
        }, this.reconnectTimeout);
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN || false;
    }
}
