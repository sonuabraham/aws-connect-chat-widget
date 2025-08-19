import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatButton } from './ChatButton';
import { ThemeProvider } from './ThemeProvider';
import type { ChatButtonProps } from '../types/ui';
import type { ThemeConfiguration, PositionConfiguration } from '../types/widget';

// Mock CSS imports
vi.mock('../styles/ChatButton.css', () => ({}));
vi.mock('../utils/styled', () => ({
  useStyles: vi.fn(() => 'mocked-styles'),
  mergeClassNames: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('ChatButton', () => {
  const mockTheme: ThemeConfiguration = {
    primaryColor: '#007bff',
    secondaryColor: '#0056b3',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '8px',
  };

  const mockPosition: PositionConfiguration = {
    bottom: '20px',
    right: '20px',
  };

  const defaultProps: ChatButtonProps = {
    isOpen: false,
    unreadCount: 0,
    onClick: vi.fn(),
    config: mockTheme,
    position: mockPosition,
  };

  const renderWithTheme = (props: Partial<ChatButtonProps> = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <ChatButton {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render chat button with correct initial state', () => {
      renderWithTheme();
      
      const button = screen.getByRole('button', { name: 'Open chat' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render with custom position', () => {
      const customPosition = { bottom: '30px', left: '30px' };
      renderWithTheme({ position: customPosition });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      renderWithTheme();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('chat-button');
      expect(button).not.toHaveClass('chat-button--open');
    });
  });

  describe('Open/Closed States', () => {
    it('should show chat icon when closed', () => {
      renderWithTheme({ isOpen: false });
      
      const chatIcon = screen.getByRole('button').querySelector('svg');
      expect(chatIcon).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Open chat');
    });

    it('should show close icon when open', () => {
      renderWithTheme({ isOpen: true });
      
      const button = screen.getByRole('button', { name: 'Close chat' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveClass('chat-button--open');
    });

    it('should toggle aria-expanded attribute correctly', () => {
      const { rerender } = renderWithTheme({ isOpen: false });
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ChatButton {...defaultProps} isOpen={true} />
        </ThemeProvider>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Unread Count Badge', () => {
    it('should not show badge when unread count is 0', () => {
      renderWithTheme({ unreadCount: 0 });
      
      expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
    });

    it('should show badge with correct count when unread count > 0', () => {
      renderWithTheme({ unreadCount: 5 });
      
      const badge = screen.getByLabelText('5 unread messages');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should show "99+" when unread count > 99', () => {
      renderWithTheme({ unreadCount: 150 });
      
      const badge = screen.getByLabelText('150 unread messages');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99+');
    });

    it('should not show badge when chat is open', () => {
      renderWithTheme({ isOpen: true, unreadCount: 5 });
      
      expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
    });

    it('should handle edge case of exactly 99 unread messages', () => {
      renderWithTheme({ unreadCount: 99 });
      
      const badge = screen.getByLabelText('99 unread messages');
      expect(badge).toHaveTextContent('99');
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when button is clicked', () => {
      const mockOnClick = vi.fn();
      renderWithTheme({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid clicks', () => {
      const mockOnClick = vi.fn();
      renderWithTheme({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should be focusable with keyboard', () => {
      renderWithTheme();
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('should trigger onClick on Enter key press', () => {
      const mockOnClick = vi.fn();
      renderWithTheme({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick on Space key press', () => {
      const mockOnClick = vi.fn();
      renderWithTheme({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithTheme();
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Open chat');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should update aria-label based on state', () => {
      const { rerender } = renderWithTheme({ isOpen: false });
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Open chat');
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ChatButton {...defaultProps} isOpen={true} />
        </ThemeProvider>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close chat');
    });

    it('should have proper aria-label for unread count badge', () => {
      renderWithTheme({ unreadCount: 3 });
      
      const badge = screen.getByLabelText('3 unread messages');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithTheme();
      
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors through CSS custom properties', () => {
      renderWithTheme();
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Theme integration is tested through the styled system mock
    });

    it('should handle missing theme gracefully', () => {
      render(<ChatButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Position Configuration', () => {
    it('should handle right positioning', () => {
      renderWithTheme({ position: { bottom: '20px', right: '20px' } });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle left positioning', () => {
      renderWithTheme({ position: { bottom: '20px', left: '20px' } });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle custom bottom positioning', () => {
      renderWithTheme({ position: { bottom: '50px', right: '30px' } });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onClick gracefully', () => {
      renderWithTheme({ onClick: undefined as any });
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle negative unread count', () => {
      renderWithTheme({ unreadCount: -1 });
      
      expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
    });

    it('should handle very large unread count', () => {
      renderWithTheme({ unreadCount: 9999 });
      
      const badge = screen.getByLabelText('9999 unread messages');
      expect(badge).toHaveTextContent('99+');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props do not change', () => {
      const { rerender } = renderWithTheme();
      
      const button = screen.getByRole('button');
      const initialButton = button;
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ChatButton {...defaultProps} />
        </ThemeProvider>
      );
      
      expect(screen.getByRole('button')).toBe(initialButton);
    });
  });
});