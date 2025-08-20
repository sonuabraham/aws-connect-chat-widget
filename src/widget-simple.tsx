import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ChatWidget } from './components/ChatWidget';
import { ThemeProvider } from './components/ThemeProvider';
import './styles/theme.css';

/**
 * Simplified widget configuration for embedding
 */
interface SimpleWidgetConfig {
  aws: {
    region: string;
    instanceId: string;
    contactFlowId: string;
    apiGatewayEndpoint: string;
  };
  ui?: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      borderRadius?: string;
    };
    position?: {
      bottom?: string;
      right?: string;
      left?: string;
    };
    messages?: {
      welcomeMessage?: string;
      offlineMessage?: string;
      waitingMessage?: string;
    };
  };
  features?: {
    fileUpload?: boolean;
    emojiPicker?: boolean;
    chatRatings?: boolean;
    chatTranscript?: boolean;
  };
}

/**
 * Widget instance interface
 */
interface WidgetInstance {
  mount(containerId?: string): void;
  unmount(): void;
  destroy(): void;
  updateConfig(config: Partial<SimpleWidgetConfig>): void;
  getState(): any;
  isDestroyed(): boolean;
}

/**
 * Error boundary for the widget
 */
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget Error:', error, errorInfo);
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
 * Default configuration
 */
const DEFAULT_CONFIG: SimpleWidgetConfig = {
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
 * Convert simple config to full widget config
 */
function convertConfig(simpleConfig: SimpleWidgetConfig): any {
  return {
    aws: simpleConfig.aws,
    ui: {
      theme: {
        primaryColor:
          simpleConfig.ui?.theme?.primaryColor ||
          DEFAULT_CONFIG.ui!.theme!.primaryColor,
        secondaryColor:
          simpleConfig.ui?.theme?.secondaryColor ||
          DEFAULT_CONFIG.ui!.theme!.secondaryColor,
        fontFamily:
          simpleConfig.ui?.theme?.fontFamily ||
          DEFAULT_CONFIG.ui!.theme!.fontFamily,
        borderRadius:
          simpleConfig.ui?.theme?.borderRadius ||
          DEFAULT_CONFIG.ui!.theme!.borderRadius,
      },
      position: {
        bottom:
          simpleConfig.ui?.position?.bottom ||
          DEFAULT_CONFIG.ui!.position!.bottom,
        right:
          simpleConfig.ui?.position?.right ||
          DEFAULT_CONFIG.ui!.position!.right,
        left: simpleConfig.ui?.position?.left,
      },
      messages: {
        welcomeMessage:
          simpleConfig.ui?.messages?.welcomeMessage ||
          DEFAULT_CONFIG.ui!.messages!.welcomeMessage,
        offlineMessage:
          simpleConfig.ui?.messages?.offlineMessage ||
          DEFAULT_CONFIG.ui!.messages!.offlineMessage,
        waitingMessage:
          simpleConfig.ui?.messages?.waitingMessage ||
          DEFAULT_CONFIG.ui!.messages!.waitingMessage,
      },
    },
    features: {
      fileUpload:
        simpleConfig.features?.fileUpload ||
        DEFAULT_CONFIG.features!.fileUpload,
      emojiPicker:
        simpleConfig.features?.emojiPicker ||
        DEFAULT_CONFIG.features!.emojiPicker,
      chatRatings:
        simpleConfig.features?.chatRatings ||
        DEFAULT_CONFIG.features!.chatRatings,
      chatTranscript:
        simpleConfig.features?.chatTranscript ||
        DEFAULT_CONFIG.features!.chatTranscript,
    },
  };
}

/**
 * Widget instance implementation
 */
class WidgetInstanceImpl implements WidgetInstance {
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private config: SimpleWidgetConfig;
  private destroyed = false;
  private eventListeners: Array<{
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
  }> = [];
  private intervals: NodeJS.Timeout[] = [];
  private timeouts: NodeJS.Timeout[] = [];
  private connectService: any = null;
  private cleanupCallbacks: Array<() => void> = [];

  constructor(config: SimpleWidgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Add cleanup on page unload
    this.addEventListener(
      window,
      'beforeunload',
      this.handlePageUnload.bind(this)
    );
    this.addEventListener(window, 'pagehide', this.handlePageUnload.bind(this));
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
      this.container.style.zIndex = '2147483647';
      this.container.style.pointerEvents = 'none';
      document.body.appendChild(this.container);
    }

    // Create React root and render
    this.root = createRoot(this.container);
    this.render();

    // Start memory leak monitoring
    this.setTimeout(() => this.checkMemoryLeaks(), 30000);

    console.log('✅ Widget mounted successfully');
  }

  unmount(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container && this.container.id === 'aws-connect-chat-widget') {
      this.container.remove();
      this.container = null;
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    console.log('🧹 Destroying widget instance...');

    // Cleanup AWS Connect resources
    this.cleanupConnectResources();

    // Cleanup React components
    this.unmount();

    // Cleanup event listeners
    this.removeAllEventListeners();

    // Cleanup timers
    this.clearAllTimers();

    // Run custom cleanup callbacks
    this.runCleanupCallbacks();

    // Mark as destroyed
    this.destroyed = true;

    console.log('✅ Widget instance destroyed');
  }

  updateConfig(config: Partial<SimpleWidgetConfig>): void {
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

  /**
   * Add event listener with automatic cleanup tracking
   */
  private addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  /**
   * Remove all tracked event listeners
   */
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    });
    this.eventListeners = [];
  }

  /**
   * Track interval for cleanup
   */
  private setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * Track timeout for cleanup
   */
  private setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeoutId = setTimeout(callback, delay);
    this.timeouts.push(timeoutId);
    return timeoutId;
  }

  /**
   * Clear all tracked timers
   */
  private clearAllTimers(): void {
    this.intervals.forEach(intervalId => {
      try {
        clearInterval(intervalId);
      } catch (error) {
        console.warn('Failed to clear interval:', error);
      }
    });
    this.intervals = [];

    this.timeouts.forEach(timeoutId => {
      try {
        clearTimeout(timeoutId);
      } catch (error) {
        console.warn('Failed to clear timeout:', error);
      }
    });
    this.timeouts = [];
  }

  /**
   * Cleanup AWS Connect resources
   */
  private cleanupConnectResources(): void {
    if (this.connectService) {
      try {
        // End any active chat sessions
        if (typeof this.connectService.endChat === 'function') {
          this.connectService.endChat().catch((error: any) => {
            console.warn('Failed to end chat session:', error);
          });
        }

        // Disconnect WebSocket connections
        if (typeof this.connectService.disconnect === 'function') {
          this.connectService.disconnect();
        }

        // Clear any service references
        this.connectService = null;
      } catch (error) {
        console.warn('Failed to cleanup Connect resources:', error);
      }
    }
  }

  /**
   * Add cleanup callback
   */
  private addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Run all cleanup callbacks
   */
  private runCleanupCallbacks(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
    this.cleanupCallbacks = [];
  }

  /**
   * Handle page unload
   */
  private handlePageUnload(): void {
    if (!this.destroyed) {
      console.log('🌐 Page unloading, cleaning up widget...');
      this.destroy();
    }
  }

  /**
   * Memory leak prevention - check for common issues
   */
  private checkMemoryLeaks(): void {
    if (this.destroyed) {
      return;
    }

    // Check for excessive event listeners
    if (this.eventListeners.length > 50) {
      console.warn(
        `⚠️ High number of event listeners (${this.eventListeners.length}). Possible memory leak.`
      );
    }

    // Check for excessive timers
    if (this.intervals.length + this.timeouts.length > 20) {
      console.warn(
        `⚠️ High number of timers (${this.intervals.length + this.timeouts.length}). Possible memory leak.`
      );
    }

    // Schedule next check
    this.setTimeout(() => this.checkMemoryLeaks(), 30000); // Check every 30 seconds
  }

  private render(): void {
    if (!this.root) return;

    const fullConfig = convertConfig(this.config);

    this.root.render(
      <React.StrictMode>
        <WidgetErrorBoundary>
          <ThemeProvider theme={fullConfig.ui.theme}>
            <ChatWidget
              config={fullConfig}
              onError={error => console.error('Widget Error:', error)}
            />
          </ThemeProvider>
        </WidgetErrorBoundary>
      </React.StrictMode>
    );
  }
}

/**
 * Initialize the chat widget
 */
export function initializeWidget(config: SimpleWidgetConfig): WidgetInstance {
  // Validate required configuration
  if (!config.aws?.instanceId || !config.aws?.contactFlowId) {
    throw new Error('AWS Connect instanceId and contactFlowId are required');
  }

  const instance = new WidgetInstanceImpl(config);

  // Auto-mount when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      instance.mount();
    });
  } else {
    instance.mount();
  }

  return instance;
}

/**
 * Global widget API
 */
declare global {
  interface Window {
    AWSConnectChatWidget?: {
      init: typeof initializeWidget;
      version: string;
    };
  }
}

// Create the widget API object
const AWSConnectChatWidget = {
  init: initializeWidget,
  version: '1.0.0',
};

// Assign to window for browser environments
if (typeof window !== 'undefined') {
  (window as any).AWSConnectChatWidget = AWSConnectChatWidget;
}

// Export for UMD - use named exports that match the object structure
export const init = initializeWidget;
export const version = '1.0.0';
export { ChatWidget, ThemeProvider };
export type { SimpleWidgetConfig as WidgetConfig };
