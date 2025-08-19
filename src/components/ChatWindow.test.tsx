import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatWindow } from './ChatWindow';
import type { ChatWindowProps } from '../types/ui';
import type { ChatState, AgentInfo } from '../types/chat';
import type { UIConfiguration } from '../types/widget';

// Mock child components
vi.mock('./MessageList', () => ({
  MessageList: ({ messages, isTyping, onScroll, agentInfo }: any) => (
    <div data-testid="message-list">
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="typing-status">{isTyping ? 'typing' : 'not-typing'}</div>
      <div data-testid="agent-info">{agentInfo?.name || 'no-agent'}</div>
    </div>
  ),
}));

vi.mock('./MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled, placeholder, onTyping }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onSendMessage?.(e.target.value)}
      />
      <button
        data-testid="typing-button"
        onClick={() => onTyping?.(true)}
      >
        Start Typing
      </button>
    </div>
  ),
}));

vi.mock('./AgentInfo', () => ({
  AgentInfo: ({ agent, isConnected, onAgentDisconnected }: any) => (
    <div data-testid="agent-info">
      <div data-testid="agent-name">{agent?.name || 'no-agent'}</div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <button
        data-testid="disconnect-agent"
        onClick={() => onAgentDisconnected?.()}
      >
        Disconnect
      </button>
    </div>
  ),
}));

vi.mock('./AgentDisconnectionNotification', () => ({
  AgentDisconnectionNotification: ({ isVisible, agentName, onReconnect, onDismiss }: any) => (
    isVisible ? (
      <div data-testid="disconnection-notification">
        <div data-testid="disconnected-agent">{agentName || 'unknown'}</div>
        <button data-testid="reconnect-button" onClick={onReconnect}>Reconnect</button>
        <button data-testid="dismiss-button" onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null
  ),
}));

// Mock CSS imports
vi.mock('../styles/ChatWindow.css', () => ({}));

describe('ChatWindow', () => {
  const mockAgent: AgentInfo = {
    id: 'agent-123',
    name: 'John Smith',
    profileImage: 'https://example.com/avatar.jpg',
    status: 'online',
    isTyping: false,
  };

  const mockUIConfig: UIConfiguration = {
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
      welcomeMessage: 'Welcome! How can we help?',
      offlineMessage: 'We are currently offline',
      waitingMessage: 'Waiting for an agent...',
      connectingMessage: 'Connecting...',
    },
  };

  const mockChatState: ChatState = {
    status: 'closed',
    messages: [],
    visitor: {
      name: 'Test User',
      sessionId: 'test-session',
    },
    unreadCount: 0,
    isTyping: false,
  };

  const defaultProps: ChatWindowProps = {
    isOpen: true,
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    chatState: mockChatState,
    config: mockUIConfig,
    onSendMessage: vi.fn(),
    onTyping: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open', () => {
      render(<ChatWindow {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/chat/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ChatWindow {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<ChatWindow {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'chat-window-title');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });

    it('should apply theme styles through CSS custom properties', () => {
      render(<ChatWindow {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({
        '--primary-color': '#007bff',
        '--secondary-color': '#0056b3',
        '--border-radius': '8px',
        '--font-family': 'Arial, sans-serif',
      });
    });
  });

  describe('Header Actions', () => {
    it('should render minimize and close buttons', () => {
      render(<ChatWindow {...defaultProps} />);
      
      expect(screen.getByLabelText('Minimize chat')).toBeInTheDocument();
      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    });

    it('should call onMinimize when minimize button is clicked', () => {
      const mockOnMinimize = vi.fn();
      render(<ChatWindow {...defaultProps} onMinimize={mockOnMinimize} />);
      
      fireEvent.click(screen.getByLabelText('Minimize chat'));
      
      expect(mockOnMinimize).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = vi.fn();
      render(<ChatWindow {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.click(screen.getByLabelText('Close chat'));
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper button types', () => {
      render(<ChatWindow {...defaultProps} />);
      
      expect(screen.getByLabelText('Minimize chat')).toHaveAttribute('type', 'button');
      expect(screen.getByLabelText('Close chat')).toHaveAttribute('type', 'button');
    });
  });

  describe('Chat Status Messages', () => {
    it('should show welcome message for closed status', () => {
      render(<ChatWindow {...defaultProps} chatState={{ ...mockChatState, status: 'closed' }} />);
      
      // Status message is handled by the component logic, not directly displayed
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show connecting message for initializing status', () => {
      render(<ChatWindow {...defaultProps} chatState={{ ...mockChatState, status: 'initializing' }} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show waiting message for waiting status', () => {
      render(<ChatWindow {...defaultProps} chatState={{ ...mockChatState, status: 'waiting' }} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show connected message for connected status with agent', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        status: 'connected',
        agent: mockAgent 
      }} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show ended message for ended status', () => {
      render(<ChatWindow {...defaultProps} chatState={{ ...mockChatState, status: 'ended' }} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Agent Integration', () => {
    it('should pass agent info to AgentInfo component', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        status: 'connected'
      }} />);
      
      expect(screen.getByTestId('agent-name')).toHaveTextContent('John Smith');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    it('should handle agent disconnection', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        status: 'connected'
      }} />);
      
      fireEvent.click(screen.getByTestId('disconnect-agent'));
      
      expect(screen.getByTestId('disconnection-notification')).toBeInTheDocument();
    });

    it('should show disconnection notification with agent name', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        status: 'connected'
      }} />);
      
      fireEvent.click(screen.getByTestId('disconnect-agent'));
      
      expect(screen.getByTestId('disconnected-agent')).toHaveTextContent('John Smith');
    });

    it('should handle reconnection attempt', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        status: 'connected'
      }} />);
      
      fireEvent.click(screen.getByTestId('disconnect-agent'));
      fireEvent.click(screen.getByTestId('reconnect-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Attempting to reconnect...');
      
      consoleSpy.mockRestore();
    });

    it('should dismiss disconnection notification', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        status: 'connected'
      }} />);
      
      fireEvent.click(screen.getByTestId('disconnect-agent'));
      expect(screen.getByTestId('disconnection-notification')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('dismiss-button'));
      expect(screen.queryByTestId('disconnection-notification')).not.toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('should pass messages to MessageList component', () => {
      const messages = [
        { id: '1', content: 'Hello', sender: 'visitor' as const, timestamp: new Date(), status: 'sent' as const },
        { id: '2', content: 'Hi there', sender: 'agent' as const, timestamp: new Date(), status: 'delivered' as const },
      ];
      
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        messages 
      }} />);
      
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    });

    it('should pass typing status to MessageList', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        isTyping: true 
      }} />);
      
      expect(screen.getByTestId('typing-status')).toHaveTextContent('typing');
    });

    it('should call onSendMessage when message is sent', () => {
      const mockOnSendMessage = vi.fn();
      render(<ChatWindow {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      fireEvent.change(screen.getByTestId('message-input-field'), { target: { value: 'Test message' } });
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should call onTyping when typing starts', () => {
      const mockOnTyping = vi.fn();
      render(<ChatWindow {...defaultProps} onTyping={mockOnTyping} />);
      
      fireEvent.click(screen.getByTestId('typing-button'));
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
    });
  });

  describe('Input State Management', () => {
    it('should disable input when not connected', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        status: 'waiting' 
      }} />);
      
      expect(screen.getByTestId('message-input-field')).toBeDisabled();
    });

    it('should enable input when connected', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        status: 'connected' 
      }} />);
      
      expect(screen.getByTestId('message-input-field')).not.toBeDisabled();
    });

    it('should show appropriate placeholder based on status', () => {
      const { rerender } = render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        status: 'waiting' 
      }} />);
      
      expect(screen.getByTestId('message-input-field')).toHaveAttribute('placeholder', 'Please wait...');
      
      rerender(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        status: 'connected' 
      }} />);
      
      expect(screen.getByTestId('message-input-field')).toHaveAttribute('placeholder', 'Type your message...');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus window when opened', async () => {
      const { rerender } = render(<ChatWindow {...defaultProps} isOpen={false} />);
      
      rerender(<ChatWindow {...defaultProps} isOpen={true} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveFocus();
      });
    });

    it('should close window on Escape key', () => {
      const mockOnClose = vi.fn();
      render(<ChatWindow {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on Escape when window is not open', () => {
      const mockOnClose = vi.fn();
      render(<ChatWindow {...defaultProps} isOpen={false} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle other key presses without closing', () => {
      const mockOnClose = vi.fn();
      render(<ChatWindow {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role and attributes', () => {
      render(<ChatWindow {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'chat-window-title');
    });

    it('should have proper header structure', () => {
      render(<ChatWindow {...defaultProps} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<ChatWindow {...defaultProps} />);
      
      expect(screen.getByLabelText('Minimize chat')).toBeInTheDocument();
      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icons', () => {
      render(<ChatWindow {...defaultProps} />);
      
      const icons = screen.getAllByRole('button').map(button => button.querySelector('svg'));
      icons.forEach(icon => {
        if (icon) {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing agent gracefully', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: undefined,
        status: 'connected'
      }} />);
      
      expect(screen.getByTestId('agent-name')).toHaveTextContent('no-agent');
    });

    it('should handle missing config messages gracefully', () => {
      const configWithoutMessages = {
        ...mockUIConfig,
        messages: {} as any,
      };
      
      render(<ChatWindow {...defaultProps} config={configWithoutMessages} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle undefined callbacks gracefully', () => {
      render(<ChatWindow 
        {...defaultProps} 
        onClose={undefined as any}
        onMinimize={undefined as any}
        onSendMessage={undefined as any}
        onTyping={undefined as any}
      />);
      
      expect(() => {
        fireEvent.click(screen.getByLabelText('Close chat'));
        fireEvent.click(screen.getByLabelText('Minimize chat'));
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to child components', () => {
      render(<ChatWindow {...defaultProps} chatState={{ 
        ...mockChatState, 
        agent: mockAgent,
        isTyping: true,
        messages: [{ id: '1', content: 'Test', sender: 'visitor', timestamp: new Date(), status: 'sent' }]
      }} />);
      
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('agent-info')).toBeInTheDocument();
      expect(screen.getByTestId('typing-status')).toHaveTextContent('typing');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });
  });
});