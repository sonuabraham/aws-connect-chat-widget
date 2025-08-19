import React, { useState, useEffect } from 'react';
import type { ChatState, ChatTranscript, ChatRating } from '../types/chat';
import { ChatEndDialog } from './ChatEndDialog';
import { ChatRatingDialog } from './ChatRatingDialog';
import { ChatTranscriptDialog } from './ChatTranscriptDialog';
import '../styles/ChatSessionManager.css';

/**
 * Chat session manager component props
 */
export interface ChatSessionManagerProps {
  chatState: ChatState;
  onEndChat: () => void;
  onRateChat?: (rating: ChatRating) => void;
  onDownloadTranscript?: (transcript: ChatTranscript) => void;
  enableRatings?: boolean;
  enableTranscript?: boolean;
}

/**
 * ChatSessionManager component - Manages chat session lifecycle
 * Requirements: 4.4
 */
export const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({
  chatState,
  onEndChat,
  onRateChat,
  onDownloadTranscript,
  enableRatings = true,
  enableTranscript = true,
}) => {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [chatRating, setChatRating] = useState<ChatRating | null>(null);

  // Handle session end state changes
  useEffect(() => {
    if (chatState.status === 'ended' && !sessionEnded) {
      setSessionEnded(true);
      setShowEndDialog(true);
    }
  }, [chatState.status, sessionEnded]);

  const handleEndChat = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEndChat = () => {
    setShowEndDialog(false);
    onEndChat();

    // Show rating dialog if enabled and no rating exists
    if (enableRatings && !chatRating) {
      setTimeout(() => {
        setShowRatingDialog(true);
      }, 500); // Small delay for better UX
    }
  };

  const handleCancelEndChat = () => {
    setShowEndDialog(false);
  };

  const handleRatingSubmit = (rating: ChatRating) => {
    setChatRating(rating);
    setShowRatingDialog(false);
    onRateChat?.(rating);
  };

  const handleRatingSkip = () => {
    setShowRatingDialog(false);
  };

  const handleShowTranscript = () => {
    setShowTranscriptDialog(true);
  };

  const handleCloseTranscript = () => {
    setShowTranscriptDialog(false);
  };

  const handleDownloadTranscript = () => {
    if (onDownloadTranscript) {
      const transcript: ChatTranscript = {
        sessionId: chatState.visitor.sessionId,
        startTime: chatState.session?.startTime || new Date(),
        endTime: chatState.status === 'ended' ? new Date() : undefined,
        messages: chatState.messages,
        agent: chatState.agent,
        visitor: chatState.visitor,
        rating: chatRating || undefined,
      };
      onDownloadTranscript(transcript);
    }
  };

  const getSessionDuration = (): string => {
    if (!chatState.session?.startTime) return '0:00';

    const start = chatState.session.startTime;
    const end = chatState.status === 'ended' ? new Date() : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMessageCount = (): number => {
    return chatState.messages.filter(msg => msg.sender !== 'system').length;
  };

  return (
    <div className="chat-session-manager">
      {/* Session Controls */}
      {chatState.status === 'connected' && (
        <div className="session-controls">
          <button
            className="session-control-button session-control-button--end"
            onClick={handleEndChat}
            type="button"
            aria-label="End chat session"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 15C11.866 15 15 11.866 15 8C15 4.134 11.866 1 8 1C4.134 1 1 4.134 1 8C1 11.866 4.134 15 8 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M10 6L6 10M6 6L10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            End Chat
          </button>

          {enableTranscript && (
            <button
              className="session-control-button session-control-button--transcript"
              onClick={handleShowTranscript}
              type="button"
              aria-label="View chat transcript"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M5 6H11M5 8H11M5 10H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Transcript
            </button>
          )}
        </div>
      )}

      {/* Session Summary (shown when ended) */}
      {chatState.status === 'ended' && (
        <div className="session-summary">
          <div className="session-summary__header">
            <h3>Chat Session Summary</h3>
          </div>
          <div className="session-summary__stats">
            <div className="session-stat">
              <span className="session-stat__label">Duration:</span>
              <span className="session-stat__value">
                {getSessionDuration()}
              </span>
            </div>
            <div className="session-stat">
              <span className="session-stat__label">Messages:</span>
              <span className="session-stat__value">{getMessageCount()}</span>
            </div>
            {chatState.agent && (
              <div className="session-stat">
                <span className="session-stat__label">Agent:</span>
                <span className="session-stat__value">
                  {chatState.agent.name}
                </span>
              </div>
            )}
          </div>

          <div className="session-summary__actions">
            {enableRatings && !chatRating && (
              <button
                className="session-action-button session-action-button--primary"
                onClick={() => setShowRatingDialog(true)}
                type="button"
              >
                Rate This Chat
              </button>
            )}

            {enableTranscript && (
              <button
                className="session-action-button session-action-button--secondary"
                onClick={handleDownloadTranscript}
                type="button"
              >
                Download Transcript
              </button>
            )}
          </div>

          {chatRating && (
            <div className="session-rating-display">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    className={`rating-star ${star <= chatRating.score ? 'rating-star--filled' : ''}`}
                  >
                    <path
                      d="M8 1L10.09 5.26L15 6L11.5 9.74L12.18 15L8 12.77L3.82 15L4.5 9.74L1 6L5.91 5.26L8 1Z"
                      fill={star <= chatRating.score ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                ))}
              </div>
              <span className="rating-text">Thank you for your feedback!</span>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ChatEndDialog
        isOpen={showEndDialog}
        onConfirm={handleConfirmEndChat}
        onCancel={handleCancelEndChat}
        sessionDuration={getSessionDuration()}
        messageCount={getMessageCount()}
      />

      {enableRatings && (
        <ChatRatingDialog
          isOpen={showRatingDialog}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
          agentName={chatState.agent?.name}
        />
      )}

      {enableTranscript && (
        <ChatTranscriptDialog
          isOpen={showTranscriptDialog}
          onClose={handleCloseTranscript}
          onDownload={handleDownloadTranscript}
          chatState={chatState}
          sessionDuration={getSessionDuration()}
        />
      )}
    </div>
  );
};
