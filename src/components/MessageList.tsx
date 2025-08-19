import React, { useEffect, useRef, useState } from 'react';
import type { MessageListProps, MessageBubbleProps, TypingIndicatorProps } from '../types/ui';
import type { Message } from '../types/chat';
import '../styles/MessageList.css';

/**
 * MessageBubble component for individual messages
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTimestamp,
  agentInfo,
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" className="message-bubble__status-icon">
            <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        );
      case 'sent':
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" className="message-bubble__status-icon">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'delivered':
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" className="message-bubble__status-icon">
            <path d="M1 6L4 9L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M3 6L6 9L11 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'failed':
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" className="message-bubble__status-icon message-bubble__status-icon--error">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M4 4L8 8M8 4L4 8" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`message-bubble ${isOwn ? 'message-bubble--own' : 'message-bubble--other'}`}>
      {!isOwn && agentInfo?.profileImage && (
        <img
          src={agentInfo.profileImage}
          alt={`${agentInfo.name} avatar`}
          className="message-bubble__avatar"
        />
      )}
      <div className="message-bubble__content">
        {!isOwn && agentInfo?.name && (
          <div className="message-bubble__sender">{agentInfo.name}</div>
        )}
        <div className="message-bubble__text">{message.content}</div>
        {showTimestamp && (
          <div className="message-bubble__meta">
            <span className="message-bubble__time">{formatTime(message.timestamp)}</span>
            {isOwn && getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TypingIndicator component for agent typing status
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, agentName }) => {
  if (!isVisible) return null;

  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <div className="typing-indicator__content">
        <div className="typing-indicator__dots">
          <span className="typing-indicator__dot" />
          <span className="typing-indicator__dot" />
          <span className="typing-indicator__dot" />
        </div>
        <span className="typing-indicator__text">
          {agentName ? `${agentName} is typing...` : 'Agent is typing...'}
        </span>
      </div>
    </div>
  );
};

/**
 * MessageList component - Chat history display
 * Requirements: 3.2, 3.3, 3.4, 4.2
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  onScroll,
  agentInfo,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && listRef.current) {
      const scrollElement = listRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages, isTyping, shouldAutoScroll]);

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollPosition = scrollTop / (scrollHeight - clientHeight);
    
    // Call parent scroll handler
    onScroll(scrollPosition);
    
    // Determine if user has scrolled away from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
    
    if (!userHasScrolled && scrollTop > 0) {
      setUserHasScrolled(true);
    }
  };

  // Group messages by date for better organization
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];

    messages.forEach((message) => {
      const messageDate = message.timestamp.toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    }
  };

  return (
    <div
      ref={listRef}
      className="message-list"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="message-list__content">
        {messageGroups.length === 0 && (
          <div className="message-list__empty">
            <div className="message-list__empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M40 8H8C5.8 8 4 9.8 4 12V44L12 36H40C42.2 36 44 34.2 44 32V12C44 9.8 42.2 8 40 8ZM40 32H10.34L8 34.34V12H40V32Z"
                  fill="currentColor"
                  opacity="0.3"
                />
              </svg>
            </div>
            <p className="message-list__empty-text">
              Start a conversation by sending a message below.
            </p>
          </div>
        )}

        {messageGroups.map((group) => (
          <div key={group.date} className="message-list__group">
            <div className="message-list__date-header">
              <span className="message-list__date-text">
                {formatDateHeader(group.date)}
              </span>
            </div>
            {group.messages.map((message, messageIndex) => {
              const isOwn = message.sender === 'visitor';
              const showTimestamp = 
                messageIndex === group.messages.length - 1 || 
                (messageIndex < group.messages.length - 1 && 
                 group.messages[messageIndex + 1].sender !== message.sender);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showTimestamp={showTimestamp}
                  agentInfo={agentInfo}
                />
              );
            })}
          </div>
        ))}

        <TypingIndicator isVisible={isTyping} agentName={agentInfo?.name} />
      </div>

      {/* Scroll to bottom button */}
      {!shouldAutoScroll && userHasScrolled && (
        <button
          className="message-list__scroll-button"
          onClick={() => {
            setShouldAutoScroll(true);
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight;
            }
          }}
          aria-label="Scroll to bottom"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 12L3 7H13L8 12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
