import type {
  WebSocketMessageType,
  ConnectMessageEvent,
  ConnectTypingEvent,
  ConnectionStatus,
} from '../types/aws-connect';
import type { Message } from '../types/chat';

/**
 * WebSocket connection states
 */
export type WebSocketState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/**
 * WebSocket message handler interface
 */
export interface WebSocketMessageHandler {
  onMessage: (message: Message) => void;
  onTyping: (isTyping: boolean, participantId: string) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
}

/**
 * WebSocket manager for AWS Connect real-time messaging
 * Supports requirements 3.1, 3.2, 3.4, 4.2
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private websocketUrl: string | null = null;
  private state: WebSocketState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandler: WebSocketMessageHandler | null = null;
  private messageQueue: string[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Set message handler for WebSocket events
   */
  setMessageHandler(handler: WebSocketMessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Connect to WebSocket with the provided URL
   * Requirement 3.1: Establish real-time connection
   */
  async connect(websocketUrl: string): Promise<void> {
    this.websocketUrl = websocketUrl;
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(websocketUrl);

        this.websocket.onopen = () => {
          this.setState('connected');
          this.resetReconnectAttempts();
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.websocket.onmessage = event => {
          this.handleMessage(event);
        };

        this.websocket.onclose = event => {
          this.handleClose(event);
        };

        this.websocket.onerror = error => {
          console.error('WebSocket error:', error);
          this.setState('failed');
          reject(new Error('WebSocket connection failed'));
        };

        // Set connection timeout
        setTimeout(() => {
          if (this.state === 'connecting') {
            this.websocket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        this.setState('failed');
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.websocket) {
      this.websocket.close(1000, 'Normal closure');
      this.websocket = null;
    }

    this.setState('disconnected');
  }

  /**
   * Send message through WebSocket
   * Requirement 3.2: Send messages with queuing for offline scenarios
   */
  sendMessage(message: string): void {
    if (this.isConnected() && this.isOnline) {
      try {
        this.websocket!.send(message);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Send typing indicator
   * Requirement 3.4: Implement typing indicators
   */
  sendTypingIndicator(): void {
    const typingMessage = JSON.stringify({
      Type: 'EVENT',
      ContentType: 'application/vnd.amazonaws.connect.event.typing',
      Content: JSON.stringify({ ParticipantRole: 'CUSTOMER' }),
    });

    this.sendMessage(typingMessage);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Get queued message count
   */
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnect();
    this.clearMessageQueue();
    this.messageHandler = null;

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const messageType: WebSocketMessageType = data.Type;

      switch (messageType) {
        case 'MESSAGE':
          this.handleIncomingMessage(data as ConnectMessageEvent);
          break;
        case 'EVENT':
          this.handleIncomingEvent(data);
          break;
        case 'HEARTBEAT':
          // Heartbeat received, connection is alive
          break;
        case 'CONNECTION_ACK':
        case 'CONNECTION_ESTABLISHED':
          // Connection acknowledged
          break;
        default:
          console.log('Unknown WebSocket message type:', messageType);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle incoming chat messages
   */
  private handleIncomingMessage(messageEvent: ConnectMessageEvent): void {
    if (!this.messageHandler) return;

    const message: Message = {
      id: messageEvent.Id || Date.now().toString(),
      content: messageEvent.Content || '',
      sender: messageEvent.ParticipantRole === 'AGENT' ? 'agent' : 'visitor',
      timestamp: new Date(messageEvent.AbsoluteTime || Date.now()),
      status: 'delivered',
      type: 'text',
    };

    this.messageHandler.onMessage(message);
  }

  /**
   * Handle incoming events (typing, agent status, etc.)
   */
  private handleIncomingEvent(eventData: any): void {
    if (!this.messageHandler) return;

    if (
      eventData.ContentType === 'application/vnd.amazonaws.connect.event.typing'
    ) {
      const typingEvent = eventData as ConnectTypingEvent;
      const isTyping = true; // AWS Connect sends typing events when typing starts

      this.messageHandler.onTyping(isTyping, typingEvent.ParticipantId);

      // Auto-clear typing indicator after 3 seconds
      setTimeout(() => {
        this.messageHandler?.onTyping(false, typingEvent.ParticipantId);
      }, 3000);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();

    if (event.code === 1000) {
      // Normal closure
      this.setState('disconnected');
    } else {
      // Abnormal closure, attempt reconnection
      this.attemptReconnection();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   * Requirement 4.2: Automatic reconnection logic with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('failed');
      this.messageHandler?.onConnectionStatusChange('failed');
      return;
    }

    this.setState('reconnecting');
    this.messageHandler?.onConnectionStatusChange('reconnecting');

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(async () => {
      if (!this.websocketUrl) {
        this.setState('failed');
        return;
      }

      try {
        await this.connect(this.websocketUrl);
        this.messageHandler?.onConnectionStatusChange('connected');
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage(JSON.stringify({ Type: 'HEARTBEAT' }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Reset reconnection attempts counter
   */
  private resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Set WebSocket state and notify handler
   */
  private setState(state: WebSocketState): void {
    this.state = state;

    // Map WebSocket state to connection status
    const connectionStatus: ConnectionStatus =
      state === 'connected'
        ? 'connected'
        : state === 'connecting'
          ? 'connecting'
          : state === 'reconnecting'
            ? 'reconnecting'
            : state === 'failed'
              ? 'failed'
              : 'disconnected';

    this.messageHandler?.onConnectionStatusChange(connectionStatus);
  }

  /**
   * Queue message for later delivery
   * Requirement 3.2: Message queuing system for offline scenarios
   */
  private queueMessage(message: string): void {
    this.messageQueue.push(message);

    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift(); // Remove oldest message
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    if (!this.isConnected() || this.messageQueue.length === 0) {
      return;
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach(message => {
      try {
        this.websocket!.send(message);
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // Re-queue failed message
        this.queueMessage(message);
      }
    });
  }

  /**
   * Handle browser online event
   */
  private handleOnline(): void {
    this.isOnline = true;

    if (this.state === 'disconnected' && this.websocketUrl) {
      this.attemptReconnection();
    } else if (this.isConnected()) {
      this.processMessageQueue();
    }
  }

  /**
   * Handle browser offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.messageHandler?.onConnectionStatusChange('disconnected');
  }
}
