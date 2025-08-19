/**
 * Configuration validation utilities
 * Implements validation functions for widget configuration
 * Supports requirements 6.1, 6.2, 7.1, 7.2
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConfigurationValidator,
  ConfigurationSchema,
  FieldSchema,
  FieldType,
  ValidatorFunction,
} from '../types/validation';

/**
 * AWS regions supported by Connect
 */
const AWS_CONNECT_REGIONS = [
  'us-east-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'eu-central-1',
  'eu-west-2',
  'ca-central-1',
];

/**
 * CSS color pattern (hex, rgb, rgba, hsl, hsla, named colors)
 */
const COLOR_PATTERN =
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\)|[a-zA-Z]+)$/;

/**
 * CSS unit pattern (px, em, rem, %, vh, vw, etc.)
 */
const CSS_UNIT_PATTERN =
  /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;

/**
 * AWS Instance ID pattern
 */
const AWS_INSTANCE_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * AWS Contact Flow ID pattern
 */
const AWS_CONTACT_FLOW_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * URL pattern for API Gateway endpoints
 */
const URL_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Email pattern
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Configuration schema definition
 */
export const configurationSchema: ConfigurationSchema = {
  aws: {
    region: {
      type: 'aws-region',
      required: true,
    },
    instanceId: {
      type: 'aws-instance-id',
      required: true,
    },
    contactFlowId: {
      type: 'aws-contact-flow-id',
      required: true,
    },
    apiGatewayEndpoint: {
      type: 'url',
      required: true,
    },
  },
  ui: {
    theme: {
      primaryColor: {
        type: 'color',
        required: true,
      },
      secondaryColor: {
        type: 'color',
        required: true,
      },
      fontFamily: {
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 100,
      },
      borderRadius: {
        type: 'css-unit',
        required: false,
      },
    },
    position: {
      bottom: {
        type: 'css-unit',
        required: true,
      },
      right: {
        type: 'css-unit',
        required: false,
      },
      left: {
        type: 'css-unit',
        required: false,
      },
    },
    messages: {
      welcomeMessage: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 500,
      },
      offlineMessage: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 500,
      },
      waitingMessage: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 500,
      },
      connectingMessage: {
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 500,
      },
    },
  },
  features: {
    fileUpload: {
      type: 'boolean',
      required: false,
    },
    emojiPicker: {
      type: 'boolean',
      required: false,
    },
    chatRatings: {
      type: 'boolean',
      required: false,
    },
    chatTranscript: {
      type: 'boolean',
      required: false,
    },
    typing: {
      type: 'boolean',
      required: false,
    },
  },
};

/**
 * Field type validators
 */
const fieldValidators: Record<FieldType, ValidatorFunction> = {
  string: validateString,
  number: validateNumber,
  boolean: validateBoolean,
  email: validateEmail,
  url: validateUrl,
  color: validateColor,
  'css-unit': validateCssUnit,
  'aws-region': validateAwsRegion,
  'aws-instance-id': validateAwsInstanceId,
  'aws-contact-flow-id': validateAwsContactFlowId,
};

/**
 * String validator
 */
function validateString(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Value must be a string',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Number validator
 */
function validateNumber(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Value must be a valid number',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Boolean validator
 */
function validateBoolean(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'boolean') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Value must be a boolean',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Email validator
 */
function validateEmail(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Email must be a string',
      value,
    });
  } else if (!EMAIL_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Invalid email format',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * URL validator
 */
function validateUrl(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'URL must be a string',
      value,
    });
  } else if (!URL_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_URL',
      message: 'Invalid URL format',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Color validator
 */
function validateColor(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Color must be a string',
      value,
    });
  } else if (!COLOR_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_COLOR',
      message:
        'Invalid color format. Use hex, rgb, rgba, hsl, hsla, or named colors',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * CSS unit validator
 */
function validateCssUnit(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'CSS unit must be a string',
      value,
    });
  } else if (!CSS_UNIT_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'Invalid CSS unit format. Use values like "10px", "1em", "100%"',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * AWS region validator
 */
function validateAwsRegion(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'AWS region must be a string',
      value,
    });
  } else if (!AWS_CONNECT_REGIONS.includes(value)) {
    errors.push({
      field: '',
      code: 'INVALID_AWS_REGION',
      message: `Invalid AWS region. Supported regions: ${AWS_CONNECT_REGIONS.join(', ')}`,
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * AWS instance ID validator
 */
function validateAwsInstanceId(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'AWS instance ID must be a string',
      value,
    });
  } else if (!AWS_INSTANCE_ID_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_INSTANCE_ID',
      message: 'Invalid AWS Connect instance ID format',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * AWS contact flow ID validator
 */
function validateAwsContactFlowId(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({
      field: '',
      code: 'INVALID_FORMAT',
      message: 'AWS contact flow ID must be a string',
      value,
    });
  } else if (!AWS_CONTACT_FLOW_ID_PATTERN.test(value)) {
    errors.push({
      field: '',
      code: 'INVALID_CONTACT_FLOW_ID',
      message: 'Invalid AWS Connect contact flow ID format',
      value,
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Validate a single field against its schema
 */
function validateField(
  fieldPath: string,
  value: unknown,
  schema: FieldSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check if required field is missing
  if (schema.required && (value === undefined || value === null)) {
    errors.push({
      field: fieldPath,
      code: 'REQUIRED_FIELD_MISSING',
      message: `Required field '${fieldPath}' is missing`,
      value,
    });
    return { isValid: false, errors, warnings };
  }

  // Skip validation if field is optional and not provided
  if (!schema.required && (value === undefined || value === null)) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // Validate field type
  const typeValidator = fieldValidators[schema.type];
  if (typeValidator) {
    const typeResult = typeValidator(value);
    errors.push(
      ...typeResult.errors.map(error => ({ ...error, field: fieldPath }))
    );
    warnings.push(
      ...typeResult.warnings.map(warning => ({ ...warning, field: fieldPath }))
    );
  }

  // Additional validations for strings
  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field: fieldPath,
        code: 'OUT_OF_RANGE',
        message: `Field '${fieldPath}' must be at least ${schema.minLength} characters long`,
        value,
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field: fieldPath,
        code: 'OUT_OF_RANGE',
        message: `Field '${fieldPath}' must be no more than ${schema.maxLength} characters long`,
        value,
      });
    }

    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push({
        field: fieldPath,
        code: 'INVALID_FORMAT',
        message: `Field '${fieldPath}' does not match required pattern`,
        value,
      });
    }
  }

  // Check allowed values
  if (schema.allowedValues && !schema.allowedValues.includes(value)) {
    errors.push({
      field: fieldPath,
      code: 'INVALID_VALUE',
      message: `Field '${fieldPath}' must be one of: ${schema.allowedValues.join(', ')}`,
      value,
    });
  }

  // Run custom validator if provided
  if (schema.customValidator) {
    const customResult = schema.customValidator(value);
    errors.push(
      ...customResult.errors.map(error => ({ ...error, field: fieldPath }))
    );
    warnings.push(
      ...customResult.warnings.map(warning => ({
        ...warning,
        field: fieldPath,
      }))
    );
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Configuration validator implementation
 */
export class WidgetConfigurationValidator implements ConfigurationValidator {
  private schema: ConfigurationSchema;

  constructor(schema: ConfigurationSchema = configurationSchema) {
    this.schema = schema;
  }

  /**
   * Validate entire configuration object
   */
  validate(config: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!config || typeof config !== 'object') {
      errors.push({
        field: 'root',
        code: 'INVALID_FORMAT',
        message: 'Configuration must be an object',
        value: config,
      });
      return { isValid: false, errors, warnings };
    }

    const configObj = config as Record<string, unknown>;

    // Validate AWS configuration
    if (this.schema.aws) {
      const awsConfig = (configObj.aws as Record<string, unknown>) || {};
      Object.entries(this.schema.aws).forEach(([key, fieldSchema]) => {
        const result = validateField(`aws.${key}`, awsConfig[key], fieldSchema);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      });
    }

    // Validate UI configuration
    if (this.schema.ui) {
      const uiConfig = (configObj.ui as Record<string, unknown>) || {};

      // Validate theme
      if (this.schema.ui.theme) {
        const themeConfig = (uiConfig.theme as Record<string, unknown>) || {};
        Object.entries(this.schema.ui.theme).forEach(([key, fieldSchema]) => {
          const result = validateField(
            `ui.theme.${key}`,
            themeConfig[key],
            fieldSchema
          );
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        });
      }

      // Validate position
      if (this.schema.ui.position) {
        const positionConfig =
          (uiConfig.position as Record<string, unknown>) || {};
        Object.entries(this.schema.ui.position).forEach(
          ([key, fieldSchema]) => {
            const result = validateField(
              `ui.position.${key}`,
              positionConfig[key],
              fieldSchema
            );
            errors.push(...result.errors);
            warnings.push(...result.warnings);
          }
        );

        // Custom validation: either right or left must be specified, but not both
        if (positionConfig.right && positionConfig.left) {
          warnings.push({
            field: 'ui.position',
            code: 'SUBOPTIMAL_VALUE',
            message:
              'Both right and left positions specified. Right position will take precedence.',
            value: positionConfig,
          });
        }
      }

      // Validate messages
      if (this.schema.ui.messages) {
        const messagesConfig =
          (uiConfig.messages as Record<string, unknown>) || {};
        Object.entries(this.schema.ui.messages).forEach(
          ([key, fieldSchema]) => {
            const result = validateField(
              `ui.messages.${key}`,
              messagesConfig[key],
              fieldSchema
            );
            errors.push(...result.errors);
            warnings.push(...result.warnings);
          }
        );
      }
    }

    // Validate features configuration
    if (this.schema.features) {
      const featuresConfig =
        (configObj.features as Record<string, unknown>) || {};
      Object.entries(this.schema.features).forEach(([key, fieldSchema]) => {
        const result = validateField(
          `features.${key}`,
          featuresConfig[key],
          fieldSchema
        );
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate a specific field by path
   */
  validateField(fieldPath: string, value: unknown): ValidationResult {
    const pathParts = fieldPath.split('.');
    let currentSchema: any = this.schema;

    // Navigate to the field schema
    for (const part of pathParts) {
      if (
        currentSchema &&
        typeof currentSchema === 'object' &&
        part in currentSchema
      ) {
        currentSchema = currentSchema[part];
      } else {
        return {
          isValid: false,
          errors: [
            {
              field: fieldPath,
              code: 'INVALID_VALUE',
              message: `Unknown field path: ${fieldPath}`,
              value,
            },
          ],
          warnings: [],
        };
      }
    }

    if (
      !currentSchema ||
      typeof currentSchema !== 'object' ||
      !('type' in currentSchema)
    ) {
      return {
        isValid: false,
        errors: [
          {
            field: fieldPath,
            code: 'INVALID_VALUE',
            message: `Invalid field schema for path: ${fieldPath}`,
            value,
          },
        ],
        warnings: [],
      };
    }

    return validateField(fieldPath, value, currentSchema as FieldSchema);
  }

  /**
   * Get the configuration schema
   */
  getSchema(): ConfigurationSchema {
    return this.schema;
  }
}

/**
 * Default validator instance
 */
export const defaultValidator = new WidgetConfigurationValidator();

/**
 * Convenience function to validate configuration
 */
export function validateConfiguration(config: unknown): ValidationResult {
  return defaultValidator.validate(config);
}

/**
 * Convenience function to validate a single field
 */
export function validateConfigurationField(
  fieldPath: string,
  value: unknown
): ValidationResult {
  return defaultValidator.validateField(fieldPath, value);
}

/**
 * Validate widget position configuration
 * Ensures either right or left is specified, but not both
 */
export function validateWidgetPosition(position: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!position || typeof position !== 'object') {
    errors.push({
      field: 'ui.position',
      code: 'INVALID_FORMAT',
      message: 'Position configuration must be an object',
      value: position,
    });
    return { isValid: false, errors, warnings };
  }

  const positionObj = position as Record<string, unknown>;

  // Validate bottom is required
  if (!positionObj.bottom) {
    errors.push({
      field: 'ui.position.bottom',
      code: 'REQUIRED_FIELD_MISSING',
      message: 'Bottom position is required',
      value: positionObj.bottom,
    });
  }

  // Check that either right or left is specified
  const hasRight =
    positionObj.right !== undefined && positionObj.right !== null;
  const hasLeft = positionObj.left !== undefined && positionObj.left !== null;

  if (!hasRight && !hasLeft) {
    errors.push({
      field: 'ui.position',
      code: 'REQUIRED_FIELD_MISSING',
      message: 'Either right or left position must be specified',
      value: position,
    });
  }

  if (hasRight && hasLeft) {
    warnings.push({
      field: 'ui.position',
      code: 'SUBOPTIMAL_VALUE',
      message:
        'Both right and left positions specified. Right position will take precedence.',
      value: position,
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate theme configuration for consistency
 * Ensures colors have good contrast and are web-safe
 */
export function validateThemeConfiguration(theme: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!theme || typeof theme !== 'object') {
    errors.push({
      field: 'ui.theme',
      code: 'INVALID_FORMAT',
      message: 'Theme configuration must be an object',
      value: theme,
    });
    return { isValid: false, errors, warnings };
  }

  const themeObj = theme as Record<string, unknown>;

  // Check for potential contrast issues
  if (themeObj.primaryColor === themeObj.secondaryColor) {
    warnings.push({
      field: 'ui.theme',
      code: 'SUBOPTIMAL_VALUE',
      message:
        'Primary and secondary colors are the same. This may cause visibility issues.',
      value: theme,
    });
  }

  // Validate font family if provided
  if (themeObj.fontFamily && typeof themeObj.fontFamily === 'string') {
    const fontFamily = themeObj.fontFamily as string;
    if (fontFamily.length > 100) {
      warnings.push({
        field: 'ui.theme.fontFamily',
        code: 'SUBOPTIMAL_VALUE',
        message:
          'Font family string is very long. Consider using shorter font names.',
        value: fontFamily,
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate AWS Connect configuration completeness
 * Ensures all required AWS Connect fields are present and valid
 */
export function validateAWSConnectConfiguration(
  awsConfig: unknown
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!awsConfig || typeof awsConfig !== 'object') {
    errors.push({
      field: 'aws',
      code: 'INVALID_FORMAT',
      message: 'AWS configuration must be an object',
      value: awsConfig,
    });
    return { isValid: false, errors, warnings };
  }

  const config = awsConfig as Record<string, unknown>;

  // Validate required fields are present
  const requiredFields = [
    'region',
    'instanceId',
    'contactFlowId',
    'apiGatewayEndpoint',
  ];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push({
        field: `aws.${field}`,
        code: 'REQUIRED_FIELD_MISSING',
        message: `Required AWS Connect field '${field}' is missing`,
        value: config[field],
      });
    }
  }

  // Validate region and instance ID combination
  if (config.region && config.instanceId) {
    const region = config.region as string;
    const instanceId = config.instanceId as string;

    // Check if region is supported for Connect
    if (!AWS_CONNECT_REGIONS.includes(region)) {
      errors.push({
        field: 'aws.region',
        code: 'INVALID_AWS_REGION',
        message: `AWS region '${region}' is not supported for Connect`,
        value: region,
      });
    }

    // Validate instance ID format
    if (!AWS_INSTANCE_ID_PATTERN.test(instanceId)) {
      errors.push({
        field: 'aws.instanceId',
        code: 'INVALID_INSTANCE_ID',
        message: 'Invalid AWS Connect instance ID format',
        value: instanceId,
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate message configuration for length and content
 * Ensures messages are appropriate length and don't contain harmful content
 */
export function validateMessageConfiguration(
  messages: unknown
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!messages || typeof messages !== 'object') {
    errors.push({
      field: 'ui.messages',
      code: 'INVALID_FORMAT',
      message: 'Messages configuration must be an object',
      value: messages,
    });
    return { isValid: false, errors, warnings };
  }

  const messagesObj = messages as Record<string, unknown>;

  // Required message fields
  const requiredMessages = [
    'welcomeMessage',
    'offlineMessage',
    'waitingMessage',
  ];

  for (const messageKey of requiredMessages) {
    const message = messagesObj[messageKey];

    if (!message || typeof message !== 'string') {
      errors.push({
        field: `ui.messages.${messageKey}`,
        code: 'REQUIRED_FIELD_MISSING',
        message: `Required message '${messageKey}' is missing or not a string`,
        value: message,
      });
      continue;
    }

    const messageStr = message as string;

    // Check message length
    if (messageStr.length === 0) {
      errors.push({
        field: `ui.messages.${messageKey}`,
        code: 'INVALID_VALUE',
        message: `Message '${messageKey}' cannot be empty`,
        value: message,
      });
    } else if (messageStr.length > 500) {
      errors.push({
        field: `ui.messages.${messageKey}`,
        code: 'OUT_OF_RANGE',
        message: `Message '${messageKey}' is too long (max 500 characters)`,
        value: message,
      });
    }

    // Check for potentially problematic content
    if (messageStr.includes('<script') || messageStr.includes('javascript:')) {
      errors.push({
        field: `ui.messages.${messageKey}`,
        code: 'INVALID_VALUE',
        message: `Message '${messageKey}' contains potentially unsafe content`,
        value: message,
      });
    }

    // Warn about very short messages
    if (messageStr.length < 10) {
      warnings.push({
        field: `ui.messages.${messageKey}`,
        code: 'SUBOPTIMAL_VALUE',
        message: `Message '${messageKey}' is very short. Consider providing more helpful information.`,
        value: message,
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate feature configuration
 * Ensures feature flags are boolean and warns about performance implications
 */
export function validateFeatureConfiguration(
  features: unknown
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!features || typeof features !== 'object') {
    // Features are optional, so this is just a warning
    warnings.push({
      field: 'features',
      code: 'MISSING_OPTIONAL_FIELD',
      message:
        'Features configuration is missing. Default values will be used.',
      value: features,
    });
    return { isValid: true, errors, warnings };
  }

  const featuresObj = features as Record<string, unknown>;

  // Validate each feature flag
  const featureKeys = [
    'fileUpload',
    'emojiPicker',
    'chatRatings',
    'chatTranscript',
    'typing',
  ];

  for (const featureKey of featureKeys) {
    const featureValue = featuresObj[featureKey];

    if (featureValue !== undefined && typeof featureValue !== 'boolean') {
      errors.push({
        field: `features.${featureKey}`,
        code: 'INVALID_FORMAT',
        message: `Feature '${featureKey}' must be a boolean value`,
        value: featureValue,
      });
    }
  }

  // Warn about performance implications
  if (featuresObj.fileUpload === true) {
    warnings.push({
      field: 'features.fileUpload',
      code: 'PERFORMANCE_IMPACT',
      message:
        'File upload feature may impact performance and requires additional security considerations.',
      value: featuresObj.fileUpload,
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}
