import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { MessageInputProps } from '../types/ui';
import '../styles/MessageInput.css';

/**
 * MessageInput component - Text input for sending messages
 * Requirements: 3.1, 3.4, 5.2, 5.3
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  placeholder,
  maxLength = 1000,
  onTyping,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max 5 lines approximately
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;

    // Enforce character limit
    if (maxLength && value.length > maxLength) {
      return;
    }

    setMessage(value);
    adjustTextareaHeight();

    // Handle typing indicator
    if (onTyping) {
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      if (value.trim()) {
        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 1000);
      } else {
        setIsTyping(false);
        onTyping(false);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  // Send message function
  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');

    // Stop typing indicator
    if (onTyping && isTyping) {
      setIsTyping(false);
      onTyping(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    setTimeout(adjustTextareaHeight, 0);
  };

  // Handle key presses
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but not Shift+Enter)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }

    // Handle Escape key
    if (event.key === 'Escape') {
      setMessage('');
      adjustTextareaHeight();
      if (onTyping && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }
  };

  // Adjust height on mount and when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const remainingChars = maxLength ? maxLength - message.length : null;
  const isNearLimit = remainingChars !== null && remainingChars < 50;
  const canSend = message.trim().length > 0 && !disabled;

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="message-input__container">
        <div className="message-input__field">
          <textarea
            ref={textareaRef}
            className="message-input__textarea"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            aria-label="Type your message"
            aria-describedby={isNearLimit ? 'char-count' : undefined}
          />
          {maxLength && isNearLimit && (
            <div
              id="char-count"
              className={`message-input__char-count ${remainingChars === 0 ? 'message-input__char-count--limit' : ''}`}
              aria-live="polite"
            >
              {remainingChars} characters remaining
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`message-input__send-button ${canSend ? 'message-input__send-button--active' : ''}`}
          disabled={!canSend}
          aria-label="Send message"
          title={canSend ? 'Send message (Enter)' : 'Type a message to send'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="message-input__send-icon"
            aria-hidden="true"
          >
            <path
              d="M2 10L18 2L11 10L18 18L2 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="message-input__hint" aria-hidden="true">
        Press Enter to send, Shift+Enter for new line
      </div>
    </form>
  );
};
