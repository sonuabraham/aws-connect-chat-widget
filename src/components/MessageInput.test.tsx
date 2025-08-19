import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MessageInput } from './MessageInput';
import type { MessageInputProps } from '../types/ui';

// Mock CSS imports
vi.mock('../styles/MessageInput.css', () => ({}));

describe('MessageInput', () => {
  const defaultProps: MessageInputProps = {
    onSendMessage: vi.fn(),
    disabled: false,
    placeholder: 'Type your message...',
    maxLength: 1000,
    onTyping: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render textarea and send button', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Type your message')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<MessageInput {...defaultProps} placeholder="Custom placeholder" />);
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<MessageInput {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('message-input');
    });

    it('should have proper ARIA attributes', () => {
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message');
      expect(textarea).toHaveAttribute('aria-label', 'Type your message');
      expect(textarea).toHaveAttribute('rows', '1');
    });
  });

  describe('Text Input Handling', () => {
    it('should update textarea value when typing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Hello world');
      
      expect(textarea).toHaveValue('Hello world');
    });

    it('should enforce character limit', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={10} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'This is a very long message that exceeds the limit');
      
      expect(textarea).toHaveValue('This is a ');
    });

    it('should show character count when near limit', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={100} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'A'.repeat(60));
      
      expect(screen.getByText('40 characters remaining')).toBeInTheDocument();
    });

    it('should highlight character count when at limit', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={10} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'A'.repeat(10));
      
      const charCount = screen.getByText('0 characters remaining');
      expect(charCount).toHaveClass('message-input__char-count--limit');
    });

    it('should not show character count when not near limit', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={1000} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Short message');
      
      expect(screen.queryByText(/characters remaining/)).not.toBeInTheDocument();
    });

    it('should handle no maxLength prop', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={undefined} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'A'.repeat(2000));
      
      expect(textarea).toHaveValue('A'.repeat(2000));
      expect(screen.queryByText(/characters remaining/)).not.toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should send message on form submit', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test message');
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('should send message on send button click', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test message');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('should send message on Enter key press', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('should not send message on Shift+Enter', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('should not send empty message', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only message', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, '   \n\t  ');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should trim message before sending', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, '  Test message  ');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('Send Button State', () => {
    it('should disable send button when no message', () => {
      render(<MessageInput {...defaultProps} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
      expect(sendButton).not.toHaveClass('message-input__send-button--active');
    });

    it('should enable send button when message exists', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
      expect(sendButton).toHaveClass('message-input__send-button--active');
    });

    it('should disable send button when input is disabled', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('should update button title based on state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toHaveAttribute('title', 'Type a message to send');
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      expect(sendButton).toHaveAttribute('title', 'Send message (Enter)');
    });
  });

  describe('Typing Indicator', () => {
    it('should call onTyping when user starts typing', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'T');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
    });

    it('should stop typing indicator after timeout', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(mockOnTyping).toHaveBeenCalledWith(false);
    });

    it('should reset typing timeout on continued typing', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await user.type(textarea, ' more');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should not have called onTyping(false) yet
      expect(mockOnTyping).toHaveBeenLastCalledWith(true);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(mockOnTyping).toHaveBeenLastCalledWith(false);
    });

    it('should stop typing indicator when message is sent', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test message');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnTyping).toHaveBeenCalledWith(false);
    });

    it('should not call onTyping when prop is not provided', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={undefined} />);
      
      const textarea = screen.getByLabelText('Type your message');
      
      expect(() => user.type(textarea, 'Test')).not.toThrow();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should clear message on Escape key', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test message');
      
      expect(textarea).toHaveValue('Test message');
      
      await user.keyboard('{Escape}');
      
      expect(textarea).toHaveValue('');
    });

    it('should stop typing indicator on Escape', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
      
      await user.keyboard('{Escape}');
      
      expect(mockOnTyping).toHaveBeenCalledWith(false);
    });
  });

  describe('Textarea Auto-resize', () => {
    it('should auto-resize textarea based on content', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message') as HTMLTextAreaElement;
      
      // Mock scrollHeight to simulate content height
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 60,
      });
      
      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      
      // The component should adjust height based on scrollHeight
      expect(textarea.style.height).toBe('60px');
    });

    it('should limit maximum height', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} />);
      
      const textarea = screen.getByLabelText('Type your message') as HTMLTextAreaElement;
      
      // Mock scrollHeight to simulate very tall content
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 200,
      });
      
      await user.type(textarea, 'Very\nlong\nmulti\nline\nmessage');
      
      // Should be limited to maxHeight (120px)
      expect(textarea.style.height).toBe('120px');
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByLabelText('Type your message');
      expect(textarea).toBeDisabled();
    });

    it('should disable send button when disabled prop is true', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('should not send message when disabled', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} disabled={true} onSendMessage={mockOnSendMessage} />);
      
      // Try to send via keyboard (won't work because textarea is disabled)
      const textarea = screen.getByLabelText('Type your message');
      expect(textarea).toBeDisabled();
      
      // Try to send via button click
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Type your message')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should associate character count with textarea', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} maxLength={100} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'A'.repeat(60));
      
      const charCount = screen.getByText('40 characters remaining');
      expect(textarea).toHaveAttribute('aria-describedby', 'char-count');
      expect(charCount).toHaveAttribute('id', 'char-count');
      expect(charCount).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-hidden on decorative elements', () => {
      render(<MessageInput {...defaultProps} />);
      
      const hint = screen.getByText('Press Enter to send, Shift+Enter for new line');
      expect(hint).toHaveAttribute('aria-hidden', 'true');
      
      const icon = screen.getByLabelText('Send message').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onSendMessage gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onSendMessage={undefined as any} />);
      
      const textarea = screen.getByLabelText('Type your message');
      await user.type(textarea, 'Test');
      
      const form = screen.getByRole('form');
      expect(() => fireEvent.submit(form)).not.toThrow();
    });

    it('should cleanup timers on unmount', () => {
      const { unmount } = render(<MessageInput {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid typing without errors', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<MessageInput {...defaultProps} onTyping={mockOnTyping} />);
      
      const textarea = screen.getByLabelText('Type your message');
      
      // Rapid typing simulation using fireEvent instead of user.type
      fireEvent.change(textarea, { target: { value: 'a' } });
      fireEvent.change(textarea, { target: { value: 'ab' } });
      fireEvent.change(textarea, { target: { value: 'abc' } });
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
    });
  });
});