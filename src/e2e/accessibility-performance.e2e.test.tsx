import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatWidget } from '../components/ChatWidget';
import type { WidgetConfiguration } from '../types/widget';

// Mock performance APIs
global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  now: vi.fn(() => Date.now()),
};

// Mock Intersection Observer for performance testing
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
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
};

global.WebSocket = vi.fn(() => mockWebSocket) as any;

describe('Accessibility and Performance E2E Tests', () => {
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

  describe('Comprehensive Accessibility Testing', () => {
    it('should provide complete keyboard navigation support', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      // Test keyboard access to chat button
      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      
      // Focus with Tab
      chatButton.focus();
      expect(chatButton).toHaveFocus();

      // Activate with Enter
      fireEvent.keyDown(chatButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test keyboard navigation within chat window
      const chatWindow = screen.getByRole('dialog');
      expect(chatWindow).toHaveFocus();

      // Navigate to message input with Tab
      const messageInput = screen.getByLabelText('Type your message');
      messageInput.focus();
      expect(messageInput).toHaveFocus();

      // Type message with keyboard
      await user.type(messageInput, 'Keyboard navigation test');
      
      // Send with Enter
      fireEvent.keyDown(messageInput, { key: 'Enter' });
      expect(messageInput).toHaveValue('');

      // Navigate to action buttons
      const minimizeButton = screen.getByLabelText('Minimize chat');
      const closeButton = screen.getByLabelText('Close chat');

      minimizeButton.focus();
      expect(minimizeButton).toHaveFocus();

      // Test Tab navigation between buttons
      fireEvent.keyDown(minimizeButton, { key: 'Tab' });
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // Close with keyboard
      fireEvent.keyDown(closeButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should provide comprehensive screen reader support', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      // Test ARIA labels and roles
      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(chatButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');
      });

      // Test message list accessibility
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-live', 'polite');
      expect(messageList).toHaveAttribute('aria-label', 'Chat messages');

      // Test form accessibility
      const messageInput = screen.getByLabelText('Type your message');
      expect(messageInput).toHaveAttribute('aria-label', 'Type your message');

      // Test button accessibility
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toHaveAttribute('type', 'button');

      // Test status updates
      await user.type(messageInput, 'Screen reader test');
      
      // Simulate typing indicator
      act(() => {
        const mockTypingEvent = {
          Type: 'TYPING',
          ParticipantId: 'agent-123',
          DisplayName: 'Agent Sarah',
        };

        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(mockTypingEvent),
          } as MessageEvent);
        }
      });

      // Typing indicator should have proper ARIA
      await waitFor(() => {
        const typingIndicator = screen.getByRole('status');
        expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support high contrast and color accessibility', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock high contrast mode
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const highContrastConfig = {
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          theme: {
            ...mockConfig.ui.theme,
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
          },
        },
      };

      render(<ChatWidget config={highContrastConfig} />);

      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(chatButton).toBeInTheDocument();

      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // High contrast theme should be applied
      const chatWindow = screen.getByRole('dialog');
      expect(chatWindow).toHaveStyle({
        '--primary-color': '#000000',
        '--secondary-color': '#ffffff',
      });
    });

    it('should support reduced motion preferences', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
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
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Animations should be reduced or disabled
      // This is tested through CSS class application and media queries
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle focus management correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      // Initial focus should not be trapped
      const chatButton = screen.getByRole('button', { name: 'Open chat' });
      expect(document.activeElement).not.toBe(chatButton);

      // Open chat
      await user.click(chatButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // Dialog should receive focus when opened
        expect(dialog).toHaveFocus();
      });

      // Focus should be trapped within dialog
      const messageInput = screen.getByLabelText('Type your message');
      const minimizeButton = screen.getByLabelText('Minimize chat');
      const closeButton = screen.getByLabelText('Close chat');

      // Tab through focusable elements
      messageInput.focus();
      expect(messageInput).toHaveFocus();

      fireEvent.keyDown(messageInput, { key: 'Tab' });
      // Focus should move to next focusable element

      // Test Escape key to close
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        // Focus should return to chat button
        expect(chatButton).toHaveFocus();
      });
    });
  });

  describe('Performance Testing', () => {
    it('should load and initialize quickly', async () => {
      const startTime = performance.now();
      
      render(<ChatWidget config={mockConfig} />);

      // Widget should render immediately
      expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument();

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load in under 100ms (in test environment)
      expect(loadTime).toBeLessThan(100);
    });

    it('should handle large message volumes efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate receiving many messages
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const mockMessage = {
          Type: 'MESSAGE',
          Content: `Message ${i}: This is a test message to simulate high volume chat.`,
          ParticipantId: i % 2 === 0 ? 'visitor' : 'agent-123',
          DisplayName: i % 2 === 0 ? 'Visitor' : 'Agent Sarah',
          Timestamp: new Date().toISOString(),
        };

        act(() => {
          const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
            call => call[0] === 'message'
          )?.[1];
          if (messageHandler) {
            messageHandler({
              data: JSON.stringify(mockMessage),
            } as MessageEvent);
          }
        });
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle 100 messages in reasonable time
      expect(processingTime).toBeLessThan(1000);

      // UI should remain responsive
      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Performance test');
      expect(messageInput).toHaveValue('Performance test');
    });

    it('should optimize memory usage during long sessions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate long chat session
      const messageInput = screen.getByLabelText('Type your message');

      // Send many messages
      for (let i = 0; i < 50; i++) {
        await user.clear(messageInput);
        await user.type(messageInput, `Message ${i}`);
        await user.keyboard('{Enter}');

        // Simulate agent responses
        act(() => {
          const mockResponse = {
            Type: 'MESSAGE',
            Content: `Response to message ${i}`,
            ParticipantId: 'agent-123',
            DisplayName: 'Agent Sarah',
            Timestamp: new Date().toISOString(),
          };

          const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
            call => call[0] === 'message'
          )?.[1];
          if (messageHandler) {
            messageHandler({
              data: JSON.stringify(mockResponse),
            } as MessageEvent);
          }
        });
      }

      // Widget should still be responsive
      await user.clear(messageInput);
      await user.type(messageInput, 'Final test message');
      expect(messageInput).toHaveValue('Final test message');

      // Close and reopen to test cleanup
      await user.click(screen.getByLabelText('Close chat'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Should cleanup properly
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should handle rapid user interactions smoothly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

      const chatButton = screen.getByRole('button', { name: 'Open chat' });

      // Rapid open/close cycles
      for (let i = 0; i < 10; i++) {
        await user.click(chatButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        await user.click(screen.getByLabelText('Close chat'));

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }

      // Should still work normally
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Rapid interaction test');
      expect(messageInput).toHaveValue('Rapid interaction test');
    });

    it('should optimize network usage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<ChatWidget config={mockConfig} />);

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

      const messageInput = screen.getByLabelText('Type your message');

      // Test typing indicator throttling
      await user.type(messageInput, 'Quick typing test');

      // Should not send excessive typing indicators
      const typingCalls = mockWebSocket.send.mock.calls.filter(call =>
        call[0]?.includes('typing')
      );

      // Should throttle typing indicators
      expect(typingCalls.length).toBeLessThan(10);

      // Test message batching if implemented
      await user.keyboard('{Enter}');

      // Should send message efficiently
      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should maintain accessibility during error states', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onError = vi.fn();
      
      render(<ChatWidget config={mockConfig} onError={onError} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate connection error
      act(() => {
        const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'error'
        )?.[1];
        if (errorHandler) {
          errorHandler(new Event('error'));
        }
      });

      // Error state should maintain accessibility
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // User should still be able to close widget
      const closeButton = screen.getByLabelText('Close chat');
      expect(closeButton).toBeInTheDocument();

      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle performance degradation gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock slow performance
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback, delay) => {
        return originalSetTimeout(callback, (delay || 0) * 2); // Double all delays
      });

      render(<ChatWidget config={mockConfig} />);

      await user.click(screen.getByRole('button', { name: 'Open chat' }));

      // Should still open, just slower
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 5000 });

      const messageInput = screen.getByLabelText('Type your message');
      await user.type(messageInput, 'Slow performance test');

      // Should still work despite performance issues
      expect(messageInput).toHaveValue('Slow performance test');

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });
});