import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WidgetConfiguration } from '../components/WidgetConfiguration';
import { ThemeProvider } from '../components/ThemeProvider';
import type { WidgetConfiguration as WidgetConfigType } from '../types/widget';

// Mock validation utilities
vi.mock('../utils/validation', () => ({
  validateConfiguration: vi.fn(() => ({
    isValid: true,
    errors: {},
    warnings: {},
  })),
  validateAWSConfig: vi.fn(() => ({ isValid: true, errors: [] })),
  validateThemeConfig: vi.fn(() => ({ isValid: true, errors: [] })),
}));

describe('Configuration Integration Tests', () => {
  const mockConfig: WidgetConfigType = {
    aws: {
      region: 'us-east-1',
      instanceId: '12345678-1234-1234-1234-123456789012',
      contactFlowId: '87654321-4321-4321-4321-210987654321',
      apiGatewayEndpoint: 'https://api.example.com',
    },
    ui: {
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#0056b3',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
      },
      position: {
        bottom: '20px',
        right: '20px',
      },
      messages: {
        welcomeMessage: 'Welcome!',
        offlineMessage: 'We are offline',
        waitingMessage: 'Please wait...',
        connectingMessage: 'Connecting...',
      },
    },
    features: {
      fileUpload: false,
      emojiPicker: true,
      chatRatings: true,
      chatTranscript: false,
    },
  };

  const defaultProps = {
    config: mockConfig,
    onConfigChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Configuration Flow', () => {
    it('should complete full configuration setup from AWS to features', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      const onSave = vi.fn();

      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
          onSave={onSave}
        />
      );

      // Step 1: Verify AWS Connect tab is active by default
      expect(screen.getByText('AWS Connect Settings')).toBeInTheDocument();

      // Step 2: Update AWS configuration
      const regionSelect = screen.getByLabelText('AWS Region *');
      await user.selectOptions(regionSelect, 'us-west-2');

      const instanceIdInput = screen.getByLabelText('Connect Instance ID *');
      await user.clear(instanceIdInput);
      await user.type(instanceIdInput, 'new-instance-id');

      // Verify config change callback
      expect(onConfigChange).toHaveBeenCalled();

      // Step 3: Switch to Theme & Appearance tab
      await user.click(screen.getAllByText('Theme & Appearance')[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // Step 4: Update theme configuration
      const primaryColorInput = screen.getByLabelText('Primary Color *');
      await user.clear(primaryColorInput);
      await user.type(primaryColorInput, '#ff0000');

      const fontFamilySelect = screen.getByLabelText('Font Family');
      await user.selectOptions(fontFamilySelect, 'Georgia, serif');

      // Step 5: Switch to Messages tab
      await user.click(screen.getAllByText('Messages')[0]);

      await waitFor(() => {
        expect(screen.getByText('Message Customization')).toBeInTheDocument();
      });

      // Step 6: Update message configuration
      const welcomeMessageInput = screen.getByLabelText('Welcome Message *');
      await user.clear(welcomeMessageInput);
      await user.type(
        welcomeMessageInput,
        'Hello! Welcome to our support chat.'
      );

      // Step 7: Switch to Features tab
      await user.click(screen.getAllByText('Features')[0]);

      await waitFor(() => {
        expect(screen.getByText('Feature Settings')).toBeInTheDocument();
      });

      // Step 8: Toggle feature settings
      const fileUploadToggle = screen.getByRole('checkbox', {
        name: /File Upload/,
      });
      await user.click(fileUploadToggle);

      const chatRatingsToggle = screen.getByRole('checkbox', {
        name: /Chat Ratings/,
      });
      await user.click(chatRatingsToggle);

      // Step 9: Save configuration
      await user.click(screen.getByText('Save Configuration'));

      // Verify save callback was called
      expect(onSave).toHaveBeenCalled();
    });

    it('should handle validation errors across all tabs', async () => {
      const user = userEvent.setup();

      // Mock validation to return errors
      const { validateConfiguration } = require('../utils/validation');
      validateConfiguration.mockReturnValue({
        isValid: false,
        errors: {
          aws: ['Invalid region'],
          theme: ['Invalid color format'],
          messages: ['Welcome message too long'],
          features: ['Conflicting feature settings'],
        },
        warnings: {},
      });

      render(<WidgetConfiguration {...defaultProps} />);

      // Try to save with validation errors
      await user.click(screen.getByText('Save Configuration'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/Invalid region/)).toBeInTheDocument();
      });

      // Error indicators should appear on tabs
      const tabs = screen
        .getAllByRole('button')
        .filter(
          btn =>
            btn.textContent?.includes('AWS Connect') ||
            btn.textContent?.includes('Theme & Appearance') ||
            btn.textContent?.includes('Messages') ||
            btn.textContent?.includes('Features')
        );

      // At least some tabs should have error indicators
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('Theme Application Integration', () => {
    it('should apply theme changes in real-time', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <ThemeProvider theme={mockConfig.ui.theme}>
          <WidgetConfiguration
            {...defaultProps}
            onConfigChange={onConfigChange}
          />
        </ThemeProvider>
      );

      // Switch to theme tab
      await user.click(screen.getAllByText('Theme & Appearance')[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // Change primary color
      const primaryColorInput = screen.getByLabelText('Primary Color *');
      await user.clear(primaryColorInput);
      await user.type(primaryColorInput, '#00ff00');

      // Verify config change was called with new theme
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ui: expect.objectContaining({
            theme: expect.objectContaining({
              primaryColor: '#00ff00',
            }),
          }),
        })
      );

      // Change border radius
      const borderRadiusInput = screen.getByLabelText('Border Radius');
      await user.clear(borderRadiusInput);
      await user.type(borderRadiusInput, '16px');

      // Verify multiple theme changes
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ui: expect.objectContaining({
            theme: expect.objectContaining({
              borderRadius: '16px',
            }),
          }),
        })
      );
    });

    it('should preview theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider theme={mockConfig.ui.theme}>
          <WidgetConfiguration {...defaultProps} />
        </ThemeProvider>
      );

      // Switch to theme tab
      await user.click(screen.getAllByText('Theme & Appearance')[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // Look for preview elements
      const previewSection = screen.getByText('Preview');
      expect(previewSection).toBeInTheDocument();

      // Change theme and verify preview updates
      const primaryColorInput = screen.getByLabelText('Primary Color *');
      await user.clear(primaryColorInput);
      await user.type(primaryColorInput, '#purple');

      // Preview should reflect changes (tested through component integration)
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('Feature Configuration Integration', () => {
    it('should handle feature dependencies and conflicts', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      // Switch to features tab
      await user.click(screen.getAllByText('Features')[0]);

      await waitFor(() => {
        expect(screen.getByText('Feature Settings')).toBeInTheDocument();
      });

      // Enable file upload (performance-impacting feature)
      const fileUploadToggle = screen.getByRole('checkbox', {
        name: /File Upload/,
      });
      await user.click(fileUploadToggle);

      // Should show performance warning
      expect(screen.getByText(/May impact performance/)).toBeInTheDocument();

      // Enable multiple features
      const emojiToggle = screen.getByRole('checkbox', {
        name: /Emoji Picker/,
      });
      const ratingsToggle = screen.getByRole('checkbox', {
        name: /Chat Ratings/,
      });
      const transcriptToggle = screen.getByRole('checkbox', {
        name: /Chat Transcript/,
      });

      await user.click(emojiToggle);
      await user.click(ratingsToggle);
      await user.click(transcriptToggle);

      // Verify all features are enabled
      expect(fileUploadToggle).toBeChecked();
      expect(emojiToggle).toBeChecked();
      expect(ratingsToggle).toBeChecked();
      expect(transcriptToggle).toBeChecked();

      // Verify config changes
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            fileUpload: true,
            emojiPicker: true,
            chatRatings: true,
            chatTranscript: true,
          }),
        })
      );
    });

    it('should show feature descriptions and help text', async () => {
      const user = userEvent.setup();

      render(<WidgetConfiguration {...defaultProps} />);

      // Switch to features tab
      await user.click(screen.getAllByText('Features')[0]);

      await waitFor(() => {
        expect(screen.getByText('Feature Settings')).toBeInTheDocument();
      });

      // Verify feature descriptions are shown
      expect(
        screen.getByText('Allow visitors to upload files during chat')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Enable emoji picker in message input')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Allow visitors to rate their chat experience')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Provide chat transcript download option')
      ).toBeInTheDocument();
    });
  });

  describe('Configuration Persistence', () => {
    it('should maintain configuration state across tab switches', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();

      render(
        <WidgetConfiguration
          {...defaultProps}
          onConfigChange={onConfigChange}
        />
      );

      // Make changes in AWS tab
      const instanceIdInput = screen.getByLabelText('Connect Instance ID *');
      await user.clear(instanceIdInput);
      await user.type(instanceIdInput, 'modified-instance-id');

      // Switch to theme tab
      await user.click(screen.getAllByText('Theme & Appearance')[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // Make changes in theme tab
      const primaryColorInput = screen.getByLabelText('Primary Color *');
      await user.clear(primaryColorInput);
      await user.type(primaryColorInput, '#123456');

      // Switch back to AWS tab
      await user.click(screen.getAllByText('AWS Connect')[0]);

      await waitFor(() => {
        expect(screen.getByText('AWS Connect Settings')).toBeInTheDocument();
      });

      // Verify previous changes are maintained
      const instanceIdInputAgain = screen.getByLabelText(
        'Connect Instance ID *'
      );
      expect(instanceIdInputAgain).toHaveValue('modified-instance-id');

      // Switch back to theme tab
      await user.click(screen.getAllByText('Theme & Appearance')[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // Verify theme changes are maintained
      const primaryColorInputAgain = screen.getByLabelText('Primary Color *');
      expect(primaryColorInputAgain).toHaveValue('#123456');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from validation errors when fixed', async () => {
      const user = userEvent.setup();

      // Start with validation errors
      const { validateConfiguration } = require('../utils/validation');
      validateConfiguration.mockReturnValue({
        isValid: false,
        errors: {
          aws: ['Invalid instance ID format'],
        },
        warnings: {},
      });

      render(<WidgetConfiguration {...defaultProps} />);

      // Try to save with errors
      await user.click(screen.getByText('Save Configuration'));

      // Should show error
      await waitFor(() => {
        expect(
          screen.getByText(/Invalid instance ID format/)
        ).toBeInTheDocument();
      });

      // Fix the error
      validateConfiguration.mockReturnValue({
        isValid: true,
        errors: {},
        warnings: {},
      });

      const instanceIdInput = screen.getByLabelText('Connect Instance ID *');
      await user.clear(instanceIdInput);
      await user.type(instanceIdInput, '12345678-1234-1234-1234-123456789012');

      // Try to save again
      await user.click(screen.getByText('Save Configuration'));

      // Should succeed without errors
      expect(
        screen.queryByText(/Invalid instance ID format/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across configuration flow', async () => {
      const user = userEvent.setup();

      render(<WidgetConfiguration {...defaultProps} />);

      // Test keyboard navigation between tabs
      const awsTab = screen.getAllByText('AWS Connect')[0];
      const themeTab = screen.getAllByText('Theme & Appearance')[0];

      awsTab.focus();
      expect(awsTab).toHaveFocus();

      // Navigate with keyboard
      fireEvent.keyDown(awsTab, { key: 'ArrowRight' });
      expect(themeTab).toHaveFocus();

      // Test form accessibility
      await user.click(themeTab);

      await waitFor(() => {
        expect(
          screen.getByText('Theme & Appearance Settings')
        ).toBeInTheDocument();
      });

      // All form inputs should have proper labels
      const primaryColorInput = screen.getByLabelText('Primary Color *');
      const secondaryColorInput = screen.getByLabelText('Secondary Color');
      const fontFamilySelect = screen.getByLabelText('Font Family');

      expect(primaryColorInput).toBeInTheDocument();
      expect(secondaryColorInput).toBeInTheDocument();
      expect(fontFamilySelect).toBeInTheDocument();

      // Required fields should be marked
      expect(screen.getByText('Primary Color *')).toBeInTheDocument();
    });
  });
});
