/**
 * ThemeProvider Component
 * Provides theme context and CSS custom properties for widget styling
 * Supports requirements 5.1, 5.2, 5.4, 6.1, 6.2
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ThemeConfiguration, ResponsiveBreakpoints } from '../types';

/**
 * Default theme configuration
 */
export const defaultTheme: ThemeConfiguration = {
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: '8px',
};

/**
 * Responsive breakpoints for mobile/desktop
 */
export const breakpoints: ResponsiveBreakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px',
};

/**
 * Extended theme with computed values and utilities
 */
export interface ExtendedTheme extends ThemeConfiguration {
  // Computed colors
  primaryColorRgb: string;
  secondaryColorRgb: string;
  primaryColorHover: string;
  primaryColorActive: string;

  // Accessibility colors
  textOnPrimary: string;
  textOnSecondary: string;

  // Semantic colors
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;

  // Background colors
  backgroundColor: string;
  surfaceColor: string;
  overlayColor: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;

  // Border colors
  borderColor: string;
  borderColorHover: string;

  // Shadow values
  shadowSmall: string;
  shadowMedium: string;
  shadowLarge: string;

  // Spacing scale
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // Typography scale
  typography: {
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };

  // Breakpoints
  breakpoints: ResponsiveBreakpoints;

  // Animation values
  animation: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

/**
 * Theme context
 */
const ThemeContext = createContext<ExtendedTheme | null>(null);

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  theme?: Partial<ThemeConfiguration>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Utility functions for color manipulation
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
};

const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Create extended theme with computed values
 */
const createExtendedTheme = (theme: ThemeConfiguration): ExtendedTheme => {
  const primaryColorRgb = hexToRgb(theme.primaryColor);
  const secondaryColorRgb = hexToRgb(theme.secondaryColor);

  return {
    ...theme,

    // Computed colors
    primaryColorRgb,
    secondaryColorRgb,
    primaryColorHover: adjustBrightness(theme.primaryColor, -10),
    primaryColorActive: adjustBrightness(theme.primaryColor, -20),

    // Accessibility colors
    textOnPrimary: getContrastColor(theme.primaryColor),
    textOnSecondary: getContrastColor(theme.secondaryColor),

    // Semantic colors
    successColor: '#28a745',
    warningColor: '#ffc107',
    errorColor: '#dc3545',
    infoColor: '#17a2b8',

    // Background colors
    backgroundColor: '#ffffff',
    surfaceColor: '#f8f9fa',
    overlayColor: 'rgba(0, 0, 0, 0.5)',

    // Text colors
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textDisabled: '#adb5bd',

    // Border colors
    borderColor: '#dee2e6',
    borderColorHover: '#ced4da',

    // Shadow values
    shadowSmall: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    shadowMedium:
      '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
    shadowLarge:
      '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',

    // Spacing scale
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },

    // Typography scale
    typography: {
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.2',
        normal: '1.5',
        relaxed: '1.7',
      },
    },

    // Breakpoints
    breakpoints,

    // Animation values
    animation: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    },
  };
};

/**
 * Generate CSS custom properties from theme
 */
const generateCSSCustomProperties = (
  theme: ExtendedTheme
): Record<string, string> => {
  return {
    // Colors
    '--chat-primary-color': theme.primaryColor,
    '--chat-primary-color-rgb': theme.primaryColorRgb,
    '--chat-primary-color-hover': theme.primaryColorHover,
    '--chat-primary-color-active': theme.primaryColorActive,
    '--chat-secondary-color': theme.secondaryColor,
    '--chat-secondary-color-rgb': theme.secondaryColorRgb,
    '--chat-text-on-primary': theme.textOnPrimary,
    '--chat-text-on-secondary': theme.textOnSecondary,

    // Semantic colors
    '--chat-success-color': theme.successColor,
    '--chat-warning-color': theme.warningColor,
    '--chat-error-color': theme.errorColor,
    '--chat-info-color': theme.infoColor,

    // Background colors
    '--chat-background-color': theme.backgroundColor,
    '--chat-surface-color': theme.surfaceColor,
    '--chat-overlay-color': theme.overlayColor,

    // Text colors
    '--chat-text-primary': theme.textPrimary,
    '--chat-text-secondary': theme.textSecondary,
    '--chat-text-disabled': theme.textDisabled,

    // Border colors
    '--chat-border-color': theme.borderColor,
    '--chat-border-color-hover': theme.borderColorHover,

    // Typography
    '--chat-font-family': theme.fontFamily,
    '--chat-font-size-xs': theme.typography.fontSize.xs,
    '--chat-font-size-sm': theme.typography.fontSize.sm,
    '--chat-font-size-md': theme.typography.fontSize.md,
    '--chat-font-size-lg': theme.typography.fontSize.lg,
    '--chat-font-size-xl': theme.typography.fontSize.xl,
    '--chat-font-weight-normal': theme.typography.fontWeight.normal,
    '--chat-font-weight-medium': theme.typography.fontWeight.medium,
    '--chat-font-weight-semibold': theme.typography.fontWeight.semibold,
    '--chat-font-weight-bold': theme.typography.fontWeight.bold,
    '--chat-line-height-tight': theme.typography.lineHeight.tight,
    '--chat-line-height-normal': theme.typography.lineHeight.normal,
    '--chat-line-height-relaxed': theme.typography.lineHeight.relaxed,

    // Spacing
    '--chat-spacing-xs': theme.spacing.xs,
    '--chat-spacing-sm': theme.spacing.sm,
    '--chat-spacing-md': theme.spacing.md,
    '--chat-spacing-lg': theme.spacing.lg,
    '--chat-spacing-xl': theme.spacing.xl,

    // Border radius
    '--chat-border-radius': theme.borderRadius,
    '--chat-border-radius-sm': `calc(${theme.borderRadius} * 0.5)`,
    '--chat-border-radius-lg': `calc(${theme.borderRadius} * 1.5)`,

    // Shadows
    '--chat-shadow-small': theme.shadowSmall,
    '--chat-shadow-medium': theme.shadowMedium,
    '--chat-shadow-large': theme.shadowLarge,

    // Animation
    '--chat-animation-duration-fast': theme.animation.duration.fast,
    '--chat-animation-duration-normal': theme.animation.duration.normal,
    '--chat-animation-duration-slow': theme.animation.duration.slow,
    '--chat-animation-easing': theme.animation.easing.easeInOut,

    // Breakpoints
    '--chat-breakpoint-mobile': theme.breakpoints.mobile,
    '--chat-breakpoint-tablet': theme.breakpoints.tablet,
    '--chat-breakpoint-desktop': theme.breakpoints.desktop,
  };
};

/**
 * Theme provider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme = {},
  children,
  className = '',
}) => {
  // Merge provided theme with defaults
  const mergedTheme = useMemo(() => {
    return createExtendedTheme({ ...defaultTheme, ...theme });
  }, [theme]);

  // Generate CSS custom properties
  const cssProperties = useMemo(() => {
    return generateCSSCustomProperties(mergedTheme);
  }, [mergedTheme]);

  // Apply CSS custom properties to the DOM
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(cssProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Cleanup function to remove properties when component unmounts
    return () => {
      Object.keys(cssProperties).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [cssProperties]);

  return (
    <ThemeContext.Provider value={mergedTheme}>
      <div
        className={`chat-theme-provider ${className}`}
        style={cssProperties as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ExtendedTheme => {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return theme;
};

/**
 * Hook to generate responsive styles
 */
export const useResponsive = () => {
  const theme = useTheme();

  return {
    mobile: `@media (max-width: ${theme.breakpoints.mobile})`,
    tablet: `@media (max-width: ${theme.breakpoints.tablet})`,
    desktop: `@media (min-width: ${theme.breakpoints.desktop})`,

    // Utility functions
    isMobile: () =>
      window.matchMedia(`(max-width: ${theme.breakpoints.mobile})`).matches,
    isTablet: () =>
      window.matchMedia(`(max-width: ${theme.breakpoints.tablet})`).matches,
    isDesktop: () =>
      window.matchMedia(`(min-width: ${theme.breakpoints.desktop})`).matches,
  };
};

/**
 * Hook for high contrast mode detection
 */
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
};

/**
 * Hook for reduced motion detection
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * Utility function to create CSS-in-JS styles with theme
 */
export const createStyles = (
  stylesFn: (theme: ExtendedTheme) => Record<string, React.CSSProperties>
) => {
  return (theme: ExtendedTheme) => stylesFn(theme);
};

/**
 * Higher-order component to inject theme
 */
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ExtendedTheme }>
) => {
  const WrappedComponent = (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };

  WrappedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ThemeProvider;
