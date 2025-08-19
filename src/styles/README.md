# Theme System Documentation

This document explains how to use the theme system and CSS-in-JS styling utilities in the AWS Connect Chat Widget.

## Overview

The theme system provides:
- Consistent design tokens (colors, typography, spacing, etc.)
- Responsive design utilities
- Accessibility support (high contrast, reduced motion)
- CSS-in-JS styling with theme integration
- CSS custom properties for easy customization

## Basic Usage

### 1. ThemeProvider

Wrap your application with the `ThemeProvider` to provide theme context:

```tsx
import { ThemeProvider } from './components/ThemeProvider';

const App = () => {
  const customTheme = {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '8px'
  };

  return (
    <ThemeProvider theme={customTheme}>
      <YourComponents />
    </ThemeProvider>
  );
};
```

### 2. Using Theme in Components

```tsx
import { useTheme } from './components/ThemeProvider';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <div style={{ 
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
      padding: theme.spacing.md 
    }}>
      Themed content
    </div>
  );
};
```

### 3. CSS-in-JS Styling

```tsx
import { useStyles } from './utils/styled';
import type { StyleDefinition } from './utils/styled';

const MyStyledComponent = () => {
  const theme = useTheme();
  
  const styles: StyleDefinition = {
    base: {
      backgroundColor: theme.primaryColor,
      color: theme.textOnPrimary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius
    },
    states: {
      hover: {
        backgroundColor: theme.primaryColorHover
      }
    },
    responsive: {
      mobile: {
        padding: theme.spacing.sm
      }
    }
  };
  
  const className = useStyles(styles, theme);
  
  return <div className={className}>Styled content</div>;
};
```

## Theme Configuration

### Available Theme Properties

```typescript
interface ThemeConfiguration {
  primaryColor: string;        // Main brand color
  secondaryColor: string;      // Secondary brand color
  fontFamily: string;          // Font family
  borderRadius: string;        // Border radius for components
}
```

### Extended Theme Properties

The theme system automatically computes additional properties:

```typescript
interface ExtendedTheme extends ThemeConfiguration {
  // Computed colors
  primaryColorRgb: string;
  primaryColorHover: string;
  primaryColorActive: string;
  textOnPrimary: string;
  textOnSecondary: string;
  
  // Semantic colors
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  
  // Spacing scale
  spacing: {
    xs: string;    // 4px
    sm: string;    // 8px
    md: string;    // 16px
    lg: string;    // 24px
    xl: string;    // 32px
  };
  
  // Typography scale
  typography: {
    fontSize: {
      xs: string;  // 12px
      sm: string;  // 14px
      md: string;  // 16px
      lg: string;  // 18px
      xl: string;  // 20px
    };
    fontWeight: {
      normal: string;    // 400
      medium: string;    // 500
      semibold: string;  // 600
      bold: string;      // 700
    };
  };
  
  // And many more...
}
```

## CSS Custom Properties

The theme system automatically generates CSS custom properties:

```css
:root {
  --chat-primary-color: #007bff;
  --chat-secondary-color: #6c757d;
  --chat-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --chat-border-radius: 8px;
  --chat-spacing-xs: 4px;
  --chat-spacing-sm: 8px;
  --chat-spacing-md: 16px;
  /* ... and many more */
}
```

You can use these in regular CSS:

```css
.my-component {
  background-color: var(--chat-primary-color);
  padding: var(--chat-spacing-md);
  border-radius: var(--chat-border-radius);
  font-family: var(--chat-font-family);
}
```

## Responsive Design

### Using Responsive Hooks

```tsx
import { useResponsive } from './components/ThemeProvider';

const ResponsiveComponent = () => {
  const responsive = useResponsive();
  
  return (
    <div>
      <style>
        {`
          .responsive-element {
            padding: 20px;
          }
          
          ${responsive.mobile} {
            .responsive-element {
              padding: 10px;
            }
          }
        `}
      </style>
      <div className="responsive-element">Content</div>
    </div>
  );
};
```

### Responsive Styles in CSS-in-JS

```tsx
const styles: StyleDefinition = {
  base: {
    padding: theme.spacing.lg
  },
  responsive: {
    mobile: {
      padding: theme.spacing.sm
    },
    tablet: {
      padding: theme.spacing.md
    }
  }
};
```

### CSS Utility Classes

```html
<!-- Hide on mobile -->
<div class="chat-hide-mobile">Desktop only content</div>

<!-- Show only on mobile -->
<div class="chat-show-mobile">Mobile only content</div>

<!-- Responsive text size -->
<span class="chat-text--responsive">Responsive text</span>
```

## Accessibility

### High Contrast Support

```tsx
import { useHighContrast } from './components/ThemeProvider';

const AccessibleComponent = () => {
  const isHighContrast = useHighContrast();
  
  return (
    <div style={{
      border: isHighContrast ? '2px solid' : '1px solid',
      borderColor: theme.borderColor
    }}>
      Content with high contrast support
    </div>
  );
};
```

### Reduced Motion Support

```tsx
import { useReducedMotion } from './components/ThemeProvider';

const AnimatedComponent = () => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div style={{
      transition: prefersReducedMotion ? 'none' : 'all 0.3s ease'
    }}>
      Respects motion preferences
    </div>
  );
};
```

## Styling Utilities

### Common Style Patterns

```tsx
import { commonStyles } from './utils/styled';

// Flexbox utilities
const flexStyles = {
  ...commonStyles.flex.center,     // display: flex, align-items: center, justify-content: center
  ...commonStyles.flex.column,     // display: flex, flex-direction: column
  ...commonStyles.flex.spaceBetween // display: flex, justify-content: space-between
};

// Text utilities
const textStyles = {
  ...commonStyles.text.center,   // text-align: center
  ...commonStyles.text.ellipsis  // overflow: hidden, text-overflow: ellipsis, white-space: nowrap
};
```

### Button Styles

```tsx
import { createButtonStyles } from './utils/styled';

const MyButton = () => {
  const theme = useTheme();
  const buttonStyles = createButtonStyles(theme);
  const className = useStyles(buttonStyles, theme);
  
  return <button className={className}>Styled Button</button>;
};
```

### Style Variants

```tsx
import { useVariants } from './utils/styled';

const ButtonWithVariants = ({ variant = 'primary' }) => {
  const theme = useTheme();
  
  const variants = {
    primary: {
      backgroundColor: theme.primaryColor,
      color: theme.textOnPrimary
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.primaryColor,
      border: `1px solid ${theme.primaryColor}`
    }
  };
  
  const variantClasses = useVariants(variants, theme);
  
  return (
    <button className={`base-button ${variantClasses[variant]}`}>
      Button
    </button>
  );
};
```

## Best Practices

### 1. Use Theme Tokens

Always use theme tokens instead of hardcoded values:

```tsx
// ❌ Don't do this
const styles = {
  color: '#007bff',
  padding: '16px',
  fontSize: '14px'
};

// ✅ Do this
const styles = {
  color: theme.primaryColor,
  padding: theme.spacing.md,
  fontSize: theme.typography.fontSize.sm
};
```

### 2. Responsive Design

Design mobile-first and use responsive utilities:

```tsx
const styles: StyleDefinition = {
  base: {
    // Mobile-first styles
    fontSize: theme.typography.fontSize.sm,
    padding: theme.spacing.sm
  },
  responsive: {
    desktop: {
      // Desktop overrides
      fontSize: theme.typography.fontSize.md,
      padding: theme.spacing.md
    }
  }
};
```

### 3. Accessibility

Always consider accessibility:

```tsx
const AccessibleButton = () => {
  const theme = useTheme();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <button
      style={{
        backgroundColor: theme.primaryColor,
        color: theme.textOnPrimary,
        border: isHighContrast ? '2px solid' : '1px solid',
        transition: prefersReducedMotion ? 'none' : 'all 0.3s ease'
      }}
      aria-label="Accessible button"
    >
      Button
    </button>
  );
};
```

### 4. Performance

Use `useMemo` for expensive style calculations:

```tsx
const ExpensiveStyledComponent = () => {
  const theme = useTheme();
  
  const complexStyles = useMemo(() => ({
    base: {
      // Complex style calculations
      background: `linear-gradient(45deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
      boxShadow: `0 4px 8px ${theme.primaryColor}33`
    }
  }), [theme.primaryColor, theme.secondaryColor]);
  
  const className = useStyles(complexStyles, theme);
  
  return <div className={className}>Content</div>;
};
```

## Examples

See `src/examples/ThemeExample.tsx` for a comprehensive example of using the theme system.

## Migration Guide

If you're migrating from the old styling system:

1. Wrap your app with `ThemeProvider`
2. Replace hardcoded values with theme tokens
3. Use `useStyles` instead of inline styles where appropriate
4. Update CSS classes to use the new utility classes
5. Test with different themes and accessibility settings