/**
 * Widget lifecycle management tests
 * Tests for proper cleanup, memory leak prevention, and resource disposal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM environment
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  appendChild: vi.fn(),
  remove: vi.fn(),
  style: {},
  id: '',
};

const mockDocument = {
  createElement: vi.fn(() => mockElement),
  getElementById: vi.fn(() => mockElement),
  body: mockElement,
  readyState: 'complete',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock React DOM
const mockRoot = {
  render: vi.fn(),
  unmount: vi.fn(),
};

const mockCreateRoot = vi.fn(() => mockRoot);

// Mock globals
global.document = mockDocument as any;
global.window = mockWindow as any;
global.setInterval = vi.fn((callback, delay) => {
  return setTimeout(callback, delay);
});
global.clearInterval = vi.fn();
global.setTimeout = vi.fn((callback, delay) => {
  return delay;
});
global.clearTimeout = vi.fn();

// Mock React DOM
vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock React
vi.mock('react', () => ({
  default: {},
  StrictMode: ({ children }: any) => children,
}));

// Mock components
vi.mock('./components/ChatWidget', () => ({
  ChatWidget: () => null,
}));

vi.mock('./components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: any) => children,
}));

describe('Widget Lifecycle Management', () => {
  let WidgetModule: any;
  let widgetInstance: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the widget module
    WidgetModule = await import('./widget-simple');

    // Create a widget instance
    widgetInstance = WidgetModule.initializeWidget({
      aws: {
        region: 'us-east-1',
        instanceId: 'test-instance',
        contactFlowId: 'test-flow',
        apiGatewayEndpoint: 'https://test.example.com',
      },
    });
  });

  afterEach(() => {
    if (widgetInstance && !widgetInstance.isDestroyed()) {
      widgetInstance.destroy();
    }
  });

  describe('Widget Initialization', () => {
    it('should create widget instance successfully', () => {
      expect(widgetInstance).toBeDefined();
      expect(widgetInstance.isDestroyed()).toBe(false);
    });

    it('should throw error for missing required config', () => {
      expect(() => {
        WidgetModule.initializeWidget({
          aws: {
            region: 'us-east-1',
            // Missing instanceId and contactFlowId
          },
        });
      }).toThrow('AWS Connect instanceId and contactFlowId are required');
    });

    it('should register page unload listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'pagehide',
        expect.any(Function)
      );
    });
  });

  describe('Widget Mounting', () => {
    it('should mount widget successfully', () => {
      widgetInstance.mount();

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockCreateRoot).toHaveBeenCalled();
      expect(mockRoot.render).toHaveBeenCalled();
    });

    it('should mount to specific container', () => {
      const containerId = 'custom-container';
      mockDocument.getElementById.mockReturnValue(mockElement);

      widgetInstance.mount(containerId);

      expect(mockDocument.getElementById).toHaveBeenCalledWith(containerId);
      expect(mockCreateRoot).toHaveBeenCalledWith(mockElement);
    });

    it('should throw error for non-existent container', () => {
      mockDocument.getElementById.mockReturnValue(null);

      expect(() => {
        widgetInstance.mount('non-existent');
      }).toThrow('Container element with id "non-existent" not found');
    });

    it('should prevent mounting destroyed widget', () => {
      widgetInstance.destroy();

      expect(() => {
        widgetInstance.mount();
      }).toThrow('Cannot mount destroyed widget instance');
    });
  });

  describe('Widget Cleanup', () => {
    beforeEach(() => {
      widgetInstance.mount();
    });

    it('should unmount widget properly', () => {
      widgetInstance.unmount();

      expect(mockRoot.unmount).toHaveBeenCalled();
      expect(mockElement.remove).toHaveBeenCalled();
    });

    it('should destroy widget completely', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      widgetInstance.destroy();

      expect(widgetInstance.isDestroyed()).toBe(true);
      expect(mockRoot.unmount).toHaveBeenCalled();
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '🧹 Destroying widget instance...'
      );
      expect(consoleSpy).toHaveBeenCalledWith('✅ Widget instance destroyed');

      consoleSpy.mockRestore();
    });

    it('should prevent multiple destroy calls', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      widgetInstance.destroy();
      widgetInstance.destroy(); // Second call should be ignored

      expect(consoleSpy).toHaveBeenCalledTimes(2); // Only first destroy should log

      consoleSpy.mockRestore();
    });

    it('should cleanup timers', () => {
      // Simulate some timers being created
      widgetInstance.mount();

      widgetInstance.destroy();

      expect(global.clearInterval).toHaveBeenCalled();
      expect(global.clearTimeout).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        ui: {
          theme: {
            primaryColor: '#ff0000',
          },
        },
      };

      widgetInstance.updateConfig(newConfig);

      const state = widgetInstance.getState();
      expect(state.config.ui.theme.primaryColor).toBe('#ff0000');
    });

    it('should prevent config update on destroyed widget', () => {
      widgetInstance.destroy();

      expect(() => {
        widgetInstance.updateConfig({
          ui: { theme: { primaryColor: '#ff0000' } },
        });
      }).toThrow('Cannot update config of destroyed widget instance');
    });
  });

  describe('State Management', () => {
    it('should return correct state', () => {
      widgetInstance.mount();

      const state = widgetInstance.getState();

      expect(state).toEqual({
        mounted: true,
        destroyed: false,
        config: expect.any(Object),
      });
    });

    it('should return destroyed state', () => {
      widgetInstance.destroy();

      expect(widgetInstance.isDestroyed()).toBe(true);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should track event listeners', () => {
      widgetInstance.mount();

      // Event listeners should be tracked for cleanup
      expect(mockWindow.addEventListener).toHaveBeenCalled();
    });

    it('should start memory monitoring', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      widgetInstance.mount();

      // Should schedule memory leak check
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });
  });

  describe('Error Handling', () => {
    it('should handle cleanup errors gracefully', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Mock an error during cleanup
      mockRoot.unmount.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      widgetInstance.mount();
      widgetInstance.destroy();

      // Should still mark as destroyed despite errors
      expect(widgetInstance.isDestroyed()).toBe(true);

      consoleWarnSpy.mockRestore();
    });
  });
});

describe('Global Widget API', () => {
  beforeEach(() => {
    // Reset global state
    (global as any).window = {
      AWSConnectChatWidget: undefined,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  it('should expose global API', async () => {
    await import('./widget-simple');

    expect((global as any).window.AWSConnectChatWidget).toBeDefined();
    expect((global as any).window.AWSConnectChatWidget.init).toBeInstanceOf(
      Function
    );
    expect((global as any).window.AWSConnectChatWidget.version).toBe('1.0.0');
  });
});
