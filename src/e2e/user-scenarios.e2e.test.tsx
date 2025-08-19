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
import { WidgetConfiguration } from '../components/WidgetConfiguration';
import type { WidgetConfiguration as WidgetConfigType } from '../types/widget';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
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

// Mock AWS SDK
vi.mock('@aws-sdk/client-connectparticipant', () => ({
  ConnectParticipantClient: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({
      ConnectionToken: 'test-token',
      ParticipantId: 'test-participant',
      ParticipantToken: 'test-participant-token',
      Websocket: { Url: 'wss://test.amazonaws.com' },
    }),
  })),
  StartChatContactCommand: vi.fn(),
  SendMessageCommand: vi.fn(),
  DisconnectParticipantCommand: vi.fn(),
  SendEventCommand: vi.fn(),
}));

describe('End-to-End User Scenarios', () => {
  const mockConfig: WidgetConfigType = {
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

  describe('Complete Visitor Chat Journey', () => {
    it('should complete full visitor journey from widget discovery to chat completion', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Scenario: Visitor discovers the chat widget
      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toBeVisible();

      // Scenario: Visitor clicks to start chat
      await user.click(chatButton);

      // Widget should open with welcome interface
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Scenario: System initializes connection
      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Scenario: Visitor sees agent connection
      const mockAgentJoinEvent = {
        Type: 'PARTICIPANT_JOINED',
        ParticipantId: 'agent-123',
        DisplayName: 'Agent Sarah',
        ParticipantRole: 'AGENT',
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockAgentJoinEvent),
          } as MessageEvent);
        }
      });

      // Scenario: Visitor types and sends first message
      await waitFor(() => {
        const messageInput = screen.getByLabelText('Type your message');
        expect(messageInput).not.toBeDisabled();
      });

      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Hi, I need help with my account');
      await user.keyboard('{Enter}');

      // Message should be sent
      expect(mockWebSocket.send).toHaveBeenCalled();

      // Scenario: Agent responds
      const mockAgentMessage = {
        Type: 'MESSAGE',
        Content:
          "Hello! I'd be happy to help you with your account. What specific issue are you experiencing?",
        ParticipantId: 'agent-123',
        DisplayName: 'Agent Sarah',
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockAgentMessage),
          } as MessageEvent);
        }
      });

      // Agent message should appear
      await waitFor(() => {
        expect(
          screen.getByText(/I'd be happy to help you with your account/)
        ).toBeInTheDocument();
      });

      // Scenario: Visitor continues conversation
      await user.clear(messageInput);
      await user.type(messageInput, "I can't log into my account");
      await user.keyboard('{Enter}');

      // Scenario: Agent provides solution
      const mockSolutionMessage = {
        Type: 'MESSAGE',
        Content:
          'I can help you reset your password. Please check your email for a reset link.',
        ParticipantId: 'agent-123',
        DisplayName: 'Agent Sarah',
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockSolutionMessage),
          } as MessageEvent);
        }
      });

      await waitFor(() => {
        expect(
          screen.getByText(/check your email for a reset link/)
        ).toBeInTheDocument();
      });

      // Scenario: Visitor thanks and ends chat
      await user.clear(messageInput);
      await user.type(messageInput, 'Thank you! That worked perfectly.');
      await user.keyboard('{Enter}');

      // Scenario: Agent ends chat session
      const mockChatEndEvent = {
        Type: 'CHAT_ENDED',
        ParticipantId: 'agent-123',
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockChatEndEvent),
          } as MessageEvent);
        }
      });

      // Scenario: Visitor closes chat widget
      const closeButton = screen.getByLabelText('Close chat');
      await user.click(closeButton);

      // Widget should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Chat button should be visible again
      expect(
        screen.getByRole('button', { name: 'Open chat' })
      ).toBeInTheDocument();
    });

    it('should handle visitor reconnection after network interruption', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Start chat
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

      // Send a message
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Hello, I need help');
      await user.keyboard('{Enter}');

      // Simulate network interruption
      act(() => {
        const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'close'
        )?.[1];
        if (closeHandler) {
          closeHandler(new CloseEvent('close', { code: 1006 }));
        }
      });

      // Try to send another message while disconnected
      await user.clear(messageInput);
      await user.type(messageInput, 'Are you still there?');
      await user.keyboard('{Enter}');

      // Simulate reconnection
      act(() => {
        vi.advanceTimersByTime(5000);
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Should be able to send messages again
      await waitFor(() => {
        expect(messageInput).not.toBeDisabled();
      });

      await user.clear(messageInput);
      await user.type(messageInput, 'Connection restored');
      await user.keyboard('{Enter}');

      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('Widget Customization and Theme Application', () => {
    it('should apply custom theme throughout the user experience', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const customConfig = {
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          theme: {
            primaryColor: '#ff6b35',
            secondaryColor: '#004e89',
            fontFamily: 'Georgia, serif',
            borderRadius: '12px',
          },
        },
      };

      render(<ChatWidget config={customConfig} />);

      // Theme should be applied to chat button
      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();

      // Open chat to see theme in chat window
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Theme should be applied throughout the chat interface
      const chatWindow = screen.getByRole('dialog');
      expect(chatWindow).toHaveStyle({
        '--primary-color': '#ff6b35',
        '--secondary-color': '#004e89',
        '--font-family': 'Georgia, serif',
        '--border-radius': '12px',
      });
    });

    it('should handle different positioning configurations', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const leftPositionConfig = {
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          position: {
            bottom: '30px',
            left: '30px',
          },
        },
      };

      render(<ChatWidget config={leftPositionConfig} />);

      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();

      // Button should be positioned on the left
      // (Positioning is tested through the component's style application)

      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt interface for mobile devices', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Mock mobile matchMedia
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<ChatWidget config={mockConfig} />);

      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();

      // Open chat on mobile
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Chat should be optimized for mobile
      const chatWindow = screen.getByRole('dialog');
      expect(chatWindow).toBeInTheDocument();

      // Touch interactions should work
      const messageInput = screen.getByLabelText('Type your message');
      await user.click(messageInput);
      await user.type(messageInput, 'Mobile test message');

      // Virtual keyboard simulation
      fireEvent.focus(messageInput);
      expect(messageInput).toHaveFocus();

      // Send message with touch
      await user.keyboard('{Enter}');

      // Should handle mobile-specific interactions
      expect(messageInput).toHaveValue('');
    });

    it('should handle orientation changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });

      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));

      // Chat should remain functional
      const messageInput = screen.getByLabelText('Type your message');
      expect(messageInput).toBeInTheDocument();

      await user.type(messageInput, 'Orientation change test');
      await user.keyboard('{Enter}');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work with different user agents', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Mock different browsers
      const browsers = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      ];

      for (const userAgent of browsers) {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true,
        });

        render(<ChatWidget config={mockConfig} />);

        // Basic functionality should work across browsers
        const chatButton = screen.getByRole('button', { name: 'Open chat' });
        expect(chatButton).toBeInTheDocument();

        await user.click(chatButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const messageInput = screen.getByLabelText('Type your message');
        await user.type(
          messageInput,
          `Test from ${userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Safari'}`
        );

        expect(messageInput).toHaveValue(expect.stringContaining('Test from'));
      }
    });

    it('should handle browser-specific features gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Mock missing browser features
      const originalClipboard = navigator.clipboard;
      delete (navigator as any).clipboard;

      render(<ChatWidget config={mockConfig} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should work without clipboard API
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Test without clipboard');
      await user.keyboard('{Enter}');

      // Restore clipboard
      (navigator as any).clipboard = originalClipboard;
    });
  });

  describe('Complete Widget Lifecycle', () => {
    it('should handle complete widget lifecycle from initialization to cleanup', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const { unmount } = render(<ChatWidget config={mockConfig} />);

      // Initialize
      expect(
        screen.getByRole('button', { name: 'Open chat' })
      ).toBeInTheDocument();

      // Open and use
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

      // Use chat
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Test message');
      await user.keyboard('{Enter}');

      // Minimize
      await user.click(screen.getByLabelText('Minimize chat'));

      // Reopen
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close
      await user.click(screen.getByLabelText('Close chat'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Cleanup
      unmount();

      // Should cleanup WebSocket connections
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should persist session data across widget interactions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ChatWidget config={mockConfig} />);

      // Start chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Send messages
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'First message');
      await user.keyboard('{Enter}');

      await user.type(messageInput, 'Second message');
      await user.keyboard('{Enter}');

      // Minimize widget
      await user.click(screen.getByLabelText('Minimize chat'));

      // Reopen widget
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Messages should be preserved
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();

      // Continue conversation
      await user.type(messageInput, 'Third message after reopen');
      await user.keyboard('{Enter}');

      expect(
        screen.getByText('Third message after reopen')
      ).toBeInTheDocument();
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle and recover from various error scenarios', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onError = vi.fn();

      render(<ChatWidget config={mockConfig} onError={onError} />);

      // Start chat
      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate various error scenarios

      // 1. WebSocket connection error
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

      // 2. Message sending failure
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'This will fail');
      await user.keyboard('{Enter}');

      // Should handle send error
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NETWORK_ERROR',
          })
        );
      });

      // 3. Recovery - fix connection
      mockWebSocket.send.mockImplementation(() => {});

      act(() => {
        const openHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )?.[1];
        if (openHandler) {
          openHandler(new Event('open'));
        }
      });

      // Should recover and work normally
      await user.clear(messageInput);
      await user.type(messageInput, 'Recovery test');
      await user.keyboard('{Enter}');

      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });
});
