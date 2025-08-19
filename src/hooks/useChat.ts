import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ChatState,
  Message,
  AgentInfo,
  VisitorInfo,
  ChatStatus,
  ChatError,
} from '../types/chat';
import type { AgentStatusUpdate, ConnectionStatus } from '../types/aws-connect';
import { ConnectService } from '../services/ConnectService';
import { ChatStorage } from '../utils/storage';

/**
 * Initial chat state
 */
const initialChatState: ChatState = {
  status: 'closed',
  messages: [],
  visitor: {
    name: '',
    sessionId: '',
  },
  unreadCount: 0,
  isTyping: false,
};

/**
 * useChat hook return type
 */
export interface UseChatReturn {
  // State
  chatState: ChatState;
  isConnected: boolean;
  isLoading: boolean;

  // Actions
  initializeChat: (
    visitorInfo: Omit<VisitorInfo, 'sessionId'>
  ) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  endChat: () => Promise<void>;
  markMessagesAsRead: () => void;
  setTyping: (isTyping: boolean) => void;

  // State management
  updateVisitorInfo: (info: Partial<VisitorInfo>) => void;
  clearChatHistory: () => void;
  restoreFromStorage: () => void;
}

/**
 * Chat state management hook
 * Implements chat state management with proper state transitions
 * Supports requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1
 */
export const useChat = (connectService?: ConnectService): UseChatReturn => {
  const [chatState, setChatState] = useState<ChatState>(initialChatState);
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to maintain service instance across re-renders
  const serviceRef = useRef<ConnectService | null>(connectService || null);

  // Derived state
  const isConnected = chatState.status === 'connected';

  /**
   * Update chat state with immutability
   */
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prevState => {
      const newState = { ...prevState, ...updates };

      // Persist state to localStorage for page refresh recovery
      if (newState.status !== 'closed') {
        ChatStorage.saveChatState(newState);
      }

      return newState;
    });
  }, []);

  /**
   * Handle state transitions
   * Requirement 2.1, 2.2: Proper state management for chat lifecycle
   */
  const transitionToStatus = useCallback(
    (newStatus: ChatStatus, error?: ChatError) => {
      updateChatState({
        status: newStatus,
        error: error || undefined,
      });
    },
    [updateChatState]
  );

  /**
   * Initialize chat session
   * Requirement 2.1: Establish connection to AWS Connect
   */
  const initializeChat = useCallback(
    async (visitorInfo: Omit<VisitorInfo, 'sessionId'>) => {
      if (!serviceRef.current) {
        throw new Error('ConnectService not available');
      }

      setIsLoading(true);
      transitionToStatus('initializing');

      try {
        // Generate or restore session ID
        let sessionId = ChatStorage.loadSessionId();
        if (!sessionId) {
          sessionId = ChatStorage.generateSessionId();
        }

        const fullVisitorInfo: VisitorInfo = {
          ...visitorInfo,
          sessionId,
        };

        // Update visitor info in state
        updateChatState({ visitor: fullVisitorInfo });
        ChatStorage.saveVisitorInfo(fullVisitorInfo);

        // Transition to waiting state
        transitionToStatus('waiting');

        // Initialize chat with AWS Connect
        const session = await serviceRef.current.initializeChat({
          displayName: fullVisitorInfo.name,
          email: fullVisitorInfo.email,
        });

        // Update state with session info
        updateChatState({
          session,
          status: 'connected',
        });
      } catch (error) {
        const chatError: ChatError = {
          code: 'CONNECTION_LOST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to initialize chat',
          timestamp: new Date(),
          recoverable: true,
        };

        transitionToStatus('ended', chatError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [transitionToStatus, updateChatState]
  );

  /**
   * Send message to agent
   * Requirement 3.1: Send messages through ConnectService
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!serviceRef.current || !isConnected) {
        throw new Error('No active chat session');
      }

      // Create optimistic message
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        content,
        sender: 'visitor',
        timestamp: new Date(),
        status: 'sending',
        type: 'text',
      };

      // Add message to state optimistically using functional update
      setChatState(prevState => {
        const newState = {
          ...prevState,
          messages: [...prevState.messages, message],
        };

        // Persist state to localStorage for page refresh recovery
        if (newState.status !== 'closed') {
          ChatStorage.saveChatState(newState);
        }

        return newState;
      });

      try {
        await serviceRef.current.sendMessage(content);

        // Update message status to sent
        setChatState(prevState => {
          const newState = {
            ...prevState,
            messages: prevState.messages.map(msg =>
              msg.id === message.id ? { ...msg, status: 'sent' as const } : msg
            ),
          };

          // Persist state to localStorage for page refresh recovery
          if (newState.status !== 'closed') {
            ChatStorage.saveChatState(newState);
          }

          return newState;
        });
      } catch (error) {
        // Update message status to failed
        setChatState(prevState => {
          const newState = {
            ...prevState,
            messages: prevState.messages.map(msg =>
              msg.id === message.id
                ? { ...msg, status: 'failed' as const }
                : msg
            ),
          };

          // Persist state to localStorage for page refresh recovery
          if (newState.status !== 'closed') {
            ChatStorage.saveChatState(newState);
          }

          return newState;
        });
        throw error;
      }
    },
    [isConnected]
  );

  /**
   * End chat session
   * Requirement 2.2: Properly terminate chat sessions
   */
  const endChat = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      await serviceRef.current.endChat();

      // Save final chat history
      ChatStorage.saveChatHistory(chatState.messages);

      // Clear active session data but keep visitor info
      ChatStorage.clearChatState();
      ChatStorage.clearSessionId();

      // Reset to closed state
      updateChatState({
        status: 'ended',
        session: undefined,
        unreadCount: 0,
        isTyping: false,
        error: undefined,
      });
    } catch (error) {
      console.warn('Error ending chat:', error);
      // Still transition to ended state even if disconnect fails
      transitionToStatus('ended');
    } finally {
      setIsLoading(false);
    }
  }, [chatState.messages, updateChatState, transitionToStatus]);

  /**
   * Mark messages as read
   * Requirement 4.1: Manage unread message count
   */
  const markMessagesAsRead = useCallback(() => {
    if (chatState.unreadCount > 0) {
      updateChatState({ unreadCount: 0 });
    }
  }, [chatState.unreadCount, updateChatState]);

  /**
   * Set typing indicator
   * Requirement 3.4: Handle typing indicators
   */
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (serviceRef.current && isConnected) {
        if (isTyping) {
          serviceRef.current.handleUserTyping();
        } else {
          serviceRef.current.stopUserTyping();
        }
      }
    },
    [isConnected]
  );

  /**
   * Update visitor information
   * Requirement 2.1: Manage visitor data
   */
  const updateVisitorInfo = useCallback(
    (info: Partial<VisitorInfo>) => {
      const updatedVisitor = { ...chatState.visitor, ...info };
      updateChatState({ visitor: updatedVisitor });
      ChatStorage.saveVisitorInfo(updatedVisitor);
    },
    [chatState.visitor, updateChatState]
  );

  /**
   * Clear chat history
   */
  const clearChatHistory = useCallback(() => {
    updateChatState({ messages: [] });
    ChatStorage.clearAll();
  }, [updateChatState]);

  /**
   * Restore state from storage
   * Requirement: State persistence for page refreshes during active chats
   */
  const restoreFromStorage = useCallback(() => {
    const savedState = ChatStorage.loadChatState();
    const savedVisitor = ChatStorage.loadVisitorInfo();

    if (savedState || savedVisitor) {
      const restoredState: Partial<ChatState> = {
        ...savedState,
        visitor: savedVisitor || initialChatState.visitor,
      };

      // Only restore if there was an active session
      if (ChatStorage.hasActiveSession()) {
        updateChatState(restoredState);
      }
    }
  }, [updateChatState]);

  /**
   * Set up service event listeners
   */
  useEffect(() => {
    if (!serviceRef.current) {
      return;
    }

    const service = serviceRef.current;

    // Handle incoming messages
    const handleMessage = (message: Message) => {
      setChatState(prevState => {
        const newState = {
          ...prevState,
          messages: [...prevState.messages, message],
          unreadCount: prevState.unreadCount + 1,
        };

        // Persist state to localStorage for page refresh recovery
        if (newState.status !== 'closed') {
          ChatStorage.saveChatState(newState);
        }

        return newState;
      });
    };

    // Handle agent status updates
    const handleAgentStatus = (status: AgentStatusUpdate) => {
      const agentInfo: AgentInfo = {
        id: status.agentId,
        name: status.name || 'Agent',
        profileImage: status.profileImage,
        status: status.status,
        isTyping: status.isTyping,
      };

      updateChatState({
        agent: agentInfo,
        isTyping: status.isTyping,
      });
    };

    // Handle connection status changes
    const handleConnectionStatus = (status: ConnectionStatus) => {
      switch (status) {
        case 'connected':
          transitionToStatus('connected');
          break;
        case 'disconnected':
        case 'failed':
          transitionToStatus('ended');
          break;
        case 'connecting':
          transitionToStatus('waiting');
          break;
      }
    };

    // Register event listeners
    service.onMessageReceived(handleMessage);
    service.onAgentStatusChange(handleAgentStatus);
    service.onConnectionStatusChange(handleConnectionStatus);

    // Cleanup function
    return () => {
      // Note: ConnectService doesn't expose removeListener methods
      // In a real implementation, you'd want to add those methods
    };
  }, [updateChatState, transitionToStatus]);

  /**
   * Initialize from storage on mount
   */
  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  return {
    // State
    chatState,
    isConnected,
    isLoading,

    // Actions
    initializeChat,
    sendMessage,
    endChat,
    markMessagesAsRead,
    setTyping,

    // State management
    updateVisitorInfo,
    clearChatHistory,
    restoreFromStorage,
  };
};
