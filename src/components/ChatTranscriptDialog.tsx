import React, { useState } from 'react';
import type { ChatState } from '../types/chat';
import '../styles/ChatTranscriptDialog.css';

/**
 * Chat transcript dialog component props
 */
export interface ChatTranscriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  chatState: ChatState;
  sessionDuration: string;
}

/**
 * ChatTranscriptDialog component - Chat transcript generation and download
 * Requirements: 4.4
 */
export const ChatTranscriptDialog: React.FC<ChatTranscriptDialogProps> = ({
  isOpen,
  onClose,
  onDownload,
  chatState,
  sessionDuration,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatMessageTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getMessageCount = (): number => {
    return chatState.messages.filter(msg => msg.sender !== 'system').length;
  };

  const copyToClipboard = async () => {
    const transcriptText = generateTranscriptText();
    try {
      await navigator.clipboard.writeText(transcriptText);
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  const generateTranscriptText = (): string => {
    const lines: string[] = [];
    
    // Header
    lines.push('CHAT TRANSCRIPT');
    lines.push('================');
    lines.push('');
    lines.push(`Session ID: ${chatState.visitor.sessionId}`);
    lines.push(`Date: ${formatTimestamp(chatState.session?.startTime || new Date())}`);
    lines.push(`Duration: ${sessionDuration}`);
    lines.push(`Visitor: ${chatState.visitor.name}`);
    if (chatState.agent) {
      lines.push(`Agent: ${chatState.agent.name}`);
    }
    lines.push('');
    lines.push('CONVERSATION');
    lines.push('============');
    lines.push('');
    
    // Messages
    chatState.messages
      .filter(msg => msg.sender !== 'system')
      .forEach(message => {
        const time = formatMessageTime(message.timestamp);
        const sender = message.sender === 'visitor' ? chatState.visitor.name : 
                      (chatState.agent?.name || 'Agent');
        lines.push(`[${time}] ${sender}: ${message.content}`);
      });
    
    lines.push('');
    lines.push('End of transcript');
    
    return lines.join('\n');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="chat-transcript-dialog-overlay" role="dialog" aria-modal="true">
      <div className="chat-transcript-dialog">
        <div className="chat-transcript-dialog__header">
          <h3 className="chat-transcript-dialog__title">Chat Transcript</h3>
          <button
            className="chat-transcript-dialog__close"
            onClick={onClose}
            type="button"
            aria-label="Close transcript dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        <div className="chat-transcript-dialog__content">
          <div className="transcript-summary">
            <div className="transcript-summary__stats">
              <div className="transcript-stat">
                <span className="transcript-stat__label">Session Duration:</span>
                <span className="transcript-stat__value">{sessionDuration}</span>
              </div>
              <div className="transcript-stat">
                <span className="transcript-stat__label">Messages:</span>
                <span className="transcript-stat__value">{getMessageCount()}</span>
              </div>
              <div className="transcript-stat">
                <span className="transcript-stat__label">Date:</span>
                <span className="transcript-stat__value">
                  {formatTimestamp(chatState.session?.startTime || new Date())}
                </span>
              </div>
            </div>
          </div>
          
          <div className="transcript-preview">
            <div className="transcript-preview__header">
              <h4>Preview</h4>
            </div>
            <div className="transcript-preview__content">
              {chatState.messages
                .filter(msg => msg.sender !== 'system')
                .slice(0, 5) // Show first 5 messages as preview
                .map((message, index) => (
                  <div key={message.id} className="transcript-message">
                    <div className="transcript-message__meta">
                      <span className="transcript-message__sender">
                        {message.sender === 'visitor' ? chatState.visitor.name : 
                         (chatState.agent?.name || 'Agent')}
                      </span>
                      <span className="transcript-message__time">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="transcript-message__content">
                      {message.content}
                    </div>
                  </div>
                ))}
              
              {getMessageCount() > 5 && (
                <div className="transcript-preview__more">
                  ... and {getMessageCount() - 5} more messages
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="chat-transcript-dialog__actions">
          <button
            className="chat-transcript-dialog__button chat-transcript-dialog__button--secondary"
            onClick={copyToClipboard}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 2H12C12.5523 2 13 2.44772 13 3V11C13 11.5523 12.5523 12 12 12H4C3.44772 12 3 11.5523 3 11V3C3 2.44772 3.44772 2 4 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M6 4H10M6 6H10M6 8H8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Copy to Clipboard
          </button>
          
          <button
            className="chat-transcript-dialog__button chat-transcript-dialog__button--primary"
            onClick={handleDownload}
            type="button"
            disabled={isDownloading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1V11M8 11L11 8M8 11L5 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 11V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {isDownloading ? 'Downloading...' : 'Download Transcript'}
          </button>
        </div>
      </div>
    </div>
  );
};