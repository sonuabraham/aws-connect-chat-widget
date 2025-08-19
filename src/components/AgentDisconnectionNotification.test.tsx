import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi } from 'vitest';
import { AgentDisconnectionNotification } from './AgentDisconnectionNotification';

// Mock CSS imports
vi.mock('../styles/AgentDisconnectionNotification.css', () => ({}));

describe('AgentDisconnectionNotification', () => {
  const defaultProps = {
    isVisible: true,
    agentName: 'John Smith',
    onReconnect: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Visibility and Rendering', () => {
    it('should render when isVisible is true', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Agent Disconnected')).toBeInTheDocument();
    });

    it('should not render when isVisible is false', () => {
      render(
        <AgentDisconnectionNotification {...defaultProps} isVisible={false} />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should display agent name in message when provided', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      expect(
        screen.getByText(/John Smith has disconnected/)
      ).toBeInTheDocument();
    });

    it('should display generic message when agent name is not provided', () => {
      render(
        <AgentDisconnectionNotification
          {...defaultProps}
          agentName={undefined}
        />
      );

      expect(
        screen.getByText(/The agent has disconnected/)
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onReconnect when reconnect button is clicked', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      expect(defaultProps.onReconnect).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      // Should trigger animation and then call onDismiss
      act(() => {
        vi.advanceTimersByTime(300); // Animation duration
      });

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render reconnect button when onReconnect is not provided', () => {
      render(
        <AgentDisconnectionNotification
          {...defaultProps}
          onReconnect={undefined}
        />
      );

      expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });
  });

  describe('Auto-hide Functionality', () => {
    it('should auto-hide after default delay', async () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      // Fast-forward time by default delay (10 seconds)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Wait for animation to complete
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should auto-hide after custom delay', async () => {
      render(
        <AgentDisconnectionNotification
          {...defaultProps}
          autoHideDelay={5000}
        />
      );

      // Fast-forward time by custom delay (5 seconds)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Wait for animation to complete
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not auto-hide when autoHideDelay is 0', async () => {
      render(
        <AgentDisconnectionNotification {...defaultProps} autoHideDelay={0} />
      );

      // Fast-forward time significantly
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // Should not have called onDismiss
      expect(defaultProps.onDismiss).not.toHaveBeenCalled();
    });

    it('should clear timer when component unmounts', () => {
      const { unmount } = render(
        <AgentDisconnectionNotification {...defaultProps} />
      );

      unmount();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(15000);
      });

      // Should not have called onDismiss after unmount
      expect(defaultProps.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Animation States', () => {
    it('should apply hiding class during dismiss animation', async () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      // Should have hiding class during animation
      expect(
        document.querySelector('.agent-disconnection-notification--hiding')
      ).toBeInTheDocument();
    });

    it('should remain visible during animation', async () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      // Should still be in document during animation
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Complete animation
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible button labels', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      expect(screen.getByText('Reconnect')).toBeInTheDocument();
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const reconnectButton = screen.getByText('Reconnect');
      const dismissButton = screen.getByLabelText('Dismiss notification');

      // Buttons should be focusable
      reconnectButton.focus();
      expect(document.activeElement).toBe(reconnectButton);

      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callback functions gracefully', async () => {
      render(
        <AgentDisconnectionNotification
          isVisible={true}
          agentName="John Smith"
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');

      // Should not throw error when clicking without callbacks
      expect(() => {
        fireEvent.click(dismissButton);
      }).not.toThrow();
    });

    it('should handle rapid show/hide cycles', async () => {
      const { rerender } = render(
        <AgentDisconnectionNotification {...defaultProps} isVisible={true} />
      );

      // Quickly hide and show
      rerender(
        <AgentDisconnectionNotification {...defaultProps} isVisible={false} />
      );
      rerender(
        <AgentDisconnectionNotification {...defaultProps} isVisible={true} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle very long agent names', () => {
      const longName =
        'This is a very long agent name that might cause layout issues';
      render(
        <AgentDisconnectionNotification
          {...defaultProps}
          agentName={longName}
        />
      );

      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });
  });

  describe('Reconnect Flow', () => {
    it('should dismiss notification when reconnect is clicked', async () => {
      render(<AgentDisconnectionNotification {...defaultProps} />);

      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      // Should trigger dismiss animation
      expect(
        document.querySelector('.agent-disconnection-notification--hiding')
      ).toBeInTheDocument();

      // Complete animation
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
      expect(defaultProps.onReconnect).toHaveBeenCalledTimes(1);
    });
  });
});
