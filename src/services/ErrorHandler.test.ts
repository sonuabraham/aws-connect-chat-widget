import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from './ErrorHandler';
import type { ChatError } from '../types/chat';

// Mock window events
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    errorHandler = new ErrorHandler();
  });

  afterEach(() => {
    errorHandler.cleanup();
    vi.useRealTimers();
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);

      const error = new Error('Connection failed');
      await errorHandler.handleConnectionError(error, 'test context');

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CONNECTION_LOST',
          message: expect.stringContaining('Connection error (test context)'),
          recoverable: true,
        })
      );
    });

    it('should handle message send errors', async () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);

      const error = new Error('Send failed');
      await errorHandler.handleMessageSendError(error, 'Hello');

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MESSAGE_SEND_FAILED',
          message: expect.stringContaining('Failed to send message'),
          recoverable: true,
        })
      );
    });

    it('should handle session timeout', async () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);

      await errorHandler.handleSessionTimeout();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SESSION_TIMEOUT',
          message: 'Chat session has timed out',
          recoverable: false,
        })
      );
    });

    it('should handle agent disconnection', async () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);

      await errorHandler.handleAgentDisconnected();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'AGENT_DISCONNECTED',
          message: 'Agent has disconnected from the chat',
          recoverable: true,
        })
      );
    });

    it('should handle rate limiting', async () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);

      await errorHandler.handleRateLimit(30);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('retry after 30s'),
          recoverable: true,
        })
      );
    });
  });

  describe('error recovery', () => {
    it('should attempt recovery for recoverable errors', async () => {
      const onRecoveryAttempt = vi.fn();
      errorHandler.on('onRecoveryAttempt', onRecoveryAttempt);

      const error = new Error('Connection failed');
      await errorHandler.handleConnectionError(error);

      // Advance timers to trigger recovery
      vi.advanceTimersByTime(1000);

      expect(onRecoveryAttempt).toHaveBeenCalled();
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      const onRecoveryAttempt = vi.fn();
      const onRecoveryFailed = vi.fn();
      errorHandler.on('onRecoveryAttempt', onRecoveryAttempt);
      errorHandler.on('onRecoveryFailed', onRecoveryFailed);

      await errorHandler.handleSessionTimeout();

      vi.advanceTimersByTime(5000);

      expect(onRecoveryAttempt).not.toHaveBeenCalled();
      expect(onRecoveryFailed).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SESSION_TIMEOUT' }),
        true
      );
    });

    it('should cancel recovery attempts', async () => {
      const error = new Error('Connection failed');
      await errorHandler.handleConnectionError(error);

      const activeRecoveries = errorHandler.getActiveRecoveries();
      expect(activeRecoveries).toHaveLength(1);

      errorHandler.cancelAllRecoveries();

      const remainingRecoveries = errorHandler.getActiveRecoveries();
      expect(remainingRecoveries).toHaveLength(0);
    });
  });

  describe('error history', () => {
    it('should track error history', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      await errorHandler.handleConnectionError(error1);
      await errorHandler.handleMessageSendError(error2, 'test');

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].code).toBe('CONNECTION_LOST');
      expect(history[1].code).toBe('MESSAGE_SEND_FAILED');
    });

    it('should clear error history', async () => {
      const error = new Error('Test error');
      await errorHandler.handleConnectionError(error);

      expect(errorHandler.getErrorHistory()).toHaveLength(1);

      errorHandler.clearErrorHistory();

      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('offline handling', () => {
    it('should detect offline mode', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      const offlineHandler = new ErrorHandler();

      expect(offlineHandler.isOffline()).toBe(true);

      offlineHandler.cleanup();
    });

    it('should handle online/offline events', () => {
      const onConnectionStatusChange = vi.fn();
      errorHandler.on('onConnectionStatusChange', onConnectionStatusChange);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      expect(onConnectionStatusChange).toHaveBeenCalledWith('disconnected');

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      expect(onConnectionStatusChange).toHaveBeenCalledWith('connected');
    });
  });

  describe('event management', () => {
    it('should register and remove event handlers', () => {
      const onError = vi.fn();
      errorHandler.on('onError', onError);
      errorHandler.off('onError');

      const error = new Error('Test error');
      errorHandler.handleConnectionError(error);

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', async () => {
      const error = new Error('Test error');
      await errorHandler.handleConnectionError(error);

      expect(errorHandler.getErrorHistory()).toHaveLength(1);
      expect(errorHandler.getActiveRecoveries()).toHaveLength(1);

      errorHandler.cleanup();

      expect(errorHandler.getErrorHistory()).toHaveLength(0);
      expect(errorHandler.getActiveRecoveries()).toHaveLength(0);
    });
  });
});