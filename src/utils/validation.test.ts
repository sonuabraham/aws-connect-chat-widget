/**
 * Tests for configuration validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateConfiguration,
  validateConfigurationField,
  WidgetConfigurationValidator,
  configurationSchema,
  validateWidgetPosition,
  validateThemeConfiguration,
  validateAWSConnectConfiguration,
  validateMessageConfiguration,
  validateFeatureConfiguration,
} from './validation';

describe('Configuration Validation', () => {
  describe('validateConfiguration', () => {
    it('should validate a complete valid configuration', () => {
      const validConfig = {
        aws: {
          region: 'us-east-1',
          instanceId: '12345678-1234-1234-1234-123456789012',
          contactFlowId: '87654321-4321-4321-4321-210987654321',
          apiGatewayEndpoint: 'https://api.example.com/connect',
        },
        ui: {
          theme: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '8px',
          },
          position: {
            bottom: '20px',
            right: '20px',
          },
          messages: {
            welcomeMessage: 'Welcome to our chat!',
            offlineMessage: 'We are currently offline.',
            waitingMessage: 'Please wait while we connect you...',
          },
        },
        features: {
          fileUpload: true,
          emojiPicker: false,
          chatRatings: true,
          chatTranscript: true,
          typing: true,
        },
      };

      const result = validateConfiguration(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required fields', () => {
      const invalidConfig = {
        aws: {
          region: 'us-east-1',
          // Missing instanceId and contactFlowId
        },
      };

      const result = validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(error => error.field === 'aws.instanceId')
      ).toBe(true);
      expect(
        result.errors.some(error => error.field === 'aws.contactFlowId')
      ).toBe(true);
    });

    it('should reject invalid AWS region', () => {
      const invalidConfig = {
        aws: {
          region: 'invalid-region',
          instanceId: '12345678-1234-1234-1234-123456789012',
          contactFlowId: '87654321-4321-4321-4321-210987654321',
          apiGatewayEndpoint: 'https://api.example.com/connect',
        },
      };

      const result = validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          error =>
            error.field === 'aws.region' && error.code === 'INVALID_AWS_REGION'
        )
      ).toBe(true);
    });

    it('should reject invalid color format', () => {
      const invalidConfig = {
        aws: {
          region: 'us-east-1',
          instanceId: '12345678-1234-1234-1234-123456789012',
          contactFlowId: '87654321-4321-4321-4321-210987654321',
          apiGatewayEndpoint: 'https://api.example.com/connect',
        },
        ui: {
          theme: {
            primaryColor: 'invalid-color',
            secondaryColor: '#6c757d',
          },
        },
      };

      const result = validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          error =>
            error.field === 'ui.theme.primaryColor' &&
            error.code === 'INVALID_COLOR'
        )
      ).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const invalidConfig = {
        aws: {
          region: 'us-east-1',
          instanceId: '12345678-1234-1234-1234-123456789012',
          contactFlowId: '87654321-4321-4321-4321-210987654321',
          apiGatewayEndpoint: 'not-a-valid-url',
        },
      };

      const result = validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          error =>
            error.field === 'aws.apiGatewayEndpoint' &&
            error.code === 'INVALID_URL'
        )
      ).toBe(true);
    });
  });

  describe('validateConfigurationField', () => {
    it('should validate individual fields correctly', () => {
      const result = validateConfigurationField('aws.region', 'us-east-1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid individual field values', () => {
      const result = validateConfigurationField('aws.region', 'invalid-region');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle unknown field paths', () => {
      const result = validateConfigurationField('unknown.field.path', 'value');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'INVALID_VALUE')).toBe(
        true
      );
    });
  });

  describe('WidgetConfigurationValidator', () => {
    it('should create validator with custom schema', () => {
      const customSchema = { ...configurationSchema };
      const validator = new WidgetConfigurationValidator(customSchema);
      expect(validator.getSchema()).toEqual(customSchema);
    });

    it('should validate using custom validator instance', () => {
      const validator = new WidgetConfigurationValidator();
      const validConfig = {
        aws: {
          region: 'us-east-1',
          instanceId: '12345678-1234-1234-1234-123456789012',
          contactFlowId: '87654321-4321-4321-4321-210987654321',
          apiGatewayEndpoint: 'https://api.example.com/connect',
        },
      };

      const result = validator.validate(validConfig);
      expect(result.isValid).toBe(false); // Should be false due to missing required UI fields
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Color validation', () => {
    it('should accept valid hex colors', () => {
      const result = validateConfigurationField(
        'ui.theme.primaryColor',
        '#ff0000'
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept valid rgb colors', () => {
      const result = validateConfigurationField(
        'ui.theme.primaryColor',
        'rgb(255, 0, 0)'
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept valid named colors', () => {
      const result = validateConfigurationField('ui.theme.primaryColor', 'red');
      expect(result.isValid).toBe(true);
    });
  });

  describe('CSS unit validation', () => {
    it('should accept valid pixel values', () => {
      const result = validateConfigurationField('ui.position.bottom', '20px');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid percentage values', () => {
      const result = validateConfigurationField('ui.position.bottom', '10%');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid CSS units', () => {
      const result = validateConfigurationField('ui.position.bottom', '20');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('Advanced Validation Functions', () => {
  describe('validateWidgetPosition', () => {
    it('should accept valid position with right', () => {
      const position = {
        bottom: '20px',
        right: '20px',
      };
      const result = validateWidgetPosition(position);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid position with left', () => {
      const position = {
        bottom: '20px',
        left: '20px',
      };
      const result = validateWidgetPosition(position);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when both right and left are specified', () => {
      const position = {
        bottom: '20px',
        right: '20px',
        left: '30px',
      };
      const result = validateWidgetPosition(position);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('SUBOPTIMAL_VALUE');
    });

    it('should reject position without bottom', () => {
      const position = {
        right: '20px',
      };
      const result = validateWidgetPosition(position);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.field === 'ui.position.bottom')
      ).toBe(true);
    });

    it('should reject position without right or left', () => {
      const position = {
        bottom: '20px',
      };
      const result = validateWidgetPosition(position);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error =>
          error.message.includes('Either right or left')
        )
      ).toBe(true);
    });

    it('should reject non-object position', () => {
      const result = validateWidgetPosition('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateThemeConfiguration', () => {
    it('should accept valid theme configuration', () => {
      const theme = {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
      };
      const result = validateThemeConfiguration(theme);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when primary and secondary colors are the same', () => {
      const theme = {
        primaryColor: '#007bff',
        secondaryColor: '#007bff',
      };
      const result = validateThemeConfiguration(theme);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('same');
    });

    it('should warn about very long font family', () => {
      const theme = {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'A'.repeat(150),
      };
      const result = validateThemeConfiguration(theme);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('ui.theme.fontFamily');
    });

    it('should reject non-object theme', () => {
      const result = validateThemeConfiguration('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateAWSConnectConfiguration', () => {
    it('should accept valid AWS Connect configuration', () => {
      const awsConfig = {
        region: 'us-east-1',
        instanceId: '12345678-1234-1234-1234-123456789012',
        contactFlowId: '87654321-4321-4321-4321-210987654321',
        apiGatewayEndpoint: 'https://api.example.com/connect',
      };
      const result = validateAWSConnectConfiguration(awsConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required fields', () => {
      const awsConfig = {
        region: 'us-east-1',
        // Missing other required fields
      };
      const result = validateAWSConnectConfiguration(awsConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(error => error.field === 'aws.instanceId')
      ).toBe(true);
    });

    it('should reject invalid AWS region', () => {
      const awsConfig = {
        region: 'invalid-region',
        instanceId: '12345678-1234-1234-1234-123456789012',
        contactFlowId: '87654321-4321-4321-4321-210987654321',
        apiGatewayEndpoint: 'https://api.example.com/connect',
      };
      const result = validateAWSConnectConfiguration(awsConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.code === 'INVALID_AWS_REGION')
      ).toBe(true);
    });

    it('should reject invalid instance ID format', () => {
      const awsConfig = {
        region: 'us-east-1',
        instanceId: 'invalid-instance-id',
        contactFlowId: '87654321-4321-4321-4321-210987654321',
        apiGatewayEndpoint: 'https://api.example.com/connect',
      };
      const result = validateAWSConnectConfiguration(awsConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.code === 'INVALID_INSTANCE_ID')
      ).toBe(true);
    });

    it('should reject non-object configuration', () => {
      const result = validateAWSConnectConfiguration('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateMessageConfiguration', () => {
    it('should accept valid message configuration', () => {
      const messages = {
        welcomeMessage: 'Welcome to our chat!',
        offlineMessage: 'We are currently offline.',
        waitingMessage: 'Please wait while we connect you...',
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required messages', () => {
      const messages = {
        welcomeMessage: 'Welcome!',
        // Missing other required messages
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          error => error.field === 'ui.messages.offlineMessage'
        )
      ).toBe(true);
    });

    it('should reject empty messages', () => {
      const messages = {
        welcomeMessage: '',
        offlineMessage: 'We are offline.',
        waitingMessage: 'Please wait...',
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(
          error => error.field === 'ui.messages.welcomeMessage'
        )
      ).toBe(true);
    });

    it('should reject messages that are too long', () => {
      const messages = {
        welcomeMessage: 'A'.repeat(600),
        offlineMessage: 'We are offline.',
        waitingMessage: 'Please wait...',
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'OUT_OF_RANGE')).toBe(
        true
      );
    });

    it('should reject messages with potentially unsafe content', () => {
      const messages = {
        welcomeMessage: 'Welcome! <script>alert("xss")</script>',
        offlineMessage: 'We are offline.',
        waitingMessage: 'Please wait...',
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.message.includes('unsafe content'))
      ).toBe(true);
    });

    it('should warn about very short messages', () => {
      const messages = {
        welcomeMessage: 'Hi!',
        offlineMessage: 'We are currently offline.',
        waitingMessage: 'Please wait while we connect you...',
      };
      const result = validateMessageConfiguration(messages);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('SUBOPTIMAL_VALUE');
    });

    it('should reject non-object configuration', () => {
      const result = validateMessageConfiguration('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateFeatureConfiguration', () => {
    it('should accept valid feature configuration', () => {
      const features = {
        fileUpload: true,
        emojiPicker: false,
        chatRatings: true,
        chatTranscript: true,
        typing: true,
      };
      const result = validateFeatureConfiguration(features);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept missing features configuration', () => {
      const result = validateFeatureConfiguration(undefined);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('MISSING_OPTIONAL_FIELD');
    });

    it('should reject non-boolean feature values', () => {
      const features = {
        fileUpload: 'true', // Should be boolean
        emojiPicker: false,
      };
      const result = validateFeatureConfiguration(features);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.field === 'features.fileUpload')
      ).toBe(true);
    });

    it('should warn about performance implications of file upload', () => {
      const features = {
        fileUpload: true,
        emojiPicker: false,
      };
      const result = validateFeatureConfiguration(features);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('PERFORMANCE_IMPACT');
    });
  });
});
