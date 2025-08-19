import type { Message, AgentStatus } from './chat';

/**
 * AWS Connect chat session interface
 * Supports requirements 7.1, 7.2
 */
export interface ChatSession {
  connectionToken: string;
  participantId: string;
  participantToken: string;
  websocketUrl: string;
  startTime: Date;
}

/**
 * AWS Connect service interface
 */
export interface ConnectService {
  initializeChat(participantDetails: ParticipantDetails): Promise<ChatSession>;
  sendMessage(content: string): Promise<void>;
  receiveMessages(): Promise<Message[]>;
  endChat(): Promise<void>;
  onMessageReceived(callback: (message: Message) => void): void;
  onAgentStatusChange(callback: (status: AgentStatusUpdate) => void): void;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;
}

/**
 * Participant details for chat initialization
 */
export interface ParticipantDetails {
  displayName: string;
  email?: string;
  attributes?: Record<string, string>;
}

/**
 * Agent status update from AWS Connect
 */
export interface AgentStatusUpdate {
  agentId: string;
  status: AgentStatus;
  isTyping: boolean;
  name?: string;
  profileImage?: string;
}

/**
 * Connection status enumeration
 */
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

/**
 * AWS Connect API response interfaces
 */
export interface StartChatContactResponse {
  ContactId: string;
  ParticipantId: string;
  ParticipantToken: string;
}

export interface CreateParticipantConnectionResponse {
  ConnectionCredentials: {
    ConnectionToken: string;
    Expiry: string;
  };
  Websocket: {
    Url: string;
    ConnectionExpiry: string;
  };
}

/**
 * AWS Connect message event interface
 */
export interface ConnectMessageEvent {
  Id: string;
  Type: string;
  ParticipantId: string;
  DisplayName: string;
  ParticipantRole: string;
  Content: string;
  ContentType: string;
  AbsoluteTime: string;
}

/**
 * AWS Connect typing event interface
 */
export interface ConnectTypingEvent {
  ParticipantId: string;
  ParticipantRole: string;
  AbsoluteTime: string;
}

/**
 * AWS Connect error response interface
 */
export interface ConnectError {
  Code: string;
  Message: string;
  Type: ConnectErrorType;
}

/**
 * AWS Connect error types
 */
export type ConnectErrorType =
  | 'AccessDeniedException'
  | 'InternalServerException'
  | 'InvalidRequestException'
  | 'LimitExceededException'
  | 'ResourceNotFoundException'
  | 'ServiceQuotaExceededException'
  | 'ThrottlingException';

/**
 * WebSocket message types from AWS Connect
 */
export type WebSocketMessageType =
  | 'MESSAGE'
  | 'EVENT'
  | 'HEARTBEAT'
  | 'CONNECTION_ACK'
  | 'CONNECTION_ESTABLISHED';
