import type React from 'react';
import type {
  WidgetConfig,
  WidgetState,
  WidgetError,
  ThemeConfiguration,
  PositionConfiguration,
  UIConfiguration,
} from './widget';
import type { ChatState, Message, AgentInfo } from './chat';

/**
 * UI component prop interfaces
 * Supports requirements 6.1, 6.2
 */

/**
 * Chat widget main component props
 */
export interface ChatWidgetProps {
  config: WidgetConfig;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: WidgetError) => void;
}

/**
 * Chat button component props (minimized state)
 */
export interface ChatButtonProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
  config: ThemeConfiguration;
  position: PositionConfiguration;
}

/**
 * Chat window component props (expanded state)
 */
export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  chatState: ChatState;
  config: UIConfiguration;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

/**
 * Message list component props
 */
export interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onScroll: (position: number) => void;
  agentInfo?: AgentInfo;
}

/**
 * Message input component props
 */
export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
  placeholder: string;
  maxLength?: number;
  onTyping?: (isTyping: boolean) => void;
}

/**
 * Message bubble component props
 */
export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp: boolean;
  agentInfo?: AgentInfo;
}

/**
 * Typing indicator component props
 */
export interface TypingIndicatorProps {
  isVisible: boolean;
  agentName?: string;
}

/**
 * Chat header component props
 */
export interface ChatHeaderProps {
  agentInfo?: AgentInfo;
  onClose: () => void;
  onMinimize: () => void;
  title: string;
}

/**
 * Configuration panel component props
 */
export interface ConfigurationPanelProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  theme: ThemeConfiguration;
  children: React.ReactNode;
}

/**
 * Responsive breakpoints
 */
export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * UI state interface
 */
export interface UIState {
  isMinimized: boolean;
  isVisible: boolean;
  activeView: UIView;
  theme: ThemeConfiguration;
}

/**
 * UI view enumeration
 */
export type UIView = 'chat' | 'config' | 'transcript' | 'rating';
