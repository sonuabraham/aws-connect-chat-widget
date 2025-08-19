import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AgentInfo } from './AgentInfo';
import type { AgentInfo as AgentInfoType } from '../types/chat';

// Mock CSS imports
vi.mock('../styles/AgentInfo.css', () => ({}));

describe('AgentInfo', () => {
  const mockAgent: AgentInfoType = {
    id: 'agent-123',
    name: 'John Smith',
    profileImage: 'https://example.com/avatar.jpg',
    status: 'online',
    isTyping: false,
  };

  const defaultProps = {
    agent: mockAgent,
    isConnected: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Information Display', () => {
    it('should display agent name and profile image when connected', () => {
      render(<AgentInfo {...defaultProps} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByAltText('John Smith profile')).toBeInTheDocument();
      expect(screen.getByAltText('John Smith profile')).toHaveAttribute(
        'src',
        'https://example.com/avatar.jpg'
      );
    });

    it('should display fallback avatar when profile image is not provided', () => {
      const agentWithoutImage = { ...mockAgent, profileImage: undefined };
      render(<AgentInfo agent={agentWithoutImage} isConnected={true} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(
        screen.queryByAltText('John Smith profile')
      ).not.toBeInTheDocument();
      // Fallback avatar should be visible
      expect(
        document.querySelector('.agent-info__avatar--fallback')
      ).toBeInTheDocument();
    });

    it('should handle image load errors gracefully', () => {
      render(<AgentInfo {...defaultProps} />);

      const image = screen.getByAltText('John Smith profile');
      fireEvent.error(image);

      // Image should be hidden and fallback should be shown
      expect(image).toHaveStyle('display: none');
    });

    it('should display placeholder when no agent and not connected', () => {
      render(<AgentInfo agent={undefined} isConnected={false} />);

      expect(screen.getByText('Customer Support')).toBeInTheDocument();
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(
        document.querySelector('.agent-info__avatar--placeholder')
      ).toBeInTheDocument();
    });

    it('should return null when no agent and connected', () => {
      const { container } = render(
        <AgentInfo agent={undefined} isConnected={true} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Agent Status Display', () => {
    it('should display online status with correct color', () => {
      render(<AgentInfo {...defaultProps} />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      const statusIndicator = screen.getByLabelText('Agent status: Online');
      expect(statusIndicator).toHaveStyle('background-color: #28a745');
    });

    it('should display away status with correct color', () => {
      const awayAgent = { ...mockAgent, status: 'away' as const };
      render(<AgentInfo agent={awayAgent} isConnected={true} />);

      expect(screen.getByText('Away')).toBeInTheDocument();
      const statusIndicator = screen.getByLabelText('Agent status: Away');
      expect(statusIndicator).toHaveStyle('background-color: #ffc107');
    });

    it('should display busy status with correct color', () => {
      const busyAgent = { ...mockAgent, status: 'busy' as const };
      render(<AgentInfo agent={busyAgent} isConnected={true} />);

      expect(screen.getByText('Busy')).toBeInTheDocument();
      const statusIndicator = screen.getByLabelText('Agent status: Busy');
      expect(statusIndicator).toHaveStyle('background-color: #dc3545');
    });

    it('should display offline status with correct color', () => {
      const offlineAgent = { ...mockAgent, status: 'offline' as const };
      render(<AgentInfo agent={offlineAgent} isConnected={true} />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      const statusIndicator = screen.getByLabelText('Agent status: Offline');
      expect(statusIndicator).toHaveStyle('background-color: #6c757d');
    });
  });

  describe('Typing Indicator', () => {
    it('should show typing indicator when agent is typing and showTypingIndicator is true', () => {
      const typingAgent = { ...mockAgent, isTyping: true };
      render(
        <AgentInfo
          agent={typingAgent}
          isConnected={true}
          showTypingIndicator={true}
        />
      );

      expect(screen.getByText('typing...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(document.querySelectorAll('.agent-info__typing-dot')).toHaveLength(
        3
      );
    });

    it('should not show typing indicator when showTypingIndicator is false', () => {
      const typingAgent = { ...mockAgent, isTyping: true };
      render(
        <AgentInfo
          agent={typingAgent}
          isConnected={true}
          showTypingIndicator={false}
        />
      );

      expect(screen.queryByText('typing...')).not.toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should not show typing indicator when agent is not typing', () => {
      render(<AgentInfo {...defaultProps} showTypingIndicator={true} />);

      expect(screen.queryByText('typing...')).not.toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for typing indicator', () => {
      const typingAgent = { ...mockAgent, isTyping: true };
      render(
        <AgentInfo
          agent={typingAgent}
          isConnected={true}
          showTypingIndicator={true}
        />
      );

      const typingStatus = screen.getByRole('status');
      expect(typingStatus).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Agent Disconnection Handling', () => {
    it('should call onAgentDisconnected when agent goes offline', async () => {
      const onAgentDisconnected = vi.fn();
      const { rerender } = render(
        <AgentInfo
          {...defaultProps}
          onAgentDisconnected={onAgentDisconnected}
        />
      );

      // Agent goes offline
      const offlineAgent = { ...mockAgent, status: 'offline' as const };
      rerender(
        <AgentInfo
          agent={offlineAgent}
          isConnected={true}
          onAgentDisconnected={onAgentDisconnected}
        />
      );

      await waitFor(() => {
        expect(onAgentDisconnected).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onAgentDisconnected when not connected', async () => {
      const onAgentDisconnected = vi.fn();
      const offlineAgent = { ...mockAgent, status: 'offline' as const };

      render(
        <AgentInfo
          agent={offlineAgent}
          isConnected={false}
          onAgentDisconnected={onAgentDisconnected}
        />
      );

      await waitFor(() => {
        expect(onAgentDisconnected).not.toHaveBeenCalled();
      });
    });

    it('should not call onAgentDisconnected when callback is not provided', async () => {
      const { rerender } = render(<AgentInfo {...defaultProps} />);

      const offlineAgent = { ...mockAgent, status: 'offline' as const };
      rerender(<AgentInfo agent={offlineAgent} isConnected={true} />);

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact styling when compact prop is true', () => {
      render(<AgentInfo {...defaultProps} compact={true} />);

      expect(
        document.querySelector('.agent-info--compact')
      ).toBeInTheDocument();
    });

    it('should not apply compact styling when compact prop is false', () => {
      render(<AgentInfo {...defaultProps} compact={false} />);

      expect(
        document.querySelector('.agent-info--compact')
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for status indicator', () => {
      render(<AgentInfo {...defaultProps} />);

      expect(screen.getByLabelText('Agent status: Online')).toBeInTheDocument();
    });

    it('should have proper alt text for profile image', () => {
      render(<AgentInfo {...defaultProps} />);

      expect(screen.getByAltText('John Smith profile')).toBeInTheDocument();
    });

    it('should truncate long agent names with title attribute', () => {
      const longNameAgent = {
        ...mockAgent,
        name: 'This is a very long agent name that should be truncated',
      };
      render(<AgentInfo agent={longNameAgent} isConnected={true} />);

      const nameElement = screen.getByText(
        'This is a very long agent name that should be truncated'
      );
      expect(nameElement).toHaveAttribute(
        'title',
        'This is a very long agent name that should be truncated'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined agent gracefully', () => {
      render(<AgentInfo agent={undefined} isConnected={true} />);

      expect(document.body).toBeInTheDocument(); // Should not crash
    });

    it('should handle agent with missing properties', () => {
      const incompleteAgent = {
        id: 'agent-123',
        name: 'John',
        status: 'online' as const,
        isTyping: false,
      };

      render(<AgentInfo agent={incompleteAgent} isConnected={true} />);

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });
});
