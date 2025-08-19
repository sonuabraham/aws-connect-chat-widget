import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebSocketManager,
  type WebSocketMessageHandler,
} from './WebSocketManager';
import type { ConnectionStatus } from '../types/aws-connect';
import type { Message } from '../types/chat';

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: WebSocket.OPEN,
  onopen: null as any,
  onmessage: null as any,
  onclose: null as any,
  onerror: null as any,
};

global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('WebSocketManager', () => {
  let webSocketManager: WebSocketManager;
  let mockHandler: WebSocketMessageHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    webSocketManager = new WebSocketManager();

    mockHandler = {
      onMessage: vi.fn(),
      onTyping: vi.fn(),
      onConnectionStatusChange: vi.fn(),
    };

    webSocketManager.setMessageHandler(mockHandler);
  });

  afterEach(() => {
    webSocketManager.cleanup();
    vi.clearAllTimers();
  });

  describe('connection management', () => {
    it('should connect to WebSocket successfully', async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');

      // Simulate WebSocket open event
      mockWebSocket.onopen();

      await expect(connectPromise).resolves.toBeUndefined();
      expect(webSocketManager.isConnected()).toBe(true);
      expect(webSocketManager.getState()).toBe('connected');
    });

    it('should handle connection errors', async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');

      // Simulate WebSocket error
      mockWebSocket.onerror(new Error('Connection failed'));

      await expect(connectPromise).rejects.toThrow(
        'WebSocket connection failed'
      );
      expect(webSocketManager.getState()).toBe('failed');
    });

    it('should disconnect properly', () => {
      webSocketManager.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Normal closure');
      expect(webSocketManager.getState()).toBe('disconnected');
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');
      mockWebSocket.onopen();
      await connectPromise;
    });

    it('should send messages when connected', () => {
      webSocketManager.sendMessage('Hello');

      expect(mockWebSocket.send).toHaveBeenCalledWith('Hello');
    });

    it('should queue messages when disconnected', () => {
      webSocketManager.disconnect();
      webSocketManager.sendMessage('Hello');

      expect(webSocketManager.getQueuedMessageCount()).toBe(1);
    });

    it('should handle incoming messages', () => {
      const mockMessage = {
        Type: 'MESSAGE',
        Id: '1',
        Content: 'Hello from agent',
        ParticipantRole: 'AGENT',
        AbsoluteTime: '2023-01-01T00:00:00Z',
      };

      mockWebSocket.onmessage({ data: JSON.stringify(mockMessage) });

      expect(mockHandler.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          content: 'Hello from agent',
          sender: 'agent',
        })
      );
    });

    it('should handle typing events', () => {
      const mockTypingEvent = {
        Type: 'EVENT',
        ContentType: 'application/vnd.amazonaws.connect.event.typing',
        ParticipantId: 'agent-1',
        ParticipantRole: 'AGENT',
        AbsoluteTime: '2023-01-01T00:00:00Z',
      };

      mockWebSocket.onmessage({ data: JSON.stringify(mockTypingEvent) });

      expect(mockHandler.onTyping).toHaveBeenCalledWith(true, 'agent-1');
    });
  });

  describe('typing indicators', () => {
    beforeEach(async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');
      mockWebSocket.onopen();
      await connectPromise;
    });

    it('should send typing indicator', () => {
      webSocketManager.sendTypingIndicator();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining(
          'application/vnd.amazonaws.connect.event.typing'
        )
      );
    });
  });

  describe('reconnection logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnection on abnormal close', async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');
      mockWebSocket.onopen();
      await connectPromise;

      // Simulate abnormal close
      mockWebSocket.onclose({ code: 1006 });

      expect(webSocketManager.getState()).toBe('reconnecting');
      expect(mockHandler.onConnectionStatusChange).toHaveBeenCalledWith(
        'reconnecting'
      );
    });

    it('should not reconnect on normal close', async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');
      mockWebSocket.onopen();
      await connectPromise;

      // Simulate normal close
      mockWebSocket.onclose({ code: 1000 });

      expect(webSocketManager.getState()).toBe('disconnected');
    });
  });

  describe('offline handling', () => {
    it('should queue messages when offline', () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      webSocketManager.sendMessage('Hello');

      expect(webSocketManager.getQueuedMessageCount()).toBe(1);
    });

    it('should handle online event', async () => {
      const connectPromise = webSocketManager.connect('wss://example.com');
      mockWebSocket.onopen();
      await connectPromise;

      // Simulate going offline then online
      Object.defineProperty(navigator, 'onLine', { value: false });
      webSocketManager.sendMessage('Hello');

      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Should process queued messages
      expect(mockWebSocket.send).toHaveBeenCalledWith('Hello');
    });
  });

  describe('message queue management', () => {
    it('should limit queue size', () => {
      // Fill queue beyond limit
      for (let i = 0; i < 150; i++) {
        webSocketManager.sendMessage(`Message ${i}`);
      }

      expect(webSocketManager.getQueuedMessageCount()).toBe(100);
    });

    it('should clear message queue', () => {
      webSocketManager.sendMessage('Hello');
      webSocketManager.clearMessageQueue();

      expect(webSocketManager.getQueuedMessageCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', () => {
      webSocketManager.sendMessage('Hello');
      webSocketManager.cleanup();

      expect(webSocketManager.getState()).toBe('disconnected');
      expect(webSocketManager.getQueuedMessageCount()).toBe(0);
    });
  });
});
