/**
 * Theme System Usage Example
 * Demonstrates how to use the theme system and CSS-in-JS styling
 * Supports requirements 5.1, 5.2, 5.4, 6.1, 6.2
 */

import React, { useState } from 'react';
import {
  ThemeProvider,
  useTheme,
  useResponsive,
  useHighContrast,
  useReducedMotion,
} from '../components/ThemeProvider';
import {
  useStyles,
  useVariants,
  mergeClassNames,
  createButtonStyles,
  createInputStyles,
  createSurfaceStyles,
  commonStyles,
} from '../utils/styled';
import type { ThemeConfiguration, StyleDefinition } from '../types';

/**
 * Example component using theme hooks and styled utilities
 */
const ThemedComponent: React.FC = () => {
  const theme = useTheme();
  const responsive = useResponsive();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();

  const [inputValue, setInputValue] = useState('');

  // Create custom styles using theme
  const containerStyles: StyleDefinition = {
    base: {
      padding: theme.spacing.lg,
      backgroundColor: theme.backgroundColor,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadowMedium,
      fontFamily: theme.fontFamily,
      maxWidth: '600px',
      margin: '0 auto',
    },
    responsive: {
      mobile: {
        padding: theme.spacing.md,
        margin: theme.spacing.sm,
      },
    },
  };

  const headingStyles: StyleDefinition = {
    base: {
      color: theme.primaryColor,
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    responsive: {
      mobile: {
        fontSize: theme.typography.fontSize.lg,
      },
    },
  };

  // Create button variants
  const buttonVariants = {
    primary: (theme: any) => ({
      backgroundColor: theme.primaryColor,
      color: theme.textOnPrimary,
      border: `1px solid ${theme.primaryColor}`,
      '&:hover': {
        backgroundColor: theme.primaryColorHover,
      },
    }),
    secondary: (theme: any) => ({
      backgroundColor: 'transparent',
      color: theme.primaryColor,
      border: `1px solid ${theme.primaryColor}`,
      '&:hover': {
        backgroundColor: theme.primaryColor,
        color: theme.textOnPrimary,
      },
    }),
    success: (theme: any) => ({
      backgroundColor: theme.successColor,
      color: '#ffffff',
      border: `1px solid ${theme.successColor}`,
    }),
  };

  // Use styled utilities
  const containerClass = useStyles(containerStyles, theme);
  const headingClass = useStyles(headingStyles, theme);
  const buttonClasses = useVariants(buttonVariants, theme);

  // Create input styles
  const inputStyles = createInputStyles(theme);
  const inputClass = useStyles(inputStyles, theme);

  // Create surface styles for info box
  const surfaceStyles = createSurfaceStyles(theme);
  const surfaceClass = useStyles(surfaceStyles, theme);

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Theme System Example</h1>

      {/* Theme Information */}
      <div
        className={mergeClassNames(
          surfaceClass,
          'chat-spacing--md',
          'chat-margin--md'
        )}
      >
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Current Theme Values
        </h3>
        <ul
          style={{
            color: theme.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          <li>Primary Color: {theme.primaryColor}</li>
          <li>Secondary Color: {theme.secondaryColor}</li>
          <li>Font Family: {theme.fontFamily}</li>
          <li>Border Radius: {theme.borderRadius}</li>
          <li>High Contrast: {isHighContrast ? 'Yes' : 'No'}</li>
          <li>Reduced Motion: {prefersReducedMotion ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      {/* Responsive Information */}
      <div
        className={mergeClassNames(
          surfaceClass,
          'chat-spacing--md',
          'chat-margin--md'
        )}
      >
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Responsive Breakpoints
        </h3>
        <ul
          style={{
            color: theme.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          <li>Mobile: {responsive.mobile}</li>
          <li>Tablet: {responsive.tablet}</li>
          <li>Desktop: {responsive.desktop}</li>
        </ul>
      </div>

      {/* Button Examples */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Button Variants
        </h3>
        <div
          style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}
        >
          <button
            className={mergeClassNames('chat-button', buttonClasses.primary)}
          >
            Primary Button
          </button>
          <button
            className={mergeClassNames('chat-button', buttonClasses.secondary)}
          >
            Secondary Button
          </button>
          <button
            className={mergeClassNames('chat-button', buttonClasses.success)}
          >
            Success Button
          </button>
        </div>
      </div>

      {/* Input Example */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Themed Input
        </h3>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type something..."
          className={inputClass}
        />
      </div>

      {/* Typography Examples */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Typography Scale
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
          }}
        >
          <span className="chat-text--xs">Extra Small Text (12px)</span>
          <span className="chat-text--sm">Small Text (14px)</span>
          <span className="chat-text--md">Medium Text (16px)</span>
          <span className="chat-text--lg">Large Text (18px)</span>
          <span className="chat-text--xl">Extra Large Text (20px)</span>
        </div>
      </div>

      {/* Color Examples */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Semantic Colors
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
          }}
        >
          <span className="chat-text--success">Success Text</span>
          <span className="chat-text--warning">Warning Text</span>
          <span className="chat-text--error">Error Text</span>
          <span className="chat-text--info">Info Text</span>
          <span className="chat-text--secondary">Secondary Text</span>
          <span className="chat-text--disabled">Disabled Text</span>
        </div>
      </div>

      {/* Animation Examples */}
      <div>
        <h3
          style={{ color: theme.textPrimary, marginBottom: theme.spacing.sm }}
        >
          Animations {prefersReducedMotion && '(Disabled - Reduced Motion)'}
        </h3>
        <div
          style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}
        >
          <div
            className="chat-animate-fade-in"
            style={{
              padding: theme.spacing.sm,
              backgroundColor: theme.surfaceColor,
              borderRadius: theme.borderRadius,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            Fade In
          </div>
          <div
            className="chat-animate-slide-up"
            style={{
              padding: theme.spacing.sm,
              backgroundColor: theme.surfaceColor,
              borderRadius: theme.borderRadius,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            Slide Up
          </div>
          <div
            className="chat-animate-bounce"
            style={{
              padding: theme.spacing.sm,
              backgroundColor: theme.surfaceColor,
              borderRadius: theme.borderRadius,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            Bounce
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Theme customization controls
 */
const ThemeControls: React.FC<{
  theme: Partial<ThemeConfiguration>;
  onThemeChange: (theme: Partial<ThemeConfiguration>) => void;
}> = ({ theme, onThemeChange }) => {
  const currentTheme = useTheme();

  const controlsStyles: StyleDefinition = {
    base: {
      padding: currentTheme.spacing.lg,
      backgroundColor: currentTheme.surfaceColor,
      borderRadius: currentTheme.borderRadius,
      border: `1px solid ${currentTheme.borderColor}`,
      marginBottom: currentTheme.spacing.lg,
    },
  };

  const controlsClass = useStyles(controlsStyles, currentTheme);

  return (
    <div className={controlsClass}>
      <h3
        style={{
          marginBottom: currentTheme.spacing.md,
          color: currentTheme.textPrimary,
        }}
      >
        Theme Controls
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: currentTheme.spacing.md,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: currentTheme.spacing.xs,
              color: currentTheme.textSecondary,
            }}
          >
            Primary Color
          </label>
          <input
            type="color"
            value={theme.primaryColor || '#007bff'}
            onChange={e =>
              onThemeChange({ ...theme, primaryColor: e.target.value })
            }
            style={{
              width: '100%',
              height: '40px',
              border: 'none',
              borderRadius: currentTheme.borderRadius,
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: currentTheme.spacing.xs,
              color: currentTheme.textSecondary,
            }}
          >
            Secondary Color
          </label>
          <input
            type="color"
            value={theme.secondaryColor || '#6c757d'}
            onChange={e =>
              onThemeChange({ ...theme, secondaryColor: e.target.value })
            }
            style={{
              width: '100%',
              height: '40px',
              border: 'none',
              borderRadius: currentTheme.borderRadius,
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: currentTheme.spacing.xs,
              color: currentTheme.textSecondary,
            }}
          >
            Border Radius
          </label>
          <select
            value={theme.borderRadius || '8px'}
            onChange={e =>
              onThemeChange({ ...theme, borderRadius: e.target.value })
            }
            style={{
              width: '100%',
              padding: currentTheme.spacing.sm,
              border: `1px solid ${currentTheme.borderColor}`,
              borderRadius: currentTheme.borderRadius,
              backgroundColor: currentTheme.backgroundColor,
            }}
          >
            <option value="0px">None (0px)</option>
            <option value="4px">Small (4px)</option>
            <option value="8px">Medium (8px)</option>
            <option value="12px">Large (12px)</option>
            <option value="16px">Extra Large (16px)</option>
            <option value="50%">Rounded (50%)</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: currentTheme.spacing.xs,
              color: currentTheme.textSecondary,
            }}
          >
            Font Family
          </label>
          <select
            value={theme.fontFamily || currentTheme.fontFamily}
            onChange={e =>
              onThemeChange({ ...theme, fontFamily: e.target.value })
            }
            style={{
              width: '100%',
              padding: currentTheme.spacing.sm,
              border: `1px solid ${currentTheme.borderColor}`,
              borderRadius: currentTheme.borderRadius,
              backgroundColor: currentTheme.backgroundColor,
            }}
          >
            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
              System Default
            </option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Helvetica Neue', Helvetica, sans-serif">
              Helvetica
            </option>
            <option value="'Times New Roman', Times, serif">
              Times New Roman
            </option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', Courier, monospace">
              Courier New
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * Main example component with theme provider
 */
export const ThemeExample: React.FC = () => {
  const [customTheme, setCustomTheme] = useState<Partial<ThemeConfiguration>>({
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    borderRadius: '8px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
      }}
    >
      <ThemeProvider theme={customTheme}>
        <ThemeControls theme={customTheme} onThemeChange={setCustomTheme} />
        <ThemedComponent />
      </ThemeProvider>
    </div>
  );
};

export default ThemeExample;
