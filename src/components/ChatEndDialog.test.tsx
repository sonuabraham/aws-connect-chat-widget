import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatEndDialog } from './ChatEndDialog';
import type { ChatEndDialogProps } from './ChatEndDialog';

// Mock CSS imports
vi.mock('../styles/ChatEndDialog.css', () => ({}));

describe('ChatEndDialog', () => {
  const defaultProps: ChatEndDialogProps = {
    isOpen: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    sessionDuration: '15:30',
    messageCount: 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('End Chat Session')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ChatEndDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Content Display', () => {
    it('should display session duration', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(screen.getByText('Session Duration:')).toBeInTheDocument();
      expect(screen.getByText('15:30')).toBeInTheDocument();
    });

    it('should display message count', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(screen.getByText('Messages Exchanged:')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display confirmation message', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(
        screen.getByText('Are you sure you want to end this chat session?')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This action cannot be undone/)
      ).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const icon = document.querySelector('.chat-end-dialog__icon svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onConfirm when End Chat button is clicked', () => {
      const mockOnConfirm = vi.fn();
      render(<ChatEndDialog {...defaultProps} onConfirm={mockOnConfirm} />);

      fireEvent.click(screen.getByText('End Chat'));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Continue Chat button is clicked', () => {
      const mockOnCancel = vi.fn();
      render(<ChatEndDialog {...defaultProps} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Continue Chat'));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should have proper button types', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(screen.getByText('Continue Chat')).toHaveAttribute(
        'type',
        'button'
      );
      expect(screen.getByText('End Chat')).toHaveAttribute('type', 'button');
    });
  });

  describe('Statistics Display', () => {
    it('should handle zero message count', () => {
      render(<ChatEndDialog {...defaultProps} messageCount={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large message count', () => {
      render(<ChatEndDialog {...defaultProps} messageCount={999} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should handle different duration formats', () => {
      render(<ChatEndDialog {...defaultProps} sessionDuration="1:05:30" />);

      expect(screen.getByText('1:05:30')).toBeInTheDocument();
    });

    it('should handle short duration', () => {
      render(<ChatEndDialog {...defaultProps} sessionDuration="0:45" />);

      expect(screen.getByText('0:45')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(
        document.querySelector('.chat-end-dialog-overlay')
      ).toBeInTheDocument();
      expect(document.querySelector('.chat-end-dialog')).toBeInTheDocument();
      expect(
        document.querySelector('.chat-end-dialog__header')
      ).toBeInTheDocument();
      expect(
        document.querySelector('.chat-end-dialog__content')
      ).toBeInTheDocument();
      expect(
        document.querySelector('.chat-end-dialog__actions')
      ).toBeInTheDocument();
    });

    it('should have proper button styling classes', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const continueButton = screen.getByText('Continue Chat');
      const endButton = screen.getByText('End Chat');

      expect(continueButton).toHaveClass('chat-end-dialog__button--secondary');
      expect(endButton).toHaveClass('chat-end-dialog__button--primary');
    });

    it('should display stats in proper structure', () => {
      render(<ChatEndDialog {...defaultProps} />);

      expect(
        document.querySelector('.chat-end-dialog__stats')
      ).toBeInTheDocument();
      expect(document.querySelectorAll('.chat-stat')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should be focusable and keyboard navigable', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const continueButton = screen.getByText('Continue Chat');
      const endButton = screen.getByText('End Chat');

      continueButton.focus();
      expect(continueButton).toHaveFocus();

      endButton.focus();
      expect(endButton).toHaveFocus();
    });

    it('should handle keyboard interactions', () => {
      const mockOnConfirm = vi.fn();
      const mockOnCancel = vi.fn();
      render(
        <ChatEndDialog
          {...defaultProps}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const endButton = screen.getByText('End Chat');
      endButton.focus();
      fireEvent.keyDown(endButton, { key: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should have proper heading structure', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('End Chat Session');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(
        <ChatEndDialog
          {...defaultProps}
          onConfirm={undefined as any}
          onCancel={undefined as any}
        />
      );

      expect(() => {
        fireEvent.click(screen.getByText('End Chat'));
        fireEvent.click(screen.getByText('Continue Chat'));
      }).not.toThrow();
    });

    it('should handle empty session duration', () => {
      render(<ChatEndDialog {...defaultProps} sessionDuration="" />);

      expect(screen.getByText('Session Duration:')).toBeInTheDocument();
    });

    it('should handle negative message count', () => {
      render(<ChatEndDialog {...defaultProps} messageCount={-1} />);

      expect(screen.getByText('-1')).toBeInTheDocument();
    });
  });

  describe('Dialog Overlay', () => {
    it('should render overlay with proper role', () => {
      render(<ChatEndDialog {...defaultProps} />);

      const overlay = document.querySelector('.chat-end-dialog-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveAttribute('role', 'dialog');
    });

    it('should prevent interaction with background content', () => {
      render(
        <div>
          <button data-testid="background-button">Background</button>
          <ChatEndDialog {...defaultProps} />
        </div>
      );

      // Dialog should be rendered and overlay should be present
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        document.querySelector('.chat-end-dialog-overlay')
      ).toBeInTheDocument();
    });
  });

  describe('Component State', () => {
    it('should re-render when props change', () => {
      const { rerender } = render(<ChatEndDialog {...defaultProps} />);

      expect(screen.getByText('12')).toBeInTheDocument();

      rerender(<ChatEndDialog {...defaultProps} messageCount={25} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.queryByText('12')).not.toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(
        <ChatEndDialog {...defaultProps} isOpen={false} />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<ChatEndDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<ChatEndDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not render DOM elements when closed', () => {
      render(<ChatEndDialog {...defaultProps} isOpen={false} />);

      expect(
        document.querySelector('.chat-end-dialog-overlay')
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('.chat-end-dialog')
      ).not.toBeInTheDocument();
    });

    it('should handle multiple rapid clicks without issues', () => {
      const mockOnConfirm = vi.fn();
      render(<ChatEndDialog {...defaultProps} onConfirm={mockOnConfirm} />);

      const endButton = screen.getByText('End Chat');

      fireEvent.click(endButton);
      fireEvent.click(endButton);
      fireEvent.click(endButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });
  });
});
