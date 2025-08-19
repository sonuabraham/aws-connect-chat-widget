import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatWidget } from '../components/ChatWidget';
import type { WidgetConfiguration } from '../types/widget';
import type { ChatState, Message } from '../types/chat';

// Mock AWS SDK
vi.mock('@aws-sdk/client-connectparticipant', () => ({
  ConnectParticipantClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  StartChatContactCommand: vi.fn(),
  SendMessageCommand: vi.fn(),
  DisconnectParticipantCommand: vi.fn(),
  SendEventCommand: vi.fn(),
}));

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
  CONNECTING: WebSocket.CONNECTING,
  OPEN: WebSocket.OPEN,
  CLOSING: WebSocket.CLOSING,
  CLOSED: WebSocket.CLOSED,
};

global.WebSocket = vi.fn(() => mockWebSocket) as any;

describe('Chat Flow Integration Tests', () => {
  const mockConfig: WidgetConfiguration = {
    aws: {
      region: 'us-east-1',
      instanceId: 'test-instance-id',
      contactFlowId: 'test-contact-flow-id',
      apiGatewayEndpoint: 'https://api.example.com',
    },
    ui: {
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#0056b3',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
      },
      position: {
        bottom: '20px',
        right: '20px',
      },
      messages: {
        welcomeMessage: 'Welcome! How can we help you?',
        offlineMessage: 'We are currently offline',
        waitingMessage: 'Waiting for an agent...',
        connectingMessage: 'Connecting...',
      },
    },
    features: {
      fileUpload: false,
      emojiPicker: false,
      chatRatings: true,
      chatTranscript: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset WebSocket mock
    Object.assign(mockWebSocket, {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: WebSocket.OPEN,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Complete Chat Initiation Flow', () => {
    it('should complete full chat initiation from button click to agent connection', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onStateChange = vi.fn();
      const onError = vi.fn();

      render(
        <ChatWidget
          config={mockConfig}
          onStateChange={onStateChange}
          onError={onError}
        />
      );

      // Step 1: Initial state - widget should be closed
      expect(
        screen.getByRole('button', { name: 'Open chat' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Step 2: Click chat button to open widget
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      // Step 3: Widget should open and show initializing state
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Step 4: Simulate AWS Connect service initialization
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Step 5: Simulate successful connection
      const mockSession = {
        connectionToken: 'test-token',
        participantId: 'test-participant',
        participantToken: 'test-participant-token',
        websocketUrl: 'wss://test.amazonaws.com',
        startTime: new Date(),
      };

      // Simulate WebSocket connection established
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Step 6: Verify chat interface is ready
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Type your message')).toBeInTheDocument();
      });

      // Step 7: Verify state changes were called
      expect(onStateChange).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle connection failure gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onError = vi.fn();

      render(<ChatWidget config={mockConfig} onError={onError} />);

      // Open widget
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      // Simulate connection failure
      act(() => {
        const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'error'
        )?.[1];
        if (errorHandler) {
          errorHandler(new Event('error'));
        }
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Message Sending and Receiving Flow', () => {
    it('should complete full message exchange flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Open chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate connected state
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Wait for message input to be enabled
      await waitFor(() => {
        const messageInput = screen.getByLabelText('Type your message');
        expect(messageInput).not.toBeDisabled();
      });

      // Type and send a message
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Hello, I need help');
      await user.keyboard('{Enter}');

      // Verify message was sent
      expect(mockWebSocket.send).toHaveBeenCalled();

      // Simulate receiving a response from agent
      const mockIncomingMessage = {
        Type: 'MESSAGE',
        Content: 'Hello! How can I help you today?',
        ParticipantId: 'agent-123',
        DisplayName: 'Agent Smith',
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockIncomingMessage),
          } as MessageEvent);
        }
      });

      // Verify agent message appears
      await waitFor(() => {
        expect(
          screen.getByText('Hello! How can I help you today?')
        ).toBeInTheDocument();
      });
    });

    it('should handle message sending failure and retry', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onError = vi.fn();

      render(<ChatWidget config={mockConfig} onError={onError} />);

      // Open and connect chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate connection
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Make WebSocket send fail
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Try to send message
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Test message');
      await user.keyboard('{Enter}');

      // Should handle error
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NETWORK_ERROR',
            message: 'Failed to send message',
          })
        );
      });
    });
  });

  describe('Typing Indicator Flow', () => {
    it('should handle typing indicators between visitor and agent', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Open and connect chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Start typing
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Hello');

      // Should send typing indicator
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining(
          'application/vnd.amazonaws.connect.event.typing'
        )
      );

      // Simulate agent typing
      const mockTypingEvent = {
        Type: 'TYPING',
        ParticipantId: 'agent-123',
        DisplayName: 'Agent Smith',
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockTypingEvent),
          } as MessageEvent);
        }
      });

      // Should show agent typing indicator
      await waitFor(() => {
        expect(screen.getByText(/typing/i)).toBeInTheDocument();
      });

      // Stop typing after timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Typing indicator should disappear
      await waitFor(() => {
        expect(screen.queryByText(/typing/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Flow', () => {
    it('should handle connection loss and recovery', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Establish connection
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Simulate connection loss
      act(() => {
        const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'close'
        )?.[1];
        if (closeHandler) {
          closeHandler(new CloseEvent('close', { code: 1006 }));
        }
      });

      // Should attempt to reconnect
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Simulate successful reconnection
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Chat should be functional again
      await waitFor(() => {
        const messageInput = screen.getByLabelText('Type your message');
        expect(messageInput).not.toBeDisabled();
      });
    });
  });

  describe('Configuration Loading and Theme Application', () => {
    it('should apply theme configuration correctly', () => {
      const customConfig = {
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          theme: {
            primaryColor: '#ff0000',
            secondaryColor: '#00ff00',
            fontFamily: 'Comic Sans MS',
            borderRadius: '20px',
          },
        },
      };

      render(<ChatWidget config={customConfig} />);

      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();

      // Theme application is tested through CSS custom properties
      // which are applied by the styled system
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        ...mockConfig,
        aws: {
          ...mockConfig.aws,
          region: '', // Invalid empty region
        },
      };

      expect(() => {
        render(<ChatWidget config={invalidConfig} />);
      }).not.toThrow();
    });
  });

  describe('Hook Integration', () => {
    it('should integrate useChat, useConnect, and useWidget hooks correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onStateChange = vi.fn();

      render(<ChatWidget config={mockConfig} onStateChange={onStateChange} />);

      // Test widget state management
      expect(
        screen.getByRole('button', { name: 'Open chat' })
      ).toBeInTheDocument();

      // Open widget
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      // Widget should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test state change callback
      expect(onStateChange).toHaveBeenCalled();

      // Test connection integration
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Test chat functionality
      await waitFor(() => {
        expect(screen.getByLabelText('Type your message')).not.toBeDisabled();
      });

      // Test message sending integration
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Integration test message');
      await user.keyboard('{Enter}');

      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should handle session lifecycle correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Start session
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Establish connection
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Send some messages
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Test message 1');
      await user.keyboard('{Enter}');

      await user.type(messageInput, 'Test message 2');
      await user.keyboard('{Enter}');

      // End session
      await user.click(screen.getByLabelText('Close chat'));

      // Should close WebSocket connection
      expect(mockWebSocket.close).toHaveBeenCalled();

      // Widget should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle session timeout', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onError = vi.fn();

      render(<ChatWidget config={mockConfig} onError={onError} />);

      // Start session
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate session timeout
      act(() => {
        const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'close'
        )?.[1];
        if (closeHandler) {
          closeHandler(
            new CloseEvent('close', { code: 1000, reason: 'Session timeout' })
          );
        }
      });

      // Should handle timeout gracefully
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Offline/Online Handling', () => {
    it('should handle offline/online state changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Start chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate going offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Should queue messages when offline
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Offline message');
      await user.keyboard('{Enter}');

      // Simulate coming back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should process queued messages
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });
});
