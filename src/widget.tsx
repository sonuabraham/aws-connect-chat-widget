import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ChatWidget } from './components/ChatWidget';
import { ThemeProvider } from './components/ThemeProvider';
import type { WidgetConfig, WidgetError } from './types/widget';
import './styles/theme.css';

/**
 * Widget initialization options
 */
export interface WidgetInitOptions extends WidgetConfig {
  containerId?: string;
  autoMount?: boolean;
}

/**
 * Widget instance interface for external control
 */
export interface WidgetInstance {
  mount(containerId?: string): void;
  unmount(): void;
  destroy(): void;
  updateConfig(config: Partial<WidgetConfig>): void;
  getState(): any;
  isDestroyed(): boolean;
}

/**
 * Error boundary component for the widget
 */
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: WidgetError) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: WidgetError) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget Error:', error, errorInfo);
    this.props.onError?.({
      code: 'WIDGET_ERROR',
      message: 'An unexpected error occurred in the chat widget',
      details: { error: error.message, stack: error.stack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '300px',
            fontSize: '14px',
            color: '#6c757d',
            zIndex: 1000,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Chat temporarily unavailable
          </div>
          <div>Please refresh the page to try again.</div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default widget configuration
 */
const DEFAULT_CONFIG: WidgetConfig = {
  aws: {
    region: 'us-east-1',
    instanceId: '',
    contactFlowId: '',
    apiGatewayEndpoint: '',
  },
  ui: {
    theme: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '8px',
    },
    position: {
      bottom: '20px',
      right: '20px',
    },
    messages: {
      welcomeMessage: 'Hello! How can we help you today?',
      offlineMessage: 'We are currently offline. Please leave a message.',
      waitingMessage: 'Connecting you to an agent...',
    },
  },
  features: {
    fileUpload: false,
    emojiPicker: false,
    chatRatings: true,
    chatTranscript: true,
  },
};

/**
 * Widget instance implementation
 */
class WidgetInstanceImpl implements WidgetInstance {
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private config: WidgetConfig;
  private destroyed = false;

  constructor(config: WidgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  mount(containerId?: string): void {
    if (this.destroyed) {
      throw new Error('Cannot mount destroyed widget instance');
    }

    if (this.root) {
      console.warn('Widget is already mounted');
      return;
    }

    // Create or find container
    if (containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container element with id "${containerId}" not found`);
      }
    } else {
      // Create default container
      this.container = document.createElement('div');
      this.container.id = 'aws-connect-chat-widget';
      this.container.style.position = 'fixed';
      this.container.style.zIndex = '2147483647'; // Maximum z-index
      this.container.style.pointerEvents = 'none'; // Allow clicks through container
      document.body.appendChild(this.container);
    }

    // Create React root and render
    this.root = createRoot(this.container);
    this.render();
  }

  unmount(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container && this.container.id === 'aws-connect-chat-widget') {
      // Only remove if we created the container
      this.container.remove();
      this.container = null;
    }
  }

  destroy(): void {
    this.unmount();
    this.destroyed = true;
  }

  updateConfig(config: Partial<WidgetConfig>): void {
    if (this.destroyed) {
      throw new Error('Cannot update config of destroyed widget instance');
    }

    this.config = { ...this.config, ...config };
    if (this.root) {
      this.render();
    }
  }

  getState(): any {
    return {
      mounted: !!this.root,
      destroyed: this.destroyed,
      config: this.config,
    };
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private render(): void {
    if (!this.root) return;

    const handleError = (error: WidgetError) => {
      console.error('Widget Error:', error);
      // Could emit to external error handlers here
    };

    this.root.render(
      <React.StrictMode>
        <WidgetErrorBoundary onError={handleError}>
          <ThemeProvider theme={this.config.ui.theme}>
            <ChatWidget config={this.config} onError={handleError} />
          </ThemeProvider>
        </WidgetErrorBoundary>
      </React.StrictMode>
    );
  }
}

/**
 * Initialize the chat widget
 * @param options Widget configuration and initialization options
 * @returns Widget instance for external control
 */
export function initializeWidget(options: WidgetInitOptions): WidgetInstance {
  const { containerId, autoMount = true, ...config } = options;

  // Validate required configuration
  if (!config.aws?.instanceId || !config.aws?.contactFlowId) {
    throw new Error('AWS Connect instanceId and contactFlowId are required');
  }

  const instance = new WidgetInstanceImpl(config);

  if (autoMount) {
    // Mount when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        instance.mount(containerId);
      });
    } else {
      instance.mount(containerId);
    }
  }

  return instance;
}

/**
 * Global widget API for script integration
 */
declare global {
  interface Window {
    AWSConnectChatWidget?: {
      init: typeof initializeWidget;
      version: string;
    };
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.AWSConnectChatWidget = {
    init: initializeWidget,
    version: '1.0.0',
  };
}

export { ChatWidget, ThemeProvider };
export type { WidgetConfig, WidgetError };
