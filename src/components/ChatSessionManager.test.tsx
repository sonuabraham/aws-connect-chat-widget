import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatSessionManager } from './ChatSessionManager';
import type { ChatState, ChatRating, ChatTranscript } from '../types/chat';

// Mock CSS imports
vi.mock('../styles/ChatSessionManager.css', () => ({}));

// Mock child components
vi.mock('./ChatEndDialog', () => ({
  ChatEndDialog: ({ isOpen, onConfirm, onCancel }: any) => 
    isOpen ? (
      <div data-testid="chat-end-dialog">
        <button onClick={onConfirm}>Confirm End</button>
        <button onClick={onCancel}>Cancel End</button>
      </div>
    ) : null
}));

vi.mock('./ChatRatingDialog', () => ({
  ChatRatingDialog: ({ isOpen, onSubmit, onSkip }: any) => 
    isOpen ? (
      <div data-testid="chat-rating-dialog">
        <button onClick={() => onSubmit({ score: 5, timestamp: new Date() })}>Submit Rating</button>
        <button onClick={onSkip}>Skip Rating</button>
      </div>
    ) : null
}));

vi.mock('./ChatTranscriptDialog', () => ({
  ChatTranscriptDialog: ({ isOpen, onClose, onDownload }: any) => 
    isOpen ? (
      <div data-testid="chat-transcript-dialog">
        <button onClick={onDownload}>Download</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

describe('ChatSessionManager', () => {
  const mockChatState: ChatState = {
    status: 'connected',
    session: {
      connectionToken: 'token',
      participantId: 'participant',
      participantToken: 'token',
      websocketUrl: 'ws://test',
      startTime: new Date('2023-01-01T10:00:00Z'),
    },
    messages: [
      {
        id: '1',
        content: 'Hello',
        sender: 'visitor',
        timestamp: new Date(),
        status: 'sent',
        type: 'text',
      },
      {
        id: '2',
        content: 'Hi there!',
        sender: 'agent',
        timestamp: new Date(),
        status: 'delivered',
        type: 'text',
      },
    ],
    agent: {
      id: 'agent-1',
      name: 'John Agent',
      status: 'online',
      isTyping: false,
    },
    visitor: {
      name: 'Test Visitor',
      sessionId: 'session-123',
    },
    unreadCount: 0,
    isTyping: false,
  };

  const defaultProps = {
    chatState: mockChatState,
    onEndChat: vi.fn(),
    onRateChat: vi.fn(),
    onDownloadTranscript: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Controls', () => {
    it('should show session controls when chat is connected', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      expect(screen.getByLabelText('End chat session')).toBeInTheDocument();
      expect(screen.getByLabelText('View chat transcript')).toBeInTheDocument();
    });

    it('should not show session controls when chat is not connected', () => {
      const disconnectedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={disconnectedState} />);
      
      expect(screen.queryByLabelText('End chat session')).not.toBeInTheDocument();
    });

    it('should not show transcript button when disabled', () => {
      render(<ChatSessionManager {...defaultProps} enableTranscript={false} />);
      
      expect(screen.getByLabelText('End chat session')).toBeInTheDocument();
      expect(screen.queryByLabelText('View chat transcript')).not.toBeInTheDocument();
    });

    it('should open end dialog when end chat button is clicked', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('End chat session'));
      
      expect(screen.getByTestId('chat-end-dialog')).toBeInTheDocument();
    });

    it('should open transcript dialog when transcript button is clicked', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('View chat transcript'));
      
      expect(screen.getByTestId('chat-transcript-dialog')).toBeInTheDocument();
    });
  });

  describe('Session Summary', () => {
    it('should show session summary when chat is ended', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      expect(screen.getByText('Chat Session Summary')).toBeInTheDocument();
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('Messages:')).toBeInTheDocument();
      expect(screen.getByText('Agent:')).toBeInTheDocument();
      expect(screen.getByText('John Agent')).toBeInTheDocument();
    });

    it('should show correct message count excluding system messages', () => {
      const stateWithSystemMessage = {
        ...mockChatState,
        status: 'ended' as const,
        messages: [
          ...mockChatState.messages,
          {
            id: '3',
            content: 'System message',
            sender: 'system' as const,
            timestamp: new Date(),
            status: 'delivered' as const,
            type: 'system' as const,
          },
        ],
      };
      
      render(<ChatSessionManager {...defaultProps} chatState={stateWithSystemMessage} />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Should still be 2, not 3
    });

    it('should show rating button when ratings are enabled and no rating exists', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      expect(screen.getByText('Rate This Chat')).toBeInTheDocument();
    });

    it('should not show rating button when ratings are disabled', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} enableRatings={false} />);
      
      expect(screen.queryByText('Rate This Chat')).not.toBeInTheDocument();
    });

    it('should show download transcript button when transcript is enabled', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      expect(screen.getByText('Download Transcript')).toBeInTheDocument();
    });

    it('should not show download transcript button when transcript is disabled', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} enableTranscript={false} />);
      
      expect(screen.queryByText('Download Transcript')).not.toBeInTheDocument();
    });
  });

  describe('Chat End Flow', () => {
    it('should call onEndChat when end is confirmed', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('End chat session'));
      fireEvent.click(screen.getByText('Confirm End'));
      
      expect(defaultProps.onEndChat).toHaveBeenCalledTimes(1);
    });

    it('should not call onEndChat when end is cancelled', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('End chat session'));
      fireEvent.click(screen.getByText('Cancel End'));
      
      expect(defaultProps.onEndChat).not.toHaveBeenCalled();
    });

    it('should show rating dialog after ending chat when ratings are enabled', async () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('End chat session'));
      fireEvent.click(screen.getByText('Confirm End'));
      
      // Wait for the timeout delay
      await waitFor(() => {
        expect(screen.getByTestId('chat-rating-dialog')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should not show rating dialog after ending chat when ratings are disabled', async () => {
      render(<ChatSessionManager {...defaultProps} enableRatings={false} />);
      
      fireEvent.click(screen.getByLabelText('End chat session'));
      fireEvent.click(screen.getByText('Confirm End'));
      
      // Wait to ensure dialog doesn't appear
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(screen.queryByTestId('chat-rating-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Rating Flow', () => {
    it('should call onRateChat when rating is submitted', async () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      fireEvent.click(screen.getByText('Rate This Chat'));
      fireEvent.click(screen.getByText('Submit Rating'));
      
      expect(defaultProps.onRateChat).toHaveBeenCalledWith({
        score: 5,
        timestamp: expect.any(Date),
      });
    });

    it('should not call onRateChat when rating is skipped', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      fireEvent.click(screen.getByText('Rate This Chat'));
      fireEvent.click(screen.getByText('Skip Rating'));
      
      expect(defaultProps.onRateChat).not.toHaveBeenCalled();
    });

    it('should show rating display after rating is submitted', async () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      fireEvent.click(screen.getByText('Rate This Chat'));
      fireEvent.click(screen.getByText('Submit Rating'));
      
      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });
    });

    it('should hide rating button after rating is submitted', async () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      fireEvent.click(screen.getByText('Rate This Chat'));
      fireEvent.click(screen.getByText('Submit Rating'));
      
      await waitFor(() => {
        expect(screen.queryByText('Rate This Chat')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transcript Flow', () => {
    it('should call onDownloadTranscript when download is clicked from summary', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      fireEvent.click(screen.getByText('Download Transcript'));
      
      expect(defaultProps.onDownloadTranscript).toHaveBeenCalledWith({
        sessionId: 'session-123',
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: expect.any(Date),
        messages: mockChatState.messages,
        agent: mockChatState.agent,
        visitor: mockChatState.visitor,
        rating: undefined,
      });
    });

    it('should call onDownloadTranscript when download is clicked from dialog', () => {
      render(<ChatSessionManager {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('View chat transcript'));
      fireEvent.click(screen.getByText('Download'));
      
      expect(defaultProps.onDownloadTranscript).toHaveBeenCalled();
    });

    it('should include rating in transcript when rating exists', async () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      // Submit rating first
      fireEvent.click(screen.getByText('Rate This Chat'));
      fireEvent.click(screen.getByText('Submit Rating'));
      
      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      });
      
      // Then download transcript
      fireEvent.click(screen.getByText('Download Transcript'));
      
      expect(defaultProps.onDownloadTranscript).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: expect.objectContaining({
            score: 5,
            timestamp: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Session State Changes', () => {
    it('should show end dialog when session ends automatically', () => {
      const { rerender } = render(<ChatSessionManager {...defaultProps} />);
      
      const endedState = { ...mockChatState, status: 'ended' as const };
      rerender(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      expect(screen.getByTestId('chat-end-dialog')).toBeInTheDocument();
    });

    it('should not show end dialog multiple times for same session end', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      const { rerender } = render(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      // Close the dialog
      fireEvent.click(screen.getByText('Confirm End'));
      
      // Re-render with same ended state
      rerender(<ChatSessionManager {...defaultProps} chatState={endedState} />);
      
      expect(screen.queryByTestId('chat-end-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing session start time gracefully', () => {
      const stateWithoutStartTime = {
        ...mockChatState,
        status: 'ended' as const,
        session: undefined,
      };
      
      render(<ChatSessionManager {...defaultProps} chatState={stateWithoutStartTime} />);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should handle missing agent gracefully', () => {
      const stateWithoutAgent = {
        ...mockChatState,
        status: 'ended' as const,
        agent: undefined,
      };
      
      render(<ChatSessionManager {...defaultProps} chatState={stateWithoutAgent} />);
      
      expect(screen.getByText('Chat Session Summary')).toBeInTheDocument();
      expect(screen.queryByText('Agent:')).not.toBeInTheDocument();
    });

    it('should handle missing callback functions gracefully', () => {
      const endedState = { ...mockChatState, status: 'ended' as const };
      render(
        <ChatSessionManager 
          chatState={endedState}
          onEndChat={vi.fn()}
        />
      );
      
      expect(() => {
        fireEvent.click(screen.getByText('Download Transcript'));
      }).not.toThrow();
    });
  });
});