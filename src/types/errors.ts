/**
 * Comprehensive error type definitions for different failure scenarios
 * Supports requirements 6.1, 6.2, 7.1, 7.2
 */

/**
 * Base error interface for all widget errors
 */
export interface BaseError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Widget initialization errors
 */
export interface WidgetInitializationError extends BaseError {
  code: WidgetInitializationErrorCode;
  configErrors?: ValidationError[];
}

export type WidgetInitializationErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'MISSING_CONTAINER'
  | 'CONTAINER_NOT_FOUND'
  | 'ALREADY_INITIALIZED'
  | 'BROWSER_NOT_SUPPORTED';

/**
 * AWS Connect service errors
 */
export interface AWSConnectError extends BaseError {
  code: AWSConnectErrorCode;
  awsErrorCode?: string;
  awsErrorType?: string;
  requestId?: string;
}

export type AWSConnectErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'AUTHORIZATION_DENIED'
  | 'INVALID_INSTANCE_ID'
  | 'INVALID_CONTACT_FLOW_ID'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_REQUEST'
  | 'RESOURCE_NOT_FOUND';

/**
 * Network and connection errors
 */
export interface NetworkError extends BaseError {
  code: NetworkErrorCode;
  statusCode?: number;
  responseBody?: string;
  retryable: boolean;
}

export type NetworkErrorCode =
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'DNS_RESOLUTION_FAILED'
  | 'SSL_HANDSHAKE_FAILED'
  | 'NETWORK_UNREACHABLE'
  | 'REQUEST_TIMEOUT'
  | 'RESPONSE_TIMEOUT'
  | 'WEBSOCKET_CONNECTION_FAILED'
  | 'WEBSOCKET_DISCONNECTED';

/**
 * Chat session errors
 */
export interface ChatSessionError extends BaseError {
  code: ChatSessionErrorCode;
  sessionId?: string;
  participantId?: string;
}

export type ChatSessionErrorCode =
  | 'SESSION_INITIALIZATION_FAILED'
  | 'SESSION_EXPIRED'
  | 'SESSION_TERMINATED'
  | 'PARTICIPANT_DISCONNECTED'
  | 'AGENT_UNAVAILABLE'
  | 'QUEUE_FULL'
  | 'MAXIMUM_PARTICIPANTS_REACHED'
  | 'INVALID_PARTICIPANT_TOKEN'
  | 'SESSION_TIMEOUT';

/**
 * Message handling errors
 */
export interface MessageError extends BaseError {
  code: MessageErrorCode;
  messageId?: string;
  messageContent?: string;
}

export type MessageErrorCode =
  | 'MESSAGE_SEND_FAILED'
  | 'MESSAGE_TOO_LONG'
  | 'MESSAGE_EMPTY'
  | 'INVALID_MESSAGE_FORMAT'
  | 'MESSAGE_DELIVERY_FAILED'
  | 'MESSAGE_RATE_LIMITED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'ATTACHMENT_TYPE_NOT_SUPPORTED'
  | 'ATTACHMENT_UPLOAD_FAILED';

/**
 * UI and rendering errors
 */
export interface UIError extends BaseError {
  code: UIErrorCode;
  componentName?: string;
  props?: Record<string, unknown>;
}

export type UIErrorCode =
  | 'COMPONENT_RENDER_FAILED'
  | 'THEME_LOAD_FAILED'
  | 'INVALID_THEME_CONFIG'
  | 'RESPONSIVE_LAYOUT_FAILED'
  | 'ANIMATION_FAILED'
  | 'EVENT_HANDLER_FAILED'
  | 'STATE_UPDATE_FAILED';

/**
 * Storage and persistence errors
 */
export interface StorageError extends BaseError {
  code: StorageErrorCode;
  storageType: StorageType;
  key?: string;
}

export type StorageErrorCode =
  | 'STORAGE_NOT_AVAILABLE'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_READ_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_DELETE_FAILED'
  | 'STORAGE_CORRUPTED';

export type StorageType =
  | 'localStorage'
  | 'sessionStorage'
  | 'indexedDB'
  | 'memory';

/**
 * Security and validation errors
 */
export interface SecurityError extends BaseError {
  code: SecurityErrorCode;
  violationType: SecurityViolationType;
}

export type SecurityErrorCode =
  | 'XSS_ATTEMPT_DETECTED'
  | 'INVALID_ORIGIN'
  | 'CSRF_TOKEN_INVALID'
  | 'CONTENT_SECURITY_POLICY_VIOLATION'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'MALICIOUS_CONTENT_DETECTED';

export type SecurityViolationType =
  | 'script_injection'
  | 'html_injection'
  | 'url_manipulation'
  | 'data_exfiltration'
  | 'privilege_escalation';

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryStrategy {
  type: RecoveryType;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => void;
  userNotification?: string;
}

export type RecoveryType =
  | 'retry'
  | 'fallback'
  | 'graceful_degradation'
  | 'user_intervention'
  | 'system_restart';

/**
 * Error context for debugging
 */
export interface ErrorContext {
  userAgent: string;
  url: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  widgetVersion: string;
  browserInfo: BrowserInfo;
  networkInfo?: NetworkInfo;
}

/**
 * Browser information for error context
 */
export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
}

/**
 * Network information for error context
 */
export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handleError(error: BaseError): void;
  reportError(error: BaseError, context: ErrorContext): void;
  getRecoveryStrategy(error: BaseError): ErrorRecoveryStrategy | null;
}

/**
 * Union type for all possible errors
 */
export type WidgetError =
  | WidgetInitializationError
  | AWSConnectError
  | NetworkError
  | ChatSessionError
  | MessageError
  | UIError
  | StorageError
  | SecurityError;
