import React, { useEffect, useCallback, useRef } from 'react';
import type { ChatWidgetProps } from '../types/ui';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../hooks/useChat';
import { useConnect } from '../hooks/useConnect';
import { useWidget } from '../hooks/useWidget';

/**
 * Main ChatWidget component
 * Integrates ChatButton and ChatWindow components with hooks
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  config,
  onStateChange,
  onError,
}) => {
  // Initialize hooks
  const {
    connectService,
    initialize: initializeConnect,
    connectionStatus,
  } = useConnect();
  const {
    chatState,
    initializeChat,
    sendMessage,
    endChat,
    markMessagesAsRead,
    setTyping,
  } = useChat(connectService);
  const {
    isOpen,
    isMinimized,
    widgetState,
    position,
    visitorInfo,
    hasVisitorInfo,
    openWidget,
    closeWidget,
    minimizeWidget,
    setVisitorInfo,
  } = useWidget(config);

  // Track initialization
  const initializedRef = useRef(false);

  /**
   * Initialize AWS Connect service
   */
  useEffect(() => {
    if (!initializedRef.current && config.aws) {
      initializeConnect(config.aws).catch(error => {
        console.error('Failed to initialize AWS Connect:', error);
        onError?.({
          code: 'AWS_CONNECTION_FAILED',
          message: 'Failed to connect to AWS Connect service',
          details: { error: error.message },
        });
      });
      initializedRef.current = true;
    }
  }, [config.aws, initializeConnect, onError]);

  /**
   * Handle widget state changes
   */
  useEffect(() => {
    onStateChange?.(widgetState);
  }, [widgetState, onStateChange]);

  /**
   * Handle chat button click
   * Requirements: 1.1, 1.2 - Toggle widget open/closed state
   */
  const handleChatButtonClick = useCallback(() => {
    if (isOpen) {
      closeWidget();
    } else if (isMinimized) {
      openWidget();
      markMessagesAsRead();
    } else {
      openWidget();
    }
  }, [isOpen, isMinimized, openWidget, closeWidget, markMessagesAsRead]);

  /**
   * Handle chat window close
   * Requirements: 1.2 - Close chat interface
   */
  const handleChatWindowClose = useCallback(async () => {
    try {
      if (chatState.status === 'connected') {
        await endChat();
      }
      closeWidget();
    } catch (error) {
      console.error('Error closing chat:', error);
      closeWidget(); // Close anyway
    }
  }, [chatState.status, endChat, closeWidget]);

  /**
   * Handle chat window minimize
   * Requirements: 1.4 - Minimize widget while maintaining session
   */
  const handleChatWindowMinimize = useCallback(() => {
    minimizeWidget();
  }, [minimizeWidget]);

  /**
   * Handle message sending
   * Requirements: 3.1 - Wire MessageInput to ConnectService for sending messages
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        await sendMessage(content);
      } catch (error) {
        console.error('Failed to send message:', error);
        onError?.({
          code: 'NETWORK_ERROR',
          message: 'Failed to send message',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    },
    [sendMessage, onError]
  );

  /**
   * Handle typing indicator
   * Requirements: 3.4 - Integrate typing indicators between components and services
   */
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      setTyping(isTyping);
    },
    [setTyping]
  );

  /**
   * Handle chat initialization when widget opens
   * Requirements: 2.1, 2.2 - Initialize chat session
   */
  useEffect(() => {
    if (isOpen && !hasVisitorInfo && widgetState === 'initializing') {
      // For demo purposes, set default visitor info
      // In real implementation, this would come from a form
      setVisitorInfo({
        name: 'Website Visitor',
        email: 'visitor@example.com',
      });
    }
  }, [isOpen, hasVisitorInfo, widgetState, setVisitorInfo]);

  /**
   * Initialize chat when visitor info is available
   */
  useEffect(() => {
    if (
      isOpen &&
      hasVisitorInfo &&
      visitorInfo &&
      widgetState === 'initializing' &&
      connectionStatus === 'disconnected'
    ) {
      initializeChat(visitorInfo).catch(error => {
        console.error('Failed to initialize chat:', error);
        onError?.({
          code: 'INITIALIZATION_FAILED',
          message: 'Failed to start chat session',
          details: { error: error.message },
        });
      });
    }
  }, [
    isOpen,
    hasVisitorInfo,
    visitorInfo,
    widgetState,
    connectionStatus,
    initializeChat,
    onError,
  ]);

  /**
   * Mark messages as read when widget is opened
   */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      markMessagesAsRead();
    }
  }, [isOpen, isMinimized, markMessagesAsRead]);

  return (
    <>
      {/* Chat Button - Always visible */}
      <ChatButton
        isOpen={isOpen}
        unreadCount={chatState.unreadCount}
        onClick={handleChatButtonClick}
        config={config.ui.theme}
        position={position}
      />

      {/* Chat Window - Visible when open */}
      <ChatWindow
        isOpen={isOpen}
        onClose={handleChatWindowClose}
        onMinimize={handleChatWindowMinimize}
        chatState={chatState}
        config={config.ui}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </>
  );
};
