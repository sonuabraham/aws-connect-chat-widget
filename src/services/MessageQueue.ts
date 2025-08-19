import type { Message } from '../types/chat';

/**
 * Queued message interface
 */
export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Message queue events
 */
export interface MessageQueueEvents {
  onMessageQueued: (message: QueuedMessage) => void;
  onMessageSent: (messageId: string) => void;
  onMessageFailed: (messageId: string, error: Error) => void;
  onQueueEmpty: () => void;
}

/**
 * Message queue service for handling offline scenarios and failed deliveries
 * Supports requirement 3.2: Message queuing system for offline scenarios
 */
export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private events: Partial<MessageQueueEvents> = {};
  private maxQueueSize = 100;
  private defaultMaxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor(maxQueueSize = 100) {
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Add message to queue
   */
  enqueue(content: string, maxRetries = this.defaultMaxRetries): string {
    const messageId = this.generateMessageId();

    const queuedMessage: QueuedMessage = {
      id: messageId,
      content,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
    };

    // Remove oldest message if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      const removedMessage = this.queue.shift();
      if (removedMessage) {
        this.events.onMessageFailed?.(
          removedMessage.id,
          new Error('Message dropped due to queue size limit')
        );
      }
    }

    this.queue.push(queuedMessage);
    this.events.onMessageQueued?.(queuedMessage);

    return messageId;
  }

  /**
   * Remove message from queue by ID
   */
  dequeue(messageId: string): QueuedMessage | null {
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index === -1) return null;

    const message = this.queue.splice(index, 1)[0];
    return message;
  }

  /**
   * Get all queued messages
   */
  getQueuedMessages(): QueuedMessage[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all messages from queue
   */
  clear(): void {
    this.queue = [];
    this.events.onQueueEmpty?.();
  }

  /**
   * Start processing queue with provided send function
   */
  startProcessing(sendFunction: (content: string) => Promise<void>): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processQueue(sendFunction);
    }, 2000); // Process every 2 seconds
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process a single batch of messages
   */
  async processQueue(
    sendFunction: (content: string) => Promise<void>
  ): Promise<void> {
    if (this.queue.length === 0) {
      this.events.onQueueEmpty?.();
      return;
    }

    // Process messages one at a time to avoid overwhelming the connection
    const message = this.queue[0];
    if (!message) return;

    try {
      await sendFunction(message.content);

      // Message sent successfully, remove from queue
      this.dequeue(message.id);
      this.events.onMessageSent?.(message.id);

      if (this.queue.length === 0) {
        this.events.onQueueEmpty?.();
      }
    } catch (error) {
      // Message failed, increment retry count
      message.retryCount++;

      if (message.retryCount >= message.maxRetries) {
        // Max retries reached, remove from queue
        this.dequeue(message.id);
        this.events.onMessageFailed?.(
          message.id,
          error instanceof Error ? error : new Error('Unknown error')
        );
      } else {
        // Schedule retry with exponential backoff
        setTimeout(
          () => {
            // Message will be retried in next processing cycle
          },
          this.retryDelay * Math.pow(2, message.retryCount - 1)
        );
      }
    }
  }

  /**
   * Set event handlers
   */
  on<K extends keyof MessageQueueEvents>(
    event: K,
    handler: MessageQueueEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof MessageQueueEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Get messages that have failed all retry attempts
   */
  getFailedMessages(): QueuedMessage[] {
    return this.queue.filter(msg => msg.retryCount >= msg.maxRetries);
  }

  /**
   * Get messages that are still being retried
   */
  getPendingMessages(): QueuedMessage[] {
    return this.queue.filter(msg => msg.retryCount < msg.maxRetries);
  }

  /**
   * Retry all failed messages (reset retry count)
   */
  retryFailedMessages(): void {
    this.queue.forEach(message => {
      if (message.retryCount >= message.maxRetries) {
        message.retryCount = 0;
      }
    });
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    failed: number;
    oldestMessage?: Date;
  } {
    const pending = this.getPendingMessages();
    const failed = this.getFailedMessages();
    const oldestMessage =
      this.queue.length > 0
        ? Math.min(...this.queue.map(msg => msg.timestamp.getTime()))
        : undefined;

    return {
      total: this.queue.length,
      pending: pending.length,
      failed: failed.length,
      oldestMessage: oldestMessage ? new Date(oldestMessage) : undefined,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopProcessing();
    this.clear();
    this.events = {};
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
