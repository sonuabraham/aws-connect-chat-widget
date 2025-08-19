import type { ChatSession } from './aws-connect';

/**
 * Main chat state interface
 * Supports requirements 6.1, 6.2, 7.1, 7.2
 */
export interface ChatState {
  status: ChatStatus;
  session?: ChatSession;
  messages: Message[];
  agent?: AgentInfo;
  visitor: VisitorInfo;
  unreadCount: number;
  isTyping: boolean;
  error?: ChatError;
}

/**
 * Chat status enumeration
 */
export type ChatStatus =
  | 'closed'
  | 'initializing'
  | 'waiting'
  | 'connected'
  | 'ended';

/**
 * Message interface for chat messages
 */
export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  status: MessageStatus;
  type: MessageType;
}

/**
 * Message sender types
 */
export type MessageSender = 'visitor' | 'agent' | 'system';

/**
 * Message delivery status
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

/**
 * Message content types
 */
export type MessageType = 'text' | 'file' | 'image' | 'system';

/**
 * Agent information interface
 */
export interface AgentInfo {
  id: string;
  name: string;
  profileImage?: string;
  status: AgentStatus;
  isTyping: boolean;
}

/**
 * Agent status enumeration
 */
export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Visitor information interface
 */
export interface VisitorInfo {
  name: string;
  email?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Chat session rating interface
 */
export interface ChatRating {
  score: number; // 1-5 scale
  comment?: string;
  timestamp: Date;
}

/**
 * Chat transcript interface
 */
export interface ChatTranscript {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  agent?: AgentInfo;
  visitor: VisitorInfo;
  rating?: ChatRating;
}

/**
 * Chat error interface
 */
export interface ChatError {
  code: ChatErrorCode;
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Chat error codes
 */
export type ChatErrorCode =
  | 'CONNECTION_LOST'
  | 'MESSAGE_SEND_FAILED'
  | 'AGENT_DISCONNECTED'
  | 'SESSION_TIMEOUT'
  | 'AUTHENTICATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED';
