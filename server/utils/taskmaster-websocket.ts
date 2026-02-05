/**
 * TaskMaster WebSocket Utility - TypeScript Version
 */

import { WebSocket } from 'ws';

export interface TaskmasterMessage {
  type: string;
  data?: unknown;
  error?: string;
}

export interface TaskmasterConfig {
  url: string;
  token?: string;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: TaskmasterMessage) => void;
}

export class TaskmasterWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token?: string;
  private onOpen?: () => void;
  private onClose?: (code: number, reason: string) => void;
  private onError?: (error: Error) => void;
  private onMessage?: (message: TaskmasterMessage) => void;
  private reconnectTimeout: number = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: TaskmasterConfig) {
    this.url = config.url;
    this.token = config.token;
    this.onOpen = config.onOpen;
    this.onClose = config.onClose;
    this.onError = config.onError;
    this.onMessage = config.onMessage;
  }

  connect(): void {
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
        const message = JSON.parse(data.toString()) as TaskmasterMessage;
        this.onMessage?.(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(message: TaskmasterMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify(message));
    return true;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Reconnecting to TaskMaster...');
      this.connect();
    }, this.reconnectTimeout);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }
}

export {
  TaskmasterWebSocket,
};
