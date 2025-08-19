import React, { useState, useEffect } from 'react';
import '../styles/AgentDisconnectionNotification.css';

/**
 * Agent disconnection notification component props
 */
export interface AgentDisconnectionNotificationProps {
  isVisible: boolean;
  agentName?: string;
  onReconnect?: () => void;
  onDismiss?: () => void;
  autoHideDelay?: number;
}

/**
 * AgentDisconnectionNotification component - Handles agent disconnection notifications
 * Requirements: 4.3
 */
export const AgentDisconnectionNotification: React.FC<
  AgentDisconnectionNotificationProps
> = ({
  isVisible,
  agentName,
  onReconnect,
  onDismiss,
  autoHideDelay = 10000, // 10 seconds default
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Auto-hide notification after delay
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDelay]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onDismiss?.();
    }, 300); // Match animation duration
  };

  const handleReconnect = () => {
    handleDismiss();
    onReconnect?.();
  };

  if (!isVisible && !isAnimatingOut) {
    return null;
  }

  return (
    <div
      className={`agent-disconnection-notification ${
        isAnimatingOut ? 'agent-disconnection-notification--hiding' : ''
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="agent-disconnection-notification__content">
        <div className="agent-disconnection-notification__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10 6V10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10 14H10.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="agent-disconnection-notification__message">
          <div className="agent-disconnection-notification__title">
            Agent Disconnected
          </div>
          <div className="agent-disconnection-notification__description">
            {agentName
              ? `${agentName} has disconnected`
              : 'The agent has disconnected'}
            . You can try reconnecting or continue the conversation later.
          </div>
        </div>

        <div className="agent-disconnection-notification__actions">
          {onReconnect && (
            <button
              className="agent-disconnection-notification__button agent-disconnection-notification__button--primary"
              onClick={handleReconnect}
              type="button"
            >
              Reconnect
            </button>
          )}
          <button
            className="agent-disconnection-notification__button agent-disconnection-notification__button--secondary"
            onClick={handleDismiss}
            type="button"
            aria-label="Dismiss notification"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
