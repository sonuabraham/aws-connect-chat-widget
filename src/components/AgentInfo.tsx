import React from 'react';
import type { AgentInfo as AgentInfoType } from '../types/chat';
import '../styles/AgentInfo.css';

/**
 * Agent information display component props
 */
export interface AgentInfoProps {
  agent?: AgentInfoType;
  isConnected: boolean;
  showTypingIndicator?: boolean;
  onAgentDisconnected?: () => void;
  compact?: boolean;
}

/**
 * AgentInfo component - Enhanced agent information display
 * Requirements: 4.1, 4.2, 4.3
 */
export const AgentInfo: React.FC<AgentInfoProps> = ({
  agent,
  isConnected,
  showTypingIndicator = false,
  onAgentDisconnected,
  compact = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#28a745';
      case 'away':
        return '#ffc107';
      case 'busy':
        return '#dc3545';
      case 'offline':
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  // Handle agent disconnection notification
  React.useEffect(() => {
    if (agent && agent.status === 'offline' && isConnected && onAgentDisconnected) {
      onAgentDisconnected();
    }
  }, [agent?.status, isConnected, onAgentDisconnected]);

  if (!agent && !isConnected) {
    return (
      <div className={`agent-info ${compact ? 'agent-info--compact' : ''}`}>
        <div className="agent-info__placeholder">
          <div className="agent-info__avatar agent-info__avatar--placeholder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z"
                fill="currentColor"
                opacity="0.5"
              />
              <path
                d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18H3Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>
          <div className="agent-info__details">
            <div className="agent-info__name">Customer Support</div>
            <div className="agent-info__status">
              <span className="agent-info__status-text">Connecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className={`agent-info ${compact ? 'agent-info--compact' : ''}`}>
      <div className="agent-info__content">
        <div className="agent-info__avatar-container">
          {agent.profileImage ? (
            <img
              src={agent.profileImage}
              alt={`${agent.name} profile`}
              className="agent-info__avatar"
              onError={(e) => {
                // Fallback to default avatar on image load error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="agent-info__avatar agent-info__avatar--fallback"
            style={{ display: agent.profileImage ? 'none' : 'flex' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z"
                fill="currentColor"
              />
              <path
                d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18H3Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div
            className="agent-info__status-indicator"
            style={{ backgroundColor: getStatusColor(agent.status) }}
            aria-label={`Agent status: ${getStatusText(agent.status)}`}
          />
        </div>

        <div className="agent-info__details">
          <div className="agent-info__name" title={agent.name}>
            {agent.name}
          </div>
          <div className="agent-info__status">
            {showTypingIndicator && agent.isTyping ? (
              <div className="agent-info__typing" role="status" aria-live="polite">
                <div className="agent-info__typing-dots">
                  <span className="agent-info__typing-dot" />
                  <span className="agent-info__typing-dot" />
                  <span className="agent-info__typing-dot" />
                </div>
                <span className="agent-info__typing-text">typing...</span>
              </div>
            ) : (
              <span className="agent-info__status-text">
                {getStatusText(agent.status)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};