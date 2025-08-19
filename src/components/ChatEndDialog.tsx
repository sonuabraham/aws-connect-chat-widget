import React from 'react';
import '../styles/ChatEndDialog.css';

/**
 * Chat end dialog component props
 */
export interface ChatEndDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  sessionDuration: string;
  messageCount: number;
}

/**
 * ChatEndDialog component - Confirmation dialog for ending chat
 * Requirements: 4.4
 */
export const ChatEndDialog: React.FC<ChatEndDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  sessionDuration,
  messageCount,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="chat-end-dialog-overlay" role="dialog" aria-modal="true">
      <div className="chat-end-dialog">
        <div className="chat-end-dialog__header">
          <h3 className="chat-end-dialog__title">End Chat Session</h3>
        </div>

        <div className="chat-end-dialog__content">
          <div className="chat-end-dialog__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M24 16V24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M24 32H24.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="chat-end-dialog__message">
            <p className="chat-end-dialog__primary-text">
              Are you sure you want to end this chat session?
            </p>
            <p className="chat-end-dialog__secondary-text">
              This action cannot be undone. Your conversation will be saved and
              you can download a transcript if needed.
            </p>
          </div>

          <div className="chat-end-dialog__stats">
            <div className="chat-stat">
              <span className="chat-stat__label">Session Duration:</span>
              <span className="chat-stat__value">{sessionDuration}</span>
            </div>
            <div className="chat-stat">
              <span className="chat-stat__label">Messages Exchanged:</span>
              <span className="chat-stat__value">{messageCount}</span>
            </div>
          </div>
        </div>

        <div className="chat-end-dialog__actions">
          <button
            className="chat-end-dialog__button chat-end-dialog__button--secondary"
            onClick={onCancel}
            type="button"
          >
            Continue Chat
          </button>
          <button
            className="chat-end-dialog__button chat-end-dialog__button--primary"
            onClick={onConfirm}
            type="button"
          >
            End Chat
          </button>
        </div>
      </div>
    </div>
  );
};
