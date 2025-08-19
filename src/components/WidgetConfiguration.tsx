/**
 * WidgetConfiguration Component
 * Admin interface for AWS Connect settings configuration and theme customization
 * Supports requirements 6.1, 6.2, 6.3, 7.1, 7.3
 */

import React, { useState, useCallback, useEffect } from 'react';
import type {
  WidgetConfig,
  AWSConnectConfig,
  UIConfiguration,
  FeatureConfiguration,
  ValidationResult
} from '../types';
import { validateConfiguration, validateAWSConnectConfiguration } from '../utils/validation';

interface WidgetConfigurationProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

interface ConfigurationErrors {
  [key: string]: string[];
}

/**
 * Main widget configuration component
 */
export const WidgetConfiguration: React.FC<WidgetConfigurationProps> = ({
  config,
  onConfigChange,
  onSave,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'aws' | 'theme' | 'messages' | 'features'>('aws');
  const [validationErrors, setValidationErrors] = useState<ConfigurationErrors>({});
  const [validationWarnings, setValidationWarnings] = useState<ConfigurationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validate configuration whenever it changes
  useEffect(() => {
    const result = validateConfiguration(config);
    
    const errors: ConfigurationErrors = {};
    const warnings: ConfigurationErrors = {};
    
    result.errors.forEach(error => {
      if (!errors[error.field]) {
        errors[error.field] = [];
      }
      errors[error.field].push(error.message);
    });
    
    result.warnings.forEach(warning => {
      if (!warnings[warning.field]) {
        warnings[warning.field] = [];
      }
      warnings[warning.field].push(warning.message);
    });
    
    setValidationErrors(errors);
    setValidationWarnings(warnings);
  }, [config]);

  const handleConfigUpdate = useCallback((updates: Partial<WidgetConfig>) => {
    const newConfig = { ...config, ...updates };
    onConfigChange(newConfig);
    setHasUnsavedChanges(true);
  }, [config, onConfigChange]);

  const handleAWSConfigUpdate = useCallback((awsConfig: Partial<AWSConnectConfig>) => {
    handleConfigUpdate({
      aws: { ...config.aws, ...awsConfig }
    });
  }, [config.aws, handleConfigUpdate]);

  const handleUIConfigUpdate = useCallback((uiConfig: Partial<UIConfiguration>) => {
    handleConfigUpdate({
      ui: { ...config.ui, ...uiConfig }
    });
  }, [config.ui, handleConfigUpdate]);

  const handleFeatureConfigUpdate = useCallback((features: Partial<FeatureConfiguration>) => {
    handleConfigUpdate({
      features: { ...config.features, ...features }
    });
  }, [config.features, handleConfigUpdate]);

  const handleSave = useCallback(() => {
    const result = validateConfiguration(config);
    if (result.isValid) {
      onSave();
      setHasUnsavedChanges(false);
    }
  }, [config, onSave]);

  const isValid = Object.keys(validationErrors).length === 0;

  return (
    <div className={`widget-configuration ${className}`}>
      <div className="configuration-header">
        <h2>Widget Configuration</h2>
        <div className="configuration-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="unsaved-changes-notice">
          <span className="notice-icon">⚠️</span>
          You have unsaved changes
        </div>
      )}

      <div className="configuration-tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'aws' ? 'active' : ''}`}
          onClick={() => setActiveTab('aws')}
        >
          AWS Connect
          {validationErrors['aws.region'] || validationErrors['aws.instanceId'] || 
           validationErrors['aws.contactFlowId'] || validationErrors['aws.apiGatewayEndpoint'] ? (
            <span className="error-indicator">!</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Theme & Appearance
          {validationErrors['ui.theme.primaryColor'] || validationErrors['ui.theme.secondaryColor'] ? (
            <span className="error-indicator">!</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
          {validationErrors['ui.messages.welcomeMessage'] || validationErrors['ui.messages.offlineMessage'] ? (
            <span className="error-indicator">!</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
      </div>

      <div className="configuration-content">
        {activeTab === 'aws' && (
          <AWSConnectConfiguration
            config={config.aws}
            onConfigChange={handleAWSConfigUpdate}
            errors={validationErrors}
            warnings={validationWarnings}
          />
        )}
        
        {activeTab === 'theme' && (
          <ThemeConfiguration
            config={config.ui}
            onConfigChange={handleUIConfigUpdate}
            errors={validationErrors}
            warnings={validationWarnings}
          />
        )}
        
        {activeTab === 'messages' && (
          <MessageConfiguration
            config={config.ui.messages}
            onConfigChange={(messages) => handleUIConfigUpdate({ messages })}
            errors={validationErrors}
            warnings={validationWarnings}
          />
        )}
        
        {activeTab === 'features' && (
          <FeatureConfiguration
            config={config.features}
            onConfigChange={handleFeatureConfigUpdate}
            errors={validationErrors}
            warnings={validationWarnings}
          />
        )}
      </div>
    </div>
  );
};

/**
 * AWS Connect configuration section
 */
interface AWSConnectConfigurationProps {
  config: AWSConnectConfig;
  onConfigChange: (config: Partial<AWSConnectConfig>) => void;
  errors: ConfigurationErrors;
  warnings: ConfigurationErrors;
}

const AWSConnectConfiguration: React.FC<AWSConnectConfigurationProps> = ({
  config,
  onConfigChange,
  errors,
  warnings
}) => {
  const handleInputChange = (field: keyof AWSConnectConfig, value: string) => {
    onConfigChange({ [field]: value });
  };

  return (
    <div className="aws-configuration">
      <h3>AWS Connect Settings</h3>
      <p className="section-description">
        Configure your AWS Connect instance details to enable chat functionality.
      </p>

      <div className="form-group">
        <label htmlFor="aws-region">AWS Region *</label>
        <select
          id="aws-region"
          value={config.region || ''}
          onChange={(e) => handleInputChange('region', e.target.value)}
          className={errors['aws.region'] ? 'error' : ''}
        >
          <option value="">Select a region</option>
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
          <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
          <option value="eu-central-1">Europe (Frankfurt)</option>
          <option value="eu-west-2">Europe (London)</option>
          <option value="ca-central-1">Canada (Central)</option>
        </select>
        {errors['aws.region'] && (
          <div className="field-errors">
            {errors['aws.region'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="aws-instance-id">Connect Instance ID *</label>
        <input
          type="text"
          id="aws-instance-id"
          value={config.instanceId || ''}
          onChange={(e) => handleInputChange('instanceId', e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={errors['aws.instanceId'] ? 'error' : ''}
        />
        <small className="field-help">
          Find this in your AWS Connect console under Instance Settings
        </small>
        {errors['aws.instanceId'] && (
          <div className="field-errors">
            {errors['aws.instanceId'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="aws-contact-flow-id">Contact Flow ID *</label>
        <input
          type="text"
          id="aws-contact-flow-id"
          value={config.contactFlowId || ''}
          onChange={(e) => handleInputChange('contactFlowId', e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={errors['aws.contactFlowId'] ? 'error' : ''}
        />
        <small className="field-help">
          The contact flow that handles chat interactions
        </small>
        {errors['aws.contactFlowId'] && (
          <div className="field-errors">
            {errors['aws.contactFlowId'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="aws-api-gateway">API Gateway Endpoint *</label>
        <input
          type="url"
          id="aws-api-gateway"
          value={config.apiGatewayEndpoint || ''}
          onChange={(e) => handleInputChange('apiGatewayEndpoint', e.target.value)}
          placeholder="https://your-api-gateway-url.amazonaws.com"
          className={errors['aws.apiGatewayEndpoint'] ? 'error' : ''}
        />
        <small className="field-help">
          Your API Gateway endpoint for chat initialization
        </small>
        {errors['aws.apiGatewayEndpoint'] && (
          <div className="field-errors">
            {errors['aws.apiGatewayEndpoint'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      {warnings['aws'] && (
        <div className="field-warnings">
          {warnings['aws'].map((warning, index) => (
            <div key={index} className="warning-message">
              <span className="warning-icon">⚠️</span>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WidgetConfiguration;/**

 * Theme configuration section
 */
interface ThemeConfigurationProps {
  config: UIConfiguration;
  onConfigChange: (config: Partial<UIConfiguration>) => void;
  errors: ConfigurationErrors;
  warnings: ConfigurationErrors;
}

const ThemeConfiguration: React.FC<ThemeConfigurationProps> = ({
  config,
  onConfigChange,
  errors,
  warnings
}) => {
  const handleThemeChange = (field: string, value: string) => {
    onConfigChange({
      theme: { ...config.theme, [field]: value }
    });
  };

  const handlePositionChange = (field: string, value: string) => {
    onConfigChange({
      position: { ...config.position, [field]: value }
    });
  };

  return (
    <div className="theme-configuration">
      <h3>Theme & Appearance</h3>
      <p className="section-description">
        Customize the visual appearance of your chat widget to match your brand.
      </p>

      <div className="form-section">
        <h4>Colors</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="primary-color">Primary Color *</label>
            <div className="color-input-group">
              <input
                type="color"
                id="primary-color"
                value={config.theme.primaryColor || '#007bff'}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={config.theme.primaryColor || '#007bff'}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                placeholder="#007bff"
                className={`color-text ${errors['ui.theme.primaryColor'] ? 'error' : ''}`}
              />
            </div>
            <small className="field-help">
              Used for buttons, headers, and active states
            </small>
            {errors['ui.theme.primaryColor'] && (
              <div className="field-errors">
                {errors['ui.theme.primaryColor'].map((error, index) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="secondary-color">Secondary Color *</label>
            <div className="color-input-group">
              <input
                type="color"
                id="secondary-color"
                value={config.theme.secondaryColor || '#6c757d'}
                onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={config.theme.secondaryColor || '#6c757d'}
                onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                placeholder="#6c757d"
                className={`color-text ${errors['ui.theme.secondaryColor'] ? 'error' : ''}`}
              />
            </div>
            <small className="field-help">
              Used for secondary elements and borders
            </small>
            {errors['ui.theme.secondaryColor'] && (
              <div className="field-errors">
                {errors['ui.theme.secondaryColor'].map((error, index) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Typography</h4>
        <div className="form-group">
          <label htmlFor="font-family">Font Family</label>
          <input
            type="text"
            id="font-family"
            value={config.theme.fontFamily || ''}
            onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
            placeholder="Arial, sans-serif"
            className={errors['ui.theme.fontFamily'] ? 'error' : ''}
          />
          <small className="field-help">
            CSS font family (leave empty to use system default)
          </small>
          {errors['ui.theme.fontFamily'] && (
            <div className="field-errors">
              {errors['ui.theme.fontFamily'].map((error, index) => (
                <span key={index} className="error-message">{error}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Border Radius</h4>
        <div className="form-group">
          <label htmlFor="border-radius">Border Radius</label>
          <input
            type="text"
            id="border-radius"
            value={config.theme.borderRadius || ''}
            onChange={(e) => handleThemeChange('borderRadius', e.target.value)}
            placeholder="8px"
            className={errors['ui.theme.borderRadius'] ? 'error' : ''}
          />
          <small className="field-help">
            CSS border radius (e.g., 8px, 0.5rem)
          </small>
          {errors['ui.theme.borderRadius'] && (
            <div className="field-errors">
              {errors['ui.theme.borderRadius'].map((error, index) => (
                <span key={index} className="error-message">{error}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Widget Position</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="position-bottom">Bottom Distance *</label>
            <input
              type="text"
              id="position-bottom"
              value={config.position.bottom || ''}
              onChange={(e) => handlePositionChange('bottom', e.target.value)}
              placeholder="20px"
              className={errors['ui.position.bottom'] ? 'error' : ''}
            />
            <small className="field-help">
              Distance from bottom of screen
            </small>
            {errors['ui.position.bottom'] && (
              <div className="field-errors">
                {errors['ui.position.bottom'].map((error, index) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="position-right">Right Distance</label>
            <input
              type="text"
              id="position-right"
              value={config.position.right || ''}
              onChange={(e) => handlePositionChange('right', e.target.value)}
              placeholder="20px"
              className={errors['ui.position.right'] ? 'error' : ''}
            />
            <small className="field-help">
              Distance from right edge (leave empty to use left)
            </small>
            {errors['ui.position.right'] && (
              <div className="field-errors">
                {errors['ui.position.right'].map((error, index) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="position-left">Left Distance</label>
            <input
              type="text"
              id="position-left"
              value={config.position.left || ''}
              onChange={(e) => handlePositionChange('left', e.target.value)}
              placeholder="20px"
              className={errors['ui.position.left'] ? 'error' : ''}
            />
            <small className="field-help">
              Distance from left edge (ignored if right is set)
            </small>
            {errors['ui.position.left'] && (
              <div className="field-errors">
                {errors['ui.position.left'].map((error, index) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {warnings['ui.position'] && (
          <div className="field-warnings">
            {warnings['ui.position'].map((warning, index) => (
              <div key={index} className="warning-message">
                <span className="warning-icon">⚠️</span>
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="theme-preview">
        <h4>Preview</h4>
        <div 
          className="widget-preview"
          style={{
            '--primary-color': config.theme.primaryColor,
            '--secondary-color': config.theme.secondaryColor,
            '--font-family': config.theme.fontFamily,
            '--border-radius': config.theme.borderRadius
          } as React.CSSProperties}
        >
          <div className="preview-button">
            Chat with us
          </div>
          <div className="preview-window">
            <div className="preview-header">Customer Support</div>
            <div className="preview-message">
              {config.messages.welcomeMessage || 'Welcome! How can we help you today?'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Message configuration section
 */
interface MessageConfigurationProps {
  config: UIConfiguration['messages'];
  onConfigChange: (messages: Partial<UIConfiguration['messages']>) => void;
  errors: ConfigurationErrors;
  warnings: ConfigurationErrors;
}

const MessageConfiguration: React.FC<MessageConfigurationProps> = ({
  config,
  onConfigChange,
  errors,
  warnings
}) => {
  const handleMessageChange = (field: keyof UIConfiguration['messages'], value: string) => {
    onConfigChange({ [field]: value });
  };

  return (
    <div className="message-configuration">
      <h3>Message Customization</h3>
      <p className="section-description">
        Customize the messages shown to visitors during different chat states.
      </p>

      <div className="form-group">
        <label htmlFor="welcome-message">Welcome Message *</label>
        <textarea
          id="welcome-message"
          value={config.welcomeMessage || ''}
          onChange={(e) => handleMessageChange('welcomeMessage', e.target.value)}
          placeholder="Welcome! How can we help you today?"
          rows={3}
          maxLength={500}
          className={errors['ui.messages.welcomeMessage'] ? 'error' : ''}
        />
        <div className="character-count">
          {(config.welcomeMessage || '').length}/500 characters
        </div>
        <small className="field-help">
          First message visitors see when opening the chat
        </small>
        {errors['ui.messages.welcomeMessage'] && (
          <div className="field-errors">
            {errors['ui.messages.welcomeMessage'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="offline-message">Offline Message *</label>
        <textarea
          id="offline-message"
          value={config.offlineMessage || ''}
          onChange={(e) => handleMessageChange('offlineMessage', e.target.value)}
          placeholder="We're currently offline. Please leave a message and we'll get back to you."
          rows={3}
          maxLength={500}
          className={errors['ui.messages.offlineMessage'] ? 'error' : ''}
        />
        <div className="character-count">
          {(config.offlineMessage || '').length}/500 characters
        </div>
        <small className="field-help">
          Message shown when no agents are available
        </small>
        {errors['ui.messages.offlineMessage'] && (
          <div className="field-errors">
            {errors['ui.messages.offlineMessage'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="waiting-message">Waiting Message *</label>
        <textarea
          id="waiting-message"
          value={config.waitingMessage || ''}
          onChange={(e) => handleMessageChange('waitingMessage', e.target.value)}
          placeholder="Please wait while we connect you to an agent..."
          rows={2}
          maxLength={500}
          className={errors['ui.messages.waitingMessage'] ? 'error' : ''}
        />
        <div className="character-count">
          {(config.waitingMessage || '').length}/500 characters
        </div>
        <small className="field-help">
          Message shown while connecting to an agent
        </small>
        {errors['ui.messages.waitingMessage'] && (
          <div className="field-errors">
            {errors['ui.messages.waitingMessage'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="connecting-message">Connecting Message</label>
        <textarea
          id="connecting-message"
          value={config.connectingMessage || ''}
          onChange={(e) => handleMessageChange('connectingMessage', e.target.value)}
          placeholder="Connecting to AWS Connect..."
          rows={2}
          maxLength={500}
          className={errors['ui.messages.connectingMessage'] ? 'error' : ''}
        />
        <div className="character-count">
          {(config.connectingMessage || '').length}/500 characters
        </div>
        <small className="field-help">
          Message shown during initial connection (optional)
        </small>
        {errors['ui.messages.connectingMessage'] && (
          <div className="field-errors">
            {errors['ui.messages.connectingMessage'].map((error, index) => (
              <span key={index} className="error-message">{error}</span>
            ))}
          </div>
        )}
      </div>

      {Object.keys(warnings).some(key => key.startsWith('ui.messages')) && (
        <div className="field-warnings">
          {Object.entries(warnings)
            .filter(([key]) => key.startsWith('ui.messages'))
            .map(([key, warningList]) => 
              warningList.map((warning, index) => (
                <div key={`${key}-${index}`} className="warning-message">
                  <span className="warning-icon">⚠️</span>
                  {warning}
                </div>
              ))
            )}
        </div>
      )}
    </div>
  );
};

/**
 * Feature configuration section
 */
interface FeatureConfigurationProps {
  config: FeatureConfiguration;
  onConfigChange: (features: Partial<FeatureConfiguration>) => void;
  errors: ConfigurationErrors;
  warnings: ConfigurationErrors;
}

const FeatureConfiguration: React.FC<FeatureConfigurationProps> = ({
  config,
  onConfigChange,
  errors,
  warnings
}) => {
  const handleFeatureToggle = (feature: keyof FeatureConfiguration, enabled: boolean) => {
    onConfigChange({ [feature]: enabled });
  };

  const features = [
    {
      key: 'fileUpload' as const,
      label: 'File Upload',
      description: 'Allow visitors to upload files during chat',
      warning: 'May impact performance and requires additional security considerations'
    },
    {
      key: 'emojiPicker' as const,
      label: 'Emoji Picker',
      description: 'Enable emoji picker in message input'
    },
    {
      key: 'chatRatings' as const,
      label: 'Chat Ratings',
      description: 'Allow visitors to rate their chat experience'
    },
    {
      key: 'chatTranscript' as const,
      label: 'Chat Transcript',
      description: 'Provide chat transcript download option'
    },
    {
      key: 'typing' as const,
      label: 'Typing Indicators',
      description: 'Show typing indicators for both visitor and agent'
    }
  ];

  return (
    <div className="feature-configuration">
      <h3>Feature Settings</h3>
      <p className="section-description">
        Enable or disable specific chat features based on your needs.
      </p>

      <div className="feature-list">
        {features.map((feature) => (
          <div key={feature.key} className="feature-item">
            <div className="feature-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config[feature.key] || false}
                  onChange={(e) => handleFeatureToggle(feature.key, e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="feature-info">
              <h4>{feature.label}</h4>
              <p>{feature.description}</p>
              {feature.warning && config[feature.key] && (
                <div className="feature-warning">
                  <span className="warning-icon">⚠️</span>
                  {feature.warning}
                </div>
              )}
              {errors[`features.${feature.key}`] && (
                <div className="field-errors">
                  {errors[`features.${feature.key}`].map((error, index) => (
                    <span key={index} className="error-message">{error}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {warnings['features'] && (
        <div className="field-warnings">
          {warnings['features'].map((warning, index) => (
            <div key={index} className="warning-message">
              <span className="warning-icon">⚠️</span>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};