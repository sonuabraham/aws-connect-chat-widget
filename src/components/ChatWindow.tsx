import React, { useEffect, useRef, useState } from 'react';
import type { ChatWindowProps } from '../types/ui';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { AgentInfo } from './AgentInfo';
import { AgentDisconnectionNotification } from './AgentDisconnectionNotification';
import '../styles/ChatWindow.css';

/**
 * ChatWindow component - Expanded state of the chat widget
 * Requirements: 1.2, 1.3, 5.3, 5.4
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  chatState,
  config,
  onSendMessage,
  onTyping,
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [showDisconnectionNotification, setShowDisconnectionNotification] = useState(false);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && windowRef.current) {
      // Focus the window when it opens
      windowRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close window
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const windowStyle = {
    '--primary-color': config.theme.primaryColor,
    '--secondary-color': config.theme.secondaryColor,
    '--border-radius': config.theme.borderRadius,
    '--font-family': config.theme.fontFamily,
  } as React.CSSProperties;

  const getStatusMessage = () => {
    switch (chatState.status) {
      case 'initializing':
        return config.messages.connectingMessage || 'Connecting...';
      case 'waiting':
        return config.messages.waitingMessage || 'Waiting for an agent...';
      case 'connected':
        return chatState.agent ? `Connected to ${chatState.agent.name}` : 'Connected';
      case 'ended':
        return 'Chat ended';
      default:
        return config.messages.welcomeMessage || 'Welcome! How can we help you?';
    }
  };

  const handleAgentDisconnected = () => {
    setShowDisconnectionNotification(true);
  };

  const handleReconnect = () => {
    // This would trigger a reconnection attempt
    // Implementation depends on the chat service
    console.log('Attempting to reconnect...');
  };

  const handleDismissNotification = () => {
    setShowDisconnectionNotification(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className="chat-window"
      style={windowStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-window-title"
      tabIndex={-1}
    >
      <div className="chat-window__container">
        {/* Header */}
        <header
          ref={headerRef}
          className="chat-window__header"
          id="chat-window-title"
        >
          <div className="chat-window__header-content">
            <AgentInfo
              agent={chatState.agent}
              isConnected={chatState.status === 'connected'}
              showTypingIndicator={true}
              onAgentDisconnected={handleAgentDisconnected}
              compact={false}
            />
          </div>
          <div className="chat-window__actions">
            <button
              className="chat-window__action-button"
              onClick={onMinimize}
              aria-label="Minimize chat"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 8H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              className="chat-window__action-button"
              onClick={onClose}
              aria-label="Close chat"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="chat-window__body">
          <AgentDisconnectionNotification
            isVisible={showDisconnectionNotification}
            agentName={chatState.agent?.name}
            onReconnect={handleReconnect}
            onDismiss={handleDismissNotification}
          />
          <MessageList
            messages={chatState.messages}
            isTyping={chatState.isTyping}
            onScroll={() => {}} // Scroll handling is internal to MessageList
            agentInfo={chatState.agent}
          />
        </main>

        {/* Footer */}
        <footer className="chat-window__footer">
          <MessageInput
            onSendMessage={onSendMessage}
            disabled={chatState.status !== 'connected'}
            placeholder={
              chatState.status === 'connected'
                ? 'Type your message...'
                : 'Please wait...'
            }
            maxLength={1000}
            onTyping={onTyping}
          />
        </footer>
      </div>
    </div>
  );
};
