import type { ChatError, ChatErrorCode } from '../types/chat';
import type { ConnectionStatus } from '../types/aws-connect';

/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: ChatError) => boolean;
  recover: (error: ChatError) => Promise<void>;
  getRetryDelay: (attemptCount: number) => number;
  getMaxRetries: () => number;
}

/**
 * Error handler events
 */
export interface ErrorHandlerEvents {
  onError: (error: ChatError) => void;
  onRecoveryAttempt: (error: ChatError, attemptCount: number) => void;
  onRecoverySuccess: (error: ChatError) => void;
  onRecoveryFailed: (error: ChatError, finalAttempt: boolean) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
}

/**
 * Error context for tracking recovery attempts
 */
interface ErrorContext {
  error: ChatError;
  attemptCount: number;
  lastAttempt: Date;
  recoveryStrategy: ErrorRecoveryStrategy;
  timeout?: NodeJS.Timeout;
}

/**
 * Comprehensive error handler for AWS Connect chat widget
 * Supports requirements 2.4, 4.3: Connection error handling and recovery mechanisms
 */
export class ErrorHandler {
  private events: Partial<ErrorHandlerEvents> = {};
  private activeRecoveries = new Map<string, ErrorContext>();
  private errorHistory: ChatError[] = [];
  private maxErrorHistory = 50;
  private isOfflineMode = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    this.isOfflineMode = !navigator.onLine;
  }

  /**
   * Set event handlers
   */
  on<K extends keyof ErrorHandlerEvents>(
    event: K,
    handler: ErrorHandlerEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof ErrorHandlerEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Handle an error with appropriate recovery strategy
   */
  async handleError(
    error: Error | ChatError,
    errorCode?: ChatErrorCode,
    recoveryStrategy?: ErrorRecoveryStrategy
  ): Promise<void> {
    const chatError = this.normalizeToChatError(error, errorCode);

    // Add to error history
    this.addToErrorHistory(chatError);

    // Notify error event
    this.events.onError?.(chatError);

    // Determine recovery strategy
    const strategy =
      recoveryStrategy || this.getDefaultRecoveryStrategy(chatError);

    if (strategy.canRecover(chatError)) {
      await this.attemptRecovery(chatError, strategy);
    } else {
      // Non-recoverable error
      this.events.onRecoveryFailed?.(chatError, true);
    }
  }

  /**
   * Handle connection errors specifically
   */
  async handleConnectionError(error: Error, context?: string): Promise<void> {
    const chatError: ChatError = {
      code: 'CONNECTION_LOST',
      message: `Connection error${context ? ` (${context})` : ''}: ${error.message}`,
      timestamp: new Date(),
      recoverable: true,
    };

    await this.handleError(
      chatError,
      'CONNECTION_LOST',
      new ConnectionRecoveryStrategy()
    );
  }

  /**
   * Handle message send failures
   */
  async handleMessageSendError(
    error: Error,
    messageContent: string
  ): Promise<void> {
    const chatError: ChatError = {
      code: 'MESSAGE_SEND_FAILED',
      message: `Failed to send message: ${error.message}`,
      timestamp: new Date(),
      recoverable: true,
    };

    await this.handleError(
      chatError,
      'MESSAGE_SEND_FAILED',
      new MessageRetryStrategy(messageContent)
    );
  }

  /**
   * Handle session timeout
   */
  async handleSessionTimeout(): Promise<void> {
    const chatError: ChatError = {
      code: 'SESSION_TIMEOUT',
      message: 'Chat session has timed out',
      timestamp: new Date(),
      recoverable: false,
    };

    await this.handleError(chatError, 'SESSION_TIMEOUT');
  }

  /**
   * Handle agent disconnection
   */
  async handleAgentDisconnected(): Promise<void> {
    const chatError: ChatError = {
      code: 'AGENT_DISCONNECTED',
      message: 'Agent has disconnected from the chat',
      timestamp: new Date(),
      recoverable: true,
    };

    await this.handleError(
      chatError,
      'AGENT_DISCONNECTED',
      new AgentReconnectionStrategy()
    );
  }

  /**
   * Handle rate limiting
   */
  async handleRateLimit(retryAfter?: number): Promise<void> {
    const chatError: ChatError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      timestamp: new Date(),
      recoverable: true,
    };

    await this.handleError(
      chatError,
      'RATE_LIMIT_EXCEEDED',
      new RateLimitRecoveryStrategy(retryAfter)
    );
  }

  /**
   * Cancel recovery for specific error
   */
  cancelRecovery(errorId: string): void {
    const context = this.activeRecoveries.get(errorId);
    if (context?.timeout) {
      clearTimeout(context.timeout);
      this.activeRecoveries.delete(errorId);
    }
  }

  /**
   * Cancel all active recoveries
   */
  cancelAllRecoveries(): void {
    this.activeRecoveries.forEach((context, errorId) => {
      this.cancelRecovery(errorId);
    });
  }

  /**
   * Get error history
   */
  getErrorHistory(): ChatError[] {
    return [...this.errorHistory];
  }

  /**
   * Get active recovery attempts
   */
  getActiveRecoveries(): {
    errorId: string;
    error: ChatError;
    attemptCount: number;
  }[] {
    return Array.from(this.activeRecoveries.entries()).map(
      ([errorId, context]) => ({
        errorId,
        error: context.error,
        attemptCount: context.attemptCount,
      })
    );
  }

  /**
   * Check if in offline mode
   */
  isOffline(): boolean {
    return this.isOfflineMode;
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.cancelAllRecoveries();
    this.clearErrorHistory();
    this.events = {};

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Attempt recovery for an error
   */
  private async attemptRecovery(
    error: ChatError,
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    const errorId = this.generateErrorId(error);
    const existingContext = this.activeRecoveries.get(errorId);

    if (existingContext) {
      // Recovery already in progress
      return;
    }

    const context: ErrorContext = {
      error,
      attemptCount: 0,
      lastAttempt: new Date(),
      recoveryStrategy: strategy,
    };

    this.activeRecoveries.set(errorId, context);
    await this.executeRecovery(errorId, context);
  }

  /**
   * Execute recovery attempt
   */
  private async executeRecovery(
    errorId: string,
    context: ErrorContext
  ): Promise<void> {
    const { error, recoveryStrategy } = context;

    if (context.attemptCount >= recoveryStrategy.getMaxRetries()) {
      // Max retries exceeded
      this.activeRecoveries.delete(errorId);
      this.events.onRecoveryFailed?.(error, true);
      return;
    }

    context.attemptCount++;
    context.lastAttempt = new Date();

    this.events.onRecoveryAttempt?.(error, context.attemptCount);

    try {
      await recoveryStrategy.recover(error);

      // Recovery successful
      this.activeRecoveries.delete(errorId);
      this.events.onRecoverySuccess?.(error);
    } catch (recoveryError) {
      // Recovery failed, schedule retry
      const delay = recoveryStrategy.getRetryDelay(context.attemptCount);

      context.timeout = setTimeout(() => {
        this.executeRecovery(errorId, context);
      }, delay);

      this.events.onRecoveryFailed?.(error, false);
    }
  }

  /**
   * Normalize error to ChatError format
   */
  private normalizeToChatError(
    error: Error | ChatError,
    errorCode?: ChatErrorCode
  ): ChatError {
    if ('code' in error && 'recoverable' in error) {
      return error as ChatError;
    }

    return {
      code: errorCode || 'CONNECTION_LOST',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date(),
      recoverable: true,
    };
  }

  /**
   * Get default recovery strategy for error type
   */
  private getDefaultRecoveryStrategy(error: ChatError): ErrorRecoveryStrategy {
    switch (error.code) {
      case 'CONNECTION_LOST':
        return new ConnectionRecoveryStrategy();
      case 'MESSAGE_SEND_FAILED':
        return new MessageRetryStrategy();
      case 'AGENT_DISCONNECTED':
        return new AgentReconnectionStrategy();
      case 'RATE_LIMIT_EXCEEDED':
        return new RateLimitRecoveryStrategy();
      case 'SESSION_TIMEOUT':
      case 'AUTHENTICATION_FAILED':
      default:
        return new NoRecoveryStrategy();
    }
  }

  /**
   * Add error to history
   */
  private addToErrorHistory(error: ChatError): void {
    this.errorHistory.push(error);

    // Limit history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(error: ChatError): string {
    return `${error.code}_${error.timestamp.getTime()}`;
  }

  /**
   * Handle browser online event
   */
  private handleOnline(): void {
    this.isOfflineMode = false;
    this.events.onConnectionStatusChange?.('connected');
  }

  /**
   * Handle browser offline event
   */
  private handleOffline(): void {
    this.isOfflineMode = true;
    this.events.onConnectionStatusChange?.('disconnected');
  }
}

/**
 * Connection recovery strategy
 */
class ConnectionRecoveryStrategy implements ErrorRecoveryStrategy {
  canRecover(error: ChatError): boolean {
    return error.code === 'CONNECTION_LOST' && error.recoverable;
  }

  async recover(error: ChatError): Promise<void> {
    // This would be implemented to reconnect to AWS Connect
    // For now, we'll simulate a recovery attempt
    if (Math.random() > 0.3) {
      // 70% success rate
      return Promise.resolve();
    }
    throw new Error('Connection recovery failed');
  }

  getRetryDelay(attemptCount: number): number {
    return Math.min(1000 * Math.pow(2, attemptCount - 1), 30000); // Exponential backoff, max 30s
  }

  getMaxRetries(): number {
    return 5;
  }
}

/**
 * Message retry strategy
 */
class MessageRetryStrategy implements ErrorRecoveryStrategy {
  constructor(private messageContent?: string) {}

  canRecover(error: ChatError): boolean {
    return error.code === 'MESSAGE_SEND_FAILED' && error.recoverable;
  }

  async recover(error: ChatError): Promise<void> {
    // This would be implemented to retry sending the message
    if (Math.random() > 0.2) {
      // 80% success rate
      return Promise.resolve();
    }
    throw new Error('Message retry failed');
  }

  getRetryDelay(attemptCount: number): number {
    return Math.min(500 * attemptCount, 5000); // Linear backoff, max 5s
  }

  getMaxRetries(): number {
    return 3;
  }
}

/**
 * Agent reconnection strategy
 */
class AgentReconnectionStrategy implements ErrorRecoveryStrategy {
  canRecover(error: ChatError): boolean {
    return error.code === 'AGENT_DISCONNECTED' && error.recoverable;
  }

  async recover(error: ChatError): Promise<void> {
    // This would be implemented to reconnect to an agent
    if (Math.random() > 0.5) {
      // 50% success rate
      return Promise.resolve();
    }
    throw new Error('Agent reconnection failed');
  }

  getRetryDelay(attemptCount: number): number {
    return 10000; // Fixed 10s delay
  }

  getMaxRetries(): number {
    return 3;
  }
}

/**
 * Rate limit recovery strategy
 */
class RateLimitRecoveryStrategy implements ErrorRecoveryStrategy {
  constructor(private retryAfter?: number) {}

  canRecover(error: ChatError): boolean {
    return error.code === 'RATE_LIMIT_EXCEEDED' && error.recoverable;
  }

  async recover(error: ChatError): Promise<void> {
    // Rate limit recovery is just waiting
    return Promise.resolve();
  }

  getRetryDelay(attemptCount: number): number {
    return (this.retryAfter || 60) * 1000; // Use server-provided retry-after or default 60s
  }

  getMaxRetries(): number {
    return 2;
  }
}

/**
 * No recovery strategy for non-recoverable errors
 */
class NoRecoveryStrategy implements ErrorRecoveryStrategy {
  canRecover(error: ChatError): boolean {
    return false;
  }

  async recover(error: ChatError): Promise<void> {
    throw new Error('Error is not recoverable');
  }

  getRetryDelay(attemptCount: number): number {
    return 0;
  }

  getMaxRetries(): number {
    return 0;
  }
}
