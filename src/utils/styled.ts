/**
 * CSS-in-JS Styling Utilities
 * Provides utilities for creating styled components with theme support
 * Supports requirements 5.1, 5.2, 5.4, 6.1, 6.2
 */

import React from 'react';
import type { ExtendedTheme } from '../components/ThemeProvider';

/**
 * Style function type that receives theme and returns CSS properties
 */
export type StyleFunction = (theme: ExtendedTheme) => React.CSSProperties;

/**
 * Style object that can be either static CSS properties or a function
 */
export type StyleObject = React.CSSProperties | StyleFunction;

/**
 * Responsive style breakpoints
 */
export interface ResponsiveStyles {
  mobile?: StyleObject;
  tablet?: StyleObject;
  desktop?: StyleObject;
}

/**
 * Style variants for component states
 */
export interface StyleVariants {
  [key: string]: StyleObject;
}

/**
 * Complete style definition with base, responsive, and variant styles
 */
export interface StyleDefinition {
  base?: StyleObject;
  responsive?: ResponsiveStyles;
  variants?: StyleVariants;
  states?: {
    hover?: StyleObject;
    focus?: StyleObject;
    active?: StyleObject;
    disabled?: StyleObject;
  };
}

/**
 * CSS-in-JS class names generator
 */
class StyleSheet {
  private static instance: StyleSheet;
  private styleElement: HTMLStyleElement | null = null;
  private classCounter = 0;
  private generatedStyles = new Map<string, string>();

  private constructor() {
    if (typeof document !== 'undefined') {
      this.styleElement = document.createElement('style');
      this.styleElement.setAttribute('data-chat-styles', '');
      document.head.appendChild(this.styleElement);
    }
  }

  static getInstance(): StyleSheet {
    if (!StyleSheet.instance) {
      StyleSheet.instance = new StyleSheet();
    }
    return StyleSheet.instance;
  }

  /**
   * Generate a unique class name
   */
  private generateClassName(): string {
    return `chat-styled-${++this.classCounter}`;
  }

  /**
   * Convert CSS properties object to CSS string
   */
  private cssPropertiesToString(properties: React.CSSProperties): string {
    return Object.entries(properties)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join(' ');
  }

  /**
   * Create CSS rule string
   */
  private createCSSRule(className: string, properties: React.CSSProperties, pseudoClass?: string): string {
    const selector = pseudoClass ? `.${className}:${pseudoClass}` : `.${className}`;
    const cssString = this.cssPropertiesToString(properties);
    return `${selector} { ${cssString} }`;
  }

  /**
   * Create responsive CSS rule
   */
  private createResponsiveCSSRule(
    className: string, 
    properties: React.CSSProperties, 
    breakpoint: string
  ): string {
    const cssString = this.cssPropertiesToString(properties);
    return `@media (max-width: ${breakpoint}) { .${className} { ${cssString} } }`;
  }

  /**
   * Add CSS rules to the stylesheet
   */
  private addCSSRules(rules: string[]): void {
    if (this.styleElement) {
      const existingCSS = this.styleElement.textContent || '';
      const newCSS = rules.join('\n');
      this.styleElement.textContent = existingCSS + '\n' + newCSS;
    }
  }

  /**
   * Create styled component with theme support
   */
  createStyledComponent(styleDefinition: StyleDefinition, theme: ExtendedTheme): string {
    const className = this.generateClassName();
    const rules: string[] = [];

    // Process base styles
    if (styleDefinition.base) {
      const baseStyles = typeof styleDefinition.base === 'function' 
        ? styleDefinition.base(theme) 
        : styleDefinition.base;
      rules.push(this.createCSSRule(className, baseStyles));
    }

    // Process state styles
    if (styleDefinition.states) {
      Object.entries(styleDefinition.states).forEach(([state, styleObject]) => {
        if (styleObject) {
          const stateStyles = typeof styleObject === 'function' 
            ? styleObject(theme) 
            : styleObject;
          rules.push(this.createCSSRule(className, stateStyles, state));
        }
      });
    }

    // Process responsive styles
    if (styleDefinition.responsive) {
      if (styleDefinition.responsive.mobile) {
        const mobileStyles = typeof styleDefinition.responsive.mobile === 'function'
          ? styleDefinition.responsive.mobile(theme)
          : styleDefinition.responsive.mobile;
        rules.push(this.createResponsiveCSSRule(className, mobileStyles, theme.breakpoints.mobile));
      }

      if (styleDefinition.responsive.tablet) {
        const tabletStyles = typeof styleDefinition.responsive.tablet === 'function'
          ? styleDefinition.responsive.tablet(theme)
          : styleDefinition.responsive.tablet;
        rules.push(this.createResponsiveCSSRule(className, tabletStyles, theme.breakpoints.tablet));
      }

      if (styleDefinition.responsive.desktop) {
        const desktopStyles = typeof styleDefinition.responsive.desktop === 'function'
          ? styleDefinition.responsive.desktop(theme)
          : styleDefinition.responsive.desktop;
        rules.push(`@media (min-width: ${theme.breakpoints.desktop}) { .${className} { ${this.cssPropertiesToString(desktopStyles)} } }`);
      }
    }

    // Add rules to stylesheet
    this.addCSSRules(rules);

    return className;
  }

  /**
   * Create variant classes
   */
  createVariantClasses(variants: StyleVariants, theme: ExtendedTheme): Record<string, string> {
    const variantClasses: Record<string, string> = {};

    Object.entries(variants).forEach(([variantName, styleObject]) => {
      const className = this.generateClassName();
      const styles = typeof styleObject === 'function' 
        ? styleObject(theme) 
        : styleObject;
      
      const rule = this.createCSSRule(className, styles);
      this.addCSSRules([rule]);
      
      variantClasses[variantName] = className;
    });

    return variantClasses;
  }
}

/**
 * Create a styled component hook
 */
export const useStyles = (styleDefinition: StyleDefinition, theme: ExtendedTheme): string => {
  const styleSheet = StyleSheet.getInstance();
  return React.useMemo(() => {
    return styleSheet.createStyledComponent(styleDefinition, theme);
  }, [styleDefinition, theme]);
};

/**
 * Create variant classes hook
 */
export const useVariants = (variants: StyleVariants, theme: ExtendedTheme): Record<string, string> => {
  const styleSheet = StyleSheet.getInstance();
  return React.useMemo(() => {
    return styleSheet.createVariantClasses(variants, theme);
  }, [variants, theme]);
};

/**
 * Utility function to merge class names
 */
export const mergeClassNames = (...classNames: (string | undefined | null | false)[]): string => {
  return classNames.filter(Boolean).join(' ');
};

/**
 * Create responsive styles utility
 */
export const createResponsiveStyles = (
  mobile: React.CSSProperties,
  tablet?: React.CSSProperties,
  desktop?: React.CSSProperties
): ResponsiveStyles => {
  return {
    mobile,
    tablet,
    desktop
  };
};

/**
 * Create theme-based styles utility
 */
export const createThemeStyles = (styleFunction: StyleFunction): StyleFunction => {
  return styleFunction;
};

/**
 * Predefined common style patterns
 */
export const commonStyles = {
  /**
   * Flexbox utilities
   */
  flex: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    column: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    row: {
      display: 'flex',
      flexDirection: 'row' as const
    },
    spaceBetween: {
      display: 'flex',
      justifyContent: 'space-between'
    },
    alignCenter: {
      display: 'flex',
      alignItems: 'center'
    }
  },

  /**
   * Position utilities
   */
  position: {
    absolute: {
      position: 'absolute' as const
    },
    relative: {
      position: 'relative' as const
    },
    fixed: {
      position: 'fixed' as const
    },
    sticky: {
      position: 'sticky' as const
    }
  },

  /**
   * Text utilities
   */
  text: {
    center: {
      textAlign: 'center' as const
    },
    left: {
      textAlign: 'left' as const
    },
    right: {
      textAlign: 'right' as const
    },
    ellipsis: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const
    }
  },

  /**
   * Visibility utilities
   */
  visibility: {
    hidden: {
      visibility: 'hidden' as const
    },
    visible: {
      visibility: 'visible' as const
    },
    srOnly: {
      position: 'absolute' as const,
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap' as const,
      border: '0'
    }
  },

  /**
   * Animation utilities
   */
  animation: {
    fadeIn: (theme: ExtendedTheme) => ({
      animation: `chat-fade-in ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}`
    }),
    slideUp: (theme: ExtendedTheme) => ({
      animation: `chat-slide-up ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}`
    }),
    bounce: (theme: ExtendedTheme) => ({
      animation: `chat-bounce ${theme.animation.duration.slow} ${theme.animation.easing.easeInOut}`
    })
  }
};

/**
 * Create button styles with variants
 */
export const createButtonStyles = (theme: ExtendedTheme): StyleDefinition => ({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: '1px solid transparent',
    borderRadius: theme.borderRadius,
    fontFamily: theme.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `all ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}`,
    userSelect: 'none',
    outline: 'none'
  },
  states: {
    'focus-visible': {
      boxShadow: `0 0 0 2px ${theme.primaryColor}`
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  responsive: {
    mobile: {
      fontSize: theme.typography.fontSize.xs,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`
    }
  }
});

/**
 * Create input styles
 */
export const createInputStyles = (theme: ExtendedTheme): StyleDefinition => ({
  base: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: theme.borderRadius,
    fontFamily: theme.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    color: theme.textPrimary,
    backgroundColor: theme.backgroundColor,
    transition: `border-color ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}, box-shadow ${theme.animation.duration.normal} ${theme.animation.easing.easeInOut}`,
    outline: 'none'
  },
  states: {
    focus: {
      borderColor: theme.primaryColor,
      boxShadow: `0 0 0 2px rgba(${theme.primaryColorRgb}, 0.25)`
    },
    disabled: {
      backgroundColor: theme.surfaceColor,
      color: theme.textDisabled,
      cursor: 'not-allowed'
    }
  }
});

/**
 * Create card/surface styles
 */
export const createSurfaceStyles = (theme: ExtendedTheme): StyleDefinition => ({
  base: {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: theme.borderRadius,
    boxShadow: theme.shadowSmall
  }
});

export default {
  useStyles,
  useVariants,
  mergeClassNames,
  createResponsiveStyles,
  createThemeStyles,
  commonStyles,
  createButtonStyles,
  createInputStyles,
  createSurfaceStyles
};