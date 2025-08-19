import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageQueue, type QueuedMessage } from './MessageQueue';

describe('MessageQueue', () => {
  let messageQueue: MessageQueue;
  let mockSendFunction: vi.Mock;

  beforeEach(() => {
    messageQueue = new MessageQueue(10); // Small queue for testing
    mockSendFunction = vi.fn();
  });

  afterEach(() => {
    messageQueue.cleanup();
    vi.clearAllTimers();
  });

  describe('basic queue operations', () => {
    it('should enqueue messages', () => {
      const messageId = messageQueue.enqueue('Hello');
      
      expect(messageId).toBeTruthy();
      expect(messageQueue.size()).toBe(1);
      expect(messageQueue.isEmpty()).toBe(false);
    });

    it('should dequeue messages by ID', () => {
      const messageId = messageQueue.enqueue('Hello');
      const message = messageQueue.dequeue(messageId);
      
      expect(message).toBeTruthy();
      expect(message?.content).toBe('Hello');
      expect(messageQueue.size()).toBe(0);
    });

    it('should return null for non-existent message ID', () => {
      const message = messageQueue.dequeue('non-existent');
      
      expect(message).toBeNull();
    });

    it('should clear all messages', () => {
      messageQueue.enqueue('Message 1');
      messageQueue.enqueue('Message 2');
      messageQueue.clear();
      
      expect(messageQueue.size()).toBe(0);
      expect(messageQueue.isEmpty()).toBe(true);
    });
  });

  describe('queue size management', () => {
    it('should respect maximum queue size', () => {
      // Fill queue beyond limit
      for (let i = 0; i < 15; i++) {
        messageQueue.enqueue(`Message ${i}`);
      }
      
      expect(messageQueue.size()).toBe(10);
    });

    it('should remove oldest messages when full', () => {
      const onMessageFailed = vi.fn();
      messageQueue.on('onMessageFailed', onMessageFailed);

      // Fill queue beyond limit
      for (let i = 0; i < 12; i++) {
        messageQueue.enqueue(`Message ${i}`);
      }
      
      expect(onMessageFailed).toHaveBeenCalledTimes(2);
    });
  });

  describe('message processing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should process messages successfully', async () => {
      const onMessageSent = vi.fn();
      messageQueue.on('onMessageSent', onMessageSent);
      
      mockSendFunction.mockResolvedValue(undefined);
      
      const messageId = messageQueue.enqueue('Hello');
      messageQueue.startProcessing(mockSendFunction);
      
      // Advance timer to trigger processing
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      expect(mockSendFunction).toHaveBeenCalledWith('Hello');
      expect(onMessageSent).toHaveBeenCalledWith(messageId);
      expect(messageQueue.size()).toBe(0);
    });

    it('should retry failed messages', async () => {
      mockSendFunction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      messageQueue.enqueue('Hello');
      messageQueue.startProcessing(mockSendFunction);
      
      // First attempt fails
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      // Second attempt succeeds
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      expect(mockSendFunction).toHaveBeenCalledTimes(2);
      expect(messageQueue.size()).toBe(0);
    });

    it('should remove messages after max retries', async () => {
      const onMessageFailed = vi.fn();
      messageQueue.on('onMessageFailed', onMessageFailed);
      
      mockSendFunction.mockRejectedValue(new Error('Network error'));
      
      const messageId = messageQueue.enqueue('Hello', 2); // Max 2 retries
      messageQueue.startProcessing(mockSendFunction);
      
      // Process through all retry attempts
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(2000);
        await vi.runAllTimersAsync();
      }
      
      expect(onMessageFailed).toHaveBeenCalledWith(messageId, expect.any(Error));
      expect(messageQueue.size()).toBe(0);
    });

    it('should stop processing when requested', () => {
      messageQueue.enqueue('Hello');
      messageQueue.startProcessing(mockSendFunction);
      messageQueue.stopProcessing();
      
      vi.advanceTimersByTime(2000);
      
      expect(mockSendFunction).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should trigger onQueueEmpty when queue becomes empty', () => {
      const onQueueEmpty = vi.fn();
      messageQueue.on('onQueueEmpty', onQueueEmpty);
      
      messageQueue.clear();
      
      expect(onQueueEmpty).toHaveBeenCalled();
    });

    it('should trigger onMessageQueued when message is added', () => {
      const onMessageQueued = vi.fn();
      messageQueue.on('onMessageQueued', onMessageQueued);
      
      messageQueue.enqueue('Hello');
      
      expect(onMessageQueued).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
          retryCount: 0,
        })
      );
    });

    it('should remove event handlers', () => {
      const onQueueEmpty = vi.fn();
      messageQueue.on('onQueueEmpty', onQueueEmpty);
      messageQueue.off('onQueueEmpty');
      
      messageQueue.clear();
      
      expect(onQueueEmpty).not.toHaveBeenCalled();
    });
  });

  describe('message categorization', () => {
    it('should categorize failed messages', () => {
      const messageId1 = messageQueue.enqueue('Message 1', 1);
      const messageId2 = messageQueue.enqueue('Message 2', 1);
      
      // Simulate failed messages
      const messages = messageQueue.getQueuedMessages();
      messages[0].retryCount = 2; // Exceeds maxRetries
      messages[1].retryCount = 0; // Still pending
      
      const failedMessages = messageQueue.getFailedMessages();
      const pendingMessages = messageQueue.getPendingMessages();
      
      expect(failedMessages).toHaveLength(1);
      expect(pendingMessages).toHaveLength(1);
    });

    it('should retry failed messages', () => {
      const messageId = messageQueue.enqueue('Hello', 1);
      const messages = messageQueue.getQueuedMessages();
      messages[0].retryCount = 2; // Mark as failed
      
      messageQueue.retryFailedMessages();
      
      expect(messages[0].retryCount).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should provide queue statistics', () => {
      const messageId1 = messageQueue.enqueue('Message 1', 1);
      const messageId2 = messageQueue.enqueue('Message 2', 1);
      
      // Simulate one failed message
      const messages = messageQueue.getQueuedMessages();
      messages[0].retryCount = 2;
      
      const stats = messageQueue.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.oldestMessage).toBeInstanceOf(Date);
    });

    it('should handle empty queue statistics', () => {
      const stats = messageQueue.getStats();
      
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.oldestMessage).toBeUndefined();
    });
  });
});