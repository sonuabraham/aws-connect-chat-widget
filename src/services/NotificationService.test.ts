import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './NotificationService';
import type { ChatError } from '../types/chat';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    notificationService = new NotificationService();
  });

  afterEach(() => {
    notificationService.cleanup();
    vi.useRealTimers();
  });

  describe('notification management', () => {
    it('should add notifications', () => {
      const onNotificationAdded = vi.fn();
      notificationService.on('onNotificationAdded', onNotificationAdded);

      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(id).toBeTruthy();
      expect(onNotificationAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id,
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      );
    });

    it('should remove notifications', () => {
      const onNotificationRemoved = vi.fn();
      notificationService.on('onNotificationRemoved', onNotificationRemoved);

      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      const removed = notificationService.removeNotification(id);

      expect(removed).toBe(true);
      expect(onNotificationRemoved).toHaveBeenCalledWith(id);
    });

    it('should auto-dismiss notifications with duration', () => {
      const onNotificationRemoved = vi.fn();
      notificationService.on('onNotificationRemoved', onNotificationRemoved);

      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 1000,
      });

      vi.advanceTimersByTime(1000);

      expect(onNotificationRemoved).toHaveBeenCalledWith(id);
    });

    it('should clear all notifications', () => {
      const onNotificationCleared = vi.fn();
      notificationService.on('onNotificationCleared', onNotificationCleared);

      notificationService.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationService.addNotification({
        type: 'error',
        title: 'Test 2',
        message: 'Message 2',
      });

      notificationService.clearAll();

      expect(onNotificationCleared).toHaveBeenCalled();
      expect(notificationService.getNotifications()).toHaveLength(0);
    });
  });

  describe('error notifications', () => {
    it('should show error notifications', () => {
      const error: ChatError = {
        code: 'CONNECTION_LOST',
        message: 'Connection failed',
        timestamp: new Date(),
        recoverable: true,
      };

      const id = notificationService.showError(error);

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'error',
        title: 'Connection Issue',
        message: expect.stringContaining('Connection to chat service was lost'),
      });
    });

    it('should provide different messages for different error types', () => {
      const errors: ChatError[] = [
        {
          code: 'MESSAGE_SEND_FAILED',
          message: 'Send failed',
          timestamp: new Date(),
          recoverable: true,
        },
        {
          code: 'SESSION_TIMEOUT',
          message: 'Timeout',
          timestamp: new Date(),
          recoverable: false,
        },
      ];

      const id1 = notificationService.showError(errors[0]);
      const id2 = notificationService.showError(errors[1]);

      const notification1 = notificationService.getNotification(id1);
      const notification2 = notificationService.getNotification(id2);

      expect(notification1?.message).toContain("message couldn't be sent");
      expect(notification2?.message).toContain('chat session has expired');
    });
  });

  describe('connection status notifications', () => {
    it('should show connection status notifications', () => {
      const id = notificationService.showConnectionStatus('connecting');

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'info',
        title: 'Connecting',
        message: 'Connecting to chat service...',
      });
    });

    it('should replace existing status notifications', () => {
      notificationService.showConnectionStatus('connecting');
      notificationService.showConnectionStatus('connected');

      const notifications = notificationService.getNotifications();
      const statusNotifications = notifications.filter(
        n => n.title.includes('Connect') || n.title.includes('Disconnect')
      );

      expect(statusNotifications).toHaveLength(1);
      expect(statusNotifications[0].title).toBe('Connected');
    });

    it('should provide actions for failed connections', () => {
      const id = notificationService.showConnectionStatus('failed');

      const notification = notificationService.getNotification(id);
      expect(notification?.actions).toBeDefined();
      expect(notification?.actions?.[0].label).toBe('Retry');
    });
  });

  describe('agent status notifications', () => {
    it('should show agent connected notification', () => {
      const id = notificationService.showAgentStatus(true, 'John Doe');

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'success',
        title: 'Agent Connected',
        message: 'John Doe has joined the chat',
      });
    });

    it('should show agent disconnected notification', () => {
      const id = notificationService.showAgentStatus(false);

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'warning',
        title: 'Agent Disconnected',
        message: expect.stringContaining('agent has left the chat'),
      });
    });
  });

  describe('message status notifications', () => {
    it('should show message failure notification', () => {
      const id = notificationService.showMessageStatus(false, 2);

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'error',
        title: 'Message Not Sent',
        message: 'Message failed to send after 2 attempts',
      });
    });

    it('should not show notification for successful messages', () => {
      const id = notificationService.showMessageStatus(true);

      expect(id).toBeNull();
    });
  });

  describe('queue status notifications', () => {
    it('should show queue status for non-empty queue', () => {
      const id = notificationService.showQueueStatus(3);

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'info',
        title: 'Messages Queued',
        message: '3 messages waiting to be sent',
      });
    });

    it('should not show notification for empty queue', () => {
      const id = notificationService.showQueueStatus(0);

      expect(id).toBeNull();
    });
  });

  describe('offline mode notifications', () => {
    it('should show offline mode notification', () => {
      const id = notificationService.showOfflineMode();

      const notification = notificationService.getNotification(id);
      expect(notification).toMatchObject({
        type: 'warning',
        title: 'Offline Mode',
        message: expect.stringContaining('currently offline'),
      });
    });
  });

  describe('notification filtering', () => {
    it('should get notifications by type', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Info',
        message: 'Info message',
      });

      notificationService.addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error message',
      });

      const infoNotifications =
        notificationService.getNotificationsByType('info');
      const errorNotifications =
        notificationService.getNotificationsByType('error');

      expect(infoNotifications).toHaveLength(1);
      expect(errorNotifications).toHaveLength(1);
    });

    it('should check if has notifications of type', () => {
      notificationService.addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error message',
      });

      expect(notificationService.hasNotificationsOfType('error')).toBe(true);
      expect(notificationService.hasNotificationsOfType('info')).toBe(false);
    });

    it('should remove notifications by type', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Info',
        message: 'Info message',
      });

      notificationService.addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error message',
      });

      notificationService.removeNotificationsByType('info');

      expect(notificationService.getNotificationsByType('info')).toHaveLength(
        0
      );
      expect(notificationService.getNotificationsByType('error')).toHaveLength(
        1
      );
    });
  });

  describe('event management', () => {
    it('should register and remove event handlers', () => {
      const onNotificationAdded = vi.fn();
      notificationService.on('onNotificationAdded', onNotificationAdded);
      notificationService.off('onNotificationAdded');

      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(onNotificationAdded).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(notificationService.getNotifications()).toHaveLength(1);

      notificationService.cleanup();

      expect(notificationService.getNotifications()).toHaveLength(0);
    });
  });
});
