import React from 'react';
import type { ChatButtonProps } from '../types/ui';
import { useTheme } from './ThemeProvider';
import { useStyles, mergeClassNames } from '../utils/styled';
import type { StyleDefinition } from '../utils/styled';
import '../styles/ChatButton.css';

/**
 * ChatButton component - Minimized state of the chat widget
 * Requirements: 1.1, 1.2, 1.4, 5.1, 5.2
 */
export const ChatButton: React.FC<ChatButtonProps> = ({
  isOpen,
  unreadCount,
  onClick,
  config,
  position,
}) => {
  const theme = useTheme();

  // Create styled button using theme system
  const buttonStyles: StyleDefinition = {
    base: {
      position: 'fixed',
      bottom: position.bottom,
      right: position.right,
      left: position.left,
      width: '60px',
      height: '60px',
      backgroundColor: theme.primaryColor,
      color: theme.textOnPrimary,
      border: 'none',
      borderRadius: theme.borderRadius,
      cursor: 'pointer',
      boxShadow: theme.shadowMedium,
      transition: `all ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}`,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.fontFamily,
      outline: 'none'
    },
    states: {
      hover: {
        backgroundColor: theme.primaryColorHover,
        transform: 'translateY(-2px)',
        boxShadow: theme.shadowLarge
      },
      focus: {
        boxShadow: `${theme.shadowMedium}, 0 0 0 2px ${theme.primaryColor}`
      },
      active: {
        backgroundColor: theme.primaryColorActive,
        transform: 'translateY(0)'
      }
    },
    responsive: {
      mobile: {
        width: '50px',
        height: '50px',
        bottom: theme.spacing.md,
        right: position.right ? theme.spacing.md : undefined,
        left: position.left ? theme.spacing.md : undefined
      }
    }
  };

  const styledButtonClass = useStyles(buttonStyles, theme);

  return (
    <button
      className={mergeClassNames(
        'chat-button',
        styledButtonClass,
        isOpen && 'chat-button--open'
      )}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
      type="button"
    >
      <div className="chat-button__content">
        {!isOpen && (
          <>
            <svg
              className="chat-button__icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
                fill="currentColor"
              />
            </svg>
            {unreadCount > 0 && (
              <div
                className="chat-button__badge"
                aria-label={`${unreadCount} unread messages`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </>
        )}
        {isOpen && (
          <svg
            className="chat-button__icon chat-button__icon--close"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
    </button>
  );
};
