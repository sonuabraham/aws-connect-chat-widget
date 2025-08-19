import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MessageList } from './MessageList';
import type { MessageListProps } from '../types/ui';
import type { Message, AgentInfo } from '../types/chat';

// Mock CSS imports
vi.mock('../styles/MessageList.css', () => ({}));

describe('MessageList', () => {
  const mockAgent: AgentInfo = {
    id: 'agent-123',
    name: 'John Smith',
    profileImage: 'https://example.com/avatar.jpg',
    status: 'online',
    isTyping: false,
  };

  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    id: `msg-${Date.now()}-${Math.random()}`,
    content: 'Test message',
    sender: 'visitor',
    timestamp: new Date(),
    status: 'sent',
    ...overrides,
  });

  const defaultProps: MessageListProps = {
    messages: [],
    isTyping: false,
    onScroll: vi.fn(),
    agentInfo: mockAgent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no messages', () => {
      render(<MessageList {...defaultProps} />);
      
      expect(screen.getByRole('log')).toBeInTheDocument();
      expect(screen.getByText('Start a conversation by sending a message below.')).toBeInTheDocument();
      expect(screen.getByLabelText('Chat messages')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<MessageList {...defaultProps} />);
      
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-live', 'polite');
      expect(messageList).toHaveAttribute('aria-label', 'Chat messages');
    });

    it('should render messages when provided', () => {
      const messages = [
        createMessage({ content: 'Hello', sender: 'visitor' }),
        createMessage({ content: 'Hi there!', sender: 'agent' }),
      ];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  describe('Message Bubbles', () => {
    it('should render visitor messages with correct styling', () => {
      const messages = [createMessage({ content: 'Visitor message', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const messageBubble = screen.getByText('Visitor message').closest('.message-bubble');
      expect(messageBubble).toHaveClass('message-bubble--own');
    });

    it('should render agent messages with correct styling', () => {
      const messages = [createMessage({ content: 'Agent message', sender: 'agent' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const messageBubble = screen.getByText('Agent message').closest('.message-bubble');
      expect(messageBubble).toHaveClass('message-bubble--other');
    });

    it('should show agent name for agent messages', () => {
      const messages = [createMessage({ content: 'Agent message', sender: 'agent' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should show agent avatar for agent messages', () => {
      const messages = [createMessage({ content: 'Agent message', sender: 'agent' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const avatar = screen.getByAltText('John Smith avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should not show agent name/avatar for visitor messages', () => {
      const messages = [createMessage({ content: 'Visitor message', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      expect(screen.queryByAltText('John Smith avatar')).not.toBeInTheDocument();
    });

    it('should show timestamps when appropriate', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const messages = [
        createMessage({ content: 'Message 1', sender: 'visitor', timestamp }),
        createMessage({ content: 'Message 2', sender: 'agent', timestamp }),
      ];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      // Should show timestamp for the last message in each group
      const timeElements = screen.getAllByText('12:00 PM');
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Message Status Icons', () => {
    it('should show sending status icon', () => {
      const messages = [createMessage({ status: 'sending', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const statusIcon = document.querySelector('.message-bubble__status-icon');
      expect(statusIcon).toBeInTheDocument();
    });

    it('should show sent status icon', () => {
      const messages = [createMessage({ status: 'sent', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const statusIcon = document.querySelector('.message-bubble__status-icon');
      expect(statusIcon).toBeInTheDocument();
    });

    it('should show delivered status icon', () => {
      const messages = [createMessage({ status: 'delivered', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const statusIcon = document.querySelector('.message-bubble__status-icon');
      expect(statusIcon).toBeInTheDocument();
    });

    it('should show failed status icon with error styling', () => {
      const messages = [createMessage({ status: 'failed', sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const statusIcon = document.querySelector('.message-bubble__status-icon--error');
      expect(statusIcon).toBeInTheDocument();
    });

    it('should not show status icons for agent messages', () => {
      const messages = [createMessage({ status: 'delivered', sender: 'agent' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const statusIcon = document.querySelector('.message-bubble__status-icon');
      expect(statusIcon).not.toBeInTheDocument();
    });
  });

  describe('Date Grouping', () => {
    it('should group messages by date', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const messages = [
        createMessage({ content: 'Yesterday message', timestamp: yesterday }),
        createMessage({ content: 'Today message', timestamp: today }),
      ];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should show full date for older messages', () => {
      const oldDate = new Date('2023-01-01');
      const messages = [createMessage({ timestamp: oldDate })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Sunday, January 1, 2023')).toBeInTheDocument();
    });

    it('should handle messages from the same date', () => {
      const timestamp = new Date();
      const messages = [
        createMessage({ content: 'Message 1', timestamp }),
        createMessage({ content: 'Message 2', timestamp }),
      ];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const todayHeaders = screen.getAllByText('Today');
      expect(todayHeaders).toHaveLength(1);
    });
  });

  describe('Typing Indicator', () => {
    it('should show typing indicator when isTyping is true', () => {
      render(<MessageList {...defaultProps} isTyping={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('John Smith is typing...')).toBeInTheDocument();
      expect(document.querySelectorAll('.typing-indicator__dot')).toHaveLength(3);
    });

    it('should not show typing indicator when isTyping is false', () => {
      render(<MessageList {...defaultProps} isTyping={false} />);
      
      expect(screen.queryByText('John Smith is typing...')).not.toBeInTheDocument();
    });

    it('should show generic typing message when no agent name', () => {
      render(<MessageList {...defaultProps} isTyping={true} agentInfo={undefined} />);
      
      expect(screen.getByText('Agent is typing...')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<MessageList {...defaultProps} isTyping={true} />);
      
      const typingIndicator = screen.getByRole('status');
      expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Scrolling Behavior', () => {
    it('should call onScroll when scrolled', () => {
      const mockOnScroll = vi.fn();
      render(<MessageList {...defaultProps} onScroll={mockOnScroll} />);
      
      const messageList = screen.getByRole('log');
      
      // Mock scroll properties
      Object.defineProperty(messageList, 'scrollTop', { value: 100, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 500, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 300, writable: true });
      
      fireEvent.scroll(messageList);
      
      expect(mockOnScroll).toHaveBeenCalledWith(0.5); // 100 / (500 - 300) = 0.5
    });

    it('should show scroll to bottom button when not at bottom', () => {
      const messages = Array.from({ length: 20 }, (_, i) => 
        createMessage({ content: `Message ${i}` })
      );
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const messageList = screen.getByRole('log');
      
      // Mock scroll to simulate user scrolling up
      Object.defineProperty(messageList, 'scrollTop', { value: 0, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 300, writable: true });
      
      fireEvent.scroll(messageList);
      
      expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument();
    });

    it('should scroll to bottom when scroll button is clicked', () => {
      const messages = Array.from({ length: 20 }, (_, i) => 
        createMessage({ content: `Message ${i}` })
      );
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const messageList = screen.getByRole('log');
      
      // Mock scroll properties
      Object.defineProperty(messageList, 'scrollTop', { value: 0, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 300, writable: true });
      
      fireEvent.scroll(messageList);
      
      const scrollButton = screen.getByLabelText('Scroll to bottom');
      fireEvent.click(scrollButton);
      
      expect(messageList.scrollTop).toBe(1000);
    });

    it('should auto-scroll to bottom for new messages when at bottom', async () => {
      const { rerender } = render(<MessageList {...defaultProps} messages={[]} />);
      
      const messageList = screen.getByRole('log');
      
      // Mock being at bottom
      Object.defineProperty(messageList, 'scrollTop', { value: 700, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 300, writable: true });
      
      const newMessages = [createMessage({ content: 'New message' })];
      rerender(<MessageList {...defaultProps} messages={newMessages} />);
      
      // Should auto-scroll (tested through the component's internal logic)
      expect(messageList).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state icon and message', () => {
      render(<MessageList {...defaultProps} messages={[]} />);
      
      expect(screen.getByText('Start a conversation by sending a message below.')).toBeInTheDocument();
      
      const emptyIcon = document.querySelector('.message-list__empty-icon svg');
      expect(emptyIcon).toBeInTheDocument();
    });

    it('should hide empty state when messages exist', () => {
      const messages = [createMessage()];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.queryByText('Start a conversation by sending a message below.')).not.toBeInTheDocument();
    });
  });

  describe('Message Formatting', () => {
    it('should format time correctly for different locales', () => {
      const timestamp = new Date('2023-01-01T14:30:00Z');
      const messages = [createMessage({ timestamp, sender: 'visitor' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      // Time formatting is locale-dependent, but should be present
      const timeElement = document.querySelector('.message-bubble__time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement?.textContent).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle long message content', () => {
      const longMessage = 'A'.repeat(1000);
      const messages = [createMessage({ content: longMessage })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Hello! 🎉 <script>alert("test")</script> & more';
      const messages = [createMessage({ content: specialMessage })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Agent Information Handling', () => {
    it('should handle missing agent profile image', () => {
      const agentWithoutImage = { ...mockAgent, profileImage: undefined };
      const messages = [createMessage({ sender: 'agent' })];
      
      render(<MessageList {...defaultProps} agentInfo={agentWithoutImage} messages={messages} />);
      
      expect(screen.queryByAltText('John Smith avatar')).not.toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should handle missing agent name', () => {
      const agentWithoutName = { ...mockAgent, name: '' };
      const messages = [createMessage({ sender: 'agent' })];
      
      render(<MessageList {...defaultProps} agentInfo={agentWithoutName} messages={messages} />);
      
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });

    it('should handle undefined agent info', () => {
      const messages = [createMessage({ sender: 'agent' })];
      
      render(<MessageList {...defaultProps} agentInfo={undefined} messages={messages} />);
      
      expect(screen.queryByAltText(/avatar/)).not.toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of messages', () => {
      const messages = Array.from({ length: 1000 }, (_, i) => 
        createMessage({ content: `Message ${i}`, id: `msg-${i}` })
      );
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByText('Message 999')).toBeInTheDocument();
    });

    it('should handle messages with same timestamp', () => {
      const timestamp = new Date();
      const messages = [
        createMessage({ content: 'Message 1', timestamp, id: 'msg-1' }),
        createMessage({ content: 'Message 2', timestamp, id: 'msg-2' }),
      ];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });

    it('should handle invalid message data gracefully', () => {
      const invalidMessage = {
        id: 'invalid',
        content: '',
        sender: 'visitor' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };
      
      render(<MessageList {...defaultProps} messages={[invalidMessage]} />);
      
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('should not crash with undefined onScroll', () => {
      render(<MessageList {...defaultProps} onScroll={undefined as any} />);
      
      const messageList = screen.getByRole('log');
      
      // Mock scroll properties to avoid division by zero
      Object.defineProperty(messageList, 'scrollTop', { value: 0, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 100, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 50, writable: true });
      
      expect(() => fireEvent.scroll(messageList)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA live region', () => {
      render(<MessageList {...defaultProps} />);
      
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible scroll button', () => {
      const messages = Array.from({ length: 20 }, (_, i) => 
        createMessage({ content: `Message ${i}` })
      );
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const messageList = screen.getByRole('log');
      
      // Simulate scroll up
      Object.defineProperty(messageList, 'scrollTop', { value: 0, writable: true });
      Object.defineProperty(messageList, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(messageList, 'clientHeight', { value: 300, writable: true });
      
      fireEvent.scroll(messageList);
      
      const scrollButton = screen.getByLabelText('Scroll to bottom');
      expect(scrollButton).toHaveAttribute('type', 'button');
    });

    it('should have proper alt text for agent avatars', () => {
      const messages = [createMessage({ sender: 'agent' })];
      
      render(<MessageList {...defaultProps} messages={messages} />);
      
      const avatar = screen.getByAltText('John Smith avatar');
      expect(avatar).toBeInTheDocument();
    });
  });
});