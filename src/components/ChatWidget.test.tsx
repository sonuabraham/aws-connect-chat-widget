import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatWidget } from './ChatWidget';
import type { ChatWidgetProps } from '../types/ui';
import type { WidgetConfiguration } from '../types/widget';

// Mock hooks
const mockUseChat = {
  chatState: {
    status: 'closed' as const,
    messages: [],
    visitor: { name: 'Test User', sessionId: 'test-session' },
    unreadCount: 0,
    isTyping: false,
  },
  initializeChat: vi.fn(),
  sendMessage: vi.fn(),
  endChat: vi.fn(),
  markMessagesAsRead: vi.fn(),
  setTyping: vi.fn(),
};

const mockUseConnect = {
  connectService: null,
  initialize: vi.fn(),
  connectionStatus: 'disconnected' as const,
};

const mockUseWidget = {
  isOpen: false,
  isMinimized: false,
  widgetState: 'closed' as const,
  position: { bottom: '20px', right: '20px' },
  visitorInfo: null,
  hasVisitorInfo: false,
  openWidget: vi.fn(),
  closeWidget: vi.fn(),
  minimizeWidget: vi.fn(),
  setVisitorInfo: vi.fn(),
};

vi.mock('../hooks/useChat', () => ({
  useChat: vi.fn(() => mockUseChat),
}));

vi.mock('../hooks/useConnect', () => ({
  useConnect: vi.fn(() => mockUseConnect),
}));

vi.mock('../hooks/useWidget', () => ({
  useWidget: vi.fn(() => mockUseWidget),
}));

// Mock child components
vi.mock('./ChatButton', () => ({
  ChatButton: ({ isOpen, unreadCount, onClick, config, position }: any) => (
    <button
      data-testid="chat-button"
      data-is-open={isOpen}
      data-unread-count={unreadCount}
      onClick={onClick}
    >
      Chat Button
    </button>
  ),
}));

vi.mock('./ChatWindow', () => ({
  ChatWindow: ({ isOpen, onClose, onMinimize, chatState, onSendMessage, onTyping }: any) => (
    isOpen ? (
      <div data-testid="chat-window">
        <button data-testid="close-button" onClick={onClose}>Close</button>
        <button data-testid="minimize-button" onClick={onMinimize}>Minimize</button>
        <button data-testid="send-message" onClick={() => onSendMessage('test message')}>Send</button>
        <button data-testid="start-typing" onClick={() => onTyping(true)}>Start Typing</button>
        <div data-testid="chat-status">{chatState.status}</div>
      </div>
    ) : null
  ),
}));

describe('ChatWidget', () => {
  const mockConfig: WidgetConfiguration = {
    aws: {
      region: 'us-east-1',
      instanceId: 'test-instance',
      contactFlowId: 'test-flow',
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
        welcomeMessage: 'Welcome!',
        offlineMessage: 'We are offline',
        waitingMessage: 'Please wait...',
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

  const defaultProps: ChatWidgetProps = {
    config: mockConfig,
    onStateChange: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    Object.assign(mockUseChat, {
      chatState: {
        status: 'closed' as const,
        messages: [],
        visitor: { name: 'Test User', sessionId: 'test-session' },
        unreadCount: 0,
        isTyping: false,
      },
      initializeChat: vi.fn(),
      sendMessage: vi.fn(),
      endChat: vi.fn(),
      markMessagesAsRead: vi.fn(),
      setTyping: vi.fn(),
    });

    Object.assign(mockUseConnect, {
      connectService: null,
      initialize: vi.fn(),
      connectionStatus: 'disconnected' as const,
    });

    Object.assign(mockUseWidget, {
      isOpen: false,
      isMinimized: false,
      widgetState: 'closed' as const,
      position: { bottom: '20px', right: '20px' },
      visitorInfo: null,
      hasVisitorInfo: false,
      openWidget: vi.fn(),
      closeWidget: vi.fn(),
      minimizeWidget: vi.fn(),
      setVisitorInfo: vi.fn(),
    });
  });

  describe('Basic Rendering', () => {
    it('should render chat button', () => {
      render(<ChatWidget {...defaultProps} />);
      
      expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    });

    it('should not render chat window when closed', () => {
      render(<ChatWidget {...defaultProps} />);
      
      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    });

    it('should render chat window when open', () => {
      Object.assign(mockUseWidget, { isOpen: true });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });
  });

  describe('AWS Connect Initialization', () => {
    it('should initialize AWS Connect service on mount', () => {
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseConnect.initialize).toHaveBeenCalledWith(mockConfig.aws);
    });

    it('should handle AWS Connect initialization error', async () => {
      const mockOnError = vi.fn();
      const initError = new Error('Connection failed');
      mockUseConnect.initialize.mockRejectedValue(initError);
      
      render(<ChatWidget {...defaultProps} onError={mockOnError} />);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          code: 'AWS_CONNECTION_FAILED',
          message: 'Failed to connect to AWS Connect service',
          details: { error: 'Connection failed' },
        });
      });
    });

    it('should not reinitialize on subsequent renders', () => {
      const { rerender } = render(<ChatWidget {...defaultProps} />);
      
      rerender(<ChatWidget {...defaultProps} />);
      
      expect(mockUseConnect.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Widget State Management', () => {
    it('should call onStateChange when widget state changes', () => {
      const mockOnStateChange = vi.fn();
      Object.assign(mockUseWidget, { widgetState: 'initializing' });
      
      render(<ChatWidget {...defaultProps} onStateChange={mockOnStateChange} />);
      
      expect(mockOnStateChange).toHaveBeenCalledWith('initializing');
    });

    it('should handle missing onStateChange callback', () => {
      Object.assign(mockUseWidget, { widgetState: 'initializing' });
      
      expect(() => {
        render(<ChatWidget {...defaultProps} onStateChange={undefined} />);
      }).not.toThrow();
    });
  });

  describe('Chat Button Interactions', () => {
    it('should open widget when chat button is clicked and widget is closed', () => {
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('chat-button'));
      
      expect(mockUseWidget.openWidget).toHaveBeenCalled();
    });

    it('should close widget when chat button is clicked and widget is open', () => {
      Object.assign(mockUseWidget, { isOpen: true });
      
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('chat-button'));
      
      expect(mockUseWidget.closeWidget).toHaveBeenCalled();
    });

    it('should open widget and mark messages as read when minimized', () => {
      Object.assign(mockUseWidget, { isMinimized: true });
      
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('chat-button'));
      
      expect(mockUseWidget.openWidget).toHaveBeenCalled();
      expect(mockUseChat.markMessagesAsRead).toHaveBeenCalled();
    });
  });

  describe('Chat Window Interactions', () => {
    beforeEach(() => {
      Object.assign(mockUseWidget, { isOpen: true });
    });

    it('should close widget when chat window close button is clicked', () => {
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('close-button'));
      
      expect(mockUseWidget.closeWidget).toHaveBeenCalled();
    });

    it('should end chat before closing when connected', async () => {
      Object.assign(mockUseChat, { 
        chatState: { ...mockUseChat.chatState, status: 'connected' }
      });
      
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('close-button'));
      
      await waitFor(() => {
        expect(mockUseChat.endChat).toHaveBeenCalled();
      });
      expect(mockUseWidget.closeWidget).toHaveBeenCalled();
    });

    it('should handle end chat error gracefully', async () => {
      Object.assign(mockUseChat, { 
        chatState: { ...mockUseChat.chatState, status: 'connected' },
        endChat: vi.fn().mockRejectedValue(new Error('End chat failed'))
      });
      
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('close-button'));
      
      await waitFor(() => {
        expect(mockUseWidget.closeWidget).toHaveBeenCalled();
      });
    });

    it('should minimize widget when minimize button is clicked', () => {
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('minimize-button'));
      
      expect(mockUseWidget.minimizeWidget).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      Object.assign(mockUseWidget, { isOpen: true });
    });

    it('should send message when requested', async () => {
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('send-message'));
      
      await waitFor(() => {
        expect(mockUseChat.sendMessage).toHaveBeenCalledWith('test message');
      });
    });

    it('should handle send message error', async () => {
      const mockOnError = vi.fn();
      mockUseChat.sendMessage.mockRejectedValue(new Error('Send failed'));
      
      render(<ChatWidget {...defaultProps} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('send-message'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          code: 'NETWORK_ERROR',
          message: 'Failed to send message',
          details: { error: 'Send failed' },
        });
      });
    });

    it('should handle typing indicator', () => {
      render(<ChatWidget {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('start-typing'));
      
      expect(mockUseChat.setTyping).toHaveBeenCalledWith(true);
    });
  });

  describe('Chat Initialization Flow', () => {
    it('should set default visitor info when widget opens without visitor info', () => {
      Object.assign(mockUseWidget, { 
        isOpen: true, 
        hasVisitorInfo: false,
        widgetState: 'initializing'
      });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseWidget.setVisitorInfo).toHaveBeenCalledWith({
        name: 'Website Visitor',
        email: 'visitor@example.com',
      });
    });

    it('should initialize chat when visitor info is available', () => {
      const visitorInfo = { name: 'Test User', email: 'test@example.com', sessionId: 'test' };
      Object.assign(mockUseWidget, { 
        isOpen: true, 
        hasVisitorInfo: true,
        visitorInfo,
        widgetState: 'initializing'
      });
      Object.assign(mockUseConnect, { connectionStatus: 'disconnected' });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseChat.initializeChat).toHaveBeenCalledWith(visitorInfo);
    });

    it('should handle chat initialization error', async () => {
      const mockOnError = vi.fn();
      const visitorInfo = { name: 'Test User', email: 'test@example.com', sessionId: 'test' };
      Object.assign(mockUseWidget, { 
        isOpen: true, 
        hasVisitorInfo: true,
        visitorInfo,
        widgetState: 'initializing'
      });
      Object.assign(mockUseConnect, { connectionStatus: 'disconnected' });
      mockUseChat.initializeChat.mockRejectedValue(new Error('Init failed'));
      
      render(<ChatWidget {...defaultProps} onError={mockOnError} />);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          code: 'INITIALIZATION_FAILED',
          message: 'Failed to start chat session',
          details: { error: 'Init failed' },
        });
      });
    });

    it('should not initialize chat when already connected', () => {
      const visitorInfo = { name: 'Test User', email: 'test@example.com', sessionId: 'test' };
      Object.assign(mockUseWidget, { 
        isOpen: true, 
        hasVisitorInfo: true,
        visitorInfo,
        widgetState: 'initializing'
      });
      Object.assign(mockUseConnect, { connectionStatus: 'connected' });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseChat.initializeChat).not.toHaveBeenCalled();
    });
  });

  describe('Message Read Status', () => {
    it('should mark messages as read when widget is opened', () => {
      Object.assign(mockUseWidget, { isOpen: true, isMinimized: false });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseChat.markMessagesAsRead).toHaveBeenCalled();
    });

    it('should not mark messages as read when widget is minimized', () => {
      Object.assign(mockUseWidget, { isOpen: false, isMinimized: true });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(mockUseChat.markMessagesAsRead).not.toHaveBeenCalled();
    });
  });

  describe('Props Passing', () => {
    it('should pass correct props to ChatButton', () => {
      Object.assign(mockUseChat, { chatState: { ...mockUseChat.chatState, unreadCount: 5 } });
      Object.assign(mockUseWidget, { isOpen: true });
      
      render(<ChatWidget {...defaultProps} />);
      
      const chatButton = screen.getByTestId('chat-button');
      expect(chatButton).toHaveAttribute('data-is-open', 'true');
      expect(chatButton).toHaveAttribute('data-unread-count', '5');
    });

    it('should pass correct props to ChatWindow', () => {
      Object.assign(mockUseWidget, { isOpen: true });
      Object.assign(mockUseChat, { chatState: { ...mockUseChat.chatState, status: 'connected' } });
      
      render(<ChatWidget {...defaultProps} />);
      
      expect(screen.getByTestId('chat-status')).toHaveTextContent('connected');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onError callback', async () => {
      mockUseConnect.initialize.mockRejectedValue(new Error('Test error'));
      
      expect(() => {
        render(<ChatWidget {...defaultProps} onError={undefined} />);
      }).not.toThrow();
    });

    it('should handle non-Error objects in catch blocks', async () => {
      const mockOnError = vi.fn();
      mockUseChat.sendMessage.mockRejectedValue('String error');
      Object.assign(mockUseWidget, { isOpen: true });
      
      render(<ChatWidget {...defaultProps} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('send-message'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith({
          code: 'NETWORK_ERROR',
          message: 'Failed to send message',
          details: { error: 'Unknown error' },
        });
      });
    });
  });

  describe('Component Integration', () => {
    it('should integrate all hooks correctly', () => {
      render(<ChatWidget {...defaultProps} />);
      
      // Verify hooks are called with correct parameters
      expect(require('../hooks/useChat').useChat).toHaveBeenCalledWith(mockUseConnect.connectService);
      expect(require('../hooks/useWidget').useWidget).toHaveBeenCalledWith(mockConfig);
    });

    it('should handle hook state changes', () => {
      const { rerender } = render(<ChatWidget {...defaultProps} />);
      
      // Simulate state change
      Object.assign(mockUseWidget, { isOpen: true });
      
      rerender(<ChatWidget {...defaultProps} />);
      
      expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing AWS config', () => {
      const configWithoutAws = { ...mockConfig, aws: undefined as any };
      
      expect(() => {
        render(<ChatWidget {...defaultProps} config={configWithoutAws} />);
      }).not.toThrow();
    });

    it('should handle undefined callbacks gracefully', () => {
      Object.assign(mockUseWidget, { isOpen: true });
      
      expect(() => {
        render(<ChatWidget 
          {...defaultProps} 
          onStateChange={undefined}
          onError={undefined}
        />);
      }).not.toThrow();
    });
  });
});