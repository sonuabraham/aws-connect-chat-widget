/**
 * WidgetConfiguration Component Tests
 * Tests for the admin interface configuration component
 * Supports requirements 6.1, 6.2, 6.3, 7.1, 7.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WidgetConfiguration } from './WidgetConfiguration';
import type { WidgetConfig } from '../types';

// Mock validation utilities
vi.mock('../utils/validation', () => ({
  validateConfiguration: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
  validateAWSConnectConfiguration: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
}));

const mockConfig: WidgetConfig = {
  aws: {
    region: 'us-east-1',
    instanceId: '12345678-1234-1234-1234-123456789012',
    contactFlowId: '87654321-4321-4321-4321-210987654321',
    apiGatewayEndpoint: 'https://api.example.com',
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
      welcomeMessage: 'Welcome! How can we help?',
      offlineMessage: 'We are currently offline.',
      waitingMessage: 'Please wait...',
      connectingMessage: 'Connecting...',
    },
  },
  features: {
    fileUpload: false,
    emojiPicker: true,
    chatRatings: true,
    chatTranscript: false,
    typing: true,
  },
};

const defaultProps = {
  config: mockConfig,
  onConfigChange: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('WidgetConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the configuration interface', () => {
    render(<WidgetConfiguration {...defaultProps} />);

    expect(screen.getByText('Widget Configuration')).toBeInTheDocument();
    expect(screen.getByText('AWS Connect')).toBeInTheDocument();
    expect(screen.getByText('Theme & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('shows unsaved changes notice when hasUnsavedChanges is true', async () => {
    const user = userEvent.setup();
    render(<WidgetConfiguration {...defaultProps} />);

    // Make a change to trigger unsaved changes
    const regionSelect = screen.getByLabelText(/AWS Region/);
    await user.selectOptions(regionSelect, 'us-west-2');

    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<WidgetConfiguration {...defaultProps} onSave={onSave} />);

    const saveButton = screen.getByText('Save Configuration');
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<WidgetConfiguration {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables save button when configuration is invalid', () => {
    const { validateConfiguration } = require('../utils/validation');
    validateConfiguration.mockReturnValue({
      isValid: false,
      errors: [
        {
          field: 'aws.region',
          code: 'REQUIRED_FIELD_MISSING',
          message: 'Region is required',
        },
      ],
      warnings: [],
    });

    render(<WidgetConfiguration {...defaultProps} />);

    const saveButton = screen.getByText('Save Configuration');
    expect(saveButton).toBeDisabled();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<WidgetConfiguration {...defaultProps} />);

    // Initially AWS tab should be active
    expect(screen.getByText('AWS Connect Settings')).toBeInTheDocument();

    // Switch to theme tab
    await user.click(screen.getByText('Theme & Appearance'));
    expect(screen.getByText('Theme & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();

    // Switch to messages tab
    await user.click(screen.getByText('Messages'));
    expect(screen.getByText('Message Customization')).toBeInTheDocument();

    // Switch to features tab
    await user.click(screen.getByText('Features'));
    expect(screen.getByText('Feature Settings')).toBeInTheDocument();
  });

  describe('AWS Configuration Tab', () => {
    it('renders AWS configuration fields', () => {
      render(<WidgetConfiguration {...defaultProps} />);

      expect(screen.getByLabelText(/AWS Region/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Connect Instance ID/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Flow ID/)).toBeInTheDocument();
      expect(screen.getByLabelText(/API Gateway Endpoint/)).toBeInTheDocument();
    });

    it('updates AWS configuration when fields change', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      const regionSelect = screen.getByLabelText(/AWS Region/);
      await user.selectOptions(regionSelect, 'us-west-2');

      expect(onConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        aws: { ...mockConfig.aws, region: 'us-west-2' },
      });
    });

    it('shows validation errors for AWS fields', () => {
      const { validateConfiguration } = require('../utils/validation');
      validateConfiguration.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'aws.instanceId',
            code: 'INVALID_INSTANCE_ID',
            message: 'Invalid instance ID format',
          },
        ],
        warnings: [],
      });

      render(<WidgetConfiguration {...defaultProps} />);

      expect(
        screen.getByText('Invalid instance ID format')
      ).toBeInTheDocument();
    });
  });

  describe('Theme Configuration Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WidgetConfiguration {...defaultProps} />);
      await user.click(screen.getByText('Theme & Appearance'));
    });

    it('renders theme configuration fields', () => {
      expect(screen.getByLabelText(/Primary Color/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Secondary Color/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Font Family/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Border Radius/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bottom Distance/)).toBeInTheDocument();
    });

    it('updates theme configuration when fields change', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      await user.click(screen.getByText('Theme & Appearance'));

      const primaryColorInput = screen.getAllByDisplayValue('#007bff')[0];
      await user.clear(primaryColorInput);
      await user.type(primaryColorInput, '#ff0000');

      expect(onConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          theme: { ...mockConfig.ui.theme, primaryColor: '#ff0000' },
        },
      });
    });

    it('shows theme preview', () => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Chat with us')).toBeInTheDocument();
    });
  });

  describe('Message Configuration Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WidgetConfiguration {...defaultProps} />);
      await user.click(screen.getByText('Messages'));
    });

    it('renders message configuration fields', () => {
      expect(screen.getByLabelText(/Welcome Message/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Offline Message/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Waiting Message/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Connecting Message/)).toBeInTheDocument();
    });

    it('shows character count for message fields', () => {
      const welcomeTextarea = screen.getByLabelText(/Welcome Message/);
      expect(welcomeTextarea).toHaveValue('Welcome! How can we help?');

      // Should show character count
      expect(screen.getByText(/\/500 characters/)).toBeInTheDocument();
    });

    it('updates message configuration when fields change', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      await user.click(screen.getByText('Messages'));

      const welcomeTextarea = screen.getByLabelText(/Welcome Message/);
      await user.clear(welcomeTextarea);
      await user.type(welcomeTextarea, 'New welcome message');

      expect(onConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        ui: {
          ...mockConfig.ui,
          messages: {
            ...mockConfig.ui.messages,
            welcomeMessage: 'New welcome message',
          },
        },
      });
    });
  });

  describe('Feature Configuration Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WidgetConfiguration {...defaultProps} />);
      await user.click(screen.getByText('Features'));
    });

    it('renders feature toggle switches', () => {
      expect(screen.getByText('File Upload')).toBeInTheDocument();
      expect(screen.getByText('Emoji Picker')).toBeInTheDocument();
      expect(screen.getByText('Chat Ratings')).toBeInTheDocument();
      expect(screen.getByText('Chat Transcript')).toBeInTheDocument();
      expect(screen.getByText('Typing Indicators')).toBeInTheDocument();
    });

    it('shows correct initial toggle states', () => {
      const fileUploadToggle = screen.getByRole('checkbox', {
        name: /File Upload/,
      });
      const emojiPickerToggle = screen.getByRole('checkbox', {
        name: /Emoji Picker/,
      });

      expect(fileUploadToggle).not.toBeChecked();
      expect(emojiPickerToggle).toBeChecked();
    });

    it('updates feature configuration when toggles change', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      await user.click(screen.getByText('Features'));

      const fileUploadToggle = screen.getByRole('checkbox', {
        name: /File Upload/,
      });
      await user.click(fileUploadToggle);

      expect(onConfigChange).toHaveBeenCalledWith({
        ...mockConfig,
        features: { ...mockConfig.features, fileUpload: true },
      });
    });

    it('shows warning for performance-impacting features', async () => {
      const user = userEvent.setup();
      const configWithFileUpload = {
        ...mockConfig,
        features: { ...mockConfig.features, fileUpload: true },
      };

      render(
        <WidgetConfiguration {...defaultProps} config={configWithFileUpload} />
      );
      await user.click(screen.getByText('Features'));

      expect(
        screen.getByText(
          /May impact performance and requires additional security considerations/
        )
      ).toBeInTheDocument();
    });
  });

  describe('Validation and Error Handling', () => {
    it('displays validation errors with error indicators on tabs', () => {
      const { validateConfiguration } = require('../utils/validation');
      validateConfiguration.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'aws.region',
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Region is required',
          },
          {
            field: 'ui.theme.primaryColor',
            code: 'INVALID_COLOR',
            message: 'Invalid color format',
          },
        ],
        warnings: [],
      });

      render(<WidgetConfiguration {...defaultProps} />);

      // Should show error indicators on tabs
      const awsTab = screen.getByText('AWS Connect');
      const themeTab = screen.getByText('Theme & Appearance');

      expect(awsTab.querySelector('.error-indicator')).toBeInTheDocument();
      expect(themeTab.querySelector('.error-indicator')).toBeInTheDocument();
    });

    it('displays validation warnings', () => {
      const { validateConfiguration } = require('../utils/validation');
      validateConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'ui.position',
            code: 'SUBOPTIMAL_VALUE',
            message: 'Both right and left positions specified',
          },
        ],
      });

      render(<WidgetConfiguration {...defaultProps} />);

      expect(
        screen.getByText('Both right and left positions specified')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state on save button', () => {
      render(<WidgetConfiguration {...defaultProps} isLoading={true} />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('disables all buttons when loading', () => {
      render(<WidgetConfiguration {...defaultProps} isLoading={true} />);

      const saveButton = screen.getByText('Saving...');
      const cancelButton = screen.getByText('Cancel');

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<WidgetConfiguration {...defaultProps} />);

      // Check for proper form labels
      expect(screen.getByLabelText(/AWS Region/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Connect Instance ID/)).toBeInTheDocument();

      // Check for proper button roles
      expect(
        screen.getByRole('button', { name: /Save Configuration/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/ })
      ).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<WidgetConfiguration {...defaultProps} />);

      // Tab navigation should work
      await user.tab();
      expect(screen.getByText('Cancel')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Save Configuration')).toHaveFocus();
    });
  });
});
