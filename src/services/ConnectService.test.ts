import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectService } from './ConnectService';
import type { ParticipantDetails, ChatSession } from '../types/aws-connect';

// Mock AWS SDK
vi.mock('@aws-sdk/client-connectparticipant', () => ({
  ConnectParticipantClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  CreateParticipantConnectionCommand: vi.fn(),
  SendMessageCommand: vi.fn(),
  GetTranscriptCommand: vi.fn(),
  DisconnectParticipantCommand: vi.fn(),
  SendEventCommand: vi.fn(),
}));

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

describe('ConnectService', () => {
  let connectService: ConnectService;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    connectService = new ConnectService('us-east-1');
    mockClient = (connectService as any).client;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create ConnectService with default region', () => {
      const service = new ConnectService();
      expect(service).toBeInstanceOf(ConnectService);
    });

    it('should create ConnectService with specified region', () => {
      const service = new ConnectService('us-west-2');
      expect(service).toBeInstanceOf(ConnectService);
    });
  });

  describe('initializeChat', () => {
    const mockParticipantDetails: ParticipantDetails = {
      displayName: 'Test User',
      email: 'test@example.com',
    };

    it('should throw error when startChatContact is not implemented', async () => {
      await expect(
        connectService.initializeChat(mockParticipantDetails)
      ).rejects.toThrow(
        'StartChatContact must be implemented by backend service'
      );
    });

    it('should notify connection status changes', async () => {
      const statusCallback = vi.fn();
      connectService.onConnectionStatusChange(statusCallback);

      try {
        await connectService.initializeChat(mockParticipantDetails);
      } catch (error) {
        // Expected to fail
      }

      expect(statusCallback).toHaveBeenCalledWith('connecting');
      expect(statusCallback).toHaveBeenCalledWith('failed');
    });
  });

  describe('sendMessage', () => {
    it('should throw error when no active session', async () => {
      await expect(connectService.sendMessage('Hello')).rejects.toThrow(
        'No active chat session'
      );
    });

    it('should send message when session is active', async () => {
      // Set up mock session
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockResolvedValue({});

      await connectService.sendMessage('Hello');

      expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should handle send message errors', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockRejectedValue(new Error('Network error'));

      await expect(connectService.sendMessage('Hello')).rejects.toThrow(
        'Failed to send message: Network error'
      );
    });
  });

  describe('receiveMessages', () => {
    it('should throw error when no active session', async () => {
      await expect(connectService.receiveMessages()).rejects.toThrow(
        'No active chat session'
      );
    });

    it('should receive and convert messages', async () => {
      (connectService as any).connectionToken = 'mock-token';

      const mockTranscript = [
        {
          Id: '1',
          Content: 'Hello from agent',
          ParticipantRole: 'AGENT',
          AbsoluteTime: '2023-01-01T00:00:00Z',
        },
      ];

      mockClient.send.mockResolvedValue({ Transcript: mockTranscript });

      const messages = await connectService.receiveMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        id: '1',
        content: 'Hello from agent',
        sender: 'agent',
        status: 'delivered',
        type: 'text',
      });
    });

    it('should handle empty transcript', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockResolvedValue({ Transcript: [] });

      const messages = await connectService.receiveMessages();

      expect(messages).toHaveLength(0);
    });
  });

  describe('endChat', () => {
    it('should disconnect and cleanup when session exists', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockResolvedValue({});

      await connectService.endChat();

      expect(mockClient.send).toHaveBeenCalledTimes(1);
      expect((connectService as any).connectionToken).toBeNull();
    });

    it('should cleanup even when disconnect fails', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockRejectedValue(new Error('Disconnect failed'));

      const statusCallback = vi.fn();
      connectService.onConnectionStatusChange(statusCallback);

      await expect(connectService.endChat()).rejects.toThrow(
        'Failed to end chat: Disconnect failed'
      );

      // Should still cleanup
      expect((connectService as any).connectionToken).toBeNull();
    });
  });

  describe('callback registration', () => {
    it('should register message callback', () => {
      const callback = vi.fn();
      connectService.onMessageReceived(callback);

      expect((connectService as any).messageCallbacks).toContain(callback);
    });

    it('should register agent status callback', () => {
      const callback = vi.fn();
      connectService.onAgentStatusChange(callback);

      expect((connectService as any).agentStatusCallbacks).toContain(callback);
    });

    it('should register connection status callback', () => {
      const callback = vi.fn();
      connectService.onConnectionStatusChange(callback);

      expect((connectService as any).connectionStatusCallbacks).toContain(
        callback
      );
    });
  });

  describe('sendTypingEvent', () => {
    it('should not throw when no active session', async () => {
      await expect(connectService.sendTypingEvent()).resolves.toBeUndefined();
    });

    it('should send typing event when session is active', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockResolvedValue({});

      await connectService.sendTypingEvent();

      expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should not throw when typing event fails', async () => {
      (connectService as any).connectionToken = 'mock-token';
      mockClient.send.mockRejectedValue(new Error('Network error'));

      await expect(connectService.sendTypingEvent()).resolves.toBeUndefined();
    });
  });

  describe('refreshConnectionToken', () => {
    it('should throw error when no participant token', async () => {
      await expect(connectService.refreshConnectionToken()).rejects.toThrow(
        'No participant token available for refresh'
      );
    });

    it('should refresh token when participant token exists', async () => {
      (connectService as any).participantToken = 'mock-participant-token';

      const mockResponse = {
        ConnectionCredentials: {
          ConnectionToken: 'new-token',
          Expiry: '2023-01-01T01:00:00Z',
        },
        Websocket: {
          Url: 'wss://example.com',
          ConnectionExpiry: '2023-01-01T01:00:00Z',
        },
      };

      mockClient.send.mockResolvedValue(mockResponse);

      await connectService.refreshConnectionToken();

      expect((connectService as any).connectionToken).toBe('new-token');
    });
  });

  describe('WebSocket message handling', () => {
    beforeEach(() => {
      (connectService as any).session = {
        websocketUrl: 'wss://example.com',
        connectionToken: 'mock-token',
        participantId: 'participant-1',
        participantToken: 'participant-token',
        startTime: new Date(),
      };
    });

    it('should handle incoming messages', () => {
      const messageCallback = vi.fn();
      connectService.onMessageReceived(messageCallback);

      const mockMessage = {
        Type: 'MESSAGE',
        Id: '1',
        Content: 'Hello',
        ParticipantRole: 'AGENT',
        AbsoluteTime: '2023-01-01T00:00:00Z',
      };

      // Simulate WebSocket message
      const handleMessage = (connectService as any).handleWebSocketMessage.bind(
        connectService
      );
      handleMessage({ data: JSON.stringify(mockMessage) });

      expect(messageCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          content: 'Hello',
          sender: 'agent',
        })
      );
    });

    it('should handle typing events', () => {
      const agentStatusCallback = vi.fn();
      connectService.onAgentStatusChange(agentStatusCallback);

      const mockTypingEvent = {
        Type: 'EVENT',
        ContentType: 'application/vnd.amazonaws.connect.event.typing',
        ParticipantId: 'agent-1',
        ParticipantRole: 'AGENT',
        AbsoluteTime: '2023-01-01T00:00:00Z',
      };

      const handleMessage = (connectService as any).handleWebSocketMessage.bind(
        connectService
      );
      handleMessage({ data: JSON.stringify(mockTypingEvent) });

      expect(agentStatusCallback).toHaveBeenCalledWith({
        agentId: 'agent-1',
        status: 'online',
        isTyping: true,
      });
    });

    it('should handle malformed WebSocket messages gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const handleMessage = (connectService as any).handleWebSocketMessage.bind(
        connectService
      );
      handleMessage({ data: 'invalid json' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('heartbeat mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start heartbeat when WebSocket opens', () => {
      (connectService as any).startHeartbeat();

      expect((connectService as any).heartbeatInterval).toBeTruthy();
    });

    it('should send heartbeat messages', () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      (connectService as any).websocket = mockWebSocket;
      (connectService as any).startHeartbeat();

      vi.advanceTimersByTime(30000);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ Type: 'HEARTBEAT' })
      );
    });

    it('should stop heartbeat', () => {
      (connectService as any).startHeartbeat();
      const intervalId = (connectService as any).heartbeatInterval;

      (connectService as any).stopHeartbeat();

      expect((connectService as any).heartbeatInterval).toBeNull();
    });
  });
});
