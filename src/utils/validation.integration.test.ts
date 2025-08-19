/**
 * Integration tests for configuration validation
 * Tests complete configuration validation workflows
 */

import { describe, it, expect } from 'vitest';
import {
  validateConfiguration,
  validateWidgetPosition,
  validateThemeConfiguration,
  validateAWSConnectConfiguration,
  validateMessageConfiguration,
  validateFeatureConfiguration,
} from './validation';

describe('Configuration Validation Integration', () => {
  it('should validate a complete widget configuration', () => {
    const completeConfig = {
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
          welcomeMessage: 'Welcome to our chat support!',
          offlineMessage: 'We are currently offline. Please leave a message.',
          waitingMessage: 'Please wait while we connect you to an agent...',
          connectingMessage: 'Connecting to support...',
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

    const result = validateConfiguration(completeConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Test individual validators for warnings
    const featuresResult = validateFeatureConfiguration(
      completeConfig.features
    );
    expect(
      featuresResult.warnings.some(w => w.code === 'PERFORMANCE_IMPACT')
    ).toBe(true);
  });

  it('should validate individual configuration sections', () => {
    const config = {
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
        },
        position: {
          bottom: '20px',
          right: '20px',
        },
        messages: {
          welcomeMessage: 'Welcome to our chat support!',
          offlineMessage: 'We are currently offline.',
          waitingMessage: 'Please wait while we connect you...',
        },
      },
      features: {
        fileUpload: false,
        chatRatings: true,
      },
    };

    // Test individual section validators
    const awsResult = validateAWSConnectConfiguration(config.aws);
    expect(awsResult.isValid).toBe(true);

    const themeResult = validateThemeConfiguration(config.ui.theme);
    expect(themeResult.isValid).toBe(true);

    const positionResult = validateWidgetPosition(config.ui.position);
    expect(positionResult.isValid).toBe(true);

    const messagesResult = validateMessageConfiguration(config.ui.messages);
    expect(messagesResult.isValid).toBe(true);

    const featuresResult = validateFeatureConfiguration(config.features);
    expect(featuresResult.isValid).toBe(true);
  });

  it('should handle configuration with multiple validation issues', () => {
    const problematicConfig = {
      aws: {
        region: 'invalid-region',
        instanceId: 'invalid-id',
        // Missing contactFlowId and apiGatewayEndpoint
      },
      ui: {
        theme: {
          primaryColor: 'invalid-color',
          secondaryColor: 'invalid-color',
        },
        position: {
          // Missing bottom, right, and left
        },
        messages: {
          welcomeMessage: '', // Empty message
          offlineMessage: 'A'.repeat(600), // Too long
          // Missing waitingMessage
        },
      },
      features: {
        fileUpload: 'yes', // Should be boolean
        chatRatings: 1, // Should be boolean
      },
    };

    const result = validateConfiguration(problematicConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);

    // Should have errors for various validation issues
    expect(result.errors.some(e => e.code === 'INVALID_AWS_REGION')).toBe(true);
    expect(result.errors.some(e => e.code === 'INVALID_INSTANCE_ID')).toBe(
      true
    );
    expect(result.errors.some(e => e.code === 'REQUIRED_FIELD_MISSING')).toBe(
      true
    );
    expect(result.errors.some(e => e.code === 'INVALID_COLOR')).toBe(true);
    expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
  });

  it('should provide helpful error messages for common configuration mistakes', () => {
    const configWithCommonMistakes = {
      aws: {
        region: 'us-east-1',
        instanceId: '12345678-1234-1234-1234-123456789012',
        contactFlowId: '87654321-4321-4321-4321-210987654321',
        apiGatewayEndpoint: 'http://insecure-endpoint.com', // HTTP instead of HTTPS
      },
      ui: {
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#007bff', // Same as primary
        },
        position: {
          bottom: '20px',
          right: '20px',
          left: '30px', // Both right and left specified
        },
        messages: {
          welcomeMessage: 'Hi!', // Very short
          offlineMessage: 'We are currently offline.',
          waitingMessage: 'Please wait while we connect you...',
        },
      },
    };

    const result = validateConfiguration(configWithCommonMistakes);
    expect(result.isValid).toBe(true); // Should still be valid

    // Test individual validators for specific warnings
    const themeResult = validateThemeConfiguration(
      configWithCommonMistakes.ui.theme
    );
    expect(themeResult.warnings.some(w => w.message.includes('same'))).toBe(
      true
    );

    const positionResult = validateWidgetPosition(
      configWithCommonMistakes.ui.position
    );
    expect(
      positionResult.warnings.some(w => w.message.includes('precedence'))
    ).toBe(true);

    const messagesResult = validateMessageConfiguration(
      configWithCommonMistakes.ui.messages
    );
    expect(
      messagesResult.warnings.some(w => w.message.includes('very short'))
    ).toBe(true);
  });
});
