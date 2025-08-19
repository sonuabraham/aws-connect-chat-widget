/**
 * ThemeProvider Component Tests
 * Tests for theme system and CSS-in-JS styling
 * Supports requirements 5.1, 5.2, 5.4, 6.1, 6.2
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  ThemeProvider,
  useTheme,
  useResponsive,
  useHighContrast,
  useReducedMotion,
  defaultTheme,
  withTheme,
} from './ThemeProvider';
import type { ThemeConfiguration } from '../types';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Test component that uses theme
const TestComponent: React.FC = () => {
  const theme = useTheme();
  return (
    <div data-testid="test-component">
      <span data-testid="primary-color">{theme.primaryColor}</span>
      <span data-testid="font-family">{theme.fontFamily}</span>
      <span data-testid="border-radius">{theme.borderRadius}</span>
    </div>
  );
};

// Test component for responsive hook
const ResponsiveTestComponent: React.FC = () => {
  const responsive = useResponsive();
  return (
    <div data-testid="responsive-component">
      <span data-testid="mobile-query">{responsive.mobile}</span>
      <span data-testid="tablet-query">{responsive.tablet}</span>
      <span data-testid="desktop-query">{responsive.desktop}</span>
    </div>
  );
};

// Test component for high contrast hook
const HighContrastTestComponent: React.FC = () => {
  const isHighContrast = useHighContrast();
  return (
    <div data-testid="high-contrast-component">
      <span data-testid="high-contrast-value">{isHighContrast.toString()}</span>
    </div>
  );
};

// Test component for reduced motion hook
const ReducedMotionTestComponent: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div data-testid="reduced-motion-component">
      <span data-testid="reduced-motion-value">
        {prefersReducedMotion.toString()}
      </span>
    </div>
  );
};

// Test component with withTheme HOC
const ComponentWithTheme = withTheme<{}>(({ theme }) => (
  <div data-testid="with-theme-component">
    <span data-testid="hoc-primary-color">{theme.primaryColor}</span>
  </div>
));

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset document head
    document.head.innerHTML = '';

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => mockMatchMedia(false)),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Theme Functionality', () => {
    it('provides default theme when no theme prop is passed', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-color')).toHaveTextContent(
        defaultTheme.primaryColor
      );
      expect(screen.getByTestId('font-family')).toHaveTextContent(
        defaultTheme.fontFamily
      );
      expect(screen.getByTestId('border-radius')).toHaveTextContent(
        defaultTheme.borderRadius
      );
    });

    it('merges custom theme with default theme', () => {
      const customTheme: Partial<ThemeConfiguration> = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      };

      render(
        <ThemeProvider theme={customTheme}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
      // Should still have default font family
      expect(screen.getByTestId('font-family')).toHaveTextContent(
        defaultTheme.fontFamily
      );
    });

    it('applies CSS custom properties to the DOM', () => {
      const customTheme: Partial<ThemeConfiguration> = {
        primaryColor: '#ff0000',
      };

      render(
        <ThemeProvider theme={customTheme}>
          <TestComponent />
        </ThemeProvider>
      );

      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--chat-primary-color')).toBe(
        '#ff0000'
      );
    });

    it('removes CSS custom properties on unmount', () => {
      const customTheme: Partial<ThemeConfiguration> = {
        primaryColor: '#ff0000',
      };

      const { unmount } = render(
        <ThemeProvider theme={customTheme}>
          <TestComponent />
        </ThemeProvider>
      );

      // Properties should be set
      expect(
        document.documentElement.style.getPropertyValue('--chat-primary-color')
      ).toBe('#ff0000');

      unmount();

      // Properties should be removed
      expect(
        document.documentElement.style.getPropertyValue('--chat-primary-color')
      ).toBe('');
    });

    it('applies className to the provider wrapper', () => {
      render(
        <ThemeProvider className="custom-theme-class">
          <TestComponent />
        </ThemeProvider>
      );

      expect(
        document.querySelector('.chat-theme-provider.custom-theme-class')
      ).toBeInTheDocument();
    });
  });

  describe('Extended Theme Properties', () => {
    it('computes extended theme properties correctly', () => {
      const TestExtendedComponent: React.FC = () => {
        const theme = useTheme();
        return (
          <div>
            <span data-testid="primary-rgb">{theme.primaryColorRgb}</span>
            <span data-testid="text-on-primary">{theme.textOnPrimary}</span>
            <span data-testid="success-color">{theme.successColor}</span>
            <span data-testid="spacing-md">{theme.spacing.md}</span>
            <span data-testid="font-size-sm">
              {theme.typography.fontSize.sm}
            </span>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestExtendedComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-rgb')).toHaveTextContent(
        '0, 123, 255'
      );
      expect(screen.getByTestId('text-on-primary')).toHaveTextContent(
        '#ffffff'
      );
      expect(screen.getByTestId('success-color')).toHaveTextContent('#28a745');
      expect(screen.getByTestId('spacing-md')).toHaveTextContent('16px');
      expect(screen.getByTestId('font-size-sm')).toHaveTextContent('14px');
    });

    it('computes hover and active colors correctly', () => {
      const TestColorComponent: React.FC = () => {
        const theme = useTheme();
        return (
          <div>
            <span data-testid="primary-hover">{theme.primaryColorHover}</span>
            <span data-testid="primary-active">{theme.primaryColorActive}</span>
          </div>
        );
      };

      render(
        <ThemeProvider theme={{ primaryColor: '#007bff' }}>
          <TestColorComponent />
        </ThemeProvider>
      );

      // Should be darker versions of the primary color
      expect(screen.getByTestId('primary-hover')).not.toHaveTextContent(
        '#007bff'
      );
      expect(screen.getByTestId('primary-active')).not.toHaveTextContent(
        '#007bff'
      );
    });
  });

  describe('useTheme Hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('returns extended theme object', () => {
      const TestThemePropsComponent: React.FC = () => {
        const theme = useTheme();

        // Test that extended properties exist
        expect(theme).toHaveProperty('primaryColorRgb');
        expect(theme).toHaveProperty('spacing');
        expect(theme).toHaveProperty('typography');
        expect(theme).toHaveProperty('breakpoints');
        expect(theme).toHaveProperty('animation');

        return <div data-testid="theme-props-test">Theme props exist</div>;
      };

      render(
        <ThemeProvider>
          <TestThemePropsComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-props-test')).toBeInTheDocument();
    });
  });

  describe('useResponsive Hook', () => {
    it('provides responsive utilities', () => {
      render(
        <ThemeProvider>
          <ResponsiveTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mobile-query')).toHaveTextContent(
        '@media (max-width: 768px)'
      );
      expect(screen.getByTestId('tablet-query')).toHaveTextContent(
        '@media (max-width: 1024px)'
      );
      expect(screen.getByTestId('desktop-query')).toHaveTextContent(
        '@media (min-width: 1200px)'
      );
    });

    it('provides media query functions', () => {
      const TestResponsiveFunctionsComponent: React.FC = () => {
        const responsive = useResponsive();

        // Mock window.matchMedia for testing
        window.matchMedia = vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }));

        return (
          <div>
            <span data-testid="is-mobile">
              {responsive.isMobile().toString()}
            </span>
            <span data-testid="is-tablet">
              {responsive.isTablet().toString()}
            </span>
            <span data-testid="is-desktop">
              {responsive.isDesktop().toString()}
            </span>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestResponsiveFunctionsComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    });
  });

  describe('useHighContrast Hook', () => {
    it('detects high contrast preference', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(prefers-contrast: high)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      render(<HighContrastTestComponent />);

      expect(screen.getByTestId('high-contrast-value')).toHaveTextContent(
        'true'
      );
    });

    it('updates when high contrast preference changes', () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(prefers-contrast: high)') {
          return {
            ...mockMatchMedia(false),
            addEventListener: vi.fn((event, callback) => {
              if (event === 'change') {
                mediaQueryCallback = callback;
              }
            }),
            removeEventListener: vi.fn(),
          };
        }
        return mockMatchMedia(false);
      });

      render(<HighContrastTestComponent />);

      expect(screen.getByTestId('high-contrast-value')).toHaveTextContent(
        'false'
      );

      // Simulate media query change
      if (mediaQueryCallback) {
        act(() => {
          mediaQueryCallback({ matches: true } as MediaQueryListEvent);
        });
      }

      expect(screen.getByTestId('high-contrast-value')).toHaveTextContent(
        'true'
      );
    });
  });

  describe('useReducedMotion Hook', () => {
    it('detects reduced motion preference', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      render(<ReducedMotionTestComponent />);

      expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent(
        'true'
      );
    });

    it('updates when reduced motion preference changes', () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            ...mockMatchMedia(false),
            addEventListener: vi.fn((event, callback) => {
              if (event === 'change') {
                mediaQueryCallback = callback;
              }
            }),
            removeEventListener: vi.fn(),
          };
        }
        return mockMatchMedia(false);
      });

      render(<ReducedMotionTestComponent />);

      expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent(
        'false'
      );

      // Simulate media query change
      if (mediaQueryCallback) {
        act(() => {
          mediaQueryCallback({ matches: true } as MediaQueryListEvent);
        });
      }

      expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent(
        'true'
      );
    });
  });

  describe('withTheme HOC', () => {
    it('injects theme prop into wrapped component', () => {
      render(
        <ThemeProvider theme={{ primaryColor: '#ff0000' }}>
          <ComponentWithTheme />
        </ThemeProvider>
      );

      expect(screen.getByTestId('hoc-primary-color')).toHaveTextContent(
        '#ff0000'
      );
    });

    it('sets correct display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withTheme(TestComponent);
      expect(WrappedComponent.displayName).toBe('withTheme(TestComponent)');
    });

    it('uses component name when displayName is not available', () => {
      const TestComponent = () => <div>Test</div>;

      const WrappedComponent = withTheme(TestComponent);
      expect(WrappedComponent.displayName).toBe('withTheme(TestComponent)');
    });
  });

  describe('Theme Updates', () => {
    it('updates theme when theme prop changes', () => {
      const { rerender } = render(
        <ThemeProvider theme={{ primaryColor: '#ff0000' }}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');

      rerender(
        <ThemeProvider theme={{ primaryColor: '#00ff00' }}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-color')).toHaveTextContent('#00ff00');
    });

    it('updates CSS custom properties when theme changes', () => {
      const { rerender } = render(
        <ThemeProvider theme={{ primaryColor: '#ff0000' }}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(
        document.documentElement.style.getPropertyValue('--chat-primary-color')
      ).toBe('#ff0000');

      rerender(
        <ThemeProvider theme={{ primaryColor: '#00ff00' }}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(
        document.documentElement.style.getPropertyValue('--chat-primary-color')
      ).toBe('#00ff00');
    });
  });

  describe('Color Utilities', () => {
    it('computes correct contrast colors', () => {
      const TestContrastComponent: React.FC = () => {
        const theme = useTheme();
        return (
          <div>
            <span data-testid="light-contrast">{theme.textOnPrimary}</span>
          </div>
        );
      };

      // Test with light color (should return dark text)
      const { rerender } = render(
        <ThemeProvider theme={{ primaryColor: '#ffffff' }}>
          <TestContrastComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('light-contrast')).toHaveTextContent('#000000');

      // Test with dark color (should return light text)
      rerender(
        <ThemeProvider theme={{ primaryColor: '#000000' }}>
          <TestContrastComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('light-contrast')).toHaveTextContent('#ffffff');
    });
  });
});
