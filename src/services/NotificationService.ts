import type { ChatError, ChatErrorCode } from '../types/chat';
import type { ConnectionStatus } from '../types/aws-connect';

/**
 * Notification types
 */
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after duration (ms), 0 = persistent
  actions?: NotificationAction[];
}

/**
 * Notification action interface
 */
export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

/**
 * Notification events
 */
export interface NotificationEvents {
  onNotificationAdded: (notification: Notification) => void;
  onNotificationRemoved: (notificationId: string) => void;
  onNotificationCleared: () => void;
}

/**
 * User-friendly notification service for chat errors and status updates
 * Supports requirement 2.4: User-friendly error messages
 */
export class NotificationService {
  private notifications = new Map<string, Notification>();
  private events: Partial<NotificationEvents> = {};
  private notificationCounter = 0;

  /**
   * Set event handlers
   */
  on<K extends keyof NotificationEvents>(event: K, handler: NotificationEvents[K]): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof NotificationEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Show error notification from ChatError
   */
  showError(error: ChatError, actions?: NotificationAction[]): string {
    const userFriendlyMessage = this.getUserFriendlyErrorMessage(error);
    
    return this.addNotification({
      type: 'error',
      title: 'Connection Issue',
      message: userFriendlyMessage,
      duration: error.recoverable ? 5000 : 0, // Auto-dismiss recoverable errors
      actions: actions || this.getDefaultErrorActions(error),
    });
  }

  /**
   * Show connection status notification
   */
  showConnectionStatus(status: ConnectionStatus): string | null {
    // Remove existing connection status notifications
    this.removeNotificationsByType('info');
    this.removeNotificationsByType('warning');

    switch (status) {
      case 'connecting':
        return this.addNotification({
          type: 'info',
          title: 'Connecting',
          message: 'Connecting to chat service...',
          duration: 0,
        });

      case 'connected':
        return this.addNotification({
          type: 'success',
          title: 'Connected',
          message: 'Successfully connected to chat service',
          duration: 3000,
        });

      case 'reconnecting':
        return this.addNotification({
          type: 'warning',
          title: 'Reconnecting',
          message: 'Connection lost. Attempting to reconnect...',
          duration: 0,
        });

      case 'disconnected':
        return this.addNotification({
          type: 'warning',
          title: 'Disconnected',
          message: 'You have been disconnected from the chat service',
          duration: 0,
          actions: [{
            label: 'Reconnect',
            action: () => this.handleReconnectAction(),
            style: 'primary',
          }],
        });

      case 'failed':
        return this.addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Unable to connect to chat service. Please try again later.',
          duration: 0,
          actions: [{
            label: 'Retry',
            action: () => this.handleRetryAction(),
            style: 'primary',
          }],
        });

      default:
        return null;
    }
  }

  /**
   * Show agent status notification
   */
  showAgentStatus(isConnected: boolean, agentName?: string): string {
    if (isConnected) {
      return this.addNotification({
        type: 'success',
        title: 'Agent Connected',
        message: agentName ? `${agentName} has joined the chat` : 'An agent has joined the chat',
        duration: 3000,
      });
    } else {
      return this.addNotification({
        type: 'warning',
        title: 'Agent Disconnected',
        message: 'The agent has left the chat. You may need to wait for another agent.',
        duration: 5000,
      });
    }
  }

  /**
   * Show message delivery status
   */
  showMessageStatus(success: boolean, retryCount?: number): string | null {
    if (!success) {
      const message = retryCount && retryCount > 1 
        ? `Message failed to send after ${retryCount} attempts`
        : 'Message failed to send';

      return this.addNotification({
        type: 'error',
        title: 'Message Not Sent',
        message,
        duration: 5000,
        actions: [{
          label: 'Retry',
          action: () => this.handleRetryMessageAction(),
          style: 'primary',
        }],
      });
    }
    return null;
  }

  /**
   * Show offline mode notification
   */
  showOfflineMode(): string {
    return this.addNotification({
      type: 'warning',
      title: 'Offline Mode',
      message: 'You are currently offline. Messages will be sent when connection is restored.',
      duration: 0,
    });
  }

  /**
   * Show queue status notification
   */
  showQueueStatus(queueSize: number): string | null {
    if (queueSize > 0) {
      return this.addNotification({
        type: 'info',
        title: 'Messages Queued',
        message: `${queueSize} message${queueSize > 1 ? 's' : ''} waiting to be sent`,
        duration: 3000,
      });
    }
    return null;
  }

  /**
   * Add custom notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = this.generateNotificationId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    this.notifications.set(id, fullNotification);
    this.events.onNotificationAdded?.(fullNotification);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): boolean {
    if (this.notifications.has(id)) {
      this.notifications.delete(id);
      this.events.onNotificationRemoved?.(id);
      return true;
    }
    return false;
  }

  /**
   * Remove notifications by type
   */
  removeNotificationsByType(type: NotificationType): void {
    const toRemove: string[] = [];
    
    this.notifications.forEach((notification, id) => {
      if (notification.type === type) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => this.removeNotification(id));
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.events.onNotificationCleared?.();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: NotificationType): Notification[] {
    return this.getNotifications().filter(n => n.type === type);
  }

  /**
   * Check if has notifications of type
   */
  hasNotificationsOfType(type: NotificationType): boolean {
    return this.getNotificationsByType(type).length > 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearAll();
    this.events = {};
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyErrorMessage(error: ChatError): string {
    switch (error.code) {
      case 'CONNECTION_LOST':
        return 'Connection to chat service was lost. We\'re trying to reconnect automatically.';
      
      case 'MESSAGE_SEND_FAILED':
        return 'Your message couldn\'t be sent. We\'ll try again automatically.';
      
      case 'AGENT_DISCONNECTED':
        return 'The agent has disconnected. We\'re looking for another available agent.';
      
      case 'SESSION_TIMEOUT':
        return 'Your chat session has expired due to inactivity. Please start a new chat.';
      
      case 'AUTHENTICATION_FAILED':
        return 'There was an authentication issue. Please refresh the page and try again.';
      
      case 'RATE_LIMIT_EXCEEDED':
        return 'You\'re sending messages too quickly. Please wait a moment before trying again.';
      
      default:
        return 'An unexpected error occurred. We\'re working to resolve it.';
    }
  }

  /**
   * Get default actions for error types
   */
  private getDefaultErrorActions(error: ChatError): NotificationAction[] {
    const actions: NotificationAction[] = [];

    if (error.recoverable) {
      switch (error.code) {
        case 'CONNECTION_LOST':
          actions.push({
            label: 'Retry Connection',
            action: () => this.handleReconnectAction(),
            style: 'primary',
          });
          break;
        
        case 'MESSAGE_SEND_FAILED':
          actions.push({
            label: 'Retry Message',
            action: () => this.handleRetryMessageAction(),
            style: 'primary',
          });
          break;
        
        case 'AGENT_DISCONNECTED':
          actions.push({
            label: 'Find Agent',
            action: () => this.handleFindAgentAction(),
            style: 'primary',
          });
          break;
      }
    } else {
      // Non-recoverable errors
      actions.push({
        label: 'Start New Chat',
        action: () => this.handleStartNewChatAction(),
        style: 'primary',
      });
    }

    // Always provide dismiss action
    actions.push({
      label: 'Dismiss',
      action: () => {}, // Will be handled by notification removal
      style: 'secondary',
    });

    return actions;
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notification_${++this.notificationCounter}_${Date.now()}`;
  }

  /**
   * Handle reconnect action
   */
  private handleReconnectAction(): void {
    // This would be implemented to trigger reconnection
    console.log('Reconnect action triggered');
  }

  /**
   * Handle retry action
   */
  private handleRetryAction(): void {
    // This would be implemented to retry the last action
    console.log('Retry action triggered');
  }

  /**
   * Handle retry message action
   */
  private handleRetryMessageAction(): void {
    // This would be implemented to retry sending the last message
    console.log('Retry message action triggered');
  }

  /**
   * Handle find agent action
   */
  private handleFindAgentAction(): void {
    // This would be implemented to find a new agent
    console.log('Find agent action triggered');
  }

  /**
   * Handle start new chat action
   */
  private handleStartNewChatAction(): void {
    // This would be implemented to start a new chat session
    console.log('Start new chat action triggered');
  }
}