import {
  ConnectParticipantClient,
  CreateParticipantConnectionCommand,
  SendMessageCommand,
  GetTranscriptCommand,
  DisconnectParticipantCommand,
  SendEventCommand,
} from '@aws-sdk/client-connectparticipant';
import type {
  ChatSession,
  ConnectService as IConnectService,
  ParticipantDetails,
  AgentStatusUpdate,
  ConnectionStatus,
  ConnectMessageEvent,
  ConnectTypingEvent,
  WebSocketMessageType,
} from '../types/aws-connect';
import type { Message } from '../types/chat';
import {
  WebSocketManager,
  type WebSocketMessageHandler,
} from './WebSocketManager';
import { MessageQueue } from './MessageQueue';
import { TypingIndicatorService } from './TypingIndicatorService';
import { ErrorHandler } from './ErrorHandler';
import { NotificationService } from './NotificationService';

/**
 * AWS Connect service implementation
 * Handles chat session initialization, message sending/receiving, and connection management
 * Supports requirements 2.1, 2.2, 7.2, 7.4
 */
export class ConnectService
  implements IConnectService, WebSocketMessageHandler
{
  private client: ConnectParticipantClient;
  private session: ChatSession | null = null;
  private connectionToken: string | null = null;
  private participantToken: string | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private agentStatusCallbacks: ((status: AgentStatusUpdate) => void)[] = [];
  private connectionStatusCallbacks: ((status: ConnectionStatus) => void)[] =
    [];

  // Real-time messaging services
  private webSocketManager: WebSocketManager;
  private messageQueue: MessageQueue;
  private typingIndicatorService: TypingIndicatorService;

  // Error handling and notifications
  private errorHandler: ErrorHandler;
  private notificationService: NotificationService;

  constructor(region: string = 'us-east-1') {
    this.client = new ConnectParticipantClient({
      region,
      // Credentials will be provided through environment or IAM roles
    });

    // Initialize real-time messaging services
    this.webSocketManager = new WebSocketManager();
    this.messageQueue = new MessageQueue();
    this.typingIndicatorService = new TypingIndicatorService();

    // Initialize error handling and notifications
    this.errorHandler = new ErrorHandler();
    this.notificationService = new NotificationService();

    // Set up service integrations
    this.setupServiceIntegrations();
  }

  /**
   * Initialize chat session with AWS Connect
   * Requirement 2.1: Establish connection to AWS Connect
   * Requirement 2.4: Error handling with user-friendly messages
   */
  async initializeChat(
    participantDetails: ParticipantDetails
  ): Promise<ChatSession> {
    try {
      this.notifyConnectionStatus('connecting');

      // In a real implementation, this would come from your backend API
      // that calls AWS Connect's StartChatContact API
      const startChatResponse = await this.startChatContact(participantDetails);

      this.participantToken = startChatResponse.ParticipantToken;

      // Create participant connection
      const connectionResponse = await this.createParticipantConnection();

      this.connectionToken =
        connectionResponse.ConnectionCredentials.ConnectionToken;

      // Create chat session object
      this.session = {
        connectionToken: this.connectionToken,
        participantId: startChatResponse.ParticipantId,
        participantToken: this.participantToken,
        websocketUrl: connectionResponse.Websocket.Url,
        startTime: new Date(),
      };

      // Establish WebSocket connection for real-time messaging
      await this.webSocketManager.connect(connectionResponse.Websocket.Url);

      this.notifyConnectionStatus('connected');

      return this.session;
    } catch (error) {
      this.notifyConnectionStatus('failed');

      // Handle initialization error with recovery
      await this.errorHandler.handleConnectionError(
        error instanceof Error
          ? error
          : new Error('Unknown initialization error'),
        'chat initialization'
      );

      throw new Error(
        `Failed to initialize chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send message to agent
   * Requirement 3.1: Send messages to agent through AWS Connect
   * Requirement 3.2: Use message queuing for offline scenarios
   * Requirement 2.4: Error handling for message delivery
   */
  async sendMessage(content: string): Promise<void> {
    if (!this.connectionToken) {
      const error = new Error('No active chat session');
      await this.errorHandler.handleError(error, 'AUTHENTICATION_FAILED');
      throw error;
    }

    const sendMessageFunction = async (messageContent: string) => {
      const command = new SendMessageCommand({
        ConnectionToken: this.connectionToken!,
        Content: messageContent,
        ContentType: 'text/plain',
      });

      await this.client.send(command);
    };

    // Try to send immediately if connected, otherwise queue
    if (this.webSocketManager.isConnected()) {
      try {
        await sendMessageFunction(content);
        this.notificationService.showMessageStatus(true);
      } catch (error) {
        // Handle message send error with recovery
        await this.errorHandler.handleMessageSendError(
          error instanceof Error ? error : new Error('Unknown send error'),
          content
        );

        // Queue the message for retry
        this.messageQueue.enqueue(content);
        this.notificationService.showMessageStatus(false);

        throw new Error(
          `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } else {
      // Queue message for later delivery
      this.messageQueue.enqueue(content);
      this.notificationService.showQueueStatus(this.messageQueue.size());
    }
  }

  /**
   * Receive messages from transcript
   * Requirement 3.2: Receive messages from agent
   */
  async receiveMessages(): Promise<Message[]> {
    if (!this.connectionToken) {
      throw new Error('No active chat session');
    }

    try {
      const command = new GetTranscriptCommand({
        ConnectionToken: this.connectionToken,
        MaxResults: 50,
      });

      const response = await this.client.send(command);

      return (response.Transcript || []).map(
        this.convertConnectMessageToMessage
      );
    } catch (error) {
      throw new Error(
        `Failed to receive messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * End chat session
   * Requirement 2.2: Properly terminate chat sessions
   * Requirement 4.3: Graceful disconnection handling
   */
  async endChat(): Promise<void> {
    try {
      if (this.connectionToken) {
        const command = new DisconnectParticipantCommand({
          ConnectionToken: this.connectionToken,
        });
        await this.client.send(command);
      }

      this.cleanup();
      this.notifyConnectionStatus('disconnected');
    } catch (error) {
      // Handle disconnection error but still cleanup
      await this.errorHandler.handleError(
        error instanceof Error
          ? error
          : new Error('Unknown disconnection error'),
        'CONNECTION_LOST'
      );

      // Still cleanup even if disconnect fails
      this.cleanup();
      throw new Error(
        `Failed to end chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Register callback for received messages
   */
  onMessageReceived(callback: (message: Message) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * Register callback for agent status changes
   */
  onAgentStatusChange(callback: (status: AgentStatusUpdate) => void): void {
    this.agentStatusCallbacks.push(callback);
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.connectionStatusCallbacks.push(callback);
  }

  /**
   * Send typing indicator to agent
   * Requirement 3.4: Implement typing indicators
   */
  async sendTypingEvent(): Promise<void> {
    if (!this.connectionToken) {
      return;
    }

    try {
      // Use WebSocket for real-time typing indicators
      this.webSocketManager.sendTypingIndicator();
    } catch (error) {
      // Fallback to API call if WebSocket fails
      try {
        const command = new SendEventCommand({
          ConnectionToken: this.connectionToken,
          Content: JSON.stringify({ ParticipantRole: 'CUSTOMER' }),
          ContentType: 'application/vnd.amazonaws.connect.event.typing',
        });

        await this.client.send(command);
      } catch (apiError) {
        // Typing events are not critical, so we don't throw
        console.warn('Failed to send typing event:', apiError);
      }
    }
  }

  /**
   * Refresh connection token when it expires
   * Requirement 7.4: Handle token refresh for long sessions
   * Requirement 4.3: Session timeout handling
   */
  async refreshConnectionToken(): Promise<void> {
    if (!this.participantToken) {
      await this.errorHandler.handleSessionTimeout();
      throw new Error('No participant token available for refresh');
    }

    try {
      const connectionResponse = await this.createParticipantConnection();
      this.connectionToken =
        connectionResponse.ConnectionCredentials.ConnectionToken;

      if (this.session) {
        this.session.connectionToken = this.connectionToken;
      }
    } catch (error) {
      // Handle token refresh error
      await this.errorHandler.handleError(
        error instanceof Error
          ? error
          : new Error('Unknown token refresh error'),
        'AUTHENTICATION_FAILED'
      );

      throw new Error(
        `Failed to refresh connection token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Private method to start chat contact (would typically be done by backend)
   */
  private async startChatContact(participantDetails: ParticipantDetails) {
    // This is a placeholder - in a real implementation, this would be handled by your backend
    // The backend would call AWS Connect's StartChatContact API and return the response
    throw new Error('StartChatContact must be implemented by backend service');
  }

  /**
   * Create participant connection with AWS Connect
   */
  private async createParticipantConnection() {
    if (!this.participantToken) {
      throw new Error('No participant token available');
    }

    const command = new CreateParticipantConnectionCommand({
      ParticipantToken: this.participantToken,
      Type: ['WEBSOCKET', 'CONNECTION_CREDENTIALS'],
    });

    const response = await this.client.send(command);

    if (!response.ConnectionCredentials || !response.Websocket) {
      throw new Error('Invalid connection response from AWS Connect');
    }

    return response;
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatusCallbacks.forEach(callback => callback(status));
  }

  /**
   * Handle user typing input
   * Requirement 3.4: Debounced typing indicator
   */
  handleUserTyping(): void {
    this.typingIndicatorService.handleUserTyping();
  }

  /**
   * Stop user typing
   */
  stopUserTyping(): void {
    this.typingIndicatorService.stopUserTyping();
  }

  /**
   * Get message queue statistics
   */
  getMessageQueueStats() {
    return this.messageQueue.getStats();
  }

  /**
   * Get error handler instance
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get notification service instance
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  /**
   * Convert AWS Connect message to internal Message format
   */
  private convertConnectMessageToMessage = (connectMessage: any): Message => {
    return {
      id: connectMessage.Id || `msg-${Date.now()}`,
      content: connectMessage.Content || '',
      sender: connectMessage.ParticipantRole === 'AGENT' ? 'agent' : 'visitor',
      timestamp: new Date(connectMessage.AbsoluteTime || Date.now()),
      status: 'delivered',
      type: 'text',
    };
  };

  /**
   * Handle session timeout manually
   */
  async handleSessionTimeout(): Promise<void> {
    await this.errorHandler.handleSessionTimeout();
  }

  /**
   * Handle agent disconnection
   */
  async handleAgentDisconnected(): Promise<void> {
    await this.errorHandler.handleAgentDisconnected();
  }

  /**
   * WebSocketMessageHandler implementation
   */
  onMessage(message: Message): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  onTyping(isTyping: boolean, participantId: string): void {
    if (isTyping) {
      this.typingIndicatorService.handleTypingIndicator(participantId);
    } else {
      this.typingIndicatorService.stopTyping(participantId);
    }
  }

  onWebSocketConnectionStatusChange(status: ConnectionStatus): void {
    this.notifyConnectionStatus(status);
  }

  /**
   * Set up service integrations
   */
  private setupServiceIntegrations(): void {
    // Set WebSocket message handler
    this.webSocketManager.setMessageHandler(this);

    // Set up typing indicator events
    this.typingIndicatorService.on('onTypingStart', participantId => {
      this.agentStatusCallbacks.forEach(callback => {
        callback({
          agentId: participantId,
          status: 'online',
          isTyping: true,
        });
      });
    });

    this.typingIndicatorService.on('onTypingStop', participantId => {
      this.agentStatusCallbacks.forEach(callback => {
        callback({
          agentId: participantId,
          status: 'online',
          isTyping: false,
        });
      });
    });

    this.typingIndicatorService.on('onSendTypingIndicator', () => {
      this.sendTypingEvent();
    });

    // Set up message queue processing
    this.messageQueue.startProcessing(async content => {
      if (!this.connectionToken) {
        throw new Error('No active session');
      }

      const command = new SendMessageCommand({
        ConnectionToken: this.connectionToken,
        Content: content,
        ContentType: 'text/plain',
      });

      await this.client.send(command);
    });

    // Set up error handler events
    this.errorHandler.on('onError', error => {
      this.notificationService.showError(error);
    });

    this.errorHandler.on('onConnectionStatusChange', status => {
      this.notificationService.showConnectionStatus(status);
      this.notifyConnectionStatus(status);
    });

    // Set up message queue events
    this.messageQueue.on('onMessageQueued', message => {
      this.notificationService.showQueueStatus(this.messageQueue.size());
    });

    this.messageQueue.on('onMessageFailed', (messageId, error) => {
      this.notificationService.showMessageStatus(false);
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.webSocketManager.cleanup();
    this.messageQueue.cleanup();
    this.typingIndicatorService.cleanup();
    this.errorHandler.cleanup();
    this.notificationService.cleanup();

    this.session = null;
    this.connectionToken = null;
    this.participantToken = null;
    this.messageCallbacks = [];
    this.agentStatusCallbacks = [];
    this.connectionStatusCallbacks = [];
  }
}
