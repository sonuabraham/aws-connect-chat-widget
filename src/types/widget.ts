/**
 * Main widget configuration interface
 * Supports requirements 6.1, 6.2, 7.1, 7.2
 */
export interface WidgetConfig {
  aws: AWSConnectConfig;
  ui: UIConfiguration;
  features: FeatureConfiguration;
}

/**
 * AWS Connect specific configuration
 */
export interface AWSConnectConfig {
  region: string;
  instanceId: string;
  contactFlowId: string;
  apiGatewayEndpoint?: string;
}

/**
 * UI customization configuration
 */
export interface UIConfiguration {
  theme: ThemeConfiguration;
  position: PositionConfiguration;
  messages: MessageConfiguration;
}

/**
 * Theme customization options
 */
export interface ThemeConfiguration {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

/**
 * Widget positioning configuration
 */
export interface PositionConfiguration {
  bottom: string;
  right?: string;
  left?: string;
}

/**
 * Customizable message text configuration
 */
export interface MessageConfiguration {
  welcomeMessage: string;
  offlineMessage: string;
  waitingMessage: string;
  connectingMessage: string;
}

/**
 * Feature toggle configuration
 */
export interface FeatureConfiguration {
  fileUpload: boolean;
  emojiPicker: boolean;
  chatRatings: boolean;
  chatTranscript: boolean;
  typing: boolean;
}

/**
 * Widget state enumeration
 */
export type WidgetState =
  | 'closed'
  | 'initializing'
  | 'waiting'
  | 'connected'
  | 'ended';

/**
 * Widget initialization options
 */
export interface WidgetInitOptions {
  config: WidgetConfig;
  containerId?: string;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: WidgetError) => void;
}

/**
 * Widget error types
 */
export interface WidgetError {
  code: WidgetErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type WidgetErrorCode =
  | 'CONFIG_INVALID'
  | 'AWS_CONNECTION_FAILED'
  | 'INITIALIZATION_FAILED'
  | 'NETWORK_ERROR';
