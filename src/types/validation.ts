/**
 * Configuration validation interfaces and schemas
 * Supports requirements 6.1, 6.2, 7.1, 7.2
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
  value?: unknown;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  field: string;
  code: ValidationWarningCode;
  message: string;
  value?: unknown;
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_FORMAT'
  | 'INVALID_VALUE'
  | 'OUT_OF_RANGE'
  | 'INVALID_URL'
  | 'INVALID_COLOR'
  | 'INVALID_AWS_REGION'
  | 'INVALID_INSTANCE_ID'
  | 'INVALID_CONTACT_FLOW_ID';

/**
 * Validation warning codes
 */
export type ValidationWarningCode =
  | 'DEPRECATED_FIELD'
  | 'SUBOPTIMAL_VALUE'
  | 'MISSING_OPTIONAL_FIELD'
  | 'PERFORMANCE_IMPACT';

/**
 * Configuration schema interface
 */
export interface ConfigurationSchema {
  aws: AWSConfigSchema;
  ui: UIConfigSchema;
  features: FeatureConfigSchema;
}

/**
 * AWS configuration validation schema
 */
export interface AWSConfigSchema {
  region: FieldSchema;
  instanceId: FieldSchema;
  contactFlowId: FieldSchema;
  apiGatewayEndpoint: FieldSchema;
}

/**
 * UI configuration validation schema
 */
export interface UIConfigSchema {
  theme: ThemeConfigSchema;
  position: PositionConfigSchema;
  messages: MessageConfigSchema;
}

/**
 * Theme configuration validation schema
 */
export interface ThemeConfigSchema {
  primaryColor: FieldSchema;
  secondaryColor: FieldSchema;
  fontFamily: FieldSchema;
  borderRadius: FieldSchema;
}

/**
 * Position configuration validation schema
 */
export interface PositionConfigSchema {
  bottom: FieldSchema;
  right: FieldSchema;
  left: FieldSchema;
}

/**
 * Message configuration validation schema
 */
export interface MessageConfigSchema {
  welcomeMessage: FieldSchema;
  offlineMessage: FieldSchema;
  waitingMessage: FieldSchema;
  connectingMessage: FieldSchema;
}

/**
 * Feature configuration validation schema
 */
export interface FeatureConfigSchema {
  fileUpload: FieldSchema;
  emojiPicker: FieldSchema;
  chatRatings: FieldSchema;
  chatTranscript: FieldSchema;
  typing: FieldSchema;
}

/**
 * Field validation schema
 */
export interface FieldSchema {
  type: FieldType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: unknown[];
  customValidator?: (value: unknown) => ValidationResult;
}

/**
 * Field types for validation
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'url'
  | 'color'
  | 'css-unit'
  | 'aws-region'
  | 'aws-instance-id'
  | 'aws-contact-flow-id';

/**
 * Validator function type
 */
export type ValidatorFunction<T = unknown> = (value: T) => ValidationResult;

/**
 * Configuration validator interface
 */
export interface ConfigurationValidator {
  validate(config: unknown): ValidationResult;
  validateField(fieldPath: string, value: unknown): ValidationResult;
  getSchema(): ConfigurationSchema;
}
