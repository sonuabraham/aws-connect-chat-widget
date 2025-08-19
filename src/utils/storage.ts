import type { ChatState, VisitorInfo } from '../types/chat';

/**
 * Storage keys for persisting chat data
 */
const STORAGE_KEYS = {
  CHAT_STATE: 'aws-connect-chat-state',
  VISITOR_INFO: 'aws-connect-visitor-info',
  SESSION_ID: 'aws-connect-session-id',
  CHAT_HISTORY: 'aws-connect-chat-history',
} as const;

/**
 * Storage utility for persisting chat state and visitor information
 * Supports requirements 1.3, 2.1 for visitor data persistence
 */
export class ChatStorage {
  /**
   * Save chat state to localStorage
   */
  static saveChatState(state: Partial<ChatState>): void {
    try {
      const serializedState = JSON.stringify({
        ...state,
        // Convert Date objects to ISO strings for serialization
        messages: state.messages?.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      });
      localStorage.setItem(STORAGE_KEYS.CHAT_STATE, serializedState);
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }

  /**
   * Load chat state from localStorage
   */
  static loadChatState(): Partial<ChatState> | null {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEYS.CHAT_STATE);
      if (!serializedState) return null;

      const state = JSON.parse(serializedState);

      // Convert ISO strings back to Date objects
      if (state.messages) {
        state.messages = state.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }

      return state;
    } catch (error) {
      console.warn('Failed to load chat state:', error);
      return null;
    }
  }

  /**
   * Clear chat state from localStorage
   */
  static clearChatState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_STATE);
    } catch (error) {
      console.warn('Failed to clear chat state:', error);
    }
  }

  /**
   * Save visitor information
   */
  static saveVisitorInfo(visitor: VisitorInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VISITOR_INFO, JSON.stringify(visitor));
    } catch (error) {
      console.warn('Failed to save visitor info:', error);
    }
  }

  /**
   * Load visitor information
   */
  static loadVisitorInfo(): VisitorInfo | null {
    try {
      const serializedVisitor = localStorage.getItem(STORAGE_KEYS.VISITOR_INFO);
      return serializedVisitor ? JSON.parse(serializedVisitor) : null;
    } catch (error) {
      console.warn('Failed to load visitor info:', error);
      return null;
    }
  }

  /**
   * Clear visitor information
   */
  static clearVisitorInfo(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.VISITOR_INFO);
    } catch (error) {
      console.warn('Failed to clear visitor info:', error);
    }
  }

  /**
   * Generate and save session ID
   */
  static generateSessionId(): string {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    } catch (error) {
      console.warn('Failed to save session ID:', error);
    }
    return sessionId;
  }

  /**
   * Load existing session ID
   */
  static loadSessionId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.warn('Failed to load session ID:', error);
      return null;
    }
  }

  /**
   * Clear session ID
   */
  static clearSessionId(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.warn('Failed to clear session ID:', error);
    }
  }

  /**
   * Save chat history for transcript purposes
   */
  static saveChatHistory(messages: any[]): void {
    try {
      const serializedHistory = JSON.stringify(
        messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }))
      );
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, serializedHistory);
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }

  /**
   * Load chat history
   */
  static loadChatHistory(): any[] {
    try {
      const serializedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!serializedHistory) return [];

      const history = JSON.parse(serializedHistory);
      return history.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.warn('Failed to load chat history:', error);
      return [];
    }
  }

  /**
   * Clear all chat data
   */
  static clearAll(): void {
    this.clearChatState();
    this.clearVisitorInfo();
    this.clearSessionId();
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  }

  /**
   * Check if there's an active chat session
   */
  static hasActiveSession(): boolean {
    const state = this.loadChatState();
    return state?.status === 'connected' || state?.status === 'waiting';
  }
}

// Export for backward compatibility
export const storage = ChatStorage;
